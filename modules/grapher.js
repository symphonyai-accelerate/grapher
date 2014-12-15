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

    // Listeners
    this.listeners = {};
    this.listeners[NODES] = {};
    this.listeners[LINKS] = {};

    // Set initial transform
    this.transform({scale: 1, translate: [0, 0]});
  },

  // ex. grapher.on('mouseover', function () {...});
  on: function (type, event, fn) {
    if (_.isFunction(fn) && type in this.listeners)
      this.listeners[type][event] = fn;
    return this;
  },

  off: function (type, event) {
    if (type in this.listeners && event in this.listeners[type])
      this.listeners[type][event] = noop;
    return this;
  },

  palette: function (name) {
    if (_.isUndefined(name)) return this._palette;

    this._palette = Grapher.getPalette(name);
    return this;
  },

  // Accepts network data in the form:
  // var data = {
  //   nodes: [
  //     {x: 0, y: 0, r: 20},
  //     {x: 1, y: 1, r: 15},
  //     {x: 1, y: 2, r: 25}
  //   ],
  //   links: [
  //     {from: 0, to: 1},
  //     {from: 1, to: 2s}
  //   ]
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
  update: function (type, indices, end) {
    if (indices && end) indices = _.range(indices, end);
    if (_.isArray(indices)) {
      _.each(indices, this._update(type, true));
      if (type === NODES) _.each(this._findLinks(indices), this._update(LINKS));
    } else {
      if (type !== NODES) _.each(this[LINKS], this._update(LINKS));
      if (type !== LINKS) _.each(this[NODES], this._update(NODES));
    }
    return this;
  },

  render: function () {
    this.renderer.render(this.stage);
    return this;
  },

  animate: function (time) {
    if (!this.lastTime) this.lastTime = time;

    this.update();
    this.render();

    this.lastTime = time;
    this._frame = requestAnimationFrame(this.animate);
  },

  play: function () {
    requestAnimationFrame(this.animate.bind(this));
    return this;
  },

  pause: function () {
    if (this._frame) cancelAnimationFrame(this._frame);
    return this;
  },

  transform: function (transform) {
    if (_.isUndefined(transform)) return this._transform;

    this._transform = _.extend(this._transform ? this._transform : {}, transform);
    this.network.scale.set(this._transform.scale);
    this.network.position.set.apply(this.network, this._transform.translate);
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

  _exit: function (sprite) { return sprite.parent.removeChild(sprite); },
  _enter: function (data) {
    var type = _.isUndefined(data.from) ? NODES : LINKS,
        sprite = new PIXI.Sprite(Grapher.getTexture(type, this.foregroundColor()));

    if (type === NODES) {
      sprite.interactive = true;
      sprite.mouseover = this._onEvent(NODES, 'mouseover');
      sprite.mouseout = this._onEvent(NODES, 'mouseout');
      sprite.mousedown = this._onEvent(NODES, 'mousedown');
    }
    this[type].push(sprite);
  },

  _update: function (type, useIndex) {
    var fn = type === LINKS ? '_updateLink' : '_updateNode';
    if (useIndex) fn += 'ByIndex';
    return this[fn].bind(this);
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
    var links = this.data()[LINKS];
    indices = _.map(indices, Number);

    var sprites = _.filter(this[LINKS], function (l, i) {
      var link = links[i];
      return _.indexOf(indices, link.from) > -1 || _.indexOf(indices, link.to) > -1;
    });
    return sprites;
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
    var texture = Grapher.getTexture(type, color),
        batch = this._getBatch(type, color);

    sprite.setTexture(texture);
    if (sprite.parent) this._exit(sprite);
    batch.addChild(sprite);
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

  _onEvent: function (type, event) {
    var callback = this.listeners[type][event] ? this.listeners[type][event] : noop;
    return function (interaction) {
      var sprite = interaction.target;
      var i = sprite.parent.getChildIndex(sprite);
      callback(sprite, i, interaction);
    }.bind(this);
  }
};

if (module && module.exports) module.exports = Grapher; // export with module
