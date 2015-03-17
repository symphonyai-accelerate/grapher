;(function () {
  var LinkVertexShaderSource = require('./shaders/link.vert'),
      LinkFragmentShaderSource = require('./shaders/link.frag'),
      NodeVertexShaderSource = require('./shaders/node.vert'),
      NodeFragmentShaderSource = require('./shaders/node.frag'),
      Renderer = require('./../renderer.js');

  var WebGLRenderer = Renderer.extend({
    init: function (o) {
      this._super(o);
      this.initGL(o.webGL);

      this.NODE_ATTRIBUTES = 6;
      this.LINKS_ATTRIBUTES = 3;
    },

    initGL: function (gl) {
      this.gl = gl;
      this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);

      this.linksProgram = this.initShaders(LinkVertexShaderSource, LinkFragmentShaderSource);
      this.nodesProgram = this.initShaders(NodeVertexShaderSource, NodeFragmentShaderSource);

      this.gl.linkProgram(this.linksProgram);
      this.gl.linkProgram(this.nodesProgram);

      this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
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
    },

    updateLinksBuffer: function () {
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
    },

    resize: function (width, height) {
      this._super(width, height);
      this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    },

    render: function () {
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
      var colorLocation = this.gl.getAttribLocation(program, 'a_color');
      
      this.gl.enableVertexAttribArray(positionLocation);
      this.gl.enableVertexAttribArray(colorLocation);

      this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, this.LINKS_ATTRIBUTES * Float32Array.BYTES_PER_ELEMENT, 0);
      this.gl.vertexAttribPointer(colorLocation, 1, this.gl.FLOAT, false, this.LINKS_ATTRIBUTES * Float32Array.BYTES_PER_ELEMENT, 8);

      this.gl.lineWidth(this.lineWidth * Math.abs(this.scale * this.resolution));
      this.gl.drawArrays(this.gl.LINES, 0, this.links.length/this.LINKS_ATTRIBUTES);
    },

    renderNodes: function () {
      var program = this.nodesProgram;
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
    }
  });

  if (module && module.exports) module.exports = WebGLRenderer;
})();
