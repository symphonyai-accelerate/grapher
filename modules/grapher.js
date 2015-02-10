// Ayasdi Inc. Copyright 2014
// Grapher.js may be freely distributed under the Apache 2.0 license

;(function () {
/**
  * Dependencies
  * ==============
  * Grapher uses PIXI.js as a dependency and uses Color and Utilities found in
  * modules.
  */
  var PIXI = require('./vendor/pixi.js'),
      Color = require('./color.js'),
      u = require('./utilities.js');

  // We suppress PIXI's initial console log.
  PIXI.dontSayHello = true;

/**
  * Grapher
  * =======
  * WebGL network grapher rendering with PIXI
  */
  function Grapher () {
    this.initialize.apply(this, arguments);
    return this;
  }

  if (module && module.exports) module.exports = Grapher;
  Grapher.prototype = {};

  /**
    * grapher.initialize
    * ------------------
    * 
    * Initialize is called when a grapher instance is created:
    *     
    *     var grapher = new Grapher(width, height, options);
    *
    */
  Grapher.prototype.initialize = function (width, height, o) {
    // Extend default properties with options
    this.props = u.extend({
      lineWidth: 2,
      foregroundColor: 0x222222,
      backgroundColor: 0xffffff,
      antialias: true,
      resolution: typeof devicePixelRatio !== 'undefined' ? Math.max(devicePixelRatio, 1) : 1
    }, o);

    // Renderer and view
    this.renderer = PIXI.autoDetectRenderer(width, height, this.props);
    this.view = this.renderer.view;

    // Stage and containers
    this.stage = new PIXI.Stage(this.backgroundColor());
    this.network = new PIXI.DisplayObjectContainer();
    this.stage.addChild(this.network);

    // SpriteBatch containers
    this.batches = {};
    this.batches.nodes = {};
    this.batches.links = {};

    // Sprite array
    this.links = [];
    this.nodes = [];

    // indices that will update
    this.willUpdate = {};
    this.updateAll = {};
    this._clearUpdateQueue();

    // Set initial transform
    this.center();
    this.hasModifiedTransform = false;

    // Bind some updaters
    this._updateLink = u.bind(this._updateLink, this);
    this._updateNode = u.bind(this._updateNode, this);
    this._updateLinkByIndex = u.bind(this._updateLinkByIndex, this);
    this._updateNodeByIndex = u.bind(this._updateNodeByIndex, this);
    this.animate = u.bind(this.animate, this);

    // Listeners
    this.listeners = {};

    // Interactions
    this.stage.interactive = true;
    this.stage.mousedown = this._onEvent('mousedown');
    this.stage.mousemove = this._onEvent('mousemove');
    this.stage.mouseup = this._onEvent('mouseup');

    // Do any additional setup
    u.eachKey(o, this.set, this);
  };

  /**
    * grapher.set
    * ------------------
    * 
    * General setter for a grapher's properties.
    *
    *     grapher.set(1, 'scale');
    */
  Grapher.prototype.set = function (val, key) {
    var setter = this[key];
    if (setter && u.isFunction(setter))
      return setter.call(this, val);
  };

  /**
    * grapher.on
    * ------------------
    * 
    * Add a listener to a grapher event. Only one listener can be bound to an
    * event at this time. Available events:
    *
    *   * mousedown
    *   * mouseover
    *   * mouseup
    */
  Grapher.prototype.on = function (event, fn) {
    if (u.isFunction(fn)) this.listeners[event] = fn;
    return this;
  };

  /**
    * grapher.off
    * ------------------
    * 
    * Remove a listener from an event.
    */
  Grapher.prototype.off = function (event) {
    if (event in this.listeners) this.listeners[event] = u.noop;
    return this;
  };

  /**
    * grapher.palette
    * ------------------
    * 
    * Set a grapher to use a pre-defined palette. Palettes can be pre-defined
    * with the static function Grapher.setPalette.
    */
  Grapher.prototype.palette = function (name) {
    if (u.isUndefined(name)) return this.props.palette;

    this.props.palette = Grapher.getPalette(name);
    this.update();
    return this;
  };

  /**
    * grapher.data
    * ------------------
    * 
    * Accepts network data in the form:
    *
    *     {
    *       nodes: [{x: 0, y: 0, r: 20, color: (swatch or hex/rgb)}, ... ],
    *       links: [{from: 0, to: 1, color: (swatch or hex/rgb)}, ... ]
    *     }
    */
  Grapher.prototype.data = function (data) {
    if (u.isUndefined(data)) return this.props.data;

    this.props.data = data;
    this.exit();
    this.enter();
    this.update();

    if (!this.hasModifiedTransform) this.center();
    return this;
  };

  /**
    * grapher.enter
    * ------------------
    * 
    * Creates node and link sprites to match the number of nodes and links in the
    * data.
    */
  Grapher.prototype.enter = function () {
    var data = this.data(),
        entering = [];

    if (this.links.length < data.links.length)
        entering = entering.concat(data.links.slice(this.links.length, data.links.length - this.links.length));
    if (this.nodes.length < data.nodes.length)
        entering = entering.concat(data.nodes.slice(this.nodes.length, data.nodes.length - this.nodes.length));

    u.each(entering, this._enter, this);
    return this;
  };

  /**
    * grapher.exit
    * ------------------
    * 
    * Removes node and link sprites to match the number of nodes and links in the
    * data.
    */
  Grapher.prototype.exit = function () {
    var data = this.data(),
        exiting = [];

    if (data.links.length < this.links.length)
        exiting = exiting.concat(this.links.splice(data.links.length, this.links.length - data.links.length));
    if (data.nodes.length < this.nodes.length)
        exiting = exiting.concat(this.nodes.splice(data.nodes.length, this.nodes.length - data.nodes.length));

    u.each(exiting, this._exit);
    return this;
  };

  /**
    * grapher.update
    * ------------------
    * 
    * Add nodes and/or links to the update queue by index. Passing in no arguments will 
    * add all nodes and links to the update queue. Node and link sprites in the update
    * queue are updated at the time of rendering.
    *
    *     grapher.update(); // updates all nodes and links
    *     grapher.update('links'); // updates only links
    *     grapher.update('nodes', 0, 4); // updates nodes indices 0 to 3 (4 is not inclusive)
    *     grapher.update('links', [0, 1, 2, 6, 32]); // updates links indexed by the indices
    */
  Grapher.prototype.update = function (type, start, end) {
    var indices;
    if (u.isArray(start)) indices = start;
    else if (u.isNumber(start) && u.isNumber(end)) indices = u.range(start, end);

    if (u.isArray(indices)) {
      this._addToUpdateQueue(type, indices);
      if (type === NODES) this._addToUpdateQueue(LINKS, this._findLinks(indices));
    } else {
      if (type !== NODES) this.updateAll.links = true;
      if (type !== LINKS) this.updateAll.nodes = true;
    }
    return this;
  };

  /**
    * grapher.updateNode
    * ------------------
    * 
    * Add an individual node to the update queue. Optionally pass in a boolean to
    * specify whether or not to also add links connected with the node to the update queue.
    */
  Grapher.prototype.updateNode = function (index, willUpdateLinks) {
    this._addToUpdateQueue(NODES, [index]);
    if (willUpdateLinks) this._addToUpdateQueue(LINKS, this._findLinks([index]));
    return this;
  };

  /**
    * grapher.updateLink
    * ------------------
    * 
    * Add an individual link to the update queue.
    */
  Grapher.prototype.updateLink = function (index) {
    this._addToUpdateQueue(LINKS, [index]);
    return this;
  };

  /**
    * grapher.render
    * ------------------
    * 
    * Updates each sprite and renders the network.
    */
  Grapher.prototype.render = function () {
    this._update();
    this.renderer.render(this.stage);
    return this;
  };

  /**
    * grapher.animate
    * ------------------
    * 
    * Calls render in a requestAnimationFrame loop.
    */
  Grapher.prototype.animate = function (time) {
    this.render();
    this.currentFrame = requestAnimationFrame(this.animate);
  };

  /**
    * grapher.play
    * ------------------
    * 
    * Starts the animate loop.
    */
  Grapher.prototype.play = function () {
    this.currentFrame = requestAnimationFrame(this.animate);
    return this;
  };

  /**
    * grapher.pause
    * ------------------
    * 
    * Stops the animate loop.
    */
  Grapher.prototype.pause = function () {
    if (this.currentFrame) {
      cancelAnimationFrame(this.currentFrame);
      this.currentFrame = undefined;
    }
    return this;
  };

  /**
    * grapher.resize
    * ------------------
    * 
    * Resize the grapher view.
    */
  Grapher.prototype.resize = function (width, height) {
    this.renderer.resize(width, height);
    return this;
  };

  /**
    * grapher.center
    * ------------------
    * 
    * Center the network in the view. This function modifies the scale and translate.
    */
  Grapher.prototype.center = function () {
    var x = y = 0,
        scale = 1,
        nodes = this.data() ? this.data().nodes : null,
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

    return this.scale(scale).translate([x, y]);
  };

  /**
    * grapher.transform
    * ------------------
    * 
    * Set the scale and translate as an object.
    * If no arguments are passed in, returns the current transform object.
    */
  Grapher.prototype.transform = function (transform) {
    if (u.isUndefined(transform))
      return {scale: this.props.scale, translate: this.props.translate};

    this.scale(transform.scale);
    this.translate(transform.translate);
    return this;
  };

  /**
    * grapher.scale
    * ------------------
    * 
    * Set the scale.
    * If no arguments are passed in, returns the current scale.
    */
  Grapher.prototype.scale = function (scale) {
    if (u.isUndefined(scale)) return this.props.scale;
    if (u.isNumber(scale)) this.props.scale = scale;
    this.updateTransform = true;
    this.hasModifiedTransform = true;
    return this;
  };

  /**
    * grapher.translate
    * ------------------
    * 
    * Set the translate.
    * If no arguments are passed in, returns the current translate.
    */
  Grapher.prototype.translate = function (translate) {
    if (u.isUndefined(translate)) return this.props.translate;
    if (u.isArray(translate)) this.props.translate = translate;
    this.updateTransform = true;
    this.hasModifiedTransform = true;
    return this;
  };

  /**
    * grapher.backgroundColor
    * ------------------
    * 
    * Set the backgroundColor. This is the color of the background.
    * If no arguments are passed in, returns the current backgroundColor.
    */
  Grapher.prototype.backgroundColor = function (color) {
    if (u.isUndefined(color)) return this.props.backgroundColor;
    this.props.backgroundColor = Color.parse(color);
    this.stage.setBackgroundColor(this.props.backgroundColor);
    return this;
  };

  /**
    * grapher.foregroundColor
    * ------------------
    * 
    * Set the foregroundColor. This is the default color of nodes and links.
    * If no arguments are passed in, returns the current foregroundColor.
    */
  Grapher.prototype.foregroundColor = function (color) {
    if (u.isUndefined(color)) return this.props.foregroundColor;
    this.props.foregroundColor = Color.parse(color);
    return this;
  };

  /**
    * grapher.lineWidth
    * ------------------
    * 
    * Set the lineWidth. This is the line width of the links.
    * If no arguments are passed in, returns the current lineWidth.
    */
  Grapher.prototype.lineWidth = function (size) {
    if (u.isUndefined(size)) return this.props.lineWidth;
    this.props.lineWidth = size;
    return this;
  };

  /**
    * grapher.getNodeIdAt
    * -------------------
    * 
    * Search for a node index at a certain point.
    *
    *     var point = {x: 10, y: 10};
    *     var foundNode = grapher.getNodeIdAt(point);
    *
    * Returns -1 if no node is found.
    */
  Grapher.prototype.getNodeIdAt = function (point) {
    var node = -1,
        x = point.x, y = point.y;

    this.nodes.every(function (n, i) { // we'll want to look for ways to optimize this
      var inX = x <= n.position.x + n.width && x >= n.position.x,
          inY = y <= n.position.y + n.height && y >= n.position.y,
          found = inX && inY;
      if (found) node = i;
      return !found;
    });

    return node;
  };

/**
  * Private Functions
  * =================
  * 
  */

  /**
    * grapher._exit
    * -------------------
    * 
    * Remove a sprite from it's parent.
    *
    */
  Grapher.prototype._exit = function (sprite) { return sprite.parent.removeChild(sprite); };

  /**
    * grapher._enter
    * -------------------
    * 
    * Create a new sprite from the node or link data provided.
    *
    */
  Grapher.prototype._enter = function (data) {
    var type = u.isUndefined(data.from) ? NODES : LINKS,
        spriteSet = type === NODES ? this.nodes : this.links;
        sprite = new PIXI.Sprite(Grapher.getTexture(type, this.foregroundColor()));
    spriteSet.push(sprite);
  };

  /**
    * grapher._addToUpdateQueue
    * -------------------
    * 
    * Add indices to the nodes or links update queue.
    *
    */
  Grapher.prototype._addToUpdateQueue = function (type, indices) {
    var willUpdate = type === NODES ? this.willUpdate.nodes : this.willUpdate.links,
        updateAll = type === NODES ? this.updateAll.nodes : this.updateAll.links,
        spriteSet = type === NODES ? this.nodes : this.links;

    var insert = function (n) { u.uniqueInsert(willUpdate, n); };
    if (!updateAll && u.isArray(indices)) u.each(indices, insert, this);

    updateAll = updateAll || willUpdate.length >= spriteSet.length;

    if (type === NODES) this.updateAll.nodes = updateAll;
    else this.updateAll.links = updateAll;
  };

  /**
    * grapher._clearUpdateQueue
    * -------------------
    * 
    * Clear the update queue.
    *
    */
  Grapher.prototype._clearUpdateQueue = function () {
    this.willUpdate.links = [];
    this.willUpdate.nodes = [];
    this.updateAll.links = false;
    this.updateAll.nodes = false;
    this.updateTransform = false;
  };

  /**
    * grapher._update
    * -------------------
    * 
    * Update nodes and links in the update queue.
    *
    */
  Grapher.prototype._update = function () {
    var updatingLinks = this.willUpdate.links,
        updatingNodes = this.willUpdate.nodes,
        i;

    if (this.updateAll.links) u.each(this.links, this._updateLink);
    else if (updatingLinks && updatingLinks.length) u.eachPop(updatingLinks, this._updateLinkByIndex);

    if (this.updateAll.nodes) u.each(this.nodes, this._updateNode);
    else if (updatingNodes && updatingNodes.length) u.eachPop(updatingNodes, this._updateNodeByIndex);

    if (this.updateTransform) {
      this.network.scale.set(this.props.scale);
      this.network.position.set.apply(this.network, this.props.translate);
    }

    this._clearUpdateQueue();
  };

  Grapher.prototype._updateLink = function (link, i) {
    var data = this.data(),
        lw = this.lineWidth(),
        l = data.links[i],
        from = data.nodes[l.from],
        to = data.nodes[l.to],
        leftMost = from.x <= to.x ? from : to;

    link.width = Math.sqrt(Math.pow(to.x - from.x, 2) + Math.pow(to.y - from.y, 2));
    link.height = lw;
    link.position.set(leftMost.x, leftMost.y - lw / 2);
    link.pivot.set(0, lw / 2);
    link.rotation = Math.atan((to.y - from.y) / (to.x - from.x));

    var color = !u.isUndefined(l.color) ? this._findColor(l.color) :
        Color.interpolate(this._findColor(from.color), this._findColor(to.color));

    this._setColor(LINKS, link, color);
  };

  Grapher.prototype._updateNode = function (node, i) {
    var n = this.data().nodes[i];
    node.width = n.r * 2;
    node.height = n.r * 2;
    node.position.set(n.x - n.r, n.y - n.r);

    this._setColor(NODES, node, this._findColor(n.color));
  };

  Grapher.prototype._updateNodeByIndex = function (i) { this._updateNode(this.nodes[i], i); };

  Grapher.prototype._updateLinkByIndex = function (i) { this._updateLink(this.links[i], i); };

  /**
    * grapher._findLinks
    * -------------------
    * 
    * Search for links connected to the node indices provided.
    *
    * isLinked is a helper function that returns true if a link is
    * connected to a node in indices.
    */
  var isLinked = function (indices, l) {
    var i, len = indices.length, flag = false;
    for (i = 0; i < len; i++) {
      if (l.to == indices[i] || l.from == indices[i]) {
        flag = true;
        break;
      }
    }
    return flag;
  };

  Grapher.prototype._findLinks = function (indices) {
    var links = this.data().links,
        i, numLinks = links.length,
        updatingLinks = [];

    for (i = 0; i < numLinks; i++) {
      if (isLinked(indices, links[i])) updatingLinks.push(i);
    }

    return updatingLinks;
  };

  /**
    * grapher._findColor
    * -------------------
    * 
    * Search for a color whether it's defined by palette index, string,
    * integer.
    */
  Grapher.prototype._findColor = function (c) {
    var color = NaN,
        palette = this.palette();

    if (palette && palette[c]) color = palette[c];
    else color = Color.parse(c);

    // if color is still not set, use the default
    if (u.isNaN(color)) color = this.foregroundColor();
    return color;
  };

  /**
    * grapher._setColor
    * -------------------
    * 
    * Set color on a sprite. This function moves the sprite into the appropriate
    * sprite batch.
    *
    */
  Grapher.prototype._setColor = function (type, sprite, color) {
    var texture = Grapher.getTexture(type, color);

    sprite.setTexture(texture);
    if (sprite.parent) this._exit(sprite);
    this._getBatch(type, color).addChild(sprite);
  };

  /**
    * grapher._getBatch
    * -------------------
    * 
    * Get the sprite batch for the sprite type and color.
    *
    */
  Grapher.prototype._getBatch = function (type, color) {
    var batchSet = type === NODES ? this.batches.nodes : this.batches.links;
    if (!batchSet[color]) {
      var batch = new PIXI.SpriteBatch();
      if (type === LINKS) this.network.addChildAt(batch, 0);
      else this.network.addChild(batch);
      batchSet[color] = batch;
    }
    return batchSet[color];
  };

  /**
    * grapher._onEvent
    * -------------------
    * 
    * Wraps listeners.
    *
    */
  Grapher.prototype._onEvent = function (event) {
    return function (e) {
      var callback = this.listeners[event] ? this.listeners[event] : u.noop;
      e.offset = e.getLocalPosition(this.stage);
      e.offsetData = e.getLocalPosition(this.network);
      callback(e);
    }.bind(this);
  };

/**
  * Grapher Static Properties
  * =========================
  */
  var NODES = Grapher.NODES = 'nodes';
  var LINKS = Grapher.LINKS = 'links';
  Grapher.palettes = {}; // store palettes and textures staticly
  Grapher.textures = {};
  Grapher.textures.nodes = {};
  Grapher.textures.links = {};

/**
  * Grapher Static Methods
  * ======================
  */

  /**
    * Grapher.getPalette
    * -------------------
    * 
    * Get a palette that has been defined.
    *
    */
  Grapher.getPalette = function (name) { return this.palettes[name]; };

  /**
    * Grapher.setPalette
    * -------------------
    * 
    * Define a palette with a name and an array of color swatches.
    *
    */
  Grapher.setPalette = function (name, swatches) {
    var palette = this.palettes[name] = {};
    swatches = u.map(swatches, Color.parse);

    u.each(swatches, function (swatch, i) {
      this.getTexture(LINKS, swatch);
      this.getTexture(NODES, swatch);
      palette[i] = swatch;

      var j;
      for (j = 0; j < i; j++) { // interpolate 'in-between' link colors 50% between node colors
        var color = Color.interpolate(swatches[j], swatch, 0.5);
        this.getTexture(LINKS, color);
        palette[j + '-' + i] = color;
      }
    }, this);
    return this;
  };

  /**
    * Grapher.getTexture
    * -------------------
    * 
    * Get a texture by 'nodes' or 'links' and a color.
    *
    */
  Grapher.getTexture = function (type, color) {
    var textureSet = type === NODES ? this.textures.nodes : this.textures.links;
    if (!textureSet[color]) {
      // generate the textures from Canvas
      var isNode = type === NODES,
          size = isNode ? 100 : 1,
          renderer = new PIXI.CanvasRenderer(size, size, {transparent: isNode, resolution: 1}),
          stage = new PIXI.Stage(color);

      if (isNode) {
        graphics = new PIXI.Graphics();
        graphics.beginFill(color);
        graphics.drawCircle(size / 2, size / 2, size / 2);
        graphics.endFill();

        stage.addChild(graphics);
      }

      renderer.render(stage);

      textureSet[color] = new PIXI.Texture.fromCanvas(renderer.view);
    }
    return textureSet[color];
  };
})();
