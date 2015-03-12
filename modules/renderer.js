
var LinkVertexShaderSource = require('./shaders/link.vert'),
    LinkFragmentShaderSource = require('./shaders/link.frag'),
    NodeVertexShaderSource = require('./shaders/node.vert'),
    NodeFragmentShaderSource = require('./shaders/node.frag');

Renderer = function () {
  this.initialize.apply(this, arguments);
  return this;
};

Renderer.prototype = {};

Renderer.prototype.initialize = function (o) {
  this.props = {};
  this.props.canvas = o.canvas;
  this.props.width = o.width; // using canvas.width instead
  this.props.height = o.height; // using canvas.height instead
  this.props.linkWidth = o.linkWidth || 2;
  this.props.backgroundColor = o.backgroundColor || 16779765; //float(255,255,255); //not used anywhere

  this.nodeObjects = [];
  this.linkObjects = [];

  this.nodes = [];
  this.links = [];

  this.gl = null;

  //initial transform position 
  this.pixelScale = window.devicePixelRatio || 1;
  this.scale = this.pixelScale;
  this.translate = [0, 0];

  this.NODE_ATTRIBUTES = 6;
  this.LINKS_ATTRIBUTES = 3;

  this.nodeVertexShaderSource = NodeVertexShaderSource;
  this.nodeFragmentShaderSource = NodeFragmentShaderSource;
  this.linkVertexShaderSource = LinkVertexShaderSource;
  this.linkFragmentShaderSource = LinkFragmentShaderSource;

};

Renderer.prototype.setNodes = function (nodes) { this.nodeObjects = nodes; };

Renderer.prototype.setLinks = function (links) { this.linkObjects = links; };

Renderer.prototype.render = function () {
  this.initGL();
  this.resize();
  this.updateNodesBuffer();
  this.updateLinksBuffer();
  this.renderLinks(); // links have to be rendered first because of blending;
  this.renderNodes();
};

Renderer.prototype.setScale = function (scale) { this.scale = scale * this.pixelScale ; };

Renderer.prototype.setTranslate = function (translate) { this.translate = translate; };

Renderer.prototype.updateNodesBuffer = function () {
  var j = 0;
  this.nodes = [];
  for (var i = 0; i < this.nodeObjects.length; i++) {
    var cx = this.nodeObjects[i].x * this.scale + this.translate[0] ;
    var cy = this.nodeObjects[i].y * this.scale + this.translate[1];
    var r = this.nodeObjects[i].r * Math.abs(this.scale);
    var color = this.nodeObjects[i].color;


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
    var x1 = this.linkObjects[i].x1 * this.scale + this.translate[0];
    var y1 = this.linkObjects[i].y1 * this.scale + this.translate[1];
    var x2 = this.linkObjects[i].x2 * this.scale + this.translate[0];
    var y2 = this.linkObjects[i].y2 * this.scale + this.translate[1];
    var color = this.linkObjects[i].color;

    this.links[j++] = x1;
    this.links[j++] = y1;
    this.links[j++] = color;

    this.links[j++] = x2;
    this.links[j++] = y2;
    this.links[j++] = color;
  }
};

Renderer.prototype.getTransformedPosition = function (position) {
 return [position.x / this.scale - this.translate[0], position.y / this.scale - this.translate[1]];
};

Renderer.prototype.resize = function () {
  this.pixelScale = window.devicePixelRatio || 1;

  var displayWidth  = Math.floor(this.gl.canvas.clientWidth  * this.pixelScale);
  var displayHeight = Math.floor(this.gl.canvas.clientHeight * this.pixelScale);

  if (this.gl.canvas.width != displayWidth || this.gl.canvas.height != displayHeight) {
    this.gl.canvas.width  = displayWidth;
    this.gl.canvas.height = displayHeight;
    this.gl.viewport(0, 0, canvas.width, canvas.height);
  }
};

Renderer.prototype.initGL = function () {
  if (!this.gl) this.gl = this.props.canvas.getContext('experimental-webgl', {antialias: true});
  this.gl.viewport(0, 0, canvas.width, canvas.height);

};

Renderer.prototype.initShaders = function (vertexShaderSource, fragmentShaderSource) {
  var vertexShader = this.getShaders.apply(this, [this.gl.VERTEX_SHADER, vertexShaderSource]);
  var fragmentShader = this.getShaders.apply(this, [this.gl.FRAGMENT_SHADER, fragmentShaderSource]);
  var shaderProgram = this.gl.createProgram();
  this.gl.attachShader(shaderProgram, vertexShader);
  this.gl.attachShader(shaderProgram, fragmentShader);
  this.gl.linkProgram(shaderProgram);
  this.gl.useProgram(shaderProgram);
  this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
  this.gl.enable(this.gl.BLEND);
  this.gl.lineWidth(this.props.linkWidth * Math.abs(this.scale)); // this is only for links
  return shaderProgram;
};

Renderer.prototype.getShaders = function (type, source) {
  var shader = this.gl.createShader(type);
  this.gl.shaderSource(shader, source);
  this.gl.compileShader(shader);
  return shader;
};

Renderer.prototype.renderLinks = function () {
  var program = this.initShaders.apply(this, [this.linkVertexShaderSource, this.linkFragmentShaderSource]);
  var linksBuffer = new Float32Array(this.links);
  var buffer = this.gl.createBuffer();

  this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
  this.gl.bufferData(this.gl.ARRAY_BUFFER, linksBuffer, this.gl.STATIC_DRAW);

  var resolutionLocation = this.gl.getUniformLocation(program, 'u_resolution');
  this.gl.uniform2f(resolutionLocation, canvas.width, canvas.height);

  var positionLocation = this.gl.getAttribLocation(program, 'a_position');
  var colorLocation = this.gl.getAttribLocation(program, 'a_color');
  
  this.gl.enableVertexAttribArray(positionLocation);
  this.gl.enableVertexAttribArray(colorLocation);

  this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, this.LINKS_ATTRIBUTES * Float32Array.BYTES_PER_ELEMENT, 0);
  this.gl.vertexAttribPointer(colorLocation, 1, this.gl.FLOAT, false, this.LINKS_ATTRIBUTES * Float32Array.BYTES_PER_ELEMENT, 8);

  this.gl.drawArrays(this.gl.LINES, 0, this.links.length/this.LINKS_ATTRIBUTES);
};

Renderer.prototype.renderNodes = function () {
  var program = this.initShaders.apply(this, [this.nodeVertexShaderSource, this.nodeFragmentShaderSource]);
  var nodesBuffer = new Float32Array(this.nodes);
  var buffer = this.gl.createBuffer();

  this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
  this.gl.bufferData(this.gl.ARRAY_BUFFER, nodesBuffer, this.gl.STATIC_DRAW);

  var resolutionLocation = this.gl.getUniformLocation(program, 'u_resolution');
  this.gl.uniform2f(resolutionLocation, canvas.width, canvas.height);

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
