// Ayasdi Inc. Copyright 2014
// Color.js may be freely distributed under the Apache 2.0 license

/**
  * Color.js
  * ========
  * Color helper.
  *
  * Colors parsed by this helper will be in the format:
  * [r, g, b, a]
  * where each color attribute is a value between 0-255.
  */

module.exports = {
  interpolate: interpolate,
  parse: parse
};

function interpolate (a, b, amt) {
  amt = amt === undefined ? 0.5 : amt;
  var interpolated = a.map(function (colorA, index) {
    var colorB = b[index];
    return colorA + (colorB - colorA) * amt;
  });
  return interpolated;
}

function parse (c) {
  var color;
  if (typeof c === 'string') {
    var string = c.replace(/ /g, ''); // strip spaces immediately

    if (c.split('#').length > 1) color = parseHex(string);
    else if (c.split('rgb(').length > 1) color = parseRgb(string);
    else if (c.split('rgba(').length > 1) color = parseRgba(string);
  } else if (typeof c === 'number') {
    color = parseColorInteger(parseInt(c, 10));
  }
  return color;
}

function parseColorInteger (intColor) {
  return [
    Math.floor(intColor / Math.pow(2, 16)) % Math.pow(2, 8),
    Math.floor(intColor / Math.pow(2, 8)) % Math.pow(2, 8),
    intColor % Math.pow(2, 8),
    Math.floor(intColor / Math.pow(2, 24)) % Math.pow(2, 8)
  ];
}

function parseHex (string) {
  var hex = string.replace('#', '');
  if (hex.length === 6) hex = 'ff' + hex; // prepend full alpha if needed
  return parseColorInteger(parseInt(hex, 16));
}

function parseRgb (string) {
  var rgba = string.substring(4, string.length - 1).split(',').map(function (c) {
    return parseInt(c, 10);
  });
  rgba[3] = 255; // full alpha
  return rgba;
}

function parseRgba (string) {
  var rgba = string.substring(5, string.length - 1).split(',').map(function (c) {
    return parseFloat(c, 10);
  });
  // Assume that if the given alpha is 0-1, it's normalized.
  rgba[3] = rgba[3] <= 1 ? 255 * rgba[3] : rgba[3];
  return rgba;
}
