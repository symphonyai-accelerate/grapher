;(function () {
  function Shaders (obj) {
    this.vertexCode = obj && obj.vertexCode || null;
    this.fragmentCode = obj && obj.fragmentCode || null;
    return this;
  }

  Shaders.prototype.addVertexAttr = function (name, value, size, type, normalized) {
    var attrs = {
      name: name,
      value: value,
      size: size,
      type: type,
      normalized: normalized
    };

    this.vertexAttrs.push(attrs);
  };

  Shaders.prototype.addUniformAttr = function (name, value) {
    var attrs = {
      name: name,
      value: value
    };

    this.uniformAttrs.push(attrs);
  };

  if (module && module.exports) module.exports = Shaders;
})();
