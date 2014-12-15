// Ayasdi Inc. Copyright 2014
// Grapher.js may be freely distributed under the Apache 2.0 license

var Grapher = require('./modules/grapher.js');

if (module && module.exports) module.exports = Grapher;
if (typeof Ayasdi === 'undefined') Ayasdi = {};
Ayasdi.Grapher = Grapher;
