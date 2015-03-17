// Ayasdi Inc. Copyright 2014
// Color.js may be freely distributed under the Apache 2.0 license

var Color = module.exports = {
  hexToRgb: hexToRgb,
  rgbToHex: rgbToHex,
  toRgb: toRgb,
  interpolate: interpolate,
  parse: parse
};

function hexToRgb (hex) {
  return {r: (hex >> 16) & 0xff, g: (hex >> 8) & 0xff, b: hex & 0xff};
};

function rgbToHex (r, g, b) {
  return r << 16 | g << 8 | b;
};

function interpolate (a, b, amt) {
  amt = amt === undefined ? 0.5 : amt;
  var colorA = hexToRgb(a),
      colorB = hexToRgb(b),
      interpolated = {
        r: colorA.r + (colorB.r - colorA.r) * amt,
        g: colorA.g + (colorB.g - colorA.g) * amt,
        b: colorA.b + (colorB.b - colorA.b) * amt
      };
  return rgbToHex(interpolated.r, interpolated.g, interpolated.b);
};

function parse (c) {
  var color = parseInt(c);
  if (typeof c === 'string') {
    if (c.split('#').length > 1) { // hex format '#ffffff'
      color = parseInt(c.replace('#', ''), 16);
    }

    else if (c.split('rgb(').length > 1) { // rgb format 'rgb(255, 255, 255)'
      var rgb = c.substring(4, c.length-1).replace(/ /g, '').split(',');
      color = rgbToHex(rgb[0], rgb[1], rgb[2]);
    }
  }
  return color;
};

function toRgb (intColor) {
  var r = (intColor >> 16) & 255;
  var g = (intColor >> 8) & 255;
  var b = intColor & 255;

  return 'rgb(' + r + ', ' + g + ', ' + b + ')';
};