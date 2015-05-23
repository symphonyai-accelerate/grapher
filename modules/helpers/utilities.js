/**
 * Utilities
 * =========
 *
 * Various utility functions
 */
var Utilities = module.exports = {
  each: each,
  eachPop: eachPop,
  eachKey: eachKey,
  map: map,
  clean: clean,
  range: range,
  sortedIndex: sortedIndex,
  indexOf: indexOf,
  uniqueInsert: uniqueInsert,
  extend: extend,
  bind: bind,
  noop: noop,
  isUndefined: isUndefined,
  isFunction: isFunction,
  isObject: isObject,
  isArray: Array.isArray,
  isNumber: isNumber,
  isNaN: isNaN
};

/**
 * noop
 * -----
 *
 * A function that does nothing.
 */
function noop () {}

/**
 * each
 * -----
 *
 * Perform an operation on each element in an array.
 *
 *     var arr = [1, 2, 3];
 *     u.each(arr, fn);
 */
function each (arr, fn, ctx) {
  fn = bind(fn, ctx);
  var i = arr.length;
  while (--i > -1) {
    fn(arr[i], i);
  }
  return arr;
}

/**
 * eachPop
 * -------
 *
 * Perform a function on each element in an array. Faster than each, but won't pass index and the
 * array will be cleared.
 *
 *     u.eachPop([1, 2, 3], fn);
 */
function eachPop (arr, fn, ctx) {
  fn = bind(fn, ctx);
  while (arr.length) {
    fn(arr.pop());
  }
  return arr;
}

/**
 * eachKey
 * -------
 *
 * Perform a function on each property in an object.
 *
 *     var obj = {foo: 0, bar: 0};
 *     u.eachKey(obj, fn);
 */
function eachKey (obj, fn, ctx) {
  fn = bind(fn, ctx);
  if (isObject(obj)) {
    var keys = Object.keys(obj);

    while (keys.length) {
      var key = keys.pop();
      fn(obj[key], key);
    }
  }
  return obj;
}

/**
 * map
 * -----
 *
 * Get a new array with values calculated from original array.
 *
 *     var arr = [1, 2, 3];
 *     var newArr = u.map(arr, fn);
 */
function map (arr, fn, ctx) {
  fn = bind(fn, ctx);
  var i = arr.length,
      mapped = new Array(i);
  while (--i > -1) {
    mapped[i] = fn(arr[i], i);
  }
  return mapped;
}

/**
 * clean
 * -----
 *
 * Clean an array by reference.
 *
 *     var arr = [1, 2, 3];
 *     u.clean(arr); // arr = []
 */
function clean (arr) {
  eachPop(arr, noop);
  return arr;
}

/**
 * range
 * -----
 *
 * Create an array of numbers from start to end, incremented by step.
 */
function range (start, end, step) {
  step = isNumber(step) ? step : 1;
  if (isUndefined(end)) {
    end = start;
    start = 0;
  }

  var i = Math.max(Math.ceil((end - start) / step), 0),
      result = new Array(i);

  while (--i > -1) {
    result[i] = start + (step * i);
  }
  return result;
}

/**
 * sortedIndex
 * -----------
 *
 * Finds the sorted position of a number in an Array of numbers.
 */
function sortedIndex (arr, n) {
  var min = 0,
      max = arr.length;

  while (min < max) {
    var mid = min + max >>> 1;
    if (n < arr[mid]) max = mid;
    else min = mid + 1;
  }

  return min;
}

/**
 * indexOf
 * -------
 *
 * Finds the index of a variable in an array.
 * Returns -1 if not found.
 */
function indexOf (arr, n) {
  var i = arr.length;
  while (--i > -1) {
    if (arr[i] === n) return i;
  }
  return i;
}

/**
 * uniqueInsert
 * ------------
 *
 * Inserts a value into an array only if it does not already exist
 * in the array.
 */
function uniqueInsert (arr, n) {
  if (indexOf(arr, n) === -1) arr.push(n);
  return arr;
}

/**
 * extend
 * ------
 *
 * Extend an object with the properties of one other objects
 */
function extend (obj, source) {
  if (isObject(obj) && isObject(source)) {
    var props = Object.getOwnPropertyNames(source),
      i = props.length;
    while (--i > -1) {
      var prop = props[i];
      obj[prop] = source[prop];
    }
  }
  return obj;
}

/**
   * bind
   * ----
   *
   * Bind a function to a context. Optionally pass in the number of arguments
   * which will use the faster fn.call if the number of arguments is 0, 1, or 2.
   */
function bind (fn, ctx) {
  if (!ctx) return fn;
  return function () { return fn.apply(ctx, arguments); };
}

/**
 * isUndefined
 * -----------
 *
 * Checks if a variable is undefined.
 */
function isUndefined (o) {
  return typeof o === 'undefined';
}

/**
 * isFunction
 * ----------
 *
 * Checks if a variable is a function.
 */
function isFunction (o) {
  return typeof o === 'function';
}

/**
 * isObject
 * --------
 *
 * Checks if a variable is an object.
 */
function isObject (o) {
  return typeof o === 'object' && !!o;
}

/**
 * isNumber
 * --------
 *
 * Checks if a variable is a number.
 */
function isNumber (o) {
  return typeof o === 'number';
}

/**
 * isNaN
 * -----
 *
 * Checks if a variable is NaN.
 */
function isNaN (o) {
  return isNumber(o) && o !== +o;
}
