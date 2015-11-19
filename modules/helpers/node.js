function Node () {
  this.x = 0;
  this.y = 0;
  this.r = 10;
  this.color = null;
  return this;
}

Node.prototype.update = function (x, y, r, color) {
  this.x = x;
  this.y = y;
  this.r = r;
  this.color = color;
  return this;
};

module.exports = Node;
