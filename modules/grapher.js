// Ayasdi Inc. Copyright 2014
// Grapher.js may be freely distributed under the Apache 2.0 license

// Grapher: WebGL network graph rendering with PIXI
function Grapher () {
  this.initialize.apply(this, arguments);
  return this;
}

// Helpers
var PIXI = require('./vendor/pixi.js'),
    _ = require('jashkenas/underscore@1.6.0'),
    Color = require('./color.js'),
    pixelRes = typeof devicePixelRatio !== 'undefined' ? devicePixelRatio : 1,
    noop = function () {};

PIXI.dontSayHello = true;

// Static
var NODES = Grapher.NODES = 'nodes';
var LINKS = Grapher.LINKS = 'links';
Grapher.palettes = {}; // store palettes and textures staticly
Grapher.textures = {};
Grapher.textures[NODES] = {};
Grapher.textures[LINKS] = {};

Grapher.getPalette = function (name) { return this.palettes[name]; };

Grapher.setPalette = function (name, swatches) {
  var palette = this.palettes[name] = {};
  swatches = _.map(swatches, Color.parse);

  _.each(swatches, function (swatch, i) {
    this.getTexture(LINKS, swatch);
    this.getTexture(NODES, swatch);
    palette[i] = swatch;

    var j;
    for (j = 0; j < i; j++) { // interpolate 'in-between' link colors 50% between node colors
      var color = Color.interpolate(swatches[j], swatch, 0.5);
      this.getTexture(LINKS, color);
      palette[j + '-' + i] = color;
    }
  }.bind(this));
  return this;
};

Grapher.getTexture = function (type, color) {
  if (!this.textures[type][color]) {
    // generate the textures from Canvas
    var isNode = type === NODES,
        size = isNode ? 100 : 1,
        renderer = new PIXI.CanvasRenderer(size, size, {transparent: isNode, resolution: pixelRes}),
        stage = new PIXI.Stage(color);

    if (isNode) {
      graphics = new PIXI.Graphics();
      graphics.beginFill(color);
      graphics.drawCircle(size / 2, size / 2, size / 2);
      graphics.endFill();

      stage.addChild(graphics);
    }

    renderer.render(stage);

    this.textures[type][color] = new PIXI.Texture.fromCanvas(renderer.view);
  }
  return this.textures[type][color];
};

// Grapher instances
Grapher.prototype = {
  _lineWidth: 2,
  _foregroundColor: 0x222222,
  _backgroundColor: 0xffffff,

  initialize: function (width, height, o) {
    // Extend default options
    var options = _.extend({
      antialias: true,
      resolution: pixelRes
    }, o);

    // Renderer and view
    this.renderer = PIXI.autoDetectRenderer(width, height, options);
    this.view = this.renderer.view;

    // Stage and containers
    this.stage = new PIXI.Stage(this.backgroundColor());
    this.network = new PIXI.DisplayObjectContainer();
    this.stage.addChild(this.network);

    // SpriteBatch containers
    this.batches = {};
    this.batches[NODES] = {};
    this.batches[LINKS] = {};

    // Sprite array
    this[LINKS] = [];
    this[NODES] = [];

    // indices that will update
    this.willUpdate = {};
    this.updateAll = {};
    this._clearUpdateQueue();

    // Listeners
    this.listeners = {};

    // Set initial transform
    this.center();

    // Bind some updaters
    this._updateLink = this._updateLink.bind(this);
    this._updateNode = this._updateNode.bind(this);
    this.animate = this.animate.bind(this);

    // Interactions
    this.stage.interactive = true;
    this.stage.mousedown = this._onEvent('mousedown');
    this.stage.mousemove = this._onEvent('mousemove');
    this.stage.mouseup = this._onEvent('mouseup');
  },

  // ex. grapher.on('mousedown', function () {...});
  on: function (event, fn) {
    if (_.isFunction(fn)) this.listeners[event] = fn;
    return this;
  },

  off: function (event) {
    if (event in this.listeners) this.listeners[event] = noop;
    return this;
  },

  palette: function (name) {
    if (_.isUndefined(name)) return this._palette;

    this._palette = Grapher.getPalette(name);
    return this;
  },

  // Accepts network data in the form:
  // {
  //   nodes: [{x: 0, y: 0, r: 20, color: (swatch or hex/rgb)}, ... ].
  //   links: [{from: 0, to: 1, color: (swatch or hex/rgb)}, ... ]
  // }
  data: function (data) {
    if (_.isUndefined(data)) return this._data;

    this._data = data;
    this.exit();
    this.enter();
    this.update();
    return this;
  },

  enter: function () {
    var data = this.data(),
        entering = [];

    if (this[LINKS].length < data[LINKS].length)
        entering = entering.concat(data[LINKS].slice(this[LINKS].length, data[LINKS].length - this[LINKS].length));
    if (this[NODES].length < data[NODES].length)
        entering = entering.concat(data[NODES].slice(this[NODES].length, data[NODES].length - this[NODES].length));

    _.each(entering, this._enter.bind(this));
    return this;
  },

  exit: function () {
    var data = this.data(),
        exiting = [];

    if (data[LINKS].length < this[LINKS].length)
        exiting = exiting.concat(this[LINKS].splice(data[LINKS].length, this[LINKS].length - data[LINKS].length));
    if (data[NODES].length < this[NODES].length)
        exiting = exiting.concat(this[NODES].splice(data[NODES].length, this[NODES].length - data[NODES].length));

    _.each(exiting, this._exit.bind(this));
    return this;
  },

  // ex.  grapher.update(); // updates all nodes and links
  //      grapher.update('links'); // updates only links
  //      grapher.update('nodes', 0, 4); // updates nodes indices 0 to 3 (4 is not inclusive)
  //      grapher.update('links', [0, 1, 2, 6, 32]); // updates links indexed by the indices
  update: function (type, start, end) {
    var indices;
    if (_.isArray(start)) indices = start;
    else if (_.isNumber(start) && _.isNumber(end)) indices = _.range(start, end);

    if (_.isArray(indices)) {
      this._addToUpdateQueue(type, indices);
      if (type === NODES) this._addToUpdateQueue(LINKS, this._findLinks(indices));
    } else {
      this.updateAll[LINKS] = this.updateAll[LINKS] || type !== NODES;
      this.updateAll[NODES] = this.updateAll[NODES] || type !== LINKS;
    }
    return this;
  },

  // Update an individual node by index.
  updateNode: function (index, willUpdateLinks) {
    this._addToUpdateQueue(NODES, [index]);
    if (willUpdateLinks) this._addToUpdateQueue(LINKS, this._findLinks([index]));
    return this;
  },

  // Update an individual link by index.
  updateLink: function (index) {
    this._addToUpdateQueue(LINKS, [index]);
    return this;
  },

  render: function () {
    this._update();
    this.renderer.render(this.stage);
    return this;
  },

  animate: function (time) {
    this.render();
    this._frame = requestAnimationFrame(this.animate);
  },

  play: function () {
    requestAnimationFrame(this.animate);
    return this;
  },

  pause: function () {
    if (this._frame) cancelAnimationFrame(this._frame);
    return this;
  },

  resize: function (width, height) {
    this.renderer.resize(width, height);
    return this;
  },

  center: function () {
    var x = y = 0,
        scale = 1,
        nodes = this.data() ? this.data()[NODES] : null,
        numNodes = nodes ? nodes.length : 0;

    if (numNodes) { // get initial transform
      var minX = Infinity, maxX = -Infinity,
          minY = Infinity, maxY = -Infinity,
          width = this.renderer.width / this.renderer.resolution,
          height = this.renderer.height / this.renderer.resolution,
          pad = 1.1,
          i;

      for (i = 0; i < numNodes; i++) {
        if (nodes[i].x < minX) minX = nodes[i].x;
        if (nodes[i].x > maxX) maxX = nodes[i].x;
        if (nodes[i].y < minY) minY = nodes[i].y;
        if (nodes[i].y > maxY) maxY = nodes[i].y;
      }
      
      var dX = maxX - minX,
          dY = maxY - minY;

      scale = Math.min(width / dX, height / dY, 2) / pad;
      x = (width - dX * scale) / 2 - minX * scale;
      y = (height - dY * scale) / 2 - minY * scale;
    }

    return this.transform({scale: scale, translate: [x, y]});
  },

  transform: function (transform) {
    if (_.isUndefined(transform)) return this._transform;

    this._transform = _.extend(this._transform ? this._transform : {}, transform);
    this.updateTransform = true;
    return this;
  },

  backgroundColor: function (color) {
    if (_.isUndefined(color)) return this._backgroundColor;

    this._backgroundColor = Color.parse(color);
    this.stage.setBackgroundColor(this._backgroundColor);
    return this;
  },

  foregroundColor: function (color) {
    if (_.isUndefined(color)) return this._foregroundColor;
    
    this._foregroundColor = Color.parse(color);
    return this;
  },

  lineWidth: function (size) {
    if (_.isUndefined(size)) return this._lineWidth;
    
    this._lineWidth = size;
    return this;
  },

  getNodeIdAt: function (x, y) {
    var node = -1;

    this[NODES].every(function (n, i) { // we'll want to look for ways to optimize this
      var inX = x <= n.position.x + n.width && x >= n.position.x,
          inY = y <= n.position.y + n.height && y >= n.position.y,
          found = inX && inY;
      if (found) node = i;
      return !found;
    });

    return node;
  },

  _exit: function (sprite) { return sprite.parent.removeChild(sprite); },
  _enter: function (data) {
    var type = _.isUndefined(data.from) ? NODES : LINKS,
        sprite = new PIXI.Sprite(Grapher.getTexture(type, this.foregroundColor()));
    this[type].push(sprite);
  },

  _addToUpdateQueue: function (type, indices) {
    var insertIntoQueue = function (i) {
          var atIndex = _.sortedIndex(this.willUpdate[type], i);
          if (this.willUpdate[type][atIndex] !== i)
            this.willUpdate[type].splice(atIndex, 0, i);
        }.bind(this);

    if (!this.updateAll[type] && _.isArray(indices)) _.each(indices, insertIntoQueue);
    this.updateAll[type] = this.updateAll[type] || this.willUpdate[type].length >= this[type].length;
  },

  _clearUpdateQueue: function () {
    this.willUpdate[LINKS] = [];
    this.willUpdate[NODES] = [];
    this.updateAll[LINKS] = false;
    this.updateAll[NODES] = false;
    this.updateTransform = false;
  },

  _update: function () {
    var updatingLinks = this.willUpdate[LINKS],
        updatingNodes = this.willUpdate[NODES],
        i;

    if (this.updateAll[LINKS]) _.each(this[LINKS], this._updateLink);
    else if (updatingLinks && updatingLinks.length) {
      while (updatingLinks.length) {
        i = updatingLinks.shift();
        this._updateLinkByIndex(i);
      }
    }

    if (this.updateAll[NODES]) _.each(this[NODES], this._updateNode);
    else if (updatingNodes && updatingNodes.length) {
      while (updatingNodes.length) {
        i = updatingNodes.shift();
        this._updateNodeByIndex(i);
      }
    }

    if (this.updateTransform) {
      var transform = this.transform();
      this.network.scale.set(transform.scale);
      this.network.position.set.apply(this.network, transform.translate);
    }

    this._clearUpdateQueue();
  },

  _updateLink: function (link, i) {
    var data = this.data(),
        lw = this.lineWidth(),
        l = data[LINKS][i],
        from = data[NODES][l.from],
        to = data[NODES][l.to],
        leftMost = from.x <= to.x ? from : to;

    link.width = Math.sqrt(Math.pow(to.x - from.x, 2) + Math.pow(to.y - from.y, 2));
    link.height = lw;
    link.position.set(leftMost.x, leftMost.y - lw / 2);
    link.pivot.set(0, lw / 2);
    link.rotation = Math.atan((to.y - from.y) / (to.x - from.x));

    var color = !_.isUndefined(l.color) ? this._findColor(l.color) :
        Color.interpolate(this._findColor(from.color), this._findColor(to.color));

    this._setColor(LINKS, link, color);
  },

  _updateNode: function (node, i) {
    var n = this.data()[NODES][i];
    node.width = n.r * 2;
    node.height = n.r * 2;
    node.position.set(n.x - n.r, n.y - n.r);

    this._setColor(NODES, node, this._findColor(n.color));
  },

  _updateNodeByIndex: function (i) { this._updateNode(this[NODES][i], i); },

  _updateLinkByIndex: function (i) { this._updateLink(this[LINKS][i], i); },

  _findLinks: function (indices) {
    var isLinked = function (indices, l) {
          var i, len = indices.length, flag = false;
          for (i = 0; i < len; i++) {
            if (l.to == indices[i] || l.from == indices[i]) { // loose equivalience is sufficient
              flag = true;
              break;
            }
          }
          return flag;
        },
        links = this.data()[LINKS],
        i, numLinks = links.length,
        updatingLinks = [];

    for (i = 0; i < numLinks; i++) {
      if (isLinked(indices, links[i])) updatingLinks.push(i);
    }

    return updatingLinks;
  },

  _findColor: function (c) {
    var color = NaN,
        palette = this.palette();

    if (palette && palette[c]) color = palette[c];
    else color = Color.parse(c);

    // if color is still not set, use the default
    if (_.isNaN(color)) color = this.foregroundColor();
    return color;
  },

  _setColor: function (type, sprite, color) {
    var texture = Grapher.getTexture(type, color);

    sprite.setTexture(texture);
    if (sprite.parent) this._exit(sprite);
    this._getBatch(type, color).addChild(sprite);
  },

  _getBatch: function (type, color) {
    if (!this.batches[type][color]) {
      var batch = new PIXI.SpriteBatch();
      if (type === LINKS) this.network.addChildAt(batch, 0);
      else this.network.addChild(batch);
      this.batches[type][color] = batch;
    }
    return this.batches[type][color];
  },

  _onEvent: function (event) {
    return function (e) {
      var callback = this.listeners[event] ? this.listeners[event] : noop;
      e.offset = e.getLocalPosition(this.stage);
      callback(e);
    }.bind(this);
  }
};

if (module && module.exports) module.exports = Grapher; // export with module
