// Grapher: WebGL network graph rendering with PIXI
function Grapher () {
  this.initialize.call(this, arguments);
  return this;
}

// Helpers
var Promise = typeof Promise === 'undefined' ? require('./vendor/promise.js').Promise : Promise,
    PIXI = require('./vendor/pixi.js'),
    _ = require('jashkenas/underscore@1.6.0'),
    pixelRes = typeof devicePixelRatio !== 'undefined' ? devicePixelRatio : 1,
    noop = function () {};

// Static
Grapher.palettes = {}; // store palettes and textures statically
Grapher.textures = {link: {}, node: {}};

Grapher.getPalette = function (name) { return this.palettes[name]; };

Grapher.setPalette = function (name, swatches) {
  this.palettes[name] = swatches;
  _.each(swatches, function (swatch, i) {
    this.getTexture('link', swatch);
    this.getTexture('node', swatch);

    var j;
    for (j = 0; j < i; j++) this.getTexture('link', (swatches[j] + swatch) / 2);
  }.bind(this));
  return this;
};

Grapher.getTexture = function (type, color) {
  if (!this.textures[type][color]) {
    // generate the textures from Canvas
    var node = type === 'node',
        size = node ? 100 : 1,
        renderer = new PIXI.CanvasRenderer(size, size, {transparent: node, resolution: pixelRes}),
        stage = new PIXI.Stage(color);

    document.body.appendChild(renderer.view);

    if (node) {
      graphics = new PIXI.Graphics();
      graphics.beginFill(color);
      graphics.drawCircle(size / 2, size / 2, size / 2);
      graphics.endFill();

      stage.addChild(graphics);
    }

    renderer.render(stage);

    this.textures[type][color] = new PIXI.Texture.fromCanvas(renderer.view);
    document.body.removeChild(renderer.view);
  }
  return this.textures[type][color];
};

// Grapher instances
Grapher.prototype = {
  LINE_SIZE: 2,
  DEFAULT_COLOR: 0xFFFFFF,
  STAGE_COLOR: 0x222222,

  initialize: function (width, height, o) {
    // Extend default options
    var options = _.extend({
      transparent: true,
      antialias: true,
      resolution: pixelRes
    }, o);

    // Renderer and view
    this.renderer = PIXI.autoDetectRenderer(width, height, options);
    this.view = this.renderer.view;

    // Stage and containers
    this.stage = new PIXI.Stage(this.STAGE_COLOR);
    this.network = new PIXI.DisplayObjectContainer();
      // SpriteBatch containers
    this.batches = {link: {}, node: {}};

    // Sprite array
    this.links = [];
    this.nodes = [];

    // Listeners
    this.listeners = {
      'mouseover node': noop,
      'mouseout node': noop,
      'mousedown node': noop
    };
  },

  // ex.  grapher.on('mouseover node', function () {...});
  on: function (event, fn) {
    if (this.listeners[event] && typeof fn === 'function') this.listeners[event] = fn;
    return this;
  },

  off: function (event) {
    if (this.listeners[event]) this.listeners[event] = noop;
    return this;
  },

  data: function (data) {
    if (data !== undefined) {
      this._data = data;
      this.exit();
      this.enter();
      this.update();
      return this;
    }
    return this._data;
  },

  enter: function () {
    var data = this._data,
        entering = [];

    if (this.links.length < data.links.length)
        entering = entering.concat(data.links.slice(this.links.length, data.links.length - this.links.length));
    if (this.nodes.length < data.nodes.length)
        entering = entering.concat(data.nodes.slice(this.nodes.length, data.nodes.length - this.nodes.length));

    _.each(entering, this._enter.bind(this));

    return this;
  },

  exit: function () {
    var data = this._data,
        exiting = [];

    if (data.links.length < this.links.length)
       exiting = exiting.concat(this.links.splice(data.links.length, this.links.length - data.links.length));
    if (data.nodes.length < this.nodes.length)
        exiting = exiting.concat(this.nodes.splice(data.nodes.length, this.nodes.length - data.nodes.length));

    _.each(exiting, this._exit.bind(this));

    return this;
  },

  // ex.  grapher.update(); // updates all nodes and links
  //      grapher.update('links'); // updates only links
  //      grapher.update('nodes', 0, 4); // updates nodes indices 0 to 3 (4 is not inclusive)
  //      grapher.update('links', [0, 1, 2, 6, 32]); // updates links indexed by the indices
  update: function (entityType, indices, end) {
    var data = this._data;

    if (entityType !== 'nodes') _.each(this.links, this._updateLink.bind(this));
    if (entityType !== 'links') _.each(this.nodes, this._updateNode.bind(this));

    return this;
  },

  render: function () {
    Grapher.load().then(this._render.bind(this));
    return this;
  },

  animate: function (time) {
    if (!this.lastTime) this.lastTime = time;

    this.update();
    this.render();

    this.lastTime = time;
    this.frame = requestAnimationFrame(this.animate);
  },

  play: function () {
    requestAnimationFrame(this.animate.bind(this));
    return this;
  },

  pause: function () {
    if (this.frame) cancelAnimationFrame(this.frame);
    return this;
  },

  transform: function (transform) {
    if (transform !== undefined) {
      this.transform = transform;
      this.network.scale.x = transform.scale;
      this.network.scale.y = transform.scale;
      this.network.position.x = transform.translate[0];
      this.network.position.y = transform.translate[1];
      return this;
    }
    return this;
  },

  setPalette: function (paletteName) {
    if (paletteName === undefined) this.palette = undefined;
    else this.palette = Grapher.getPalette(paletteName);
    return this;
  },

  _render: function () { this.renderer.render(this.stage); },

  _exit: function (sprite) { return sprite.parent.removeChild(sprite); },
  _enter: function (data) {
    var type = data.source ? 'link' : 'node',
        sprite = new PIXI.Sprite(texture),
        texture = Grapher.getTexture(type, this.DEFAULT_COLOR);

    if (type === 'link') this.links.push(sprite);
    else {
      sprite.interactive = true;
      sprite.mouseover = this._onMouseOverNode.bind(this);
      sprite.mouseout = this._onMouseOutNode.bind(this);
      sprite.mousedown = this._onMouseDownNode.bind(this);
      this.nodes.push(sprite);
    }

    this._setColor(type, sprite);
  },

  _updateLink: function (link, i) {
    var l = this._data.links[i],
        width = Math.sqrt(Math.pow(l.target.x - l.source.x, 2) + Math.pow(l.target.y - l.source.y, 2)),
        radians = Math.atan((l.target.y - l.source.y) / (l.target.x - l.source.x)),
        leftMost = l.source.x <= l.target.x ? l.source : l.target;

    link.position.x = leftMost.x;
    link.position.y = leftMost.y;
    link.rotation = radians;
    link.pivot.x = 0;
    link.pivot.y = this.LINE_SIZE / 2;
    link.height = this.LINE_SIZE;
    link.width = width;

    var color = l.color ? this.palette ? this.palette[l.color] : l.color : this.DEFAULT_COLOR;
    this._setColor('link', link, color);
  },

  _updateNode: function (node, i, scale) {
    var n = this._data.nodes[i];
    if (!scale) scale = 1;

    node.width = n.radius * (2 * scale);
    node.height = n.radius * (2 * scale);
    node.position.x = n.x - (n.radius * scale);
    node.position.y = n.y - (n.radius * scale);

    var color = n.color ? this.palette ? this.palette[n.color] : n.color : this.DEFAULT_COLOR;
    this._setColor('node', node, color);
  },

  _setColor: function (type, sprite, color) {
    if (!color) color = this.DEFAULT_COLOR;
    var texture = Grapher.getTexture(type, color),
        batch = this._getBatch(type, color);

    sprite.setTexture(texture);
    if (sprite.parent) this._exit(sprite);
    batch.addChild(sprite);
  },

  _getBatch: function (type, color) {
    if (!this.batches[type][color]) {
      var batch = new PIXI.SpriteBatch();
      if (type === 'link') this.stage.addChildAt(batch, 0);
      else this.stage.addChild(batch);

      this.batches[type][color] = batch;
    }
    return this.batches[type][color];
  },

  _onMouseOverNode: function (node) {
    var i = this.nodes.getChildIndex(node.target);
    this.listeners['mouseover node'](node, i);
  },

  _onMouseOutNode: function (node) {
    var i = this.nodes.getChildIndex(node.target);
    this.listeners['mouseout node'](node, i);
  },

  _onMouseDownNode: function (node) {
    var i = this.nodes.getChildIndex(node.target);
    this.listeners['mousedown node'](node, i);
  }
};

if (typeof Ayasdi === 'undefined') Ayasdi = {}; // setup namespace if it doesn't exist
Ayasdi.Grapher = Grapher; // create a global reference

if (module && module.exports) module.exports = Grapher; // export with module
