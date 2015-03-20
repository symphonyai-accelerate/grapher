;(function () {
  function Link () {
    this.x1 = 0;
    this.y1 = 0;
    this.x2 = 0;
    this.y2 = 0;
    this.color = 0;
    return this;
  }

  Link.prototype.update = function (x1, y1, x2, y2, color) {
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
    this.color = color;
    return this;
  };

  if (module && module.exports) module.exports = Link;
})();
