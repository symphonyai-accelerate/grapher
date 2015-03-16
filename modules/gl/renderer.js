;(function () {
  var LinkVertexShaderSource = require('./shaders/link.vert'),
      LinkFragmentShaderSource = require('./shaders/link.frag'),
      NodeVertexShaderSource = require('./shaders/node.vert'),
      NodeFragmentShaderSource = require('./shaders/node.frag');

  var Renderer = function () {
    this.initialize.apply(this, arguments);
    return this;
  };

  Renderer.prototype = {};

  Renderer.prototype.initialize = function (o) {
    this.canvas = o.canvas;
    this.width = o.width; // using canvas.width instead
    this.height = o.height; // using canvas.height instead
    this.lineWidth = o.lineWidth || 2;
    this.resolution = o.resolution || 1;

    this.nodeObjects = [];
    this.linkObjects = [];

    this.nodes = [];
    this.links = [];

    this.gl = null;

    //initial transform position 
    this.scale = o.scale;
    this.translate = o.translate;

    this.NODE_ATTRIBUTES = 6;
    this.LINKS_ATTRIBUTES = 3;

    this.linksProgram = null;
    this.nodesProgram = null;

    this.initGL();
  };

  Renderer.prototype.initGL = function () {
    if (!this.gl) this.gl = this.canvas.getContext('experimental-webgl', {antialias: true});

    if (!this.gl) return;
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);

    this.linksProgram = this.initShaders(LinkVertexShaderSource, LinkFragmentShaderSource);
    this.nodesProgram = this.initShaders(NodeVertexShaderSource, NodeFragmentShaderSource);

    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
    this.gl.enable(this.gl.BLEND);
  };

  Renderer.prototype.initShaders = function (vertexShaderSource, fragmentShaderSource) {
    var vertexShader = this.getShaders(this.gl.VERTEX_SHADER, vertexShaderSource);
    var fragmentShader = this.getShaders(this.gl.FRAGMENT_SHADER, fragmentShaderSource);
    var shaderProgram = this.gl.createProgram();
    this.gl.attachShader(shaderProgram, vertexShader);
    this.gl.attachShader(shaderProgram, fragmentShader);
    return shaderProgram;
  };

  Renderer.prototype.getShaders = function (type, source) {
    var shader = this.gl.createShader(type);
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);
    return shader;
  };

  Renderer.prototype.setNodes = function (nodes) { this.nodeObjects = nodes; };

  Renderer.prototype.setLinks = function (links) { this.linkObjects = links; };

  Renderer.prototype.setScale = function (scale) { this.scale = scale; };

  Renderer.prototype.setTranslate = function (translate) { this.translate = translate; };

  Renderer.prototype.updateNodesBuffer = function () {
    var j = 0;
    this.nodes = [];
    for (var i = 0; i < this.nodeObjects.length; i++) {
      var node = this.nodeObjects[i];
      var cx = this.transformX(node.x) * this.resolution;
      var cy = this.transformY(node.y) * this.resolution;
      var r = node.r * Math.abs(this.scale * this.resolution);
      var color = node.color;


      this.nodes[j++] = (cx - r);
      this.nodes[j++] = (cy - r);
      this.nodes[j++] = color;
      this.nodes[j++] = cx;
      this.nodes[j++] = cy;
      this.nodes[j++] = r;

      this.nodes[j++] = (cx + (1 + Math.sqrt(2))*r);
      this.nodes[j++] = cy - r;
      this.nodes[j++] = color;
      this.nodes[j++] = cx;
      this.nodes[j++] = cy;
      this.nodes[j++] = r;

      this.nodes[j++] = (cx - r);
      this.nodes[j++] = (cy + (1 + Math.sqrt(2))*r);
      this.nodes[j++] = color;
      this.nodes[j++] = cx;
      this.nodes[j++] = cy;
      this.nodes[j++] = r;
    }
  };

  Renderer.prototype.updateLinksBuffer = function () {
    var j = 0;
    this.links = [];
    for (var i = 0; i < this.linkObjects.length; i++) {
      var link = this.linkObjects[i];
      var x1 = this.transformX(link.x1) * this.resolution;
      var y1 = this.transformY(link.y1) * this.resolution;
      var x2 = this.transformX(link.x2) * this.resolution;
      var y2 = this.transformY(link.y2) * this.resolution;
      var color = link.color;

      this.links[j++] = x1;
      this.links[j++] = y1;
      this.links[j++] = color;

      this.links[j++] = x2;
      this.links[j++] = y2;
      this.links[j++] = color;
    }
  };

  Renderer.prototype.transformX = function (x) {
    return x * this.scale + this.translate[0];
  };

  Renderer.prototype.transformY = function (y) {
    return y * this.scale + this.translate[1];
  };

  Renderer.prototype.untransformX = function (x) {
    return (x - this.translate[0]) / this.scale;
  };

  Renderer.prototype.untransformY = function (y) {
    return (y - this.translate[1]) / this.scale;
  };

  Renderer.prototype.resize = function (width, height) {
    var displayWidth  = width * this.resolution;
    var displayHeight = height * this.resolution;

    this.canvas.width  = displayWidth;
    this.canvas.height = displayHeight;

    if (!this.gl) return;
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  };

  Renderer.prototype.render = function () {
    if (!this.gl) return;
    this.updateNodesBuffer();
    this.updateLinksBuffer();
    this.renderLinks(); // links have to be rendered first because of blending;
    this.renderNodes();
  };

  Renderer.prototype.renderLinks = function () {
    var program = this.linksProgram;
    this.gl.linkProgram(program);
    this.gl.useProgram(program);

    var linksBuffer = new Float32Array(this.links);
    var buffer = this.gl.createBuffer();

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, linksBuffer, this.gl.STATIC_DRAW);

    var resolutionLocation = this.gl.getUniformLocation(program, 'u_resolution');
    this.gl.uniform2f(resolutionLocation, this.canvas.width, this.canvas.height);

    var positionLocation = this.gl.getAttribLocation(program, 'a_position');
    var colorLocation = this.gl.getAttribLocation(program, 'a_color');
    
    this.gl.enableVertexAttribArray(positionLocation);
    this.gl.enableVertexAttribArray(colorLocation);

    this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, this.LINKS_ATTRIBUTES * Float32Array.BYTES_PER_ELEMENT, 0);
    this.gl.vertexAttribPointer(colorLocation, 1, this.gl.FLOAT, false, this.LINKS_ATTRIBUTES * Float32Array.BYTES_PER_ELEMENT, 8);

    this.gl.lineWidth(this.lineWidth * Math.abs(this.scale * this.resolution));
    this.gl.drawArrays(this.gl.LINES, 0, this.links.length/this.LINKS_ATTRIBUTES);
  };

  Renderer.prototype.renderNodes = function () {
    var program = this.nodesProgram;
    this.gl.linkProgram(program);
    this.gl.useProgram(program);

    var nodesBuffer = new Float32Array(this.nodes);
    var buffer = this.gl.createBuffer();

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, nodesBuffer, this.gl.STATIC_DRAW);

    var resolutionLocation = this.gl.getUniformLocation(program, 'u_resolution');
    this.gl.uniform2f(resolutionLocation, this.canvas.width, this.canvas.height);

    var positionLocation = this.gl.getAttribLocation(program, 'a_position');
    var colorLocation = this.gl.getAttribLocation(program, 'a_color');
    var centerLocation = this.gl.getAttribLocation(program, 'a_center');
    var radiusLocation = this.gl.getAttribLocation(program, 'a_radius');
    
    this.gl.enableVertexAttribArray(positionLocation);
    this.gl.enableVertexAttribArray(colorLocation);
    this.gl.enableVertexAttribArray(centerLocation);
    this.gl.enableVertexAttribArray(radiusLocation);

    this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, this.NODE_ATTRIBUTES * Float32Array.BYTES_PER_ELEMENT, 0);
    this.gl.vertexAttribPointer(colorLocation, 1, this.gl.FLOAT, false, this.NODE_ATTRIBUTES * Float32Array.BYTES_PER_ELEMENT, 8);
    this.gl.vertexAttribPointer(centerLocation, 2, this.gl.FLOAT, false, this.NODE_ATTRIBUTES * Float32Array.BYTES_PER_ELEMENT, 12);
    this.gl.vertexAttribPointer(radiusLocation, 1, this.gl.FLOAT, false, this.NODE_ATTRIBUTES * Float32Array.BYTES_PER_ELEMENT, 20);

    this.gl.drawArrays(this.gl.TRIANGLES, 0, this.nodes.length/this.NODE_ATTRIBUTES);
  };

  if (module && module.exports) module.exports = Renderer;
})();
