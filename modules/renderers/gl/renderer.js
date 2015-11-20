var LinkVertexShaderSource = require('./shaders/link.vert.js'),
    LinkFragmentShaderSource = require('./shaders/link.frag.js'),
    NodeVertexShaderSource = require('./shaders/node.vert.js'),
    NodeFragmentShaderSource = require('./shaders/node.frag.js'),
    Renderer = require('../renderer.js');

var WebGLRenderer = Renderer.extend({
  init: function (o) {
    this.gl = o.webGL;
    
    this.linkVertexShader = o.linkShaders && o.linkShaders.vertexCode || LinkVertexShaderSource;
    this.linkFragmentShader = o.linkShaders && o.linkShaders.fragmentCode || LinkFragmentShaderSource;
    this.nodeVertexShader = o.nodeShaders && o.nodeShaders.vertexCode ||  NodeVertexShaderSource;
    this.nodeFragmentShader = o.nodeShaders && o.nodeShaders.fragmentCode || NodeFragmentShaderSource;

    this._super(o);

    this.transform = new Float32Array([
      1, 0, 0,
      0, 1, 0,
      0, 0, 1
    ]);
    this.setTransform();
    this.initGL();

    this.NODE_ATTRIBUTES = 9;
    this.LINK_ATTRIBUTES = 6;
  },

  initGL: function (gl) {
    if (gl) this.gl = gl;

    compileShader(this.gl, this.nodeVertexShader, this.gl.VERTEX_SHADER);
    this.linksProgram = this.initShaders(this.linkVertexShader, this.linkFragmentShader);
    this.nodesProgram = this.initShaders(this.nodeVertexShader, this.nodeFragmentShader);

    this.gl.linkProgram(this.linksProgram);
    this.gl.linkProgram(this.nodesProgram);

    this.gl.blendFuncSeparate(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA, this.gl.ONE, this.gl.ONE_MINUS_SRC_ALPHA);
    this.gl.enable(this.gl.BLEND);
  },

  initShaders: function (vertexShaderSource, fragmentShaderSource) {
    var vertexShader = this.getShaders(this.gl.VERTEX_SHADER, vertexShaderSource);
    var fragmentShader = this.getShaders(this.gl.FRAGMENT_SHADER, fragmentShaderSource);
    var shaderProgram = this.gl.createProgram();
    this.gl.attachShader(shaderProgram, vertexShader);
    this.gl.attachShader(shaderProgram, fragmentShader);
    return shaderProgram;
  },

  getShaders: function (type, source) {
    var shader = this.gl.createShader(type);
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);
    return shader;
  },

  updateNodesBuffer: function () {
    var nodes = this.nodes = [];
    this.nodeObjects.forEach(function (node) {
      for (var position = 0; position < 3; position++) {
        nodes.push(position);
        nodes.push(node.color[0]);
        nodes.push(node.color[1]);
        nodes.push(node.color[2]);
        nodes.push(node.color[3]);
        nodes.push(node.x);
        nodes.push(node.y);
        nodes.push(node.r);
      }
    });
  },

  updateLinksBuffer: function () {
    var j = 0;
    this.links = [];
    for (var i = 0; i < this.linkObjects.length; i++) {
      var link = this.linkObjects[i];
      var x1 = this.transformX(link.x1);
      var y1 = this.transformY(link.y1);
      var x2 = this.transformX(link.x2);
      var y2 = this.transformY(link.y2);

      this.links[j++] = x1;
      this.links[j++] = y1;
      this.links[j++] = link.color[0];
      this.links[j++] = link.color[1];
      this.links[j++] = link.color[2];
      this.links[j++] = link.color[3];

      this.links[j++] = x2;
      this.links[j++] = y2;
      this.links[j++] = link.color[0];
      this.links[j++] = link.color[1];
      this.links[j++] = link.color[2];
      this.links[j++] = link.color[3];
    }
  },

  resize: function (width, height) {
    this._super(width, height);
    this.gl.viewport(0, 0, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);
  },

  render: function () {
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);

    this.resize();
    this.updateNodesBuffer();
    this.updateLinksBuffer();
    this.renderLinks(); // links have to be rendered first because of blending;
    this.renderNodes();
  },

  renderLinks: function () {
    var program = this.linksProgram;
    this.gl.useProgram(program);

    var linksBuffer = new Float32Array(this.links);
    var buffer = this.gl.createBuffer();

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, linksBuffer, this.gl.STATIC_DRAW);

    var resolutionLocation = this.gl.getUniformLocation(program, 'u_resolution');
    this.gl.uniform2f(resolutionLocation, this.canvas.width, this.canvas.height);

    var positionLocation = this.gl.getAttribLocation(program, 'a_position');
    var rgbaLocation = this.gl.getAttribLocation(program, 'a_rgba');
    
    this.gl.enableVertexAttribArray(positionLocation);
    this.gl.enableVertexAttribArray(rgbaLocation);

    this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, this.LINK_ATTRIBUTES  * Float32Array.BYTES_PER_ELEMENT, 0);
    this.gl.vertexAttribPointer(rgbaLocation, 4, this.gl.FLOAT, false, this.LINK_ATTRIBUTES  * Float32Array.BYTES_PER_ELEMENT, 8);

    var lineWidthRange = this.gl.getParameter(this.gl.ALIASED_LINE_WIDTH_RANGE), // ex [1,10] 
        lineWidth = this.lineWidth * Math.abs(this.scale * this.resolution),
        lineWidthInRange = Math.min(Math.max(lineWidth, lineWidthRange[0]), lineWidthRange[1]);

    this.gl.lineWidth(lineWidthInRange);
    this.gl.drawArrays(this.gl.LINES, 0, this.links.length/this.LINK_ATTRIBUTES);
  },

  renderNodes: function () {
    var program = this.nodesProgram;
    this.gl.useProgram(program);

    var nodesBuffer = new Float32Array(this.nodes);
    var buffer = this.gl.createBuffer();

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, nodesBuffer, this.gl.STATIC_DRAW);

    var resolutionLocation = this.gl.getUniformLocation(program, 'u_resolution');
    var transformLocation = this.gl.getUniformLocation(program, 'u_transform');
    this.gl.uniform2f(resolutionLocation, this.canvas.width, this.canvas.height);
    this.gl.uniformMatrix3fv(transformLocation, this.gl.FALSE, this.transform);

    var positionLocation = this.gl.getAttribLocation(program, 'a_position');
    var rgbaLocation = this.gl.getAttribLocation(program, 'a_rgba');
    var centerLocation = this.gl.getAttribLocation(program, 'a_center');
    var radiusLocation = this.gl.getAttribLocation(program, 'a_radius');
    
    this.gl.enableVertexAttribArray(positionLocation);
    this.gl.enableVertexAttribArray(rgbaLocation);
    this.gl.enableVertexAttribArray(centerLocation);
    this.gl.enableVertexAttribArray(radiusLocation);

    this.gl.vertexAttribPointer(positionLocation, 1, this.gl.FLOAT, false, this.NODE_ATTRIBUTES  * Float32Array.BYTES_PER_ELEMENT, 0);
    this.gl.vertexAttribPointer(rgbaLocation, 4, this.gl.FLOAT, false, this.NODE_ATTRIBUTES  * Float32Array.BYTES_PER_ELEMENT, 8);
    this.gl.vertexAttribPointer(centerLocation, 2, this.gl.FLOAT, false, this.NODE_ATTRIBUTES  * Float32Array.BYTES_PER_ELEMENT, 24);
    this.gl.vertexAttribPointer(radiusLocation, 1, this.gl.FLOAT, false, this.NODE_ATTRIBUTES  * Float32Array.BYTES_PER_ELEMENT, 32);

    this.gl.drawArrays(this.gl.TRIANGLES, 0, this.nodes.length/this.NODE_ATTRIBUTES);
  },

  setTransform: function () {
    /* We generate this transformation matrix (stored column-wise):

      s,  0,  t[0]
      0,  s,  t[1]
      0,  0,  1

    */

    this.transform[0] = this.transform[4] = this.scale * this.resolution;
    this.transform[6] = this.translate[0] * this.resolution;
    this.transform[7] = this.translate[1] * this.resolution;
    return this.transform;
  },

  setScale: function (scale) {
    this._super(scale);
    this.setTransform();
  },

  setTranslate: function (translate) {
    this._super(translate);
    this.setTransform();
  }
});

module.exports = WebGLRenderer;

function compileShader(gl, shaderSource, shaderType) {
  // Create the shader object
  var shader = gl.createShader(shaderType);
 
  // Set the shader source code.
  gl.shaderSource(shader, shaderSource);
 
  // Compile the shader
  gl.compileShader(shader);
 
  // Check if it compiled
  var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (!success) {
    // Something went wrong during compilation; get the error
    throw "could not compile shader:" + gl.getShaderInfoLog(shader);
  }
 
  return shader;
}
