module.exports =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(module) {module.export = {
	  link_vs: __webpack_require__(2),
	  link_fs: __webpack_require__(3),
	  node_vs: __webpack_require__(4),
	  node_fs: __webpack_require__(5)
	};

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(1)(module)))

/***/ },
/* 1 */
/***/ function(module, exports) {

	module.exports = function(module) {
		if(!module.webpackPolyfill) {
			module.deprecate = function() {};
			module.paths = [];
			// module.parent = undefined by default
			module.children = [];
			module.webpackPolyfill = 1;
		}
		return module;
	}


/***/ },
/* 2 */
/***/ function(module, exports) {

	module.exports = "#define GLSLIFY 1\nuniform vec2 u_resolution;\nattribute vec2 a_position;\nattribute vec4 a_rgba;\nvarying vec4 rgba;\nvoid main() {\n  vec2 clipspace = a_position / u_resolution * 2.0 - 1.0;\n  gl_Position = vec4(clipspace * vec2(1, -1), 0, 1);\n  rgba = a_rgba / 255.0;\n}"

/***/ },
/* 3 */
/***/ function(module, exports) {

	module.exports = "precision mediump float;\n#define GLSLIFY 1\nvarying vec4 rgba;\nvoid main() {\n  gl_FragColor = rgba;\n}\n"

/***/ },
/* 4 */
/***/ function(module, exports) {

	module.exports = "#define GLSLIFY 1\nuniform vec2 u_resolution;\nattribute vec2 a_position;\nattribute vec4 a_rgba;\nattribute vec2 a_center;\nattribute float a_radius;\nvarying vec4 rgba;\nvarying vec2 center;\nvarying vec2 resolution;\nvarying float radius;\nvoid main() {\n  vec2 clipspace = a_position / u_resolution * 2.0 - 1.0;\n  gl_Position = vec4(clipspace * vec2(1, -1), 0, 1);\n  rgba = a_rgba / 255.0;\n  radius = a_radius;\n  center = a_center;\n  resolution = u_resolution;\n}"

/***/ },
/* 5 */
/***/ function(module, exports) {

	module.exports = "precision mediump float;\n#define GLSLIFY 1\nvarying vec4 rgba;\nvarying vec2 center;\nvarying vec2 resolution;\nvarying float radius;\nvoid main() {\n  vec4 color0 = vec4(0.0, 0.0, 0.0, 0.0);\n  float x = gl_FragCoord.x;\n  float y = resolution[1] - gl_FragCoord.y;\n  float dx = center[0] - x;\n  float dy = center[1] - y;\n  float distance = sqrt(dx * dx + dy * dy);\n  float diff = distance - radius;\n  if ( diff < 0.0 )\n    gl_FragColor = rgba;\n  else if ( diff >= 0.0 && diff <= 1.0 )\n    gl_FragColor = vec4(rgba.r, rgba.g, rgba.b, rgba.a - diff);\n  else \n    gl_FragColor = color0;\n}"

/***/ }
/******/ ]);