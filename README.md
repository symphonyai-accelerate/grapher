Ayasdi.Grapher
==============

WebGL/Canvas Network Graphing using PIXI.js.


Download
--------
Grapher comes bundled with PIXI.js and Underscore (v.1.6.0).

* [bundled](https://rawgit.com/ayasdi/grapher/master/build/grapher.js)
* [bundled-min](https://rawgit.com/ayasdi/grapher/master/build/grapher-min.js)

An unbundled version can be found in
[modules](https://github.com/ayasdi/grapher/tree/master/modules).
This version is useful if you are already using some of the dependencies or
are using a package management system.


Building
--------
To build Grapher, run the following command:

    npm run build

This will bundle modules/grapher.js with its dependencies and outputs the result to
grapher.js and grapher-min.js in the build folder.


Testing
-------
Unit tests are run using Jasmine with this command:

    npm run test

This also rebuilds grapher.js.


License
--------
Grapher.js may be freely distributed under the Apache 2.0 license.