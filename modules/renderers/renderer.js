;(function () {

  var Renderer = function () {
    if ( !initializing && this.init )
      this.init.apply(this, arguments);
    return this;
  };

  Renderer.prototype = {
    init: function (o) {
      this.canvas = o.canvas;
      this.lineWidth = o.lineWidth || 2;
      this.resolution = o.resolution || 1;
      this.scale = o.scale;
      this.translate = o.translate;

      this.resize();
    },
    setNodes: function (nodes) { this.nodeObjects = nodes; },
    setLinks: function (links) { this.linkObjects = links; },
    setScale: function (scale) { this.scale = scale; },
    setTranslate: function (translate) { this.translate = translate; },
    transformX: function (x) { return x * this.scale[0] + this.translate[0]; },
    transformY: function (y) { return y * this.scale[1] + this.translate[1]; },
    untransformX: function (x) { return (x - this.translate[0]) / this.scale[0]; },
    untransformY: function (y) { return (y - this.translate[1]) / this.scale[1]; },
    resize: function (width, height) {
      var displayWidth  = (width || this.canvas.clientWidth) * this.resolution;
      var displayHeight = (height || this.canvas.clientHeight) * this.resolution;

      if (this.canvas.width != displayWidth) this.canvas.width  = displayWidth;
      if (this.canvas.height != displayHeight) this.canvas.height = displayHeight;
    }
  };

  var initializing = false;

  Renderer.extend = function (prop) {
    var _super = this.prototype;

    initializing = true;
    var prototype = new this();
    initializing = false;

    prototype._super = this.prototype;
    for (var name in prop) {
      prototype[name] = typeof prop[name] == "function" &&
        typeof _super[name] == "function" && /\b_super\b/.test(prop[name]) ?
        (function(name, fn){
          return function() {
            var tmp = this._super;
           
            // Add a new ._super() method that is the same method
            // but on the super-class
            this._super = _super[name];
           
            // The method only need to be bound temporarily, so we
            // remove it when we're done executing
            var ret = fn.apply(this, arguments);
            this._super = tmp;
           
            return ret;
          };
        })(name, prop[name]) :
        prop[name];
    }

    // The dummy class constructor
    function Renderer () {
      // All construction is actually done in the init method
      if ( !initializing && this.init )
        this.init.apply(this, arguments);
    }
   
    // Populate our constructed prototype object
    Renderer.prototype = prototype;
   
    // Enforce the constructor to be what we expect
    Renderer.prototype.constructor = Renderer;
 
    // And make this class extendable
    Renderer.extend = arguments.callee;
   
    return Renderer;
  };

  if (module && module.exports) module.exports = Renderer;
})();
