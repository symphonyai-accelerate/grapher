// Ayasdi Inc. Copyright 2014
// Color.js may be freely distributed under the Apache 2.0 license

var Color = module.exports = {
  interpolate: interpolate,
  parse: parse,
  fromIntToRgb: fromIntToRgb,
  fromIntToRgba: fromIntToRgba,
  fromRgbToHex: fromRgbToHex,
  fromRgbaToHex: fromRgbaToHex,
  fromIntToRgbString: fromIntToRgbString,
  fromIntToRgbaString: fromIntToRgbaString,
  fromRgbStringToInt: fromRgbStringToInt,
  fromRgbaStringToInt: fromRgbaStringToInt,
  fromRgbToInt: fromRgbToInt,
  fromRgbaToInt: fromRgbaToInt,
  fromHexToInt: fromHexToInt
};

function interpolate (a, b, amt) {
  amt = amt === undefined ? 0.5 : amt;
  var colorA = fromIntToRgba(a),
      colorB = fromIntToRgba(b),
      interpolated = {
        r: colorA.r + (colorB.r - colorA.r) * amt,
        g: colorA.g + (colorB.g - colorA.g) * amt,
        b: colorA.b + (colorB.b - colorA.b) * amt,
        a: colorA.a + (colorB.a - colorA.a) * amt
      };
  return fromRgbaToInt(interpolated.r, interpolated.g, interpolated.b, interpolated.a);
}

function parse (c) {
  var color = parseInt(c, 10); // usually NaN, in case we pass in an int for color
  if (typeof c === 'string') {
    var string = c.replace(/ /g, ''); // strip spaces immediately

    if (c.split('#').length > 1) color = fromHexToInt(string);
    else if (c.split('rgb(').length > 1) color = fromRgbStringToInt(string);
    else if (c.split('rgba(').length > 1) color = fromRgbaStringToInt(string);
  }
  return color;
}

function fromIntToRgb (intColor) {
  return {
    r: Math.floor(intColor / Math.pow(2, 16)) % Math.pow(2, 8),
    g: Math.floor(intColor / Math.pow(2, 8)) % Math.pow(2, 8),
    b: intColor % Math.pow(2, 8)
  };
}

function fromIntToRgba (intColor) {
  return {
    a: Math.floor(intColor / Math.pow(2, 24)) % Math.pow(2, 8),
    r: Math.floor(intColor / Math.pow(2, 16)) % Math.pow(2, 8),
    g: Math.floor(intColor / Math.pow(2, 8)) % Math.pow(2, 8),
    b: intColor % Math.pow(2, 8)
  };
}

function fromRgbToHex (r, g, b) {
  var rgb = (parseInt(r, 10) * Math.pow(2, 16)) + (parseInt(g, 10) * Math.pow(2, 8)) + parseInt(b, 10);
  return '#' + (0x1000000 + rgb).toString(16).slice(1);
}

function fromRgbaToHex (r, g, b, a) {
  var rgba = (parseInt(a, 10) * Math.pow(2, 24)) + (parseInt(r, 10) * Math.pow(2, 16)) + (parseInt(g, 10) * Math.pow(2, 8)) + parseInt(b, 10);
  return '#' + ( 0x100000000 + rgba).toString(16).slice(1);
}

function fromIntToRgbString (intColor) {
  var rgb = fromIntToRgb(intColor);
  return 'rgb(' + rgb.r + ', ' + rgb.g + ', ' + rgb.b + ')';
}

function fromIntToRgbaString (intColor) {
  var rgba = fromIntToRgba(intColor);
  return 'rgba(' + rgba.r + ', ' + rgba.g + ', ' + rgba.b + ', ' + rgba.a / 255 + ')';
}

function fromRgbStringToInt (string) {
  var rgb = string.substring(4, string.length - 1).split(',');
  return fromRgbToInt(rgb[0], rgb[1], rgb[2]);
}

function fromRgbaStringToInt (string) {
  var rgba = string.substring(5, string.length - 1).split(',');
  return fromRgbaToInt(rgba[0], rgba[1], rgba[2], rgba[3] * 255);
}

function fromRgbToInt (r, g, b) {
  return fromRgbaToInt(r, g, b, 255);
}

function fromRgbaToInt (r, g, b, a) {
  return parseInt(fromRgbaToHex(r, g, b, a ).replace('#', '0x'), 16);
}

function fromHexToInt (string) {
  var hex = string.replace('#', '');
  if (hex.length === 6) hex = 'ff' + hex; // prepend full alpha if needed
  return parseInt(hex, 16);
}
