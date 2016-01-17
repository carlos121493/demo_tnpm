/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(11);


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Buffer, global) {/*!
	 * The buffer module from node.js, for the browser.
	 *
	 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
	 * @license  MIT
	 */
	/* eslint-disable no-proto */
	
	'use strict';
	
	var base64 = __webpack_require__(2);
	var ieee754 = __webpack_require__(3);
	var isArray = __webpack_require__(4);
	
	exports.Buffer = Buffer;
	exports.SlowBuffer = SlowBuffer;
	exports.INSPECT_MAX_BYTES = 50;
	Buffer.poolSize = 8192; // not used by this implementation
	
	var rootParent = {};
	
	/**
	 * If `Buffer.TYPED_ARRAY_SUPPORT`:
	 *   === true    Use Uint8Array implementation (fastest)
	 *   === false   Use Object implementation (most compatible, even IE6)
	 *
	 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
	 * Opera 11.6+, iOS 4.2+.
	 *
	 * Due to various browser bugs, sometimes the Object implementation will be used even
	 * when the browser supports typed arrays.
	 *
	 * Note:
	 *
	 *   - Firefox 4-29 lacks support for adding new properties to `Uint8Array` instances,
	 *     See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
	 *
	 *   - Safari 5-7 lacks support for changing the `Object.prototype.constructor` property
	 *     on objects.
	 *
	 *   - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
	 *
	 *   - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
	 *     incorrect length in some situations.
	
	 * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they
	 * get the Object implementation, which is slower but behaves correctly.
	 */
	Buffer.TYPED_ARRAY_SUPPORT = global.TYPED_ARRAY_SUPPORT !== undefined ? global.TYPED_ARRAY_SUPPORT : typedArraySupport();
	
	function typedArraySupport() {
	  function Bar() {}
	  try {
	    var arr = new Uint8Array(1);
	    arr.foo = function () {
	      return 42;
	    };
	    arr.constructor = Bar;
	    return arr.foo() === 42 && // typed array instances can be augmented
	    arr.constructor === Bar && // constructor can be set
	    typeof arr.subarray === 'function' && // chrome 9-10 lack `subarray`
	    arr.subarray(1, 1).byteLength === 0 // ie10 has broken `subarray`
	    ;
	  } catch (e) {
	    return false;
	  }
	}
	
	function kMaxLength() {
	  return Buffer.TYPED_ARRAY_SUPPORT ? 2147483647 : 1073741823;
	}
	
	/**
	 * Class: Buffer
	 * =============
	 *
	 * The Buffer constructor returns instances of `Uint8Array` that are augmented
	 * with function properties for all the node `Buffer` API functions. We use
	 * `Uint8Array` so that square bracket notation works as expected -- it returns
	 * a single octet.
	 *
	 * By augmenting the instances, we can avoid modifying the `Uint8Array`
	 * prototype.
	 */
	function Buffer(arg) {
	  if (!(this instanceof Buffer)) {
	    // Avoid going through an ArgumentsAdaptorTrampoline in the common case.
	    if (arguments.length > 1) return new Buffer(arg, arguments[1]);
	    return new Buffer(arg);
	  }
	
	  if (!Buffer.TYPED_ARRAY_SUPPORT) {
	    this.length = 0;
	    this.parent = undefined;
	  }
	
	  // Common case.
	  if (typeof arg === 'number') {
	    return fromNumber(this, arg);
	  }
	
	  // Slightly less common case.
	  if (typeof arg === 'string') {
	    return fromString(this, arg, arguments.length > 1 ? arguments[1] : 'utf8');
	  }
	
	  // Unusual.
	  return fromObject(this, arg);
	}
	
	function fromNumber(that, length) {
	  that = allocate(that, length < 0 ? 0 : checked(length) | 0);
	  if (!Buffer.TYPED_ARRAY_SUPPORT) {
	    for (var i = 0; i < length; i++) {
	      that[i] = 0;
	    }
	  }
	  return that;
	}
	
	function fromString(that, string, encoding) {
	  if (typeof encoding !== 'string' || encoding === '') encoding = 'utf8';
	
	  // Assumption: byteLength() return value is always < kMaxLength.
	  var length = byteLength(string, encoding) | 0;
	  that = allocate(that, length);
	
	  that.write(string, encoding);
	  return that;
	}
	
	function fromObject(that, object) {
	  if (Buffer.isBuffer(object)) return fromBuffer(that, object);
	
	  if (isArray(object)) return fromArray(that, object);
	
	  if (object == null) {
	    throw new TypeError('must start with number, buffer, array or string');
	  }
	
	  if (typeof ArrayBuffer !== 'undefined') {
	    if (object.buffer instanceof ArrayBuffer) {
	      return fromTypedArray(that, object);
	    }
	    if (object instanceof ArrayBuffer) {
	      return fromArrayBuffer(that, object);
	    }
	  }
	
	  if (object.length) return fromArrayLike(that, object);
	
	  return fromJsonObject(that, object);
	}
	
	function fromBuffer(that, buffer) {
	  var length = checked(buffer.length) | 0;
	  that = allocate(that, length);
	  buffer.copy(that, 0, 0, length);
	  return that;
	}
	
	function fromArray(that, array) {
	  var length = checked(array.length) | 0;
	  that = allocate(that, length);
	  for (var i = 0; i < length; i += 1) {
	    that[i] = array[i] & 255;
	  }
	  return that;
	}
	
	// Duplicate of fromArray() to keep fromArray() monomorphic.
	function fromTypedArray(that, array) {
	  var length = checked(array.length) | 0;
	  that = allocate(that, length);
	  // Truncating the elements is probably not what people expect from typed
	  // arrays with BYTES_PER_ELEMENT > 1 but it's compatible with the behavior
	  // of the old Buffer constructor.
	  for (var i = 0; i < length; i += 1) {
	    that[i] = array[i] & 255;
	  }
	  return that;
	}
	
	function fromArrayBuffer(that, array) {
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    // Return an augmented `Uint8Array` instance, for best performance
	    array.byteLength;
	    that = Buffer._augment(new Uint8Array(array));
	  } else {
	    // Fallback: Return an object instance of the Buffer class
	    that = fromTypedArray(that, new Uint8Array(array));
	  }
	  return that;
	}
	
	function fromArrayLike(that, array) {
	  var length = checked(array.length) | 0;
	  that = allocate(that, length);
	  for (var i = 0; i < length; i += 1) {
	    that[i] = array[i] & 255;
	  }
	  return that;
	}
	
	// Deserialize { type: 'Buffer', data: [1,2,3,...] } into a Buffer object.
	// Returns a zero-length buffer for inputs that don't conform to the spec.
	function fromJsonObject(that, object) {
	  var array;
	  var length = 0;
	
	  if (object.type === 'Buffer' && isArray(object.data)) {
	    array = object.data;
	    length = checked(array.length) | 0;
	  }
	  that = allocate(that, length);
	
	  for (var i = 0; i < length; i += 1) {
	    that[i] = array[i] & 255;
	  }
	  return that;
	}
	
	if (Buffer.TYPED_ARRAY_SUPPORT) {
	  Buffer.prototype.__proto__ = Uint8Array.prototype;
	  Buffer.__proto__ = Uint8Array;
	} else {
	  // pre-set for values that may exist in the future
	  Buffer.prototype.length = undefined;
	  Buffer.prototype.parent = undefined;
	}
	
	function allocate(that, length) {
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    // Return an augmented `Uint8Array` instance, for best performance
	    that = Buffer._augment(new Uint8Array(length));
	    that.__proto__ = Buffer.prototype;
	  } else {
	    // Fallback: Return an object instance of the Buffer class
	    that.length = length;
	    that._isBuffer = true;
	  }
	
	  var fromPool = length !== 0 && length <= Buffer.poolSize >>> 1;
	  if (fromPool) that.parent = rootParent;
	
	  return that;
	}
	
	function checked(length) {
	  // Note: cannot use `length < kMaxLength` here because that fails when
	  // length is NaN (which is otherwise coerced to zero.)
	  if (length >= kMaxLength()) {
	    throw new RangeError('Attempt to allocate Buffer larger than maximum ' + 'size: 0x' + kMaxLength().toString(16) + ' bytes');
	  }
	  return length | 0;
	}
	
	function SlowBuffer(subject, encoding) {
	  if (!(this instanceof SlowBuffer)) return new SlowBuffer(subject, encoding);
	
	  var buf = new Buffer(subject, encoding);
	  delete buf.parent;
	  return buf;
	}
	
	Buffer.isBuffer = function isBuffer(b) {
	  return !!(b != null && b._isBuffer);
	};
	
	Buffer.compare = function compare(a, b) {
	  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
	    throw new TypeError('Arguments must be Buffers');
	  }
	
	  if (a === b) return 0;
	
	  var x = a.length;
	  var y = b.length;
	
	  var i = 0;
	  var len = Math.min(x, y);
	  while (i < len) {
	    if (a[i] !== b[i]) break;
	
	    ++i;
	  }
	
	  if (i !== len) {
	    x = a[i];
	    y = b[i];
	  }
	
	  if (x < y) return -1;
	  if (y < x) return 1;
	  return 0;
	};
	
	Buffer.isEncoding = function isEncoding(encoding) {
	  switch (String(encoding).toLowerCase()) {
	    case 'hex':
	    case 'utf8':
	    case 'utf-8':
	    case 'ascii':
	    case 'binary':
	    case 'base64':
	    case 'raw':
	    case 'ucs2':
	    case 'ucs-2':
	    case 'utf16le':
	    case 'utf-16le':
	      return true;
	    default:
	      return false;
	  }
	};
	
	Buffer.concat = function concat(list, length) {
	  if (!isArray(list)) throw new TypeError('list argument must be an Array of Buffers.');
	
	  if (list.length === 0) {
	    return new Buffer(0);
	  }
	
	  var i;
	  if (length === undefined) {
	    length = 0;
	    for (i = 0; i < list.length; i++) {
	      length += list[i].length;
	    }
	  }
	
	  var buf = new Buffer(length);
	  var pos = 0;
	  for (i = 0; i < list.length; i++) {
	    var item = list[i];
	    item.copy(buf, pos);
	    pos += item.length;
	  }
	  return buf;
	};
	
	function byteLength(string, encoding) {
	  if (typeof string !== 'string') string = '' + string;
	
	  var len = string.length;
	  if (len === 0) return 0;
	
	  // Use a for loop to avoid recursion
	  var loweredCase = false;
	  for (;;) {
	    switch (encoding) {
	      case 'ascii':
	      case 'binary':
	      // Deprecated
	      case 'raw':
	      case 'raws':
	        return len;
	      case 'utf8':
	      case 'utf-8':
	        return utf8ToBytes(string).length;
	      case 'ucs2':
	      case 'ucs-2':
	      case 'utf16le':
	      case 'utf-16le':
	        return len * 2;
	      case 'hex':
	        return len >>> 1;
	      case 'base64':
	        return base64ToBytes(string).length;
	      default:
	        if (loweredCase) return utf8ToBytes(string).length; // assume utf8
	        encoding = ('' + encoding).toLowerCase();
	        loweredCase = true;
	    }
	  }
	}
	Buffer.byteLength = byteLength;
	
	function slowToString(encoding, start, end) {
	  var loweredCase = false;
	
	  start = start | 0;
	  end = end === undefined || end === Infinity ? this.length : end | 0;
	
	  if (!encoding) encoding = 'utf8';
	  if (start < 0) start = 0;
	  if (end > this.length) end = this.length;
	  if (end <= start) return '';
	
	  while (true) {
	    switch (encoding) {
	      case 'hex':
	        return hexSlice(this, start, end);
	
	      case 'utf8':
	      case 'utf-8':
	        return utf8Slice(this, start, end);
	
	      case 'ascii':
	        return asciiSlice(this, start, end);
	
	      case 'binary':
	        return binarySlice(this, start, end);
	
	      case 'base64':
	        return base64Slice(this, start, end);
	
	      case 'ucs2':
	      case 'ucs-2':
	      case 'utf16le':
	      case 'utf-16le':
	        return utf16leSlice(this, start, end);
	
	      default:
	        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding);
	        encoding = (encoding + '').toLowerCase();
	        loweredCase = true;
	    }
	  }
	}
	
	Buffer.prototype.toString = function toString() {
	  var length = this.length | 0;
	  if (length === 0) return '';
	  if (arguments.length === 0) return utf8Slice(this, 0, length);
	  return slowToString.apply(this, arguments);
	};
	
	Buffer.prototype.equals = function equals(b) {
	  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer');
	  if (this === b) return true;
	  return Buffer.compare(this, b) === 0;
	};
	
	Buffer.prototype.inspect = function inspect() {
	  var str = '';
	  var max = exports.INSPECT_MAX_BYTES;
	  if (this.length > 0) {
	    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ');
	    if (this.length > max) str += ' ... ';
	  }
	  return '<Buffer ' + str + '>';
	};
	
	Buffer.prototype.compare = function compare(b) {
	  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer');
	  if (this === b) return 0;
	  return Buffer.compare(this, b);
	};
	
	Buffer.prototype.indexOf = function indexOf(val, byteOffset) {
	  if (byteOffset > 2147483647) byteOffset = 2147483647;else if (byteOffset < -2147483648) byteOffset = -2147483648;
	  byteOffset >>= 0;
	
	  if (this.length === 0) return -1;
	  if (byteOffset >= this.length) return -1;
	
	  // Negative offsets start from the end of the buffer
	  if (byteOffset < 0) byteOffset = Math.max(this.length + byteOffset, 0);
	
	  if (typeof val === 'string') {
	    if (val.length === 0) return -1; // special case: looking for empty string always fails
	    return String.prototype.indexOf.call(this, val, byteOffset);
	  }
	  if (Buffer.isBuffer(val)) {
	    return arrayIndexOf(this, val, byteOffset);
	  }
	  if (typeof val === 'number') {
	    if (Buffer.TYPED_ARRAY_SUPPORT && Uint8Array.prototype.indexOf === 'function') {
	      return Uint8Array.prototype.indexOf.call(this, val, byteOffset);
	    }
	    return arrayIndexOf(this, [val], byteOffset);
	  }
	
	  function arrayIndexOf(arr, val, byteOffset) {
	    var foundIndex = -1;
	    for (var i = 0; byteOffset + i < arr.length; i++) {
	      if (arr[byteOffset + i] === val[foundIndex === -1 ? 0 : i - foundIndex]) {
	        if (foundIndex === -1) foundIndex = i;
	        if (i - foundIndex + 1 === val.length) return byteOffset + foundIndex;
	      } else {
	        foundIndex = -1;
	      }
	    }
	    return -1;
	  }
	
	  throw new TypeError('val must be string, number or Buffer');
	};
	
	// `get` is deprecated
	Buffer.prototype.get = function get(offset) {
	  console.log('.get() is deprecated. Access using array indexes instead.');
	  return this.readUInt8(offset);
	};
	
	// `set` is deprecated
	Buffer.prototype.set = function set(v, offset) {
	  console.log('.set() is deprecated. Access using array indexes instead.');
	  return this.writeUInt8(v, offset);
	};
	
	function hexWrite(buf, string, offset, length) {
	  offset = Number(offset) || 0;
	  var remaining = buf.length - offset;
	  if (!length) {
	    length = remaining;
	  } else {
	    length = Number(length);
	    if (length > remaining) {
	      length = remaining;
	    }
	  }
	
	  // must be an even number of digits
	  var strLen = string.length;
	  if (strLen % 2 !== 0) throw new Error('Invalid hex string');
	
	  if (length > strLen / 2) {
	    length = strLen / 2;
	  }
	  for (var i = 0; i < length; i++) {
	    var parsed = parseInt(string.substr(i * 2, 2), 16);
	    if (isNaN(parsed)) throw new Error('Invalid hex string');
	    buf[offset + i] = parsed;
	  }
	  return i;
	}
	
	function utf8Write(buf, string, offset, length) {
	  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length);
	}
	
	function asciiWrite(buf, string, offset, length) {
	  return blitBuffer(asciiToBytes(string), buf, offset, length);
	}
	
	function binaryWrite(buf, string, offset, length) {
	  return asciiWrite(buf, string, offset, length);
	}
	
	function base64Write(buf, string, offset, length) {
	  return blitBuffer(base64ToBytes(string), buf, offset, length);
	}
	
	function ucs2Write(buf, string, offset, length) {
	  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length);
	}
	
	Buffer.prototype.write = function write(string, offset, length, encoding) {
	  // Buffer#write(string)
	  if (offset === undefined) {
	    encoding = 'utf8';
	    length = this.length;
	    offset = 0
	    // Buffer#write(string, encoding)
	    ;
	  } else if (length === undefined && typeof offset === 'string') {
	    encoding = offset;
	    length = this.length;
	    offset = 0
	    // Buffer#write(string, offset[, length][, encoding])
	    ;
	  } else if (isFinite(offset)) {
	    offset = offset | 0;
	    if (isFinite(length)) {
	      length = length | 0;
	      if (encoding === undefined) encoding = 'utf8';
	    } else {
	      encoding = length;
	      length = undefined;
	    }
	    // legacy write(string, encoding, offset, length) - remove in v0.13
	  } else {
	    var swap = encoding;
	    encoding = offset;
	    offset = length | 0;
	    length = swap;
	  }
	
	  var remaining = this.length - offset;
	  if (length === undefined || length > remaining) length = remaining;
	
	  if (string.length > 0 && (length < 0 || offset < 0) || offset > this.length) {
	    throw new RangeError('attempt to write outside buffer bounds');
	  }
	
	  if (!encoding) encoding = 'utf8';
	
	  var loweredCase = false;
	  for (;;) {
	    switch (encoding) {
	      case 'hex':
	        return hexWrite(this, string, offset, length);
	
	      case 'utf8':
	      case 'utf-8':
	        return utf8Write(this, string, offset, length);
	
	      case 'ascii':
	        return asciiWrite(this, string, offset, length);
	
	      case 'binary':
	        return binaryWrite(this, string, offset, length);
	
	      case 'base64':
	        // Warning: maxLength not taken into account in base64Write
	        return base64Write(this, string, offset, length);
	
	      case 'ucs2':
	      case 'ucs-2':
	      case 'utf16le':
	      case 'utf-16le':
	        return ucs2Write(this, string, offset, length);
	
	      default:
	        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding);
	        encoding = ('' + encoding).toLowerCase();
	        loweredCase = true;
	    }
	  }
	};
	
	Buffer.prototype.toJSON = function toJSON() {
	  return {
	    type: 'Buffer',
	    data: Array.prototype.slice.call(this._arr || this, 0)
	  };
	};
	
	function base64Slice(buf, start, end) {
	  if (start === 0 && end === buf.length) {
	    return base64.fromByteArray(buf);
	  } else {
	    return base64.fromByteArray(buf.slice(start, end));
	  }
	}
	
	function utf8Slice(buf, start, end) {
	  end = Math.min(buf.length, end);
	  var res = [];
	
	  var i = start;
	  while (i < end) {
	    var firstByte = buf[i];
	    var codePoint = null;
	    var bytesPerSequence = firstByte > 239 ? 4 : firstByte > 223 ? 3 : firstByte > 191 ? 2 : 1;
	
	    if (i + bytesPerSequence <= end) {
	      var secondByte, thirdByte, fourthByte, tempCodePoint;
	
	      switch (bytesPerSequence) {
	        case 1:
	          if (firstByte < 128) {
	            codePoint = firstByte;
	          }
	          break;
	        case 2:
	          secondByte = buf[i + 1];
	          if ((secondByte & 192) === 128) {
	            tempCodePoint = (firstByte & 31) << 6 | secondByte & 63;
	            if (tempCodePoint > 127) {
	              codePoint = tempCodePoint;
	            }
	          }
	          break;
	        case 3:
	          secondByte = buf[i + 1];
	          thirdByte = buf[i + 2];
	          if ((secondByte & 192) === 128 && (thirdByte & 192) === 128) {
	            tempCodePoint = (firstByte & 15) << 12 | (secondByte & 63) << 6 | thirdByte & 63;
	            if (tempCodePoint > 2047 && (tempCodePoint < 55296 || tempCodePoint > 57343)) {
	              codePoint = tempCodePoint;
	            }
	          }
	          break;
	        case 4:
	          secondByte = buf[i + 1];
	          thirdByte = buf[i + 2];
	          fourthByte = buf[i + 3];
	          if ((secondByte & 192) === 128 && (thirdByte & 192) === 128 && (fourthByte & 192) === 128) {
	            tempCodePoint = (firstByte & 15) << 18 | (secondByte & 63) << 12 | (thirdByte & 63) << 6 | fourthByte & 63;
	            if (tempCodePoint > 65535 && tempCodePoint < 1114112) {
	              codePoint = tempCodePoint;
	            }
	          }
	      }
	    }
	
	    if (codePoint === null) {
	      // we did not generate a valid codePoint so insert a
	      // replacement char (U+FFFD) and advance only 1 byte
	      codePoint = 65533;
	      bytesPerSequence = 1;
	    } else if (codePoint > 65535) {
	      // encode to utf16 (surrogate pair dance)
	      codePoint -= 65536;
	      res.push(codePoint >>> 10 & 1023 | 55296);
	      codePoint = 56320 | codePoint & 1023;
	    }
	
	    res.push(codePoint);
	    i += bytesPerSequence;
	  }
	
	  return decodeCodePointsArray(res);
	}
	
	// Based on http://stackoverflow.com/a/22747272/680742, the browser with
	// the lowest limit is Chrome, with 0x10000 args.
	// We go 1 magnitude less, for safety
	var MAX_ARGUMENTS_LENGTH = 4096;
	
	function decodeCodePointsArray(codePoints) {
	  var len = codePoints.length;
	  if (len <= MAX_ARGUMENTS_LENGTH) {
	    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
	    ;
	  }
	
	  // Decode in chunks to avoid "call stack size exceeded".
	  var res = '';
	  var i = 0;
	  while (i < len) {
	    res += String.fromCharCode.apply(String, codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH));
	  }
	  return res;
	}
	
	function asciiSlice(buf, start, end) {
	  var ret = '';
	  end = Math.min(buf.length, end);
	
	  for (var i = start; i < end; i++) {
	    ret += String.fromCharCode(buf[i] & 127);
	  }
	  return ret;
	}
	
	function binarySlice(buf, start, end) {
	  var ret = '';
	  end = Math.min(buf.length, end);
	
	  for (var i = start; i < end; i++) {
	    ret += String.fromCharCode(buf[i]);
	  }
	  return ret;
	}
	
	function hexSlice(buf, start, end) {
	  var len = buf.length;
	
	  if (!start || start < 0) start = 0;
	  if (!end || end < 0 || end > len) end = len;
	
	  var out = '';
	  for (var i = start; i < end; i++) {
	    out += toHex(buf[i]);
	  }
	  return out;
	}
	
	function utf16leSlice(buf, start, end) {
	  var bytes = buf.slice(start, end);
	  var res = '';
	  for (var i = 0; i < bytes.length; i += 2) {
	    res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256);
	  }
	  return res;
	}
	
	Buffer.prototype.slice = function slice(start, end) {
	  var len = this.length;
	  start = ~ ~start;
	  end = end === undefined ? len : ~ ~end;
	
	  if (start < 0) {
	    start += len;
	    if (start < 0) start = 0;
	  } else if (start > len) {
	    start = len;
	  }
	
	  if (end < 0) {
	    end += len;
	    if (end < 0) end = 0;
	  } else if (end > len) {
	    end = len;
	  }
	
	  if (end < start) end = start;
	
	  var newBuf;
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    newBuf = Buffer._augment(this.subarray(start, end));
	  } else {
	    var sliceLen = end - start;
	    newBuf = new Buffer(sliceLen, undefined);
	    for (var i = 0; i < sliceLen; i++) {
	      newBuf[i] = this[i + start];
	    }
	  }
	
	  if (newBuf.length) newBuf.parent = this.parent || this;
	
	  return newBuf;
	};
	
	/*
	 * Need to make sure that buffer isn't trying to write out of bounds.
	 */
	function checkOffset(offset, ext, length) {
	  if (offset % 1 !== 0 || offset < 0) throw new RangeError('offset is not uint');
	  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length');
	}
	
	Buffer.prototype.readUIntLE = function readUIntLE(offset, byteLength, noAssert) {
	  offset = offset | 0;
	  byteLength = byteLength | 0;
	  if (!noAssert) checkOffset(offset, byteLength, this.length);
	
	  var val = this[offset];
	  var mul = 1;
	  var i = 0;
	  while (++i < byteLength && (mul *= 256)) {
	    val += this[offset + i] * mul;
	  }
	
	  return val;
	};
	
	Buffer.prototype.readUIntBE = function readUIntBE(offset, byteLength, noAssert) {
	  offset = offset | 0;
	  byteLength = byteLength | 0;
	  if (!noAssert) {
	    checkOffset(offset, byteLength, this.length);
	  }
	
	  var val = this[offset + --byteLength];
	  var mul = 1;
	  while (byteLength > 0 && (mul *= 256)) {
	    val += this[offset + --byteLength] * mul;
	  }
	
	  return val;
	};
	
	Buffer.prototype.readUInt8 = function readUInt8(offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 1, this.length);
	  return this[offset];
	};
	
	Buffer.prototype.readUInt16LE = function readUInt16LE(offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 2, this.length);
	  return this[offset] | this[offset + 1] << 8;
	};
	
	Buffer.prototype.readUInt16BE = function readUInt16BE(offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 2, this.length);
	  return this[offset] << 8 | this[offset + 1];
	};
	
	Buffer.prototype.readUInt32LE = function readUInt32LE(offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length);
	
	  return (this[offset] | this[offset + 1] << 8 | this[offset + 2] << 16) + this[offset + 3] * 16777216;
	};
	
	Buffer.prototype.readUInt32BE = function readUInt32BE(offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length);
	
	  return this[offset] * 16777216 + (this[offset + 1] << 16 | this[offset + 2] << 8 | this[offset + 3]);
	};
	
	Buffer.prototype.readIntLE = function readIntLE(offset, byteLength, noAssert) {
	  offset = offset | 0;
	  byteLength = byteLength | 0;
	  if (!noAssert) checkOffset(offset, byteLength, this.length);
	
	  var val = this[offset];
	  var mul = 1;
	  var i = 0;
	  while (++i < byteLength && (mul *= 256)) {
	    val += this[offset + i] * mul;
	  }
	  mul *= 128;
	
	  if (val >= mul) val -= Math.pow(2, 8 * byteLength);
	
	  return val;
	};
	
	Buffer.prototype.readIntBE = function readIntBE(offset, byteLength, noAssert) {
	  offset = offset | 0;
	  byteLength = byteLength | 0;
	  if (!noAssert) checkOffset(offset, byteLength, this.length);
	
	  var i = byteLength;
	  var mul = 1;
	  var val = this[offset + --i];
	  while (i > 0 && (mul *= 256)) {
	    val += this[offset + --i] * mul;
	  }
	  mul *= 128;
	
	  if (val >= mul) val -= Math.pow(2, 8 * byteLength);
	
	  return val;
	};
	
	Buffer.prototype.readInt8 = function readInt8(offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 1, this.length);
	  if (!(this[offset] & 128)) return this[offset];
	  return (255 - this[offset] + 1) * -1;
	};
	
	Buffer.prototype.readInt16LE = function readInt16LE(offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 2, this.length);
	  var val = this[offset] | this[offset + 1] << 8;
	  return val & 32768 ? val | 4294901760 : val;
	};
	
	Buffer.prototype.readInt16BE = function readInt16BE(offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 2, this.length);
	  var val = this[offset + 1] | this[offset] << 8;
	  return val & 32768 ? val | 4294901760 : val;
	};
	
	Buffer.prototype.readInt32LE = function readInt32LE(offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length);
	
	  return this[offset] | this[offset + 1] << 8 | this[offset + 2] << 16 | this[offset + 3] << 24;
	};
	
	Buffer.prototype.readInt32BE = function readInt32BE(offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length);
	
	  return this[offset] << 24 | this[offset + 1] << 16 | this[offset + 2] << 8 | this[offset + 3];
	};
	
	Buffer.prototype.readFloatLE = function readFloatLE(offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length);
	  return ieee754.read(this, offset, true, 23, 4);
	};
	
	Buffer.prototype.readFloatBE = function readFloatBE(offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length);
	  return ieee754.read(this, offset, false, 23, 4);
	};
	
	Buffer.prototype.readDoubleLE = function readDoubleLE(offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 8, this.length);
	  return ieee754.read(this, offset, true, 52, 8);
	};
	
	Buffer.prototype.readDoubleBE = function readDoubleBE(offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 8, this.length);
	  return ieee754.read(this, offset, false, 52, 8);
	};
	
	function checkInt(buf, value, offset, ext, max, min) {
	  if (!Buffer.isBuffer(buf)) throw new TypeError('buffer must be a Buffer instance');
	  if (value > max || value < min) throw new RangeError('value is out of bounds');
	  if (offset + ext > buf.length) throw new RangeError('index out of range');
	}
	
	Buffer.prototype.writeUIntLE = function writeUIntLE(value, offset, byteLength, noAssert) {
	  value = +value;
	  offset = offset | 0;
	  byteLength = byteLength | 0;
	  if (!noAssert) checkInt(this, value, offset, byteLength, Math.pow(2, 8 * byteLength), 0);
	
	  var mul = 1;
	  var i = 0;
	  this[offset] = value & 255;
	  while (++i < byteLength && (mul *= 256)) {
	    this[offset + i] = value / mul & 255;
	  }
	
	  return offset + byteLength;
	};
	
	Buffer.prototype.writeUIntBE = function writeUIntBE(value, offset, byteLength, noAssert) {
	  value = +value;
	  offset = offset | 0;
	  byteLength = byteLength | 0;
	  if (!noAssert) checkInt(this, value, offset, byteLength, Math.pow(2, 8 * byteLength), 0);
	
	  var i = byteLength - 1;
	  var mul = 1;
	  this[offset + i] = value & 255;
	  while (--i >= 0 && (mul *= 256)) {
	    this[offset + i] = value / mul & 255;
	  }
	
	  return offset + byteLength;
	};
	
	Buffer.prototype.writeUInt8 = function writeUInt8(value, offset, noAssert) {
	  value = +value;
	  offset = offset | 0;
	  if (!noAssert) checkInt(this, value, offset, 1, 255, 0);
	  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value);
	  this[offset] = value & 255;
	  return offset + 1;
	};
	
	function objectWriteUInt16(buf, value, offset, littleEndian) {
	  if (value < 0) value = 65535 + value + 1;
	  for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; i++) {
	    buf[offset + i] = (value & 255 << 8 * (littleEndian ? i : 1 - i)) >>> (littleEndian ? i : 1 - i) * 8;
	  }
	}
	
	Buffer.prototype.writeUInt16LE = function writeUInt16LE(value, offset, noAssert) {
	  value = +value;
	  offset = offset | 0;
	  if (!noAssert) checkInt(this, value, offset, 2, 65535, 0);
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = value & 255;
	    this[offset + 1] = value >>> 8;
	  } else {
	    objectWriteUInt16(this, value, offset, true);
	  }
	  return offset + 2;
	};
	
	Buffer.prototype.writeUInt16BE = function writeUInt16BE(value, offset, noAssert) {
	  value = +value;
	  offset = offset | 0;
	  if (!noAssert) checkInt(this, value, offset, 2, 65535, 0);
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = value >>> 8;
	    this[offset + 1] = value & 255;
	  } else {
	    objectWriteUInt16(this, value, offset, false);
	  }
	  return offset + 2;
	};
	
	function objectWriteUInt32(buf, value, offset, littleEndian) {
	  if (value < 0) value = 4294967295 + value + 1;
	  for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; i++) {
	    buf[offset + i] = value >>> (littleEndian ? i : 3 - i) * 8 & 255;
	  }
	}
	
	Buffer.prototype.writeUInt32LE = function writeUInt32LE(value, offset, noAssert) {
	  value = +value;
	  offset = offset | 0;
	  if (!noAssert) checkInt(this, value, offset, 4, 4294967295, 0);
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset + 3] = value >>> 24;
	    this[offset + 2] = value >>> 16;
	    this[offset + 1] = value >>> 8;
	    this[offset] = value & 255;
	  } else {
	    objectWriteUInt32(this, value, offset, true);
	  }
	  return offset + 4;
	};
	
	Buffer.prototype.writeUInt32BE = function writeUInt32BE(value, offset, noAssert) {
	  value = +value;
	  offset = offset | 0;
	  if (!noAssert) checkInt(this, value, offset, 4, 4294967295, 0);
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = value >>> 24;
	    this[offset + 1] = value >>> 16;
	    this[offset + 2] = value >>> 8;
	    this[offset + 3] = value & 255;
	  } else {
	    objectWriteUInt32(this, value, offset, false);
	  }
	  return offset + 4;
	};
	
	Buffer.prototype.writeIntLE = function writeIntLE(value, offset, byteLength, noAssert) {
	  value = +value;
	  offset = offset | 0;
	  if (!noAssert) {
	    var limit = Math.pow(2, 8 * byteLength - 1);
	
	    checkInt(this, value, offset, byteLength, limit - 1, -limit);
	  }
	
	  var i = 0;
	  var mul = 1;
	  var sub = value < 0 ? 1 : 0;
	  this[offset] = value & 255;
	  while (++i < byteLength && (mul *= 256)) {
	    this[offset + i] = (value / mul >> 0) - sub & 255;
	  }
	
	  return offset + byteLength;
	};
	
	Buffer.prototype.writeIntBE = function writeIntBE(value, offset, byteLength, noAssert) {
	  value = +value;
	  offset = offset | 0;
	  if (!noAssert) {
	    var limit = Math.pow(2, 8 * byteLength - 1);
	
	    checkInt(this, value, offset, byteLength, limit - 1, -limit);
	  }
	
	  var i = byteLength - 1;
	  var mul = 1;
	  var sub = value < 0 ? 1 : 0;
	  this[offset + i] = value & 255;
	  while (--i >= 0 && (mul *= 256)) {
	    this[offset + i] = (value / mul >> 0) - sub & 255;
	  }
	
	  return offset + byteLength;
	};
	
	Buffer.prototype.writeInt8 = function writeInt8(value, offset, noAssert) {
	  value = +value;
	  offset = offset | 0;
	  if (!noAssert) checkInt(this, value, offset, 1, 127, -128);
	  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value);
	  if (value < 0) value = 255 + value + 1;
	  this[offset] = value & 255;
	  return offset + 1;
	};
	
	Buffer.prototype.writeInt16LE = function writeInt16LE(value, offset, noAssert) {
	  value = +value;
	  offset = offset | 0;
	  if (!noAssert) checkInt(this, value, offset, 2, 32767, -32768);
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = value & 255;
	    this[offset + 1] = value >>> 8;
	  } else {
	    objectWriteUInt16(this, value, offset, true);
	  }
	  return offset + 2;
	};
	
	Buffer.prototype.writeInt16BE = function writeInt16BE(value, offset, noAssert) {
	  value = +value;
	  offset = offset | 0;
	  if (!noAssert) checkInt(this, value, offset, 2, 32767, -32768);
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = value >>> 8;
	    this[offset + 1] = value & 255;
	  } else {
	    objectWriteUInt16(this, value, offset, false);
	  }
	  return offset + 2;
	};
	
	Buffer.prototype.writeInt32LE = function writeInt32LE(value, offset, noAssert) {
	  value = +value;
	  offset = offset | 0;
	  if (!noAssert) checkInt(this, value, offset, 4, 2147483647, -2147483648);
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = value & 255;
	    this[offset + 1] = value >>> 8;
	    this[offset + 2] = value >>> 16;
	    this[offset + 3] = value >>> 24;
	  } else {
	    objectWriteUInt32(this, value, offset, true);
	  }
	  return offset + 4;
	};
	
	Buffer.prototype.writeInt32BE = function writeInt32BE(value, offset, noAssert) {
	  value = +value;
	  offset = offset | 0;
	  if (!noAssert) checkInt(this, value, offset, 4, 2147483647, -2147483648);
	  if (value < 0) value = 4294967295 + value + 1;
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = value >>> 24;
	    this[offset + 1] = value >>> 16;
	    this[offset + 2] = value >>> 8;
	    this[offset + 3] = value & 255;
	  } else {
	    objectWriteUInt32(this, value, offset, false);
	  }
	  return offset + 4;
	};
	
	function checkIEEE754(buf, value, offset, ext, max, min) {
	  if (value > max || value < min) throw new RangeError('value is out of bounds');
	  if (offset + ext > buf.length) throw new RangeError('index out of range');
	  if (offset < 0) throw new RangeError('index out of range');
	}
	
	function writeFloat(buf, value, offset, littleEndian, noAssert) {
	  if (!noAssert) {
	    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38);
	  }
	  ieee754.write(buf, value, offset, littleEndian, 23, 4);
	  return offset + 4;
	}
	
	Buffer.prototype.writeFloatLE = function writeFloatLE(value, offset, noAssert) {
	  return writeFloat(this, value, offset, true, noAssert);
	};
	
	Buffer.prototype.writeFloatBE = function writeFloatBE(value, offset, noAssert) {
	  return writeFloat(this, value, offset, false, noAssert);
	};
	
	function writeDouble(buf, value, offset, littleEndian, noAssert) {
	  if (!noAssert) {
	    checkIEEE754(buf, value, offset, 8, 1.7976931348623157e+308, -1.7976931348623157e+308);
	  }
	  ieee754.write(buf, value, offset, littleEndian, 52, 8);
	  return offset + 8;
	}
	
	Buffer.prototype.writeDoubleLE = function writeDoubleLE(value, offset, noAssert) {
	  return writeDouble(this, value, offset, true, noAssert);
	};
	
	Buffer.prototype.writeDoubleBE = function writeDoubleBE(value, offset, noAssert) {
	  return writeDouble(this, value, offset, false, noAssert);
	};
	
	// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
	Buffer.prototype.copy = function copy(target, targetStart, start, end) {
	  if (!start) start = 0;
	  if (!end && end !== 0) end = this.length;
	  if (targetStart >= target.length) targetStart = target.length;
	  if (!targetStart) targetStart = 0;
	  if (end > 0 && end < start) end = start;
	
	  // Copy 0 bytes; we're done
	  if (end === start) return 0;
	  if (target.length === 0 || this.length === 0) return 0;
	
	  // Fatal error conditions
	  if (targetStart < 0) {
	    throw new RangeError('targetStart out of bounds');
	  }
	  if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds');
	  if (end < 0) throw new RangeError('sourceEnd out of bounds');
	
	  // Are we oob?
	  if (end > this.length) end = this.length;
	  if (target.length - targetStart < end - start) {
	    end = target.length - targetStart + start;
	  }
	
	  var len = end - start;
	  var i;
	
	  if (this === target && start < targetStart && targetStart < end) {
	    // descending copy from end
	    for (i = len - 1; i >= 0; i--) {
	      target[i + targetStart] = this[i + start];
	    }
	  } else if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
	    // ascending copy from start
	    for (i = 0; i < len; i++) {
	      target[i + targetStart] = this[i + start];
	    }
	  } else {
	    target._set(this.subarray(start, start + len), targetStart);
	  }
	
	  return len;
	};
	
	// fill(value, start=0, end=buffer.length)
	Buffer.prototype.fill = function fill(value, start, end) {
	  if (!value) value = 0;
	  if (!start) start = 0;
	  if (!end) end = this.length;
	
	  if (end < start) throw new RangeError('end < start');
	
	  // Fill 0 bytes; we're done
	  if (end === start) return;
	  if (this.length === 0) return;
	
	  if (start < 0 || start >= this.length) throw new RangeError('start out of bounds');
	  if (end < 0 || end > this.length) throw new RangeError('end out of bounds');
	
	  var i;
	  if (typeof value === 'number') {
	    for (i = start; i < end; i++) {
	      this[i] = value;
	    }
	  } else {
	    var bytes = utf8ToBytes(value.toString());
	    var len = bytes.length;
	    for (i = start; i < end; i++) {
	      this[i] = bytes[i % len];
	    }
	  }
	
	  return this;
	};
	
	/**
	 * Creates a new `ArrayBuffer` with the *copied* memory of the buffer instance.
	 * Added in Node 0.12. Only available in browsers that support ArrayBuffer.
	 */
	Buffer.prototype.toArrayBuffer = function toArrayBuffer() {
	  if (typeof Uint8Array !== 'undefined') {
	    if (Buffer.TYPED_ARRAY_SUPPORT) {
	      return new Buffer(this).buffer;
	    } else {
	      var buf = new Uint8Array(this.length);
	      for (var i = 0, len = buf.length; i < len; i += 1) {
	        buf[i] = this[i];
	      }
	      return buf.buffer;
	    }
	  } else {
	    throw new TypeError('Buffer.toArrayBuffer not supported in this browser');
	  }
	};
	
	// HELPER FUNCTIONS
	// ================
	
	var BP = Buffer.prototype;
	
	/**
	 * Augment a Uint8Array *instance* (not the Uint8Array class!) with Buffer methods
	 */
	Buffer._augment = function _augment(arr) {
	  arr.constructor = Buffer;
	  arr._isBuffer = true;
	
	  // save reference to original Uint8Array set method before overwriting
	  arr._set = arr.set;
	
	  // deprecated
	  arr.get = BP.get;
	  arr.set = BP.set;
	
	  arr.write = BP.write;
	  arr.toString = BP.toString;
	  arr.toLocaleString = BP.toString;
	  arr.toJSON = BP.toJSON;
	  arr.equals = BP.equals;
	  arr.compare = BP.compare;
	  arr.indexOf = BP.indexOf;
	  arr.copy = BP.copy;
	  arr.slice = BP.slice;
	  arr.readUIntLE = BP.readUIntLE;
	  arr.readUIntBE = BP.readUIntBE;
	  arr.readUInt8 = BP.readUInt8;
	  arr.readUInt16LE = BP.readUInt16LE;
	  arr.readUInt16BE = BP.readUInt16BE;
	  arr.readUInt32LE = BP.readUInt32LE;
	  arr.readUInt32BE = BP.readUInt32BE;
	  arr.readIntLE = BP.readIntLE;
	  arr.readIntBE = BP.readIntBE;
	  arr.readInt8 = BP.readInt8;
	  arr.readInt16LE = BP.readInt16LE;
	  arr.readInt16BE = BP.readInt16BE;
	  arr.readInt32LE = BP.readInt32LE;
	  arr.readInt32BE = BP.readInt32BE;
	  arr.readFloatLE = BP.readFloatLE;
	  arr.readFloatBE = BP.readFloatBE;
	  arr.readDoubleLE = BP.readDoubleLE;
	  arr.readDoubleBE = BP.readDoubleBE;
	  arr.writeUInt8 = BP.writeUInt8;
	  arr.writeUIntLE = BP.writeUIntLE;
	  arr.writeUIntBE = BP.writeUIntBE;
	  arr.writeUInt16LE = BP.writeUInt16LE;
	  arr.writeUInt16BE = BP.writeUInt16BE;
	  arr.writeUInt32LE = BP.writeUInt32LE;
	  arr.writeUInt32BE = BP.writeUInt32BE;
	  arr.writeIntLE = BP.writeIntLE;
	  arr.writeIntBE = BP.writeIntBE;
	  arr.writeInt8 = BP.writeInt8;
	  arr.writeInt16LE = BP.writeInt16LE;
	  arr.writeInt16BE = BP.writeInt16BE;
	  arr.writeInt32LE = BP.writeInt32LE;
	  arr.writeInt32BE = BP.writeInt32BE;
	  arr.writeFloatLE = BP.writeFloatLE;
	  arr.writeFloatBE = BP.writeFloatBE;
	  arr.writeDoubleLE = BP.writeDoubleLE;
	  arr.writeDoubleBE = BP.writeDoubleBE;
	  arr.fill = BP.fill;
	  arr.inspect = BP.inspect;
	  arr.toArrayBuffer = BP.toArrayBuffer;
	
	  return arr;
	};
	
	var INVALID_BASE64_RE = /[^+\/0-9A-Za-z-_]/g;
	
	function base64clean(str) {
	  // Node strips out invalid characters like \n and \t from the string, base64-js does not
	  str = stringtrim(str).replace(INVALID_BASE64_RE, '');
	  // Node converts strings with length < 2 to ''
	  if (str.length < 2) return '';
	  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
	  while (str.length % 4 !== 0) {
	    str = str + '=';
	  }
	  return str;
	}
	
	function stringtrim(str) {
	  if (str.trim) return str.trim();
	  return str.replace(/^\s+|\s+$/g, '');
	}
	
	function toHex(n) {
	  if (n < 16) return '0' + n.toString(16);
	  return n.toString(16);
	}
	
	function utf8ToBytes(string, units) {
	  units = units || Infinity;
	  var codePoint;
	  var length = string.length;
	  var leadSurrogate = null;
	  var bytes = [];
	
	  for (var i = 0; i < length; i++) {
	    codePoint = string.charCodeAt(i);
	
	    // is surrogate component
	    if (codePoint > 55295 && codePoint < 57344) {
	      // last char was a lead
	      if (!leadSurrogate) {
	        // no lead yet
	        if (codePoint > 56319) {
	          // unexpected trail
	          if ((units -= 3) > -1) bytes.push(239, 191, 189);
	          continue;
	        } else if (i + 1 === length) {
	          // unpaired lead
	          if ((units -= 3) > -1) bytes.push(239, 191, 189);
	          continue;
	        }
	
	        // valid lead
	        leadSurrogate = codePoint;
	
	        continue;
	      }
	
	      // 2 leads in a row
	      if (codePoint < 56320) {
	        if ((units -= 3) > -1) bytes.push(239, 191, 189);
	        leadSurrogate = codePoint;
	        continue;
	      }
	
	      // valid surrogate pair
	      codePoint = (leadSurrogate - 55296 << 10 | codePoint - 56320) + 65536;
	    } else if (leadSurrogate) {
	      // valid bmp char, but last char was a lead
	      if ((units -= 3) > -1) bytes.push(239, 191, 189);
	    }
	
	    leadSurrogate = null;
	
	    // encode utf8
	    if (codePoint < 128) {
	      if ((units -= 1) < 0) break;
	      bytes.push(codePoint);
	    } else if (codePoint < 2048) {
	      if ((units -= 2) < 0) break;
	      bytes.push(codePoint >> 6 | 192, codePoint & 63 | 128);
	    } else if (codePoint < 65536) {
	      if ((units -= 3) < 0) break;
	      bytes.push(codePoint >> 12 | 224, codePoint >> 6 & 63 | 128, codePoint & 63 | 128);
	    } else if (codePoint < 1114112) {
	      if ((units -= 4) < 0) break;
	      bytes.push(codePoint >> 18 | 240, codePoint >> 12 & 63 | 128, codePoint >> 6 & 63 | 128, codePoint & 63 | 128);
	    } else {
	      throw new Error('Invalid code point');
	    }
	  }
	
	  return bytes;
	}
	
	function asciiToBytes(str) {
	  var byteArray = [];
	  for (var i = 0; i < str.length; i++) {
	    // Node's code seems to be doing this and not & 0x7F..
	    byteArray.push(str.charCodeAt(i) & 255);
	  }
	  return byteArray;
	}
	
	function utf16leToBytes(str, units) {
	  var c, hi, lo;
	  var byteArray = [];
	  for (var i = 0; i < str.length; i++) {
	    if ((units -= 2) < 0) break;
	
	    c = str.charCodeAt(i);
	    hi = c >> 8;
	    lo = c % 256;
	    byteArray.push(lo);
	    byteArray.push(hi);
	  }
	
	  return byteArray;
	}
	
	function base64ToBytes(str) {
	  return base64.toByteArray(base64clean(str));
	}
	
	function blitBuffer(src, dst, offset, length) {
	  for (var i = 0; i < length; i++) {
	    if (i + offset >= dst.length || i >= src.length) break;
	    dst[i + offset] = src[i];
	  }
	  return i;
	}
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(1).Buffer, (function() { return this; }())))

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var lookup = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
	
	;(function (exports) {
		'use strict';
	
		var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array;
	
		var PLUS = '+'.charCodeAt(0);
		var SLASH = '/'.charCodeAt(0);
		var NUMBER = '0'.charCodeAt(0);
		var LOWER = 'a'.charCodeAt(0);
		var UPPER = 'A'.charCodeAt(0);
		var PLUS_URL_SAFE = '-'.charCodeAt(0);
		var SLASH_URL_SAFE = '_'.charCodeAt(0);
	
		function decode(elt) {
			var code = elt.charCodeAt(0);
			if (code === PLUS || code === PLUS_URL_SAFE) return 62; // '+'
			if (code === SLASH || code === SLASH_URL_SAFE) return 63; // '/'
			if (code < NUMBER) return -1; //no match
			if (code < NUMBER + 10) return code - NUMBER + 26 + 26;
			if (code < UPPER + 26) return code - UPPER;
			if (code < LOWER + 26) return code - LOWER + 26;
		}
	
		function b64ToByteArray(b64) {
			var i, j, l, tmp, placeHolders, arr;
	
			if (b64.length % 4 > 0) {
				throw new Error('Invalid string. Length must be a multiple of 4');
			}
	
			// the number of equal signs (place holders)
			// if there are two placeholders, than the two characters before it
			// represent one byte
			// if there is only one, then the three characters before it represent 2 bytes
			// this is just a cheap hack to not do indexOf twice
			var len = b64.length;
			placeHolders = '=' === b64.charAt(len - 2) ? 2 : '=' === b64.charAt(len - 1) ? 1 : 0;
	
			// base64 is 4/3 + up to two characters of the original data
			arr = new Arr(b64.length * 3 / 4 - placeHolders);
	
			// if there are placeholders, only get up to the last complete 4 chars
			l = placeHolders > 0 ? b64.length - 4 : b64.length;
	
			var L = 0;
	
			function push(v) {
				arr[L++] = v;
			}
	
			for (i = 0, j = 0; i < l; i += 4, j += 3) {
				tmp = decode(b64.charAt(i)) << 18 | decode(b64.charAt(i + 1)) << 12 | decode(b64.charAt(i + 2)) << 6 | decode(b64.charAt(i + 3));
				push((tmp & 16711680) >> 16);
				push((tmp & 65280) >> 8);
				push(tmp & 255);
			}
	
			if (placeHolders === 2) {
				tmp = decode(b64.charAt(i)) << 2 | decode(b64.charAt(i + 1)) >> 4;
				push(tmp & 255);
			} else if (placeHolders === 1) {
				tmp = decode(b64.charAt(i)) << 10 | decode(b64.charAt(i + 1)) << 4 | decode(b64.charAt(i + 2)) >> 2;
				push(tmp >> 8 & 255);
				push(tmp & 255);
			}
	
			return arr;
		}
	
		function uint8ToBase64(uint8) {
			var i,
			    extraBytes = uint8.length % 3,
			    // if we have 1 byte left, pad 2 bytes
			output = '',
			    temp,
			    length;
	
			function encode(num) {
				return lookup.charAt(num);
			}
	
			function tripletToBase64(num) {
				return encode(num >> 18 & 63) + encode(num >> 12 & 63) + encode(num >> 6 & 63) + encode(num & 63);
			}
	
			// go through the array every three bytes, we'll deal with trailing stuff later
			for (i = 0, length = uint8.length - extraBytes; i < length; i += 3) {
				temp = (uint8[i] << 16) + (uint8[i + 1] << 8) + uint8[i + 2];
				output += tripletToBase64(temp);
			}
	
			// pad the end with zeros, but make sure to not forget the extra bytes
			switch (extraBytes) {
				case 1:
					temp = uint8[uint8.length - 1];
					output += encode(temp >> 2);
					output += encode(temp << 4 & 63);
					output += '==';
					break;
				case 2:
					temp = (uint8[uint8.length - 2] << 8) + uint8[uint8.length - 1];
					output += encode(temp >> 10);
					output += encode(temp >> 4 & 63);
					output += encode(temp << 2 & 63);
					output += '=';
					break;
			}
	
			return output;
		}
	
		exports.toByteArray = b64ToByteArray;
		exports.fromByteArray = uint8ToBase64;
	})( false ? undefined.base64js = {} : exports);

/***/ },
/* 3 */
/***/ function(module, exports) {

	"use strict";
	
	exports.read = function (buffer, offset, isLE, mLen, nBytes) {
	  var e, m;
	  var eLen = nBytes * 8 - mLen - 1;
	  var eMax = (1 << eLen) - 1;
	  var eBias = eMax >> 1;
	  var nBits = -7;
	  var i = isLE ? nBytes - 1 : 0;
	  var d = isLE ? -1 : 1;
	  var s = buffer[offset + i];
	
	  i += d;
	
	  e = s & (1 << -nBits) - 1;
	  s >>= -nBits;
	  nBits += eLen;
	  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}
	
	  m = e & (1 << -nBits) - 1;
	  e >>= -nBits;
	  nBits += mLen;
	  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}
	
	  if (e === 0) {
	    e = 1 - eBias;
	  } else if (e === eMax) {
	    return m ? NaN : (s ? -1 : 1) * Infinity;
	  } else {
	    m = m + Math.pow(2, mLen);
	    e = e - eBias;
	  }
	  return (s ? -1 : 1) * m * Math.pow(2, e - mLen);
	};
	
	exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
	  var e, m, c;
	  var eLen = nBytes * 8 - mLen - 1;
	  var eMax = (1 << eLen) - 1;
	  var eBias = eMax >> 1;
	  var rt = mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0;
	  var i = isLE ? 0 : nBytes - 1;
	  var d = isLE ? 1 : -1;
	  var s = value < 0 || value === 0 && 1 / value < 0 ? 1 : 0;
	
	  value = Math.abs(value);
	
	  if (isNaN(value) || value === Infinity) {
	    m = isNaN(value) ? 1 : 0;
	    e = eMax;
	  } else {
	    e = Math.floor(Math.log(value) / Math.LN2);
	    if (value * (c = Math.pow(2, -e)) < 1) {
	      e--;
	      c *= 2;
	    }
	    if (e + eBias >= 1) {
	      value += rt / c;
	    } else {
	      value += rt * Math.pow(2, 1 - eBias);
	    }
	    if (value * c >= 2) {
	      e++;
	      c /= 2;
	    }
	
	    if (e + eBias >= eMax) {
	      m = 0;
	      e = eMax;
	    } else if (e + eBias >= 1) {
	      m = (value * c - 1) * Math.pow(2, mLen);
	      e = e + eBias;
	    } else {
	      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
	      e = 0;
	    }
	  }
	
	  for (; mLen >= 8; buffer[offset + i] = m & 255, i += d, m /= 256, mLen -= 8) {}
	
	  e = e << mLen | m;
	  eLen += mLen;
	  for (; eLen > 0; buffer[offset + i] = e & 255, i += d, e /= 256, eLen -= 8) {}
	
	  buffer[offset + i - d] |= s * 128;
	};

/***/ },
/* 4 */
/***/ function(module, exports) {

	'use strict';
	
	var toString = ({}).toString;
	
	module.exports = Array.isArray || function (arr) {
	  return toString.call(arr) == '[object Array]';
	};

/***/ },
/* 5 */
/***/ function(module, exports) {

	"use strict";
	
	module.exports = function (module) {
		if (!module.webpackPolyfill) {
			module.deprecate = function () {};
			module.paths = [];
			// module.parent = undefined by default
			module.children = [];
			module.webpackPolyfill = 1;
		}
		return module;
	};

/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var Ceshi = {
	  warn: function warn() {
	    alert(__webpack_require__(7).warn || 'helloworld');
	  },
	  init: function init() {
	    this.warn();
	  }
	};
	
	module.exports = Ceshi;

/***/ },
/* 7 */
/***/ function(module, exports) {

	"use strict";
	
	module.exports = "welcome";

/***/ },
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var $ = __webpack_require__(10);
	var Ceshi = __webpack_require__(6);
	
	Ceshi.init();
	$('#container').html('helloworld');

/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(module, Buffer) {'use strict';
	
	(function (global, module) {
	
	  var exports = module.exports;
	
	  /**
	   * Exports.
	   */
	
	  module.exports = expect;
	  expect.Assertion = Assertion;
	
	  /**
	   * Exports version.
	   */
	
	  expect.version = '0.3.1';
	
	  /**
	   * Possible assertion flags.
	   */
	
	  var flags = {
	    not: ['to', 'be', 'have', 'include', 'only'],
	    to: ['be', 'have', 'include', 'only', 'not'],
	    only: ['have'],
	    have: ['own'],
	    be: ['an']
	  };
	
	  function expect(obj) {
	    return new Assertion(obj);
	  }
	
	  /**
	   * Constructor
	   *
	   * @api private
	   */
	
	  function Assertion(obj, flag, parent) {
	    this.obj = obj;
	    this.flags = {};
	
	    if (undefined != parent) {
	      this.flags[flag] = true;
	
	      for (var i in parent.flags) {
	        if (parent.flags.hasOwnProperty(i)) {
	          this.flags[i] = true;
	        }
	      }
	    }
	
	    var $flags = flag ? flags[flag] : keys(flags),
	        self = this;
	
	    if ($flags) {
	      for (var i = 0, l = $flags.length; i < l; i++) {
	        // avoid recursion
	        if (this.flags[$flags[i]]) continue;
	
	        var name = $flags[i],
	            assertion = new Assertion(this.obj, name, this);
	
	        if ('function' == typeof Assertion.prototype[name]) {
	          // clone the function, make sure we dont touch the prot reference
	          var old = this[name];
	          this[name] = function () {
	            return old.apply(self, arguments);
	          };
	
	          for (var fn in Assertion.prototype) {
	            if (Assertion.prototype.hasOwnProperty(fn) && fn != name) {
	              this[name][fn] = bind(assertion[fn], assertion);
	            }
	          }
	        } else {
	          this[name] = assertion;
	        }
	      }
	    }
	  }
	
	  /**
	   * Performs an assertion
	   *
	   * @api private
	   */
	
	  Assertion.prototype.assert = function (truth, msg, error, expected) {
	    var msg = this.flags.not ? error : msg,
	        ok = this.flags.not ? !truth : truth,
	        err;
	
	    if (!ok) {
	      err = new Error(msg.call(this));
	      if (arguments.length > 3) {
	        err.actual = this.obj;
	        err.expected = expected;
	        err.showDiff = true;
	      }
	      throw err;
	    }
	
	    this.and = new Assertion(this.obj);
	  };
	
	  /**
	   * Check if the value is truthy
	   *
	   * @api public
	   */
	
	  Assertion.prototype.ok = function () {
	    this.assert(!!this.obj, function () {
	      return 'expected ' + i(this.obj) + ' to be truthy';
	    }, function () {
	      return 'expected ' + i(this.obj) + ' to be falsy';
	    });
	  };
	
	  /**
	   * Creates an anonymous function which calls fn with arguments.
	   *
	   * @api public
	   */
	
	  Assertion.prototype.withArgs = function () {
	    expect(this.obj).to.be.a('function');
	    var fn = this.obj;
	    var args = Array.prototype.slice.call(arguments);
	    return expect(function () {
	      fn.apply(null, args);
	    });
	  };
	
	  /**
	   * Assert that the function throws.
	   *
	   * @param {Function|RegExp} callback, or regexp to match error string against
	   * @api public
	   */
	
	  Assertion.prototype.throwError = Assertion.prototype.throwException = function (fn) {
	    expect(this.obj).to.be.a('function');
	
	    var thrown = false,
	        not = this.flags.not;
	
	    try {
	      this.obj();
	    } catch (e) {
	      if (isRegExp(fn)) {
	        var subject = 'string' == typeof e ? e : e.message;
	        if (not) {
	          expect(subject).to.not.match(fn);
	        } else {
	          expect(subject).to.match(fn);
	        }
	      } else if ('function' == typeof fn) {
	        fn(e);
	      }
	      thrown = true;
	    }
	
	    if (isRegExp(fn) && not) {
	      // in the presence of a matcher, ensure the `not` only applies to
	      // the matching.
	      this.flags.not = false;
	    }
	
	    var name = this.obj.name || 'fn';
	    this.assert(thrown, function () {
	      return 'expected ' + name + ' to throw an exception';
	    }, function () {
	      return 'expected ' + name + ' not to throw an exception';
	    });
	  };
	
	  /**
	   * Checks if the array is empty.
	   *
	   * @api public
	   */
	
	  Assertion.prototype.empty = function () {
	    var expectation;
	
	    if ('object' == typeof this.obj && null !== this.obj && !isArray(this.obj)) {
	      if ('number' == typeof this.obj.length) {
	        expectation = !this.obj.length;
	      } else {
	        expectation = !keys(this.obj).length;
	      }
	    } else {
	      if ('string' != typeof this.obj) {
	        expect(this.obj).to.be.an('object');
	      }
	
	      expect(this.obj).to.have.property('length');
	      expectation = !this.obj.length;
	    }
	
	    this.assert(expectation, function () {
	      return 'expected ' + i(this.obj) + ' to be empty';
	    }, function () {
	      return 'expected ' + i(this.obj) + ' to not be empty';
	    });
	    return this;
	  };
	
	  /**
	   * Checks if the obj exactly equals another.
	   *
	   * @api public
	   */
	
	  Assertion.prototype.be = Assertion.prototype.equal = function (obj) {
	    this.assert(obj === this.obj, function () {
	      return 'expected ' + i(this.obj) + ' to equal ' + i(obj);
	    }, function () {
	      return 'expected ' + i(this.obj) + ' to not equal ' + i(obj);
	    });
	    return this;
	  };
	
	  /**
	   * Checks if the obj sortof equals another.
	   *
	   * @api public
	   */
	
	  Assertion.prototype.eql = function (obj) {
	    this.assert(expect.eql(this.obj, obj), function () {
	      return 'expected ' + i(this.obj) + ' to sort of equal ' + i(obj);
	    }, function () {
	      return 'expected ' + i(this.obj) + ' to sort of not equal ' + i(obj);
	    }, obj);
	    return this;
	  };
	
	  /**
	   * Assert within start to finish (inclusive).
	   *
	   * @param {Number} start
	   * @param {Number} finish
	   * @api public
	   */
	
	  Assertion.prototype.within = function (start, finish) {
	    var range = start + '..' + finish;
	    this.assert(this.obj >= start && this.obj <= finish, function () {
	      return 'expected ' + i(this.obj) + ' to be within ' + range;
	    }, function () {
	      return 'expected ' + i(this.obj) + ' to not be within ' + range;
	    });
	    return this;
	  };
	
	  /**
	   * Assert typeof / instance of
	   *
	   * @api public
	   */
	
	  Assertion.prototype.a = Assertion.prototype.an = function (type) {
	    if ('string' == typeof type) {
	      // proper english in error msg
	      var n = /^[aeiou]/.test(type) ? 'n' : '';
	
	      // typeof with support for 'array'
	      this.assert('array' == type ? isArray(this.obj) : 'regexp' == type ? isRegExp(this.obj) : 'object' == type ? 'object' == typeof this.obj && null !== this.obj : type == typeof this.obj, function () {
	        return 'expected ' + i(this.obj) + ' to be a' + n + ' ' + type;
	      }, function () {
	        return 'expected ' + i(this.obj) + ' not to be a' + n + ' ' + type;
	      });
	    } else {
	      // instanceof
	      var name = type.name || 'supplied constructor';
	      this.assert(this.obj instanceof type, function () {
	        return 'expected ' + i(this.obj) + ' to be an instance of ' + name;
	      }, function () {
	        return 'expected ' + i(this.obj) + ' not to be an instance of ' + name;
	      });
	    }
	
	    return this;
	  };
	
	  /**
	   * Assert numeric value above _n_.
	   *
	   * @param {Number} n
	   * @api public
	   */
	
	  Assertion.prototype.greaterThan = Assertion.prototype.above = function (n) {
	    this.assert(this.obj > n, function () {
	      return 'expected ' + i(this.obj) + ' to be above ' + n;
	    }, function () {
	      return 'expected ' + i(this.obj) + ' to be below ' + n;
	    });
	    return this;
	  };
	
	  /**
	   * Assert numeric value below _n_.
	   *
	   * @param {Number} n
	   * @api public
	   */
	
	  Assertion.prototype.lessThan = Assertion.prototype.below = function (n) {
	    this.assert(this.obj < n, function () {
	      return 'expected ' + i(this.obj) + ' to be below ' + n;
	    }, function () {
	      return 'expected ' + i(this.obj) + ' to be above ' + n;
	    });
	    return this;
	  };
	
	  /**
	   * Assert string value matches _regexp_.
	   *
	   * @param {RegExp} regexp
	   * @api public
	   */
	
	  Assertion.prototype.match = function (regexp) {
	    this.assert(regexp.exec(this.obj), function () {
	      return 'expected ' + i(this.obj) + ' to match ' + regexp;
	    }, function () {
	      return 'expected ' + i(this.obj) + ' not to match ' + regexp;
	    });
	    return this;
	  };
	
	  /**
	   * Assert property "length" exists and has value of _n_.
	   *
	   * @param {Number} n
	   * @api public
	   */
	
	  Assertion.prototype.length = function (n) {
	    expect(this.obj).to.have.property('length');
	    var len = this.obj.length;
	    this.assert(n == len, function () {
	      return 'expected ' + i(this.obj) + ' to have a length of ' + n + ' but got ' + len;
	    }, function () {
	      return 'expected ' + i(this.obj) + ' to not have a length of ' + len;
	    });
	    return this;
	  };
	
	  /**
	   * Assert property _name_ exists, with optional _val_.
	   *
	   * @param {String} name
	   * @param {Mixed} val
	   * @api public
	   */
	
	  Assertion.prototype.property = function (name, val) {
	    if (this.flags.own) {
	      this.assert(Object.prototype.hasOwnProperty.call(this.obj, name), function () {
	        return 'expected ' + i(this.obj) + ' to have own property ' + i(name);
	      }, function () {
	        return 'expected ' + i(this.obj) + ' to not have own property ' + i(name);
	      });
	      return this;
	    }
	
	    if (this.flags.not && undefined !== val) {
	      if (undefined === this.obj[name]) {
	        throw new Error(i(this.obj) + ' has no property ' + i(name));
	      }
	    } else {
	      var hasProp;
	      try {
	        hasProp = name in this.obj;
	      } catch (e) {
	        hasProp = undefined !== this.obj[name];
	      }
	
	      this.assert(hasProp, function () {
	        return 'expected ' + i(this.obj) + ' to have a property ' + i(name);
	      }, function () {
	        return 'expected ' + i(this.obj) + ' to not have a property ' + i(name);
	      });
	    }
	
	    if (undefined !== val) {
	      this.assert(val === this.obj[name], function () {
	        return 'expected ' + i(this.obj) + ' to have a property ' + i(name) + ' of ' + i(val) + ', but got ' + i(this.obj[name]);
	      }, function () {
	        return 'expected ' + i(this.obj) + ' to not have a property ' + i(name) + ' of ' + i(val);
	      });
	    }
	
	    this.obj = this.obj[name];
	    return this;
	  };
	
	  /**
	   * Assert that the array contains _obj_ or string contains _obj_.
	   *
	   * @param {Mixed} obj|string
	   * @api public
	   */
	
	  Assertion.prototype.string = Assertion.prototype.contain = function (obj) {
	    if ('string' == typeof this.obj) {
	      this.assert(~this.obj.indexOf(obj), function () {
	        return 'expected ' + i(this.obj) + ' to contain ' + i(obj);
	      }, function () {
	        return 'expected ' + i(this.obj) + ' to not contain ' + i(obj);
	      });
	    } else {
	      this.assert(~indexOf(this.obj, obj), function () {
	        return 'expected ' + i(this.obj) + ' to contain ' + i(obj);
	      }, function () {
	        return 'expected ' + i(this.obj) + ' to not contain ' + i(obj);
	      });
	    }
	    return this;
	  };
	
	  /**
	   * Assert exact keys or inclusion of keys by using
	   * the `.own` modifier.
	   *
	   * @param {Array|String ...} keys
	   * @api public
	   */
	
	  Assertion.prototype.key = Assertion.prototype.keys = function ($keys) {
	    var str,
	        ok = true;
	
	    $keys = isArray($keys) ? $keys : Array.prototype.slice.call(arguments);
	
	    if (!$keys.length) throw new Error('keys required');
	
	    var actual = keys(this.obj),
	        len = $keys.length;
	
	    // Inclusion
	    ok = every($keys, function (key) {
	      return ~indexOf(actual, key);
	    });
	
	    // Strict
	    if (!this.flags.not && this.flags.only) {
	      ok = ok && $keys.length == actual.length;
	    }
	
	    // Key string
	    if (len > 1) {
	      $keys = map($keys, function (key) {
	        return i(key);
	      });
	      var last = $keys.pop();
	      str = $keys.join(', ') + ', and ' + last;
	    } else {
	      str = i($keys[0]);
	    }
	
	    // Form
	    str = (len > 1 ? 'keys ' : 'key ') + str;
	
	    // Have / include
	    str = (!this.flags.only ? 'include ' : 'only have ') + str;
	
	    // Assertion
	    this.assert(ok, function () {
	      return 'expected ' + i(this.obj) + ' to ' + str;
	    }, function () {
	      return 'expected ' + i(this.obj) + ' to not ' + str;
	    });
	
	    return this;
	  };
	
	  /**
	   * Assert a failure.
	   *
	   * @param {String ...} custom message
	   * @api public
	   */
	  Assertion.prototype.fail = function (msg) {
	    var error = function error() {
	      return msg || 'explicit failure';
	    };
	    this.assert(false, error, error);
	    return this;
	  };
	
	  /**
	   * Function bind implementation.
	   */
	
	  function bind(fn, scope) {
	    return function () {
	      return fn.apply(scope, arguments);
	    };
	  }
	
	  /**
	   * Array every compatibility
	   *
	   * @see bit.ly/5Fq1N2
	   * @api public
	   */
	
	  function every(arr, fn, thisObj) {
	    var scope = thisObj || global;
	    for (var i = 0, j = arr.length; i < j; ++i) {
	      if (!fn.call(scope, arr[i], i, arr)) {
	        return false;
	      }
	    }
	    return true;
	  }
	
	  /**
	   * Array indexOf compatibility.
	   *
	   * @see bit.ly/a5Dxa2
	   * @api public
	   */
	
	  function indexOf(arr, o, i) {
	    if (Array.prototype.indexOf) {
	      return Array.prototype.indexOf.call(arr, o, i);
	    }
	
	    if (arr.length === undefined) {
	      return -1;
	    }
	
	    for (var j = arr.length, i = i < 0 ? i + j < 0 ? 0 : i + j : i || 0; i < j && arr[i] !== o; i++);
	
	    return j <= i ? -1 : i;
	  }
	
	  // https://gist.github.com/1044128/
	  var getOuterHTML = function getOuterHTML(element) {
	    if ('outerHTML' in element) return element.outerHTML;
	    var ns = 'http://www.w3.org/1999/xhtml';
	    var container = document.createElementNS(ns, '_');
	    var xmlSerializer = new XMLSerializer();
	    var html;
	    if (document.xmlVersion) {
	      return xmlSerializer.serializeToString(element);
	    } else {
	      container.appendChild(element.cloneNode(false));
	      html = container.innerHTML.replace('><', '>' + element.innerHTML + '<');
	      container.innerHTML = '';
	      return html;
	    }
	  };
	
	  // Returns true if object is a DOM element.
	  var isDOMElement = function isDOMElement(object) {
	    if (typeof HTMLElement === 'object') {
	      return object instanceof HTMLElement;
	    } else {
	      return object && typeof object === 'object' && object.nodeType === 1 && typeof object.nodeName === 'string';
	    }
	  };
	
	  /**
	   * Inspects an object.
	   *
	   * @see taken from node.js `util` module (copyright Joyent, MIT license)
	   * @api private
	   */
	
	  function i(obj, showHidden, depth) {
	    var seen = [];
	
	    function stylize(str) {
	      return str;
	    }
	
	    function format(value, recurseTimes) {
	      // Provide a hook for user-specified inspect functions.
	      // Check that value is an object with an inspect function on it
	      if (value && typeof value.inspect === 'function' &&
	      // Filter out the util module, it's inspect function is special
	      value !== exports &&
	      // Also filter out any prototype objects using the circular check.
	      !(value.constructor && value.constructor.prototype === value)) {
	        return value.inspect(recurseTimes);
	      }
	
	      // Primitive types cannot have properties
	      switch (typeof value) {
	        case 'undefined':
	          return stylize('undefined', 'undefined');
	
	        case 'string':
	          var simple = '\'' + json.stringify(value).replace(/^"|"$/g, '').replace(/'/g, '\\\'').replace(/\\"/g, '"') + '\'';
	          return stylize(simple, 'string');
	
	        case 'number':
	          return stylize('' + value, 'number');
	
	        case 'boolean':
	          return stylize('' + value, 'boolean');
	      }
	      // For some reason typeof null is "object", so special case here.
	      if (value === null) {
	        return stylize('null', 'null');
	      }
	
	      if (isDOMElement(value)) {
	        return getOuterHTML(value);
	      }
	
	      // Look up the keys of the object.
	      var visible_keys = keys(value);
	      var $keys = showHidden ? Object.getOwnPropertyNames(value) : visible_keys;
	
	      // Functions without properties can be shortcutted.
	      if (typeof value === 'function' && $keys.length === 0) {
	        if (isRegExp(value)) {
	          return stylize('' + value, 'regexp');
	        } else {
	          var name = value.name ? ': ' + value.name : '';
	          return stylize('[Function' + name + ']', 'special');
	        }
	      }
	
	      // Dates without properties can be shortcutted
	      if (isDate(value) && $keys.length === 0) {
	        return stylize(value.toUTCString(), 'date');
	      }
	
	      // Error objects can be shortcutted
	      if (value instanceof Error) {
	        return stylize('[' + value.toString() + ']', 'Error');
	      }
	
	      var base, type, braces;
	      // Determine the object type
	      if (isArray(value)) {
	        type = 'Array';
	        braces = ['[', ']'];
	      } else {
	        type = 'Object';
	        braces = ['{', '}'];
	      }
	
	      // Make functions say that they are functions
	      if (typeof value === 'function') {
	        var n = value.name ? ': ' + value.name : '';
	        base = isRegExp(value) ? ' ' + value : ' [Function' + n + ']';
	      } else {
	        base = '';
	      }
	
	      // Make dates with properties first say the date
	      if (isDate(value)) {
	        base = ' ' + value.toUTCString();
	      }
	
	      if ($keys.length === 0) {
	        return braces[0] + base + braces[1];
	      }
	
	      if (recurseTimes < 0) {
	        if (isRegExp(value)) {
	          return stylize('' + value, 'regexp');
	        } else {
	          return stylize('[Object]', 'special');
	        }
	      }
	
	      seen.push(value);
	
	      var output = map($keys, function (key) {
	        var name, str;
	        if (value.__lookupGetter__) {
	          if (value.__lookupGetter__(key)) {
	            if (value.__lookupSetter__(key)) {
	              str = stylize('[Getter/Setter]', 'special');
	            } else {
	              str = stylize('[Getter]', 'special');
	            }
	          } else {
	            if (value.__lookupSetter__(key)) {
	              str = stylize('[Setter]', 'special');
	            }
	          }
	        }
	        if (indexOf(visible_keys, key) < 0) {
	          name = '[' + key + ']';
	        }
	        if (!str) {
	          if (indexOf(seen, value[key]) < 0) {
	            if (recurseTimes === null) {
	              str = format(value[key]);
	            } else {
	              str = format(value[key], recurseTimes - 1);
	            }
	            if (str.indexOf('\n') > -1) {
	              if (isArray(value)) {
	                str = map(str.split('\n'), function (line) {
	                  return '  ' + line;
	                }).join('\n').substr(2);
	              } else {
	                str = '\n' + map(str.split('\n'), function (line) {
	                  return '   ' + line;
	                }).join('\n');
	              }
	            }
	          } else {
	            str = stylize('[Circular]', 'special');
	          }
	        }
	        if (typeof name === 'undefined') {
	          if (type === 'Array' && key.match(/^\d+$/)) {
	            return str;
	          }
	          name = json.stringify('' + key);
	          if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
	            name = name.substr(1, name.length - 2);
	            name = stylize(name, 'name');
	          } else {
	            name = name.replace(/'/g, '\\\'').replace(/\\"/g, '"').replace(/(^"|"$)/g, '\'');
	            name = stylize(name, 'string');
	          }
	        }
	
	        return name + ': ' + str;
	      });
	
	      seen.pop();
	
	      var numLinesEst = 0;
	      var length = reduce(output, function (prev, cur) {
	        numLinesEst++;
	        if (indexOf(cur, '\n') >= 0) numLinesEst++;
	        return prev + cur.length + 1;
	      }, 0);
	
	      if (length > 50) {
	        output = braces[0] + (base === '' ? '' : base + '\n ') + ' ' + output.join(',\n  ') + ' ' + braces[1];
	      } else {
	        output = braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
	      }
	
	      return output;
	    }
	    return format(obj, typeof depth === 'undefined' ? 2 : depth);
	  }
	
	  expect.stringify = i;
	
	  function isArray(ar) {
	    return Object.prototype.toString.call(ar) === '[object Array]';
	  }
	
	  function isRegExp(re) {
	    var s;
	    try {
	      s = '' + re;
	    } catch (e) {
	      return false;
	    }
	
	    return re instanceof RegExp || // easy case
	    // duck-type for context-switching evalcx case
	    typeof re === 'function' && re.constructor.name === 'RegExp' && re.compile && re.test && re.exec && s.match(/^\/.*\/[gim]{0,3}$/);
	  }
	
	  function isDate(d) {
	    return d instanceof Date;
	  }
	
	  function keys(obj) {
	    if (Object.keys) {
	      return Object.keys(obj);
	    }
	
	    var keys = [];
	
	    for (var i in obj) {
	      if (Object.prototype.hasOwnProperty.call(obj, i)) {
	        keys.push(i);
	      }
	    }
	
	    return keys;
	  }
	
	  function map(arr, mapper, that) {
	    if (Array.prototype.map) {
	      return Array.prototype.map.call(arr, mapper, that);
	    }
	
	    var other = new Array(arr.length);
	
	    for (var i = 0, n = arr.length; i < n; i++) if (i in arr) other[i] = mapper.call(that, arr[i], i, arr);
	
	    return other;
	  }
	
	  function reduce(arr, fun) {
	    if (Array.prototype.reduce) {
	      return Array.prototype.reduce.apply(arr, Array.prototype.slice.call(arguments, 1));
	    }
	
	    var len = +this.length;
	
	    if (typeof fun !== 'function') throw new TypeError();
	
	    // no value to return if no initial value and an empty array
	    if (len === 0 && arguments.length === 1) throw new TypeError();
	
	    var i = 0;
	    if (arguments.length >= 2) {
	      var rv = arguments[1];
	    } else {
	      do {
	        if (i in this) {
	          rv = this[i++];
	          break;
	        }
	
	        // if array contains no values, no initial value to return
	        if (++i >= len) throw new TypeError();
	      } while (true);
	    }
	
	    for (; i < len; i++) {
	      if (i in this) rv = fun.call(null, rv, this[i], i, this);
	    }
	
	    return rv;
	  }
	
	  /**
	   * Asserts deep equality
	   *
	   * @see taken from node.js `assert` module (copyright Joyent, MIT license)
	   * @api private
	   */
	
	  expect.eql = function eql(actual, expected) {
	    // 7.1. All identical values are equivalent, as determined by ===.
	    if (actual === expected) {
	      return true;
	    } else if ('undefined' != typeof Buffer && Buffer.isBuffer(actual) && Buffer.isBuffer(expected)) {
	      if (actual.length != expected.length) return false;
	
	      for (var i = 0; i < actual.length; i++) {
	        if (actual[i] !== expected[i]) return false;
	      }
	
	      return true;
	
	      // 7.2. If the expected value is a Date object, the actual value is
	      // equivalent if it is also a Date object that refers to the same time.
	    } else if (actual instanceof Date && expected instanceof Date) {
	      return actual.getTime() === expected.getTime();
	
	      // 7.3. Other pairs that do not both pass typeof value == "object",
	      // equivalence is determined by ==.
	    } else if (typeof actual != 'object' && typeof expected != 'object') {
	      return actual == expected;
	      // If both are regular expression use the special `regExpEquiv` method
	      // to determine equivalence.
	    } else if (isRegExp(actual) && isRegExp(expected)) {
	      return regExpEquiv(actual, expected);
	      // 7.4. For all other Object pairs, including Array objects, equivalence is
	      // determined by having the same number of owned properties (as verified
	      // with Object.prototype.hasOwnProperty.call), the same set of keys
	      // (although not necessarily the same order), equivalent values for every
	      // corresponding key, and an identical "prototype" property. Note: this
	      // accounts for both named and indexed properties on Arrays.
	    } else {
	      return objEquiv(actual, expected);
	    }
	  };
	
	  function isUndefinedOrNull(value) {
	    return value === null || value === undefined;
	  }
	
	  function isArguments(object) {
	    return Object.prototype.toString.call(object) == '[object Arguments]';
	  }
	
	  function regExpEquiv(a, b) {
	    return a.source === b.source && a.global === b.global && a.ignoreCase === b.ignoreCase && a.multiline === b.multiline;
	  }
	
	  function objEquiv(a, b) {
	    if (isUndefinedOrNull(a) || isUndefinedOrNull(b)) return false;
	    // an identical "prototype" property.
	    if (a.prototype !== b.prototype) return false;
	    //~~~I've managed to break Object.keys through screwy arguments passing.
	    //   Converting to array solves the problem.
	    if (isArguments(a)) {
	      if (!isArguments(b)) {
	        return false;
	      }
	      a = pSlice.call(a);
	      b = pSlice.call(b);
	      return expect.eql(a, b);
	    }
	    try {
	      var ka = keys(a),
	          kb = keys(b),
	          key,
	          i;
	    } catch (e) {
	      //happens when one is a string literal and the other isn't
	      return false;
	    }
	    // having the same number of owned properties (keys incorporates hasOwnProperty)
	    if (ka.length != kb.length) return false;
	    //the same set of keys (although not necessarily the same order),
	    ka.sort();
	    kb.sort();
	    //~~~cheap key test
	    for (i = ka.length - 1; i >= 0; i--) {
	      if (ka[i] != kb[i]) return false;
	    }
	    //equivalent values for every corresponding key, and
	    //~~~possibly expensive deep test
	    for (i = ka.length - 1; i >= 0; i--) {
	      key = ka[i];
	      if (!expect.eql(a[key], b[key])) return false;
	    }
	    return true;
	  }
	
	  var json = (function () {
	    'use strict';
	
	    if ('object' == typeof JSON && JSON.parse && JSON.stringify) {
	      return {
	        parse: nativeJSON.parse,
	        stringify: nativeJSON.stringify
	      };
	    }
	
	    var JSON = {};
	
	    function f(n) {
	      // Format integers to have at least two digits.
	      return n < 10 ? '0' + n : n;
	    }
	
	    function date(d, key) {
	      return isFinite(d.valueOf()) ? d.getUTCFullYear() + '-' + f(d.getUTCMonth() + 1) + '-' + f(d.getUTCDate()) + 'T' + f(d.getUTCHours()) + ':' + f(d.getUTCMinutes()) + ':' + f(d.getUTCSeconds()) + 'Z' : null;
	    }
	
	    var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
	        escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
	        gap,
	        indent,
	        meta = { // table of character substitutions
	      '\b': '\\b',
	      '\t': '\\t',
	      '\n': '\\n',
	      '\f': '\\f',
	      '\r': '\\r',
	      '"': '\\"',
	      '\\': '\\\\'
	    },
	        rep;
	
	    function quote(string) {
	
	      // If the string contains no control characters, no quote characters, and no
	      // backslash characters, then we can safely slap some quotes around it.
	      // Otherwise we must also replace the offending characters with safe escape
	      // sequences.
	
	      escapable.lastIndex = 0;
	      return escapable.test(string) ? '"' + string.replace(escapable, function (a) {
	        var c = meta[a];
	        return typeof c === 'string' ? c : '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
	      }) + '"' : '"' + string + '"';
	    }
	
	    function str(key, holder) {
	
	      // Produce a string from holder[key].
	
	      var i,
	          // The loop counter.
	      k,
	          // The member key.
	      v,
	          // The member value.
	      length,
	          mind = gap,
	          partial,
	          value = holder[key];
	
	      // If the value has a toJSON method, call it to obtain a replacement value.
	
	      if (value instanceof Date) {
	        value = date(key);
	      }
	
	      // If we were called with a replacer function, then call the replacer to
	      // obtain a replacement value.
	
	      if (typeof rep === 'function') {
	        value = rep.call(holder, key, value);
	      }
	
	      // What happens next depends on the value's type.
	
	      switch (typeof value) {
	        case 'string':
	          return quote(value);
	
	        case 'number':
	
	          // JSON numbers must be finite. Encode non-finite numbers as null.
	
	          return isFinite(value) ? String(value) : 'null';
	
	        case 'boolean':
	        case 'null':
	
	          // If the value is a boolean or null, convert it to a string. Note:
	          // typeof null does not produce 'null'. The case is included here in
	          // the remote chance that this gets fixed someday.
	
	          return String(value);
	
	        // If the type is 'object', we might be dealing with an object or an array or
	        // null.
	
	        case 'object':
	
	          // Due to a specification blunder in ECMAScript, typeof null is 'object',
	          // so watch out for that case.
	
	          if (!value) {
	            return 'null';
	          }
	
	          // Make an array to hold the partial results of stringifying this object value.
	
	          gap += indent;
	          partial = [];
	
	          // Is the value an array?
	
	          if (Object.prototype.toString.apply(value) === '[object Array]') {
	
	            // The value is an array. Stringify every element. Use null as a placeholder
	            // for non-JSON values.
	
	            length = value.length;
	            for (i = 0; i < length; i += 1) {
	              partial[i] = str(i, value) || 'null';
	            }
	
	            // Join all of the elements together, separated with commas, and wrap them in
	            // brackets.
	
	            v = partial.length === 0 ? '[]' : gap ? '[\n' + gap + partial.join(',\n' + gap) + '\n' + mind + ']' : '[' + partial.join(',') + ']';
	            gap = mind;
	            return v;
	          }
	
	          // If the replacer is an array, use it to select the members to be stringified.
	
	          if (rep && typeof rep === 'object') {
	            length = rep.length;
	            for (i = 0; i < length; i += 1) {
	              if (typeof rep[i] === 'string') {
	                k = rep[i];
	                v = str(k, value);
	                if (v) {
	                  partial.push(quote(k) + (gap ? ': ' : ':') + v);
	                }
	              }
	            }
	          } else {
	
	            // Otherwise, iterate through all of the keys in the object.
	
	            for (k in value) {
	              if (Object.prototype.hasOwnProperty.call(value, k)) {
	                v = str(k, value);
	                if (v) {
	                  partial.push(quote(k) + (gap ? ': ' : ':') + v);
	                }
	              }
	            }
	          }
	
	          // Join all of the member texts together, separated with commas,
	          // and wrap them in braces.
	
	          v = partial.length === 0 ? '{}' : gap ? '{\n' + gap + partial.join(',\n' + gap) + '\n' + mind + '}' : '{' + partial.join(',') + '}';
	          gap = mind;
	          return v;
	      }
	    }
	
	    // If the JSON object does not yet have a stringify method, give it one.
	
	    JSON.stringify = function (value, replacer, space) {
	
	      // The stringify method takes a value and an optional replacer, and an optional
	      // space parameter, and returns a JSON text. The replacer can be a function
	      // that can replace values, or an array of strings that will select the keys.
	      // A default replacer method can be provided. Use of the space parameter can
	      // produce text that is more easily readable.
	
	      var i;
	      gap = '';
	      indent = '';
	
	      // If the space parameter is a number, make an indent string containing that
	      // many spaces.
	
	      if (typeof space === 'number') {
	        for (i = 0; i < space; i += 1) {
	          indent += ' ';
	        }
	
	        // If the space parameter is a string, it will be used as the indent string.
	      } else if (typeof space === 'string') {
	        indent = space;
	      }
	
	      // If there is a replacer, it must be a function or an array.
	      // Otherwise, throw an error.
	
	      rep = replacer;
	      if (replacer && typeof replacer !== 'function' && (typeof replacer !== 'object' || typeof replacer.length !== 'number')) {
	        throw new Error('JSON.stringify');
	      }
	
	      // Make a fake root object containing our value under the key of ''.
	      // Return the result of stringifying the value.
	
	      return str('', { '': value });
	    };
	
	    // If the JSON object does not yet have a parse method, give it one.
	
	    JSON.parse = function (text, reviver) {
	      // The parse method takes a text and an optional reviver function, and returns
	      // a JavaScript value if the text is a valid JSON text.
	
	      var j;
	
	      function walk(holder, key) {
	
	        // The walk method is used to recursively walk the resulting structure so
	        // that modifications can be made.
	
	        var k,
	            v,
	            value = holder[key];
	        if (value && typeof value === 'object') {
	          for (k in value) {
	            if (Object.prototype.hasOwnProperty.call(value, k)) {
	              v = walk(value, k);
	              if (v !== undefined) {
	                value[k] = v;
	              } else {
	                delete value[k];
	              }
	            }
	          }
	        }
	        return reviver.call(holder, key, value);
	      }
	
	      // Parsing happens in four stages. In the first stage, we replace certain
	      // Unicode characters with escape sequences. JavaScript handles many characters
	      // incorrectly, either silently deleting them, or treating them as line endings.
	
	      text = String(text);
	      cx.lastIndex = 0;
	      if (cx.test(text)) {
	        text = text.replace(cx, function (a) {
	          return '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
	        });
	      }
	
	      // In the second stage, we run the text against regular expressions that look
	      // for non-JSON patterns. We are especially concerned with '()' and 'new'
	      // because they can cause invocation, and '=' because it can cause mutation.
	      // But just to be safe, we want to reject all unexpected forms.
	
	      // We split the second stage into 4 regexp operations in order to work around
	      // crippling inefficiencies in IE's and Safari's regexp engines. First we
	      // replace the JSON backslash pairs with '@' (a non-JSON character). Second, we
	      // replace all simple value tokens with ']' characters. Third, we delete all
	      // open brackets that follow a colon or comma or that begin the text. Finally,
	      // we look to see that the remaining characters are only whitespace or ']' or
	      // ',' or ':' or '{' or '}'. If that is so, then the text is safe for eval.
	
	      if (/^[\],:{}\s]*$/.test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@').replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {
	
	        // In the third stage we use the eval function to compile the text into a
	        // JavaScript structure. The '{' operator is subject to a syntactic ambiguity
	        // in JavaScript: it can begin a block or an object literal. We wrap the text
	        // in parens to eliminate the ambiguity.
	
	        j = eval('(' + text + ')');
	
	        // In the optional fourth stage, we recursively walk the new structure, passing
	        // each name/value pair to a reviver function for possible transformation.
	
	        return typeof reviver === 'function' ? walk({ '': j }, '') : j;
	      }
	
	      // If the text is not JSON parseable, then a SyntaxError is thrown.
	
	      throw new SyntaxError('JSON.parse');
	    };
	
	    return JSON;
	  })();
	
	  if ('undefined' != typeof window) {
	    window.expect = module.exports;
	  }
	})(undefined,  true ? module : { exports: {} });
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(5)(module), __webpack_require__(1).Buffer))

/***/ },
/* 10 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;"use strict";(function(global, factory){if(typeof module === "object" && typeof module.exports === "object"){module.exports = global.document?factory(global, true):function(w){if(!w.document){throw new Error("jQuery requires a window with a document");}return factory(w);};}else {factory(global);}})(typeof window !== "undefined"?window:undefined, function(window, noGlobal){var arr=[];var _slice=arr.slice;var concat=arr.concat;var push=arr.push;var indexOf=arr.indexOf;var class2type={};var toString=class2type.toString;var hasOwn=class2type.hasOwnProperty;var support={};var document=window.document, version="2.1.4", jQuery=function jQuery(selector, context){return new jQuery.fn.init(selector, context);}, rtrim=/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, rmsPrefix=/^-ms-/, rdashAlpha=/-([\da-z])/gi, fcamelCase=function fcamelCase(all, letter){return letter.toUpperCase();};jQuery.fn = jQuery.prototype = {jquery:version, constructor:jQuery, selector:"", length:0, toArray:function toArray(){return _slice.call(this);}, get:function get(num){return num != null?num < 0?this[num + this.length]:this[num]:_slice.call(this);}, pushStack:function pushStack(elems){var ret=jQuery.merge(this.constructor(), elems);ret.prevObject = this;ret.context = this.context;return ret;}, each:function each(callback, args){return jQuery.each(this, callback, args);}, map:function map(callback){return this.pushStack(jQuery.map(this, function(elem, i){return callback.call(elem, i, elem);}));}, slice:function slice(){return this.pushStack(_slice.apply(this, arguments));}, first:function first(){return this.eq(0);}, last:function last(){return this.eq(-1);}, eq:function eq(i){var len=this.length, j=+i + (i < 0?len:0);return this.pushStack(j >= 0 && j < len?[this[j]]:[]);}, end:function end(){return this.prevObject || this.constructor(null);}, push:push, sort:arr.sort, splice:arr.splice};jQuery.extend = jQuery.fn.extend = function(){var options, name, src, copy, copyIsArray, clone, target=arguments[0] || {}, i=1, length=arguments.length, deep=false;if(typeof target === "boolean"){deep = target;target = arguments[i] || {};i++;}if(typeof target !== "object" && !jQuery.isFunction(target)){target = {};}if(i === length){target = this;i--;}for(; i < length; i++) {if((options = arguments[i]) != null){for(name in options) {src = target[name];copy = options[name];if(target === copy){continue;}if(deep && copy && (jQuery.isPlainObject(copy) || (copyIsArray = jQuery.isArray(copy)))){if(copyIsArray){copyIsArray = false;clone = src && jQuery.isArray(src)?src:[];}else {clone = src && jQuery.isPlainObject(src)?src:{};}target[name] = jQuery.extend(deep, clone, copy);}else if(copy !== undefined){target[name] = copy;}}}}return target;};jQuery.extend({expando:"jQuery" + (version + Math.random()).replace(/\D/g, ""), isReady:true, error:function error(msg){throw new Error(msg);}, noop:function noop(){}, isFunction:function isFunction(obj){return jQuery.type(obj) === "function";}, isArray:Array.isArray, isWindow:function isWindow(obj){return obj != null && obj === obj.window;}, isNumeric:function isNumeric(obj){return !jQuery.isArray(obj) && obj - parseFloat(obj) + 1 >= 0;}, isPlainObject:function isPlainObject(obj){if(jQuery.type(obj) !== "object" || obj.nodeType || jQuery.isWindow(obj)){return false;}if(obj.constructor && !hasOwn.call(obj.constructor.prototype, "isPrototypeOf")){return false;}return true;}, isEmptyObject:function isEmptyObject(obj){var name;for(name in obj) {return false;}return true;}, type:function type(obj){if(obj == null){return obj + "";}return typeof obj === "object" || typeof obj === "function"?class2type[toString.call(obj)] || "object":typeof obj;}, globalEval:function globalEval(code){var script, indirect=eval;code = jQuery.trim(code);if(code){if(code.indexOf("use strict") === 1){script = document.createElement("script");script.text = code;document.head.appendChild(script).parentNode.removeChild(script);}else {indirect(code);}}}, camelCase:function camelCase(string){return string.replace(rmsPrefix, "ms-").replace(rdashAlpha, fcamelCase);}, nodeName:function nodeName(elem, name){return elem.nodeName && elem.nodeName.toLowerCase() === name.toLowerCase();}, each:function each(obj, callback, args){var value, i=0, length=obj.length, isArray=isArraylike(obj);if(args){if(isArray){for(; i < length; i++) {value = callback.apply(obj[i], args);if(value === false){break;}}}else {for(i in obj) {value = callback.apply(obj[i], args);if(value === false){break;}}}}else {if(isArray){for(; i < length; i++) {value = callback.call(obj[i], i, obj[i]);if(value === false){break;}}}else {for(i in obj) {value = callback.call(obj[i], i, obj[i]);if(value === false){break;}}}}return obj;}, trim:function trim(text){return text == null?"":(text + "").replace(rtrim, "");}, makeArray:function makeArray(arr, results){var ret=results || [];if(arr != null){if(isArraylike(Object(arr))){jQuery.merge(ret, typeof arr === "string"?[arr]:arr);}else {push.call(ret, arr);}}return ret;}, inArray:function inArray(elem, arr, i){return arr == null?-1:indexOf.call(arr, elem, i);}, merge:function merge(first, second){var len=+second.length, j=0, i=first.length;for(; j < len; j++) {first[i++] = second[j];}first.length = i;return first;}, grep:function grep(elems, callback, invert){var callbackInverse, matches=[], i=0, length=elems.length, callbackExpect=!invert;for(; i < length; i++) {callbackInverse = !callback(elems[i], i);if(callbackInverse !== callbackExpect){matches.push(elems[i]);}}return matches;}, map:function map(elems, callback, arg){var value, i=0, length=elems.length, isArray=isArraylike(elems), ret=[];if(isArray){for(; i < length; i++) {value = callback(elems[i], i, arg);if(value != null){ret.push(value);}}}else {for(i in elems) {value = callback(elems[i], i, arg);if(value != null){ret.push(value);}}}return concat.apply([], ret);}, guid:1, proxy:function proxy(fn, context){var tmp, args, proxy;if(typeof context === "string"){tmp = fn[context];context = fn;fn = tmp;}if(!jQuery.isFunction(fn)){return undefined;}args = _slice.call(arguments, 2);proxy = function(){return fn.apply(context || this, args.concat(_slice.call(arguments)));};proxy.guid = fn.guid = fn.guid || jQuery.guid++;return proxy;}, now:Date.now, support:support});jQuery.each("Boolean Number String Function Array Date RegExp Object Error".split(" "), function(i, name){class2type["[object " + name + "]"] = name.toLowerCase();});function isArraylike(obj){var length="length" in obj && obj.length, type=jQuery.type(obj);if(type === "function" || jQuery.isWindow(obj)){return false;}if(obj.nodeType === 1 && length){return true;}return type === "array" || length === 0 || typeof length === "number" && length > 0 && length - 1 in obj;}var Sizzle=(function(window){var i, support, Expr, getText, isXML, tokenize, compile, select, outermostContext, sortInput, hasDuplicate, setDocument, document, docElem, documentIsHTML, rbuggyQSA, rbuggyMatches, matches, contains, expando="sizzle" + 1 * new Date(), preferredDoc=window.document, dirruns=0, done=0, classCache=createCache(), tokenCache=createCache(), compilerCache=createCache(), sortOrder=function sortOrder(a, b){if(a === b){hasDuplicate = true;}return 0;}, MAX_NEGATIVE=1 << 31, hasOwn=({}).hasOwnProperty, arr=[], pop=arr.pop, push_native=arr.push, push=arr.push, slice=arr.slice, indexOf=function indexOf(list, elem){var i=0, len=list.length;for(; i < len; i++) {if(list[i] === elem){return i;}}return -1;}, booleans="checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped", whitespace="[\\x20\\t\\r\\n\\f]", characterEncoding="(?:\\\\.|[\\w-]|[^\\x00-\\xa0])+", identifier=characterEncoding.replace("w", "w#"), attributes="\\[" + whitespace + "*(" + characterEncoding + ")(?:" + whitespace + "*([*^$|!~]?=)" + whitespace + "*(?:'((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\"|(" + identifier + "))|)" + whitespace + "*\\]", pseudos=":(" + characterEncoding + ")(?:\\((" + "('((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\")|" + "((?:\\\\.|[^\\\\()[\\]]|" + attributes + ")*)|" + ".*" + ")\\)|)", rwhitespace=new RegExp(whitespace + "+", "g"), rtrim=new RegExp("^" + whitespace + "+|((?:^|[^\\\\])(?:\\\\.)*)" + whitespace + "+$", "g"), rcomma=new RegExp("^" + whitespace + "*," + whitespace + "*"), rcombinators=new RegExp("^" + whitespace + "*([>+~]|" + whitespace + ")" + whitespace + "*"), rattributeQuotes=new RegExp("=" + whitespace + "*([^\\]'\"]*?)" + whitespace + "*\\]", "g"), rpseudo=new RegExp(pseudos), ridentifier=new RegExp("^" + identifier + "$"), matchExpr={"ID":new RegExp("^#(" + characterEncoding + ")"), "CLASS":new RegExp("^\\.(" + characterEncoding + ")"), "TAG":new RegExp("^(" + characterEncoding.replace("w", "w*") + ")"), "ATTR":new RegExp("^" + attributes), "PSEUDO":new RegExp("^" + pseudos), "CHILD":new RegExp("^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\(" + whitespace + "*(even|odd|(([+-]|)(\\d*)n|)" + whitespace + "*(?:([+-]|)" + whitespace + "*(\\d+)|))" + whitespace + "*\\)|)", "i"), "bool":new RegExp("^(?:" + booleans + ")$", "i"), "needsContext":new RegExp("^" + whitespace + "*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\(" + whitespace + "*((?:-\\d)?\\d*)" + whitespace + "*\\)|)(?=[^-]|$)", "i")}, rinputs=/^(?:input|select|textarea|button)$/i, rheader=/^h\d$/i, rnative=/^[^{]+\{\s*\[native \w/, rquickExpr=/^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/, rsibling=/[+~]/, rescape=/'|\\/g, runescape=new RegExp("\\\\([\\da-f]{1,6}" + whitespace + "?|(" + whitespace + ")|.)", "ig"), funescape=function funescape(_, escaped, escapedWhitespace){var high="0x" + escaped - 65536;return high !== high || escapedWhitespace?escaped:high < 0?String.fromCharCode(high + 65536):String.fromCharCode(high >> 10 | 55296, high & 1023 | 56320);}, unloadHandler=function unloadHandler(){setDocument();};try{push.apply(arr = slice.call(preferredDoc.childNodes), preferredDoc.childNodes);arr[preferredDoc.childNodes.length].nodeType;}catch(e) {push = {apply:arr.length?function(target, els){push_native.apply(target, slice.call(els));}:function(target, els){var j=target.length, i=0;while(target[j++] = els[i++]) {}target.length = j - 1;}};}function Sizzle(selector, context, results, seed){var match, elem, m, nodeType, i, groups, old, nid, newContext, newSelector;if((context?context.ownerDocument || context:preferredDoc) !== document){setDocument(context);}context = context || document;results = results || [];nodeType = context.nodeType;if(typeof selector !== "string" || !selector || nodeType !== 1 && nodeType !== 9 && nodeType !== 11){return results;}if(!seed && documentIsHTML){if(nodeType !== 11 && (match = rquickExpr.exec(selector))){if(m = match[1]){if(nodeType === 9){elem = context.getElementById(m);if(elem && elem.parentNode){if(elem.id === m){results.push(elem);return results;}}else {return results;}}else {if(context.ownerDocument && (elem = context.ownerDocument.getElementById(m)) && contains(context, elem) && elem.id === m){results.push(elem);return results;}}}else if(match[2]){push.apply(results, context.getElementsByTagName(selector));return results;}else if((m = match[3]) && support.getElementsByClassName){push.apply(results, context.getElementsByClassName(m));return results;}}if(support.qsa && (!rbuggyQSA || !rbuggyQSA.test(selector))){nid = old = expando;newContext = context;newSelector = nodeType !== 1 && selector;if(nodeType === 1 && context.nodeName.toLowerCase() !== "object"){groups = tokenize(selector);if(old = context.getAttribute("id")){nid = old.replace(rescape, "\\$&");}else {context.setAttribute("id", nid);}nid = "[id='" + nid + "'] ";i = groups.length;while(i--) {groups[i] = nid + toSelector(groups[i]);}newContext = rsibling.test(selector) && testContext(context.parentNode) || context;newSelector = groups.join(",");}if(newSelector){try{push.apply(results, newContext.querySelectorAll(newSelector));return results;}catch(qsaError) {}finally {if(!old){context.removeAttribute("id");}}}}}return select(selector.replace(rtrim, "$1"), context, results, seed);}function createCache(){var keys=[];function cache(key, value){if(keys.push(key + " ") > Expr.cacheLength){delete cache[keys.shift()];}return cache[key + " "] = value;}return cache;}function markFunction(fn){fn[expando] = true;return fn;}function assert(fn){var div=document.createElement("div");try{return !!fn(div);}catch(e) {return false;}finally {if(div.parentNode){div.parentNode.removeChild(div);}div = null;}}function addHandle(attrs, handler){var arr=attrs.split("|"), i=attrs.length;while(i--) {Expr.attrHandle[arr[i]] = handler;}}function siblingCheck(a, b){var cur=b && a, diff=cur && a.nodeType === 1 && b.nodeType === 1 && (~b.sourceIndex || MAX_NEGATIVE) - (~a.sourceIndex || MAX_NEGATIVE);if(diff){return diff;}if(cur){while(cur = cur.nextSibling) {if(cur === b){return -1;}}}return a?1:-1;}function createInputPseudo(type){return function(elem){var name=elem.nodeName.toLowerCase();return name === "input" && elem.type === type;};}function createButtonPseudo(type){return function(elem){var name=elem.nodeName.toLowerCase();return (name === "input" || name === "button") && elem.type === type;};}function createPositionalPseudo(fn){return markFunction(function(argument){argument = +argument;return markFunction(function(seed, matches){var j, matchIndexes=fn([], seed.length, argument), i=matchIndexes.length;while(i--) {if(seed[j = matchIndexes[i]]){seed[j] = !(matches[j] = seed[j]);}}});});}function testContext(context){return context && typeof context.getElementsByTagName !== "undefined" && context;}support = Sizzle.support = {};isXML = Sizzle.isXML = function(elem){var documentElement=elem && (elem.ownerDocument || elem).documentElement;return documentElement?documentElement.nodeName !== "HTML":false;};setDocument = Sizzle.setDocument = function(node){var hasCompare, parent, doc=node?node.ownerDocument || node:preferredDoc;if(doc === document || doc.nodeType !== 9 || !doc.documentElement){return document;}document = doc;docElem = doc.documentElement;parent = doc.defaultView;if(parent && parent !== parent.top){if(parent.addEventListener){parent.addEventListener("unload", unloadHandler, false);}else if(parent.attachEvent){parent.attachEvent("onunload", unloadHandler);}}documentIsHTML = !isXML(doc);support.attributes = assert(function(div){div.className = "i";return !div.getAttribute("className");});support.getElementsByTagName = assert(function(div){div.appendChild(doc.createComment(""));return !div.getElementsByTagName("*").length;});support.getElementsByClassName = rnative.test(doc.getElementsByClassName);support.getById = assert(function(div){docElem.appendChild(div).id = expando;return !doc.getElementsByName || !doc.getElementsByName(expando).length;});if(support.getById){Expr.find["ID"] = function(id, context){if(typeof context.getElementById !== "undefined" && documentIsHTML){var m=context.getElementById(id);return m && m.parentNode?[m]:[];}};Expr.filter["ID"] = function(id){var attrId=id.replace(runescape, funescape);return function(elem){return elem.getAttribute("id") === attrId;};};}else {delete Expr.find["ID"];Expr.filter["ID"] = function(id){var attrId=id.replace(runescape, funescape);return function(elem){var node=typeof elem.getAttributeNode !== "undefined" && elem.getAttributeNode("id");return node && node.value === attrId;};};}Expr.find["TAG"] = support.getElementsByTagName?function(tag, context){if(typeof context.getElementsByTagName !== "undefined"){return context.getElementsByTagName(tag);}else if(support.qsa){return context.querySelectorAll(tag);}}:function(tag, context){var elem, tmp=[], i=0, results=context.getElementsByTagName(tag);if(tag === "*"){while(elem = results[i++]) {if(elem.nodeType === 1){tmp.push(elem);}}return tmp;}return results;};Expr.find["CLASS"] = support.getElementsByClassName && function(className, context){if(documentIsHTML){return context.getElementsByClassName(className);}};rbuggyMatches = [];rbuggyQSA = [];if(support.qsa = rnative.test(doc.querySelectorAll)){assert(function(div){docElem.appendChild(div).innerHTML = "<a id='" + expando + "'></a>" + "<select id='" + expando + "-\f]' msallowcapture=''>" + "<option selected=''></option></select>";if(div.querySelectorAll("[msallowcapture^='']").length){rbuggyQSA.push("[*^$]=" + whitespace + "*(?:''|\"\")");}if(!div.querySelectorAll("[selected]").length){rbuggyQSA.push("\\[" + whitespace + "*(?:value|" + booleans + ")");}if(!div.querySelectorAll("[id~=" + expando + "-]").length){rbuggyQSA.push("~=");}if(!div.querySelectorAll(":checked").length){rbuggyQSA.push(":checked");}if(!div.querySelectorAll("a#" + expando + "+*").length){rbuggyQSA.push(".#.+[+~]");}});assert(function(div){var input=doc.createElement("input");input.setAttribute("type", "hidden");div.appendChild(input).setAttribute("name", "D");if(div.querySelectorAll("[name=d]").length){rbuggyQSA.push("name" + whitespace + "*[*^$|!~]?=");}if(!div.querySelectorAll(":enabled").length){rbuggyQSA.push(":enabled", ":disabled");}div.querySelectorAll("*,:x");rbuggyQSA.push(",.*:");});}if(support.matchesSelector = rnative.test(matches = docElem.matches || docElem.webkitMatchesSelector || docElem.mozMatchesSelector || docElem.oMatchesSelector || docElem.msMatchesSelector)){assert(function(div){support.disconnectedMatch = matches.call(div, "div");matches.call(div, "[s!='']:x");rbuggyMatches.push("!=", pseudos);});}rbuggyQSA = rbuggyQSA.length && new RegExp(rbuggyQSA.join("|"));rbuggyMatches = rbuggyMatches.length && new RegExp(rbuggyMatches.join("|"));hasCompare = rnative.test(docElem.compareDocumentPosition);contains = hasCompare || rnative.test(docElem.contains)?function(a, b){var adown=a.nodeType === 9?a.documentElement:a, bup=b && b.parentNode;return a === bup || !!(bup && bup.nodeType === 1 && (adown.contains?adown.contains(bup):a.compareDocumentPosition && a.compareDocumentPosition(bup) & 16));}:function(a, b){if(b){while(b = b.parentNode) {if(b === a){return true;}}}return false;};sortOrder = hasCompare?function(a, b){if(a === b){hasDuplicate = true;return 0;}var compare=!a.compareDocumentPosition - !b.compareDocumentPosition;if(compare){return compare;}compare = (a.ownerDocument || a) === (b.ownerDocument || b)?a.compareDocumentPosition(b):1;if(compare & 1 || !support.sortDetached && b.compareDocumentPosition(a) === compare){if(a === doc || a.ownerDocument === preferredDoc && contains(preferredDoc, a)){return -1;}if(b === doc || b.ownerDocument === preferredDoc && contains(preferredDoc, b)){return 1;}return sortInput?indexOf(sortInput, a) - indexOf(sortInput, b):0;}return compare & 4?-1:1;}:function(a, b){if(a === b){hasDuplicate = true;return 0;}var cur, i=0, aup=a.parentNode, bup=b.parentNode, ap=[a], bp=[b];if(!aup || !bup){return a === doc?-1:b === doc?1:aup?-1:bup?1:sortInput?indexOf(sortInput, a) - indexOf(sortInput, b):0;}else if(aup === bup){return siblingCheck(a, b);}cur = a;while(cur = cur.parentNode) {ap.unshift(cur);}cur = b;while(cur = cur.parentNode) {bp.unshift(cur);}while(ap[i] === bp[i]) {i++;}return i?siblingCheck(ap[i], bp[i]):ap[i] === preferredDoc?-1:bp[i] === preferredDoc?1:0;};return doc;};Sizzle.matches = function(expr, elements){return Sizzle(expr, null, null, elements);};Sizzle.matchesSelector = function(elem, expr){if((elem.ownerDocument || elem) !== document){setDocument(elem);}expr = expr.replace(rattributeQuotes, "='$1']");if(support.matchesSelector && documentIsHTML && (!rbuggyMatches || !rbuggyMatches.test(expr)) && (!rbuggyQSA || !rbuggyQSA.test(expr))){try{var ret=matches.call(elem, expr);if(ret || support.disconnectedMatch || elem.document && elem.document.nodeType !== 11){return ret;}}catch(e) {}}return Sizzle(expr, document, null, [elem]).length > 0;};Sizzle.contains = function(context, elem){if((context.ownerDocument || context) !== document){setDocument(context);}return contains(context, elem);};Sizzle.attr = function(elem, name){if((elem.ownerDocument || elem) !== document){setDocument(elem);}var fn=Expr.attrHandle[name.toLowerCase()], val=fn && hasOwn.call(Expr.attrHandle, name.toLowerCase())?fn(elem, name, !documentIsHTML):undefined;return val !== undefined?val:support.attributes || !documentIsHTML?elem.getAttribute(name):(val = elem.getAttributeNode(name)) && val.specified?val.value:null;};Sizzle.error = function(msg){throw new Error("Syntax error, unrecognized expression: " + msg);};Sizzle.uniqueSort = function(results){var elem, duplicates=[], j=0, i=0;hasDuplicate = !support.detectDuplicates;sortInput = !support.sortStable && results.slice(0);results.sort(sortOrder);if(hasDuplicate){while(elem = results[i++]) {if(elem === results[i]){j = duplicates.push(i);}}while(j--) {results.splice(duplicates[j], 1);}}sortInput = null;return results;};getText = Sizzle.getText = function(elem){var node, ret="", i=0, nodeType=elem.nodeType;if(!nodeType){while(node = elem[i++]) {ret += getText(node);}}else if(nodeType === 1 || nodeType === 9 || nodeType === 11){if(typeof elem.textContent === "string"){return elem.textContent;}else {for(elem = elem.firstChild; elem; elem = elem.nextSibling) {ret += getText(elem);}}}else if(nodeType === 3 || nodeType === 4){return elem.nodeValue;}return ret;};Expr = Sizzle.selectors = {cacheLength:50, createPseudo:markFunction, match:matchExpr, attrHandle:{}, find:{}, relative:{">":{dir:"parentNode", first:true}, " ":{dir:"parentNode"}, "+":{dir:"previousSibling", first:true}, "~":{dir:"previousSibling"}}, preFilter:{"ATTR":function ATTR(match){match[1] = match[1].replace(runescape, funescape);match[3] = (match[3] || match[4] || match[5] || "").replace(runescape, funescape);if(match[2] === "~="){match[3] = " " + match[3] + " ";}return match.slice(0, 4);}, "CHILD":function CHILD(match){match[1] = match[1].toLowerCase();if(match[1].slice(0, 3) === "nth"){if(!match[3]){Sizzle.error(match[0]);}match[4] = +(match[4]?match[5] + (match[6] || 1):2 * (match[3] === "even" || match[3] === "odd"));match[5] = +(match[7] + match[8] || match[3] === "odd");}else if(match[3]){Sizzle.error(match[0]);}return match;}, "PSEUDO":function PSEUDO(match){var excess, unquoted=!match[6] && match[2];if(matchExpr["CHILD"].test(match[0])){return null;}if(match[3]){match[2] = match[4] || match[5] || "";}else if(unquoted && rpseudo.test(unquoted) && (excess = tokenize(unquoted, true)) && (excess = unquoted.indexOf(")", unquoted.length - excess) - unquoted.length)){match[0] = match[0].slice(0, excess);match[2] = unquoted.slice(0, excess);}return match.slice(0, 3);}}, filter:{"TAG":function TAG(nodeNameSelector){var nodeName=nodeNameSelector.replace(runescape, funescape).toLowerCase();return nodeNameSelector === "*"?function(){return true;}:function(elem){return elem.nodeName && elem.nodeName.toLowerCase() === nodeName;};}, "CLASS":function CLASS(className){var pattern=classCache[className + " "];return pattern || (pattern = new RegExp("(^|" + whitespace + ")" + className + "(" + whitespace + "|$)")) && classCache(className, function(elem){return pattern.test(typeof elem.className === "string" && elem.className || typeof elem.getAttribute !== "undefined" && elem.getAttribute("class") || "");});}, "ATTR":function ATTR(name, operator, check){return function(elem){var result=Sizzle.attr(elem, name);if(result == null){return operator === "!=";}if(!operator){return true;}result += "";return operator === "="?result === check:operator === "!="?result !== check:operator === "^="?check && result.indexOf(check) === 0:operator === "*="?check && result.indexOf(check) > -1:operator === "$="?check && result.slice(-check.length) === check:operator === "~="?(" " + result.replace(rwhitespace, " ") + " ").indexOf(check) > -1:operator === "|="?result === check || result.slice(0, check.length + 1) === check + "-":false;};}, "CHILD":function CHILD(type, what, argument, first, last){var simple=type.slice(0, 3) !== "nth", forward=type.slice(-4) !== "last", ofType=what === "of-type";return first === 1 && last === 0?function(elem){return !!elem.parentNode;}:function(elem, context, xml){var cache, outerCache, node, diff, nodeIndex, start, dir=simple !== forward?"nextSibling":"previousSibling", parent=elem.parentNode, name=ofType && elem.nodeName.toLowerCase(), useCache=!xml && !ofType;if(parent){if(simple){while(dir) {node = elem;while(node = node[dir]) {if(ofType?node.nodeName.toLowerCase() === name:node.nodeType === 1){return false;}}start = dir = type === "only" && !start && "nextSibling";}return true;}start = [forward?parent.firstChild:parent.lastChild];if(forward && useCache){outerCache = parent[expando] || (parent[expando] = {});cache = outerCache[type] || [];nodeIndex = cache[0] === dirruns && cache[1];diff = cache[0] === dirruns && cache[2];node = nodeIndex && parent.childNodes[nodeIndex];while(node = ++nodeIndex && node && node[dir] || (diff = nodeIndex = 0) || start.pop()) {if(node.nodeType === 1 && ++diff && node === elem){outerCache[type] = [dirruns, nodeIndex, diff];break;}}}else if(useCache && (cache = (elem[expando] || (elem[expando] = {}))[type]) && cache[0] === dirruns){diff = cache[1];}else {while(node = ++nodeIndex && node && node[dir] || (diff = nodeIndex = 0) || start.pop()) {if((ofType?node.nodeName.toLowerCase() === name:node.nodeType === 1) && ++diff){if(useCache){(node[expando] || (node[expando] = {}))[type] = [dirruns, diff];}if(node === elem){break;}}}}diff -= last;return diff === first || diff % first === 0 && diff / first >= 0;}};}, "PSEUDO":function PSEUDO(pseudo, argument){var args, fn=Expr.pseudos[pseudo] || Expr.setFilters[pseudo.toLowerCase()] || Sizzle.error("unsupported pseudo: " + pseudo);if(fn[expando]){return fn(argument);}if(fn.length > 1){args = [pseudo, pseudo, "", argument];return Expr.setFilters.hasOwnProperty(pseudo.toLowerCase())?markFunction(function(seed, matches){var idx, matched=fn(seed, argument), i=matched.length;while(i--) {idx = indexOf(seed, matched[i]);seed[idx] = !(matches[idx] = matched[i]);}}):function(elem){return fn(elem, 0, args);};}return fn;}}, pseudos:{"not":markFunction(function(selector){var input=[], results=[], matcher=compile(selector.replace(rtrim, "$1"));return matcher[expando]?markFunction(function(seed, matches, context, xml){var elem, unmatched=matcher(seed, null, xml, []), i=seed.length;while(i--) {if(elem = unmatched[i]){seed[i] = !(matches[i] = elem);}}}):function(elem, context, xml){input[0] = elem;matcher(input, null, xml, results);input[0] = null;return !results.pop();};}), "has":markFunction(function(selector){return function(elem){return Sizzle(selector, elem).length > 0;};}), "contains":markFunction(function(text){text = text.replace(runescape, funescape);return function(elem){return (elem.textContent || elem.innerText || getText(elem)).indexOf(text) > -1;};}), "lang":markFunction(function(lang){if(!ridentifier.test(lang || "")){Sizzle.error("unsupported lang: " + lang);}lang = lang.replace(runescape, funescape).toLowerCase();return function(elem){var elemLang;do {if(elemLang = documentIsHTML?elem.lang:elem.getAttribute("xml:lang") || elem.getAttribute("lang")){elemLang = elemLang.toLowerCase();return elemLang === lang || elemLang.indexOf(lang + "-") === 0;}}while((elem = elem.parentNode) && elem.nodeType === 1);return false;};}), "target":function target(elem){var hash=window.location && window.location.hash;return hash && hash.slice(1) === elem.id;}, "root":function root(elem){return elem === docElem;}, "focus":function focus(elem){return elem === document.activeElement && (!document.hasFocus || document.hasFocus()) && !!(elem.type || elem.href || ~elem.tabIndex);}, "enabled":function enabled(elem){return elem.disabled === false;}, "disabled":function disabled(elem){return elem.disabled === true;}, "checked":function checked(elem){var nodeName=elem.nodeName.toLowerCase();return nodeName === "input" && !!elem.checked || nodeName === "option" && !!elem.selected;}, "selected":function selected(elem){if(elem.parentNode){elem.parentNode.selectedIndex;}return elem.selected === true;}, "empty":function empty(elem){for(elem = elem.firstChild; elem; elem = elem.nextSibling) {if(elem.nodeType < 6){return false;}}return true;}, "parent":function parent(elem){return !Expr.pseudos["empty"](elem);}, "header":function header(elem){return rheader.test(elem.nodeName);}, "input":function input(elem){return rinputs.test(elem.nodeName);}, "button":function button(elem){var name=elem.nodeName.toLowerCase();return name === "input" && elem.type === "button" || name === "button";}, "text":function text(elem){var attr;return elem.nodeName.toLowerCase() === "input" && elem.type === "text" && ((attr = elem.getAttribute("type")) == null || attr.toLowerCase() === "text");}, "first":createPositionalPseudo(function(){return [0];}), "last":createPositionalPseudo(function(matchIndexes, length){return [length - 1];}), "eq":createPositionalPseudo(function(matchIndexes, length, argument){return [argument < 0?argument + length:argument];}), "even":createPositionalPseudo(function(matchIndexes, length){var i=0;for(; i < length; i += 2) {matchIndexes.push(i);}return matchIndexes;}), "odd":createPositionalPseudo(function(matchIndexes, length){var i=1;for(; i < length; i += 2) {matchIndexes.push(i);}return matchIndexes;}), "lt":createPositionalPseudo(function(matchIndexes, length, argument){var i=argument < 0?argument + length:argument;for(; --i >= 0;) {matchIndexes.push(i);}return matchIndexes;}), "gt":createPositionalPseudo(function(matchIndexes, length, argument){var i=argument < 0?argument + length:argument;for(; ++i < length;) {matchIndexes.push(i);}return matchIndexes;})}};Expr.pseudos["nth"] = Expr.pseudos["eq"];for(i in {radio:true, checkbox:true, file:true, password:true, image:true}) {Expr.pseudos[i] = createInputPseudo(i);}for(i in {submit:true, reset:true}) {Expr.pseudos[i] = createButtonPseudo(i);}function setFilters(){}setFilters.prototype = Expr.filters = Expr.pseudos;Expr.setFilters = new setFilters();tokenize = Sizzle.tokenize = function(selector, parseOnly){var matched, match, tokens, type, soFar, groups, preFilters, cached=tokenCache[selector + " "];if(cached){return parseOnly?0:cached.slice(0);}soFar = selector;groups = [];preFilters = Expr.preFilter;while(soFar) {if(!matched || (match = rcomma.exec(soFar))){if(match){soFar = soFar.slice(match[0].length) || soFar;}groups.push(tokens = []);}matched = false;if(match = rcombinators.exec(soFar)){matched = match.shift();tokens.push({value:matched, type:match[0].replace(rtrim, " ")});soFar = soFar.slice(matched.length);}for(type in Expr.filter) {if((match = matchExpr[type].exec(soFar)) && (!preFilters[type] || (match = preFilters[type](match)))){matched = match.shift();tokens.push({value:matched, type:type, matches:match});soFar = soFar.slice(matched.length);}}if(!matched){break;}}return parseOnly?soFar.length:soFar?Sizzle.error(selector):tokenCache(selector, groups).slice(0);};function toSelector(tokens){var i=0, len=tokens.length, selector="";for(; i < len; i++) {selector += tokens[i].value;}return selector;}function addCombinator(matcher, combinator, base){var dir=combinator.dir, checkNonElements=base && dir === "parentNode", doneName=done++;return combinator.first?function(elem, context, xml){while(elem = elem[dir]) {if(elem.nodeType === 1 || checkNonElements){return matcher(elem, context, xml);}}}:function(elem, context, xml){var oldCache, outerCache, newCache=[dirruns, doneName];if(xml){while(elem = elem[dir]) {if(elem.nodeType === 1 || checkNonElements){if(matcher(elem, context, xml)){return true;}}}}else {while(elem = elem[dir]) {if(elem.nodeType === 1 || checkNonElements){outerCache = elem[expando] || (elem[expando] = {});if((oldCache = outerCache[dir]) && oldCache[0] === dirruns && oldCache[1] === doneName){return newCache[2] = oldCache[2];}else {outerCache[dir] = newCache;if(newCache[2] = matcher(elem, context, xml)){return true;}}}}}};}function elementMatcher(matchers){return matchers.length > 1?function(elem, context, xml){var i=matchers.length;while(i--) {if(!matchers[i](elem, context, xml)){return false;}}return true;}:matchers[0];}function multipleContexts(selector, contexts, results){var i=0, len=contexts.length;for(; i < len; i++) {Sizzle(selector, contexts[i], results);}return results;}function condense(unmatched, map, filter, context, xml){var elem, newUnmatched=[], i=0, len=unmatched.length, mapped=map != null;for(; i < len; i++) {if(elem = unmatched[i]){if(!filter || filter(elem, context, xml)){newUnmatched.push(elem);if(mapped){map.push(i);}}}}return newUnmatched;}function setMatcher(preFilter, selector, matcher, postFilter, postFinder, postSelector){if(postFilter && !postFilter[expando]){postFilter = setMatcher(postFilter);}if(postFinder && !postFinder[expando]){postFinder = setMatcher(postFinder, postSelector);}return markFunction(function(seed, results, context, xml){var temp, i, elem, preMap=[], postMap=[], preexisting=results.length, elems=seed || multipleContexts(selector || "*", context.nodeType?[context]:context, []), matcherIn=preFilter && (seed || !selector)?condense(elems, preMap, preFilter, context, xml):elems, matcherOut=matcher?postFinder || (seed?preFilter:preexisting || postFilter)?[]:results:matcherIn;if(matcher){matcher(matcherIn, matcherOut, context, xml);}if(postFilter){temp = condense(matcherOut, postMap);postFilter(temp, [], context, xml);i = temp.length;while(i--) {if(elem = temp[i]){matcherOut[postMap[i]] = !(matcherIn[postMap[i]] = elem);}}}if(seed){if(postFinder || preFilter){if(postFinder){temp = [];i = matcherOut.length;while(i--) {if(elem = matcherOut[i]){temp.push(matcherIn[i] = elem);}}postFinder(null, matcherOut = [], temp, xml);}i = matcherOut.length;while(i--) {if((elem = matcherOut[i]) && (temp = postFinder?indexOf(seed, elem):preMap[i]) > -1){seed[temp] = !(results[temp] = elem);}}}}else {matcherOut = condense(matcherOut === results?matcherOut.splice(preexisting, matcherOut.length):matcherOut);if(postFinder){postFinder(null, results, matcherOut, xml);}else {push.apply(results, matcherOut);}}});}function matcherFromTokens(tokens){var checkContext, matcher, j, len=tokens.length, leadingRelative=Expr.relative[tokens[0].type], implicitRelative=leadingRelative || Expr.relative[" "], i=leadingRelative?1:0, matchContext=addCombinator(function(elem){return elem === checkContext;}, implicitRelative, true), matchAnyContext=addCombinator(function(elem){return indexOf(checkContext, elem) > -1;}, implicitRelative, true), matchers=[function(elem, context, xml){var ret=!leadingRelative && (xml || context !== outermostContext) || ((checkContext = context).nodeType?matchContext(elem, context, xml):matchAnyContext(elem, context, xml));checkContext = null;return ret;}];for(; i < len; i++) {if(matcher = Expr.relative[tokens[i].type]){matchers = [addCombinator(elementMatcher(matchers), matcher)];}else {matcher = Expr.filter[tokens[i].type].apply(null, tokens[i].matches);if(matcher[expando]){j = ++i;for(; j < len; j++) {if(Expr.relative[tokens[j].type]){break;}}return setMatcher(i > 1 && elementMatcher(matchers), i > 1 && toSelector(tokens.slice(0, i - 1).concat({value:tokens[i - 2].type === " "?"*":""})).replace(rtrim, "$1"), matcher, i < j && matcherFromTokens(tokens.slice(i, j)), j < len && matcherFromTokens(tokens = tokens.slice(j)), j < len && toSelector(tokens));}matchers.push(matcher);}}return elementMatcher(matchers);}function matcherFromGroupMatchers(elementMatchers, setMatchers){var bySet=setMatchers.length > 0, byElement=elementMatchers.length > 0, superMatcher=function superMatcher(seed, context, xml, results, outermost){var elem, j, matcher, matchedCount=0, i="0", unmatched=seed && [], setMatched=[], contextBackup=outermostContext, elems=seed || byElement && Expr.find["TAG"]("*", outermost), dirrunsUnique=dirruns += contextBackup == null?1:Math.random() || 0.1, len=elems.length;if(outermost){outermostContext = context !== document && context;}for(; i !== len && (elem = elems[i]) != null; i++) {if(byElement && elem){j = 0;while(matcher = elementMatchers[j++]) {if(matcher(elem, context, xml)){results.push(elem);break;}}if(outermost){dirruns = dirrunsUnique;}}if(bySet){if(elem = !matcher && elem){matchedCount--;}if(seed){unmatched.push(elem);}}}matchedCount += i;if(bySet && i !== matchedCount){j = 0;while(matcher = setMatchers[j++]) {matcher(unmatched, setMatched, context, xml);}if(seed){if(matchedCount > 0){while(i--) {if(!(unmatched[i] || setMatched[i])){setMatched[i] = pop.call(results);}}}setMatched = condense(setMatched);}push.apply(results, setMatched);if(outermost && !seed && setMatched.length > 0 && matchedCount + setMatchers.length > 1){Sizzle.uniqueSort(results);}}if(outermost){dirruns = dirrunsUnique;outermostContext = contextBackup;}return unmatched;};return bySet?markFunction(superMatcher):superMatcher;}compile = Sizzle.compile = function(selector, match){var i, setMatchers=[], elementMatchers=[], cached=compilerCache[selector + " "];if(!cached){if(!match){match = tokenize(selector);}i = match.length;while(i--) {cached = matcherFromTokens(match[i]);if(cached[expando]){setMatchers.push(cached);}else {elementMatchers.push(cached);}}cached = compilerCache(selector, matcherFromGroupMatchers(elementMatchers, setMatchers));cached.selector = selector;}return cached;};select = Sizzle.select = function(selector, context, results, seed){var i, tokens, token, type, find, compiled=typeof selector === "function" && selector, match=!seed && tokenize(selector = compiled.selector || selector);results = results || [];if(match.length === 1){tokens = match[0] = match[0].slice(0);if(tokens.length > 2 && (token = tokens[0]).type === "ID" && support.getById && context.nodeType === 9 && documentIsHTML && Expr.relative[tokens[1].type]){context = (Expr.find["ID"](token.matches[0].replace(runescape, funescape), context) || [])[0];if(!context){return results;}else if(compiled){context = context.parentNode;}selector = selector.slice(tokens.shift().value.length);}i = matchExpr["needsContext"].test(selector)?0:tokens.length;while(i--) {token = tokens[i];if(Expr.relative[type = token.type]){break;}if(find = Expr.find[type]){if(seed = find(token.matches[0].replace(runescape, funescape), rsibling.test(tokens[0].type) && testContext(context.parentNode) || context)){tokens.splice(i, 1);selector = seed.length && toSelector(tokens);if(!selector){push.apply(results, seed);return results;}break;}}}}(compiled || compile(selector, match))(seed, context, !documentIsHTML, results, rsibling.test(selector) && testContext(context.parentNode) || context);return results;};support.sortStable = expando.split("").sort(sortOrder).join("") === expando;support.detectDuplicates = !!hasDuplicate;setDocument();support.sortDetached = assert(function(div1){return div1.compareDocumentPosition(document.createElement("div")) & 1;});if(!assert(function(div){div.innerHTML = "<a href='#'></a>";return div.firstChild.getAttribute("href") === "#";})){addHandle("type|href|height|width", function(elem, name, isXML){if(!isXML){return elem.getAttribute(name, name.toLowerCase() === "type"?1:2);}});}if(!support.attributes || !assert(function(div){div.innerHTML = "<input/>";div.firstChild.setAttribute("value", "");return div.firstChild.getAttribute("value") === "";})){addHandle("value", function(elem, name, isXML){if(!isXML && elem.nodeName.toLowerCase() === "input"){return elem.defaultValue;}});}if(!assert(function(div){return div.getAttribute("disabled") == null;})){addHandle(booleans, function(elem, name, isXML){var val;if(!isXML){return elem[name] === true?name.toLowerCase():(val = elem.getAttributeNode(name)) && val.specified?val.value:null;}});}return Sizzle;})(window);jQuery.find = Sizzle;jQuery.expr = Sizzle.selectors;jQuery.expr[":"] = jQuery.expr.pseudos;jQuery.unique = Sizzle.uniqueSort;jQuery.text = Sizzle.getText;jQuery.isXMLDoc = Sizzle.isXML;jQuery.contains = Sizzle.contains;var rneedsContext=jQuery.expr.match.needsContext;var rsingleTag=/^<(\w+)\s*\/?>(?:<\/\1>|)$/;var risSimple=/^.[^:#\[\.,]*$/;function winnow(elements, qualifier, not){if(jQuery.isFunction(qualifier)){return jQuery.grep(elements, function(elem, i){return !!qualifier.call(elem, i, elem) !== not;});}if(qualifier.nodeType){return jQuery.grep(elements, function(elem){return elem === qualifier !== not;});}if(typeof qualifier === "string"){if(risSimple.test(qualifier)){return jQuery.filter(qualifier, elements, not);}qualifier = jQuery.filter(qualifier, elements);}return jQuery.grep(elements, function(elem){return indexOf.call(qualifier, elem) >= 0 !== not;});}jQuery.filter = function(expr, elems, not){var elem=elems[0];if(not){expr = ":not(" + expr + ")";}return elems.length === 1 && elem.nodeType === 1?jQuery.find.matchesSelector(elem, expr)?[elem]:[]:jQuery.find.matches(expr, jQuery.grep(elems, function(elem){return elem.nodeType === 1;}));};jQuery.fn.extend({find:function find(selector){var i, len=this.length, ret=[], self=this;if(typeof selector !== "string"){return this.pushStack(jQuery(selector).filter(function(){for(i = 0; i < len; i++) {if(jQuery.contains(self[i], this)){return true;}}}));}for(i = 0; i < len; i++) {jQuery.find(selector, self[i], ret);}ret = this.pushStack(len > 1?jQuery.unique(ret):ret);ret.selector = this.selector?this.selector + " " + selector:selector;return ret;}, filter:function filter(selector){return this.pushStack(winnow(this, selector || [], false));}, not:function not(selector){return this.pushStack(winnow(this, selector || [], true));}, is:function is(selector){return !!winnow(this, typeof selector === "string" && rneedsContext.test(selector)?jQuery(selector):selector || [], false).length;}});var rootjQuery, rquickExpr=/^(?:\s*(<[\w\W]+>)[^>]*|#([\w-]*))$/, init=jQuery.fn.init = function(selector, context){var match, elem;if(!selector){return this;}if(typeof selector === "string"){if(selector[0] === "<" && selector[selector.length - 1] === ">" && selector.length >= 3){match = [null, selector, null];}else {match = rquickExpr.exec(selector);}if(match && (match[1] || !context)){if(match[1]){context = context instanceof jQuery?context[0]:context;jQuery.merge(this, jQuery.parseHTML(match[1], context && context.nodeType?context.ownerDocument || context:document, true));if(rsingleTag.test(match[1]) && jQuery.isPlainObject(context)){for(match in context) {if(jQuery.isFunction(this[match])){this[match](context[match]);}else {this.attr(match, context[match]);}}}return this;}else {elem = document.getElementById(match[2]);if(elem && elem.parentNode){this.length = 1;this[0] = elem;}this.context = document;this.selector = selector;return this;}}else if(!context || context.jquery){return (context || rootjQuery).find(selector);}else {return this.constructor(context).find(selector);}}else if(selector.nodeType){this.context = this[0] = selector;this.length = 1;return this;}else if(jQuery.isFunction(selector)){return typeof rootjQuery.ready !== "undefined"?rootjQuery.ready(selector):selector(jQuery);}if(selector.selector !== undefined){this.selector = selector.selector;this.context = selector.context;}return jQuery.makeArray(selector, this);};init.prototype = jQuery.fn;rootjQuery = jQuery(document);var rparentsprev=/^(?:parents|prev(?:Until|All))/, guaranteedUnique={children:true, contents:true, next:true, prev:true};jQuery.extend({dir:function dir(elem, _dir, until){var matched=[], truncate=until !== undefined;while((elem = elem[_dir]) && elem.nodeType !== 9) {if(elem.nodeType === 1){if(truncate && jQuery(elem).is(until)){break;}matched.push(elem);}}return matched;}, sibling:function sibling(n, elem){var matched=[];for(; n; n = n.nextSibling) {if(n.nodeType === 1 && n !== elem){matched.push(n);}}return matched;}});jQuery.fn.extend({has:function has(target){var targets=jQuery(target, this), l=targets.length;return this.filter(function(){var i=0;for(; i < l; i++) {if(jQuery.contains(this, targets[i])){return true;}}});}, closest:function closest(selectors, context){var cur, i=0, l=this.length, matched=[], pos=rneedsContext.test(selectors) || typeof selectors !== "string"?jQuery(selectors, context || this.context):0;for(; i < l; i++) {for(cur = this[i]; cur && cur !== context; cur = cur.parentNode) {if(cur.nodeType < 11 && (pos?pos.index(cur) > -1:cur.nodeType === 1 && jQuery.find.matchesSelector(cur, selectors))){matched.push(cur);break;}}}return this.pushStack(matched.length > 1?jQuery.unique(matched):matched);}, index:function index(elem){if(!elem){return this[0] && this[0].parentNode?this.first().prevAll().length:-1;}if(typeof elem === "string"){return indexOf.call(jQuery(elem), this[0]);}return indexOf.call(this, elem.jquery?elem[0]:elem);}, add:function add(selector, context){return this.pushStack(jQuery.unique(jQuery.merge(this.get(), jQuery(selector, context))));}, addBack:function addBack(selector){return this.add(selector == null?this.prevObject:this.prevObject.filter(selector));}});function sibling(cur, dir){while((cur = cur[dir]) && cur.nodeType !== 1) {}return cur;}jQuery.each({parent:function parent(elem){var parent=elem.parentNode;return parent && parent.nodeType !== 11?parent:null;}, parents:function parents(elem){return jQuery.dir(elem, "parentNode");}, parentsUntil:function parentsUntil(elem, i, until){return jQuery.dir(elem, "parentNode", until);}, next:function next(elem){return sibling(elem, "nextSibling");}, prev:function prev(elem){return sibling(elem, "previousSibling");}, nextAll:function nextAll(elem){return jQuery.dir(elem, "nextSibling");}, prevAll:function prevAll(elem){return jQuery.dir(elem, "previousSibling");}, nextUntil:function nextUntil(elem, i, until){return jQuery.dir(elem, "nextSibling", until);}, prevUntil:function prevUntil(elem, i, until){return jQuery.dir(elem, "previousSibling", until);}, siblings:function siblings(elem){return jQuery.sibling((elem.parentNode || {}).firstChild, elem);}, children:function children(elem){return jQuery.sibling(elem.firstChild);}, contents:function contents(elem){return elem.contentDocument || jQuery.merge([], elem.childNodes);}}, function(name, fn){jQuery.fn[name] = function(until, selector){var matched=jQuery.map(this, fn, until);if(name.slice(-5) !== "Until"){selector = until;}if(selector && typeof selector === "string"){matched = jQuery.filter(selector, matched);}if(this.length > 1){if(!guaranteedUnique[name]){jQuery.unique(matched);}if(rparentsprev.test(name)){matched.reverse();}}return this.pushStack(matched);};});var rnotwhite=/\S+/g;var optionsCache={};function createOptions(options){var object=optionsCache[options] = {};jQuery.each(options.match(rnotwhite) || [], function(_, flag){object[flag] = true;});return object;}jQuery.Callbacks = function(options){options = typeof options === "string"?optionsCache[options] || createOptions(options):jQuery.extend({}, options);var memory, _fired, firing, firingStart, firingLength, firingIndex, list=[], stack=!options.once && [], fire=function fire(data){memory = options.memory && data;_fired = true;firingIndex = firingStart || 0;firingStart = 0;firingLength = list.length;firing = true;for(; list && firingIndex < firingLength; firingIndex++) {if(list[firingIndex].apply(data[0], data[1]) === false && options.stopOnFalse){memory = false;break;}}firing = false;if(list){if(stack){if(stack.length){fire(stack.shift());}}else if(memory){list = [];}else {self.disable();}}}, self={add:function add(){if(list){var start=list.length;(function add(args){jQuery.each(args, function(_, arg){var type=jQuery.type(arg);if(type === "function"){if(!options.unique || !self.has(arg)){list.push(arg);}}else if(arg && arg.length && type !== "string"){add(arg);}});})(arguments);if(firing){firingLength = list.length;}else if(memory){firingStart = start;fire(memory);}}return this;}, remove:function remove(){if(list){jQuery.each(arguments, function(_, arg){var index;while((index = jQuery.inArray(arg, list, index)) > -1) {list.splice(index, 1);if(firing){if(index <= firingLength){firingLength--;}if(index <= firingIndex){firingIndex--;}}}});}return this;}, has:function has(fn){return fn?jQuery.inArray(fn, list) > -1:!!(list && list.length);}, empty:function empty(){list = [];firingLength = 0;return this;}, disable:function disable(){list = stack = memory = undefined;return this;}, disabled:function disabled(){return !list;}, lock:function lock(){stack = undefined;if(!memory){self.disable();}return this;}, locked:function locked(){return !stack;}, fireWith:function fireWith(context, args){if(list && (!_fired || stack)){args = args || [];args = [context, args.slice?args.slice():args];if(firing){stack.push(args);}else {fire(args);}}return this;}, fire:function fire(){self.fireWith(this, arguments);return this;}, fired:function fired(){return !!_fired;}};return self;};jQuery.extend({Deferred:function Deferred(func){var tuples=[["resolve", "done", jQuery.Callbacks("once memory"), "resolved"], ["reject", "fail", jQuery.Callbacks("once memory"), "rejected"], ["notify", "progress", jQuery.Callbacks("memory")]], _state="pending", _promise={state:function state(){return _state;}, always:function always(){deferred.done(arguments).fail(arguments);return this;}, then:function then(){var fns=arguments;return jQuery.Deferred(function(newDefer){jQuery.each(tuples, function(i, tuple){var fn=jQuery.isFunction(fns[i]) && fns[i];deferred[tuple[1]](function(){var returned=fn && fn.apply(this, arguments);if(returned && jQuery.isFunction(returned.promise)){returned.promise().done(newDefer.resolve).fail(newDefer.reject).progress(newDefer.notify);}else {newDefer[tuple[0] + "With"](this === _promise?newDefer.promise():this, fn?[returned]:arguments);}});});fns = null;}).promise();}, promise:function promise(obj){return obj != null?jQuery.extend(obj, _promise):_promise;}}, deferred={};_promise.pipe = _promise.then;jQuery.each(tuples, function(i, tuple){var list=tuple[2], stateString=tuple[3];_promise[tuple[1]] = list.add;if(stateString){list.add(function(){_state = stateString;}, tuples[i ^ 1][2].disable, tuples[2][2].lock);}deferred[tuple[0]] = function(){deferred[tuple[0] + "With"](this === deferred?_promise:this, arguments);return this;};deferred[tuple[0] + "With"] = list.fireWith;});_promise.promise(deferred);if(func){func.call(deferred, deferred);}return deferred;}, when:function when(subordinate){var i=0, resolveValues=_slice.call(arguments), length=resolveValues.length, remaining=length !== 1 || subordinate && jQuery.isFunction(subordinate.promise)?length:0, deferred=remaining === 1?subordinate:jQuery.Deferred(), updateFunc=function updateFunc(i, contexts, values){return function(value){contexts[i] = this;values[i] = arguments.length > 1?_slice.call(arguments):value;if(values === progressValues){deferred.notifyWith(contexts, values);}else if(! --remaining){deferred.resolveWith(contexts, values);}};}, progressValues, progressContexts, resolveContexts;if(length > 1){progressValues = new Array(length);progressContexts = new Array(length);resolveContexts = new Array(length);for(; i < length; i++) {if(resolveValues[i] && jQuery.isFunction(resolveValues[i].promise)){resolveValues[i].promise().done(updateFunc(i, resolveContexts, resolveValues)).fail(deferred.reject).progress(updateFunc(i, progressContexts, progressValues));}else {--remaining;}}}if(!remaining){deferred.resolveWith(resolveContexts, resolveValues);}return deferred.promise();}});var readyList;jQuery.fn.ready = function(fn){jQuery.ready.promise().done(fn);return this;};jQuery.extend({isReady:false, readyWait:1, holdReady:function holdReady(hold){if(hold){jQuery.readyWait++;}else {jQuery.ready(true);}}, ready:function ready(wait){if(wait === true?--jQuery.readyWait:jQuery.isReady){return;}jQuery.isReady = true;if(wait !== true && --jQuery.readyWait > 0){return;}readyList.resolveWith(document, [jQuery]);if(jQuery.fn.triggerHandler){jQuery(document).triggerHandler("ready");jQuery(document).off("ready");}}});function completed(){document.removeEventListener("DOMContentLoaded", completed, false);window.removeEventListener("load", completed, false);jQuery.ready();}jQuery.ready.promise = function(obj){if(!readyList){readyList = jQuery.Deferred();if(document.readyState === "complete"){setTimeout(jQuery.ready);}else {document.addEventListener("DOMContentLoaded", completed, false);window.addEventListener("load", completed, false);}}return readyList.promise(obj);};jQuery.ready.promise();var access=jQuery.access = function(elems, fn, key, value, chainable, emptyGet, raw){var i=0, len=elems.length, bulk=key == null;if(jQuery.type(key) === "object"){chainable = true;for(i in key) {jQuery.access(elems, fn, i, key[i], true, emptyGet, raw);}}else if(value !== undefined){chainable = true;if(!jQuery.isFunction(value)){raw = true;}if(bulk){if(raw){fn.call(elems, value);fn = null;}else {bulk = fn;fn = function(elem, key, value){return bulk.call(jQuery(elem), value);};}}if(fn){for(; i < len; i++) {fn(elems[i], key, raw?value:value.call(elems[i], i, fn(elems[i], key)));}}}return chainable?elems:bulk?fn.call(elems):len?fn(elems[0], key):emptyGet;};jQuery.acceptData = function(owner){return owner.nodeType === 1 || owner.nodeType === 9 || ! +owner.nodeType;};function Data(){Object.defineProperty(this.cache = {}, 0, {get:function get(){return {};}});this.expando = jQuery.expando + Data.uid++;}Data.uid = 1;Data.accepts = jQuery.acceptData;Data.prototype = {key:function key(owner){if(!Data.accepts(owner)){return 0;}var descriptor={}, unlock=owner[this.expando];if(!unlock){unlock = Data.uid++;try{descriptor[this.expando] = {value:unlock};Object.defineProperties(owner, descriptor);}catch(e) {descriptor[this.expando] = unlock;jQuery.extend(owner, descriptor);}}if(!this.cache[unlock]){this.cache[unlock] = {};}return unlock;}, set:function set(owner, data, value){var prop, unlock=this.key(owner), cache=this.cache[unlock];if(typeof data === "string"){cache[data] = value;}else {if(jQuery.isEmptyObject(cache)){jQuery.extend(this.cache[unlock], data);}else {for(prop in data) {cache[prop] = data[prop];}}}return cache;}, get:function get(owner, key){var cache=this.cache[this.key(owner)];return key === undefined?cache:cache[key];}, access:function access(owner, key, value){var stored;if(key === undefined || key && typeof key === "string" && value === undefined){stored = this.get(owner, key);return stored !== undefined?stored:this.get(owner, jQuery.camelCase(key));}this.set(owner, key, value);return value !== undefined?value:key;}, remove:function remove(owner, key){var i, name, camel, unlock=this.key(owner), cache=this.cache[unlock];if(key === undefined){this.cache[unlock] = {};}else {if(jQuery.isArray(key)){name = key.concat(key.map(jQuery.camelCase));}else {camel = jQuery.camelCase(key);if(key in cache){name = [key, camel];}else {name = camel;name = name in cache?[name]:name.match(rnotwhite) || [];}}i = name.length;while(i--) {delete cache[name[i]];}}}, hasData:function hasData(owner){return !jQuery.isEmptyObject(this.cache[owner[this.expando]] || {});}, discard:function discard(owner){if(owner[this.expando]){delete this.cache[owner[this.expando]];}}};var data_priv=new Data();var data_user=new Data();var rbrace=/^(?:\{[\w\W]*\}|\[[\w\W]*\])$/, rmultiDash=/([A-Z])/g;function dataAttr(elem, key, data){var name;if(data === undefined && elem.nodeType === 1){name = "data-" + key.replace(rmultiDash, "-$1").toLowerCase();data = elem.getAttribute(name);if(typeof data === "string"){try{data = data === "true"?true:data === "false"?false:data === "null"?null:+data + "" === data?+data:rbrace.test(data)?jQuery.parseJSON(data):data;}catch(e) {}data_user.set(elem, key, data);}else {data = undefined;}}return data;}jQuery.extend({hasData:function hasData(elem){return data_user.hasData(elem) || data_priv.hasData(elem);}, data:function data(elem, name, _data){return data_user.access(elem, name, _data);}, removeData:function removeData(elem, name){data_user.remove(elem, name);}, _data:function _data(elem, name, data){return data_priv.access(elem, name, data);}, _removeData:function _removeData(elem, name){data_priv.remove(elem, name);}});jQuery.fn.extend({data:function data(key, value){var i, name, data, elem=this[0], attrs=elem && elem.attributes;if(key === undefined){if(this.length){data = data_user.get(elem);if(elem.nodeType === 1 && !data_priv.get(elem, "hasDataAttrs")){i = attrs.length;while(i--) {if(attrs[i]){name = attrs[i].name;if(name.indexOf("data-") === 0){name = jQuery.camelCase(name.slice(5));dataAttr(elem, name, data[name]);}}}data_priv.set(elem, "hasDataAttrs", true);}}return data;}if(typeof key === "object"){return this.each(function(){data_user.set(this, key);});}return access(this, function(value){var data, camelKey=jQuery.camelCase(key);if(elem && value === undefined){data = data_user.get(elem, key);if(data !== undefined){return data;}data = data_user.get(elem, camelKey);if(data !== undefined){return data;}data = dataAttr(elem, camelKey, undefined);if(data !== undefined){return data;}return;}this.each(function(){var data=data_user.get(this, camelKey);data_user.set(this, camelKey, value);if(key.indexOf("-") !== -1 && data !== undefined){data_user.set(this, key, value);}});}, null, value, arguments.length > 1, null, true);}, removeData:function removeData(key){return this.each(function(){data_user.remove(this, key);});}});jQuery.extend({queue:function queue(elem, type, data){var queue;if(elem){type = (type || "fx") + "queue";queue = data_priv.get(elem, type);if(data){if(!queue || jQuery.isArray(data)){queue = data_priv.access(elem, type, jQuery.makeArray(data));}else {queue.push(data);}}return queue || [];}}, dequeue:function dequeue(elem, type){type = type || "fx";var queue=jQuery.queue(elem, type), startLength=queue.length, fn=queue.shift(), hooks=jQuery._queueHooks(elem, type), next=function next(){jQuery.dequeue(elem, type);};if(fn === "inprogress"){fn = queue.shift();startLength--;}if(fn){if(type === "fx"){queue.unshift("inprogress");}delete hooks.stop;fn.call(elem, next, hooks);}if(!startLength && hooks){hooks.empty.fire();}}, _queueHooks:function _queueHooks(elem, type){var key=type + "queueHooks";return data_priv.get(elem, key) || data_priv.access(elem, key, {empty:jQuery.Callbacks("once memory").add(function(){data_priv.remove(elem, [type + "queue", key]);})});}});jQuery.fn.extend({queue:function queue(type, data){var setter=2;if(typeof type !== "string"){data = type;type = "fx";setter--;}if(arguments.length < setter){return jQuery.queue(this[0], type);}return data === undefined?this:this.each(function(){var queue=jQuery.queue(this, type, data);jQuery._queueHooks(this, type);if(type === "fx" && queue[0] !== "inprogress"){jQuery.dequeue(this, type);}});}, dequeue:function dequeue(type){return this.each(function(){jQuery.dequeue(this, type);});}, clearQueue:function clearQueue(type){return this.queue(type || "fx", []);}, promise:function promise(type, obj){var tmp, count=1, defer=jQuery.Deferred(), elements=this, i=this.length, resolve=function resolve(){if(! --count){defer.resolveWith(elements, [elements]);}};if(typeof type !== "string"){obj = type;type = undefined;}type = type || "fx";while(i--) {tmp = data_priv.get(elements[i], type + "queueHooks");if(tmp && tmp.empty){count++;tmp.empty.add(resolve);}}resolve();return defer.promise(obj);}});var pnum=/[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/.source;var cssExpand=["Top", "Right", "Bottom", "Left"];var isHidden=function isHidden(elem, el){elem = el || elem;return jQuery.css(elem, "display") === "none" || !jQuery.contains(elem.ownerDocument, elem);};var rcheckableType=/^(?:checkbox|radio)$/i;(function(){var fragment=document.createDocumentFragment(), div=fragment.appendChild(document.createElement("div")), input=document.createElement("input");input.setAttribute("type", "radio");input.setAttribute("checked", "checked");input.setAttribute("name", "t");div.appendChild(input);support.checkClone = div.cloneNode(true).cloneNode(true).lastChild.checked;div.innerHTML = "<textarea>x</textarea>";support.noCloneChecked = !!div.cloneNode(true).lastChild.defaultValue;})();var strundefined=typeof undefined;support.focusinBubbles = "onfocusin" in window;var rkeyEvent=/^key/, rmouseEvent=/^(?:mouse|pointer|contextmenu)|click/, rfocusMorph=/^(?:focusinfocus|focusoutblur)$/, rtypenamespace=/^([^.]*)(?:\.(.+)|)$/;function returnTrue(){return true;}function returnFalse(){return false;}function safeActiveElement(){try{return document.activeElement;}catch(err) {}}jQuery.event = {global:{}, add:function add(elem, types, handler, data, selector){var handleObjIn, eventHandle, tmp, events, t, handleObj, special, handlers, type, namespaces, origType, elemData=data_priv.get(elem);if(!elemData){return;}if(handler.handler){handleObjIn = handler;handler = handleObjIn.handler;selector = handleObjIn.selector;}if(!handler.guid){handler.guid = jQuery.guid++;}if(!(events = elemData.events)){events = elemData.events = {};}if(!(eventHandle = elemData.handle)){eventHandle = elemData.handle = function(e){return typeof jQuery !== strundefined && jQuery.event.triggered !== e.type?jQuery.event.dispatch.apply(elem, arguments):undefined;};}types = (types || "").match(rnotwhite) || [""];t = types.length;while(t--) {tmp = rtypenamespace.exec(types[t]) || [];type = origType = tmp[1];namespaces = (tmp[2] || "").split(".").sort();if(!type){continue;}special = jQuery.event.special[type] || {};type = (selector?special.delegateType:special.bindType) || type;special = jQuery.event.special[type] || {};handleObj = jQuery.extend({type:type, origType:origType, data:data, handler:handler, guid:handler.guid, selector:selector, needsContext:selector && jQuery.expr.match.needsContext.test(selector), namespace:namespaces.join(".")}, handleObjIn);if(!(handlers = events[type])){handlers = events[type] = [];handlers.delegateCount = 0;if(!special.setup || special.setup.call(elem, data, namespaces, eventHandle) === false){if(elem.addEventListener){elem.addEventListener(type, eventHandle, false);}}}if(special.add){special.add.call(elem, handleObj);if(!handleObj.handler.guid){handleObj.handler.guid = handler.guid;}}if(selector){handlers.splice(handlers.delegateCount++, 0, handleObj);}else {handlers.push(handleObj);}jQuery.event.global[type] = true;}}, remove:function remove(elem, types, handler, selector, mappedTypes){var j, origCount, tmp, events, t, handleObj, special, handlers, type, namespaces, origType, elemData=data_priv.hasData(elem) && data_priv.get(elem);if(!elemData || !(events = elemData.events)){return;}types = (types || "").match(rnotwhite) || [""];t = types.length;while(t--) {tmp = rtypenamespace.exec(types[t]) || [];type = origType = tmp[1];namespaces = (tmp[2] || "").split(".").sort();if(!type){for(type in events) {jQuery.event.remove(elem, type + types[t], handler, selector, true);}continue;}special = jQuery.event.special[type] || {};type = (selector?special.delegateType:special.bindType) || type;handlers = events[type] || [];tmp = tmp[2] && new RegExp("(^|\\.)" + namespaces.join("\\.(?:.*\\.|)") + "(\\.|$)");origCount = j = handlers.length;while(j--) {handleObj = handlers[j];if((mappedTypes || origType === handleObj.origType) && (!handler || handler.guid === handleObj.guid) && (!tmp || tmp.test(handleObj.namespace)) && (!selector || selector === handleObj.selector || selector === "**" && handleObj.selector)){handlers.splice(j, 1);if(handleObj.selector){handlers.delegateCount--;}if(special.remove){special.remove.call(elem, handleObj);}}}if(origCount && !handlers.length){if(!special.teardown || special.teardown.call(elem, namespaces, elemData.handle) === false){jQuery.removeEvent(elem, type, elemData.handle);}delete events[type];}}if(jQuery.isEmptyObject(events)){delete elemData.handle;data_priv.remove(elem, "events");}}, trigger:function trigger(event, data, elem, onlyHandlers){var i, cur, tmp, bubbleType, ontype, handle, special, eventPath=[elem || document], type=hasOwn.call(event, "type")?event.type:event, namespaces=hasOwn.call(event, "namespace")?event.namespace.split("."):[];cur = tmp = elem = elem || document;if(elem.nodeType === 3 || elem.nodeType === 8){return;}if(rfocusMorph.test(type + jQuery.event.triggered)){return;}if(type.indexOf(".") >= 0){namespaces = type.split(".");type = namespaces.shift();namespaces.sort();}ontype = type.indexOf(":") < 0 && "on" + type;event = event[jQuery.expando]?event:new jQuery.Event(type, typeof event === "object" && event);event.isTrigger = onlyHandlers?2:3;event.namespace = namespaces.join(".");event.namespace_re = event.namespace?new RegExp("(^|\\.)" + namespaces.join("\\.(?:.*\\.|)") + "(\\.|$)"):null;event.result = undefined;if(!event.target){event.target = elem;}data = data == null?[event]:jQuery.makeArray(data, [event]);special = jQuery.event.special[type] || {};if(!onlyHandlers && special.trigger && special.trigger.apply(elem, data) === false){return;}if(!onlyHandlers && !special.noBubble && !jQuery.isWindow(elem)){bubbleType = special.delegateType || type;if(!rfocusMorph.test(bubbleType + type)){cur = cur.parentNode;}for(; cur; cur = cur.parentNode) {eventPath.push(cur);tmp = cur;}if(tmp === (elem.ownerDocument || document)){eventPath.push(tmp.defaultView || tmp.parentWindow || window);}}i = 0;while((cur = eventPath[i++]) && !event.isPropagationStopped()) {event.type = i > 1?bubbleType:special.bindType || type;handle = (data_priv.get(cur, "events") || {})[event.type] && data_priv.get(cur, "handle");if(handle){handle.apply(cur, data);}handle = ontype && cur[ontype];if(handle && handle.apply && jQuery.acceptData(cur)){event.result = handle.apply(cur, data);if(event.result === false){event.preventDefault();}}}event.type = type;if(!onlyHandlers && !event.isDefaultPrevented()){if((!special._default || special._default.apply(eventPath.pop(), data) === false) && jQuery.acceptData(elem)){if(ontype && jQuery.isFunction(elem[type]) && !jQuery.isWindow(elem)){tmp = elem[ontype];if(tmp){elem[ontype] = null;}jQuery.event.triggered = type;elem[type]();jQuery.event.triggered = undefined;if(tmp){elem[ontype] = tmp;}}}}return event.result;}, dispatch:function dispatch(event){event = jQuery.event.fix(event);var i, j, ret, matched, handleObj, handlerQueue=[], args=_slice.call(arguments), handlers=(data_priv.get(this, "events") || {})[event.type] || [], special=jQuery.event.special[event.type] || {};args[0] = event;event.delegateTarget = this;if(special.preDispatch && special.preDispatch.call(this, event) === false){return;}handlerQueue = jQuery.event.handlers.call(this, event, handlers);i = 0;while((matched = handlerQueue[i++]) && !event.isPropagationStopped()) {event.currentTarget = matched.elem;j = 0;while((handleObj = matched.handlers[j++]) && !event.isImmediatePropagationStopped()) {if(!event.namespace_re || event.namespace_re.test(handleObj.namespace)){event.handleObj = handleObj;event.data = handleObj.data;ret = ((jQuery.event.special[handleObj.origType] || {}).handle || handleObj.handler).apply(matched.elem, args);if(ret !== undefined){if((event.result = ret) === false){event.preventDefault();event.stopPropagation();}}}}}if(special.postDispatch){special.postDispatch.call(this, event);}return event.result;}, handlers:function handlers(event, _handlers){var i, matches, sel, handleObj, handlerQueue=[], delegateCount=_handlers.delegateCount, cur=event.target;if(delegateCount && cur.nodeType && (!event.button || event.type !== "click")){for(; cur !== this; cur = cur.parentNode || this) {if(cur.disabled !== true || event.type !== "click"){matches = [];for(i = 0; i < delegateCount; i++) {handleObj = _handlers[i];sel = handleObj.selector + " ";if(matches[sel] === undefined){matches[sel] = handleObj.needsContext?jQuery(sel, this).index(cur) >= 0:jQuery.find(sel, this, null, [cur]).length;}if(matches[sel]){matches.push(handleObj);}}if(matches.length){handlerQueue.push({elem:cur, handlers:matches});}}}}if(delegateCount < _handlers.length){handlerQueue.push({elem:this, handlers:_handlers.slice(delegateCount)});}return handlerQueue;}, props:"altKey bubbles cancelable ctrlKey currentTarget eventPhase metaKey relatedTarget shiftKey target timeStamp view which".split(" "), fixHooks:{}, keyHooks:{props:"char charCode key keyCode".split(" "), filter:function filter(event, original){if(event.which == null){event.which = original.charCode != null?original.charCode:original.keyCode;}return event;}}, mouseHooks:{props:"button buttons clientX clientY offsetX offsetY pageX pageY screenX screenY toElement".split(" "), filter:function filter(event, original){var eventDoc, doc, body, button=original.button;if(event.pageX == null && original.clientX != null){eventDoc = event.target.ownerDocument || document;doc = eventDoc.documentElement;body = eventDoc.body;event.pageX = original.clientX + (doc && doc.scrollLeft || body && body.scrollLeft || 0) - (doc && doc.clientLeft || body && body.clientLeft || 0);event.pageY = original.clientY + (doc && doc.scrollTop || body && body.scrollTop || 0) - (doc && doc.clientTop || body && body.clientTop || 0);}if(!event.which && button !== undefined){event.which = button & 1?1:button & 2?3:button & 4?2:0;}return event;}}, fix:function fix(event){if(event[jQuery.expando]){return event;}var i, prop, copy, type=event.type, originalEvent=event, fixHook=this.fixHooks[type];if(!fixHook){this.fixHooks[type] = fixHook = rmouseEvent.test(type)?this.mouseHooks:rkeyEvent.test(type)?this.keyHooks:{};}copy = fixHook.props?this.props.concat(fixHook.props):this.props;event = new jQuery.Event(originalEvent);i = copy.length;while(i--) {prop = copy[i];event[prop] = originalEvent[prop];}if(!event.target){event.target = document;}if(event.target.nodeType === 3){event.target = event.target.parentNode;}return fixHook.filter?fixHook.filter(event, originalEvent):event;}, special:{load:{noBubble:true}, focus:{trigger:function trigger(){if(this !== safeActiveElement() && this.focus){this.focus();return false;}}, delegateType:"focusin"}, blur:{trigger:function trigger(){if(this === safeActiveElement() && this.blur){this.blur();return false;}}, delegateType:"focusout"}, click:{trigger:function trigger(){if(this.type === "checkbox" && this.click && jQuery.nodeName(this, "input")){this.click();return false;}}, _default:function _default(event){return jQuery.nodeName(event.target, "a");}}, beforeunload:{postDispatch:function postDispatch(event){if(event.result !== undefined && event.originalEvent){event.originalEvent.returnValue = event.result;}}}}, simulate:function simulate(type, elem, event, bubble){var e=jQuery.extend(new jQuery.Event(), event, {type:type, isSimulated:true, originalEvent:{}});if(bubble){jQuery.event.trigger(e, null, elem);}else {jQuery.event.dispatch.call(elem, e);}if(e.isDefaultPrevented()){event.preventDefault();}}};jQuery.removeEvent = function(elem, type, handle){if(elem.removeEventListener){elem.removeEventListener(type, handle, false);}};jQuery.Event = function(src, props){if(!(this instanceof jQuery.Event)){return new jQuery.Event(src, props);}if(src && src.type){this.originalEvent = src;this.type = src.type;this.isDefaultPrevented = src.defaultPrevented || src.defaultPrevented === undefined && src.returnValue === false?returnTrue:returnFalse;}else {this.type = src;}if(props){jQuery.extend(this, props);}this.timeStamp = src && src.timeStamp || jQuery.now();this[jQuery.expando] = true;};jQuery.Event.prototype = {isDefaultPrevented:returnFalse, isPropagationStopped:returnFalse, isImmediatePropagationStopped:returnFalse, preventDefault:function preventDefault(){var e=this.originalEvent;this.isDefaultPrevented = returnTrue;if(e && e.preventDefault){e.preventDefault();}}, stopPropagation:function stopPropagation(){var e=this.originalEvent;this.isPropagationStopped = returnTrue;if(e && e.stopPropagation){e.stopPropagation();}}, stopImmediatePropagation:function stopImmediatePropagation(){var e=this.originalEvent;this.isImmediatePropagationStopped = returnTrue;if(e && e.stopImmediatePropagation){e.stopImmediatePropagation();}this.stopPropagation();}};jQuery.each({mouseenter:"mouseover", mouseleave:"mouseout", pointerenter:"pointerover", pointerleave:"pointerout"}, function(orig, fix){jQuery.event.special[orig] = {delegateType:fix, bindType:fix, handle:function handle(event){var ret, target=this, related=event.relatedTarget, handleObj=event.handleObj;if(!related || related !== target && !jQuery.contains(target, related)){event.type = handleObj.origType;ret = handleObj.handler.apply(this, arguments);event.type = fix;}return ret;}};});if(!support.focusinBubbles){jQuery.each({focus:"focusin", blur:"focusout"}, function(orig, fix){var handler=function handler(event){jQuery.event.simulate(fix, event.target, jQuery.event.fix(event), true);};jQuery.event.special[fix] = {setup:function setup(){var doc=this.ownerDocument || this, attaches=data_priv.access(doc, fix);if(!attaches){doc.addEventListener(orig, handler, true);}data_priv.access(doc, fix, (attaches || 0) + 1);}, teardown:function teardown(){var doc=this.ownerDocument || this, attaches=data_priv.access(doc, fix) - 1;if(!attaches){doc.removeEventListener(orig, handler, true);data_priv.remove(doc, fix);}else {data_priv.access(doc, fix, attaches);}}};});}jQuery.fn.extend({on:function on(types, selector, data, fn, one){var origFn, type;if(typeof types === "object"){if(typeof selector !== "string"){data = data || selector;selector = undefined;}for(type in types) {this.on(type, selector, data, types[type], one);}return this;}if(data == null && fn == null){fn = selector;data = selector = undefined;}else if(fn == null){if(typeof selector === "string"){fn = data;data = undefined;}else {fn = data;data = selector;selector = undefined;}}if(fn === false){fn = returnFalse;}else if(!fn){return this;}if(one === 1){origFn = fn;fn = function(event){jQuery().off(event);return origFn.apply(this, arguments);};fn.guid = origFn.guid || (origFn.guid = jQuery.guid++);}return this.each(function(){jQuery.event.add(this, types, fn, data, selector);});}, one:function one(types, selector, data, fn){return this.on(types, selector, data, fn, 1);}, off:function off(types, selector, fn){var handleObj, type;if(types && types.preventDefault && types.handleObj){handleObj = types.handleObj;jQuery(types.delegateTarget).off(handleObj.namespace?handleObj.origType + "." + handleObj.namespace:handleObj.origType, handleObj.selector, handleObj.handler);return this;}if(typeof types === "object"){for(type in types) {this.off(type, selector, types[type]);}return this;}if(selector === false || typeof selector === "function"){fn = selector;selector = undefined;}if(fn === false){fn = returnFalse;}return this.each(function(){jQuery.event.remove(this, types, fn, selector);});}, trigger:function trigger(type, data){return this.each(function(){jQuery.event.trigger(type, data, this);});}, triggerHandler:function triggerHandler(type, data){var elem=this[0];if(elem){return jQuery.event.trigger(type, data, elem, true);}}});var rxhtmlTag=/<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/gi, rtagName=/<([\w:]+)/, rhtml=/<|&#?\w+;/, rnoInnerhtml=/<(?:script|style|link)/i, rchecked=/checked\s*(?:[^=]|=\s*.checked.)/i, rscriptType=/^$|\/(?:java|ecma)script/i, rscriptTypeMasked=/^true\/(.*)/, rcleanScript=/^\s*<!(?:\[CDATA\[|--)|(?:\]\]|--)>\s*$/g, wrapMap={option:[1, "<select multiple='multiple'>", "</select>"], thead:[1, "<table>", "</table>"], col:[2, "<table><colgroup>", "</colgroup></table>"], tr:[2, "<table><tbody>", "</tbody></table>"], td:[3, "<table><tbody><tr>", "</tr></tbody></table>"], _default:[0, "", ""]};wrapMap.optgroup = wrapMap.option;wrapMap.tbody = wrapMap.tfoot = wrapMap.colgroup = wrapMap.caption = wrapMap.thead;wrapMap.th = wrapMap.td;function manipulationTarget(elem, content){return jQuery.nodeName(elem, "table") && jQuery.nodeName(content.nodeType !== 11?content:content.firstChild, "tr")?elem.getElementsByTagName("tbody")[0] || elem.appendChild(elem.ownerDocument.createElement("tbody")):elem;}function disableScript(elem){elem.type = (elem.getAttribute("type") !== null) + "/" + elem.type;return elem;}function restoreScript(elem){var match=rscriptTypeMasked.exec(elem.type);if(match){elem.type = match[1];}else {elem.removeAttribute("type");}return elem;}function setGlobalEval(elems, refElements){var i=0, l=elems.length;for(; i < l; i++) {data_priv.set(elems[i], "globalEval", !refElements || data_priv.get(refElements[i], "globalEval"));}}function cloneCopyEvent(src, dest){var i, l, type, pdataOld, pdataCur, udataOld, udataCur, events;if(dest.nodeType !== 1){return;}if(data_priv.hasData(src)){pdataOld = data_priv.access(src);pdataCur = data_priv.set(dest, pdataOld);events = pdataOld.events;if(events){delete pdataCur.handle;pdataCur.events = {};for(type in events) {for(i = 0, l = events[type].length; i < l; i++) {jQuery.event.add(dest, type, events[type][i]);}}}}if(data_user.hasData(src)){udataOld = data_user.access(src);udataCur = jQuery.extend({}, udataOld);data_user.set(dest, udataCur);}}function getAll(context, tag){var ret=context.getElementsByTagName?context.getElementsByTagName(tag || "*"):context.querySelectorAll?context.querySelectorAll(tag || "*"):[];return tag === undefined || tag && jQuery.nodeName(context, tag)?jQuery.merge([context], ret):ret;}function fixInput(src, dest){var nodeName=dest.nodeName.toLowerCase();if(nodeName === "input" && rcheckableType.test(src.type)){dest.checked = src.checked;}else if(nodeName === "input" || nodeName === "textarea"){dest.defaultValue = src.defaultValue;}}jQuery.extend({clone:function clone(elem, dataAndEvents, deepDataAndEvents){var i, l, srcElements, destElements, clone=elem.cloneNode(true), inPage=jQuery.contains(elem.ownerDocument, elem);if(!support.noCloneChecked && (elem.nodeType === 1 || elem.nodeType === 11) && !jQuery.isXMLDoc(elem)){destElements = getAll(clone);srcElements = getAll(elem);for(i = 0, l = srcElements.length; i < l; i++) {fixInput(srcElements[i], destElements[i]);}}if(dataAndEvents){if(deepDataAndEvents){srcElements = srcElements || getAll(elem);destElements = destElements || getAll(clone);for(i = 0, l = srcElements.length; i < l; i++) {cloneCopyEvent(srcElements[i], destElements[i]);}}else {cloneCopyEvent(elem, clone);}}destElements = getAll(clone, "script");if(destElements.length > 0){setGlobalEval(destElements, !inPage && getAll(elem, "script"));}return clone;}, buildFragment:function buildFragment(elems, context, scripts, selection){var elem, tmp, tag, wrap, contains, j, fragment=context.createDocumentFragment(), nodes=[], i=0, l=elems.length;for(; i < l; i++) {elem = elems[i];if(elem || elem === 0){if(jQuery.type(elem) === "object"){jQuery.merge(nodes, elem.nodeType?[elem]:elem);}else if(!rhtml.test(elem)){nodes.push(context.createTextNode(elem));}else {tmp = tmp || fragment.appendChild(context.createElement("div"));tag = (rtagName.exec(elem) || ["", ""])[1].toLowerCase();wrap = wrapMap[tag] || wrapMap._default;tmp.innerHTML = wrap[1] + elem.replace(rxhtmlTag, "<$1></$2>") + wrap[2];j = wrap[0];while(j--) {tmp = tmp.lastChild;}jQuery.merge(nodes, tmp.childNodes);tmp = fragment.firstChild;tmp.textContent = "";}}}fragment.textContent = "";i = 0;while(elem = nodes[i++]) {if(selection && jQuery.inArray(elem, selection) !== -1){continue;}contains = jQuery.contains(elem.ownerDocument, elem);tmp = getAll(fragment.appendChild(elem), "script");if(contains){setGlobalEval(tmp);}if(scripts){j = 0;while(elem = tmp[j++]) {if(rscriptType.test(elem.type || "")){scripts.push(elem);}}}}return fragment;}, cleanData:function cleanData(elems){var data, elem, type, key, special=jQuery.event.special, i=0;for(; (elem = elems[i]) !== undefined; i++) {if(jQuery.acceptData(elem)){key = elem[data_priv.expando];if(key && (data = data_priv.cache[key])){if(data.events){for(type in data.events) {if(special[type]){jQuery.event.remove(elem, type);}else {jQuery.removeEvent(elem, type, data.handle);}}}if(data_priv.cache[key]){delete data_priv.cache[key];}}}delete data_user.cache[elem[data_user.expando]];}}});jQuery.fn.extend({text:function text(value){return access(this, function(value){return value === undefined?jQuery.text(this):this.empty().each(function(){if(this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9){this.textContent = value;}});}, null, value, arguments.length);}, append:function append(){return this.domManip(arguments, function(elem){if(this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9){var target=manipulationTarget(this, elem);target.appendChild(elem);}});}, prepend:function prepend(){return this.domManip(arguments, function(elem){if(this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9){var target=manipulationTarget(this, elem);target.insertBefore(elem, target.firstChild);}});}, before:function before(){return this.domManip(arguments, function(elem){if(this.parentNode){this.parentNode.insertBefore(elem, this);}});}, after:function after(){return this.domManip(arguments, function(elem){if(this.parentNode){this.parentNode.insertBefore(elem, this.nextSibling);}});}, remove:function remove(selector, keepData){var elem, elems=selector?jQuery.filter(selector, this):this, i=0;for(; (elem = elems[i]) != null; i++) {if(!keepData && elem.nodeType === 1){jQuery.cleanData(getAll(elem));}if(elem.parentNode){if(keepData && jQuery.contains(elem.ownerDocument, elem)){setGlobalEval(getAll(elem, "script"));}elem.parentNode.removeChild(elem);}}return this;}, empty:function empty(){var elem, i=0;for(; (elem = this[i]) != null; i++) {if(elem.nodeType === 1){jQuery.cleanData(getAll(elem, false));elem.textContent = "";}}return this;}, clone:function clone(dataAndEvents, deepDataAndEvents){dataAndEvents = dataAndEvents == null?false:dataAndEvents;deepDataAndEvents = deepDataAndEvents == null?dataAndEvents:deepDataAndEvents;return this.map(function(){return jQuery.clone(this, dataAndEvents, deepDataAndEvents);});}, html:function html(value){return access(this, function(value){var elem=this[0] || {}, i=0, l=this.length;if(value === undefined && elem.nodeType === 1){return elem.innerHTML;}if(typeof value === "string" && !rnoInnerhtml.test(value) && !wrapMap[(rtagName.exec(value) || ["", ""])[1].toLowerCase()]){value = value.replace(rxhtmlTag, "<$1></$2>");try{for(; i < l; i++) {elem = this[i] || {};if(elem.nodeType === 1){jQuery.cleanData(getAll(elem, false));elem.innerHTML = value;}}elem = 0;}catch(e) {}}if(elem){this.empty().append(value);}}, null, value, arguments.length);}, replaceWith:function replaceWith(){var arg=arguments[0];this.domManip(arguments, function(elem){arg = this.parentNode;jQuery.cleanData(getAll(this));if(arg){arg.replaceChild(elem, this);}});return arg && (arg.length || arg.nodeType)?this:this.remove();}, detach:function detach(selector){return this.remove(selector, true);}, domManip:function domManip(args, callback){args = concat.apply([], args);var fragment, first, scripts, hasScripts, node, doc, i=0, l=this.length, set=this, iNoClone=l - 1, value=args[0], isFunction=jQuery.isFunction(value);if(isFunction || l > 1 && typeof value === "string" && !support.checkClone && rchecked.test(value)){return this.each(function(index){var self=set.eq(index);if(isFunction){args[0] = value.call(this, index, self.html());}self.domManip(args, callback);});}if(l){fragment = jQuery.buildFragment(args, this[0].ownerDocument, false, this);first = fragment.firstChild;if(fragment.childNodes.length === 1){fragment = first;}if(first){scripts = jQuery.map(getAll(fragment, "script"), disableScript);hasScripts = scripts.length;for(; i < l; i++) {node = fragment;if(i !== iNoClone){node = jQuery.clone(node, true, true);if(hasScripts){jQuery.merge(scripts, getAll(node, "script"));}}callback.call(this[i], node, i);}if(hasScripts){doc = scripts[scripts.length - 1].ownerDocument;jQuery.map(scripts, restoreScript);for(i = 0; i < hasScripts; i++) {node = scripts[i];if(rscriptType.test(node.type || "") && !data_priv.access(node, "globalEval") && jQuery.contains(doc, node)){if(node.src){if(jQuery._evalUrl){jQuery._evalUrl(node.src);}}else {jQuery.globalEval(node.textContent.replace(rcleanScript, ""));}}}}}}return this;}});jQuery.each({appendTo:"append", prependTo:"prepend", insertBefore:"before", insertAfter:"after", replaceAll:"replaceWith"}, function(name, original){jQuery.fn[name] = function(selector){var elems, ret=[], insert=jQuery(selector), last=insert.length - 1, i=0;for(; i <= last; i++) {elems = i === last?this:this.clone(true);jQuery(insert[i])[original](elems);push.apply(ret, elems.get());}return this.pushStack(ret);};});var iframe, elemdisplay={};function actualDisplay(name, doc){var style, elem=jQuery(doc.createElement(name)).appendTo(doc.body), display=window.getDefaultComputedStyle && (style = window.getDefaultComputedStyle(elem[0]))?style.display:jQuery.css(elem[0], "display");elem.detach();return display;}function defaultDisplay(nodeName){var doc=document, display=elemdisplay[nodeName];if(!display){display = actualDisplay(nodeName, doc);if(display === "none" || !display){iframe = (iframe || jQuery("<iframe frameborder='0' width='0' height='0'/>")).appendTo(doc.documentElement);doc = iframe[0].contentDocument;doc.write();doc.close();display = actualDisplay(nodeName, doc);iframe.detach();}elemdisplay[nodeName] = display;}return display;}var rmargin=/^margin/;var rnumnonpx=new RegExp("^(" + pnum + ")(?!px)[a-z%]+$", "i");var getStyles=function getStyles(elem){if(elem.ownerDocument.defaultView.opener){return elem.ownerDocument.defaultView.getComputedStyle(elem, null);}return window.getComputedStyle(elem, null);};function curCSS(elem, name, computed){var width, minWidth, maxWidth, ret, style=elem.style;computed = computed || getStyles(elem);if(computed){ret = computed.getPropertyValue(name) || computed[name];}if(computed){if(ret === "" && !jQuery.contains(elem.ownerDocument, elem)){ret = jQuery.style(elem, name);}if(rnumnonpx.test(ret) && rmargin.test(name)){width = style.width;minWidth = style.minWidth;maxWidth = style.maxWidth;style.minWidth = style.maxWidth = style.width = ret;ret = computed.width;style.width = width;style.minWidth = minWidth;style.maxWidth = maxWidth;}}return ret !== undefined?ret + "":ret;}function addGetHookIf(conditionFn, hookFn){return {get:function get(){if(conditionFn()){delete this.get;return;}return (this.get = hookFn).apply(this, arguments);}};}(function(){var pixelPositionVal, boxSizingReliableVal, docElem=document.documentElement, container=document.createElement("div"), div=document.createElement("div");if(!div.style){return;}div.style.backgroundClip = "content-box";div.cloneNode(true).style.backgroundClip = "";support.clearCloneStyle = div.style.backgroundClip === "content-box";container.style.cssText = "border:0;width:0;height:0;top:0;left:-9999px;margin-top:1px;" + "position:absolute";container.appendChild(div);function computePixelPositionAndBoxSizingReliable(){div.style.cssText = "-webkit-box-sizing:border-box;-moz-box-sizing:border-box;" + "box-sizing:border-box;display:block;margin-top:1%;top:1%;" + "border:1px;padding:1px;width:4px;position:absolute";div.innerHTML = "";docElem.appendChild(container);var divStyle=window.getComputedStyle(div, null);pixelPositionVal = divStyle.top !== "1%";boxSizingReliableVal = divStyle.width === "4px";docElem.removeChild(container);}if(window.getComputedStyle){jQuery.extend(support, {pixelPosition:function pixelPosition(){computePixelPositionAndBoxSizingReliable();return pixelPositionVal;}, boxSizingReliable:function boxSizingReliable(){if(boxSizingReliableVal == null){computePixelPositionAndBoxSizingReliable();}return boxSizingReliableVal;}, reliableMarginRight:function reliableMarginRight(){var ret, marginDiv=div.appendChild(document.createElement("div"));marginDiv.style.cssText = div.style.cssText = "-webkit-box-sizing:content-box;-moz-box-sizing:content-box;" + "box-sizing:content-box;display:block;margin:0;border:0;padding:0";marginDiv.style.marginRight = marginDiv.style.width = "0";div.style.width = "1px";docElem.appendChild(container);ret = !parseFloat(window.getComputedStyle(marginDiv, null).marginRight);docElem.removeChild(container);div.removeChild(marginDiv);return ret;}});}})();jQuery.swap = function(elem, options, callback, args){var ret, name, old={};for(name in options) {old[name] = elem.style[name];elem.style[name] = options[name];}ret = callback.apply(elem, args || []);for(name in options) {elem.style[name] = old[name];}return ret;};var rdisplayswap=/^(none|table(?!-c[ea]).+)/, rnumsplit=new RegExp("^(" + pnum + ")(.*)$", "i"), rrelNum=new RegExp("^([+-])=(" + pnum + ")", "i"), cssShow={position:"absolute", visibility:"hidden", display:"block"}, cssNormalTransform={letterSpacing:"0", fontWeight:"400"}, cssPrefixes=["Webkit", "O", "Moz", "ms"];function vendorPropName(style, name){if(name in style){return name;}var capName=name[0].toUpperCase() + name.slice(1), origName=name, i=cssPrefixes.length;while(i--) {name = cssPrefixes[i] + capName;if(name in style){return name;}}return origName;}function setPositiveNumber(elem, value, subtract){var matches=rnumsplit.exec(value);return matches?Math.max(0, matches[1] - (subtract || 0)) + (matches[2] || "px"):value;}function augmentWidthOrHeight(elem, name, extra, isBorderBox, styles){var i=extra === (isBorderBox?"border":"content")?4:name === "width"?1:0, val=0;for(; i < 4; i += 2) {if(extra === "margin"){val += jQuery.css(elem, extra + cssExpand[i], true, styles);}if(isBorderBox){if(extra === "content"){val -= jQuery.css(elem, "padding" + cssExpand[i], true, styles);}if(extra !== "margin"){val -= jQuery.css(elem, "border" + cssExpand[i] + "Width", true, styles);}}else {val += jQuery.css(elem, "padding" + cssExpand[i], true, styles);if(extra !== "padding"){val += jQuery.css(elem, "border" + cssExpand[i] + "Width", true, styles);}}}return val;}function getWidthOrHeight(elem, name, extra){var valueIsBorderBox=true, val=name === "width"?elem.offsetWidth:elem.offsetHeight, styles=getStyles(elem), isBorderBox=jQuery.css(elem, "boxSizing", false, styles) === "border-box";if(val <= 0 || val == null){val = curCSS(elem, name, styles);if(val < 0 || val == null){val = elem.style[name];}if(rnumnonpx.test(val)){return val;}valueIsBorderBox = isBorderBox && (support.boxSizingReliable() || val === elem.style[name]);val = parseFloat(val) || 0;}return val + augmentWidthOrHeight(elem, name, extra || (isBorderBox?"border":"content"), valueIsBorderBox, styles) + "px";}function showHide(elements, show){var display, elem, hidden, values=[], index=0, length=elements.length;for(; index < length; index++) {elem = elements[index];if(!elem.style){continue;}values[index] = data_priv.get(elem, "olddisplay");display = elem.style.display;if(show){if(!values[index] && display === "none"){elem.style.display = "";}if(elem.style.display === "" && isHidden(elem)){values[index] = data_priv.access(elem, "olddisplay", defaultDisplay(elem.nodeName));}}else {hidden = isHidden(elem);if(display !== "none" || !hidden){data_priv.set(elem, "olddisplay", hidden?display:jQuery.css(elem, "display"));}}}for(index = 0; index < length; index++) {elem = elements[index];if(!elem.style){continue;}if(!show || elem.style.display === "none" || elem.style.display === ""){elem.style.display = show?values[index] || "":"none";}}return elements;}jQuery.extend({cssHooks:{opacity:{get:function get(elem, computed){if(computed){var ret=curCSS(elem, "opacity");return ret === ""?"1":ret;}}}}, cssNumber:{"columnCount":true, "fillOpacity":true, "flexGrow":true, "flexShrink":true, "fontWeight":true, "lineHeight":true, "opacity":true, "order":true, "orphans":true, "widows":true, "zIndex":true, "zoom":true}, cssProps:{"float":"cssFloat"}, style:function style(elem, name, value, extra){if(!elem || elem.nodeType === 3 || elem.nodeType === 8 || !elem.style){return;}var ret, type, hooks, origName=jQuery.camelCase(name), style=elem.style;name = jQuery.cssProps[origName] || (jQuery.cssProps[origName] = vendorPropName(style, origName));hooks = jQuery.cssHooks[name] || jQuery.cssHooks[origName];if(value !== undefined){type = typeof value;if(type === "string" && (ret = rrelNum.exec(value))){value = (ret[1] + 1) * ret[2] + parseFloat(jQuery.css(elem, name));type = "number";}if(value == null || value !== value){return;}if(type === "number" && !jQuery.cssNumber[origName]){value += "px";}if(!support.clearCloneStyle && value === "" && name.indexOf("background") === 0){style[name] = "inherit";}if(!hooks || !("set" in hooks) || (value = hooks.set(elem, value, extra)) !== undefined){style[name] = value;}}else {if(hooks && "get" in hooks && (ret = hooks.get(elem, false, extra)) !== undefined){return ret;}return style[name];}}, css:function css(elem, name, extra, styles){var val, num, hooks, origName=jQuery.camelCase(name);name = jQuery.cssProps[origName] || (jQuery.cssProps[origName] = vendorPropName(elem.style, origName));hooks = jQuery.cssHooks[name] || jQuery.cssHooks[origName];if(hooks && "get" in hooks){val = hooks.get(elem, true, extra);}if(val === undefined){val = curCSS(elem, name, styles);}if(val === "normal" && name in cssNormalTransform){val = cssNormalTransform[name];}if(extra === "" || extra){num = parseFloat(val);return extra === true || jQuery.isNumeric(num)?num || 0:val;}return val;}});jQuery.each(["height", "width"], function(i, name){jQuery.cssHooks[name] = {get:function get(elem, computed, extra){if(computed){return rdisplayswap.test(jQuery.css(elem, "display")) && elem.offsetWidth === 0?jQuery.swap(elem, cssShow, function(){return getWidthOrHeight(elem, name, extra);}):getWidthOrHeight(elem, name, extra);}}, set:function set(elem, value, extra){var styles=extra && getStyles(elem);return setPositiveNumber(elem, value, extra?augmentWidthOrHeight(elem, name, extra, jQuery.css(elem, "boxSizing", false, styles) === "border-box", styles):0);}};});jQuery.cssHooks.marginRight = addGetHookIf(support.reliableMarginRight, function(elem, computed){if(computed){return jQuery.swap(elem, {"display":"inline-block"}, curCSS, [elem, "marginRight"]);}});jQuery.each({margin:"", padding:"", border:"Width"}, function(prefix, suffix){jQuery.cssHooks[prefix + suffix] = {expand:function expand(value){var i=0, expanded={}, parts=typeof value === "string"?value.split(" "):[value];for(; i < 4; i++) {expanded[prefix + cssExpand[i] + suffix] = parts[i] || parts[i - 2] || parts[0];}return expanded;}};if(!rmargin.test(prefix)){jQuery.cssHooks[prefix + suffix].set = setPositiveNumber;}});jQuery.fn.extend({css:function css(name, value){return access(this, function(elem, name, value){var styles, len, map={}, i=0;if(jQuery.isArray(name)){styles = getStyles(elem);len = name.length;for(; i < len; i++) {map[name[i]] = jQuery.css(elem, name[i], false, styles);}return map;}return value !== undefined?jQuery.style(elem, name, value):jQuery.css(elem, name);}, name, value, arguments.length > 1);}, show:function show(){return showHide(this, true);}, hide:function hide(){return showHide(this);}, toggle:function toggle(state){if(typeof state === "boolean"){return state?this.show():this.hide();}return this.each(function(){if(isHidden(this)){jQuery(this).show();}else {jQuery(this).hide();}});}});function Tween(elem, options, prop, end, easing){return new Tween.prototype.init(elem, options, prop, end, easing);}jQuery.Tween = Tween;Tween.prototype = {constructor:Tween, init:function init(elem, options, prop, end, easing, unit){this.elem = elem;this.prop = prop;this.easing = easing || "swing";this.options = options;this.start = this.now = this.cur();this.end = end;this.unit = unit || (jQuery.cssNumber[prop]?"":"px");}, cur:function cur(){var hooks=Tween.propHooks[this.prop];return hooks && hooks.get?hooks.get(this):Tween.propHooks._default.get(this);}, run:function run(percent){var eased, hooks=Tween.propHooks[this.prop];if(this.options.duration){this.pos = eased = jQuery.easing[this.easing](percent, this.options.duration * percent, 0, 1, this.options.duration);}else {this.pos = eased = percent;}this.now = (this.end - this.start) * eased + this.start;if(this.options.step){this.options.step.call(this.elem, this.now, this);}if(hooks && hooks.set){hooks.set(this);}else {Tween.propHooks._default.set(this);}return this;}};Tween.prototype.init.prototype = Tween.prototype;Tween.propHooks = {_default:{get:function get(tween){var result;if(tween.elem[tween.prop] != null && (!tween.elem.style || tween.elem.style[tween.prop] == null)){return tween.elem[tween.prop];}result = jQuery.css(tween.elem, tween.prop, "");return !result || result === "auto"?0:result;}, set:function set(tween){if(jQuery.fx.step[tween.prop]){jQuery.fx.step[tween.prop](tween);}else if(tween.elem.style && (tween.elem.style[jQuery.cssProps[tween.prop]] != null || jQuery.cssHooks[tween.prop])){jQuery.style(tween.elem, tween.prop, tween.now + tween.unit);}else {tween.elem[tween.prop] = tween.now;}}}};Tween.propHooks.scrollTop = Tween.propHooks.scrollLeft = {set:function set(tween){if(tween.elem.nodeType && tween.elem.parentNode){tween.elem[tween.prop] = tween.now;}}};jQuery.easing = {linear:function linear(p){return p;}, swing:function swing(p){return 0.5 - Math.cos(p * Math.PI) / 2;}};jQuery.fx = Tween.prototype.init;jQuery.fx.step = {};var fxNow, timerId, rfxtypes=/^(?:toggle|show|hide)$/, rfxnum=new RegExp("^(?:([+-])=|)(" + pnum + ")([a-z%]*)$", "i"), rrun=/queueHooks$/, animationPrefilters=[defaultPrefilter], tweeners={"*":[function(prop, value){var tween=this.createTween(prop, value), target=tween.cur(), parts=rfxnum.exec(value), unit=parts && parts[3] || (jQuery.cssNumber[prop]?"":"px"), start=(jQuery.cssNumber[prop] || unit !== "px" && +target) && rfxnum.exec(jQuery.css(tween.elem, prop)), scale=1, maxIterations=20;if(start && start[3] !== unit){unit = unit || start[3];parts = parts || [];start = +target || 1;do {scale = scale || ".5";start = start / scale;jQuery.style(tween.elem, prop, start + unit);}while(scale !== (scale = tween.cur() / target) && scale !== 1 && --maxIterations);}if(parts){start = tween.start = +start || +target || 0;tween.unit = unit;tween.end = parts[1]?start + (parts[1] + 1) * parts[2]:+parts[2];}return tween;}]};function createFxNow(){setTimeout(function(){fxNow = undefined;});return fxNow = jQuery.now();}function genFx(type, includeWidth){var which, i=0, attrs={height:type};includeWidth = includeWidth?1:0;for(; i < 4; i += 2 - includeWidth) {which = cssExpand[i];attrs["margin" + which] = attrs["padding" + which] = type;}if(includeWidth){attrs.opacity = attrs.width = type;}return attrs;}function createTween(value, prop, animation){var tween, collection=(tweeners[prop] || []).concat(tweeners["*"]), index=0, length=collection.length;for(; index < length; index++) {if(tween = collection[index].call(animation, prop, value)){return tween;}}}function defaultPrefilter(elem, props, opts){var prop, value, toggle, tween, hooks, oldfire, display, checkDisplay, anim=this, orig={}, style=elem.style, hidden=elem.nodeType && isHidden(elem), dataShow=data_priv.get(elem, "fxshow");if(!opts.queue){hooks = jQuery._queueHooks(elem, "fx");if(hooks.unqueued == null){hooks.unqueued = 0;oldfire = hooks.empty.fire;hooks.empty.fire = function(){if(!hooks.unqueued){oldfire();}};}hooks.unqueued++;anim.always(function(){anim.always(function(){hooks.unqueued--;if(!jQuery.queue(elem, "fx").length){hooks.empty.fire();}});});}if(elem.nodeType === 1 && ("height" in props || "width" in props)){opts.overflow = [style.overflow, style.overflowX, style.overflowY];display = jQuery.css(elem, "display");checkDisplay = display === "none"?data_priv.get(elem, "olddisplay") || defaultDisplay(elem.nodeName):display;if(checkDisplay === "inline" && jQuery.css(elem, "float") === "none"){style.display = "inline-block";}}if(opts.overflow){style.overflow = "hidden";anim.always(function(){style.overflow = opts.overflow[0];style.overflowX = opts.overflow[1];style.overflowY = opts.overflow[2];});}for(prop in props) {value = props[prop];if(rfxtypes.exec(value)){delete props[prop];toggle = toggle || value === "toggle";if(value === (hidden?"hide":"show")){if(value === "show" && dataShow && dataShow[prop] !== undefined){hidden = true;}else {continue;}}orig[prop] = dataShow && dataShow[prop] || jQuery.style(elem, prop);}else {display = undefined;}}if(!jQuery.isEmptyObject(orig)){if(dataShow){if("hidden" in dataShow){hidden = dataShow.hidden;}}else {dataShow = data_priv.access(elem, "fxshow", {});}if(toggle){dataShow.hidden = !hidden;}if(hidden){jQuery(elem).show();}else {anim.done(function(){jQuery(elem).hide();});}anim.done(function(){var prop;data_priv.remove(elem, "fxshow");for(prop in orig) {jQuery.style(elem, prop, orig[prop]);}});for(prop in orig) {tween = createTween(hidden?dataShow[prop]:0, prop, anim);if(!(prop in dataShow)){dataShow[prop] = tween.start;if(hidden){tween.end = tween.start;tween.start = prop === "width" || prop === "height"?1:0;}}}}else if((display === "none"?defaultDisplay(elem.nodeName):display) === "inline"){style.display = display;}}function propFilter(props, specialEasing){var index, name, easing, value, hooks;for(index in props) {name = jQuery.camelCase(index);easing = specialEasing[name];value = props[index];if(jQuery.isArray(value)){easing = value[1];value = props[index] = value[0];}if(index !== name){props[name] = value;delete props[index];}hooks = jQuery.cssHooks[name];if(hooks && "expand" in hooks){value = hooks.expand(value);delete props[name];for(index in value) {if(!(index in props)){props[index] = value[index];specialEasing[index] = easing;}}}else {specialEasing[name] = easing;}}}function Animation(elem, properties, options){var result, stopped, index=0, length=animationPrefilters.length, deferred=jQuery.Deferred().always(function(){delete tick.elem;}), tick=function tick(){if(stopped){return false;}var currentTime=fxNow || createFxNow(), remaining=Math.max(0, animation.startTime + animation.duration - currentTime), temp=remaining / animation.duration || 0, percent=1 - temp, index=0, length=animation.tweens.length;for(; index < length; index++) {animation.tweens[index].run(percent);}deferred.notifyWith(elem, [animation, percent, remaining]);if(percent < 1 && length){return remaining;}else {deferred.resolveWith(elem, [animation]);return false;}}, animation=deferred.promise({elem:elem, props:jQuery.extend({}, properties), opts:jQuery.extend(true, {specialEasing:{}}, options), originalProperties:properties, originalOptions:options, startTime:fxNow || createFxNow(), duration:options.duration, tweens:[], createTween:function createTween(prop, end){var tween=jQuery.Tween(elem, animation.opts, prop, end, animation.opts.specialEasing[prop] || animation.opts.easing);animation.tweens.push(tween);return tween;}, stop:function stop(gotoEnd){var index=0, length=gotoEnd?animation.tweens.length:0;if(stopped){return this;}stopped = true;for(; index < length; index++) {animation.tweens[index].run(1);}if(gotoEnd){deferred.resolveWith(elem, [animation, gotoEnd]);}else {deferred.rejectWith(elem, [animation, gotoEnd]);}return this;}}), props=animation.props;propFilter(props, animation.opts.specialEasing);for(; index < length; index++) {result = animationPrefilters[index].call(animation, elem, props, animation.opts);if(result){return result;}}jQuery.map(props, createTween, animation);if(jQuery.isFunction(animation.opts.start)){animation.opts.start.call(elem, animation);}jQuery.fx.timer(jQuery.extend(tick, {elem:elem, anim:animation, queue:animation.opts.queue}));return animation.progress(animation.opts.progress).done(animation.opts.done, animation.opts.complete).fail(animation.opts.fail).always(animation.opts.always);}jQuery.Animation = jQuery.extend(Animation, {tweener:function tweener(props, callback){if(jQuery.isFunction(props)){callback = props;props = ["*"];}else {props = props.split(" ");}var prop, index=0, length=props.length;for(; index < length; index++) {prop = props[index];tweeners[prop] = tweeners[prop] || [];tweeners[prop].unshift(callback);}}, prefilter:function prefilter(callback, prepend){if(prepend){animationPrefilters.unshift(callback);}else {animationPrefilters.push(callback);}}});jQuery.speed = function(speed, easing, fn){var opt=speed && typeof speed === "object"?jQuery.extend({}, speed):{complete:fn || !fn && easing || jQuery.isFunction(speed) && speed, duration:speed, easing:fn && easing || easing && !jQuery.isFunction(easing) && easing};opt.duration = jQuery.fx.off?0:typeof opt.duration === "number"?opt.duration:opt.duration in jQuery.fx.speeds?jQuery.fx.speeds[opt.duration]:jQuery.fx.speeds._default;if(opt.queue == null || opt.queue === true){opt.queue = "fx";}opt.old = opt.complete;opt.complete = function(){if(jQuery.isFunction(opt.old)){opt.old.call(this);}if(opt.queue){jQuery.dequeue(this, opt.queue);}};return opt;};jQuery.fn.extend({fadeTo:function fadeTo(speed, to, easing, callback){return this.filter(isHidden).css("opacity", 0).show().end().animate({opacity:to}, speed, easing, callback);}, animate:function animate(prop, speed, easing, callback){var empty=jQuery.isEmptyObject(prop), optall=jQuery.speed(speed, easing, callback), doAnimation=function doAnimation(){var anim=Animation(this, jQuery.extend({}, prop), optall);if(empty || data_priv.get(this, "finish")){anim.stop(true);}};doAnimation.finish = doAnimation;return empty || optall.queue === false?this.each(doAnimation):this.queue(optall.queue, doAnimation);}, stop:function stop(type, clearQueue, gotoEnd){var stopQueue=function stopQueue(hooks){var stop=hooks.stop;delete hooks.stop;stop(gotoEnd);};if(typeof type !== "string"){gotoEnd = clearQueue;clearQueue = type;type = undefined;}if(clearQueue && type !== false){this.queue(type || "fx", []);}return this.each(function(){var dequeue=true, index=type != null && type + "queueHooks", timers=jQuery.timers, data=data_priv.get(this);if(index){if(data[index] && data[index].stop){stopQueue(data[index]);}}else {for(index in data) {if(data[index] && data[index].stop && rrun.test(index)){stopQueue(data[index]);}}}for(index = timers.length; index--;) {if(timers[index].elem === this && (type == null || timers[index].queue === type)){timers[index].anim.stop(gotoEnd);dequeue = false;timers.splice(index, 1);}}if(dequeue || !gotoEnd){jQuery.dequeue(this, type);}});}, finish:function finish(type){if(type !== false){type = type || "fx";}return this.each(function(){var index, data=data_priv.get(this), queue=data[type + "queue"], hooks=data[type + "queueHooks"], timers=jQuery.timers, length=queue?queue.length:0;data.finish = true;jQuery.queue(this, type, []);if(hooks && hooks.stop){hooks.stop.call(this, true);}for(index = timers.length; index--;) {if(timers[index].elem === this && timers[index].queue === type){timers[index].anim.stop(true);timers.splice(index, 1);}}for(index = 0; index < length; index++) {if(queue[index] && queue[index].finish){queue[index].finish.call(this);}}delete data.finish;});}});jQuery.each(["toggle", "show", "hide"], function(i, name){var cssFn=jQuery.fn[name];jQuery.fn[name] = function(speed, easing, callback){return speed == null || typeof speed === "boolean"?cssFn.apply(this, arguments):this.animate(genFx(name, true), speed, easing, callback);};});jQuery.each({slideDown:genFx("show"), slideUp:genFx("hide"), slideToggle:genFx("toggle"), fadeIn:{opacity:"show"}, fadeOut:{opacity:"hide"}, fadeToggle:{opacity:"toggle"}}, function(name, props){jQuery.fn[name] = function(speed, easing, callback){return this.animate(props, speed, easing, callback);};});jQuery.timers = [];jQuery.fx.tick = function(){var timer, i=0, timers=jQuery.timers;fxNow = jQuery.now();for(; i < timers.length; i++) {timer = timers[i];if(!timer() && timers[i] === timer){timers.splice(i--, 1);}}if(!timers.length){jQuery.fx.stop();}fxNow = undefined;};jQuery.fx.timer = function(timer){jQuery.timers.push(timer);if(timer()){jQuery.fx.start();}else {jQuery.timers.pop();}};jQuery.fx.interval = 13;jQuery.fx.start = function(){if(!timerId){timerId = setInterval(jQuery.fx.tick, jQuery.fx.interval);}};jQuery.fx.stop = function(){clearInterval(timerId);timerId = null;};jQuery.fx.speeds = {slow:600, fast:200, _default:400};jQuery.fn.delay = function(time, type){time = jQuery.fx?jQuery.fx.speeds[time] || time:time;type = type || "fx";return this.queue(type, function(next, hooks){var timeout=setTimeout(next, time);hooks.stop = function(){clearTimeout(timeout);};});};(function(){var input=document.createElement("input"), select=document.createElement("select"), opt=select.appendChild(document.createElement("option"));input.type = "checkbox";support.checkOn = input.value !== "";support.optSelected = opt.selected;select.disabled = true;support.optDisabled = !opt.disabled;input = document.createElement("input");input.value = "t";input.type = "radio";support.radioValue = input.value === "t";})();var nodeHook, boolHook, attrHandle=jQuery.expr.attrHandle;jQuery.fn.extend({attr:function attr(name, value){return access(this, jQuery.attr, name, value, arguments.length > 1);}, removeAttr:function removeAttr(name){return this.each(function(){jQuery.removeAttr(this, name);});}});jQuery.extend({attr:function attr(elem, name, value){var hooks, ret, nType=elem.nodeType;if(!elem || nType === 3 || nType === 8 || nType === 2){return;}if(typeof elem.getAttribute === strundefined){return jQuery.prop(elem, name, value);}if(nType !== 1 || !jQuery.isXMLDoc(elem)){name = name.toLowerCase();hooks = jQuery.attrHooks[name] || (jQuery.expr.match.bool.test(name)?boolHook:nodeHook);}if(value !== undefined){if(value === null){jQuery.removeAttr(elem, name);}else if(hooks && "set" in hooks && (ret = hooks.set(elem, value, name)) !== undefined){return ret;}else {elem.setAttribute(name, value + "");return value;}}else if(hooks && "get" in hooks && (ret = hooks.get(elem, name)) !== null){return ret;}else {ret = jQuery.find.attr(elem, name);return ret == null?undefined:ret;}}, removeAttr:function removeAttr(elem, value){var name, propName, i=0, attrNames=value && value.match(rnotwhite);if(attrNames && elem.nodeType === 1){while(name = attrNames[i++]) {propName = jQuery.propFix[name] || name;if(jQuery.expr.match.bool.test(name)){elem[propName] = false;}elem.removeAttribute(name);}}}, attrHooks:{type:{set:function set(elem, value){if(!support.radioValue && value === "radio" && jQuery.nodeName(elem, "input")){var val=elem.value;elem.setAttribute("type", value);if(val){elem.value = val;}return value;}}}}});boolHook = {set:function set(elem, value, name){if(value === false){jQuery.removeAttr(elem, name);}else {elem.setAttribute(name, name);}return name;}};jQuery.each(jQuery.expr.match.bool.source.match(/\w+/g), function(i, name){var getter=attrHandle[name] || jQuery.find.attr;attrHandle[name] = function(elem, name, isXML){var ret, handle;if(!isXML){handle = attrHandle[name];attrHandle[name] = ret;ret = getter(elem, name, isXML) != null?name.toLowerCase():null;attrHandle[name] = handle;}return ret;};});var rfocusable=/^(?:input|select|textarea|button)$/i;jQuery.fn.extend({prop:function prop(name, value){return access(this, jQuery.prop, name, value, arguments.length > 1);}, removeProp:function removeProp(name){return this.each(function(){delete this[jQuery.propFix[name] || name];});}});jQuery.extend({propFix:{"for":"htmlFor", "class":"className"}, prop:function prop(elem, name, value){var ret, hooks, notxml, nType=elem.nodeType;if(!elem || nType === 3 || nType === 8 || nType === 2){return;}notxml = nType !== 1 || !jQuery.isXMLDoc(elem);if(notxml){name = jQuery.propFix[name] || name;hooks = jQuery.propHooks[name];}if(value !== undefined){return hooks && "set" in hooks && (ret = hooks.set(elem, value, name)) !== undefined?ret:elem[name] = value;}else {return hooks && "get" in hooks && (ret = hooks.get(elem, name)) !== null?ret:elem[name];}}, propHooks:{tabIndex:{get:function get(elem){return elem.hasAttribute("tabindex") || rfocusable.test(elem.nodeName) || elem.href?elem.tabIndex:-1;}}}});if(!support.optSelected){jQuery.propHooks.selected = {get:function get(elem){var parent=elem.parentNode;if(parent && parent.parentNode){parent.parentNode.selectedIndex;}return null;}};}jQuery.each(["tabIndex", "readOnly", "maxLength", "cellSpacing", "cellPadding", "rowSpan", "colSpan", "useMap", "frameBorder", "contentEditable"], function(){jQuery.propFix[this.toLowerCase()] = this;});var rclass=/[\t\r\n\f]/g;jQuery.fn.extend({addClass:function addClass(value){var classes, elem, cur, clazz, j, finalValue, proceed=typeof value === "string" && value, i=0, len=this.length;if(jQuery.isFunction(value)){return this.each(function(j){jQuery(this).addClass(value.call(this, j, this.className));});}if(proceed){classes = (value || "").match(rnotwhite) || [];for(; i < len; i++) {elem = this[i];cur = elem.nodeType === 1 && (elem.className?(" " + elem.className + " ").replace(rclass, " "):" ");if(cur){j = 0;while(clazz = classes[j++]) {if(cur.indexOf(" " + clazz + " ") < 0){cur += clazz + " ";}}finalValue = jQuery.trim(cur);if(elem.className !== finalValue){elem.className = finalValue;}}}}return this;}, removeClass:function removeClass(value){var classes, elem, cur, clazz, j, finalValue, proceed=arguments.length === 0 || typeof value === "string" && value, i=0, len=this.length;if(jQuery.isFunction(value)){return this.each(function(j){jQuery(this).removeClass(value.call(this, j, this.className));});}if(proceed){classes = (value || "").match(rnotwhite) || [];for(; i < len; i++) {elem = this[i];cur = elem.nodeType === 1 && (elem.className?(" " + elem.className + " ").replace(rclass, " "):"");if(cur){j = 0;while(clazz = classes[j++]) {while(cur.indexOf(" " + clazz + " ") >= 0) {cur = cur.replace(" " + clazz + " ", " ");}}finalValue = value?jQuery.trim(cur):"";if(elem.className !== finalValue){elem.className = finalValue;}}}}return this;}, toggleClass:function toggleClass(value, stateVal){var type=typeof value;if(typeof stateVal === "boolean" && type === "string"){return stateVal?this.addClass(value):this.removeClass(value);}if(jQuery.isFunction(value)){return this.each(function(i){jQuery(this).toggleClass(value.call(this, i, this.className, stateVal), stateVal);});}return this.each(function(){if(type === "string"){var className, i=0, self=jQuery(this), classNames=value.match(rnotwhite) || [];while(className = classNames[i++]) {if(self.hasClass(className)){self.removeClass(className);}else {self.addClass(className);}}}else if(type === strundefined || type === "boolean"){if(this.className){data_priv.set(this, "__className__", this.className);}this.className = this.className || value === false?"":data_priv.get(this, "__className__") || "";}});}, hasClass:function hasClass(selector){var className=" " + selector + " ", i=0, l=this.length;for(; i < l; i++) {if(this[i].nodeType === 1 && (" " + this[i].className + " ").replace(rclass, " ").indexOf(className) >= 0){return true;}}return false;}});var rreturn=/\r/g;jQuery.fn.extend({val:function val(value){var hooks, ret, isFunction, elem=this[0];if(!arguments.length){if(elem){hooks = jQuery.valHooks[elem.type] || jQuery.valHooks[elem.nodeName.toLowerCase()];if(hooks && "get" in hooks && (ret = hooks.get(elem, "value")) !== undefined){return ret;}ret = elem.value;return typeof ret === "string"?ret.replace(rreturn, ""):ret == null?"":ret;}return;}isFunction = jQuery.isFunction(value);return this.each(function(i){var val;if(this.nodeType !== 1){return;}if(isFunction){val = value.call(this, i, jQuery(this).val());}else {val = value;}if(val == null){val = "";}else if(typeof val === "number"){val += "";}else if(jQuery.isArray(val)){val = jQuery.map(val, function(value){return value == null?"":value + "";});}hooks = jQuery.valHooks[this.type] || jQuery.valHooks[this.nodeName.toLowerCase()];if(!hooks || !("set" in hooks) || hooks.set(this, val, "value") === undefined){this.value = val;}});}});jQuery.extend({valHooks:{option:{get:function get(elem){var val=jQuery.find.attr(elem, "value");return val != null?val:jQuery.trim(jQuery.text(elem));}}, select:{get:function get(elem){var value, option, options=elem.options, index=elem.selectedIndex, one=elem.type === "select-one" || index < 0, values=one?null:[], max=one?index + 1:options.length, i=index < 0?max:one?index:0;for(; i < max; i++) {option = options[i];if((option.selected || i === index) && (support.optDisabled?!option.disabled:option.getAttribute("disabled") === null) && (!option.parentNode.disabled || !jQuery.nodeName(option.parentNode, "optgroup"))){value = jQuery(option).val();if(one){return value;}values.push(value);}}return values;}, set:function set(elem, value){var optionSet, option, options=elem.options, values=jQuery.makeArray(value), i=options.length;while(i--) {option = options[i];if(option.selected = jQuery.inArray(option.value, values) >= 0){optionSet = true;}}if(!optionSet){elem.selectedIndex = -1;}return values;}}}});jQuery.each(["radio", "checkbox"], function(){jQuery.valHooks[this] = {set:function set(elem, value){if(jQuery.isArray(value)){return elem.checked = jQuery.inArray(jQuery(elem).val(), value) >= 0;}}};if(!support.checkOn){jQuery.valHooks[this].get = function(elem){return elem.getAttribute("value") === null?"on":elem.value;};}});jQuery.each(("blur focus focusin focusout load resize scroll unload click dblclick " + "mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave " + "change select submit keydown keypress keyup error contextmenu").split(" "), function(i, name){jQuery.fn[name] = function(data, fn){return arguments.length > 0?this.on(name, null, data, fn):this.trigger(name);};});jQuery.fn.extend({hover:function hover(fnOver, fnOut){return this.mouseenter(fnOver).mouseleave(fnOut || fnOver);}, bind:function bind(types, data, fn){return this.on(types, null, data, fn);}, unbind:function unbind(types, fn){return this.off(types, null, fn);}, delegate:function delegate(selector, types, data, fn){return this.on(types, selector, data, fn);}, undelegate:function undelegate(selector, types, fn){return arguments.length === 1?this.off(selector, "**"):this.off(types, selector || "**", fn);}});var nonce=jQuery.now();var rquery=/\?/;jQuery.parseJSON = function(data){return JSON.parse(data + "");};jQuery.parseXML = function(data){var xml, tmp;if(!data || typeof data !== "string"){return null;}try{tmp = new DOMParser();xml = tmp.parseFromString(data, "text/xml");}catch(e) {xml = undefined;}if(!xml || xml.getElementsByTagName("parsererror").length){jQuery.error("Invalid XML: " + data);}return xml;};var rhash=/#.*$/, rts=/([?&])_=[^&]*/, rheaders=/^(.*?):[ \t]*([^\r\n]*)$/mg, rlocalProtocol=/^(?:about|app|app-storage|.+-extension|file|res|widget):$/, rnoContent=/^(?:GET|HEAD)$/, rprotocol=/^\/\//, rurl=/^([\w.+-]+:)(?:\/\/(?:[^\/?#]*@|)([^\/?#:]*)(?::(\d+)|)|)/, prefilters={}, transports={}, allTypes="*/".concat("*"), ajaxLocation=window.location.href, ajaxLocParts=rurl.exec(ajaxLocation.toLowerCase()) || [];function addToPrefiltersOrTransports(structure){return function(dataTypeExpression, func){if(typeof dataTypeExpression !== "string"){func = dataTypeExpression;dataTypeExpression = "*";}var dataType, i=0, dataTypes=dataTypeExpression.toLowerCase().match(rnotwhite) || [];if(jQuery.isFunction(func)){while(dataType = dataTypes[i++]) {if(dataType[0] === "+"){dataType = dataType.slice(1) || "*";(structure[dataType] = structure[dataType] || []).unshift(func);}else {(structure[dataType] = structure[dataType] || []).push(func);}}}};}function inspectPrefiltersOrTransports(structure, options, originalOptions, jqXHR){var inspected={}, seekingTransport=structure === transports;function inspect(dataType){var selected;inspected[dataType] = true;jQuery.each(structure[dataType] || [], function(_, prefilterOrFactory){var dataTypeOrTransport=prefilterOrFactory(options, originalOptions, jqXHR);if(typeof dataTypeOrTransport === "string" && !seekingTransport && !inspected[dataTypeOrTransport]){options.dataTypes.unshift(dataTypeOrTransport);inspect(dataTypeOrTransport);return false;}else if(seekingTransport){return !(selected = dataTypeOrTransport);}});return selected;}return inspect(options.dataTypes[0]) || !inspected["*"] && inspect("*");}function ajaxExtend(target, src){var key, deep, flatOptions=jQuery.ajaxSettings.flatOptions || {};for(key in src) {if(src[key] !== undefined){(flatOptions[key]?target:deep || (deep = {}))[key] = src[key];}}if(deep){jQuery.extend(true, target, deep);}return target;}function ajaxHandleResponses(s, jqXHR, responses){var ct, type, finalDataType, firstDataType, contents=s.contents, dataTypes=s.dataTypes;while(dataTypes[0] === "*") {dataTypes.shift();if(ct === undefined){ct = s.mimeType || jqXHR.getResponseHeader("Content-Type");}}if(ct){for(type in contents) {if(contents[type] && contents[type].test(ct)){dataTypes.unshift(type);break;}}}if(dataTypes[0] in responses){finalDataType = dataTypes[0];}else {for(type in responses) {if(!dataTypes[0] || s.converters[type + " " + dataTypes[0]]){finalDataType = type;break;}if(!firstDataType){firstDataType = type;}}finalDataType = finalDataType || firstDataType;}if(finalDataType){if(finalDataType !== dataTypes[0]){dataTypes.unshift(finalDataType);}return responses[finalDataType];}}function ajaxConvert(s, response, jqXHR, isSuccess){var conv2, current, conv, tmp, prev, converters={}, dataTypes=s.dataTypes.slice();if(dataTypes[1]){for(conv in s.converters) {converters[conv.toLowerCase()] = s.converters[conv];}}current = dataTypes.shift();while(current) {if(s.responseFields[current]){jqXHR[s.responseFields[current]] = response;}if(!prev && isSuccess && s.dataFilter){response = s.dataFilter(response, s.dataType);}prev = current;current = dataTypes.shift();if(current){if(current === "*"){current = prev;}else if(prev !== "*" && prev !== current){conv = converters[prev + " " + current] || converters["* " + current];if(!conv){for(conv2 in converters) {tmp = conv2.split(" ");if(tmp[1] === current){conv = converters[prev + " " + tmp[0]] || converters["* " + tmp[0]];if(conv){if(conv === true){conv = converters[conv2];}else if(converters[conv2] !== true){current = tmp[0];dataTypes.unshift(tmp[1]);}break;}}}}if(conv !== true){if(conv && s["throws"]){response = conv(response);}else {try{response = conv(response);}catch(e) {return {state:"parsererror", error:conv?e:"No conversion from " + prev + " to " + current};}}}}}}return {state:"success", data:response};}jQuery.extend({active:0, lastModified:{}, etag:{}, ajaxSettings:{url:ajaxLocation, type:"GET", isLocal:rlocalProtocol.test(ajaxLocParts[1]), global:true, processData:true, async:true, contentType:"application/x-www-form-urlencoded; charset=UTF-8", accepts:{"*":allTypes, text:"text/plain", html:"text/html", xml:"application/xml, text/xml", json:"application/json, text/javascript"}, contents:{xml:/xml/, html:/html/, json:/json/}, responseFields:{xml:"responseXML", text:"responseText", json:"responseJSON"}, converters:{"* text":String, "text html":true, "text json":jQuery.parseJSON, "text xml":jQuery.parseXML}, flatOptions:{url:true, context:true}}, ajaxSetup:function ajaxSetup(target, settings){return settings?ajaxExtend(ajaxExtend(target, jQuery.ajaxSettings), settings):ajaxExtend(jQuery.ajaxSettings, target);}, ajaxPrefilter:addToPrefiltersOrTransports(prefilters), ajaxTransport:addToPrefiltersOrTransports(transports), ajax:function ajax(url, options){if(typeof url === "object"){options = url;url = undefined;}options = options || {};var transport, cacheURL, responseHeadersString, responseHeaders, timeoutTimer, parts, fireGlobals, i, s=jQuery.ajaxSetup({}, options), callbackContext=s.context || s, globalEventContext=s.context && (callbackContext.nodeType || callbackContext.jquery)?jQuery(callbackContext):jQuery.event, deferred=jQuery.Deferred(), completeDeferred=jQuery.Callbacks("once memory"), _statusCode=s.statusCode || {}, requestHeaders={}, requestHeadersNames={}, state=0, strAbort="canceled", jqXHR={readyState:0, getResponseHeader:function getResponseHeader(key){var match;if(state === 2){if(!responseHeaders){responseHeaders = {};while(match = rheaders.exec(responseHeadersString)) {responseHeaders[match[1].toLowerCase()] = match[2];}}match = responseHeaders[key.toLowerCase()];}return match == null?null:match;}, getAllResponseHeaders:function getAllResponseHeaders(){return state === 2?responseHeadersString:null;}, setRequestHeader:function setRequestHeader(name, value){var lname=name.toLowerCase();if(!state){name = requestHeadersNames[lname] = requestHeadersNames[lname] || name;requestHeaders[name] = value;}return this;}, overrideMimeType:function overrideMimeType(type){if(!state){s.mimeType = type;}return this;}, statusCode:function statusCode(map){var code;if(map){if(state < 2){for(code in map) {_statusCode[code] = [_statusCode[code], map[code]];}}else {jqXHR.always(map[jqXHR.status]);}}return this;}, abort:function abort(statusText){var finalText=statusText || strAbort;if(transport){transport.abort(finalText);}done(0, finalText);return this;}};deferred.promise(jqXHR).complete = completeDeferred.add;jqXHR.success = jqXHR.done;jqXHR.error = jqXHR.fail;s.url = ((url || s.url || ajaxLocation) + "").replace(rhash, "").replace(rprotocol, ajaxLocParts[1] + "//");s.type = options.method || options.type || s.method || s.type;s.dataTypes = jQuery.trim(s.dataType || "*").toLowerCase().match(rnotwhite) || [""];if(s.crossDomain == null){parts = rurl.exec(s.url.toLowerCase());s.crossDomain = !!(parts && (parts[1] !== ajaxLocParts[1] || parts[2] !== ajaxLocParts[2] || (parts[3] || (parts[1] === "http:"?"80":"443")) !== (ajaxLocParts[3] || (ajaxLocParts[1] === "http:"?"80":"443"))));}if(s.data && s.processData && typeof s.data !== "string"){s.data = jQuery.param(s.data, s.traditional);}inspectPrefiltersOrTransports(prefilters, s, options, jqXHR);if(state === 2){return jqXHR;}fireGlobals = jQuery.event && s.global;if(fireGlobals && jQuery.active++ === 0){jQuery.event.trigger("ajaxStart");}s.type = s.type.toUpperCase();s.hasContent = !rnoContent.test(s.type);cacheURL = s.url;if(!s.hasContent){if(s.data){cacheURL = s.url += (rquery.test(cacheURL)?"&":"?") + s.data;delete s.data;}if(s.cache === false){s.url = rts.test(cacheURL)?cacheURL.replace(rts, "$1_=" + nonce++):cacheURL + (rquery.test(cacheURL)?"&":"?") + "_=" + nonce++;}}if(s.ifModified){if(jQuery.lastModified[cacheURL]){jqXHR.setRequestHeader("If-Modified-Since", jQuery.lastModified[cacheURL]);}if(jQuery.etag[cacheURL]){jqXHR.setRequestHeader("If-None-Match", jQuery.etag[cacheURL]);}}if(s.data && s.hasContent && s.contentType !== false || options.contentType){jqXHR.setRequestHeader("Content-Type", s.contentType);}jqXHR.setRequestHeader("Accept", s.dataTypes[0] && s.accepts[s.dataTypes[0]]?s.accepts[s.dataTypes[0]] + (s.dataTypes[0] !== "*"?", " + allTypes + "; q=0.01":""):s.accepts["*"]);for(i in s.headers) {jqXHR.setRequestHeader(i, s.headers[i]);}if(s.beforeSend && (s.beforeSend.call(callbackContext, jqXHR, s) === false || state === 2)){return jqXHR.abort();}strAbort = "abort";for(i in {success:1, error:1, complete:1}) {jqXHR[i](s[i]);}transport = inspectPrefiltersOrTransports(transports, s, options, jqXHR);if(!transport){done(-1, "No Transport");}else {jqXHR.readyState = 1;if(fireGlobals){globalEventContext.trigger("ajaxSend", [jqXHR, s]);}if(s.async && s.timeout > 0){timeoutTimer = setTimeout(function(){jqXHR.abort("timeout");}, s.timeout);}try{state = 1;transport.send(requestHeaders, done);}catch(e) {if(state < 2){done(-1, e);}else {throw e;}}}function done(status, nativeStatusText, responses, headers){var isSuccess, success, error, response, modified, statusText=nativeStatusText;if(state === 2){return;}state = 2;if(timeoutTimer){clearTimeout(timeoutTimer);}transport = undefined;responseHeadersString = headers || "";jqXHR.readyState = status > 0?4:0;isSuccess = status >= 200 && status < 300 || status === 304;if(responses){response = ajaxHandleResponses(s, jqXHR, responses);}response = ajaxConvert(s, response, jqXHR, isSuccess);if(isSuccess){if(s.ifModified){modified = jqXHR.getResponseHeader("Last-Modified");if(modified){jQuery.lastModified[cacheURL] = modified;}modified = jqXHR.getResponseHeader("etag");if(modified){jQuery.etag[cacheURL] = modified;}}if(status === 204 || s.type === "HEAD"){statusText = "nocontent";}else if(status === 304){statusText = "notmodified";}else {statusText = response.state;success = response.data;error = response.error;isSuccess = !error;}}else {error = statusText;if(status || !statusText){statusText = "error";if(status < 0){status = 0;}}}jqXHR.status = status;jqXHR.statusText = (nativeStatusText || statusText) + "";if(isSuccess){deferred.resolveWith(callbackContext, [success, statusText, jqXHR]);}else {deferred.rejectWith(callbackContext, [jqXHR, statusText, error]);}jqXHR.statusCode(_statusCode);_statusCode = undefined;if(fireGlobals){globalEventContext.trigger(isSuccess?"ajaxSuccess":"ajaxError", [jqXHR, s, isSuccess?success:error]);}completeDeferred.fireWith(callbackContext, [jqXHR, statusText]);if(fireGlobals){globalEventContext.trigger("ajaxComplete", [jqXHR, s]);if(! --jQuery.active){jQuery.event.trigger("ajaxStop");}}}return jqXHR;}, getJSON:function getJSON(url, data, callback){return jQuery.get(url, data, callback, "json");}, getScript:function getScript(url, callback){return jQuery.get(url, undefined, callback, "script");}});jQuery.each(["get", "post"], function(i, method){jQuery[method] = function(url, data, callback, type){if(jQuery.isFunction(data)){type = type || callback;callback = data;data = undefined;}return jQuery.ajax({url:url, type:method, dataType:type, data:data, success:callback});};});jQuery._evalUrl = function(url){return jQuery.ajax({url:url, type:"GET", dataType:"script", async:false, global:false, "throws":true});};jQuery.fn.extend({wrapAll:function wrapAll(html){var wrap;if(jQuery.isFunction(html)){return this.each(function(i){jQuery(this).wrapAll(html.call(this, i));});}if(this[0]){wrap = jQuery(html, this[0].ownerDocument).eq(0).clone(true);if(this[0].parentNode){wrap.insertBefore(this[0]);}wrap.map(function(){var elem=this;while(elem.firstElementChild) {elem = elem.firstElementChild;}return elem;}).append(this);}return this;}, wrapInner:function wrapInner(html){if(jQuery.isFunction(html)){return this.each(function(i){jQuery(this).wrapInner(html.call(this, i));});}return this.each(function(){var self=jQuery(this), contents=self.contents();if(contents.length){contents.wrapAll(html);}else {self.append(html);}});}, wrap:function wrap(html){var isFunction=jQuery.isFunction(html);return this.each(function(i){jQuery(this).wrapAll(isFunction?html.call(this, i):html);});}, unwrap:function unwrap(){return this.parent().each(function(){if(!jQuery.nodeName(this, "body")){jQuery(this).replaceWith(this.childNodes);}}).end();}});jQuery.expr.filters.hidden = function(elem){return elem.offsetWidth <= 0 && elem.offsetHeight <= 0;};jQuery.expr.filters.visible = function(elem){return !jQuery.expr.filters.hidden(elem);};var r20=/%20/g, rbracket=/\[\]$/, rCRLF=/\r?\n/g, rsubmitterTypes=/^(?:submit|button|image|reset|file)$/i, rsubmittable=/^(?:input|select|textarea|keygen)/i;function buildParams(prefix, obj, traditional, add){var name;if(jQuery.isArray(obj)){jQuery.each(obj, function(i, v){if(traditional || rbracket.test(prefix)){add(prefix, v);}else {buildParams(prefix + "[" + (typeof v === "object"?i:"") + "]", v, traditional, add);}});}else if(!traditional && jQuery.type(obj) === "object"){for(name in obj) {buildParams(prefix + "[" + name + "]", obj[name], traditional, add);}}else {add(prefix, obj);}}jQuery.param = function(a, traditional){var prefix, s=[], add=function add(key, value){value = jQuery.isFunction(value)?value():value == null?"":value;s[s.length] = encodeURIComponent(key) + "=" + encodeURIComponent(value);};if(traditional === undefined){traditional = jQuery.ajaxSettings && jQuery.ajaxSettings.traditional;}if(jQuery.isArray(a) || a.jquery && !jQuery.isPlainObject(a)){jQuery.each(a, function(){add(this.name, this.value);});}else {for(prefix in a) {buildParams(prefix, a[prefix], traditional, add);}}return s.join("&").replace(r20, "+");};jQuery.fn.extend({serialize:function serialize(){return jQuery.param(this.serializeArray());}, serializeArray:function serializeArray(){return this.map(function(){var elements=jQuery.prop(this, "elements");return elements?jQuery.makeArray(elements):this;}).filter(function(){var type=this.type;return this.name && !jQuery(this).is(":disabled") && rsubmittable.test(this.nodeName) && !rsubmitterTypes.test(type) && (this.checked || !rcheckableType.test(type));}).map(function(i, elem){var val=jQuery(this).val();return val == null?null:jQuery.isArray(val)?jQuery.map(val, function(val){return {name:elem.name, value:val.replace(rCRLF, "\r\n")};}):{name:elem.name, value:val.replace(rCRLF, "\r\n")};}).get();}});jQuery.ajaxSettings.xhr = function(){try{return new XMLHttpRequest();}catch(e) {}};var xhrId=0, xhrCallbacks={}, xhrSuccessStatus={0:200, 1223:204}, xhrSupported=jQuery.ajaxSettings.xhr();if(window.attachEvent){window.attachEvent("onunload", function(){for(var key in xhrCallbacks) {xhrCallbacks[key]();}});}support.cors = !!xhrSupported && "withCredentials" in xhrSupported;support.ajax = xhrSupported = !!xhrSupported;jQuery.ajaxTransport(function(options){var callback;if(support.cors || xhrSupported && !options.crossDomain){return {send:function send(headers, complete){var i, xhr=options.xhr(), id=++xhrId;xhr.open(options.type, options.url, options.async, options.username, options.password);if(options.xhrFields){for(i in options.xhrFields) {xhr[i] = options.xhrFields[i];}}if(options.mimeType && xhr.overrideMimeType){xhr.overrideMimeType(options.mimeType);}if(!options.crossDomain && !headers["X-Requested-With"]){headers["X-Requested-With"] = "XMLHttpRequest";}for(i in headers) {xhr.setRequestHeader(i, headers[i]);}callback = function(type){return function(){if(callback){delete xhrCallbacks[id];callback = xhr.onload = xhr.onerror = null;if(type === "abort"){xhr.abort();}else if(type === "error"){complete(xhr.status, xhr.statusText);}else {complete(xhrSuccessStatus[xhr.status] || xhr.status, xhr.statusText, typeof xhr.responseText === "string"?{text:xhr.responseText}:undefined, xhr.getAllResponseHeaders());}}};};xhr.onload = callback();xhr.onerror = callback("error");callback = xhrCallbacks[id] = callback("abort");try{xhr.send(options.hasContent && options.data || null);}catch(e) {if(callback){throw e;}}}, abort:function abort(){if(callback){callback();}}};}});jQuery.ajaxSetup({accepts:{script:"text/javascript, application/javascript, application/ecmascript, application/x-ecmascript"}, contents:{script:/(?:java|ecma)script/}, converters:{"text script":function textScript(text){jQuery.globalEval(text);return text;}}});jQuery.ajaxPrefilter("script", function(s){if(s.cache === undefined){s.cache = false;}if(s.crossDomain){s.type = "GET";}});jQuery.ajaxTransport("script", function(s){if(s.crossDomain){var script, callback;return {send:function send(_, complete){script = jQuery("<script>").prop({async:true, charset:s.scriptCharset, src:s.url}).on("load error", callback = function(evt){script.remove();callback = null;if(evt){complete(evt.type === "error"?404:200, evt.type);}});document.head.appendChild(script[0]);}, abort:function abort(){if(callback){callback();}}};}});var oldCallbacks=[], rjsonp=/(=)\?(?=&|$)|\?\?/;jQuery.ajaxSetup({jsonp:"callback", jsonpCallback:function jsonpCallback(){var callback=oldCallbacks.pop() || jQuery.expando + "_" + nonce++;this[callback] = true;return callback;}});jQuery.ajaxPrefilter("json jsonp", function(s, originalSettings, jqXHR){var callbackName, overwritten, responseContainer, jsonProp=s.jsonp !== false && (rjsonp.test(s.url)?"url":typeof s.data === "string" && !(s.contentType || "").indexOf("application/x-www-form-urlencoded") && rjsonp.test(s.data) && "data");if(jsonProp || s.dataTypes[0] === "jsonp"){callbackName = s.jsonpCallback = jQuery.isFunction(s.jsonpCallback)?s.jsonpCallback():s.jsonpCallback;if(jsonProp){s[jsonProp] = s[jsonProp].replace(rjsonp, "$1" + callbackName);}else if(s.jsonp !== false){s.url += (rquery.test(s.url)?"&":"?") + s.jsonp + "=" + callbackName;}s.converters["script json"] = function(){if(!responseContainer){jQuery.error(callbackName + " was not called");}return responseContainer[0];};s.dataTypes[0] = "json";overwritten = window[callbackName];window[callbackName] = function(){responseContainer = arguments;};jqXHR.always(function(){window[callbackName] = overwritten;if(s[callbackName]){s.jsonpCallback = originalSettings.jsonpCallback;oldCallbacks.push(callbackName);}if(responseContainer && jQuery.isFunction(overwritten)){overwritten(responseContainer[0]);}responseContainer = overwritten = undefined;});return "script";}});jQuery.parseHTML = function(data, context, keepScripts){if(!data || typeof data !== "string"){return null;}if(typeof context === "boolean"){keepScripts = context;context = false;}context = context || document;var parsed=rsingleTag.exec(data), scripts=!keepScripts && [];if(parsed){return [context.createElement(parsed[1])];}parsed = jQuery.buildFragment([data], context, scripts);if(scripts && scripts.length){jQuery(scripts).remove();}return jQuery.merge([], parsed.childNodes);};var _load=jQuery.fn.load;jQuery.fn.load = function(url, params, callback){if(typeof url !== "string" && _load){return _load.apply(this, arguments);}var selector, type, response, self=this, off=url.indexOf(" ");if(off >= 0){selector = jQuery.trim(url.slice(off));url = url.slice(0, off);}if(jQuery.isFunction(params)){callback = params;params = undefined;}else if(params && typeof params === "object"){type = "POST";}if(self.length > 0){jQuery.ajax({url:url, type:type, dataType:"html", data:params}).done(function(responseText){response = arguments;self.html(selector?jQuery("<div>").append(jQuery.parseHTML(responseText)).find(selector):responseText);}).complete(callback && function(jqXHR, status){self.each(callback, response || [jqXHR.responseText, status, jqXHR]);});}return this;};jQuery.each(["ajaxStart", "ajaxStop", "ajaxComplete", "ajaxError", "ajaxSuccess", "ajaxSend"], function(i, type){jQuery.fn[type] = function(fn){return this.on(type, fn);};});jQuery.expr.filters.animated = function(elem){return jQuery.grep(jQuery.timers, function(fn){return elem === fn.elem;}).length;};var docElem=window.document.documentElement;function getWindow(elem){return jQuery.isWindow(elem)?elem:elem.nodeType === 9 && elem.defaultView;}jQuery.offset = {setOffset:function setOffset(elem, options, i){var curPosition, curLeft, curCSSTop, curTop, curOffset, curCSSLeft, calculatePosition, position=jQuery.css(elem, "position"), curElem=jQuery(elem), props={};if(position === "static"){elem.style.position = "relative";}curOffset = curElem.offset();curCSSTop = jQuery.css(elem, "top");curCSSLeft = jQuery.css(elem, "left");calculatePosition = (position === "absolute" || position === "fixed") && (curCSSTop + curCSSLeft).indexOf("auto") > -1;if(calculatePosition){curPosition = curElem.position();curTop = curPosition.top;curLeft = curPosition.left;}else {curTop = parseFloat(curCSSTop) || 0;curLeft = parseFloat(curCSSLeft) || 0;}if(jQuery.isFunction(options)){options = options.call(elem, i, curOffset);}if(options.top != null){props.top = options.top - curOffset.top + curTop;}if(options.left != null){props.left = options.left - curOffset.left + curLeft;}if("using" in options){options.using.call(elem, props);}else {curElem.css(props);}}};jQuery.fn.extend({offset:function offset(options){if(arguments.length){return options === undefined?this:this.each(function(i){jQuery.offset.setOffset(this, options, i);});}var docElem, win, elem=this[0], box={top:0, left:0}, doc=elem && elem.ownerDocument;if(!doc){return;}docElem = doc.documentElement;if(!jQuery.contains(docElem, elem)){return box;}if(typeof elem.getBoundingClientRect !== strundefined){box = elem.getBoundingClientRect();}win = getWindow(doc);return {top:box.top + win.pageYOffset - docElem.clientTop, left:box.left + win.pageXOffset - docElem.clientLeft};}, position:function position(){if(!this[0]){return;}var offsetParent, offset, elem=this[0], parentOffset={top:0, left:0};if(jQuery.css(elem, "position") === "fixed"){offset = elem.getBoundingClientRect();}else {offsetParent = this.offsetParent();offset = this.offset();if(!jQuery.nodeName(offsetParent[0], "html")){parentOffset = offsetParent.offset();}parentOffset.top += jQuery.css(offsetParent[0], "borderTopWidth", true);parentOffset.left += jQuery.css(offsetParent[0], "borderLeftWidth", true);}return {top:offset.top - parentOffset.top - jQuery.css(elem, "marginTop", true), left:offset.left - parentOffset.left - jQuery.css(elem, "marginLeft", true)};}, offsetParent:function offsetParent(){return this.map(function(){var offsetParent=this.offsetParent || docElem;while(offsetParent && (!jQuery.nodeName(offsetParent, "html") && jQuery.css(offsetParent, "position") === "static")) {offsetParent = offsetParent.offsetParent;}return offsetParent || docElem;});}});jQuery.each({scrollLeft:"pageXOffset", scrollTop:"pageYOffset"}, function(method, prop){var top="pageYOffset" === prop;jQuery.fn[method] = function(val){return access(this, function(elem, method, val){var win=getWindow(elem);if(val === undefined){return win?win[prop]:elem[method];}if(win){win.scrollTo(!top?val:window.pageXOffset, top?val:window.pageYOffset);}else {elem[method] = val;}}, method, val, arguments.length, null);};});jQuery.each(["top", "left"], function(i, prop){jQuery.cssHooks[prop] = addGetHookIf(support.pixelPosition, function(elem, computed){if(computed){computed = curCSS(elem, prop);return rnumnonpx.test(computed)?jQuery(elem).position()[prop] + "px":computed;}});});jQuery.each({Height:"height", Width:"width"}, function(name, type){jQuery.each({padding:"inner" + name, content:type, "":"outer" + name}, function(defaultExtra, funcName){jQuery.fn[funcName] = function(margin, value){var chainable=arguments.length && (defaultExtra || typeof margin !== "boolean"), extra=defaultExtra || (margin === true || value === true?"margin":"border");return access(this, function(elem, type, value){var doc;if(jQuery.isWindow(elem)){return elem.document.documentElement["client" + name];}if(elem.nodeType === 9){doc = elem.documentElement;return Math.max(elem.body["scroll" + name], doc["scroll" + name], elem.body["offset" + name], doc["offset" + name], doc["client" + name]);}return value === undefined?jQuery.css(elem, type, extra):jQuery.style(elem, type, value, extra);}, type, chainable?margin:undefined, chainable, null);};});});jQuery.fn.size = function(){return this.length;};jQuery.fn.andSelf = jQuery.fn.addBack;if(true){!(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_RESULT__ = function(){return jQuery;}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));}var _jQuery=window.jQuery, _$=window.$;jQuery.noConflict = function(deep){if(window.$ === jQuery){window.$ = _$;}if(deep && window.jQuery === jQuery){window.jQuery = _jQuery;}return jQuery;};if(typeof noGlobal === strundefined){window.jQuery = window.$ = jQuery;}return jQuery;});

/***/ },
/* 11 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var expect = __webpack_require__(9);
	var spm3 = __webpack_require__(8);
	
	describe('spm3', function () {
	
	  it('normal usage', function () {});
	});

/***/ }
/******/ ]);
//# sourceMappingURL=test.js.map