;(function () {
  function Shaders (shaders) {
    for (var i = 0; i < shaders.length; i++) {
      var shader = shaders[i];
      this[shader.type] = {};
      this[shader.type].vertexCode = shader.vertexCode;
      this[shader.type].fragmentCode = shader.fragmentCode;
    }
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
