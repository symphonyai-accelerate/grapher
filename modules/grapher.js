// Ayasdi Inc. Copyright 2014
// Grapher.js may be freely distributed under the Apache 2.0 license

;(function () {
  
/**
  * Grapher
  * =======
  * WebGL network grapher rendering with PIXI
  */
  function Grapher () {
    this.initialize.apply(this, arguments);
    return this;
  }

/**
  * Helpers and Renderers
  * =====================
  * Load helpers and renderers.
  */
  var WebGLRenderer = Grapher.WebGLRenderer = require('./renderers/gl/renderer.js'),
      CanvasRenderer = Grapher.CanvasRenderer = require('./renderers/canvas/renderer.js'),
      Color = Grapher.Color = require('./helpers/color.js'),
      Link = Grapher.Link = require('./helpers/link.js'),
      Node = Grapher.Node = require('./helpers/node.js'),
      Shaders = Grapher.Shaders = require('./helpers/shaders.js'),
      u = Grapher.utils = require('./helpers/utilities.js');

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
  Grapher.prototype.initialize = function (o) {
    if (!o) o = {};
    
    // Extend default properties with options
    this.props = u.extend({
      color: 0xff222222,
      scale: 1,
      translate: [0, 0],
      resolution: window.devicePixelRatio || 1
    }, o);

    if (!o.canvas) this.props.canvas = document.createElement('canvas');
    this.canvas = this.props.canvas;

    var webGL = this._getWebGL();
    if (webGL) {
      this.props.webGL = webGL;
      this.props.canvas.addEventListener('webglcontextlost', function (e) { this._onContextLost(e); }.bind(this));
      this.props.canvas.addEventListener('webglcontextrestored', function (e) { this._onContextRestored(e); }.bind(this));
      this.props.linkShaders = new Shaders(this.props.linkShaders);
      this.props.nodeShaders = new Shaders(this.props.nodeShaders);
    }

    // Renderer and view
    this.renderer =  webGL ? new WebGLRenderer(this.props) : new CanvasRenderer(this.props);
    this.rendered = false;

    // Sprite array
    this.links = [];
    this.nodes = [];

    this.renderer.setLinks(this.links);
    this.renderer.setNodes(this.nodes);

    // Indices that will update
    this.willUpdate = {};
    this.updateAll = {};
    this._clearUpdateQueue();

    // Bind some updaters
    this._updateLink = u.bind(this._updateLink, this);
    this._updateNode = u.bind(this._updateNode, this);
    this._updateLinkByIndex = u.bind(this._updateLinkByIndex, this);
    this._updateNodeByIndex = u.bind(this._updateNodeByIndex, this);
    this.animate = u.bind(this.animate, this);

    // Event Handlers
    this.handlers = {};

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
    this.handlers[event] = this.handlers[event] || [];
    this.handlers[event].push(fn);
    this.canvas.addEventListener(event, fn, false);
    return this;
  };

  /**
    * grapher.off
    * ------------------
    * 
    * Remove a listener from an event.
    */
  Grapher.prototype.off = function (event, fn) {
    if (this.handlers[event]) {
      var i = u.indexOf(this.handlers[event], fn);
      if (i > -1) this.handlers[event].splice(i, 1);
    }
    this.canvas.removeEventListener(event, fn, false);
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
    var data = this.data();
    if (this.links.length < data.links.length) {
      var links = data.links.slice(this.links.length, data.links.length);
      u.eachPop(links, u.bind(function () { this.links.push(new Link()); }, this));
    }

    if (this.nodes.length < data.nodes.length) {
      var nodes = data.nodes.slice(this.nodes.length, data.nodes.length);
      u.eachPop(nodes, u.bind(function () { this.nodes.push(new Node()); }, this));
    }

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

    if (data.links.length < this.links.length) {
      this.links.splice(data.links.length, this.links.length - data.links.length);
    }
    if (data.nodes.length < this.nodes.length) {
      this.nodes.splice(data.nodes.length, this.nodes.length - data.nodes.length);
    }

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
    this.rendered = true;
    this._update();
    this.renderer.render();
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
    * Pauses the animate loop.
    */
  Grapher.prototype.pause = function () {
    if (this.currentFrame) cancelAnimationFrame(this.currentFrame);
    this.currentFrame = null;
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
    * grapher.width
    * ------------------
    * 
    * Specify or retrieve the width.
    */
  Grapher.prototype.width = function (width) {
    if (u.isUndefined(width)) return this.canvas.clientWidth;
    this.resize(width, null);
    return this;
  };

   /**
    * grapher.height
    * ------------------
    * 
    * Specify or retrieve the height.
    */
  Grapher.prototype.height = function (height) {
    if (u.isUndefined(height)) return this.canvas.clientHeight;
    this.resize(null, height);
    return this;
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
    return this;
  };

  /**
    * grapher.color
    * ------------------
    * 
    * Set the default color of nodes and links.
    * If no arguments are passed in, returns the current default color.
    */
  Grapher.prototype.color = function (color) {
    if (u.isUndefined(color)) return this.props.color;
    this.props.color = Color.parse(color);
    return this;
  };

  /**
    * grapher.getDataPosition
    * ------------------
    * 
    * Returns data space coordinates given display coordinates.
    * If a single argument passed in, function considers first argument an object with x and y props.
    */
  Grapher.prototype.getDataPosition = function (x, y) {
    var xCoord = u.isUndefined(y) ? x.x : x;
    var yCoord = u.isUndefined(y) ? x.y : y;
    x = this.renderer.untransformX(xCoord);
    y = this.renderer.untransformY(yCoord);
    return {x: x, y: y};
  };

  /**
  * grapher.getDisplayPosition
  * ------------------
  * 
  * Returns display space coordinates given data coordinates.
  * If a single argument passed in, function considers first argument an object with x and y props.
  */
  Grapher.prototype.getDisplayPosition = function (x, y) {
    var xCoord = u.isUndefined(y) ? x.x : x;
    var yCoord = u.isUndefined(y) ? x.y : y;
    x = this.renderer.transformX(xCoord);
    y = this.renderer.transformY(yCoord);
    return {x: x, y: y};
  };

/**
  * Private Functions
  * =================
  * 
  */

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
      this.renderer.setScale(this.props.scale);
      this.renderer.setTranslate(this.props.translate);
    }

    this._clearUpdateQueue();
  };

  Grapher.prototype._updateLink = function (link, i) {
    var data = this.data(),
        l = data.links[i],
        from = data.nodes[l.from],
        to = data.nodes[l.to];

    var color = !u.isUndefined(l.color) ? this._findColor(l.color) :
        Color.interpolate(this._findColor(from.color), this._findColor(to.color));

    link.update(from.x, from.y, to.x, to.y, color);
  };

  Grapher.prototype._updateNode = function (node, i) {
    var n = this.data().nodes[i];
    node.update(n.x, n.y, n.r, this._findColor(n.color));
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
    var color = Color.parse(c);

    // if color is still not set, use the default
    if (u.isNaN(color)) color = this.color();
    return color;
  };

  /**
    * grapher._getWebGL
    * -------------------
    * 
    *get webGL context if available
    *
    */
  Grapher.prototype._getWebGL = function () {
    var gl = null;
    try { gl = this.canvas.getContext("webgl") || this.canvas.getContext("experimental-webgl"); }
    catch (x) { gl = null; }
    return gl;
  };

 /**
    * grapher._onContextLost
    * ----------------------
    * 
    * Handle context lost.
    *
    */
  Grapher.prototype._onContextLost = function (e) {
    e.preventDefault();
    if (this.currentFrame) cancelAnimationFrame(this.currentFrame);
  };

  /**
    * grapher._onContextRestored
    * --------------------------
    * 
    * Handle context restored.
    *
    */
  Grapher.prototype._onContextRestored = function (e) {
    var webGL = this._getWebGL();
    this.renderer.initGL(webGL);
    if (this.currentFrame) this.play(); // Play the graph if it was running.
    else if (this.rendered) this.render();
  };


/**
  * Grapher Static Properties
  * =========================
  */
  var NODES = Grapher.NODES = 'nodes';
  var LINKS = Grapher.LINKS = 'links';

  if (module && module.exports) module.exports = Grapher;
})();
