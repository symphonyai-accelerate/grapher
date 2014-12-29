Ayasdi.Grapher
==============

WebGL/Canvas Network Graphing using PIXI.js.


Download
--------
Grapher comes bundled with PIXI.js and Underscore (v.1.6.0).

* [bundled](http://ayasdi.github.io/grapher/build/grapher.js)
* [bundled-min](http://ayasdi.github.io/grapher/build/grapher-min.js)

An unbundled version can be found in the modules folder.
This version is useful if you are already using some of the dependencies or
are using a package management system.


Examples
--------

Here are a few examples:

1. [Simple](http://ayasdi.github.io/grapher/examples/1-simple.html)
2. [Transforms](http://ayasdi.github.io/grapher/examples/2-transforms.html)
3. [Colors](http://ayasdi.github.io/grapher/examples/3-colors.html)
4. [Drag](http://ayasdi.github.io/grapher/examples/4-drag.html)

These examples can be also found in the examples folder.

Developing
----------

**Installing**

Grapher uses [Node.js](http://nodejs.org/). Install Node.js then run the following command:

    sudo npm install

This will install the development dependencies that Grapher uses to run its various tasks.

**Building**

To build Grapher, run the following command:

    npm run build

This will bundle modules/grapher.js with its dependencies and outputs the result to
grapher.js and grapher-min.js in the build folder.

**Testing**

Unit tests are run using Jasmine with this command:

    npm run test

This will also rebuilds grapher.js. Test specs can be found in the specs folder.


License
--------
Grapher.js may be freely distributed under the Apache 2.0 license.