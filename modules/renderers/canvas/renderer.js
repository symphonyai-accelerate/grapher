;(function () {

  var Renderer = require('../renderer.js');
  var Color = require('../../helpers/color.js');
  
  var CanvasRenderer = Renderer.extend({
    init: function (o) {
      this._super(o);
      this.context = this.canvas.getContext('2d');
    },

    render: function () {
      this.resize();
      this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.renderLinks();
      this.renderNodes();
    },

    renderNodes: function () {
      for (var i = 0 ; i < this.nodeObjects.length; i ++) {
        var node = this.nodeObjects[i];
        var cx = this.transformX(node.x) * this.resolution;
        var cy = this.transformY(node.y) * this.resolution;
        var r = node.r * Math.abs(this.scale * this.resolution);

        this.context.beginPath();
        this.context.arc(cx, cy, r, 0, 2 * Math.PI, false);
        this.context.fillStyle = Color.fromIntToRgbaString(node.color);
        this.context.fill();
      }
    },

    renderLinks: function () {
      for (var i = 0 ; i < this.linkObjects.length; i ++) {
        var link = this.linkObjects[i];
        var x1 = this.transformX(link.x1) * this.resolution;
        var y1 = this.transformY(link.y1) * this.resolution;
        var x2 = this.transformX(link.x2) * this.resolution;
        var y2 = this.transformY(link.y2) * this.resolution;

        this.context.beginPath();
        this.context.moveTo(x1, y1);
        this.context.lineTo(x2, y2);
        this.context.lineWidth = this.lineWidth * Math.abs(this.scale * this.resolution);
        this.context.strokeStyle = Color.fromIntToRgbaString(link.color);
        this.context.stroke();
      }
    }
  });
  
  if (module && module.exports) module.exports = CanvasRenderer;
})();
