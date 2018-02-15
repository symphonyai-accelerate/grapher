import Renderer from '../renderer.js';

var CanvasRenderer = Renderer.extend({
  init: function (o) {
    this._super(o);
    this.context = this.canvas.getContext('2d');
    this.custom2dNodeRenderFunction = o.custom2dNodeRenderFunction;
    this.custom2dLinkRenderFunction = o.custom2dLinkRenderFunction;
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
      var r = node.r * this.nodeScale * this.resolution;
      var colorWithCorrectAlpha = node.color.slice();
      colorWithCorrectAlpha[3] = colorWithCorrectAlpha[3] / 255;
      if (this.custom2dNodeRenderFunction) {
        this.custom2dNodeRenderFunction({
          context: this.context,
          node: node,
          cx: cx,
          cy: cy,
          r: r,
          color: colorWithCorrectAlpha,
        });
      } else {
        this.context.beginPath();
        this.context.arc(cx, cy, r, 0, 2 * Math.PI, false);
        // var borderColor = colorWithCorrectAlpha.map(function (val, i) {
        //   // darken rgb, ignore alpha
        //   return i === 3 ? val : Math.max(val - 140, 0);
        // });
        // this.context.strokeStyle = 'rgba(' + borderColor.join(',') + ')';
        this.context.fillStyle = 'rgba(' + colorWithCorrectAlpha.join(',') + ')';
        // this.context.stroke();
        this.context.fill();
      }

    }
  },

  renderLinks: function () {
    for (var i = 0 ; i < this.linkObjects.length; i ++) {
      var link = this.linkObjects[i];
      var x1 = this.transformX(link.x1) * this.resolution;
      var y1 = this.transformY(link.y1) * this.resolution;
      var x2 = this.transformX(link.x2) * this.resolution;
      var y2 = this.transformY(link.y2) * this.resolution;
      var colorWithCorrectAlpha = link.color.slice();
      var lineWidth = this.lineWidth * 0.5 * this.resolution;
      colorWithCorrectAlpha[3] = colorWithCorrectAlpha[3] / 255;
      if (this.custom2dLinkRenderFunction) {
        this.custom2dLinkRenderFunction({
          context: this.context,
          x1: x1,
          y1: y1,
          x2: x2,
          y2: y2,
          color: colorWithCorrectAlpha,
          lineWidth: lineWidth,
        });
      } else {
        this.context.beginPath();
        this.context.moveTo(x1, y1);
        this.context.lineTo(x2, y2);
        this.context.lineWidth = lineWidth;
        this.context.strokeStyle = 'rgba(' + colorWithCorrectAlpha.join(',') + ')';
        this.context.stroke();
      }

    }
  }
});

export default CanvasRenderer;
