// Ayasdi Inc. Copyright 2014 - all rights reserved.

var Grapher = require('./modules/grapher.js');

if (module && module.exports) module.exports = Grapher;
if (typeof Ayasdi === 'undefined') Ayasdi = {};
Ayasdi.Grapher = Grapher;
