// npm install -g browserify
// npm install iconv-lite
// browserify iconv-lite.js  -o iconv-lite.bundle.js
(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
    'use strict'
    
    exports.byteLength = byteLength
    exports.toByteArray = toByteArray
    exports.fromByteArray = fromByteArray
    
    var lookup = []
    var revLookup = []
    var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array
    
    var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
    for (var i = 0, len = code.length; i < len; ++i) {
      lookup[i] = code[i]
      revLookup[code.charCodeAt(i)] = i
    }
    
    // Support decoding URL-safe base64 strings, as Node.js does.
    // See: https://en.wikipedia.org/wiki/Base64#URL_applications
    revLookup['-'.charCodeAt(0)] = 62
    revLookup['_'.charCodeAt(0)] = 63
    
    function getLens (b64) {
      var len = b64.length
    
      if (len % 4 > 0) {
        throw new Error('Invalid string. Length must be a multiple of 4')
      }
    
      // Trim off extra bytes after placeholder bytes are found
      // See: https://github.com/beatgammit/base64-js/issues/42
      var validLen = b64.indexOf('=')
      if (validLen === -1) validLen = len
    
      var placeHoldersLen = validLen === len
        ? 0
        : 4 - (validLen % 4)
    
      return [validLen, placeHoldersLen]
    }
    
    // base64 is 4/3 + up to two characters of the original data
    function byteLength (b64) {
      var lens = getLens(b64)
      var validLen = lens[0]
      var placeHoldersLen = lens[1]
      return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
    }
    
    function _byteLength (b64, validLen, placeHoldersLen) {
      return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
    }
    
    function toByteArray (b64) {
      var tmp
      var lens = getLens(b64)
      var validLen = lens[0]
      var placeHoldersLen = lens[1]
    
      var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen))
    
      var curByte = 0
    
      // if there are placeholders, only get up to the last complete 4 chars
      var len = placeHoldersLen > 0
        ? validLen - 4
        : validLen
    
      for (var i = 0; i < len; i += 4) {
        tmp =
          (revLookup[b64.charCodeAt(i)] << 18) |
          (revLookup[b64.charCodeAt(i + 1)] << 12) |
          (revLookup[b64.charCodeAt(i + 2)] << 6) |
          revLookup[b64.charCodeAt(i + 3)]
        arr[curByte++] = (tmp >> 16) & 0xFF
        arr[curByte++] = (tmp >> 8) & 0xFF
        arr[curByte++] = tmp & 0xFF
      }
    
      if (placeHoldersLen === 2) {
        tmp =
          (revLookup[b64.charCodeAt(i)] << 2) |
          (revLookup[b64.charCodeAt(i + 1)] >> 4)
        arr[curByte++] = tmp & 0xFF
      }
    
      if (placeHoldersLen === 1) {
        tmp =
          (revLookup[b64.charCodeAt(i)] << 10) |
          (revLookup[b64.charCodeAt(i + 1)] << 4) |
          (revLookup[b64.charCodeAt(i + 2)] >> 2)
        arr[curByte++] = (tmp >> 8) & 0xFF
        arr[curByte++] = tmp & 0xFF
      }
    
      return arr
    }
    
    function tripletToBase64 (num) {
      return lookup[num >> 18 & 0x3F] +
        lookup[num >> 12 & 0x3F] +
        lookup[num >> 6 & 0x3F] +
        lookup[num & 0x3F]
    }
    
    function encodeChunk (uint8, start, end) {
      var tmp
      var output = []
      for (var i = start; i < end; i += 3) {
        tmp =
          ((uint8[i] << 16) & 0xFF0000) +
          ((uint8[i + 1] << 8) & 0xFF00) +
          (uint8[i + 2] & 0xFF)
        output.push(tripletToBase64(tmp))
      }
      return output.join('')
    }
    
    function fromByteArray (uint8) {
      var tmp
      var len = uint8.length
      var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
      var parts = []
      var maxChunkLength = 16383 // must be multiple of 3
    
      // go through the array every three bytes, we'll deal with trailing stuff later
      for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
        parts.push(encodeChunk(
          uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)
        ))
      }
    
      // pad the end with zeros, but make sure to not forget the extra bytes
      if (extraBytes === 1) {
        tmp = uint8[len - 1]
        parts.push(
          lookup[tmp >> 2] +
          lookup[(tmp << 4) & 0x3F] +
          '=='
        )
      } else if (extraBytes === 2) {
        tmp = (uint8[len - 2] << 8) + uint8[len - 1]
        parts.push(
          lookup[tmp >> 10] +
          lookup[(tmp >> 4) & 0x3F] +
          lookup[(tmp << 2) & 0x3F] +
          '='
        )
      }
    
      return parts.join('')
    }
    
    },{}],2:[function(require,module,exports){
    
    },{}],3:[function(require,module,exports){
    /*!
     * The buffer module from node.js, for the browser.
     *
     * @author   Feross Aboukhadijeh <https://feross.org>
     * @license  MIT
     */
    /* eslint-disable no-proto */
    
    'use strict'
    
    var base64 = require('base64-js')
    var ieee754 = require('ieee754')
    
    exports.Buffer = Buffer
    exports.SlowBuffer = SlowBuffer
    exports.INSPECT_MAX_BYTES = 50
    
    var K_MAX_LENGTH = 0x7fffffff
    exports.kMaxLength = K_MAX_LENGTH
    
    /**
     * If `Buffer.TYPED_ARRAY_SUPPORT`:
     *   === true    Use Uint8Array implementation (fastest)
     *   === false   Print warning and recommend using `buffer` v4.x which has an Object
     *               implementation (most compatible, even IE6)
     *
     * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
     * Opera 11.6+, iOS 4.2+.
     *
     * We report that the browser does not support typed arrays if the are not subclassable
     * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
     * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
     * for __proto__ and has a buggy typed array implementation.
     */
    Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport()
    
    if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' &&
        typeof console.error === 'function') {
      console.error(
        'This browser lacks typed array (Uint8Array) support which is required by ' +
        '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.'
      )
    }
    
    function typedArraySupport () {
      // Can typed array instances can be augmented?
      try {
        var arr = new Uint8Array(1)
        arr.__proto__ = { __proto__: Uint8Array.prototype, foo: function () { return 42 } }
        return arr.foo() === 42
      } catch (e) {
        return false
      }
    }
    
    Object.defineProperty(Buffer.prototype, 'parent', {
      enumerable: true,
      get: function () {
        if (!Buffer.isBuffer(this)) return undefined
        return this.buffer
      }
    })
    
    Object.defineProperty(Buffer.prototype, 'offset', {
      enumerable: true,
      get: function () {
        if (!Buffer.isBuffer(this)) return undefined
        return this.byteOffset
      }
    })
    
    function createBuffer (length) {
      if (length > K_MAX_LENGTH) {
        throw new RangeError('The value "' + length + '" is invalid for option "size"')
      }
      // Return an augmented `Uint8Array` instance
      var buf = new Uint8Array(length)
      buf.__proto__ = Buffer.prototype
      return buf
    }
    
    /**
     * The Buffer constructor returns instances of `Uint8Array` that have their
     * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
     * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
     * and the `Uint8Array` methods. Square bracket notation works as expected -- it
     * returns a single octet.
     *
     * The `Uint8Array` prototype remains unmodified.
     */
    
    function Buffer (arg, encodingOrOffset, length) {
      // Common case.
      if (typeof arg === 'number') {
        if (typeof encodingOrOffset === 'string') {
          throw new TypeError(
            'The "string" argument must be of type string. Received type number'
          )
        }
        return allocUnsafe(arg)
      }
      return from(arg, encodingOrOffset, length)
    }
    
    // Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
    if (typeof Symbol !== 'undefined' && Symbol.species != null &&
        Buffer[Symbol.species] === Buffer) {
      Object.defineProperty(Buffer, Symbol.species, {
        value: null,
        configurable: true,
        enumerable: false,
        writable: false
      })
    }
    
    Buffer.poolSize = 8192 // not used by this implementation
    
    function from (value, encodingOrOffset, length) {
      if (typeof value === 'string') {
        return fromString(value, encodingOrOffset)
      }
    
      if (ArrayBuffer.isView(value)) {
        return fromArrayLike(value)
      }
    
      if (value == null) {
        throw TypeError(
          'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
          'or Array-like Object. Received type ' + (typeof value)
        )
      }
    
      if (isInstance(value, ArrayBuffer) ||
          (value && isInstance(value.buffer, ArrayBuffer))) {
        return fromArrayBuffer(value, encodingOrOffset, length)
      }
    
      if (typeof value === 'number') {
        throw new TypeError(
          'The "value" argument must not be of type number. Received type number'
        )
      }
    
      var valueOf = value.valueOf && value.valueOf()
      if (valueOf != null && valueOf !== value) {
        return Buffer.from(valueOf, encodingOrOffset, length)
      }
    
      var b = fromObject(value)
      if (b) return b
    
      if (typeof Symbol !== 'undefined' && Symbol.toPrimitive != null &&
          typeof value[Symbol.toPrimitive] === 'function') {
        return Buffer.from(
          value[Symbol.toPrimitive]('string'), encodingOrOffset, length
        )
      }
    
      throw new TypeError(
        'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
        'or Array-like Object. Received type ' + (typeof value)
      )
    }
    
    /**
     * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
     * if value is a number.
     * Buffer.from(str[, encoding])
     * Buffer.from(array)
     * Buffer.from(buffer)
     * Buffer.from(arrayBuffer[, byteOffset[, length]])
     **/
    Buffer.from = function (value, encodingOrOffset, length) {
      return from(value, encodingOrOffset, length)
    }
    
    // Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
    // https://github.com/feross/buffer/pull/148
    Buffer.prototype.__proto__ = Uint8Array.prototype
    Buffer.__proto__ = Uint8Array
    
    function assertSize (size) {
      if (typeof size !== 'number') {
        throw new TypeError('"size" argument must be of type number')
      } else if (size < 0) {
        throw new RangeError('The value "' + size + '" is invalid for option "size"')
      }
    }
    
    function alloc (size, fill, encoding) {
      assertSize(size)
      if (size <= 0) {
        return createBuffer(size)
      }
      if (fill !== undefined) {
        // Only pay attention to encoding if it's a string. This
        // prevents accidentally sending in a number that would
        // be interpretted as a start offset.
        return typeof encoding === 'string'
          ? createBuffer(size).fill(fill, encoding)
          : createBuffer(size).fill(fill)
      }
      return createBuffer(size)
    }
    
    /**
     * Creates a new filled Buffer instance.
     * alloc(size[, fill[, encoding]])
     **/
    Buffer.alloc = function (size, fill, encoding) {
      return alloc(size, fill, encoding)
    }
    
    function allocUnsafe (size) {
      assertSize(size)
      return createBuffer(size < 0 ? 0 : checked(size) | 0)
    }
    
    /**
     * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
     * */
    Buffer.allocUnsafe = function (size) {
      return allocUnsafe(size)
    }
    /**
     * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
     */
    Buffer.allocUnsafeSlow = function (size) {
      return allocUnsafe(size)
    }
    
    function fromString (string, encoding) {
      if (typeof encoding !== 'string' || encoding === '') {
        encoding = 'utf8'
      }
    
      if (!Buffer.isEncoding(encoding)) {
        throw new TypeError('Unknown encoding: ' + encoding)
      }
    
      var length = byteLength(string, encoding) | 0
      var buf = createBuffer(length)
    
      var actual = buf.write(string, encoding)
    
      if (actual !== length) {
        // Writing a hex string, for example, that contains invalid characters will
        // cause everything after the first invalid character to be ignored. (e.g.
        // 'abxxcd' will be treated as 'ab')
        buf = buf.slice(0, actual)
      }
    
      return buf
    }
    
    function fromArrayLike (array) {
      var length = array.length < 0 ? 0 : checked(array.length) | 0
      var buf = createBuffer(length)
      for (var i = 0; i < length; i += 1) {
        buf[i] = array[i] & 255
      }
      return buf
    }
    
    function fromArrayBuffer (array, byteOffset, length) {
      if (byteOffset < 0 || array.byteLength < byteOffset) {
        throw new RangeError('"offset" is outside of buffer bounds')
      }
    
      if (array.byteLength < byteOffset + (length || 0)) {
        throw new RangeError('"length" is outside of buffer bounds')
      }
    
      var buf
      if (byteOffset === undefined && length === undefined) {
        buf = new Uint8Array(array)
      } else if (length === undefined) {
        buf = new Uint8Array(array, byteOffset)
      } else {
        buf = new Uint8Array(array, byteOffset, length)
      }
    
      // Return an augmented `Uint8Array` instance
      buf.__proto__ = Buffer.prototype
      return buf
    }
    
    function fromObject (obj) {
      if (Buffer.isBuffer(obj)) {
        var len = checked(obj.length) | 0
        var buf = createBuffer(len)
    
        if (buf.length === 0) {
          return buf
        }
    
        obj.copy(buf, 0, 0, len)
        return buf
      }
    
      if (obj.length !== undefined) {
        if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
          return createBuffer(0)
        }
        return fromArrayLike(obj)
      }
    
      if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
        return fromArrayLike(obj.data)
      }
    }
    
    function checked (length) {
      // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
      // length is NaN (which is otherwise coerced to zero.)
      if (length >= K_MAX_LENGTH) {
        throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                             'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes')
      }
      return length | 0
    }
    
    function SlowBuffer (length) {
      if (+length != length) { // eslint-disable-line eqeqeq
        length = 0
      }
      return Buffer.alloc(+length)
    }
    
    Buffer.isBuffer = function isBuffer (b) {
      return b != null && b._isBuffer === true &&
        b !== Buffer.prototype // so Buffer.isBuffer(Buffer.prototype) will be false
    }
    
    Buffer.compare = function compare (a, b) {
      if (isInstance(a, Uint8Array)) a = Buffer.from(a, a.offset, a.byteLength)
      if (isInstance(b, Uint8Array)) b = Buffer.from(b, b.offset, b.byteLength)
      if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
        throw new TypeError(
          'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
        )
      }
    
      if (a === b) return 0
    
      var x = a.length
      var y = b.length
    
      for (var i = 0, len = Math.min(x, y); i < len; ++i) {
        if (a[i] !== b[i]) {
          x = a[i]
          y = b[i]
          break
        }
      }
    
      if (x < y) return -1
      if (y < x) return 1
      return 0
    }
    
    Buffer.isEncoding = function isEncoding (encoding) {
      switch (String(encoding).toLowerCase()) {
        case 'hex':
        case 'utf8':
        case 'utf-8':
        case 'ascii':
        case 'latin1':
        case 'binary':
        case 'base64':
        case 'ucs2':
        case 'ucs-2':
        case 'utf16le':
        case 'utf-16le':
          return true
        default:
          return false
      }
    }
    
    Buffer.concat = function concat (list, length) {
      if (!Array.isArray(list)) {
        throw new TypeError('"list" argument must be an Array of Buffers')
      }
    
      if (list.length === 0) {
        return Buffer.alloc(0)
      }
    
      var i
      if (length === undefined) {
        length = 0
        for (i = 0; i < list.length; ++i) {
          length += list[i].length
        }
      }
    
      var buffer = Buffer.allocUnsafe(length)
      var pos = 0
      for (i = 0; i < list.length; ++i) {
        var buf = list[i]
        if (isInstance(buf, Uint8Array)) {
          buf = Buffer.from(buf)
        }
        if (!Buffer.isBuffer(buf)) {
          throw new TypeError('"list" argument must be an Array of Buffers')
        }
        buf.copy(buffer, pos)
        pos += buf.length
      }
      return buffer
    }
    
    function byteLength (string, encoding) {
      if (Buffer.isBuffer(string)) {
        return string.length
      }
      if (ArrayBuffer.isView(string) || isInstance(string, ArrayBuffer)) {
        return string.byteLength
      }
      if (typeof string !== 'string') {
        throw new TypeError(
          'The "string" argument must be one of type string, Buffer, or ArrayBuffer. ' +
          'Received type ' + typeof string
        )
      }
    
      var len = string.length
      var mustMatch = (arguments.length > 2 && arguments[2] === true)
      if (!mustMatch && len === 0) return 0
    
      // Use a for loop to avoid recursion
      var loweredCase = false
      for (;;) {
        switch (encoding) {
          case 'ascii':
          case 'latin1':
          case 'binary':
            return len
          case 'utf8':
          case 'utf-8':
            return utf8ToBytes(string).length
          case 'ucs2':
          case 'ucs-2':
          case 'utf16le':
          case 'utf-16le':
            return len * 2
          case 'hex':
            return len >>> 1
          case 'base64':
            return base64ToBytes(string).length
          default:
            if (loweredCase) {
              return mustMatch ? -1 : utf8ToBytes(string).length // assume utf8
            }
            encoding = ('' + encoding).toLowerCase()
            loweredCase = true
        }
      }
    }
    Buffer.byteLength = byteLength
    
    function slowToString (encoding, start, end) {
      var loweredCase = false
    
      // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
      // property of a typed array.
    
      // This behaves neither like String nor Uint8Array in that we set start/end
      // to their upper/lower bounds if the value passed is out of range.
      // undefined is handled specially as per ECMA-262 6th Edition,
      // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
      if (start === undefined || start < 0) {
        start = 0
      }
      // Return early if start > this.length. Done here to prevent potential uint32
      // coercion fail below.
      if (start > this.length) {
        return ''
      }
    
      if (end === undefined || end > this.length) {
        end = this.length
      }
    
      if (end <= 0) {
        return ''
      }
    
      // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
      end >>>= 0
      start >>>= 0
    
      if (end <= start) {
        return ''
      }
    
      if (!encoding) encoding = 'utf8'
    
      while (true) {
        switch (encoding) {
          case 'hex':
            return hexSlice(this, start, end)
    
          case 'utf8':
          case 'utf-8':
            return utf8Slice(this, start, end)
    
          case 'ascii':
            return asciiSlice(this, start, end)
    
          case 'latin1':
          case 'binary':
            return latin1Slice(this, start, end)
    
          case 'base64':
            return base64Slice(this, start, end)
    
          case 'ucs2':
          case 'ucs-2':
          case 'utf16le':
          case 'utf-16le':
            return utf16leSlice(this, start, end)
    
          default:
            if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
            encoding = (encoding + '').toLowerCase()
            loweredCase = true
        }
      }
    }
    
    // This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
    // to detect a Buffer instance. It's not possible to use `instanceof Buffer`
    // reliably in a browserify context because there could be multiple different
    // copies of the 'buffer' package in use. This method works even for Buffer
    // instances that were created from another copy of the `buffer` package.
    // See: https://github.com/feross/buffer/issues/154
    Buffer.prototype._isBuffer = true
    
    function swap (b, n, m) {
      var i = b[n]
      b[n] = b[m]
      b[m] = i
    }
    
    Buffer.prototype.swap16 = function swap16 () {
      var len = this.length
      if (len % 2 !== 0) {
        throw new RangeError('Buffer size must be a multiple of 16-bits')
      }
      for (var i = 0; i < len; i += 2) {
        swap(this, i, i + 1)
      }
      return this
    }
    
    Buffer.prototype.swap32 = function swap32 () {
      var len = this.length
      if (len % 4 !== 0) {
        throw new RangeError('Buffer size must be a multiple of 32-bits')
      }
      for (var i = 0; i < len; i += 4) {
        swap(this, i, i + 3)
        swap(this, i + 1, i + 2)
      }
      return this
    }
    
    Buffer.prototype.swap64 = function swap64 () {
      var len = this.length
      if (len % 8 !== 0) {
        throw new RangeError('Buffer size must be a multiple of 64-bits')
      }
      for (var i = 0; i < len; i += 8) {
        swap(this, i, i + 7)
        swap(this, i + 1, i + 6)
        swap(this, i + 2, i + 5)
        swap(this, i + 3, i + 4)
      }
      return this
    }
    
    Buffer.prototype.toString = function toString () {
      var length = this.length
      if (length === 0) return ''
      if (arguments.length === 0) return utf8Slice(this, 0, length)
      return slowToString.apply(this, arguments)
    }
    
    Buffer.prototype.toLocaleString = Buffer.prototype.toString
    
    Buffer.prototype.equals = function equals (b) {
      if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
      if (this === b) return true
      return Buffer.compare(this, b) === 0
    }
    
    Buffer.prototype.inspect = function inspect () {
      var str = ''
      var max = exports.INSPECT_MAX_BYTES
      str = this.toString('hex', 0, max).replace(/(.{2})/g, '$1 ').trim()
      if (this.length > max) str += ' ... '
      return '<Buffer ' + str + '>'
    }
    
    Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
      if (isInstance(target, Uint8Array)) {
        target = Buffer.from(target, target.offset, target.byteLength)
      }
      if (!Buffer.isBuffer(target)) {
        throw new TypeError(
          'The "target" argument must be one of type Buffer or Uint8Array. ' +
          'Received type ' + (typeof target)
        )
      }
    
      if (start === undefined) {
        start = 0
      }
      if (end === undefined) {
        end = target ? target.length : 0
      }
      if (thisStart === undefined) {
        thisStart = 0
      }
      if (thisEnd === undefined) {
        thisEnd = this.length
      }
    
      if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
        throw new RangeError('out of range index')
      }
    
      if (thisStart >= thisEnd && start >= end) {
        return 0
      }
      if (thisStart >= thisEnd) {
        return -1
      }
      if (start >= end) {
        return 1
      }
    
      start >>>= 0
      end >>>= 0
      thisStart >>>= 0
      thisEnd >>>= 0
    
      if (this === target) return 0
    
      var x = thisEnd - thisStart
      var y = end - start
      var len = Math.min(x, y)
    
      var thisCopy = this.slice(thisStart, thisEnd)
      var targetCopy = target.slice(start, end)
    
      for (var i = 0; i < len; ++i) {
        if (thisCopy[i] !== targetCopy[i]) {
          x = thisCopy[i]
          y = targetCopy[i]
          break
        }
      }
    
      if (x < y) return -1
      if (y < x) return 1
      return 0
    }
    
    // Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
    // OR the last index of `val` in `buffer` at offset <= `byteOffset`.
    //
    // Arguments:
    // - buffer - a Buffer to search
    // - val - a string, Buffer, or number
    // - byteOffset - an index into `buffer`; will be clamped to an int32
    // - encoding - an optional encoding, relevant is val is a string
    // - dir - true for indexOf, false for lastIndexOf
    function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
      // Empty buffer means no match
      if (buffer.length === 0) return -1
    
      // Normalize byteOffset
      if (typeof byteOffset === 'string') {
        encoding = byteOffset
        byteOffset = 0
      } else if (byteOffset > 0x7fffffff) {
        byteOffset = 0x7fffffff
      } else if (byteOffset < -0x80000000) {
        byteOffset = -0x80000000
      }
      byteOffset = +byteOffset // Coerce to Number.
      if (numberIsNaN(byteOffset)) {
        // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
        byteOffset = dir ? 0 : (buffer.length - 1)
      }
    
      // Normalize byteOffset: negative offsets start from the end of the buffer
      if (byteOffset < 0) byteOffset = buffer.length + byteOffset
      if (byteOffset >= buffer.length) {
        if (dir) return -1
        else byteOffset = buffer.length - 1
      } else if (byteOffset < 0) {
        if (dir) byteOffset = 0
        else return -1
      }
    
      // Normalize val
      if (typeof val === 'string') {
        val = Buffer.from(val, encoding)
      }
    
      // Finally, search either indexOf (if dir is true) or lastIndexOf
      if (Buffer.isBuffer(val)) {
        // Special case: looking for empty string/buffer always fails
        if (val.length === 0) {
          return -1
        }
        return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
      } else if (typeof val === 'number') {
        val = val & 0xFF // Search for a byte value [0-255]
        if (typeof Uint8Array.prototype.indexOf === 'function') {
          if (dir) {
            return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
          } else {
            return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
          }
        }
        return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
      }
    
      throw new TypeError('val must be string, number or Buffer')
    }
    
    function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
      var indexSize = 1
      var arrLength = arr.length
      var valLength = val.length
    
      if (encoding !== undefined) {
        encoding = String(encoding).toLowerCase()
        if (encoding === 'ucs2' || encoding === 'ucs-2' ||
            encoding === 'utf16le' || encoding === 'utf-16le') {
          if (arr.length < 2 || val.length < 2) {
            return -1
          }
          indexSize = 2
          arrLength /= 2
          valLength /= 2
          byteOffset /= 2
        }
      }
    
      function read (buf, i) {
        if (indexSize === 1) {
          return buf[i]
        } else {
          return buf.readUInt16BE(i * indexSize)
        }
      }
    
      var i
      if (dir) {
        var foundIndex = -1
        for (i = byteOffset; i < arrLength; i++) {
          if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
            if (foundIndex === -1) foundIndex = i
            if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
          } else {
            if (foundIndex !== -1) i -= i - foundIndex
            foundIndex = -1
          }
        }
      } else {
        if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
        for (i = byteOffset; i >= 0; i--) {
          var found = true
          for (var j = 0; j < valLength; j++) {
            if (read(arr, i + j) !== read(val, j)) {
              found = false
              break
            }
          }
          if (found) return i
        }
      }
    
      return -1
    }
    
    Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
      return this.indexOf(val, byteOffset, encoding) !== -1
    }
    
    Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
      return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
    }
    
    Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
      return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
    }
    
    function hexWrite (buf, string, offset, length) {
      offset = Number(offset) || 0
      var remaining = buf.length - offset
      if (!length) {
        length = remaining
      } else {
        length = Number(length)
        if (length > remaining) {
          length = remaining
        }
      }
    
      var strLen = string.length
    
      if (length > strLen / 2) {
        length = strLen / 2
      }
      for (var i = 0; i < length; ++i) {
        var parsed = parseInt(string.substr(i * 2, 2), 16)
        if (numberIsNaN(parsed)) return i
        buf[offset + i] = parsed
      }
      return i
    }
    
    function utf8Write (buf, string, offset, length) {
      return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
    }
    
    function asciiWrite (buf, string, offset, length) {
      return blitBuffer(asciiToBytes(string), buf, offset, length)
    }
    
    function latin1Write (buf, string, offset, length) {
      return asciiWrite(buf, string, offset, length)
    }
    
    function base64Write (buf, string, offset, length) {
      return blitBuffer(base64ToBytes(string), buf, offset, length)
    }
    
    function ucs2Write (buf, string, offset, length) {
      return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
    }
    
    Buffer.prototype.write = function write (string, offset, length, encoding) {
      // Buffer#write(string)
      if (offset === undefined) {
        encoding = 'utf8'
        length = this.length
        offset = 0
      // Buffer#write(string, encoding)
      } else if (length === undefined && typeof offset === 'string') {
        encoding = offset
        length = this.length
        offset = 0
      // Buffer#write(string, offset[, length][, encoding])
      } else if (isFinite(offset)) {
        offset = offset >>> 0
        if (isFinite(length)) {
          length = length >>> 0
          if (encoding === undefined) encoding = 'utf8'
        } else {
          encoding = length
          length = undefined
        }
      } else {
        throw new Error(
          'Buffer.write(string, encoding, offset[, length]) is no longer supported'
        )
      }
    
      var remaining = this.length - offset
      if (length === undefined || length > remaining) length = remaining
    
      if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
        throw new RangeError('Attempt to write outside buffer bounds')
      }
    
      if (!encoding) encoding = 'utf8'
    
      var loweredCase = false
      for (;;) {
        switch (encoding) {
          case 'hex':
            return hexWrite(this, string, offset, length)
    
          case 'utf8':
          case 'utf-8':
            return utf8Write(this, string, offset, length)
    
          case 'ascii':
            return asciiWrite(this, string, offset, length)
    
          case 'latin1':
          case 'binary':
            return latin1Write(this, string, offset, length)
    
          case 'base64':
            // Warning: maxLength not taken into account in base64Write
            return base64Write(this, string, offset, length)
    
          case 'ucs2':
          case 'ucs-2':
          case 'utf16le':
          case 'utf-16le':
            return ucs2Write(this, string, offset, length)
    
          default:
            if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
            encoding = ('' + encoding).toLowerCase()
            loweredCase = true
        }
      }
    }
    
    Buffer.prototype.toJSON = function toJSON () {
      return {
        type: 'Buffer',
        data: Array.prototype.slice.call(this._arr || this, 0)
      }
    }
    
    function base64Slice (buf, start, end) {
      if (start === 0 && end === buf.length) {
        return base64.fromByteArray(buf)
      } else {
        return base64.fromByteArray(buf.slice(start, end))
      }
    }
    
    function utf8Slice (buf, start, end) {
      end = Math.min(buf.length, end)
      var res = []
    
      var i = start
      while (i < end) {
        var firstByte = buf[i]
        var codePoint = null
        var bytesPerSequence = (firstByte > 0xEF) ? 4
          : (firstByte > 0xDF) ? 3
            : (firstByte > 0xBF) ? 2
              : 1
    
        if (i + bytesPerSequence <= end) {
          var secondByte, thirdByte, fourthByte, tempCodePoint
    
          switch (bytesPerSequence) {
            case 1:
              if (firstByte < 0x80) {
                codePoint = firstByte
              }
              break
            case 2:
              secondByte = buf[i + 1]
              if ((secondByte & 0xC0) === 0x80) {
                tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
                if (tempCodePoint > 0x7F) {
                  codePoint = tempCodePoint
                }
              }
              break
            case 3:
              secondByte = buf[i + 1]
              thirdByte = buf[i + 2]
              if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
                tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
                if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
                  codePoint = tempCodePoint
                }
              }
              break
            case 4:
              secondByte = buf[i + 1]
              thirdByte = buf[i + 2]
              fourthByte = buf[i + 3]
              if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
                tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
                if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
                  codePoint = tempCodePoint
                }
              }
          }
        }
    
        if (codePoint === null) {
          // we did not generate a valid codePoint so insert a
          // replacement char (U+FFFD) and advance only 1 byte
          codePoint = 0xFFFD
          bytesPerSequence = 1
        } else if (codePoint > 0xFFFF) {
          // encode to utf16 (surrogate pair dance)
          codePoint -= 0x10000
          res.push(codePoint >>> 10 & 0x3FF | 0xD800)
          codePoint = 0xDC00 | codePoint & 0x3FF
        }
    
        res.push(codePoint)
        i += bytesPerSequence
      }
    
      return decodeCodePointsArray(res)
    }
    
    // Based on http://stackoverflow.com/a/22747272/680742, the browser with
    // the lowest limit is Chrome, with 0x10000 args.
    // We go 1 magnitude less, for safety
    var MAX_ARGUMENTS_LENGTH = 0x1000
    
    function decodeCodePointsArray (codePoints) {
      var len = codePoints.length
      if (len <= MAX_ARGUMENTS_LENGTH) {
        return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
      }
    
      // Decode in chunks to avoid "call stack size exceeded".
      var res = ''
      var i = 0
      while (i < len) {
        res += String.fromCharCode.apply(
          String,
          codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
        )
      }
      return res
    }
    
    function asciiSlice (buf, start, end) {
      var ret = ''
      end = Math.min(buf.length, end)
    
      for (var i = start; i < end; ++i) {
        ret += String.fromCharCode(buf[i] & 0x7F)
      }
      return ret
    }
    
    function latin1Slice (buf, start, end) {
      var ret = ''
      end = Math.min(buf.length, end)
    
      for (var i = start; i < end; ++i) {
        ret += String.fromCharCode(buf[i])
      }
      return ret
    }
    
    function hexSlice (buf, start, end) {
      var len = buf.length
    
      if (!start || start < 0) start = 0
      if (!end || end < 0 || end > len) end = len
    
      var out = ''
      for (var i = start; i < end; ++i) {
        out += toHex(buf[i])
      }
      return out
    }
    
    function utf16leSlice (buf, start, end) {
      var bytes = buf.slice(start, end)
      var res = ''
      for (var i = 0; i < bytes.length; i += 2) {
        res += String.fromCharCode(bytes[i] + (bytes[i + 1] * 256))
      }
      return res
    }
    
    Buffer.prototype.slice = function slice (start, end) {
      var len = this.length
      start = ~~start
      end = end === undefined ? len : ~~end
    
      if (start < 0) {
        start += len
        if (start < 0) start = 0
      } else if (start > len) {
        start = len
      }
    
      if (end < 0) {
        end += len
        if (end < 0) end = 0
      } else if (end > len) {
        end = len
      }
    
      if (end < start) end = start
    
      var newBuf = this.subarray(start, end)
      // Return an augmented `Uint8Array` instance
      newBuf.__proto__ = Buffer.prototype
      return newBuf
    }
    
    /*
     * Need to make sure that buffer isn't trying to write out of bounds.
     */
    function checkOffset (offset, ext, length) {
      if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
      if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
    }
    
    Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
      offset = offset >>> 0
      byteLength = byteLength >>> 0
      if (!noAssert) checkOffset(offset, byteLength, this.length)
    
      var val = this[offset]
      var mul = 1
      var i = 0
      while (++i < byteLength && (mul *= 0x100)) {
        val += this[offset + i] * mul
      }
    
      return val
    }
    
    Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
      offset = offset >>> 0
      byteLength = byteLength >>> 0
      if (!noAssert) {
        checkOffset(offset, byteLength, this.length)
      }
    
      var val = this[offset + --byteLength]
      var mul = 1
      while (byteLength > 0 && (mul *= 0x100)) {
        val += this[offset + --byteLength] * mul
      }
    
      return val
    }
    
    Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
      offset = offset >>> 0
      if (!noAssert) checkOffset(offset, 1, this.length)
      return this[offset]
    }
    
    Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
      offset = offset >>> 0
      if (!noAssert) checkOffset(offset, 2, this.length)
      return this[offset] | (this[offset + 1] << 8)
    }
    
    Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
      offset = offset >>> 0
      if (!noAssert) checkOffset(offset, 2, this.length)
      return (this[offset] << 8) | this[offset + 1]
    }
    
    Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
      offset = offset >>> 0
      if (!noAssert) checkOffset(offset, 4, this.length)
    
      return ((this[offset]) |
          (this[offset + 1] << 8) |
          (this[offset + 2] << 16)) +
          (this[offset + 3] * 0x1000000)
    }
    
    Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
      offset = offset >>> 0
      if (!noAssert) checkOffset(offset, 4, this.length)
    
      return (this[offset] * 0x1000000) +
        ((this[offset + 1] << 16) |
        (this[offset + 2] << 8) |
        this[offset + 3])
    }
    
    Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
      offset = offset >>> 0
      byteLength = byteLength >>> 0
      if (!noAssert) checkOffset(offset, byteLength, this.length)
    
      var val = this[offset]
      var mul = 1
      var i = 0
      while (++i < byteLength && (mul *= 0x100)) {
        val += this[offset + i] * mul
      }
      mul *= 0x80
    
      if (val >= mul) val -= Math.pow(2, 8 * byteLength)
    
      return val
    }
    
    Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
      offset = offset >>> 0
      byteLength = byteLength >>> 0
      if (!noAssert) checkOffset(offset, byteLength, this.length)
    
      var i = byteLength
      var mul = 1
      var val = this[offset + --i]
      while (i > 0 && (mul *= 0x100)) {
        val += this[offset + --i] * mul
      }
      mul *= 0x80
    
      if (val >= mul) val -= Math.pow(2, 8 * byteLength)
    
      return val
    }
    
    Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
      offset = offset >>> 0
      if (!noAssert) checkOffset(offset, 1, this.length)
      if (!(this[offset] & 0x80)) return (this[offset])
      return ((0xff - this[offset] + 1) * -1)
    }
    
    Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
      offset = offset >>> 0
      if (!noAssert) checkOffset(offset, 2, this.length)
      var val = this[offset] | (this[offset + 1] << 8)
      return (val & 0x8000) ? val | 0xFFFF0000 : val
    }
    
    Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
      offset = offset >>> 0
      if (!noAssert) checkOffset(offset, 2, this.length)
      var val = this[offset + 1] | (this[offset] << 8)
      return (val & 0x8000) ? val | 0xFFFF0000 : val
    }
    
    Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
      offset = offset >>> 0
      if (!noAssert) checkOffset(offset, 4, this.length)
    
      return (this[offset]) |
        (this[offset + 1] << 8) |
        (this[offset + 2] << 16) |
        (this[offset + 3] << 24)
    }
    
    Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
      offset = offset >>> 0
      if (!noAssert) checkOffset(offset, 4, this.length)
    
      return (this[offset] << 24) |
        (this[offset + 1] << 16) |
        (this[offset + 2] << 8) |
        (this[offset + 3])
    }
    
    Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
      offset = offset >>> 0
      if (!noAssert) checkOffset(offset, 4, this.length)
      return ieee754.read(this, offset, true, 23, 4)
    }
    
    Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
      offset = offset >>> 0
      if (!noAssert) checkOffset(offset, 4, this.length)
      return ieee754.read(this, offset, false, 23, 4)
    }
    
    Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
      offset = offset >>> 0
      if (!noAssert) checkOffset(offset, 8, this.length)
      return ieee754.read(this, offset, true, 52, 8)
    }
    
    Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
      offset = offset >>> 0
      if (!noAssert) checkOffset(offset, 8, this.length)
      return ieee754.read(this, offset, false, 52, 8)
    }
    
    function checkInt (buf, value, offset, ext, max, min) {
      if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
      if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
      if (offset + ext > buf.length) throw new RangeError('Index out of range')
    }
    
    Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
      value = +value
      offset = offset >>> 0
      byteLength = byteLength >>> 0
      if (!noAssert) {
        var maxBytes = Math.pow(2, 8 * byteLength) - 1
        checkInt(this, value, offset, byteLength, maxBytes, 0)
      }
    
      var mul = 1
      var i = 0
      this[offset] = value & 0xFF
      while (++i < byteLength && (mul *= 0x100)) {
        this[offset + i] = (value / mul) & 0xFF
      }
    
      return offset + byteLength
    }
    
    Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
      value = +value
      offset = offset >>> 0
      byteLength = byteLength >>> 0
      if (!noAssert) {
        var maxBytes = Math.pow(2, 8 * byteLength) - 1
        checkInt(this, value, offset, byteLength, maxBytes, 0)
      }
    
      var i = byteLength - 1
      var mul = 1
      this[offset + i] = value & 0xFF
      while (--i >= 0 && (mul *= 0x100)) {
        this[offset + i] = (value / mul) & 0xFF
      }
    
      return offset + byteLength
    }
    
    Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
      value = +value
      offset = offset >>> 0
      if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
      this[offset] = (value & 0xff)
      return offset + 1
    }
    
    Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
      value = +value
      offset = offset >>> 0
      if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
      this[offset] = (value & 0xff)
      this[offset + 1] = (value >>> 8)
      return offset + 2
    }
    
    Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
      value = +value
      offset = offset >>> 0
      if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
      this[offset] = (value >>> 8)
      this[offset + 1] = (value & 0xff)
      return offset + 2
    }
    
    Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
      value = +value
      offset = offset >>> 0
      if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
      this[offset + 3] = (value >>> 24)
      this[offset + 2] = (value >>> 16)
      this[offset + 1] = (value >>> 8)
      this[offset] = (value & 0xff)
      return offset + 4
    }
    
    Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
      value = +value
      offset = offset >>> 0
      if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
      this[offset] = (value >>> 24)
      this[offset + 1] = (value >>> 16)
      this[offset + 2] = (value >>> 8)
      this[offset + 3] = (value & 0xff)
      return offset + 4
    }
    
    Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
      value = +value
      offset = offset >>> 0
      if (!noAssert) {
        var limit = Math.pow(2, (8 * byteLength) - 1)
    
        checkInt(this, value, offset, byteLength, limit - 1, -limit)
      }
    
      var i = 0
      var mul = 1
      var sub = 0
      this[offset] = value & 0xFF
      while (++i < byteLength && (mul *= 0x100)) {
        if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
          sub = 1
        }
        this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
      }
    
      return offset + byteLength
    }
    
    Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
      value = +value
      offset = offset >>> 0
      if (!noAssert) {
        var limit = Math.pow(2, (8 * byteLength) - 1)
    
        checkInt(this, value, offset, byteLength, limit - 1, -limit)
      }
    
      var i = byteLength - 1
      var mul = 1
      var sub = 0
      this[offset + i] = value & 0xFF
      while (--i >= 0 && (mul *= 0x100)) {
        if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
          sub = 1
        }
        this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
      }
    
      return offset + byteLength
    }
    
    Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
      value = +value
      offset = offset >>> 0
      if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
      if (value < 0) value = 0xff + value + 1
      this[offset] = (value & 0xff)
      return offset + 1
    }
    
    Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
      value = +value
      offset = offset >>> 0
      if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
      this[offset] = (value & 0xff)
      this[offset + 1] = (value >>> 8)
      return offset + 2
    }
    
    Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
      value = +value
      offset = offset >>> 0
      if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
      this[offset] = (value >>> 8)
      this[offset + 1] = (value & 0xff)
      return offset + 2
    }
    
    Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
      value = +value
      offset = offset >>> 0
      if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
      this[offset] = (value & 0xff)
      this[offset + 1] = (value >>> 8)
      this[offset + 2] = (value >>> 16)
      this[offset + 3] = (value >>> 24)
      return offset + 4
    }
    
    Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
      value = +value
      offset = offset >>> 0
      if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
      if (value < 0) value = 0xffffffff + value + 1
      this[offset] = (value >>> 24)
      this[offset + 1] = (value >>> 16)
      this[offset + 2] = (value >>> 8)
      this[offset + 3] = (value & 0xff)
      return offset + 4
    }
    
    function checkIEEE754 (buf, value, offset, ext, max, min) {
      if (offset + ext > buf.length) throw new RangeError('Index out of range')
      if (offset < 0) throw new RangeError('Index out of range')
    }
    
    function writeFloat (buf, value, offset, littleEndian, noAssert) {
      value = +value
      offset = offset >>> 0
      if (!noAssert) {
        checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
      }
      ieee754.write(buf, value, offset, littleEndian, 23, 4)
      return offset + 4
    }
    
    Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
      return writeFloat(this, value, offset, true, noAssert)
    }
    
    Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
      return writeFloat(this, value, offset, false, noAssert)
    }
    
    function writeDouble (buf, value, offset, littleEndian, noAssert) {
      value = +value
      offset = offset >>> 0
      if (!noAssert) {
        checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
      }
      ieee754.write(buf, value, offset, littleEndian, 52, 8)
      return offset + 8
    }
    
    Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
      return writeDouble(this, value, offset, true, noAssert)
    }
    
    Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
      return writeDouble(this, value, offset, false, noAssert)
    }
    
    // copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
    Buffer.prototype.copy = function copy (target, targetStart, start, end) {
      if (!Buffer.isBuffer(target)) throw new TypeError('argument should be a Buffer')
      if (!start) start = 0
      if (!end && end !== 0) end = this.length
      if (targetStart >= target.length) targetStart = target.length
      if (!targetStart) targetStart = 0
      if (end > 0 && end < start) end = start
    
      // Copy 0 bytes; we're done
      if (end === start) return 0
      if (target.length === 0 || this.length === 0) return 0
    
      // Fatal error conditions
      if (targetStart < 0) {
        throw new RangeError('targetStart out of bounds')
      }
      if (start < 0 || start >= this.length) throw new RangeError('Index out of range')
      if (end < 0) throw new RangeError('sourceEnd out of bounds')
    
      // Are we oob?
      if (end > this.length) end = this.length
      if (target.length - targetStart < end - start) {
        end = target.length - targetStart + start
      }
    
      var len = end - start
    
      if (this === target && typeof Uint8Array.prototype.copyWithin === 'function') {
        // Use built-in when available, missing from IE11
        this.copyWithin(targetStart, start, end)
      } else if (this === target && start < targetStart && targetStart < end) {
        // descending copy from end
        for (var i = len - 1; i >= 0; --i) {
          target[i + targetStart] = this[i + start]
        }
      } else {
        Uint8Array.prototype.set.call(
          target,
          this.subarray(start, end),
          targetStart
        )
      }
    
      return len
    }
    
    // Usage:
    //    buffer.fill(number[, offset[, end]])
    //    buffer.fill(buffer[, offset[, end]])
    //    buffer.fill(string[, offset[, end]][, encoding])
    Buffer.prototype.fill = function fill (val, start, end, encoding) {
      // Handle string cases:
      if (typeof val === 'string') {
        if (typeof start === 'string') {
          encoding = start
          start = 0
          end = this.length
        } else if (typeof end === 'string') {
          encoding = end
          end = this.length
        }
        if (encoding !== undefined && typeof encoding !== 'string') {
          throw new TypeError('encoding must be a string')
        }
        if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
          throw new TypeError('Unknown encoding: ' + encoding)
        }
        if (val.length === 1) {
          var code = val.charCodeAt(0)
          if ((encoding === 'utf8' && code < 128) ||
              encoding === 'latin1') {
            // Fast path: If `val` fits into a single byte, use that numeric value.
            val = code
          }
        }
      } else if (typeof val === 'number') {
        val = val & 255
      }
    
      // Invalid ranges are not set to a default, so can range check early.
      if (start < 0 || this.length < start || this.length < end) {
        throw new RangeError('Out of range index')
      }
    
      if (end <= start) {
        return this
      }
    
      start = start >>> 0
      end = end === undefined ? this.length : end >>> 0
    
      if (!val) val = 0
    
      var i
      if (typeof val === 'number') {
        for (i = start; i < end; ++i) {
          this[i] = val
        }
      } else {
        var bytes = Buffer.isBuffer(val)
          ? val
          : Buffer.from(val, encoding)
        var len = bytes.length
        if (len === 0) {
          throw new TypeError('The value "' + val +
            '" is invalid for argument "value"')
        }
        for (i = 0; i < end - start; ++i) {
          this[i + start] = bytes[i % len]
        }
      }
    
      return this
    }
    
    // HELPER FUNCTIONS
    // ================
    
    var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g
    
    function base64clean (str) {
      // Node takes equal signs as end of the Base64 encoding
      str = str.split('=')[0]
      // Node strips out invalid characters like \n and \t from the string, base64-js does not
      str = str.trim().replace(INVALID_BASE64_RE, '')
      // Node converts strings with length < 2 to ''
      if (str.length < 2) return ''
      // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
      while (str.length % 4 !== 0) {
        str = str + '='
      }
      return str
    }
    
    function toHex (n) {
      if (n < 16) return '0' + n.toString(16)
      return n.toString(16)
    }
    
    function utf8ToBytes (string, units) {
      units = units || Infinity
      var codePoint
      var length = string.length
      var leadSurrogate = null
      var bytes = []
    
      for (var i = 0; i < length; ++i) {
        codePoint = string.charCodeAt(i)
    
        // is surrogate component
        if (codePoint > 0xD7FF && codePoint < 0xE000) {
          // last char was a lead
          if (!leadSurrogate) {
            // no lead yet
            if (codePoint > 0xDBFF) {
              // unexpected trail
              if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
              continue
            } else if (i + 1 === length) {
              // unpaired lead
              if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
              continue
            }
    
            // valid lead
            leadSurrogate = codePoint
    
            continue
          }
    
          // 2 leads in a row
          if (codePoint < 0xDC00) {
            if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
            leadSurrogate = codePoint
            continue
          }
    
          // valid surrogate pair
          codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
        } else if (leadSurrogate) {
          // valid bmp char, but last char was a lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        }
    
        leadSurrogate = null
    
        // encode utf8
        if (codePoint < 0x80) {
          if ((units -= 1) < 0) break
          bytes.push(codePoint)
        } else if (codePoint < 0x800) {
          if ((units -= 2) < 0) break
          bytes.push(
            codePoint >> 0x6 | 0xC0,
            codePoint & 0x3F | 0x80
          )
        } else if (codePoint < 0x10000) {
          if ((units -= 3) < 0) break
          bytes.push(
            codePoint >> 0xC | 0xE0,
            codePoint >> 0x6 & 0x3F | 0x80,
            codePoint & 0x3F | 0x80
          )
        } else if (codePoint < 0x110000) {
          if ((units -= 4) < 0) break
          bytes.push(
            codePoint >> 0x12 | 0xF0,
            codePoint >> 0xC & 0x3F | 0x80,
            codePoint >> 0x6 & 0x3F | 0x80,
            codePoint & 0x3F | 0x80
          )
        } else {
          throw new Error('Invalid code point')
        }
      }
    
      return bytes
    }
    
    function asciiToBytes (str) {
      var byteArray = []
      for (var i = 0; i < str.length; ++i) {
        // Node's code seems to be doing this and not & 0x7F..
        byteArray.push(str.charCodeAt(i) & 0xFF)
      }
      return byteArray
    }
    
    function utf16leToBytes (str, units) {
      var c, hi, lo
      var byteArray = []
      for (var i = 0; i < str.length; ++i) {
        if ((units -= 2) < 0) break
    
        c = str.charCodeAt(i)
        hi = c >> 8
        lo = c % 256
        byteArray.push(lo)
        byteArray.push(hi)
      }
    
      return byteArray
    }
    
    function base64ToBytes (str) {
      return base64.toByteArray(base64clean(str))
    }
    
    function blitBuffer (src, dst, offset, length) {
      for (var i = 0; i < length; ++i) {
        if ((i + offset >= dst.length) || (i >= src.length)) break
        dst[i + offset] = src[i]
      }
      return i
    }
    
    // ArrayBuffer or Uint8Array objects from other contexts (i.e. iframes) do not pass
    // the `instanceof` check but they should be treated as of that type.
    // See: https://github.com/feross/buffer/issues/166
    function isInstance (obj, type) {
      return obj instanceof type ||
        (obj != null && obj.constructor != null && obj.constructor.name != null &&
          obj.constructor.name === type.name)
    }
    function numberIsNaN (obj) {
      // For IE11 support
      return obj !== obj // eslint-disable-line no-self-compare
    }
    
    },{"base64-js":1,"ieee754":4}],4:[function(require,module,exports){
    exports.read = function (buffer, offset, isLE, mLen, nBytes) {
      var e, m
      var eLen = (nBytes * 8) - mLen - 1
      var eMax = (1 << eLen) - 1
      var eBias = eMax >> 1
      var nBits = -7
      var i = isLE ? (nBytes - 1) : 0
      var d = isLE ? -1 : 1
      var s = buffer[offset + i]
    
      i += d
    
      e = s & ((1 << (-nBits)) - 1)
      s >>= (-nBits)
      nBits += eLen
      for (; nBits > 0; e = (e * 256) + buffer[offset + i], i += d, nBits -= 8) {}
    
      m = e & ((1 << (-nBits)) - 1)
      e >>= (-nBits)
      nBits += mLen
      for (; nBits > 0; m = (m * 256) + buffer[offset + i], i += d, nBits -= 8) {}
    
      if (e === 0) {
        e = 1 - eBias
      } else if (e === eMax) {
        return m ? NaN : ((s ? -1 : 1) * Infinity)
      } else {
        m = m + Math.pow(2, mLen)
        e = e - eBias
      }
      return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
    }
    
    exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
      var e, m, c
      var eLen = (nBytes * 8) - mLen - 1
      var eMax = (1 << eLen) - 1
      var eBias = eMax >> 1
      var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
      var i = isLE ? 0 : (nBytes - 1)
      var d = isLE ? 1 : -1
      var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0
    
      value = Math.abs(value)
    
      if (isNaN(value) || value === Infinity) {
        m = isNaN(value) ? 1 : 0
        e = eMax
      } else {
        e = Math.floor(Math.log(value) / Math.LN2)
        if (value * (c = Math.pow(2, -e)) < 1) {
          e--
          c *= 2
        }
        if (e + eBias >= 1) {
          value += rt / c
        } else {
          value += rt * Math.pow(2, 1 - eBias)
        }
        if (value * c >= 2) {
          e++
          c /= 2
        }
    
        if (e + eBias >= eMax) {
          m = 0
          e = eMax
        } else if (e + eBias >= 1) {
          m = ((value * c) - 1) * Math.pow(2, mLen)
          e = e + eBias
        } else {
          m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
          e = 0
        }
      }
    
      for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}
    
      e = (e << mLen) | m
      eLen += mLen
      for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}
    
      buffer[offset + i - d] |= s * 128
    }
    
    },{}],5:[function(require,module,exports){
    // shim for using process in browser
    var process = module.exports = {};
    
    // cached from whatever global is present so that test runners that stub it
    // don't break things.  But we need to wrap it in a try catch in case it is
    // wrapped in strict mode code which doesn't define any globals.  It's inside a
    // function because try/catches deoptimize in certain engines.
    
    var cachedSetTimeout;
    var cachedClearTimeout;
    
    function defaultSetTimout() {
        throw new Error('setTimeout has not been defined');
    }
    function defaultClearTimeout () {
        throw new Error('clearTimeout has not been defined');
    }
    (function () {
        try {
            if (typeof setTimeout === 'function') {
                cachedSetTimeout = setTimeout;
            } else {
                cachedSetTimeout = defaultSetTimout;
            }
        } catch (e) {
            cachedSetTimeout = defaultSetTimout;
        }
        try {
            if (typeof clearTimeout === 'function') {
                cachedClearTimeout = clearTimeout;
            } else {
                cachedClearTimeout = defaultClearTimeout;
            }
        } catch (e) {
            cachedClearTimeout = defaultClearTimeout;
        }
    } ())
    function runTimeout(fun) {
        if (cachedSetTimeout === setTimeout) {
            //normal enviroments in sane situations
            return setTimeout(fun, 0);
        }
        // if setTimeout wasn't available but was latter defined
        if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
            cachedSetTimeout = setTimeout;
            return setTimeout(fun, 0);
        }
        try {
            // when when somebody has screwed with setTimeout but no I.E. maddness
            return cachedSetTimeout(fun, 0);
        } catch(e){
            try {
                // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
                return cachedSetTimeout.call(null, fun, 0);
            } catch(e){
                // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
                return cachedSetTimeout.call(this, fun, 0);
            }
        }
    
    
    }
    function runClearTimeout(marker) {
        if (cachedClearTimeout === clearTimeout) {
            //normal enviroments in sane situations
            return clearTimeout(marker);
        }
        // if clearTimeout wasn't available but was latter defined
        if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
            cachedClearTimeout = clearTimeout;
            return clearTimeout(marker);
        }
        try {
            // when when somebody has screwed with setTimeout but no I.E. maddness
            return cachedClearTimeout(marker);
        } catch (e){
            try {
                // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
                return cachedClearTimeout.call(null, marker);
            } catch (e){
                // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
                // Some versions of I.E. have different rules for clearTimeout vs setTimeout
                return cachedClearTimeout.call(this, marker);
            }
        }
    
    
    
    }
    var queue = [];
    var draining = false;
    var currentQueue;
    var queueIndex = -1;
    
    function cleanUpNextTick() {
        if (!draining || !currentQueue) {
            return;
        }
        draining = false;
        if (currentQueue.length) {
            queue = currentQueue.concat(queue);
        } else {
            queueIndex = -1;
        }
        if (queue.length) {
            drainQueue();
        }
    }
    
    function drainQueue() {
        if (draining) {
            return;
        }
        var timeout = runTimeout(cleanUpNextTick);
        draining = true;
    
        var len = queue.length;
        while(len) {
            currentQueue = queue;
            queue = [];
            while (++queueIndex < len) {
                if (currentQueue) {
                    currentQueue[queueIndex].run();
                }
            }
            queueIndex = -1;
            len = queue.length;
        }
        currentQueue = null;
        draining = false;
        runClearTimeout(timeout);
    }
    
    process.nextTick = function (fun) {
        var args = new Array(arguments.length - 1);
        if (arguments.length > 1) {
            for (var i = 1; i < arguments.length; i++) {
                args[i - 1] = arguments[i];
            }
        }
        queue.push(new Item(fun, args));
        if (queue.length === 1 && !draining) {
            runTimeout(drainQueue);
        }
    };
    
    // v8 likes predictible objects
    function Item(fun, array) {
        this.fun = fun;
        this.array = array;
    }
    Item.prototype.run = function () {
        this.fun.apply(null, this.array);
    };
    process.title = 'browser';
    process.browser = true;
    process.env = {};
    process.argv = [];
    process.version = ''; // empty string to avoid regexp issues
    process.versions = {};
    
    function noop() {}
    
    process.on = noop;
    process.addListener = noop;
    process.once = noop;
    process.off = noop;
    process.removeListener = noop;
    process.removeAllListeners = noop;
    process.emit = noop;
    process.prependListener = noop;
    process.prependOnceListener = noop;
    
    process.listeners = function (name) { return [] }
    
    process.binding = function (name) {
        throw new Error('process.binding is not supported');
    };
    
    process.cwd = function () { return '/' };
    process.chdir = function (dir) {
        throw new Error('process.chdir is not supported');
    };
    process.umask = function() { return 0; };
    
    },{}],6:[function(require,module,exports){
    /* eslint-disable node/no-deprecated-api */
    var buffer = require('buffer')
    var Buffer = buffer.Buffer
    
    // alternative to using Object.keys for old browsers
    function copyProps (src, dst) {
      for (var key in src) {
        dst[key] = src[key]
      }
    }
    if (Buffer.from && Buffer.alloc && Buffer.allocUnsafe && Buffer.allocUnsafeSlow) {
      module.exports = buffer
    } else {
      // Copy properties from require('buffer')
      copyProps(buffer, exports)
      exports.Buffer = SafeBuffer
    }
    
    function SafeBuffer (arg, encodingOrOffset, length) {
      return Buffer(arg, encodingOrOffset, length)
    }
    
    // Copy static methods from Buffer
    copyProps(Buffer, SafeBuffer)
    
    SafeBuffer.from = function (arg, encodingOrOffset, length) {
      if (typeof arg === 'number') {
        throw new TypeError('Argument must not be a number')
      }
      return Buffer(arg, encodingOrOffset, length)
    }
    
    SafeBuffer.alloc = function (size, fill, encoding) {
      if (typeof size !== 'number') {
        throw new TypeError('Argument must be a number')
      }
      var buf = Buffer(size)
      if (fill !== undefined) {
        if (typeof encoding === 'string') {
          buf.fill(fill, encoding)
        } else {
          buf.fill(fill)
        }
      } else {
        buf.fill(0)
      }
      return buf
    }
    
    SafeBuffer.allocUnsafe = function (size) {
      if (typeof size !== 'number') {
        throw new TypeError('Argument must be a number')
      }
      return Buffer(size)
    }
    
    SafeBuffer.allocUnsafeSlow = function (size) {
      if (typeof size !== 'number') {
        throw new TypeError('Argument must be a number')
      }
      return buffer.SlowBuffer(size)
    }
    
    },{"buffer":3}],7:[function(require,module,exports){
    // Copyright Joyent, Inc. and other Node contributors.
    //
    // Permission is hereby granted, free of charge, to any person obtaining a
    // copy of this software and associated documentation files (the
    // "Software"), to deal in the Software without restriction, including
    // without limitation the rights to use, copy, modify, merge, publish,
    // distribute, sublicense, and/or sell copies of the Software, and to permit
    // persons to whom the Software is furnished to do so, subject to the
    // following conditions:
    //
    // The above copyright notice and this permission notice shall be included
    // in all copies or substantial portions of the Software.
    //
    // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
    // OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
    // MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
    // NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
    // DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
    // OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
    // USE OR OTHER DEALINGS IN THE SOFTWARE.
    
    'use strict';
    
    /*<replacement>*/
    
    var Buffer = require('safe-buffer').Buffer;
    /*</replacement>*/
    
    var isEncoding = Buffer.isEncoding || function (encoding) {
      encoding = '' + encoding;
      switch (encoding && encoding.toLowerCase()) {
        case 'hex':case 'utf8':case 'utf-8':case 'ascii':case 'binary':case 'base64':case 'ucs2':case 'ucs-2':case 'utf16le':case 'utf-16le':case 'raw':
          return true;
        default:
          return false;
      }
    };
    
    function _normalizeEncoding(enc) {
      if (!enc) return 'utf8';
      var retried;
      while (true) {
        switch (enc) {
          case 'utf8':
          case 'utf-8':
            return 'utf8';
          case 'ucs2':
          case 'ucs-2':
          case 'utf16le':
          case 'utf-16le':
            return 'utf16le';
          case 'latin1':
          case 'binary':
            return 'latin1';
          case 'base64':
          case 'ascii':
          case 'hex':
            return enc;
          default:
            if (retried) return; // undefined
            enc = ('' + enc).toLowerCase();
            retried = true;
        }
      }
    };
    
    // Do not cache `Buffer.isEncoding` when checking encoding names as some
    // modules monkey-patch it to support additional encodings
    function normalizeEncoding(enc) {
      var nenc = _normalizeEncoding(enc);
      if (typeof nenc !== 'string' && (Buffer.isEncoding === isEncoding || !isEncoding(enc))) throw new Error('Unknown encoding: ' + enc);
      return nenc || enc;
    }
    
    // StringDecoder provides an interface for efficiently splitting a series of
    // buffers into a series of JS strings without breaking apart multi-byte
    // characters.
    exports.StringDecoder = StringDecoder;
    function StringDecoder(encoding) {
      this.encoding = normalizeEncoding(encoding);
      var nb;
      switch (this.encoding) {
        case 'utf16le':
          this.text = utf16Text;
          this.end = utf16End;
          nb = 4;
          break;
        case 'utf8':
          this.fillLast = utf8FillLast;
          nb = 4;
          break;
        case 'base64':
          this.text = base64Text;
          this.end = base64End;
          nb = 3;
          break;
        default:
          this.write = simpleWrite;
          this.end = simpleEnd;
          return;
      }
      this.lastNeed = 0;
      this.lastTotal = 0;
      this.lastChar = Buffer.allocUnsafe(nb);
    }
    
    StringDecoder.prototype.write = function (buf) {
      if (buf.length === 0) return '';
      var r;
      var i;
      if (this.lastNeed) {
        r = this.fillLast(buf);
        if (r === undefined) return '';
        i = this.lastNeed;
        this.lastNeed = 0;
      } else {
        i = 0;
      }
      if (i < buf.length) return r ? r + this.text(buf, i) : this.text(buf, i);
      return r || '';
    };
    
    StringDecoder.prototype.end = utf8End;
    
    // Returns only complete characters in a Buffer
    StringDecoder.prototype.text = utf8Text;
    
    // Attempts to complete a partial non-UTF-8 character using bytes from a Buffer
    StringDecoder.prototype.fillLast = function (buf) {
      if (this.lastNeed <= buf.length) {
        buf.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, this.lastNeed);
        return this.lastChar.toString(this.encoding, 0, this.lastTotal);
      }
      buf.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, buf.length);
      this.lastNeed -= buf.length;
    };
    
    // Checks the type of a UTF-8 byte, whether it's ASCII, a leading byte, or a
    // continuation byte. If an invalid byte is detected, -2 is returned.
    function utf8CheckByte(byte) {
      if (byte <= 0x7F) return 0;else if (byte >> 5 === 0x06) return 2;else if (byte >> 4 === 0x0E) return 3;else if (byte >> 3 === 0x1E) return 4;
      return byte >> 6 === 0x02 ? -1 : -2;
    }
    
    // Checks at most 3 bytes at the end of a Buffer in order to detect an
    // incomplete multi-byte UTF-8 character. The total number of bytes (2, 3, or 4)
    // needed to complete the UTF-8 character (if applicable) are returned.
    function utf8CheckIncomplete(self, buf, i) {
      var j = buf.length - 1;
      if (j < i) return 0;
      var nb = utf8CheckByte(buf[j]);
      if (nb >= 0) {
        if (nb > 0) self.lastNeed = nb - 1;
        return nb;
      }
      if (--j < i || nb === -2) return 0;
      nb = utf8CheckByte(buf[j]);
      if (nb >= 0) {
        if (nb > 0) self.lastNeed = nb - 2;
        return nb;
      }
      if (--j < i || nb === -2) return 0;
      nb = utf8CheckByte(buf[j]);
      if (nb >= 0) {
        if (nb > 0) {
          if (nb === 2) nb = 0;else self.lastNeed = nb - 3;
        }
        return nb;
      }
      return 0;
    }
    
    // Validates as many continuation bytes for a multi-byte UTF-8 character as
    // needed or are available. If we see a non-continuation byte where we expect
    // one, we "replace" the validated continuation bytes we've seen so far with
    // a single UTF-8 replacement character ('\ufffd'), to match v8's UTF-8 decoding
    // behavior. The continuation byte check is included three times in the case
    // where all of the continuation bytes for a character exist in the same buffer.
    // It is also done this way as a slight performance increase instead of using a
    // loop.
    function utf8CheckExtraBytes(self, buf, p) {
      if ((buf[0] & 0xC0) !== 0x80) {
        self.lastNeed = 0;
        return '\ufffd';
      }
      if (self.lastNeed > 1 && buf.length > 1) {
        if ((buf[1] & 0xC0) !== 0x80) {
          self.lastNeed = 1;
          return '\ufffd';
        }
        if (self.lastNeed > 2 && buf.length > 2) {
          if ((buf[2] & 0xC0) !== 0x80) {
            self.lastNeed = 2;
            return '\ufffd';
          }
        }
      }
    }
    
    // Attempts to complete a multi-byte UTF-8 character using bytes from a Buffer.
    function utf8FillLast(buf) {
      var p = this.lastTotal - this.lastNeed;
      var r = utf8CheckExtraBytes(this, buf, p);
      if (r !== undefined) return r;
      if (this.lastNeed <= buf.length) {
        buf.copy(this.lastChar, p, 0, this.lastNeed);
        return this.lastChar.toString(this.encoding, 0, this.lastTotal);
      }
      buf.copy(this.lastChar, p, 0, buf.length);
      this.lastNeed -= buf.length;
    }
    
    // Returns all complete UTF-8 characters in a Buffer. If the Buffer ended on a
    // partial character, the character's bytes are buffered until the required
    // number of bytes are available.
    function utf8Text(buf, i) {
      var total = utf8CheckIncomplete(this, buf, i);
      if (!this.lastNeed) return buf.toString('utf8', i);
      this.lastTotal = total;
      var end = buf.length - (total - this.lastNeed);
      buf.copy(this.lastChar, 0, end);
      return buf.toString('utf8', i, end);
    }
    
    // For UTF-8, a replacement character is added when ending on a partial
    // character.
    function utf8End(buf) {
      var r = buf && buf.length ? this.write(buf) : '';
      if (this.lastNeed) return r + '\ufffd';
      return r;
    }
    
    // UTF-16LE typically needs two bytes per character, but even if we have an even
    // number of bytes available, we need to check if we end on a leading/high
    // surrogate. In that case, we need to wait for the next two bytes in order to
    // decode the last character properly.
    function utf16Text(buf, i) {
      if ((buf.length - i) % 2 === 0) {
        var r = buf.toString('utf16le', i);
        if (r) {
          var c = r.charCodeAt(r.length - 1);
          if (c >= 0xD800 && c <= 0xDBFF) {
            this.lastNeed = 2;
            this.lastTotal = 4;
            this.lastChar[0] = buf[buf.length - 2];
            this.lastChar[1] = buf[buf.length - 1];
            return r.slice(0, -1);
          }
        }
        return r;
      }
      this.lastNeed = 1;
      this.lastTotal = 2;
      this.lastChar[0] = buf[buf.length - 1];
      return buf.toString('utf16le', i, buf.length - 1);
    }
    
    // For UTF-16LE we do not explicitly append special replacement characters if we
    // end on a partial character, we simply let v8 handle that.
    function utf16End(buf) {
      var r = buf && buf.length ? this.write(buf) : '';
      if (this.lastNeed) {
        var end = this.lastTotal - this.lastNeed;
        return r + this.lastChar.toString('utf16le', 0, end);
      }
      return r;
    }
    
    function base64Text(buf, i) {
      var n = (buf.length - i) % 3;
      if (n === 0) return buf.toString('base64', i);
      this.lastNeed = 3 - n;
      this.lastTotal = 3;
      if (n === 1) {
        this.lastChar[0] = buf[buf.length - 1];
      } else {
        this.lastChar[0] = buf[buf.length - 2];
        this.lastChar[1] = buf[buf.length - 1];
      }
      return buf.toString('base64', i, buf.length - n);
    }
    
    function base64End(buf) {
      var r = buf && buf.length ? this.write(buf) : '';
      if (this.lastNeed) return r + this.lastChar.toString('base64', 0, 3 - this.lastNeed);
      return r;
    }
    
    // Pass bytes on through for single-byte encodings (e.g. ascii, latin1, hex)
    function simpleWrite(buf) {
      return buf.toString(this.encoding);
    }
    
    function simpleEnd(buf) {
      return buf && buf.length ? this.write(buf) : '';
    }
    },{"safe-buffer":6}],8:[function(require,module,exports){
    window.iconv = require('iconv-lite');
    
    },{"iconv-lite":27}],9:[function(require,module,exports){
    "use strict";
    var Buffer = require("safer-buffer").Buffer;
    
    // Multibyte codec. In this scheme, a character is represented by 1 or more bytes.
    // Our codec supports UTF-16 surrogates, extensions for GB18030 and unicode sequences.
    // To save memory and loading time, we read table files only when requested.
    
    exports._dbcs = DBCSCodec;
    
    var UNASSIGNED = -1,
        GB18030_CODE = -2,
        SEQ_START  = -10,
        NODE_START = -1000,
        UNASSIGNED_NODE = new Array(0x100),
        DEF_CHAR = -1;
    
    for (var i = 0; i < 0x100; i++)
        UNASSIGNED_NODE[i] = UNASSIGNED;
    
    
    // Class DBCSCodec reads and initializes mapping tables.
    function DBCSCodec(codecOptions, iconv) {
        this.encodingName = codecOptions.encodingName;
        if (!codecOptions)
            throw new Error("DBCS codec is called without the data.")
        if (!codecOptions.table)
            throw new Error("Encoding '" + this.encodingName + "' has no data.");
    
        // Load tables.
        var mappingTable = codecOptions.table();
    
    
        // Decode tables: MBCS -> Unicode.
    
        // decodeTables is a trie, encoded as an array of arrays of integers. Internal arrays are trie nodes and all have len = 256.
        // Trie root is decodeTables[0].
        // Values: >=  0 -> unicode character code. can be > 0xFFFF
        //         == UNASSIGNED -> unknown/unassigned sequence.
        //         == GB18030_CODE -> this is the end of a GB18030 4-byte sequence.
        //         <= NODE_START -> index of the next node in our trie to process next byte.
        //         <= SEQ_START  -> index of the start of a character code sequence, in decodeTableSeq.
        this.decodeTables = [];
        this.decodeTables[0] = UNASSIGNED_NODE.slice(0); // Create root node.
    
        // Sometimes a MBCS char corresponds to a sequence of unicode chars. We store them as arrays of integers here. 
        this.decodeTableSeq = [];
    
        // Actual mapping tables consist of chunks. Use them to fill up decode tables.
        for (var i = 0; i < mappingTable.length; i++)
            this._addDecodeChunk(mappingTable[i]);
    
        this.defaultCharUnicode = iconv.defaultCharUnicode;
    
        
        // Encode tables: Unicode -> DBCS.
    
        // `encodeTable` is array mapping from unicode char to encoded char. All its values are integers for performance.
        // Because it can be sparse, it is represented as array of buckets by 256 chars each. Bucket can be null.
        // Values: >=  0 -> it is a normal char. Write the value (if <=256 then 1 byte, if <=65536 then 2 bytes, etc.).
        //         == UNASSIGNED -> no conversion found. Output a default char.
        //         <= SEQ_START  -> it's an index in encodeTableSeq, see below. The character starts a sequence.
        this.encodeTable = [];
        
        // `encodeTableSeq` is used when a sequence of unicode characters is encoded as a single code. We use a tree of
        // objects where keys correspond to characters in sequence and leafs are the encoded dbcs values. A special DEF_CHAR key
        // means end of sequence (needed when one sequence is a strict subsequence of another).
        // Objects are kept separately from encodeTable to increase performance.
        this.encodeTableSeq = [];
    
        // Some chars can be decoded, but need not be encoded.
        var skipEncodeChars = {};
        if (codecOptions.encodeSkipVals)
            for (var i = 0; i < codecOptions.encodeSkipVals.length; i++) {
                var val = codecOptions.encodeSkipVals[i];
                if (typeof val === 'number')
                    skipEncodeChars[val] = true;
                else
                    for (var j = val.from; j <= val.to; j++)
                        skipEncodeChars[j] = true;
            }
            
        // Use decode trie to recursively fill out encode tables.
        this._fillEncodeTable(0, 0, skipEncodeChars);
    
        // Add more encoding pairs when needed.
        if (codecOptions.encodeAdd) {
            for (var uChar in codecOptions.encodeAdd)
                if (Object.prototype.hasOwnProperty.call(codecOptions.encodeAdd, uChar))
                    this._setEncodeChar(uChar.charCodeAt(0), codecOptions.encodeAdd[uChar]);
        }
    
        this.defCharSB  = this.encodeTable[0][iconv.defaultCharSingleByte.charCodeAt(0)];
        if (this.defCharSB === UNASSIGNED) this.defCharSB = this.encodeTable[0]['?'];
        if (this.defCharSB === UNASSIGNED) this.defCharSB = "?".charCodeAt(0);
    
    
        // Load & create GB18030 tables when needed.
        if (typeof codecOptions.gb18030 === 'function') {
            this.gb18030 = codecOptions.gb18030(); // Load GB18030 ranges.
    
            // Add GB18030 decode tables.
            var thirdByteNodeIdx = this.decodeTables.length;
            var thirdByteNode = this.decodeTables[thirdByteNodeIdx] = UNASSIGNED_NODE.slice(0);
    
            var fourthByteNodeIdx = this.decodeTables.length;
            var fourthByteNode = this.decodeTables[fourthByteNodeIdx] = UNASSIGNED_NODE.slice(0);
    
            for (var i = 0x81; i <= 0xFE; i++) {
                var secondByteNodeIdx = NODE_START - this.decodeTables[0][i];
                var secondByteNode = this.decodeTables[secondByteNodeIdx];
                for (var j = 0x30; j <= 0x39; j++)
                    secondByteNode[j] = NODE_START - thirdByteNodeIdx;
            }
            for (var i = 0x81; i <= 0xFE; i++)
                thirdByteNode[i] = NODE_START - fourthByteNodeIdx;
            for (var i = 0x30; i <= 0x39; i++)
                fourthByteNode[i] = GB18030_CODE
        }        
    }
    
    DBCSCodec.prototype.encoder = DBCSEncoder;
    DBCSCodec.prototype.decoder = DBCSDecoder;
    
    // Decoder helpers
    DBCSCodec.prototype._getDecodeTrieNode = function(addr) {
        var bytes = [];
        for (; addr > 0; addr >>= 8)
            bytes.push(addr & 0xFF);
        if (bytes.length == 0)
            bytes.push(0);
    
        var node = this.decodeTables[0];
        for (var i = bytes.length-1; i > 0; i--) { // Traverse nodes deeper into the trie.
            var val = node[bytes[i]];
    
            if (val == UNASSIGNED) { // Create new node.
                node[bytes[i]] = NODE_START - this.decodeTables.length;
                this.decodeTables.push(node = UNASSIGNED_NODE.slice(0));
            }
            else if (val <= NODE_START) { // Existing node.
                node = this.decodeTables[NODE_START - val];
            }
            else
                throw new Error("Overwrite byte in " + this.encodingName + ", addr: " + addr.toString(16));
        }
        return node;
    }
    
    
    DBCSCodec.prototype._addDecodeChunk = function(chunk) {
        // First element of chunk is the hex mbcs code where we start.
        var curAddr = parseInt(chunk[0], 16);
    
        // Choose the decoding node where we'll write our chars.
        var writeTable = this._getDecodeTrieNode(curAddr);
        curAddr = curAddr & 0xFF;
    
        // Write all other elements of the chunk to the table.
        for (var k = 1; k < chunk.length; k++) {
            var part = chunk[k];
            if (typeof part === "string") { // String, write as-is.
                for (var l = 0; l < part.length;) {
                    var code = part.charCodeAt(l++);
                    if (0xD800 <= code && code < 0xDC00) { // Decode surrogate
                        var codeTrail = part.charCodeAt(l++);
                        if (0xDC00 <= codeTrail && codeTrail < 0xE000)
                            writeTable[curAddr++] = 0x10000 + (code - 0xD800) * 0x400 + (codeTrail - 0xDC00);
                        else
                            throw new Error("Incorrect surrogate pair in "  + this.encodingName + " at chunk " + chunk[0]);
                    }
                    else if (0x0FF0 < code && code <= 0x0FFF) { // Character sequence (our own encoding used)
                        var len = 0xFFF - code + 2;
                        var seq = [];
                        for (var m = 0; m < len; m++)
                            seq.push(part.charCodeAt(l++)); // Simple variation: don't support surrogates or subsequences in seq.
    
                        writeTable[curAddr++] = SEQ_START - this.decodeTableSeq.length;
                        this.decodeTableSeq.push(seq);
                    }
                    else
                        writeTable[curAddr++] = code; // Basic char
                }
            } 
            else if (typeof part === "number") { // Integer, meaning increasing sequence starting with prev character.
                var charCode = writeTable[curAddr - 1] + 1;
                for (var l = 0; l < part; l++)
                    writeTable[curAddr++] = charCode++;
            }
            else
                throw new Error("Incorrect type '" + typeof part + "' given in "  + this.encodingName + " at chunk " + chunk[0]);
        }
        if (curAddr > 0xFF)
            throw new Error("Incorrect chunk in "  + this.encodingName + " at addr " + chunk[0] + ": too long" + curAddr);
    }
    
    // Encoder helpers
    DBCSCodec.prototype._getEncodeBucket = function(uCode) {
        var high = uCode >> 8; // This could be > 0xFF because of astral characters.
        if (this.encodeTable[high] === undefined)
            this.encodeTable[high] = UNASSIGNED_NODE.slice(0); // Create bucket on demand.
        return this.encodeTable[high];
    }
    
    DBCSCodec.prototype._setEncodeChar = function(uCode, dbcsCode) {
        var bucket = this._getEncodeBucket(uCode);
        var low = uCode & 0xFF;
        if (bucket[low] <= SEQ_START)
            this.encodeTableSeq[SEQ_START-bucket[low]][DEF_CHAR] = dbcsCode; // There's already a sequence, set a single-char subsequence of it.
        else if (bucket[low] == UNASSIGNED)
            bucket[low] = dbcsCode;
    }
    
    DBCSCodec.prototype._setEncodeSequence = function(seq, dbcsCode) {
        
        // Get the root of character tree according to first character of the sequence.
        var uCode = seq[0];
        var bucket = this._getEncodeBucket(uCode);
        var low = uCode & 0xFF;
    
        var node;
        if (bucket[low] <= SEQ_START) {
            // There's already a sequence with  - use it.
            node = this.encodeTableSeq[SEQ_START-bucket[low]];
        }
        else {
            // There was no sequence object - allocate a new one.
            node = {};
            if (bucket[low] !== UNASSIGNED) node[DEF_CHAR] = bucket[low]; // If a char was set before - make it a single-char subsequence.
            bucket[low] = SEQ_START - this.encodeTableSeq.length;
            this.encodeTableSeq.push(node);
        }
    
        // Traverse the character tree, allocating new nodes as needed.
        for (var j = 1; j < seq.length-1; j++) {
            var oldVal = node[uCode];
            if (typeof oldVal === 'object')
                node = oldVal;
            else {
                node = node[uCode] = {}
                if (oldVal !== undefined)
                    node[DEF_CHAR] = oldVal
            }
        }
    
        // Set the leaf to given dbcsCode.
        uCode = seq[seq.length-1];
        node[uCode] = dbcsCode;
    }
    
    DBCSCodec.prototype._fillEncodeTable = function(nodeIdx, prefix, skipEncodeChars) {
        var node = this.decodeTables[nodeIdx];
        for (var i = 0; i < 0x100; i++) {
            var uCode = node[i];
            var mbCode = prefix + i;
            if (skipEncodeChars[mbCode])
                continue;
    
            if (uCode >= 0)
                this._setEncodeChar(uCode, mbCode);
            else if (uCode <= NODE_START)
                this._fillEncodeTable(NODE_START - uCode, mbCode << 8, skipEncodeChars);
            else if (uCode <= SEQ_START)
                this._setEncodeSequence(this.decodeTableSeq[SEQ_START - uCode], mbCode);
        }
    }
    
    
    
    // == Encoder ==================================================================
    
    function DBCSEncoder(options, codec) {
        // Encoder state
        this.leadSurrogate = -1;
        this.seqObj = undefined;
        
        // Static data
        this.encodeTable = codec.encodeTable;
        this.encodeTableSeq = codec.encodeTableSeq;
        this.defaultCharSingleByte = codec.defCharSB;
        this.gb18030 = codec.gb18030;
    }
    
    DBCSEncoder.prototype.write = function(str) {
        var newBuf = Buffer.alloc(str.length * (this.gb18030 ? 4 : 3)),
            leadSurrogate = this.leadSurrogate,
            seqObj = this.seqObj, nextChar = -1,
            i = 0, j = 0;
    
        while (true) {
            // 0. Get next character.
            if (nextChar === -1) {
                if (i == str.length) break;
                var uCode = str.charCodeAt(i++);
            }
            else {
                var uCode = nextChar;
                nextChar = -1;    
            }
    
            // 1. Handle surrogates.
            if (0xD800 <= uCode && uCode < 0xE000) { // Char is one of surrogates.
                if (uCode < 0xDC00) { // We've got lead surrogate.
                    if (leadSurrogate === -1) {
                        leadSurrogate = uCode;
                        continue;
                    } else {
                        leadSurrogate = uCode;
                        // Double lead surrogate found.
                        uCode = UNASSIGNED;
                    }
                } else { // We've got trail surrogate.
                    if (leadSurrogate !== -1) {
                        uCode = 0x10000 + (leadSurrogate - 0xD800) * 0x400 + (uCode - 0xDC00);
                        leadSurrogate = -1;
                    } else {
                        // Incomplete surrogate pair - only trail surrogate found.
                        uCode = UNASSIGNED;
                    }
                    
                }
            }
            else if (leadSurrogate !== -1) {
                // Incomplete surrogate pair - only lead surrogate found.
                nextChar = uCode; uCode = UNASSIGNED; // Write an error, then current char.
                leadSurrogate = -1;
            }
    
            // 2. Convert uCode character.
            var dbcsCode = UNASSIGNED;
            if (seqObj !== undefined && uCode != UNASSIGNED) { // We are in the middle of the sequence
                var resCode = seqObj[uCode];
                if (typeof resCode === 'object') { // Sequence continues.
                    seqObj = resCode;
                    continue;
    
                } else if (typeof resCode == 'number') { // Sequence finished. Write it.
                    dbcsCode = resCode;
    
                } else if (resCode == undefined) { // Current character is not part of the sequence.
    
                    // Try default character for this sequence
                    resCode = seqObj[DEF_CHAR];
                    if (resCode !== undefined) {
                        dbcsCode = resCode; // Found. Write it.
                        nextChar = uCode; // Current character will be written too in the next iteration.
    
                    } else {
                        // TODO: What if we have no default? (resCode == undefined)
                        // Then, we should write first char of the sequence as-is and try the rest recursively.
                        // Didn't do it for now because no encoding has this situation yet.
                        // Currently, just skip the sequence and write current char.
                    }
                }
                seqObj = undefined;
            }
            else if (uCode >= 0) {  // Regular character
                var subtable = this.encodeTable[uCode >> 8];
                if (subtable !== undefined)
                    dbcsCode = subtable[uCode & 0xFF];
                
                if (dbcsCode <= SEQ_START) { // Sequence start
                    seqObj = this.encodeTableSeq[SEQ_START-dbcsCode];
                    continue;
                }
    
                if (dbcsCode == UNASSIGNED && this.gb18030) {
                    // Use GB18030 algorithm to find character(s) to write.
                    var idx = findIdx(this.gb18030.uChars, uCode);
                    if (idx != -1) {
                        var dbcsCode = this.gb18030.gbChars[idx] + (uCode - this.gb18030.uChars[idx]);
                        newBuf[j++] = 0x81 + Math.floor(dbcsCode / 12600); dbcsCode = dbcsCode % 12600;
                        newBuf[j++] = 0x30 + Math.floor(dbcsCode / 1260); dbcsCode = dbcsCode % 1260;
                        newBuf[j++] = 0x81 + Math.floor(dbcsCode / 10); dbcsCode = dbcsCode % 10;
                        newBuf[j++] = 0x30 + dbcsCode;
                        continue;
                    }
                }
            }
    
            // 3. Write dbcsCode character.
            if (dbcsCode === UNASSIGNED)
                dbcsCode = this.defaultCharSingleByte;
            
            if (dbcsCode < 0x100) {
                newBuf[j++] = dbcsCode;
            }
            else if (dbcsCode < 0x10000) {
                newBuf[j++] = dbcsCode >> 8;   // high byte
                newBuf[j++] = dbcsCode & 0xFF; // low byte
            }
            else {
                newBuf[j++] = dbcsCode >> 16;
                newBuf[j++] = (dbcsCode >> 8) & 0xFF;
                newBuf[j++] = dbcsCode & 0xFF;
            }
        }
    
        this.seqObj = seqObj;
        this.leadSurrogate = leadSurrogate;
        return newBuf.slice(0, j);
    }
    
    DBCSEncoder.prototype.end = function() {
        if (this.leadSurrogate === -1 && this.seqObj === undefined)
            return; // All clean. Most often case.
    
        var newBuf = Buffer.alloc(10), j = 0;
    
        if (this.seqObj) { // We're in the sequence.
            var dbcsCode = this.seqObj[DEF_CHAR];
            if (dbcsCode !== undefined) { // Write beginning of the sequence.
                if (dbcsCode < 0x100) {
                    newBuf[j++] = dbcsCode;
                }
                else {
                    newBuf[j++] = dbcsCode >> 8;   // high byte
                    newBuf[j++] = dbcsCode & 0xFF; // low byte
                }
            } else {
                // See todo above.
            }
            this.seqObj = undefined;
        }
    
        if (this.leadSurrogate !== -1) {
            // Incomplete surrogate pair - only lead surrogate found.
            newBuf[j++] = this.defaultCharSingleByte;
            this.leadSurrogate = -1;
        }
        
        return newBuf.slice(0, j);
    }
    
    // Export for testing
    DBCSEncoder.prototype.findIdx = findIdx;
    
    
    // == Decoder ==================================================================
    
    function DBCSDecoder(options, codec) {
        // Decoder state
        this.nodeIdx = 0;
        this.prevBuf = Buffer.alloc(0);
    
        // Static data
        this.decodeTables = codec.decodeTables;
        this.decodeTableSeq = codec.decodeTableSeq;
        this.defaultCharUnicode = codec.defaultCharUnicode;
        this.gb18030 = codec.gb18030;
    }
    
    DBCSDecoder.prototype.write = function(buf) {
        var newBuf = Buffer.alloc(buf.length*2),
            nodeIdx = this.nodeIdx, 
            prevBuf = this.prevBuf, prevBufOffset = this.prevBuf.length,
            seqStart = -this.prevBuf.length, // idx of the start of current parsed sequence.
            uCode;
    
        if (prevBufOffset > 0) // Make prev buf overlap a little to make it easier to slice later.
            prevBuf = Buffer.concat([prevBuf, buf.slice(0, 10)]);
        
        for (var i = 0, j = 0; i < buf.length; i++) {
            var curByte = (i >= 0) ? buf[i] : prevBuf[i + prevBufOffset];
    
            // Lookup in current trie node.
            var uCode = this.decodeTables[nodeIdx][curByte];
    
            if (uCode >= 0) { 
                // Normal character, just use it.
            }
            else if (uCode === UNASSIGNED) { // Unknown char.
                // TODO: Callback with seq.
                //var curSeq = (seqStart >= 0) ? buf.slice(seqStart, i+1) : prevBuf.slice(seqStart + prevBufOffset, i+1 + prevBufOffset);
                i = seqStart; // Try to parse again, after skipping first byte of the sequence ('i' will be incremented by 'for' cycle).
                uCode = this.defaultCharUnicode.charCodeAt(0);
            }
            else if (uCode === GB18030_CODE) {
                var curSeq = (seqStart >= 0) ? buf.slice(seqStart, i+1) : prevBuf.slice(seqStart + prevBufOffset, i+1 + prevBufOffset);
                var ptr = (curSeq[0]-0x81)*12600 + (curSeq[1]-0x30)*1260 + (curSeq[2]-0x81)*10 + (curSeq[3]-0x30);
                var idx = findIdx(this.gb18030.gbChars, ptr);
                uCode = this.gb18030.uChars[idx] + ptr - this.gb18030.gbChars[idx];
            }
            else if (uCode <= NODE_START) { // Go to next trie node.
                nodeIdx = NODE_START - uCode;
                continue;
            }
            else if (uCode <= SEQ_START) { // Output a sequence of chars.
                var seq = this.decodeTableSeq[SEQ_START - uCode];
                for (var k = 0; k < seq.length - 1; k++) {
                    uCode = seq[k];
                    newBuf[j++] = uCode & 0xFF;
                    newBuf[j++] = uCode >> 8;
                }
                uCode = seq[seq.length-1];
            }
            else
                throw new Error("iconv-lite internal error: invalid decoding table value " + uCode + " at " + nodeIdx + "/" + curByte);
    
            // Write the character to buffer, handling higher planes using surrogate pair.
            if (uCode > 0xFFFF) { 
                uCode -= 0x10000;
                var uCodeLead = 0xD800 + Math.floor(uCode / 0x400);
                newBuf[j++] = uCodeLead & 0xFF;
                newBuf[j++] = uCodeLead >> 8;
    
                uCode = 0xDC00 + uCode % 0x400;
            }
            newBuf[j++] = uCode & 0xFF;
            newBuf[j++] = uCode >> 8;
    
            // Reset trie node.
            nodeIdx = 0; seqStart = i+1;
        }
    
        this.nodeIdx = nodeIdx;
        this.prevBuf = (seqStart >= 0) ? buf.slice(seqStart) : prevBuf.slice(seqStart + prevBufOffset);
        return newBuf.slice(0, j).toString('ucs2');
    }
    
    DBCSDecoder.prototype.end = function() {
        var ret = '';
    
        // Try to parse all remaining chars.
        while (this.prevBuf.length > 0) {
            // Skip 1 character in the buffer.
            ret += this.defaultCharUnicode;
            var buf = this.prevBuf.slice(1);
    
            // Parse remaining as usual.
            this.prevBuf = Buffer.alloc(0);
            this.nodeIdx = 0;
            if (buf.length > 0)
                ret += this.write(buf);
        }
    
        this.nodeIdx = 0;
        return ret;
    }
    
    // Binary search for GB18030. Returns largest i such that table[i] <= val.
    function findIdx(table, val) {
        if (table[0] > val)
            return -1;
    
        var l = 0, r = table.length;
        while (l < r-1) { // always table[l] <= val < table[r]
            var mid = l + Math.floor((r-l+1)/2);
            if (table[mid] <= val)
                l = mid;
            else
                r = mid;
        }
        return l;
    }
    
    
    },{"safer-buffer":28}],10:[function(require,module,exports){
    "use strict";
    
    // Description of supported double byte encodings and aliases.
    // Tables are not require()-d until they are needed to speed up library load.
    // require()-s are direct to support Browserify.
    
    module.exports = {
        
        // == Japanese/ShiftJIS ====================================================
        // All japanese encodings are based on JIS X set of standards:
        // JIS X 0201 - Single-byte encoding of ASCII + ВҐ + Kana chars at 0xA1-0xDF.
        // JIS X 0208 - Main set of 6879 characters, placed in 94x94 plane, to be encoded by 2 bytes. 
        //              Has several variations in 1978, 1983, 1990 and 1997.
        // JIS X 0212 - Supplementary plane of 6067 chars in 94x94 plane. 1990. Effectively dead.
        // JIS X 0213 - Extension and modern replacement of 0208 and 0212. Total chars: 11233.
        //              2 planes, first is superset of 0208, second - revised 0212.
        //              Introduced in 2000, revised 2004. Some characters are in Unicode Plane 2 (0x2xxxx)
    
        // Byte encodings are:
        //  * Shift_JIS: Compatible with 0201, uses not defined chars in top half as lead bytes for double-byte
        //               encoding of 0208. Lead byte ranges: 0x81-0x9F, 0xE0-0xEF; Trail byte ranges: 0x40-0x7E, 0x80-0x9E, 0x9F-0xFC.
        //               Windows CP932 is a superset of Shift_JIS. Some companies added more chars, notably KDDI.
        //  * EUC-JP:    Up to 3 bytes per character. Used mostly on *nixes.
        //               0x00-0x7F       - lower part of 0201
        //               0x8E, 0xA1-0xDF - upper part of 0201
        //               (0xA1-0xFE)x2   - 0208 plane (94x94).
        //               0x8F, (0xA1-0xFE)x2 - 0212 plane (94x94).
        //  * JIS X 208: 7-bit, direct encoding of 0208. Byte ranges: 0x21-0x7E (94 values). Uncommon.
        //               Used as-is in ISO2022 family.
        //  * ISO2022-JP: Stateful encoding, with escape sequences to switch between ASCII, 
        //                0201-1976 Roman, 0208-1978, 0208-1983.
        //  * ISO2022-JP-1: Adds esc seq for 0212-1990.
        //  * ISO2022-JP-2: Adds esc seq for GB2313-1980, KSX1001-1992, ISO8859-1, ISO8859-7.
        //  * ISO2022-JP-3: Adds esc seq for 0201-1976 Kana set, 0213-2000 Planes 1, 2.
        //  * ISO2022-JP-2004: Adds 0213-2004 Plane 1.
        //
        // After JIS X 0213 appeared, Shift_JIS-2004, EUC-JISX0213 and ISO2022-JP-2004 followed, with just changing the planes.
        //
        // Overall, it seems that it's a mess :( http://www8.plala.or.jp/tkubota1/unicode-symbols-map2.html
    
        'shiftjis': {
            type: '_dbcs',
            table: function() { return require('./tables/shiftjis.json') },
            encodeAdd: {'\u00a5': 0x5C, '\u203E': 0x7E},
            encodeSkipVals: [{from: 0xED40, to: 0xF940}],
        },
        'csshiftjis': 'shiftjis',
        'mskanji': 'shiftjis',
        'sjis': 'shiftjis',
        'windows31j': 'shiftjis',
        'ms31j': 'shiftjis',
        'xsjis': 'shiftjis',
        'windows932': 'shiftjis',
        'ms932': 'shiftjis',
        '932': 'shiftjis',
        'cp932': 'shiftjis',
    
        'eucjp': {
            type: '_dbcs',
            table: function() { return require('./tables/eucjp.json') },
            encodeAdd: {'\u00a5': 0x5C, '\u203E': 0x7E},
        },
    
        // TODO: KDDI extension to Shift_JIS
        // TODO: IBM CCSID 942 = CP932, but F0-F9 custom chars and other char changes.
        // TODO: IBM CCSID 943 = Shift_JIS = CP932 with original Shift_JIS lower 128 chars.
    
    
        // == Chinese/GBK ==========================================================
        // http://en.wikipedia.org/wiki/GBK
        // We mostly implement W3C recommendation: https://www.w3.org/TR/encoding/#gbk-encoder
    
        // Oldest GB2312 (1981, ~7600 chars) is a subset of CP936
        'gb2312': 'cp936',
        'gb231280': 'cp936',
        'gb23121980': 'cp936',
        'csgb2312': 'cp936',
        'csiso58gb231280': 'cp936',
        'euccn': 'cp936',
    
        // Microsoft's CP936 is a subset and approximation of GBK.
        'windows936': 'cp936',
        'ms936': 'cp936',
        '936': 'cp936',
        'cp936': {
            type: '_dbcs',
            table: function() { return require('./tables/cp936.json') },
        },
    
        // GBK (~22000 chars) is an extension of CP936 that added user-mapped chars and some other.
        'gbk': {
            type: '_dbcs',
            table: function() { return require('./tables/cp936.json').concat(require('./tables/gbk-added.json')) },
        },
        'xgbk': 'gbk',
        'isoir58': 'gbk',
    
        // GB18030 is an algorithmic extension of GBK.
        // Main source: https://www.w3.org/TR/encoding/#gbk-encoder
        // http://icu-project.org/docs/papers/gb18030.html
        // http://source.icu-project.org/repos/icu/data/trunk/charset/data/xml/gb-18030-2000.xml
        // http://www.khngai.com/chinese/charmap/tblgbk.php?page=0
        'gb18030': {
            type: '_dbcs',
            table: function() { return require('./tables/cp936.json').concat(require('./tables/gbk-added.json')) },
            gb18030: function() { return require('./tables/gb18030-ranges.json') },
            encodeSkipVals: [0x80],
            encodeAdd: {'в‚¬': 0xA2E3},
        },
    
        'chinese': 'gb18030',
    
    
        // == Korean ===============================================================
        // EUC-KR, KS_C_5601 and KS X 1001 are exactly the same.
        'windows949': 'cp949',
        'ms949': 'cp949',
        '949': 'cp949',
        'cp949': {
            type: '_dbcs',
            table: function() { return require('./tables/cp949.json') },
        },
    
        'cseuckr': 'cp949',
        'csksc56011987': 'cp949',
        'euckr': 'cp949',
        'isoir149': 'cp949',
        'korean': 'cp949',
        'ksc56011987': 'cp949',
        'ksc56011989': 'cp949',
        'ksc5601': 'cp949',
    
    
        // == Big5/Taiwan/Hong Kong ================================================
        // There are lots of tables for Big5 and cp950. Please see the following links for history:
        // http://moztw.org/docs/big5/  http://www.haible.de/bruno/charsets/conversion-tables/Big5.html
        // Variations, in roughly number of defined chars:
        //  * Windows CP 950: Microsoft variant of Big5. Canonical: http://www.unicode.org/Public/MAPPINGS/VENDORS/MICSFT/WINDOWS/CP950.TXT
        //  * Windows CP 951: Microsoft variant of Big5-HKSCS-2001. Seems to be never public. http://me.abelcheung.org/articles/research/what-is-cp951/
        //  * Big5-2003 (Taiwan standard) almost superset of cp950.
        //  * Unicode-at-on (UAO) / Mozilla 1.8. Falling out of use on the Web. Not supported by other browsers.
        //  * Big5-HKSCS (-2001, -2004, -2008). Hong Kong standard. 
        //    many unicode code points moved from PUA to Supplementary plane (U+2XXXX) over the years.
        //    Plus, it has 4 combining sequences.
        //    Seems that Mozilla refused to support it for 10 yrs. https://bugzilla.mozilla.org/show_bug.cgi?id=162431 https://bugzilla.mozilla.org/show_bug.cgi?id=310299
        //    because big5-hkscs is the only encoding to include astral characters in non-algorithmic way.
        //    Implementations are not consistent within browsers; sometimes labeled as just big5.
        //    MS Internet Explorer switches from big5 to big5-hkscs when a patch applied.
        //    Great discussion & recap of what's going on https://bugzilla.mozilla.org/show_bug.cgi?id=912470#c31
        //    In the encoder, it might make sense to support encoding old PUA mappings to Big5 bytes seq-s.
        //    Official spec: http://www.ogcio.gov.hk/en/business/tech_promotion/ccli/terms/doc/2003cmp_2008.txt
        //                   http://www.ogcio.gov.hk/tc/business/tech_promotion/ccli/terms/doc/hkscs-2008-big5-iso.txt
        // 
        // Current understanding of how to deal with Big5(-HKSCS) is in the Encoding Standard, http://encoding.spec.whatwg.org/#big5-encoder
        // Unicode mapping (http://www.unicode.org/Public/MAPPINGS/OBSOLETE/EASTASIA/OTHER/BIG5.TXT) is said to be wrong.
    
        'windows950': 'cp950',
        'ms950': 'cp950',
        '950': 'cp950',
        'cp950': {
            type: '_dbcs',
            table: function() { return require('./tables/cp950.json') },
        },
    
        // Big5 has many variations and is an extension of cp950. We use Encoding Standard's as a consensus.
        'big5': 'big5hkscs',
        'big5hkscs': {
            type: '_dbcs',
            table: function() { return require('./tables/cp950.json').concat(require('./tables/big5-added.json')) },
            encodeSkipVals: [0xa2cc],
        },
    
        'cnbig5': 'big5hkscs',
        'csbig5': 'big5hkscs',
        'xxbig5': 'big5hkscs',
    };
    
    },{"./tables/big5-added.json":16,"./tables/cp936.json":17,"./tables/cp949.json":18,"./tables/cp950.json":19,"./tables/eucjp.json":20,"./tables/gb18030-ranges.json":21,"./tables/gbk-added.json":22,"./tables/shiftjis.json":23}],11:[function(require,module,exports){
    "use strict";
    
    // Update this array if you add/rename/remove files in this directory.
    // We support Browserify by skipping automatic module discovery and requiring modules directly.
    var modules = [
        require("./internal"),
        require("./utf16"),
        require("./utf7"),
        require("./sbcs-codec"),
        require("./sbcs-data"),
        require("./sbcs-data-generated"),
        require("./dbcs-codec"),
        require("./dbcs-data"),
    ];
    
    // Put all encoding/alias/codec definitions to single object and export it. 
    for (var i = 0; i < modules.length; i++) {
        var module = modules[i];
        for (var enc in module)
            if (Object.prototype.hasOwnProperty.call(module, enc))
                exports[enc] = module[enc];
    }
    
    },{"./dbcs-codec":9,"./dbcs-data":10,"./internal":12,"./sbcs-codec":13,"./sbcs-data":15,"./sbcs-data-generated":14,"./utf16":24,"./utf7":25}],12:[function(require,module,exports){
    "use strict";
    var Buffer = require("safer-buffer").Buffer;
    
    // Export Node.js internal encodings.
    
    module.exports = {
        // Encodings
        utf8:   { type: "_internal", bomAware: true},
        cesu8:  { type: "_internal", bomAware: true},
        unicode11utf8: "utf8",
    
        ucs2:   { type: "_internal", bomAware: true},
        utf16le: "ucs2",
    
        binary: { type: "_internal" },
        base64: { type: "_internal" },
        hex:    { type: "_internal" },
    
        // Codec.
        _internal: InternalCodec,
    };
    
    //------------------------------------------------------------------------------
    
    function InternalCodec(codecOptions, iconv) {
        this.enc = codecOptions.encodingName;
        this.bomAware = codecOptions.bomAware;
    
        if (this.enc === "base64")
            this.encoder = InternalEncoderBase64;
        else if (this.enc === "cesu8") {
            this.enc = "utf8"; // Use utf8 for decoding.
            this.encoder = InternalEncoderCesu8;
    
            // Add decoder for versions of Node not supporting CESU-8
            if (Buffer.from('eda0bdedb2a9', 'hex').toString() !== 'рџ’©') {
                this.decoder = InternalDecoderCesu8;
                this.defaultCharUnicode = iconv.defaultCharUnicode;
            }
        }
    }
    
    InternalCodec.prototype.encoder = InternalEncoder;
    InternalCodec.prototype.decoder = InternalDecoder;
    
    //------------------------------------------------------------------------------
    
    // We use node.js internal decoder. Its signature is the same as ours.
    var StringDecoder = require('string_decoder').StringDecoder;
    
    if (!StringDecoder.prototype.end) // Node v0.8 doesn't have this method.
        StringDecoder.prototype.end = function() {};
    
    
    function InternalDecoder(options, codec) {
        StringDecoder.call(this, codec.enc);
    }
    
    InternalDecoder.prototype = StringDecoder.prototype;
    
    
    //------------------------------------------------------------------------------
    // Encoder is mostly trivial
    
    function InternalEncoder(options, codec) {
        this.enc = codec.enc;
    }
    
    InternalEncoder.prototype.write = function(str) {
        return Buffer.from(str, this.enc);
    }
    
    InternalEncoder.prototype.end = function() {
    }
    
    
    //------------------------------------------------------------------------------
    // Except base64 encoder, which must keep its state.
    
    function InternalEncoderBase64(options, codec) {
        this.prevStr = '';
    }
    
    InternalEncoderBase64.prototype.write = function(str) {
        str = this.prevStr + str;
        var completeQuads = str.length - (str.length % 4);
        this.prevStr = str.slice(completeQuads);
        str = str.slice(0, completeQuads);
    
        return Buffer.from(str, "base64");
    }
    
    InternalEncoderBase64.prototype.end = function() {
        return Buffer.from(this.prevStr, "base64");
    }
    
    
    //------------------------------------------------------------------------------
    // CESU-8 encoder is also special.
    
    function InternalEncoderCesu8(options, codec) {
    }
    
    InternalEncoderCesu8.prototype.write = function(str) {
        var buf = Buffer.alloc(str.length * 3), bufIdx = 0;
        for (var i = 0; i < str.length; i++) {
            var charCode = str.charCodeAt(i);
            // Naive implementation, but it works because CESU-8 is especially easy
            // to convert from UTF-16 (which all JS strings are encoded in).
            if (charCode < 0x80)
                buf[bufIdx++] = charCode;
            else if (charCode < 0x800) {
                buf[bufIdx++] = 0xC0 + (charCode >>> 6);
                buf[bufIdx++] = 0x80 + (charCode & 0x3f);
            }
            else { // charCode will always be < 0x10000 in javascript.
                buf[bufIdx++] = 0xE0 + (charCode >>> 12);
                buf[bufIdx++] = 0x80 + ((charCode >>> 6) & 0x3f);
                buf[bufIdx++] = 0x80 + (charCode & 0x3f);
            }
        }
        return buf.slice(0, bufIdx);
    }
    
    InternalEncoderCesu8.prototype.end = function() {
    }
    
    //------------------------------------------------------------------------------
    // CESU-8 decoder is not implemented in Node v4.0+
    
    function InternalDecoderCesu8(options, codec) {
        this.acc = 0;
        this.contBytes = 0;
        this.accBytes = 0;
        this.defaultCharUnicode = codec.defaultCharUnicode;
    }
    
    InternalDecoderCesu8.prototype.write = function(buf) {
        var acc = this.acc, contBytes = this.contBytes, accBytes = this.accBytes, 
            res = '';
        for (var i = 0; i < buf.length; i++) {
            var curByte = buf[i];
            if ((curByte & 0xC0) !== 0x80) { // Leading byte
                if (contBytes > 0) { // Previous code is invalid
                    res += this.defaultCharUnicode;
                    contBytes = 0;
                }
    
                if (curByte < 0x80) { // Single-byte code
                    res += String.fromCharCode(curByte);
                } else if (curByte < 0xE0) { // Two-byte code
                    acc = curByte & 0x1F;
                    contBytes = 1; accBytes = 1;
                } else if (curByte < 0xF0) { // Three-byte code
                    acc = curByte & 0x0F;
                    contBytes = 2; accBytes = 1;
                } else { // Four or more are not supported for CESU-8.
                    res += this.defaultCharUnicode;
                }
            } else { // Continuation byte
                if (contBytes > 0) { // We're waiting for it.
                    acc = (acc << 6) | (curByte & 0x3f);
                    contBytes--; accBytes++;
                    if (contBytes === 0) {
                        // Check for overlong encoding, but support Modified UTF-8 (encoding NULL as C0 80)
                        if (accBytes === 2 && acc < 0x80 && acc > 0)
                            res += this.defaultCharUnicode;
                        else if (accBytes === 3 && acc < 0x800)
                            res += this.defaultCharUnicode;
                        else
                            // Actually add character.
                            res += String.fromCharCode(acc);
                    }
                } else { // Unexpected continuation byte
                    res += this.defaultCharUnicode;
                }
            }
        }
        this.acc = acc; this.contBytes = contBytes; this.accBytes = accBytes;
        return res;
    }
    
    InternalDecoderCesu8.prototype.end = function() {
        var res = 0;
        if (this.contBytes > 0)
            res += this.defaultCharUnicode;
        return res;
    }
    
    },{"safer-buffer":28,"string_decoder":7}],13:[function(require,module,exports){
    "use strict";
    var Buffer = require("safer-buffer").Buffer;
    
    // Single-byte codec. Needs a 'chars' string parameter that contains 256 or 128 chars that
    // correspond to encoded bytes (if 128 - then lower half is ASCII). 
    
    exports._sbcs = SBCSCodec;
    function SBCSCodec(codecOptions, iconv) {
        if (!codecOptions)
            throw new Error("SBCS codec is called without the data.")
        
        // Prepare char buffer for decoding.
        if (!codecOptions.chars || (codecOptions.chars.length !== 128 && codecOptions.chars.length !== 256))
            throw new Error("Encoding '"+codecOptions.type+"' has incorrect 'chars' (must be of len 128 or 256)");
        
        if (codecOptions.chars.length === 128) {
            var asciiString = "";
            for (var i = 0; i < 128; i++)
                asciiString += String.fromCharCode(i);
            codecOptions.chars = asciiString + codecOptions.chars;
        }
    
        this.decodeBuf = Buffer.from(codecOptions.chars, 'ucs2');
        
        // Encoding buffer.
        var encodeBuf = Buffer.alloc(65536, iconv.defaultCharSingleByte.charCodeAt(0));
    
        for (var i = 0; i < codecOptions.chars.length; i++)
            encodeBuf[codecOptions.chars.charCodeAt(i)] = i;
    
        this.encodeBuf = encodeBuf;
    }
    
    SBCSCodec.prototype.encoder = SBCSEncoder;
    SBCSCodec.prototype.decoder = SBCSDecoder;
    
    
    function SBCSEncoder(options, codec) {
        this.encodeBuf = codec.encodeBuf;
    }
    
    SBCSEncoder.prototype.write = function(str) {
        var buf = Buffer.alloc(str.length);
        for (var i = 0; i < str.length; i++)
            buf[i] = this.encodeBuf[str.charCodeAt(i)];
        
        return buf;
    }
    
    SBCSEncoder.prototype.end = function() {
    }
    
    
    function SBCSDecoder(options, codec) {
        this.decodeBuf = codec.decodeBuf;
    }
    
    SBCSDecoder.prototype.write = function(buf) {
        // Strings are immutable in JS -> we use ucs2 buffer to speed up computations.
        var decodeBuf = this.decodeBuf;
        var newBuf = Buffer.alloc(buf.length*2);
        var idx1 = 0, idx2 = 0;
        for (var i = 0; i < buf.length; i++) {
            idx1 = buf[i]*2; idx2 = i*2;
            newBuf[idx2] = decodeBuf[idx1];
            newBuf[idx2+1] = decodeBuf[idx1+1];
        }
        return newBuf.toString('ucs2');
    }
    
    SBCSDecoder.prototype.end = function() {
    }
    
    },{"safer-buffer":28}],14:[function(require,module,exports){
    "use strict";
    
    // Generated data for sbcs codec. Don't edit manually. Regenerate using generation/gen-sbcs.js script.
    module.exports = {
      "437": "cp437",
      "737": "cp737",
      "775": "cp775",
      "850": "cp850",
      "852": "cp852",
      "855": "cp855",
      "856": "cp856",
      "857": "cp857",
      "858": "cp858",
      "860": "cp860",
      "861": "cp861",
      "862": "cp862",
      "863": "cp863",
      "864": "cp864",
      "865": "cp865",
      "866": "cp866",
      "869": "cp869",
      "874": "windows874",
      "922": "cp922",
      "1046": "cp1046",
      "1124": "cp1124",
      "1125": "cp1125",
      "1129": "cp1129",
      "1133": "cp1133",
      "1161": "cp1161",
      "1162": "cp1162",
      "1163": "cp1163",
      "1250": "windows1250",
      "1251": "windows1251",
      "1252": "windows1252",
      "1253": "windows1253",
      "1254": "windows1254",
      "1255": "windows1255",
      "1256": "windows1256",
      "1257": "windows1257",
      "1258": "windows1258",
      "28591": "iso88591",
      "28592": "iso88592",
      "28593": "iso88593",
      "28594": "iso88594",
      "28595": "iso88595",
      "28596": "iso88596",
      "28597": "iso88597",
      "28598": "iso88598",
      "28599": "iso88599",
      "28600": "iso885910",
      "28601": "iso885911",
      "28603": "iso885913",
      "28604": "iso885914",
      "28605": "iso885915",
      "28606": "iso885916",
      "windows874": {
        "type": "_sbcs",
        "chars": "в‚¬пїЅпїЅпїЅпїЅвЂ¦пїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅвЂвЂ™вЂњвЂќвЂўвЂ“вЂ”пїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅВ аёЃаё‚аёѓаё„аё…аё†аё‡аё€аё‰аёЉаё‹аёЊаёЌаёЋаёЏаёђаё‘аё’аё“аё”аё•аё–аё—аёаё™аёљаё›аёњаёќаёћаёџаё аёЎаёўаёЈаё¤аёҐаё¦аё§аёЁаё©аёЄаё«аё¬аё­аё®аёЇаё°аё±аёІаёіаёґаёµаё¶аё·аёёаё№аёєпїЅпїЅпїЅпїЅаёїа№Ђа№Ѓа№‚а№ѓа№„а№…а№†а№‡а№€а№‰а№Ља№‹а№Ња№Ќа№Ћа№Џа№ђа№‘а№’а№“а№”а№•а№–а№—а№а№™а№ља№›пїЅпїЅпїЅпїЅ"
      },
      "win874": "windows874",
      "cp874": "windows874",
      "windows1250": {
        "type": "_sbcs",
        "chars": "в‚¬пїЅвЂљпїЅвЂћвЂ¦вЂ вЂЎпїЅвЂ°Е вЂ№ЕљЕ¤ЕЅЕ№пїЅвЂвЂ™вЂњвЂќвЂўвЂ“вЂ”пїЅв„ўЕЎвЂєЕ›ЕҐЕѕЕєВ Л‡ЛЕЃВ¤Д„В¦В§ВЁВ©ЕћВ«В¬В­В®Е»В°В±Л›Е‚ВґВµВ¶В·ВёД…ЕџВ»ДЅЛќДѕЕјЕ”ГЃГ‚Д‚Г„Д№Д†Г‡ДЊГ‰ДГ‹ДљГЌГЋДЋДђЕѓЕ‡Г“Г”ЕђГ–Г—ЕЕ®ГљЕ°ГњГќЕўГџЕ•ГЎГўДѓГ¤ДєД‡Г§ДЌГ©Д™Г«Д›Г­Г®ДЏД‘Е„Е€ГіГґЕ‘Г¶Г·Е™ЕЇГєЕ±ГјГЅЕЈЛ™"
      },
      "win1250": "windows1250",
      "cp1250": "windows1250",
      "windows1251": {
        "type": "_sbcs",
        "chars": "Р‚РѓвЂљС“вЂћвЂ¦вЂ вЂЎв‚¬вЂ°Р‰вЂ№РЉРЊР‹РЏС’вЂвЂ™вЂњвЂќвЂўвЂ“вЂ”пїЅв„ўС™вЂєСљСњС›СџВ РЋСћР€В¤ТђВ¦В§РЃВ©Р„В«В¬В­В®Р‡В°В±Р†С–Т‘ВµВ¶В·С‘в„–С”В»СР…С•С—РђР‘Р’Р“Р”Р•Р–Р—РР™РљР›РњРќРћРџР РЎРўРЈР¤РҐР¦Р§РЁР©РЄР«Р¬Р­Р®РЇР°Р±РІРіРґРµР¶Р·РёР№РєР»РјРЅРѕРїСЂСЃС‚СѓС„С…С†С‡С€С‰СЉС‹СЊСЌСЋСЏ"
      },
      "win1251": "windows1251",
      "cp1251": "windows1251",
      "windows1252": {
        "type": "_sbcs",
        "chars": "в‚¬пїЅвЂљЖ’вЂћвЂ¦вЂ вЂЎЛ†вЂ°Е вЂ№Е’пїЅЕЅпїЅпїЅвЂвЂ™вЂњвЂќвЂўвЂ“вЂ”Лњв„ўЕЎвЂєЕ“пїЅЕѕЕёВ ВЎВўВЈВ¤ВҐВ¦В§ВЁВ©ВЄВ«В¬В­В®ВЇВ°В±ВІВіВґВµВ¶В·ВёВ№ВєВ»ВјВЅВѕВїГЂГЃГ‚ГѓГ„Г…Г†Г‡Г€Г‰ГЉГ‹ГЊГЌГЋГЏГђГ‘Г’Г“Г”Г•Г–Г—ГГ™ГљГ›ГњГќГћГџГ ГЎГўГЈГ¤ГҐГ¦Г§ГЁГ©ГЄГ«Г¬Г­Г®ГЇГ°Г±ГІГіГґГµГ¶Г·ГёГ№ГєГ»ГјГЅГѕГї"
      },
      "win1252": "windows1252",
      "cp1252": "windows1252",
      "windows1253": {
        "type": "_sbcs",
        "chars": "в‚¬пїЅвЂљЖ’вЂћвЂ¦вЂ вЂЎпїЅвЂ°пїЅвЂ№пїЅпїЅпїЅпїЅпїЅвЂвЂ™вЂњвЂќвЂўвЂ“вЂ”пїЅв„ўпїЅвЂєпїЅпїЅпїЅпїЅВ О…О†ВЈВ¤ВҐВ¦В§ВЁВ©пїЅВ«В¬В­В®вЂ•В°В±ВІВіО„ВµВ¶В·О€О‰ОЉВ»ОЊВЅОЋОЏОђО‘О’О“О”О•О–О—ОО™ОљО›ОњОќОћОџО ОЎпїЅОЈО¤ОҐО¦О§ОЁО©ОЄО«О¬О­О®ОЇО°О±ОІОіОґОµО¶О·ОёО№ОєО»ОјОЅОѕОїПЂПЃП‚ПѓП„П…П†П‡П€П‰ПЉП‹ПЊПЌПЋпїЅ"
      },
      "win1253": "windows1253",
      "cp1253": "windows1253",
      "windows1254": {
        "type": "_sbcs",
        "chars": "в‚¬пїЅвЂљЖ’вЂћвЂ¦вЂ вЂЎЛ†вЂ°Е вЂ№Е’пїЅпїЅпїЅпїЅвЂвЂ™вЂњвЂќвЂўвЂ“вЂ”Лњв„ўЕЎвЂєЕ“пїЅпїЅЕёВ ВЎВўВЈВ¤ВҐВ¦В§ВЁВ©ВЄВ«В¬В­В®ВЇВ°В±ВІВіВґВµВ¶В·ВёВ№ВєВ»ВјВЅВѕВїГЂГЃГ‚ГѓГ„Г…Г†Г‡Г€Г‰ГЉГ‹ГЊГЌГЋГЏДћГ‘Г’Г“Г”Г•Г–Г—ГГ™ГљГ›ГњД°ЕћГџГ ГЎГўГЈГ¤ГҐГ¦Г§ГЁГ©ГЄГ«Г¬Г­Г®ГЇДџГ±ГІГіГґГµГ¶Г·ГёГ№ГєГ»ГјД±ЕџГї"
      },
      "win1254": "windows1254",
      "cp1254": "windows1254",
      "windows1255": {
        "type": "_sbcs",
        "chars": "в‚¬пїЅвЂљЖ’вЂћвЂ¦вЂ вЂЎЛ†вЂ°пїЅвЂ№пїЅпїЅпїЅпїЅпїЅвЂвЂ™вЂњвЂќвЂўвЂ“вЂ”Лњв„ўпїЅвЂєпїЅпїЅпїЅпїЅВ ВЎВўВЈв‚ЄВҐВ¦В§ВЁВ©Г—В«В¬В­В®ВЇВ°В±ВІВіВґВµВ¶В·ВёВ№Г·В»ВјВЅВѕВїЦ°Ц±ЦІЦіЦґЦµЦ¶Ц·ЦёЦ№ЦєЦ»ЦјЦЅЦѕЦїЧЂЧЃЧ‚ЧѓЧ°Ч±ЧІЧіЧґпїЅпїЅпїЅпїЅпїЅпїЅпїЅЧђЧ‘Ч’Ч“Ч”Ч•Ч–Ч—ЧЧ™ЧљЧ›ЧњЧќЧћЧџЧ ЧЎЧўЧЈЧ¤ЧҐЧ¦Ч§ЧЁЧ©ЧЄпїЅпїЅвЂЋвЂЏпїЅ"
      },
      "win1255": "windows1255",
      "cp1255": "windows1255",
      "windows1256": {
        "type": "_sbcs",
        "chars": "в‚¬ЩѕвЂљЖ’вЂћвЂ¦вЂ вЂЎЛ†вЂ°Щ№вЂ№Е’Ъ†ЪЪ€ЪЇвЂвЂ™вЂњвЂќвЂўвЂ“вЂ”Ъ©в„ўЪ‘вЂєЕ“вЂЊвЂЌЪєВ ШЊВўВЈВ¤ВҐВ¦В§ВЁВ©ЪѕВ«В¬В­В®ВЇВ°В±ВІВіВґВµВ¶В·ВёВ№Ш›В»ВјВЅВѕШџЫЃШЎШўШЈШ¤ШҐШ¦Ш§ШЁШ©ШЄШ«Ш¬Ш­Ш®ШЇШ°Ш±ШІШіШґШµШ¶Г—Ш·ШёШ№ШєЩЂЩЃЩ‚ЩѓГ Щ„ГўЩ…Щ†Щ‡Щ€Г§ГЁГ©ГЄГ«Щ‰ЩЉГ®ГЇЩ‹ЩЊЩЌЩЋГґЩЏЩђГ·Щ‘Г№Щ’Г»ГјвЂЋвЂЏЫ’"
      },
      "win1256": "windows1256",
      "cp1256": "windows1256",
      "windows1257": {
        "type": "_sbcs",
        "chars": "в‚¬пїЅвЂљпїЅвЂћвЂ¦вЂ вЂЎпїЅвЂ°пїЅвЂ№пїЅВЁЛ‡ВёпїЅвЂвЂ™вЂњвЂќвЂўвЂ“вЂ”пїЅв„ўпїЅвЂєпїЅВЇЛ›пїЅВ пїЅВўВЈВ¤пїЅВ¦В§ГВ©Е–В«В¬В­В®Г†В°В±ВІВіВґВµВ¶В·ГёВ№Е—В»ВјВЅВѕГ¦Д„Д®ДЂД†Г„Г…ДД’ДЊГ‰Е№Д–ДўД¶ДЄД»Е ЕѓЕ…Г“ЕЊГ•Г–Г—ЕІЕЃЕљЕЄГњЕ»ЕЅГџД…ДЇДЃД‡Г¤ГҐД™Д“ДЌГ©ЕєД—ДЈД·Д«ДјЕЎЕ„Е†ГіЕЌГµГ¶Г·ЕіЕ‚Е›Е«ГјЕјЕѕЛ™"
      },
      "win1257": "windows1257",
      "cp1257": "windows1257",
      "windows1258": {
        "type": "_sbcs",
        "chars": "в‚¬пїЅвЂљЖ’вЂћвЂ¦вЂ вЂЎЛ†вЂ°пїЅвЂ№Е’пїЅпїЅпїЅпїЅвЂвЂ™вЂњвЂќвЂўвЂ“вЂ”Лњв„ўпїЅвЂєЕ“пїЅпїЅЕёВ ВЎВўВЈВ¤ВҐВ¦В§ВЁВ©ВЄВ«В¬В­В®ВЇВ°В±ВІВіВґВµВ¶В·ВёВ№ВєВ»ВјВЅВѕВїГЂГЃГ‚Д‚Г„Г…Г†Г‡Г€Г‰ГЉГ‹МЂГЌГЋГЏДђГ‘М‰Г“Г”Ж Г–Г—ГГ™ГљГ›ГњЖЇМѓГџГ ГЎГўДѓГ¤ГҐГ¦Г§ГЁГ©ГЄГ«МЃГ­Г®ГЇД‘Г±МЈГіГґЖЎГ¶Г·ГёГ№ГєГ»ГјЖ°в‚«Гї"
      },
      "win1258": "windows1258",
      "cp1258": "windows1258",
      "iso88591": {
        "type": "_sbcs",
        "chars": "ВЂВЃВ‚ВѓВ„В…В†В‡В€В‰ВЉВ‹ВЊВЌВЋВЏВђВ‘В’В“В”В•В–В—ВВ™ВљВ›ВњВќВћВџВ ВЎВўВЈВ¤ВҐВ¦В§ВЁВ©ВЄВ«В¬В­В®ВЇВ°В±ВІВіВґВµВ¶В·ВёВ№ВєВ»ВјВЅВѕВїГЂГЃГ‚ГѓГ„Г…Г†Г‡Г€Г‰ГЉГ‹ГЊГЌГЋГЏГђГ‘Г’Г“Г”Г•Г–Г—ГГ™ГљГ›ГњГќГћГџГ ГЎГўГЈГ¤ГҐГ¦Г§ГЁГ©ГЄГ«Г¬Г­Г®ГЇГ°Г±ГІГіГґГµГ¶Г·ГёГ№ГєГ»ГјГЅГѕГї"
      },
      "cp28591": "iso88591",
      "iso88592": {
        "type": "_sbcs",
        "chars": "ВЂВЃВ‚ВѓВ„В…В†В‡В€В‰ВЉВ‹ВЊВЌВЋВЏВђВ‘В’В“В”В•В–В—ВВ™ВљВ›ВњВќВћВџВ Д„ЛЕЃВ¤ДЅЕљВ§ВЁЕ ЕћЕ¤Е№В­ЕЅЕ»В°Д…Л›Е‚ВґДѕЕ›Л‡ВёЕЎЕџЕҐЕєЛќЕѕЕјЕ”ГЃГ‚Д‚Г„Д№Д†Г‡ДЊГ‰ДГ‹ДљГЌГЋДЋДђЕѓЕ‡Г“Г”ЕђГ–Г—ЕЕ®ГљЕ°ГњГќЕўГџЕ•ГЎГўДѓГ¤ДєД‡Г§ДЌГ©Д™Г«Д›Г­Г®ДЏД‘Е„Е€ГіГґЕ‘Г¶Г·Е™ЕЇГєЕ±ГјГЅЕЈЛ™"
      },
      "cp28592": "iso88592",
      "iso88593": {
        "type": "_sbcs",
        "chars": "ВЂВЃВ‚ВѓВ„В…В†В‡В€В‰ВЉВ‹ВЊВЌВЋВЏВђВ‘В’В“В”В•В–В—ВВ™ВљВ›ВњВќВћВџВ Д¦ЛВЈВ¤пїЅД¤В§ВЁД°ЕћДћДґВ­пїЅЕ»В°Д§ВІВіВґВµДҐВ·ВёД±ЕџДџДµВЅпїЅЕјГЂГЃГ‚пїЅГ„ДЉД€Г‡Г€Г‰ГЉГ‹ГЊГЌГЋГЏпїЅГ‘Г’Г“Г”Д Г–Г—ДњГ™ГљГ›ГњЕ¬ЕњГџГ ГЎГўпїЅГ¤Д‹Д‰Г§ГЁГ©ГЄГ«Г¬Г­Г®ГЇпїЅГ±ГІГіГґДЎГ¶Г·ДќГ№ГєГ»ГјЕ­ЕќЛ™"
      },
      "cp28593": "iso88593",
      "iso88594": {
        "type": "_sbcs",
        "chars": "ВЂВЃВ‚ВѓВ„В…В†В‡В€В‰ВЉВ‹ВЊВЌВЋВЏВђВ‘В’В“В”В•В–В—ВВ™ВљВ›ВњВќВћВџВ Д„ДёЕ–В¤ДЁД»В§ВЁЕ Д’ДўЕ¦В­ЕЅВЇВ°Д…Л›Е—ВґД©ДјЛ‡ВёЕЎД“ДЈЕ§ЕЉЕѕЕ‹ДЂГЃГ‚ГѓГ„Г…Г†Д®ДЊГ‰ДГ‹Д–ГЌГЋДЄДђЕ…ЕЊД¶Г”Г•Г–Г—ГЕІГљГ›ГњЕЁЕЄГџДЃГЎГўГЈГ¤ГҐГ¦ДЇДЌГ©Д™Г«Д—Г­Г®Д«Д‘Е†ЕЌД·ГґГµГ¶Г·ГёЕіГєГ»ГјЕ©Е«Л™"
      },
      "cp28594": "iso88594",
      "iso88595": {
        "type": "_sbcs",
        "chars": "ВЂВЃВ‚ВѓВ„В…В†В‡В€В‰ВЉВ‹ВЊВЌВЋВЏВђВ‘В’В“В”В•В–В—ВВ™ВљВ›ВњВќВћВџВ РЃР‚РѓР„Р…Р†Р‡Р€Р‰РЉР‹РЊВ­РЋРЏРђР‘Р’Р“Р”Р•Р–Р—РР™РљР›РњРќРћРџР РЎРўРЈР¤РҐР¦Р§РЁР©РЄР«Р¬Р­Р®РЇР°Р±РІРіРґРµР¶Р·РёР№РєР»РјРЅРѕРїСЂСЃС‚СѓС„С…С†С‡С€С‰СЉС‹СЊСЌСЋСЏв„–С‘С’С“С”С•С–С—СС™СљС›СњВ§СћСџ"
      },
      "cp28595": "iso88595",
      "iso88596": {
        "type": "_sbcs",
        "chars": "ВЂВЃВ‚ВѓВ„В…В†В‡В€В‰ВЉВ‹ВЊВЌВЋВЏВђВ‘В’В“В”В•В–В—ВВ™ВљВ›ВњВќВћВџВ пїЅпїЅпїЅВ¤пїЅпїЅпїЅпїЅпїЅпїЅпїЅШЊВ­пїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅШ›пїЅпїЅпїЅШџпїЅШЎШўШЈШ¤ШҐШ¦Ш§ШЁШ©ШЄШ«Ш¬Ш­Ш®ШЇШ°Ш±ШІШіШґШµШ¶Ш·ШёШ№ШєпїЅпїЅпїЅпїЅпїЅЩЂЩЃЩ‚ЩѓЩ„Щ…Щ†Щ‡Щ€Щ‰ЩЉЩ‹ЩЊЩЌЩЋЩЏЩђЩ‘Щ’пїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅ"
      },
      "cp28596": "iso88596",
      "iso88597": {
        "type": "_sbcs",
        "chars": "ВЂВЃВ‚ВѓВ„В…В†В‡В€В‰ВЉВ‹ВЊВЌВЋВЏВђВ‘В’В“В”В•В–В—ВВ™ВљВ›ВњВќВћВџВ вЂвЂ™ВЈв‚¬в‚ЇВ¦В§ВЁВ©НєВ«В¬В­пїЅвЂ•В°В±ВІВіО„О…О†В·О€О‰ОЉВ»ОЊВЅОЋОЏОђО‘О’О“О”О•О–О—ОО™ОљО›ОњОќОћОџО ОЎпїЅОЈО¤ОҐО¦О§ОЁО©ОЄО«О¬О­О®ОЇО°О±ОІОіОґОµО¶О·ОёО№ОєО»ОјОЅОѕОїПЂПЃП‚ПѓП„П…П†П‡П€П‰ПЉП‹ПЊПЌПЋпїЅ"
      },
      "cp28597": "iso88597",
      "iso88598": {
        "type": "_sbcs",
        "chars": "ВЂВЃВ‚ВѓВ„В…В†В‡В€В‰ВЉВ‹ВЊВЌВЋВЏВђВ‘В’В“В”В•В–В—ВВ™ВљВ›ВњВќВћВџВ пїЅВўВЈВ¤ВҐВ¦В§ВЁВ©Г—В«В¬В­В®ВЇВ°В±ВІВіВґВµВ¶В·ВёВ№Г·В»ВјВЅВѕпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅвЂ—ЧђЧ‘Ч’Ч“Ч”Ч•Ч–Ч—ЧЧ™ЧљЧ›ЧњЧќЧћЧџЧ ЧЎЧўЧЈЧ¤ЧҐЧ¦Ч§ЧЁЧ©ЧЄпїЅпїЅвЂЋвЂЏпїЅ"
      },
      "cp28598": "iso88598",
      "iso88599": {
        "type": "_sbcs",
        "chars": "ВЂВЃВ‚ВѓВ„В…В†В‡В€В‰ВЉВ‹ВЊВЌВЋВЏВђВ‘В’В“В”В•В–В—ВВ™ВљВ›ВњВќВћВџВ ВЎВўВЈВ¤ВҐВ¦В§ВЁВ©ВЄВ«В¬В­В®ВЇВ°В±ВІВіВґВµВ¶В·ВёВ№ВєВ»ВјВЅВѕВїГЂГЃГ‚ГѓГ„Г…Г†Г‡Г€Г‰ГЉГ‹ГЊГЌГЋГЏДћГ‘Г’Г“Г”Г•Г–Г—ГГ™ГљГ›ГњД°ЕћГџГ ГЎГўГЈГ¤ГҐГ¦Г§ГЁГ©ГЄГ«Г¬Г­Г®ГЇДџГ±ГІГіГґГµГ¶Г·ГёГ№ГєГ»ГјД±ЕџГї"
      },
      "cp28599": "iso88599",
      "iso885910": {
        "type": "_sbcs",
        "chars": "ВЂВЃВ‚ВѓВ„В…В†В‡В€В‰ВЉВ‹ВЊВЌВЋВЏВђВ‘В’В“В”В•В–В—ВВ™ВљВ›ВњВќВћВџВ Д„Д’ДўДЄДЁД¶В§Д»ДђЕ Е¦ЕЅВ­ЕЄЕЉВ°Д…Д“ДЈД«Д©Д·В·ДјД‘ЕЎЕ§ЕѕвЂ•Е«Е‹ДЂГЃГ‚ГѓГ„Г…Г†Д®ДЊГ‰ДГ‹Д–ГЌГЋГЏГђЕ…ЕЊГ“Г”Г•Г–ЕЁГЕІГљГ›ГњГќГћГџДЃГЎГўГЈГ¤ГҐГ¦ДЇДЌГ©Д™Г«Д—Г­Г®ГЇГ°Е†ЕЌГіГґГµГ¶Е©ГёЕіГєГ»ГјГЅГѕДё"
      },
      "cp28600": "iso885910",
      "iso885911": {
        "type": "_sbcs",
        "chars": "ВЂВЃВ‚ВѓВ„В…В†В‡В€В‰ВЉВ‹ВЊВЌВЋВЏВђВ‘В’В“В”В•В–В—ВВ™ВљВ›ВњВќВћВџВ аёЃаё‚аёѓаё„аё…аё†аё‡аё€аё‰аёЉаё‹аёЊаёЌаёЋаёЏаёђаё‘аё’аё“аё”аё•аё–аё—аёаё™аёљаё›аёњаёќаёћаёџаё аёЎаёўаёЈаё¤аёҐаё¦аё§аёЁаё©аёЄаё«аё¬аё­аё®аёЇаё°аё±аёІаёіаёґаёµаё¶аё·аёёаё№аёєпїЅпїЅпїЅпїЅаёїа№Ђа№Ѓа№‚а№ѓа№„а№…а№†а№‡а№€а№‰а№Ља№‹а№Ња№Ќа№Ћа№Џа№ђа№‘а№’а№“а№”а№•а№–а№—а№а№™а№ља№›пїЅпїЅпїЅпїЅ"
      },
      "cp28601": "iso885911",
      "iso885913": {
        "type": "_sbcs",
        "chars": "ВЂВЃВ‚ВѓВ„В…В†В‡В€В‰ВЉВ‹ВЊВЌВЋВЏВђВ‘В’В“В”В•В–В—ВВ™ВљВ›ВњВќВћВџВ вЂќВўВЈВ¤вЂћВ¦В§ГВ©Е–В«В¬В­В®Г†В°В±ВІВівЂњВµВ¶В·ГёВ№Е—В»ВјВЅВѕГ¦Д„Д®ДЂД†Г„Г…ДД’ДЊГ‰Е№Д–ДўД¶ДЄД»Е ЕѓЕ…Г“ЕЊГ•Г–Г—ЕІЕЃЕљЕЄГњЕ»ЕЅГџД…ДЇДЃД‡Г¤ГҐД™Д“ДЌГ©ЕєД—ДЈД·Д«ДјЕЎЕ„Е†ГіЕЌГµГ¶Г·ЕіЕ‚Е›Е«ГјЕјЕѕвЂ™"
      },
      "cp28603": "iso885913",
      "iso885914": {
        "type": "_sbcs",
        "chars": "ВЂВЃВ‚ВѓВ„В…В†В‡В€В‰ВЉВ‹ВЊВЌВЋВЏВђВ‘В’В“В”В•В–В—ВВ™ВљВ›ВњВќВћВџВ бё‚бёѓВЈДЉД‹бёЉВ§бєЂВ©бє‚бё‹б»ІВ­В®ЕёбёћбёџД ДЎб№Ђб№ЃВ¶б№–бєЃб№—бєѓб№ б»ібє„бє…б№ЎГЂГЃГ‚ГѓГ„Г…Г†Г‡Г€Г‰ГЉГ‹ГЊГЌГЋГЏЕґГ‘Г’Г“Г”Г•Г–б№ЄГГ™ГљГ›ГњГќЕ¶ГџГ ГЎГўГЈГ¤ГҐГ¦Г§ГЁГ©ГЄГ«Г¬Г­Г®ГЇЕµГ±ГІГіГґГµГ¶б№«ГёГ№ГєГ»ГјГЅЕ·Гї"
      },
      "cp28604": "iso885914",
      "iso885915": {
        "type": "_sbcs",
        "chars": "ВЂВЃВ‚ВѓВ„В…В†В‡В€В‰ВЉВ‹ВЊВЌВЋВЏВђВ‘В’В“В”В•В–В—ВВ™ВљВ›ВњВќВћВџВ ВЎВўВЈв‚¬ВҐЕ В§ЕЎВ©ВЄВ«В¬В­В®ВЇВ°В±ВІВіЕЅВµВ¶В·ЕѕВ№ВєВ»Е’Е“ЕёВїГЂГЃГ‚ГѓГ„Г…Г†Г‡Г€Г‰ГЉГ‹ГЊГЌГЋГЏГђГ‘Г’Г“Г”Г•Г–Г—ГГ™ГљГ›ГњГќГћГџГ ГЎГўГЈГ¤ГҐГ¦Г§ГЁГ©ГЄГ«Г¬Г­Г®ГЇГ°Г±ГІГіГґГµГ¶Г·ГёГ№ГєГ»ГјГЅГѕГї"
      },
      "cp28605": "iso885915",
      "iso885916": {
        "type": "_sbcs",
        "chars": "ВЂВЃВ‚ВѓВ„В…В†В‡В€В‰ВЉВ‹ВЊВЌВЋВЏВђВ‘В’В“В”В•В–В—ВВ™ВљВ›ВњВќВћВџВ Д„Д…ЕЃв‚¬вЂћЕ В§ЕЎВ©ИВ«Е№В­ЕєЕ»В°В±ДЊЕ‚ЕЅвЂќВ¶В·ЕѕДЌИ™В»Е’Е“ЕёЕјГЂГЃГ‚Д‚Г„Д†Г†Г‡Г€Г‰ГЉГ‹ГЊГЌГЋГЏДђЕѓГ’Г“Г”ЕђГ–ЕљЕ°Г™ГљГ›ГњДИљГџГ ГЎГўДѓГ¤Д‡Г¦Г§ГЁГ©ГЄГ«Г¬Г­Г®ГЇД‘Е„ГІГіГґЕ‘Г¶Е›Е±Г№ГєГ»ГјД™И›Гї"
      },
      "cp28606": "iso885916",
      "cp437": {
        "type": "_sbcs",
        "chars": "Г‡ГјГ©ГўГ¤Г ГҐГ§ГЄГ«ГЁГЇГ®Г¬Г„Г…Г‰Г¦Г†ГґГ¶ГІГ»Г№ГїГ–ГњВўВЈВҐв‚§Ж’ГЎГ­ГіГєГ±Г‘ВЄВєВївЊђВ¬ВЅВјВЎВ«В»в–‘в–’в–“в”‚в”¤в•Ўв•ўв•–в••в•Јв•‘в•—в•ќв•њв•›в”ђв””в”ґв”¬в”њв”Ђв”јв•ћв•џв•љв•”в•©в•¦в• в•ђв•¬в•§в•Ёв•¤в•Ґв•™в•в•’в•“в•«в•Єв”в”Њв–€в–„в–Њв–ђв–ЂО±ГџО“ПЂОЈПѓВµП„О¦ОО©Оґв€ћП†Оµв€©в‰ЎВ±в‰Ґв‰¤вЊ вЊЎГ·в‰€В°в€™В·в€љвЃїВІв– В "
      },
      "ibm437": "cp437",
      "csibm437": "cp437",
      "cp737": {
        "type": "_sbcs",
        "chars": "О‘О’О“О”О•О–О—ОО™ОљО›ОњОќОћОџО ОЎОЈО¤ОҐО¦О§ОЁО©О±ОІОіОґОµО¶О·ОёО№ОєО»ОјОЅОѕОїПЂПЃПѓП‚П„П…П†П‡П€в–‘в–’в–“в”‚в”¤в•Ўв•ўв•–в••в•Јв•‘в•—в•ќв•њв•›в”ђв””в”ґв”¬в”њв”Ђв”јв•ћв•џв•љв•”в•©в•¦в• в•ђв•¬в•§в•Ёв•¤в•Ґв•™в•в•’в•“в•«в•Єв”в”Њв–€в–„в–Њв–ђв–ЂП‰О¬О­О®ПЉОЇПЊПЌП‹ПЋО†О€О‰ОЉОЊОЋОЏВ±в‰Ґв‰¤ОЄО«Г·в‰€В°в€™В·в€љвЃїВІв– В "
      },
      "ibm737": "cp737",
      "csibm737": "cp737",
      "cp775": {
        "type": "_sbcs",
        "chars": "Д†ГјГ©ДЃГ¤ДЈГҐД‡Е‚Д“Е–Е—Д«Е№Г„Г…Г‰Г¦Г†ЕЌГ¶ДўВўЕљЕ›Г–ГњГёВЈГГ—В¤ДЂДЄГіЕ»ЕјЕєвЂќВ¦В©В®В¬ВЅВјЕЃВ«В»в–‘в–’в–“в”‚в”¤Д„ДЊДД–в•Јв•‘в•—в•ќД®Е в”ђв””в”ґв”¬в”њв”Ђв”јЕІЕЄв•љв•”в•©в•¦в• в•ђв•¬ЕЅД…ДЌД™Д—ДЇЕЎЕіЕ«Еѕв”в”Њв–€в–„в–Њв–ђв–ЂГ“ГџЕЊЕѓГµГ•ВµЕ„Д¶Д·Д»ДјЕ†Д’Е…вЂ™В­В±вЂњВѕВ¶В§Г·вЂћВ°в€™В·В№ВіВІв– В "
      },
      "ibm775": "cp775",
      "csibm775": "cp775",
      "cp850": {
        "type": "_sbcs",
        "chars": "Г‡ГјГ©ГўГ¤Г ГҐГ§ГЄГ«ГЁГЇГ®Г¬Г„Г…Г‰Г¦Г†ГґГ¶ГІГ»Г№ГїГ–ГњГёВЈГГ—Ж’ГЎГ­ГіГєГ±Г‘ВЄВєВїВ®В¬ВЅВјВЎВ«В»в–‘в–’в–“в”‚в”¤ГЃГ‚ГЂВ©в•Јв•‘в•—в•ќВўВҐв”ђв””в”ґв”¬в”њв”Ђв”јГЈГѓв•љв•”в•©в•¦в• в•ђв•¬В¤Г°ГђГЉГ‹Г€Д±ГЌГЋГЏв”в”Њв–€в–„В¦ГЊв–ЂГ“ГџГ”Г’ГµГ•ВµГѕГћГљГ›Г™ГЅГќВЇВґВ­В±вЂ—ВѕВ¶В§Г·ВёВ°ВЁВ·В№ВіВІв– В "
      },
      "ibm850": "cp850",
      "csibm850": "cp850",
      "cp852": {
        "type": "_sbcs",
        "chars": "Г‡ГјГ©ГўГ¤ЕЇД‡Г§Е‚Г«ЕђЕ‘Г®Е№Г„Д†Г‰Д№ДєГґГ¶ДЅДѕЕљЕ›Г–ГњЕ¤ЕҐЕЃГ—ДЌГЎГ­ГіГєД„Д…ЕЅЕѕДД™В¬ЕєДЊЕџВ«В»в–‘в–’в–“в”‚в”¤ГЃГ‚ДљЕћв•Јв•‘в•—в•ќЕ»Ејв”ђв””в”ґв”¬в”њв”Ђв”јД‚Дѓв•љв•”в•©в•¦в• в•ђв•¬В¤Д‘ДђДЋГ‹ДЏЕ‡ГЌГЋД›в”в”Њв–€в–„ЕўЕ®в–ЂГ“ГџГ”ЕѓЕ„Е€Е ЕЎЕ”ГљЕ•Е°ГЅГќЕЈВґВ­ЛќЛ›Л‡ЛВ§Г·ВёВ°ВЁЛ™Е±ЕЕ™в– В "
      },
      "ibm852": "cp852",
      "csibm852": "cp852",
      "cp855": {
        "type": "_sbcs",
        "chars": "С’Р‚С“РѓС‘РЃС”Р„С•Р…С–Р†С—Р‡СР€С™Р‰СљРЉС›Р‹СњРЊСћРЋСџРЏСЋР®СЉРЄР°РђР±Р‘С†Р¦РґР”РµР•С„Р¤РіР“В«В»в–‘в–’в–“в”‚в”¤С…РҐРёРв•Јв•‘в•—в•ќР№Р™в”ђв””в”ґв”¬в”њв”Ђв”јРєРљв•љв•”в•©в•¦в• в•ђв•¬В¤Р»Р›РјРњРЅРќРѕРћРїв”в”Њв–€в–„РџСЏв–ЂРЇСЂР СЃРЎС‚РўСѓРЈР¶Р–РІР’СЊР¬в„–В­С‹Р«Р·Р—С€РЁСЌР­С‰Р©С‡Р§В§в– В "
      },
      "ibm855": "cp855",
      "csibm855": "cp855",
      "cp856": {
        "type": "_sbcs",
        "chars": "ЧђЧ‘Ч’Ч“Ч”Ч•Ч–Ч—ЧЧ™ЧљЧ›ЧњЧќЧћЧџЧ ЧЎЧўЧЈЧ¤ЧҐЧ¦Ч§ЧЁЧ©ЧЄпїЅВЈпїЅГ—пїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅВ®В¬ВЅВјпїЅВ«В»в–‘в–’в–“в”‚в”¤пїЅпїЅпїЅВ©в•Јв•‘в•—в•ќВўВҐв”ђв””в”ґв”¬в”њв”Ђв”јпїЅпїЅв•љв•”в•©в•¦в• в•ђв•¬В¤пїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅв”в”Њв–€в–„В¦пїЅв–ЂпїЅпїЅпїЅпїЅпїЅпїЅВµпїЅпїЅпїЅпїЅпїЅпїЅпїЅВЇВґВ­В±вЂ—ВѕВ¶В§Г·ВёВ°ВЁВ·В№ВіВІв– В "
      },
      "ibm856": "cp856",
      "csibm856": "cp856",
      "cp857": {
        "type": "_sbcs",
        "chars": "Г‡ГјГ©ГўГ¤Г ГҐГ§ГЄГ«ГЁГЇГ®Д±Г„Г…Г‰Г¦Г†ГґГ¶ГІГ»Г№Д°Г–ГњГёВЈГЕћЕџГЎГ­ГіГєГ±Г‘ДћДџВїВ®В¬ВЅВјВЎВ«В»в–‘в–’в–“в”‚в”¤ГЃГ‚ГЂВ©в•Јв•‘в•—в•ќВўВҐв”ђв””в”ґв”¬в”њв”Ђв”јГЈГѓв•љв•”в•©в•¦в• в•ђв•¬В¤ВєВЄГЉГ‹Г€пїЅГЌГЋГЏв”в”Њв–€в–„В¦ГЊв–ЂГ“ГџГ”Г’ГµГ•ВµпїЅГ—ГљГ›Г™Г¬ГїВЇВґВ­В±пїЅВѕВ¶В§Г·ВёВ°ВЁВ·В№ВіВІв– В "
      },
      "ibm857": "cp857",
      "csibm857": "cp857",
      "cp858": {
        "type": "_sbcs",
        "chars": "Г‡ГјГ©ГўГ¤Г ГҐГ§ГЄГ«ГЁГЇГ®Г¬Г„Г…Г‰Г¦Г†ГґГ¶ГІГ»Г№ГїГ–ГњГёВЈГГ—Ж’ГЎГ­ГіГєГ±Г‘ВЄВєВїВ®В¬ВЅВјВЎВ«В»в–‘в–’в–“в”‚в”¤ГЃГ‚ГЂВ©в•Јв•‘в•—в•ќВўВҐв”ђв””в”ґв”¬в”њв”Ђв”јГЈГѓв•љв•”в•©в•¦в• в•ђв•¬В¤Г°ГђГЉГ‹Г€в‚¬ГЌГЋГЏв”в”Њв–€в–„В¦ГЊв–ЂГ“ГџГ”Г’ГµГ•ВµГѕГћГљГ›Г™ГЅГќВЇВґВ­В±вЂ—ВѕВ¶В§Г·ВёВ°ВЁВ·В№ВіВІв– В "
      },
      "ibm858": "cp858",
      "csibm858": "cp858",
      "cp860": {
        "type": "_sbcs",
        "chars": "Г‡ГјГ©ГўГЈГ ГЃГ§ГЄГЉГЁГЌГ”Г¬ГѓГ‚Г‰ГЂГ€ГґГµГІГљГ№ГЊГ•ГњВўВЈГ™в‚§Г“ГЎГ­ГіГєГ±Г‘ВЄВєВїГ’В¬ВЅВјВЎВ«В»в–‘в–’в–“в”‚в”¤в•Ўв•ўв•–в••в•Јв•‘в•—в•ќв•њв•›в”ђв””в”ґв”¬в”њв”Ђв”јв•ћв•џв•љв•”в•©в•¦в• в•ђв•¬в•§в•Ёв•¤в•Ґв•™в•в•’в•“в•«в•Єв”в”Њв–€в–„в–Њв–ђв–ЂО±ГџО“ПЂОЈПѓВµП„О¦ОО©Оґв€ћП†Оµв€©в‰ЎВ±в‰Ґв‰¤вЊ вЊЎГ·в‰€В°в€™В·в€љвЃїВІв– В "
      },
      "ibm860": "cp860",
      "csibm860": "cp860",
      "cp861": {
        "type": "_sbcs",
        "chars": "Г‡ГјГ©ГўГ¤Г ГҐГ§ГЄГ«ГЁГђГ°ГћГ„Г…Г‰Г¦Г†ГґГ¶ГѕГ»ГќГЅГ–ГњГёВЈГв‚§Ж’ГЎГ­ГіГєГЃГЌГ“ГљВївЊђВ¬ВЅВјВЎВ«В»в–‘в–’в–“в”‚в”¤в•Ўв•ўв•–в••в•Јв•‘в•—в•ќв•њв•›в”ђв””в”ґв”¬в”њв”Ђв”јв•ћв•џв•љв•”в•©в•¦в• в•ђв•¬в•§в•Ёв•¤в•Ґв•™в•в•’в•“в•«в•Єв”в”Њв–€в–„в–Њв–ђв–ЂО±ГџО“ПЂОЈПѓВµП„О¦ОО©Оґв€ћП†Оµв€©в‰ЎВ±в‰Ґв‰¤вЊ вЊЎГ·в‰€В°в€™В·в€љвЃїВІв– В "
      },
      "ibm861": "cp861",
      "csibm861": "cp861",
      "cp862": {
        "type": "_sbcs",
        "chars": "ЧђЧ‘Ч’Ч“Ч”Ч•Ч–Ч—ЧЧ™ЧљЧ›ЧњЧќЧћЧџЧ ЧЎЧўЧЈЧ¤ЧҐЧ¦Ч§ЧЁЧ©ЧЄВўВЈВҐв‚§Ж’ГЎГ­ГіГєГ±Г‘ВЄВєВївЊђВ¬ВЅВјВЎВ«В»в–‘в–’в–“в”‚в”¤в•Ўв•ўв•–в••в•Јв•‘в•—в•ќв•њв•›в”ђв””в”ґв”¬в”њв”Ђв”јв•ћв•џв•љв•”в•©в•¦в• в•ђв•¬в•§в•Ёв•¤в•Ґв•™в•в•’в•“в•«в•Єв”в”Њв–€в–„в–Њв–ђв–ЂО±ГџО“ПЂОЈПѓВµП„О¦ОО©Оґв€ћП†Оµв€©в‰ЎВ±в‰Ґв‰¤вЊ вЊЎГ·в‰€В°в€™В·в€љвЃїВІв– В "
      },
      "ibm862": "cp862",
      "csibm862": "cp862",
      "cp863": {
        "type": "_sbcs",
        "chars": "Г‡ГјГ©ГўГ‚Г В¶Г§ГЄГ«ГЁГЇГ®вЂ—ГЂВ§Г‰Г€ГЉГґГ‹ГЏГ»Г№В¤Г”ГњВўВЈГ™Г›Ж’В¦ВґГіГєВЁВёВіВЇГЋвЊђВ¬ВЅВјВѕВ«В»в–‘в–’в–“в”‚в”¤в•Ўв•ўв•–в••в•Јв•‘в•—в•ќв•њв•›в”ђв””в”ґв”¬в”њв”Ђв”јв•ћв•џв•љв•”в•©в•¦в• в•ђв•¬в•§в•Ёв•¤в•Ґв•™в•в•’в•“в•«в•Єв”в”Њв–€в–„в–Њв–ђв–ЂО±ГџО“ПЂОЈПѓВµП„О¦ОО©Оґв€ћП†Оµв€©в‰ЎВ±в‰Ґв‰¤вЊ вЊЎГ·в‰€В°в€™В·в€љвЃїВІв– В "
      },
      "ibm863": "cp863",
      "csibm863": "cp863",
      "cp864": {
        "type": "_sbcs",
        "chars": "\u0000\u0001\u0002\u0003\u0004\u0005\u0006\u0007\b\t\n\u000b\f\r\u000e\u000f\u0010\u0011\u0012\u0013\u0014\u0015\u0016\u0017\u0018\u0019\u001a\u001b\u001c\u001d\u001e\u001f !\"#$ЩЄ&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~В°В·в€™в€љв–’в”Ђв”‚в”јв”¤в”¬в”њв”ґв”ђв”Њв””в”ОІв€ћП†В±ВЅВјв‰€В«В»п»·п»ёпїЅпїЅп»»п»јпїЅВ В­пє‚ВЈВ¤пє„пїЅпїЅпєЋпєЏпє•пє™ШЊпєќпєЎпєҐЩ ЩЎЩўЩЈЩ¤ЩҐЩ¦Щ§ЩЁЩ©п»‘Ш›пє±пєµпє№ШџВўпєЂпєЃпєѓпє…п»Љпє‹пєЌпє‘пє“пє—пє›пєџпєЈпє§пє©пє«пє­пєЇпєіпє·пє»пєїп»Ѓп»…п»‹п»ЏВ¦В¬Г·Г—п»‰ЩЂп»“п»—п»›п»џп»Јп»§п»«п»­п»Їп»іпєЅп»Њп»Ћп»Ќп»Ўп№ЅЩ‘п»Ґп»©п»¬п»°п»Іп»ђп»•п»µп»¶п»ќп»™п»±в– пїЅ"
      },
      "ibm864": "cp864",
      "csibm864": "cp864",
      "cp865": {
        "type": "_sbcs",
        "chars": "Г‡ГјГ©ГўГ¤Г ГҐГ§ГЄГ«ГЁГЇГ®Г¬Г„Г…Г‰Г¦Г†ГґГ¶ГІГ»Г№ГїГ–ГњГёВЈГв‚§Ж’ГЎГ­ГіГєГ±Г‘ВЄВєВївЊђВ¬ВЅВјВЎВ«В¤в–‘в–’в–“в”‚в”¤в•Ўв•ўв•–в••в•Јв•‘в•—в•ќв•њв•›в”ђв””в”ґв”¬в”њв”Ђв”јв•ћв•џв•љв•”в•©в•¦в• в•ђв•¬в•§в•Ёв•¤в•Ґв•™в•в•’в•“в•«в•Єв”в”Њв–€в–„в–Њв–ђв–ЂО±ГџО“ПЂОЈПѓВµП„О¦ОО©Оґв€ћП†Оµв€©в‰ЎВ±в‰Ґв‰¤вЊ вЊЎГ·в‰€В°в€™В·в€љвЃїВІв– В "
      },
      "ibm865": "cp865",
      "csibm865": "cp865",
      "cp866": {
        "type": "_sbcs",
        "chars": "РђР‘Р’Р“Р”Р•Р–Р—РР™РљР›РњРќРћРџР РЎРўРЈР¤РҐР¦Р§РЁР©РЄР«Р¬Р­Р®РЇР°Р±РІРіРґРµР¶Р·РёР№РєР»РјРЅРѕРїв–‘в–’в–“в”‚в”¤в•Ўв•ўв•–в••в•Јв•‘в•—в•ќв•њв•›в”ђв””в”ґв”¬в”њв”Ђв”јв•ћв•џв•љв•”в•©в•¦в• в•ђв•¬в•§в•Ёв•¤в•Ґв•™в•в•’в•“в•«в•Єв”в”Њв–€в–„в–Њв–ђв–ЂСЂСЃС‚СѓС„С…С†С‡С€С‰СЉС‹СЊСЌСЋСЏРЃС‘Р„С”Р‡С—РЋСћВ°в€™В·в€љв„–В¤в– В "
      },
      "ibm866": "cp866",
      "csibm866": "cp866",
      "cp869": {
        "type": "_sbcs",
        "chars": "пїЅпїЅпїЅпїЅпїЅпїЅО†пїЅВ·В¬В¦вЂвЂ™О€вЂ•О‰ОЉОЄОЊпїЅпїЅОЋО«В©ОЏВІВіО¬ВЈО­О®ОЇПЉОђПЊПЌО‘О’О“О”О•О–О—ВЅОО™В«В»в–‘в–’в–“в”‚в”¤ОљО›ОњОќв•Јв•‘в•—в•ќОћОџв”ђв””в”ґв”¬в”њв”Ђв”јО ОЎв•љв•”в•©в•¦в• в•ђв•¬ОЈО¤ОҐО¦О§ОЁО©О±ОІОів”в”Њв–€в–„ОґОµв–ЂО¶О·ОёО№ОєО»ОјОЅОѕОїПЂПЃПѓП‚П„О„В­В±П…П†П‡В§П€О…В°ВЁП‰П‹О°ПЋв– В "
      },
      "ibm869": "cp869",
      "csibm869": "cp869",
      "cp922": {
        "type": "_sbcs",
        "chars": "ВЂВЃВ‚ВѓВ„В…В†В‡В€В‰ВЉВ‹ВЊВЌВЋВЏВђВ‘В’В“В”В•В–В—ВВ™ВљВ›ВњВќВћВџВ ВЎВўВЈВ¤ВҐВ¦В§ВЁВ©ВЄВ«В¬В­В®вЂѕВ°В±ВІВіВґВµВ¶В·ВёВ№ВєВ»ВјВЅВѕВїГЂГЃГ‚ГѓГ„Г…Г†Г‡Г€Г‰ГЉГ‹ГЊГЌГЋГЏЕ Г‘Г’Г“Г”Г•Г–Г—ГГ™ГљГ›ГњГќЕЅГџГ ГЎГўГЈГ¤ГҐГ¦Г§ГЁГ©ГЄГ«Г¬Г­Г®ГЇЕЎГ±ГІГіГґГµГ¶Г·ГёГ№ГєГ»ГјГЅЕѕГї"
      },
      "ibm922": "cp922",
      "csibm922": "cp922",
      "cp1046": {
        "type": "_sbcs",
        "chars": "пє€Г—Г·пЈ¶пЈµпЈґпЈ·п№±В€в– в”‚в”Ђв”ђв”Њв””в”п№№п№»п№Ѕп№їп№·пєЉп»°п»іп»Іп»Ћп»Џп»ђп»¶п»ёп»єп»јВ пЈєпЈ№пЈёВ¤пЈ»пє‹пє‘пє—пє›пєџпєЈШЊВ­пє§пєіЩ ЩЎЩўЩЈЩ¤ЩҐЩ¦Щ§ЩЁЩ©пє·Ш›пє»пєїп»ЉШџп»‹ШЎШўШЈШ¤ШҐШ¦Ш§ШЁШ©ШЄШ«Ш¬Ш­Ш®ШЇШ°Ш±ШІШіШґШµШ¶Ш·п»‡Ш№Шєп»Њпє‚пє„пєЋп»“ЩЂЩЃЩ‚ЩѓЩ„Щ…Щ†Щ‡Щ€Щ‰ЩЉЩ‹ЩЊЩЌЩЋЩЏЩђЩ‘Щ’п»—п»›п»џпЈјп»µп»·п»№п»»п»Јп»§п»¬п»©пїЅ"
      },
      "ibm1046": "cp1046",
      "csibm1046": "cp1046",
      "cp1124": {
        "type": "_sbcs",
        "chars": "ВЂВЃВ‚ВѓВ„В…В†В‡В€В‰ВЉВ‹ВЊВЌВЋВЏВђВ‘В’В“В”В•В–В—ВВ™ВљВ›ВњВќВћВџВ РЃР‚ТђР„Р…Р†Р‡Р€Р‰РЉР‹РЊВ­РЋРЏРђР‘Р’Р“Р”Р•Р–Р—РР™РљР›РњРќРћРџР РЎРўРЈР¤РҐР¦Р§РЁР©РЄР«Р¬Р­Р®РЇР°Р±РІРіРґРµР¶Р·РёР№РєР»РјРЅРѕРїСЂСЃС‚СѓС„С…С†С‡С€С‰СЉС‹СЊСЌСЋСЏв„–С‘С’Т‘С”С•С–С—СС™СљС›СњВ§СћСџ"
      },
      "ibm1124": "cp1124",
      "csibm1124": "cp1124",
      "cp1125": {
        "type": "_sbcs",
        "chars": "РђР‘Р’Р“Р”Р•Р–Р—РР™РљР›РњРќРћРџР РЎРўРЈР¤РҐР¦Р§РЁР©РЄР«Р¬Р­Р®РЇР°Р±РІРіРґРµР¶Р·РёР№РєР»РјРЅРѕРїв–‘в–’в–“в”‚в”¤в•Ўв•ўв•–в••в•Јв•‘в•—в•ќв•њв•›в”ђв””в”ґв”¬в”њв”Ђв”јв•ћв•џв•љв•”в•©в•¦в• в•ђв•¬в•§в•Ёв•¤в•Ґв•™в•в•’в•“в•«в•Єв”в”Њв–€в–„в–Њв–ђв–ЂСЂСЃС‚СѓС„С…С†С‡С€С‰СЉС‹СЊСЌСЋСЏРЃС‘ТђТ‘Р„С”Р†С–Р‡С—В·в€љв„–В¤в– В "
      },
      "ibm1125": "cp1125",
      "csibm1125": "cp1125",
      "cp1129": {
        "type": "_sbcs",
        "chars": "ВЂВЃВ‚ВѓВ„В…В†В‡В€В‰ВЉВ‹ВЊВЌВЋВЏВђВ‘В’В“В”В•В–В—ВВ™ВљВ›ВњВќВћВџВ ВЎВўВЈВ¤ВҐВ¦В§Е“В©ВЄВ«В¬В­В®ВЇВ°В±ВІВіЕёВµВ¶В·Е’В№ВєВ»ВјВЅВѕВїГЂГЃГ‚Д‚Г„Г…Г†Г‡Г€Г‰ГЉГ‹МЂГЌГЋГЏДђГ‘М‰Г“Г”Ж Г–Г—ГГ™ГљГ›ГњЖЇМѓГџГ ГЎГўДѓГ¤ГҐГ¦Г§ГЁГ©ГЄГ«МЃГ­Г®ГЇД‘Г±МЈГіГґЖЎГ¶Г·ГёГ№ГєГ»ГјЖ°в‚«Гї"
      },
      "ibm1129": "cp1129",
      "csibm1129": "cp1129",
      "cp1133": {
        "type": "_sbcs",
        "chars": "ВЂВЃВ‚ВѓВ„В…В†В‡В€В‰ВЉВ‹ВЊВЌВЋВЏВђВ‘В’В“В”В•В–В—ВВ™ВљВ›ВњВќВћВџВ аєЃає‚ає„ає‡ає€аєЄаєЉаєЌає”ає•ає–ає—ає™аєљає›аєњаєќаєћаєџаєЎаєўаєЈаєҐає§ає«ає­ає®пїЅпїЅпїЅаєЇає°аєІаєіаєґаєµає¶ає·аєёає№аєјає±ає»аєЅпїЅпїЅпїЅа»Ђа»Ѓа»‚а»ѓа»„а»€а»‰а»Ља»‹а»Ња»Ќа»†пїЅа»ња»ќв‚­пїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅа»ђа»‘а»’а»“а»”а»•а»–а»—а»а»™пїЅпїЅВўВ¬В¦пїЅ"
      },
      "ibm1133": "cp1133",
      "csibm1133": "cp1133",
      "cp1161": {
        "type": "_sbcs",
        "chars": "пїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅа№€аёЃаё‚аёѓаё„аё…аё†аё‡аё€аё‰аёЉаё‹аёЊаёЌаёЋаёЏаёђаё‘аё’аё“аё”аё•аё–аё—аёаё™аёљаё›аёњаёќаёћаёџаё аёЎаёўаёЈаё¤аёҐаё¦аё§аёЁаё©аёЄаё«аё¬аё­аё®аёЇаё°аё±аёІаёіаёґаёµаё¶аё·аёёаё№аёєа№‰а№Ља№‹в‚¬аёїа№Ђа№Ѓа№‚а№ѓа№„а№…а№†а№‡а№€а№‰а№Ља№‹а№Ња№Ќа№Ћа№Џа№ђа№‘а№’а№“а№”а№•а№–а№—а№а№™а№ља№›ВўВ¬В¦В "
      },
      "ibm1161": "cp1161",
      "csibm1161": "cp1161",
      "cp1162": {
        "type": "_sbcs",
        "chars": "в‚¬ВЃВ‚ВѓВ„вЂ¦В†В‡В€В‰ВЉВ‹ВЊВЌВЋВЏВђвЂвЂ™вЂњвЂќвЂўвЂ“вЂ”ВВ™ВљВ›ВњВќВћВџВ аёЃаё‚аёѓаё„аё…аё†аё‡аё€аё‰аёЉаё‹аёЊаёЌаёЋаёЏаёђаё‘аё’аё“аё”аё•аё–аё—аёаё™аёљаё›аёњаёќаёћаёџаё аёЎаёўаёЈаё¤аёҐаё¦аё§аёЁаё©аёЄаё«аё¬аё­аё®аёЇаё°аё±аёІаёіаёґаёµаё¶аё·аёёаё№аёєпїЅпїЅпїЅпїЅаёїа№Ђа№Ѓа№‚а№ѓа№„а№…а№†а№‡а№€а№‰а№Ља№‹а№Ња№Ќа№Ћа№Џа№ђа№‘а№’а№“а№”а№•а№–а№—а№а№™а№ља№›пїЅпїЅпїЅпїЅ"
      },
      "ibm1162": "cp1162",
      "csibm1162": "cp1162",
      "cp1163": {
        "type": "_sbcs",
        "chars": "ВЂВЃВ‚ВѓВ„В…В†В‡В€В‰ВЉВ‹ВЊВЌВЋВЏВђВ‘В’В“В”В•В–В—ВВ™ВљВ›ВњВќВћВџВ ВЎВўВЈв‚¬ВҐВ¦В§Е“В©ВЄВ«В¬В­В®ВЇВ°В±ВІВіЕёВµВ¶В·Е’В№ВєВ»ВјВЅВѕВїГЂГЃГ‚Д‚Г„Г…Г†Г‡Г€Г‰ГЉГ‹МЂГЌГЋГЏДђГ‘М‰Г“Г”Ж Г–Г—ГГ™ГљГ›ГњЖЇМѓГџГ ГЎГўДѓГ¤ГҐГ¦Г§ГЁГ©ГЄГ«МЃГ­Г®ГЇД‘Г±МЈГіГґЖЎГ¶Г·ГёГ№ГєГ»ГјЖ°в‚«Гї"
      },
      "ibm1163": "cp1163",
      "csibm1163": "cp1163",
      "maccroatian": {
        "type": "_sbcs",
        "chars": "Г„Г…Г‡Г‰Г‘Г–ГњГЎГ ГўГ¤ГЈГҐГ§Г©ГЁГЄГ«Г­Г¬Г®ГЇГ±ГіГІГґГ¶ГµГєГ№Г»ГјвЂ В°ВўВЈВ§вЂўВ¶ГџВ®Е в„ўВґВЁв‰ ЕЅГв€ћВ±в‰¤в‰Ґв€†Вµв€‚в€‘в€ЏЕЎв€«ВЄВєв„¦ЕѕГёВїВЎВ¬в€љЖ’в‰€Д†В«ДЊвЂ¦В ГЂГѓГ•Е’Е“ДђвЂ”вЂњвЂќвЂвЂ™Г·в—ЉпїЅВ©вЃ„В¤вЂ№вЂєГ†В»вЂ“В·вЂљвЂћвЂ°Г‚Д‡ГЃДЌГ€ГЌГЋГЏГЊГ“Г”Д‘Г’ГљГ›Г™Д±Л†ЛњВЇПЂГ‹ЛљВёГЉГ¦Л‡"
      },
      "maccyrillic": {
        "type": "_sbcs",
        "chars": "РђР‘Р’Р“Р”Р•Р–Р—РР™РљР›РњРќРћРџР РЎРўРЈР¤РҐР¦Р§РЁР©РЄР«Р¬Р­Р®РЇвЂ В°ВўВЈВ§вЂўВ¶Р†В®В©в„ўР‚С’в‰ РѓС“в€ћВ±в‰¤в‰ҐС–Вµв€‚Р€Р„С”Р‡С—Р‰С™РЉСљСР…В¬в€љЖ’в‰€в€†В«В»вЂ¦В Р‹С›РЊСњС•вЂ“вЂ”вЂњвЂќвЂвЂ™Г·вЂћРЋСћРЏСџв„–РЃС‘СЏР°Р±РІРіРґРµР¶Р·РёР№РєР»РјРЅРѕРїСЂСЃС‚СѓС„С…С†С‡С€С‰СЉС‹СЊСЌСЋВ¤"
      },
      "macgreek": {
        "type": "_sbcs",
        "chars": "Г„В№ВІГ‰ВіГ–ГњО…Г ГўГ¤О„ВЁГ§Г©ГЁГЄГ«ВЈв„ўГ®ГЇвЂўВЅвЂ°ГґГ¶В¦В­Г№Г»ГјвЂ О“О”ОО›ОћО ГџВ®В©ОЈОЄВ§в‰ В°О‡О‘В±в‰¤в‰ҐВҐО’О•О–О—О™ОљОњО¦О«ОЁО©О¬ОќВ¬ОџОЎв‰€О¤В«В»вЂ¦В ОҐО§О†О€Е“вЂ“вЂ•вЂњвЂќвЂвЂ™Г·О‰ОЉОЊОЋО­О®ОЇПЊОЏПЌО±ОІП€ОґОµП†ОіО·О№ОѕОєО»ОјОЅОїПЂПЋПЃПѓП„ОёП‰П‚П‡П…О¶ПЉП‹ОђО°пїЅ"
      },
      "maciceland": {
        "type": "_sbcs",
        "chars": "Г„Г…Г‡Г‰Г‘Г–ГњГЎГ ГўГ¤ГЈГҐГ§Г©ГЁГЄГ«Г­Г¬Г®ГЇГ±ГіГІГґГ¶ГµГєГ№Г»ГјГќВ°ВўВЈВ§вЂўВ¶ГџВ®В©в„ўВґВЁв‰ Г†Гв€ћВ±в‰¤в‰ҐВҐВµв€‚в€‘в€ЏПЂв€«ВЄВєв„¦Г¦ГёВїВЎВ¬в€љЖ’в‰€в€†В«В»вЂ¦В ГЂГѓГ•Е’Е“вЂ“вЂ”вЂњвЂќвЂвЂ™Г·в—ЉГїЕёвЃ„В¤ГђГ°ГћГѕГЅВ·вЂљвЂћвЂ°Г‚ГЉГЃГ‹Г€ГЌГЋГЏГЊГ“Г”пїЅГ’ГљГ›Г™Д±Л†ЛњВЇЛЛ™ЛљВёЛќЛ›Л‡"
      },
      "macroman": {
        "type": "_sbcs",
        "chars": "Г„Г…Г‡Г‰Г‘Г–ГњГЎГ ГўГ¤ГЈГҐГ§Г©ГЁГЄГ«Г­Г¬Г®ГЇГ±ГіГІГґГ¶ГµГєГ№Г»ГјвЂ В°ВўВЈВ§вЂўВ¶ГџВ®В©в„ўВґВЁв‰ Г†Гв€ћВ±в‰¤в‰ҐВҐВµв€‚в€‘в€ЏПЂв€«ВЄВєв„¦Г¦ГёВїВЎВ¬в€љЖ’в‰€в€†В«В»вЂ¦В ГЂГѓГ•Е’Е“вЂ“вЂ”вЂњвЂќвЂвЂ™Г·в—ЉГїЕёвЃ„В¤вЂ№вЂєп¬Ѓп¬‚вЂЎВ·вЂљвЂћвЂ°Г‚ГЉГЃГ‹Г€ГЌГЋГЏГЊГ“Г”пїЅГ’ГљГ›Г™Д±Л†ЛњВЇЛЛ™ЛљВёЛќЛ›Л‡"
      },
      "macromania": {
        "type": "_sbcs",
        "chars": "Г„Г…Г‡Г‰Г‘Г–ГњГЎГ ГўГ¤ГЈГҐГ§Г©ГЁГЄГ«Г­Г¬Г®ГЇГ±ГіГІГґГ¶ГµГєГ№Г»ГјвЂ В°ВўВЈВ§вЂўВ¶ГџВ®В©в„ўВґВЁв‰ Д‚Ећв€ћВ±в‰¤в‰ҐВҐВµв€‚в€‘в€ЏПЂв€«ВЄВєв„¦ДѓЕџВїВЎВ¬в€љЖ’в‰€в€†В«В»вЂ¦В ГЂГѓГ•Е’Е“вЂ“вЂ”вЂњвЂќвЂвЂ™Г·в—ЉГїЕёвЃ„В¤вЂ№вЂєЕўЕЈвЂЎВ·вЂљвЂћвЂ°Г‚ГЉГЃГ‹Г€ГЌГЋГЏГЊГ“Г”пїЅГ’ГљГ›Г™Д±Л†ЛњВЇЛЛ™ЛљВёЛќЛ›Л‡"
      },
      "macthai": {
        "type": "_sbcs",
        "chars": "В«В»вЂ¦пўЊпўЏпў’пў•пўпў‹пўЋпў‘пў”пў—вЂњвЂќпў™пїЅвЂўпў„пў‰пў…пў†пў‡пў€пўЉпўЌпўђпў“пў–вЂвЂ™пїЅВ аёЃаё‚аёѓаё„аё…аё†аё‡аё€аё‰аёЉаё‹аёЊаёЌаёЋаёЏаёђаё‘аё’аё“аё”аё•аё–аё—аёаё™аёљаё›аёњаёќаёћаёџаё аёЎаёўаёЈаё¤аёҐаё¦аё§аёЁаё©аёЄаё«аё¬аё­аё®аёЇаё°аё±аёІаёіаёґаёµаё¶аё·аёёаё№аёєп»ївЂ‹вЂ“вЂ”аёїа№Ђа№Ѓа№‚а№ѓа№„а№…а№†а№‡а№€а№‰а№Ља№‹а№Ња№Ќв„ўа№Џа№ђа№‘а№’а№“а№”а№•а№–а№—а№а№™В®В©пїЅпїЅпїЅпїЅ"
      },
      "macturkish": {
        "type": "_sbcs",
        "chars": "Г„Г…Г‡Г‰Г‘Г–ГњГЎГ ГўГ¤ГЈГҐГ§Г©ГЁГЄГ«Г­Г¬Г®ГЇГ±ГіГІГґГ¶ГµГєГ№Г»ГјвЂ В°ВўВЈВ§вЂўВ¶ГџВ®В©в„ўВґВЁв‰ Г†Гв€ћВ±в‰¤в‰ҐВҐВµв€‚в€‘в€ЏПЂв€«ВЄВєв„¦Г¦ГёВїВЎВ¬в€љЖ’в‰€в€†В«В»вЂ¦В ГЂГѓГ•Е’Е“вЂ“вЂ”вЂњвЂќвЂвЂ™Г·в—ЉГїЕёДћДџД°Д±ЕћЕџвЂЎВ·вЂљвЂћвЂ°Г‚ГЉГЃГ‹Г€ГЌГЋГЏГЊГ“Г”пїЅГ’ГљГ›Г™пїЅЛ†ЛњВЇЛЛ™ЛљВёЛќЛ›Л‡"
      },
      "macukraine": {
        "type": "_sbcs",
        "chars": "РђР‘Р’Р“Р”Р•Р–Р—РР™РљР›РњРќРћРџР РЎРўРЈР¤РҐР¦Р§РЁР©РЄР«Р¬Р­Р®РЇвЂ В°ТђВЈВ§вЂўВ¶Р†В®В©в„ўР‚С’в‰ РѓС“в€ћВ±в‰¤в‰ҐС–ВµТ‘Р€Р„С”Р‡С—Р‰С™РЉСљСР…В¬в€љЖ’в‰€в€†В«В»вЂ¦В Р‹С›РЊСњС•вЂ“вЂ”вЂњвЂќвЂвЂ™Г·вЂћРЋСћРЏСџв„–РЃС‘СЏР°Р±РІРіРґРµР¶Р·РёР№РєР»РјРЅРѕРїСЂСЃС‚СѓС„С…С†С‡С€С‰СЉС‹СЊСЌСЋВ¤"
      },
      "koi8r": {
        "type": "_sbcs",
        "chars": "в”Ђв”‚в”Њв”ђв””в”в”њв”¤в”¬в”ґв”јв–Ђв–„в–€в–Њв–ђв–‘в–’в–“вЊ в– в€™в€љв‰€в‰¤в‰ҐВ вЊЎВ°ВІВ·Г·в•ђв•‘в•’С‘в•“в•”в••в•–в•—в•в•™в•љв•›в•њв•ќв•ћв•џв• в•ЎРЃв•ўв•Јв•¤в•Ґв•¦в•§в•Ёв•©в•Єв•«в•¬В©СЋР°Р±С†РґРµС„РіС…РёР№РєР»РјРЅРѕРїСЏСЂСЃС‚СѓР¶РІСЊС‹Р·С€СЌС‰С‡СЉР®РђР‘Р¦Р”Р•Р¤Р“РҐРР™РљР›РњРќРћРџРЇР РЎРўРЈР–Р’Р¬Р«Р—РЁР­Р©Р§РЄ"
      },
      "koi8u": {
        "type": "_sbcs",
        "chars": "в”Ђв”‚в”Њв”ђв””в”в”њв”¤в”¬в”ґв”јв–Ђв–„в–€в–Њв–ђв–‘в–’в–“вЊ в– в€™в€љв‰€в‰¤в‰ҐВ вЊЎВ°ВІВ·Г·в•ђв•‘в•’С‘С”в•”С–С—в•—в•в•™в•љв•›Т‘в•ќв•ћв•џв• в•ЎРЃР„в•ЈР†Р‡в•¦в•§в•Ёв•©в•ЄТђв•¬В©СЋР°Р±С†РґРµС„РіС…РёР№РєР»РјРЅРѕРїСЏСЂСЃС‚СѓР¶РІСЊС‹Р·С€СЌС‰С‡СЉР®РђР‘Р¦Р”Р•Р¤Р“РҐРР™РљР›РњРќРћРџРЇР РЎРўРЈР–Р’Р¬Р«Р—РЁР­Р©Р§РЄ"
      },
      "koi8ru": {
        "type": "_sbcs",
        "chars": "в”Ђв”‚в”Њв”ђв””в”в”њв”¤в”¬в”ґв”јв–Ђв–„в–€в–Њв–ђв–‘в–’в–“вЊ в– в€™в€љв‰€в‰¤в‰ҐВ вЊЎВ°ВІВ·Г·в•ђв•‘в•’С‘С”в•”С–С—в•—в•в•™в•љв•›Т‘Сћв•ћв•џв• в•ЎРЃР„в•ЈР†Р‡в•¦в•§в•Ёв•©в•ЄТђРЋВ©СЋР°Р±С†РґРµС„РіС…РёР№РєР»РјРЅРѕРїСЏСЂСЃС‚СѓР¶РІСЊС‹Р·С€СЌС‰С‡СЉР®РђР‘Р¦Р”Р•Р¤Р“РҐРР™РљР›РњРќРћРџРЇР РЎРўРЈР–Р’Р¬Р«Р—РЁР­Р©Р§РЄ"
      },
      "koi8t": {
        "type": "_sbcs",
        "chars": "Т›Т“вЂљТ’вЂћвЂ¦вЂ вЂЎпїЅвЂ°ТівЂ№ТІТ·Т¶пїЅТљвЂвЂ™вЂњвЂќвЂўвЂ“вЂ”пїЅв„ўпїЅвЂєпїЅпїЅпїЅпїЅпїЅУЇУ®С‘В¤УЈВ¦В§пїЅпїЅпїЅВ«В¬В­В®пїЅВ°В±ВІРЃпїЅУўВ¶В·пїЅв„–пїЅВ»пїЅпїЅпїЅВ©СЋР°Р±С†РґРµС„РіС…РёР№РєР»РјРЅРѕРїСЏСЂСЃС‚СѓР¶РІСЊС‹Р·С€СЌС‰С‡СЉР®РђР‘Р¦Р”Р•Р¤Р“РҐРР™РљР›РњРќРћРџРЇР РЎРўРЈР–Р’Р¬Р«Р—РЁР­Р©Р§РЄ"
      },
      "armscii8": {
        "type": "_sbcs",
        "chars": "ВЂВЃВ‚ВѓВ„В…В†В‡В€В‰ВЉВ‹ВЊВЌВЋВЏВђВ‘В’В“В”В•В–В—ВВ™ВљВ›ВњВќВћВџВ пїЅЦ‡Ц‰)(В»В«вЂ”.Хќ,-ЦЉвЂ¦ХњХ›ХћФ±ХЎФІХўФіХЈФґХ¤ФµХҐФ¶Х¦Ф·Х§ФёХЁФ№Х©ФєХЄФ»Х«ФјХ¬ФЅХ­ФѕХ®ФїХЇХЂХ°ХЃХ±Х‚ХІХѓХіХ„ХґХ…ХµХ†Х¶Х‡Х·Х€ХёХ‰Х№ХЉХєХ‹Х»ХЊХјХЌХЅХЋХѕХЏХїХђЦЂХ‘ЦЃХ’Ц‚Х“ЦѓХ”Ц„Х•Ц…Х–Ц†ХљпїЅ"
      },
      "rk1048": {
        "type": "_sbcs",
        "chars": "Р‚РѓвЂљС“вЂћвЂ¦вЂ вЂЎв‚¬вЂ°Р‰вЂ№РЉТљТєРЏС’вЂвЂ™вЂњвЂќвЂўвЂ“вЂ”пїЅв„ўС™вЂєСљТ›Т»СџВ Т°Т±УВ¤УЁВ¦В§РЃВ©Т’В«В¬В­В®Т®В°В±Р†С–У©ВµВ¶В·С‘в„–Т“В»У™ТўТЈТЇРђР‘Р’Р“Р”Р•Р–Р—РР™РљР›РњРќРћРџР РЎРўРЈР¤РҐР¦Р§РЁР©РЄР«Р¬Р­Р®РЇР°Р±РІРіРґРµР¶Р·РёР№РєР»РјРЅРѕРїСЂСЃС‚СѓС„С…С†С‡С€С‰СЉС‹СЊСЌСЋСЏ"
      },
      "tcvn": {
        "type": "_sbcs",
        "chars": "\u0000Гљб»¤\u0003б»Єб»¬б»®\u0007\b\t\n\u000b\f\r\u000e\u000f\u0010б»Ёб»°б»Іб»¶б»ёГќб»ґ\u0018\u0019\u001a\u001b\u001c\u001d\u001e\u001f !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~ГЂбєўГѓГЃбє бє¶бє¬Г€бєєбєјГ‰бєёб»†ГЊб»€ДЁГЌб»ЉГ’б»ЋГ•Г“б»Њб»б»њб»ћб» б»љб»ўГ™б»¦ЕЁВ Д‚Г‚ГЉГ”Ж ЖЇДђДѓГўГЄГґЖЎЖ°Д‘бє°МЂМ‰МѓМЃМЈГ бєЈГЈГЎбєЎбєІбє±бєібєµбєЇбєґбє®бє¦бєЁбєЄбє¤б»Ђбє·бє§бє©бє«бєҐбє­ГЁб»‚бє»бєЅГ©бє№б»Ѓб»ѓб»…бєїб»‡Г¬б»‰б»„бєѕб»’Д©Г­б»‹ГІб»”б»ЏГµГіб»Ќб»“б»•б»—б»‘б»™б»ќб»џб»Ўб»›б»ЈГ№б»–б»§Е©Гєб»Ґб»«б»­б»Їб»©б»±б»іб»·б»№ГЅб»µб»ђ"
      },
      "georgianacademy": {
        "type": "_sbcs",
        "chars": "ВЂВЃвЂљЖ’вЂћвЂ¦вЂ вЂЎЛ†вЂ°Е вЂ№Е’ВЌВЋВЏВђвЂвЂ™вЂњвЂќвЂўвЂ“вЂ”Лњв„ўЕЎвЂєЕ“ВќВћЕёВ ВЎВўВЈВ¤ВҐВ¦В§ВЁВ©ВЄВ«В¬В­В®ВЇВ°В±ВІВіВґВµВ¶В·ВёВ№ВєВ»ВјВЅВѕВїбѓђбѓ‘бѓ’бѓ“бѓ”бѓ•бѓ–бѓ—бѓбѓ™бѓљбѓ›бѓњбѓќбѓћбѓџбѓ бѓЎбѓўбѓЈбѓ¤бѓҐбѓ¦бѓ§бѓЁбѓ©бѓЄбѓ«бѓ¬бѓ­бѓ®бѓЇбѓ°бѓ±бѓІбѓібѓґбѓµбѓ¶Г§ГЁГ©ГЄГ«Г¬Г­Г®ГЇГ°Г±ГІГіГґГµГ¶Г·ГёГ№ГєГ»ГјГЅГѕГї"
      },
      "georgianps": {
        "type": "_sbcs",
        "chars": "ВЂВЃвЂљЖ’вЂћвЂ¦вЂ вЂЎЛ†вЂ°Е вЂ№Е’ВЌВЋВЏВђвЂвЂ™вЂњвЂќвЂўвЂ“вЂ”Лњв„ўЕЎвЂєЕ“ВќВћЕёВ ВЎВўВЈВ¤ВҐВ¦В§ВЁВ©ВЄВ«В¬В­В®ВЇВ°В±ВІВіВґВµВ¶В·ВёВ№ВєВ»ВјВЅВѕВїбѓђбѓ‘бѓ’бѓ“бѓ”бѓ•бѓ–бѓ±бѓ—бѓбѓ™бѓљбѓ›бѓњбѓІбѓќбѓћбѓџбѓ бѓЎбѓўбѓібѓЈбѓ¤бѓҐбѓ¦бѓ§бѓЁбѓ©бѓЄбѓ«бѓ¬бѓ­бѓ®бѓґбѓЇбѓ°бѓµГ¦Г§ГЁГ©ГЄГ«Г¬Г­Г®ГЇГ°Г±ГІГіГґГµГ¶Г·ГёГ№ГєГ»ГјГЅГѕГї"
      },
      "pt154": {
        "type": "_sbcs",
        "chars": "Т–Т’У®Т“вЂћвЂ¦Т¶Т®ТІТЇТ УўТўТљТєТёТ—вЂвЂ™вЂњвЂќвЂўвЂ“вЂ”ТіТ·ТЎУЈТЈТ›Т»Т№В РЋСћР€УЁТТ°В§РЃВ©УВ«В¬УЇВ®ТњВ°Т±Р†С–Т™У©В¶В·С‘в„–У™В»СТЄТ«ТќРђР‘Р’Р“Р”Р•Р–Р—РР™РљР›РњРќРћРџР РЎРўРЈР¤РҐР¦Р§РЁР©РЄР«Р¬Р­Р®РЇР°Р±РІРіРґРµР¶Р·РёР№РєР»РјРЅРѕРїСЂСЃС‚СѓС„С…С†С‡С€С‰СЉС‹СЊСЌСЋСЏ"
      },
      "viscii": {
        "type": "_sbcs",
        "chars": "\u0000\u0001бєІ\u0003\u0004бєґбєЄ\u0007\b\t\n\u000b\f\r\u000e\u000f\u0010\u0011\u0012\u0013б»¶\u0015\u0016\u0017\u0018б»ё\u001a\u001b\u001c\u001dб»ґ\u001f !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~бє бє®бє°бє¶бє¤бє¦бєЁбє¬бєјбєёбєѕб»Ђб»‚б»„б»†б»ђб»’б»”б»–б»б»ўб»љб»њб»ћб»Љб»Ћб»Њб»€б»¦ЕЁб»¤б»ІГ•бєЇбє±бє·бєҐбє§бє©бє­бєЅбє№бєїб»Ѓб»ѓб»…б»‡б»‘б»“б»•б»—б» Ж б»™б»ќб»џб»‹б»°б»Ёб»Єб»¬ЖЎб»›ЖЇГЂГЃГ‚ГѓбєўД‚бєібєµГ€Г‰ГЉбєєГЊГЌДЁб»іДђб»©Г’Г“Г”бєЎб»·б»«б»­Г™Гљб»№б»µГќб»ЎЖ°Г ГЎГўГЈбєЈДѓб»Їбє«ГЁГ©ГЄбє»Г¬Г­Д©б»‰Д‘б»±ГІГіГґГµб»Џб»Ќб»ҐГ№ГєЕ©б»§ГЅб»Јб»®"
      },
      "iso646cn": {
        "type": "_sbcs",
        "chars": "\u0000\u0001\u0002\u0003\u0004\u0005\u0006\u0007\b\t\n\u000b\f\r\u000e\u000f\u0010\u0011\u0012\u0013\u0014\u0015\u0016\u0017\u0018\u0019\u001a\u001b\u001c\u001d\u001e\u001f !\"#ВҐ%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}вЂѕпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅ"
      },
      "iso646jp": {
        "type": "_sbcs",
        "chars": "\u0000\u0001\u0002\u0003\u0004\u0005\u0006\u0007\b\t\n\u000b\f\r\u000e\u000f\u0010\u0011\u0012\u0013\u0014\u0015\u0016\u0017\u0018\u0019\u001a\u001b\u001c\u001d\u001e\u001f !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[ВҐ]^_`abcdefghijklmnopqrstuvwxyz{|}вЂѕпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅ"
      },
      "hproman8": {
        "type": "_sbcs",
        "chars": "ВЂВЃВ‚ВѓВ„В…В†В‡В€В‰ВЉВ‹ВЊВЌВЋВЏВђВ‘В’В“В”В•В–В—ВВ™ВљВ›ВњВќВћВџВ ГЂГ‚Г€ГЉГ‹ГЋГЏВґЛ‹Л†ВЁЛњГ™Г›в‚¤ВЇГќГЅВ°Г‡Г§Г‘Г±ВЎВїВ¤ВЈВҐВ§Ж’ВўГўГЄГґГ»ГЎГ©ГіГєГ ГЁГІГ№Г¤Г«Г¶ГјГ…Г®ГГ†ГҐГ­ГёГ¦Г„Г¬Г–ГњГ‰ГЇГџГ”ГЃГѓГЈГђГ°ГЌГЊГ“Г’Г•ГµЕ ЕЎГљЕёГїГћГѕВ·ВµВ¶ВѕвЂ”ВјВЅВЄВєВ«в– В»В±пїЅ"
      },
      "macintosh": {
        "type": "_sbcs",
        "chars": "Г„Г…Г‡Г‰Г‘Г–ГњГЎГ ГўГ¤ГЈГҐГ§Г©ГЁГЄГ«Г­Г¬Г®ГЇГ±ГіГІГґГ¶ГµГєГ№Г»ГјвЂ В°ВўВЈВ§вЂўВ¶ГџВ®В©в„ўВґВЁв‰ Г†Гв€ћВ±в‰¤в‰ҐВҐВµв€‚в€‘в€ЏПЂв€«ВЄВєв„¦Г¦ГёВїВЎВ¬в€љЖ’в‰€в€†В«В»вЂ¦В ГЂГѓГ•Е’Е“вЂ“вЂ”вЂњвЂќвЂвЂ™Г·в—ЉГїЕёвЃ„В¤вЂ№вЂєп¬Ѓп¬‚вЂЎВ·вЂљвЂћвЂ°Г‚ГЉГЃГ‹Г€ГЌГЋГЏГЊГ“Г”пїЅГ’ГљГ›Г™Д±Л†ЛњВЇЛЛ™ЛљВёЛќЛ›Л‡"
      },
      "ascii": {
        "type": "_sbcs",
        "chars": "пїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅ"
      },
      "tis620": {
        "type": "_sbcs",
        "chars": "пїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅаёЃаё‚аёѓаё„аё…аё†аё‡аё€аё‰аёЉаё‹аёЊаёЌаёЋаёЏаёђаё‘аё’аё“аё”аё•аё–аё—аёаё™аёљаё›аёњаёќаёћаёџаё аёЎаёўаёЈаё¤аёҐаё¦аё§аёЁаё©аёЄаё«аё¬аё­аё®аёЇаё°аё±аёІаёіаёґаёµаё¶аё·аёёаё№аёєпїЅпїЅпїЅпїЅаёїа№Ђа№Ѓа№‚а№ѓа№„а№…а№†а№‡а№€а№‰а№Ља№‹а№Ња№Ќа№Ћа№Џа№ђа№‘а№’а№“а№”а№•а№–а№—а№а№™а№ља№›пїЅпїЅпїЅпїЅ"
      }
    }
    },{}],15:[function(require,module,exports){
    "use strict";
    
    // Manually added data to be used by sbcs codec in addition to generated one.
    
    module.exports = {
        // Not supported by iconv, not sure why.
        "10029": "maccenteuro",
        "maccenteuro": {
            "type": "_sbcs",
            "chars": "Г„ДЂДЃГ‰Д„Г–ГњГЎД…ДЊГ¤ДЌД†Д‡Г©Е№ЕєДЋГ­ДЏД’Д“Д–ГіД—ГґГ¶ГµГєДљД›ГјвЂ В°ДВЈВ§вЂўВ¶ГџВ®В©в„ўД™ВЁв‰ ДЈД®ДЇДЄв‰¤в‰ҐД«Д¶в€‚в€‘Е‚Д»ДјДЅДѕД№ДєЕ…Е†ЕѓВ¬в€љЕ„Е‡в€†В«В»вЂ¦В Е€ЕђГ•Е‘ЕЊвЂ“вЂ”вЂњвЂќвЂвЂ™Г·в—ЉЕЌЕ”Е•ЕвЂ№вЂєЕ™Е–Е—Е вЂљвЂћЕЎЕљЕ›ГЃЕ¤ЕҐГЌЕЅЕѕЕЄГ“Г”Е«Е®ГљЕЇЕ°Е±ЕІЕіГќГЅД·Е»ЕЃЕјДўЛ‡"
        },
    
        "808": "cp808",
        "ibm808": "cp808",
        "cp808": {
            "type": "_sbcs",
            "chars": "РђР‘Р’Р“Р”Р•Р–Р—РР™РљР›РњРќРћРџР РЎРўРЈР¤РҐР¦Р§РЁР©РЄР«Р¬Р­Р®РЇР°Р±РІРіРґРµР¶Р·РёР№РєР»РјРЅРѕРїв–‘в–’в–“в”‚в”¤в•Ўв•ўв•–в••в•Јв•‘в•—в•ќв•њв•›в”ђв””в”ґв”¬в”њв”Ђв”јв•ћв•џв•љв•”в•©в•¦в• в•ђв•¬в•§в•Ёв•¤в•Ґв•™в•в•’в•“в•«в•Єв”в”Њв–€в–„в–Њв–ђв–ЂСЂСЃС‚СѓС„С…С†С‡С€С‰СЉС‹СЊСЌСЋСЏРЃС‘Р„С”Р‡С—РЋСћВ°в€™В·в€љв„–в‚¬в– В "
        },
    
        "mik": {
            "type": "_sbcs",
            "chars": "РђР‘Р’Р“Р”Р•Р–Р—РР™РљР›РњРќРћРџР РЎРўРЈР¤РҐР¦Р§РЁР©РЄР«Р¬Р­Р®РЇР°Р±РІРіРґРµР¶Р·РёР№РєР»РјРЅРѕРїСЂСЃС‚СѓС„С…С†С‡С€С‰СЉС‹СЊСЌСЋСЏв””в”ґв”¬в”њв”Ђв”јв•Јв•‘в•љв•”в•©в•¦в• в•ђв•¬в”ђв–‘в–’в–“в”‚в”¤в„–В§в•—в•ќв”в”Њв–€в–„в–Њв–ђв–ЂО±ГџО“ПЂОЈПѓВµП„О¦ОО©Оґв€ћП†Оµв€©в‰ЎВ±в‰Ґв‰¤вЊ вЊЎГ·в‰€В°в€™В·в€љвЃїВІв– В "
        },
    
        // Aliases of generated encodings.
        "ascii8bit": "ascii",
        "usascii": "ascii",
        "ansix34": "ascii",
        "ansix341968": "ascii",
        "ansix341986": "ascii",
        "csascii": "ascii",
        "cp367": "ascii",
        "ibm367": "ascii",
        "isoir6": "ascii",
        "iso646us": "ascii",
        "iso646irv": "ascii",
        "us": "ascii",
    
        "latin1": "iso88591",
        "latin2": "iso88592",
        "latin3": "iso88593",
        "latin4": "iso88594",
        "latin5": "iso88599",
        "latin6": "iso885910",
        "latin7": "iso885913",
        "latin8": "iso885914",
        "latin9": "iso885915",
        "latin10": "iso885916",
    
        "csisolatin1": "iso88591",
        "csisolatin2": "iso88592",
        "csisolatin3": "iso88593",
        "csisolatin4": "iso88594",
        "csisolatincyrillic": "iso88595",
        "csisolatinarabic": "iso88596",
        "csisolatingreek" : "iso88597",
        "csisolatinhebrew": "iso88598",
        "csisolatin5": "iso88599",
        "csisolatin6": "iso885910",
    
        "l1": "iso88591",
        "l2": "iso88592",
        "l3": "iso88593",
        "l4": "iso88594",
        "l5": "iso88599",
        "l6": "iso885910",
        "l7": "iso885913",
        "l8": "iso885914",
        "l9": "iso885915",
        "l10": "iso885916",
    
        "isoir14": "iso646jp",
        "isoir57": "iso646cn",
        "isoir100": "iso88591",
        "isoir101": "iso88592",
        "isoir109": "iso88593",
        "isoir110": "iso88594",
        "isoir144": "iso88595",
        "isoir127": "iso88596",
        "isoir126": "iso88597",
        "isoir138": "iso88598",
        "isoir148": "iso88599",
        "isoir157": "iso885910",
        "isoir166": "tis620",
        "isoir179": "iso885913",
        "isoir199": "iso885914",
        "isoir203": "iso885915",
        "isoir226": "iso885916",
    
        "cp819": "iso88591",
        "ibm819": "iso88591",
    
        "cyrillic": "iso88595",
    
        "arabic": "iso88596",
        "arabic8": "iso88596",
        "ecma114": "iso88596",
        "asmo708": "iso88596",
    
        "greek" : "iso88597",
        "greek8" : "iso88597",
        "ecma118" : "iso88597",
        "elot928" : "iso88597",
    
        "hebrew": "iso88598",
        "hebrew8": "iso88598",
    
        "turkish": "iso88599",
        "turkish8": "iso88599",
    
        "thai": "iso885911",
        "thai8": "iso885911",
    
        "celtic": "iso885914",
        "celtic8": "iso885914",
        "isoceltic": "iso885914",
    
        "tis6200": "tis620",
        "tis62025291": "tis620",
        "tis62025330": "tis620",
    
        "10000": "macroman",
        "10006": "macgreek",
        "10007": "maccyrillic",
        "10079": "maciceland",
        "10081": "macturkish",
    
        "cspc8codepage437": "cp437",
        "cspc775baltic": "cp775",
        "cspc850multilingual": "cp850",
        "cspcp852": "cp852",
        "cspc862latinhebrew": "cp862",
        "cpgr": "cp869",
    
        "msee": "cp1250",
        "mscyrl": "cp1251",
        "msansi": "cp1252",
        "msgreek": "cp1253",
        "msturk": "cp1254",
        "mshebr": "cp1255",
        "msarab": "cp1256",
        "winbaltrim": "cp1257",
    
        "cp20866": "koi8r",
        "20866": "koi8r",
        "ibm878": "koi8r",
        "cskoi8r": "koi8r",
    
        "cp21866": "koi8u",
        "21866": "koi8u",
        "ibm1168": "koi8u",
    
        "strk10482002": "rk1048",
    
        "tcvn5712": "tcvn",
        "tcvn57121": "tcvn",
    
        "gb198880": "iso646cn",
        "cn": "iso646cn",
    
        "csiso14jisc6220ro": "iso646jp",
        "jisc62201969ro": "iso646jp",
        "jp": "iso646jp",
    
        "cshproman8": "hproman8",
        "r8": "hproman8",
        "roman8": "hproman8",
        "xroman8": "hproman8",
        "ibm1051": "hproman8",
    
        "mac": "macintosh",
        "csmacintosh": "macintosh",
    };
    
    
    },{}],16:[function(require,module,exports){
    module.exports=[
    ["8740","дЏ°д°Ідѓд–¦д•ёр§‰§дµ·д–ір§І±діўр§і…г®•дњ¶дќ„д±‡д±Ђр¤ЉїрЈ—р§Ќ’р¦є‹р§ѓ’д±—рЄЌ‘дќЏд—љдІ…р§±¬дґ‡дЄ¤дљЎр¦¬Јз€ҐрҐ©”рЎ©ЈрЈё†рЈЅЎж™Ќе›»"],
    ["8767","з¶•е¤ќрЁ®№г·ґйњґр§ЇЇеЇ›рЎµћеЄ¤гҐр©є°е«‘е®·еіјжќ®и–“р©Ґ…з‘Ўз’ќгЎµрЎµ“рЈљћр¦ЂЎг»¬"],
    ["87a1","рҐЈћг«µз«јйѕ—р¤…ЎрЁ¤ЌрЈ‡Єр ЄЉрЈ‰ћдЊЉи’„йѕ–йђЇд¤°и“еў–йќЉй€з§ђзЁІж™ жЁ©иўќз‘ЊзЇ…жћ‚зЁ¬е‰ЏйЃ†г“¦зЏ„рҐ¶№з“†йї‡ећід¤Їе‘Њд„±рЈљЋе з©Ір§­Ґи®Џдљ®р¦є€д†ЃрҐ¶™з®®рў’јйї€рў“Ѓрў“‰рў“Њйї‰и”„рЈ–»д‚ґйїЉд“ЎрЄ·їж‹ЃзЃ®йї‹"],
    ["8840","г‡Ђ",4,"р „Њг‡…р ѓ‘р ѓЌг‡†г‡‡р ѓ‹рЎїЁг‡€р ѓЉг‡‰г‡Љг‡‹г‡Њр „Ћг‡Ќг‡ЋДЂГЃЗЌГЂД’Г‰ДљГ€ЕЊГ“З‘Г’аїїГЉМ„бєѕаїїГЉМЊб»ЂГЉДЃГЎЗЋГ Й‘Д“Г©Д›ГЁД«Г­ЗђГ¬ЕЌГіЗ’ГІЕ«ГєЗ”Г№З–ЗЗљ"],
    ["88a1","ЗњГјаїїГЄМ„бєїаїїГЄМЊб»ЃГЄЙЎвЏљвЏ›"],
    ["8940","рЄЋ©рЎ……"],
    ["8943","ж”Љ"],
    ["8946","дёЅж»ќйµЋй‡џ"],
    ["894c","р§њµж’‘дјљдјЁдѕЁе…–е…ґе†ње‡¤еЉЎеЉЁеЊ»еЌЋеЏ‘еЏе›ўеЈ°е¤„е¤‡е¤Іе¤ґе­¦е®ће®џеІљеє†жЂ»ж–‰жџѕж „жЎҐжµЋз‚јз”µзє¤зє¬зєєз»‡з»Џз»џзј†зј·и‰єи‹ЏиЌЇи§†и®ѕиЇўиЅ¦иЅ§иЅ®"],
    ["89a1","зђ‘зіјз·ЌжҐ†з«‰е€§"],
    ["89ab","й†Њзўёй…ћи‚ј"],
    ["89b0","иґ‹иѓ¶р §§"],
    ["89b5","и‚џй»‡діЌй·‰йёЊд°ѕр©·¶р§ЂЋйёЉрЄ„іг—Ѓ"],
    ["89c1","жєљи€ѕз”™"],
    ["89c5","д¤‘й©¬йЄЏйѕ™з¦‡рЁ‘¬рЎ·Љр —ђрў«¦дё¤дєЃдєЂдє‡дєїд»«дј·г‘ЊдѕЅг№€еЂѓе‚€г‘Ѕг’“г’Ґе††е¤…е‡›е‡је€…дє‰е‰№еЉђеЊ§г—‡еЋ©г•‘еЋ°г•“еЏ‚еђЈг•­г•ІгљЃе’“е’Је’ґе’№е“ђе“Їе”е”Је”Ёг–е”їг–Ґг–їе——г—…"],
    ["8a40","р§¶„е”Ґ"],
    ["8a43","р ±‚р ґ•рҐ„«е–ђрўі†г§¬р ЌЃи№†р¤¶ёр©“ҐдЃ“рЁ‚ѕзќєрў°ёгЁґдџ•рЁ…ќр¦§Ір¤·Єж“ќр µјр ѕґр і•рЎѓґж’Ќи№ѕр є–р °‹р Ѕ¤рўІ©рЁ‰–р¤““"],
    ["8a64","р µ†р©©ЌрЁѓ©дџґр¤є§рўі‚йЄІг©§р©—ґгї­г”†рҐ‹‡р©џ”р§Ј€рўµ„йµ®й •"],
    ["8a76","дЏ™р¦‚Ґж’ґе“ЈрўµЊрўЇЉрЎЃ·г§»рЎЃЇ"],
    ["8aa1","р¦›љр¦њ–р§¦ ж“ЄрҐЃ’р ±ѓи№Ёрў†ЎрЁ­Њр њ±"],
    ["8aac","д ‹р †©гїєеЎірў¶Ќ"],
    ["8ab2","р¤—€р “јр¦‚—р ЅЊр ¶–е•№д‚»дЋє"],
    ["8abb","дЄґрў©¦рЎ‚ќи†ЄйЈµр ¶њжЌ№г§ѕрўќµи·ЂељЎж‘јг№ѓ"],
    ["8ac9","рЄЃр ё‰рў«Џрўі‰"],
    ["8ace","рЎѓ€рЈ§‚г¦’гЁ†рЁЉ›г•ёрҐ№‰рўѓ‡е™’р ј±рўІІр©њ г’јж°Ѕр¤ё»"],
    ["8adf","р§•ґрўє‹рў€€рЄ™›рЁіЌр №єр °ґр¦ њзѕ“рЎѓЏрў ѓрў¤№г—»рҐ‡Јр єЊр ѕЌр єЄгѕ“р ј°р µ‡рЎ…Џр №Њ"],
    ["8af6","р є«р ®©р µ€рЎѓЂрЎ„Ѕгї№рўљ–жђІр ѕ­"],
    ["8b40","рЈЏґр§№рўЇЋр µѕр µїрў±‘рў±•гЁр єрЎѓ‡р ј®рЄІр¦­ђрЁі’рЁ¶™рЁіЉй–Єе“Њи‹„е–№"],
    ["8b55","р©»ѓй°¦йЄ¶р§ќћрў·®з…Ђи…­иѓ¬е°њр¦•Іи„ґгћ—еЌџрЁ‚Ѕй†¶р »єр ёЏр №·р »»г—ќр¤·«г‰р і–ељЇрўћµрЎѓ‰р ёђр №ёрЎЃёрЎ…€рЁ€‡рЎ‘•р №№р¤№ђрў¶¤е©”рЎЂќрЎЂћрЎѓµрЎѓ¶ећњр ё‘"],
    ["8ba1","р§љ”рЁ‹Ќр ѕµр №»рҐ…ѕгњѓр ѕ¶рЎ†ЂрҐ‹рЄЉЅр¤§љрЎ єр¤…·рЁ‰јеў™е‰ЁгљрҐњЅз®Іе­Ёд Ђд¬¬йј§д§§й°џй®ЌрҐ­ґрЈ„Ѕе—»г—Іељ‰дёЁе¤‚рЎЇЃрЇЎёйќ‘р ‚†д№›дє»г”ѕе°ЈеЅ‘еї„гЈєж‰Њж”µж­єж°µж°єзЃ¬з€«дё¬зЉ­р¤Ј©зЅ’з¤»зі№зЅ“р¦‰Єг“Ѓ"],
    ["8bde","р¦Ќ‹иЂ‚и‚Ђр¦’р¦Ґ‘еЌќиЎ¤и§Ѓр§ўІи® иґќй’…й•ёй•їй—ЁрЁёЏйџ¦йЎµйЈЋйЈћйҐЈр© ђй±јйёџй»„ж­Їп¤‡дё·р ‚‡йќж€·й’ў"],
    ["8c40","еЂ»ж·ѕр©±ійѕ¦г·‰иўЏр¤…ЋзЃ·еіµд¬ рҐ‡Ќг•™рҐґ°ж„ўрЁЁІиѕ§й‡¶з†‘жњ™зЋєрЈЉЃрЄ„‡гІ‹рЎ¦Ђд¬ђзЈ¤зђ‚е†®рЁњЏдЂ‰ж©ЈрЄЉєд€ЈиЏр ©ЇзЁЄр©Ґ‡рЁ«Єйќ•зЃЌеЊ¤рўЃѕйЏґз›™рЁ§Јйѕ§зџќдєЈдї°е‚јдёЇдј—йѕЁеђґз¶‹еў’еЈђрЎ¶¶еє’еє™еї‚рўњ’ж–‹"],
    ["8ca1","рЈЏ№ж¤™ж©ѓрЈ±Јжії"],
    ["8ca7","з€Ђр¤”…зЋЊг»›р¤Ё“е¬•з’№и®ѓрҐІ¤рҐљ•зЄ“зЇ¬зіѓз№¬и‹ёи–—йѕ©иўђйѕЄиє№йѕ«иїЏи•џй§ й€Ўйѕ¬рЁ¶№рЎђїдЃ±дЉўеЁљ"],
    ["8cc9","йЎЁжќ«д‰¶ењЅ"],
    ["8cce","и—–р¤Ґ»иЉїр§„ЌдІЃр¦µґеµ»р¦¬•р¦ѕѕйѕ­йѕ®е®–йѕЇж›§з№›ж№—з§Љг¶€д“ѓрЈ‰–рўћ–дЋљд”¶"],
    ["8ce6","еі•рЈ¬љи«№е±ёгґ’рЈ•‘еµёйѕІз…—д•р¤ѓ¬рЎёЈд±·гҐёг‘Љр †¤р¦±Ѓи«Њдѕґр €№е¦їи…¬йЎ–р©Јєеј»"],
    ["8d40","р ®џ"],
    ["8d42","рў‡ЃрЁҐ­д„‚дљ»р©Ѓ№гј‡йѕірЄ†µдѓёгџ–д›·р¦±†д…јрЁљІр§Џїд•­гЈ”рҐ’љд•Ўд”›д¶‰д±»дµ¶д—Єгї€р¤¬Џг™Ўд“ћд’Ѕд‡­еґѕеµ€еµ–г·јг Џе¶¤е¶№г  г ёе№‚еєЅејҐеѕѓг¤€г¤”г¤їгҐЌжѓ—ж„ЅеіҐг¦‰ж†·ж†№ж‡Џг¦ёж€¬жЉђж‹ҐжЊг§ёељ±"],
    ["8da1","гЁѓжЏўжЏ»жђ‡ж‘љг©‹ж“Ђеґ•еЎйѕџгЄ—ж–†гЄЅж—їж™“г«Іжљ’г¬ўжњ–г­‚жћ¤ж Ђг­жЎЉжў„г­Іг­±г­»ж¤‰жҐѓз‰њжҐ¤ж¦џж¦…г®јж§–гЇќж©Ґж©ґж©±жЄ‚гЇ¬жЄ™гЇІжЄ«жЄµж«”ж«¶ж®ЃжЇЃжЇЄж±µжІЄгі‹жґ‚жґ†жґ¦ж¶ЃгіЇж¶¤ж¶±жё•жёжё©жє†рЁ§Ђжє»ж»ўж»љйЅїж»Ёж»©жј¤жјґгµ†рЈЅЃжѕЃжѕѕгµЄгµµз†·еІ™г¶ЉзЂ¬г¶‘зЃђзЃ”зЃЇзЃїз‚‰р ЊҐдЏЃг—±р »"],
    ["8e40","рЈ»—ећѕр¦»“з„ѕрҐџ г™Ћж¦ўрЁЇ©е­ґз©‰рҐЈЎр©“™з©Ґз©ЅрҐ¦¬зЄ»зЄ°з«‚з«ѓз‡‘р¦’Ќд‡Љз«љз«ќз«Єд‡Їе’ІрҐ°Ѓз¬‹з­•з¬©рҐЊЋрҐіѕз®ўз­ЇиЋњрҐ®ґр¦±їзЇђиђЎз®’з®ёрҐґ г¶­рҐ±Ґи’’зЇєз°†з°µрҐіЃз±„зІѓр¤ў‚зІ¦ж™Ѕр¤•ёзі‰зі‡зі¦з±ґзіізіµзіЋ"],
    ["8ea1","з№§д”ќр¦№„зµќр¦»–з’Ќз¶‰з¶«з„µз¶із·’р¤Ѓ—р¦Ђ©з·¤гґ“з·µрЎџ№з·ҐрЁЌ­зёќр¦„Ўр¦…љз№®зє’дЊ«й‘¬зё§зЅЂзЅЃзЅ‡з¤¶р¦‹ђй§Ўзѕ—р¦Ќ‘зѕЈрЎ™Ўр ЃЁд•њрЈќ¦д”ѓрЁЊєзїєр¦’‰иЂ…иЂ€иЂќиЂЁиЂЇрЄ‚‡р¦іѓиЂ»иЂјиЃЎрўњ”д¦‰р¦¦рЈ·Јр¦›ЁжњҐи‚§рЁ©€и„‡и„љеў°рў›¶ж±їр¦’р¤ѕёж“§рЎ’Љи€рЎЎћж©“р¤©Ґр¤Є•д‘єи€©р ¬Ќр¦©’рЈµѕдї№рЎ“Ѕи“ўиЌўр¦¬Љр¤¦§рЈ”°рЎќірЈ·ёиЉЄж¤›рЇ¦”д‡›"],
    ["8f40","и•‹и‹ђиЊљр ё–рЎћґг›ЃрЈ…ЅрЈ•љи‰»и‹ўиЊрЈє‹р¦¶Јр¦¬…р¦®—рЈ—Ћг¶їиЊќе—¬иЋ…д”‹р¦¶ҐиЋ¬иЏЃиЏ“г‘ѕр¦»”ж©—и•љг’–р¦№‚рў»Їи‘рҐЇ¤и‘±г·“д“¤жЄ§и‘ЉрЈІµзҐи’Ёр¦®–р¦№·р¦№ѓи“ћиђЏиЋ‘д’ и’“и“¤рҐІ‘д‰ЂрҐіЂд•ѓи”ґе«Ір¦є™д”§и•ід”–жћїи–"],
    ["8fa1","рЁҐрЁ»и—Ѓр§‚€и‚рЎ–‚р§ѓЌрЇ¦Ід•ЄиЁг™€рЎўўеЏ·р§Ћљи™ѕиќ±рЄѓёиџ®рў°§ић±иџљи Џе™Ўи™¬жЎ–дЏиЎ…иЎ†р§— рЈ¶№р§—¤иЎћиўњд™›иўґиўµжЏЃиЈ…зќ·р§њЏи¦‡и¦Љи¦¦и¦©и¦§и¦јрЁЁҐи§§р§¤¤р§ЄЅиЄњзћ“й‡ѕиЄђр§©™з«©р§¬єрЈѕЏдњ“р§¬ёз…ји¬Њи¬џрҐђ°рҐ•Ґи¬їи­Њи­ЌиЄ©р¤©єи®ђи®›иЄЇрЎ›џд•иЎЏиІ›р§µ”р§¶ЏрЇ§”гњҐр§µ“иі–р§¶р§¶Ѕиґ’иґѓрЎ¤ђиі›зЃњиґ‘р¤і‰г»ђиµ·"],
    ["9040","и¶©рЁЂ‚рЎЂ”р¤¦Љг­јрЁ†јр§„Њз«§иє­иє¶и»ѓй‹”иј™иј­рЁЌҐрЁђ’иѕҐйЊѓрЄЉџр ©ђиѕід¤ЄрЁ§ћрЁ”ЅрЈ¶»е»ёрЈ‰ўиї№рЄЂ”рЁљјрЁ”ЃрўЊҐг¦Ђр¦»—йЂ·рЁ”јр§ЄѕйЃЎрЁ•¬рЁ‹й‚ЁрЁњ“йѓ„рЁ›¦й‚®йѓЅй…§г«°й†©й‡„зІ¬рЁ¤ірЎє‰й€ЋжІџй‰Ѓй‰ўрҐ–№йЉ№рЁ«†рЈІ›рЁ¬ЊрҐ—›"],
    ["90a1","р ґ±йЊ¬йЌ«рЁ«ЎрЁЇ«з‚Џе«ѓрЁ«ўрЁ«ҐдҐҐй‰„рЁЇ¬рЁ°№рЁЇїйЌій‘›иєјй–…й–¦йђ¦й– жї¶дЉ№рў™єрЁ›рЎ‰јрЈё®д§џж°њй™»йљ–д…¬йљЈр¦»•ж‡љйљ¶зЈµрЁ« йљЅеЏЊд¦Ўр¦Іёр ‰ґр¦ђђр©‚Їр©ѓҐр¤«‘рЎ¤•рЈЊЉйњ±и™‚йњ¶дЁЏд”Ѕд–…р¤«©зЃµе­Ѓйњ›йќњр©‡•йќ—е­Љр©‡«йќџйђҐеѓђрЈ‚·рЈ‚јйћ‰йћџйћ±йћѕйџЂйџ’йџ рҐ‘¬йџ®зђњр©ђійџїйџµр©ђќр§Ґєд«‘й ґй ійЎ‹йЎ¦г¬Ћр§…µгµ‘р °р¤…њ"],
    ["9140","рҐњ†йЈЉйў·йЈ€йЈ‡д«їр¦ґ§рЎ›“е–°йЈЎйЈ¦йЈ¬йЌёй¤№р¤Ё©д­Ір©Ў—р©¤…й§µйЁЊйЁ»йЁђй©рҐњҐг›„р©‚±р©Ї•й« й«ўр©¬…й«ґд°Ћй¬”й¬­рЁЂеЂґй¬ґр¦¦ЁгЈѓрЈЃЅй­ђй­Ђр©ґѕе©…рЎЎЈй®Ћр¤‰‹й°‚йЇїй°Њр©№Ёй·”р©ѕ·рЄ†’рЄ†«рЄѓЎрЄ„ЈрЄ‡џйµѕй¶ѓрЄ„ґйёЋжў€"],
    ["91a1","й·„рў…›рЄ†“рЄ€ рЎ¤»рЄ€ійґ№рЄ‚№рЄЉґйєђйє•йєћйєўдґґйєЄйєЇр¤Ќ¤й»Ѓг­ г§ҐгґќдјІгћѕрЁ°«йј‚йј€д®–йђ¤р¦¶ўйј—йј–йј№ељџељЉйЅ…й¦ёр©‚‹йџІи‘їйЅўйЅ©з«њйѕЋз€–д®ѕр¤Ґµр¤¦»з…·р¤§ёр¤Ќ€р¤©‘зЋћрЁЇљрЎЈєз¦џрЁҐѕрЁё¶йЌ©йЏірЁ©„й‹¬йЋЃйЏ‹рЁҐ¬р¤’№з€—г»«зќІз©ѓзѓђр¤‘ір¤Џёз…ѕрЎџЇз‚ЈрЎўѕрЈ–™г»‡рЎў…рҐђЇрЎџёгњўрЎ›»рЎ №г›ЎрЎќґрЎЈ‘рҐЅ‹гњЈрЎ›Ђеќ›р¤ЁҐрЎЏѕрЎЉЁ"],
    ["9240","рЎЏ†рЎ’¶и”ѓрЈљ¦и”ѓи‘•р¤¦”р§…ҐрЈё±рҐ•њрЈ»»р§Ѓ’д“ґрЈ›®р©¦ќр¦ј¦жџ№гњіг°•г·§еЎ¬рЎ¤ўж ђдЃ—рЈњїр¤ѓЎр¤‚‹р¤„Џр¦°Ўе“‹ељћр¦љ±ељ’р їџр ®Ёр ёЌйЏ†рЁ¬“йЋњд»ёе„«г ™р¤ђ¶дєјр ‘Ґр ЌїдЅ‹дѕЉрҐ™‘е©Ёр †«р Џ‹г¦™р ЊЉр ђ”гђµдј©р ‹ЂрЁєір ‰µи«љр €Њдє"],
    ["92a1","еѓЌе„Ќдѕўдјѓр¤ЁЋрЈєЉдЅ‚еЂ®еЃ¬е‚ЃдїЊдїҐеЃеѓје…™е…›е…ќе…ћж№¶рЈ–•рЈё№рЈєїжµІрЎў„рЈє‰е†Ёе‡ѓр — д“ќр ’Јр ’’р ’‘иµєрЁЄњр њЋе‰™еЉ¤р Ўіе‹ЎйЌ®д™єз†Њр¤ЋЊр ° р¤¦¬рЎѓ¤ж§‘р ёќз‘№г»ћз’™зђ”з‘–зЋд®Ћр¤Єјр¤‚ЌеЏђг–„з€Џр¤ѓ‰е–ґр Ќ…е“Ќр Ї†ењќй‰ќй›ґйЌ¦еџќећЌеќїгѕеЈ‹еЄ™рЁ©†рЎ›єрЎќЇрЎњђеЁ¬е¦ёйЉЏе©ѕе«ЏеЁ’рҐҐ†рЎ§ірЎЎЎр¤Љ•г›µжґ…з‘ѓеЁЎрҐєѓ"],
    ["9340","еЄЃрЁЇ—р ђ“йЏ з’ЊрЎЊѓз„…дҐІйђ€рЁ§»йЋЅгћ е°ћеІће№ће№€рЎ¦–рЎҐјрЈ«®е»Ќе­ЏрЎ¤ѓрЎ¤„гњЃрЎў г›ќрЎ›ѕг›“и„ЄрЁ©‡рЎ¶єрЈ‘ІрЁ¦ЁејЊејЋрЎ¤§рЎћ«е©«рЎњ»е­„и”р§—ЅиЎ жЃѕрўЎ рў«еї›гєёрў–Їрў–ѕр©‚€р¦Ѕіж‡Ђр Ђѕр Ѓ†рў›ж†™ж†жЃµрўІ›рўґ‡р¤›”р©…Ќ"],
    ["93a1","ж‘±р¤™Ґрў­ЄгЁ©рў¬ўрЈ‘ђр©ЈЄрў№ёжЊ·рЄ‘›ж’¶жЊ±жЏ‘р¤§Јрўµ§жЉ¤рўІЎжђ»ж•«жҐІгЇґрЈ‚ЋрЈЉ­р¤¦‰рЈЉ«е”ЌрЈ‹ рЎЈ™р©ђїж›ЋрЈЉ‰рЈ†іг« д†ђрҐ–„рЁ¬ўрҐ–ЏрЎ›јрҐ•›рҐђҐзЈ®рЈ„ѓрЎ ЄрЈ€ґг‘¤рЈ€ЏрЈ†‚р¤‹‰жљЋр¦ґ¤ж™«д®“ж°р§Ў°рЎ·«ж™ЈрЈ‹’рЈ‹ЎжћрҐЎІгЈ‘рЈ єрЈћјг®™рЈћўрЈЏѕз“ђг®–жћЏр¤Єжў¶ж ћгЇ„жЄѕгЎЈрЈџ•р¤’‡жЁіж©’ж«‰ж¬…рЎ¤’ж”‘жўж©ЊгЇ—ж©єж­—рЈїЂрЈІљйЋ й‹ІрЁЇЄрЁ«‹"],
    ["9440","йЉ‰рЁЂћрЁ§њй‘§ж¶Ґжј‹р¤§¬жµ§рЈЅїг¶Џжё„р¤ЂјеЁЅжёЉеЎ‡жґ¤зЎ‚з„»р¤Њљр¤‰¶зѓ±з‰ђзЉ‡зЉ”р¤ћЏр¤њҐе…№р¤Є¤р —«з‘єрЈ»ёрЈ™џр¤©Љр¤¤—рҐїЎгј†гє±р¤«џрЁ°ЈрЈјµж‚§г»із“ЊзђјйЋ‡зђ·д’џр¦·Єд•‘з–ѓгЅЈр¤і™р¤ґ†гЅз••з™ірЄ—†г¬™з‘ЁрЁ«Њр¤¦«р¤¦Ћг«»"],
    ["94a1","г·Ќр¤©Ћг»їр¤§…р¤Јій‡єењІйЌ‚рЁ«ЈрЎЎ¤еѓџрҐ€ЎрҐ‡§зќёрЈ€ІзњЋзњЏзќ»р¤љ—рЈћЃг©ћр¤Ј°зђёз’›гєїр¤Єєр¤«‡дѓ€р¤Є–р¦†®йЊ‡рҐ–Ѓз ћзўЌзў€зЈ’зЏђзҐ™р§ќЃрҐ›Јд„Ћз¦›и’–з¦ҐжЁ­рЈ»єзЁєз§ґд…®рЎ›¦д„Ій€µз§±р µЊр¤¦Њр Љ™рЈ¶єрЎќ®г–—е•«г•°гљЄр ‡”р °Ќз«ўе©™рў›µрҐЄЇрҐЄњеЁЌр ‰›зЈ°еЁЄрҐЇ†з«ѕд‡№з±ќз±­д€‘рҐ®ірҐєјрҐє¦зіЌр¤§№рЎћ°зІЋз±јзІ®жЄІз·њзё‡з·“зЅЋр¦‰Ў"],
    ["9540","р¦…њр§­€з¶—рҐє‚д‰Єр¦­µр ¤–жџ–р ЃЋрЈ—Џеџ„р¦ђ’р¦Џёр¤Ґўзїќз¬§р  ¬рҐ«©рҐµѓз¬ЊрҐёЋй§¦и™…й©ЈжЁњрЈђїг§ўр¤§·р¦–­йЁџр¦– и’Ђр§„§р¦і‘д“Єи„·дђ‚иѓ†и„‰и…‚р¦ћґйЈѓр¦©‚и‰ўи‰Ґр¦©‘и‘“р¦¶§иђр§€›еЄ†д…їрЎЎЂе¬«рЎўЎе«¤рЎЈиљ рЇ¦јрЈ¶Џи ­р§ђўеЁ‚"],
    ["95a1","иЎ®дЅ…иў‡иўїиЈ¦иҐҐиҐЌрҐљѓиҐ”р§ћ…р§ћ„рЁЇµрЁЇ™рЁ®њрЁ§№гє­и’Јд›µд›ЏгџІиЁЅиЁњр©‘€еЅЌй€«р¤Љ„ж—”з„©зѓ„рЎЎ…йµ­иІџиі©р§·ње¦љзџѓе§°дЌ®г›”иёЄиє§р¤°‰иј°иЅЉд‹ґж±жѕ»рўЊЎдў›жЅ№жє‹рЎџљйЇ©гљµр¤¤Їй‚»й‚—е•±д¤†й†»йђ„рЁ©‹дЃўрЁ«јйђ§рЁ°ќрЁ°»и“ҐиЁ«й–™й–§й–—й––рЁґґз‘…г»‚р¤Јїр¤©‚р¤ЏЄг»§рЈ€ҐйљЏрЁ»§рЁ№¦рЁ№Ґг»Њр¤§­р¤©ёрЈї®зђ’з‘«г»јйќЃр©‚°"],
    ["9640","жЎ‡дЁќр©‚“рҐџџйќќйЌЁрЁ¦‰рЁ°¦рЁ¬Їр¦ЋѕйЉєе¬‘и­©д¤јзЏ№р¤€›йћ›йќ±й¤ёр ј¦е·ЃрЁЇ…р¤ЄІй џр©“љй‹¶р©——й‡Ґд“ЂрЁ­ђр¤©§рЁ­¤йЈњрЁ©…гјЂй€Єд¤Ґиђ”й¤»йҐЌр§¬†г·Ѕй¦›д­Їй¦Єй©њрЁ­ҐрҐЈ€жЄЏйЁЎе«ѕйЁЇр©Ј±д®ђр©Ґ€й¦јд®Ѕд®—йЌЅеЎІрЎЊ‚е ўр¤¦ё"],
    ["96a1","рЎ“ЁзЎ„рўњџрЈ¶ёжЈ…гµЅй‘г¤§ж…ђрўћЃрўҐ«ж„‡й±Џй±“й±»й°µй°ђй­їйЇЏр©ё­й®џрЄ‡µрЄѓѕйґЎдІ®р¤„„йёдІ°йґЊрЄ†ґрЄѓ­рЄѓір©¤Їй¶Ґи’Ѕр¦ё’р¦їџр¦®‚и—јд”ір¦¶¤р¦є„р¦·°иђ и—®р¦ёЂрЈџ—р¦Ѓ¤з§ўрЈ–њрЈ™Ђд¤­р¤§ћгµўйЏ›йЉѕйЌ€р Љїзў№й‰·й‘Ќдї¤г‘ЂйЃ¤рҐ•ќз ЅзЎ”зў¶зЎ‹рЎќ—рЈ‡‰р¤ҐЃгљљдЅІжїљжї™зЂћзЂћеђ”р¤†µећ»еЈіећЉйґ–еџ—з„ґг’Їр¤†¬з‡«р¦±Ђр¤ѕ—е¬ЁрЎћµрЁ©‰"],
    ["9740","ж„Ње«ЋеЁ‹дЉјр¤’€гњ¬д­»рЁ§јйЋ»йЋёрЎЈ–р јќи‘Ір¦іЂрЎђ“р¤‹єрў°¦р¤ЏЃе¦”рЈ¶·р¦ќЃз¶Ёр¦…›р¦‚¤р¤¦№р¤¦‹рЁ§єй‹ҐзЏўг»©з’ґрЁ­ЈрЎўџг»Ўр¤Єіж«зЏізЏ»г»–р¤Ёѕр¤Є”рЎџ™р¤©¦р Ћ§рЎђ¤р¤§Ґз‘€р¤¤–з‚Ґр¤Ґ¶йЉ„зЏ¦йЌџр “ѕйЊ±рЁ«ЋрЁЁ–йЋ†рЁЇ§рҐ—•д¤µрЁЄ‚з…«"],
    ["97a1","р¤Ґѓр іїељ¤р љр Ї«р Іёе”‚з§„рЎџєз·ѕрЎ›‚р¤©ђрЎЎ’д”®йђЃгњЉрЁ«Ђр¤¦­е¦°рЎўїрЎўѓр§’„еЄЎг›ўрЈµ›гљ°й‰џе©№рЁЄЃрЎЎўйЌґгіЌр ЄґдЄ–г¦Љеѓґгµ©гµЊрЎЋњз…µд‹»рЁ€жёЏр©ѓ¤д“«жµ—р§№ЏзЃ§жІЇгі–рЈї­рЈё­жё‚жјЊгµЇр Џµз•‘гљјг“€дљЂг»љдЎ±е§„й‰®д¤ѕиЅЃрЁ°њр¦ЇЂе ’еџ€г›–рЎ‘’зѓѕр¤Ќўр¤©±рўїЈрЎЉ°рўЋЅжў№жҐ§рЎЋрЈ“Ґр§ЇґрЈ›џрЁЄѓрЈџ–рЈЏєр¤ІџжЁљрЈљ­р¦І·иђѕд“џд“Ћ"],
    ["9840","р¦ґ¦р¦µ‘р¦І‚р¦їћжј—р§„‰иЊЅрЎњєиЏ­р¦ІЂр§Ѓ“рЎџ›е¦‰еЄ‚рЎћіе©Ўе©±рЎ¤…р¤‡јгњ­е§ЇрЎњјг›‡з†ЋйЋђжљљр¤ЉҐе©®еЁ«р¤Љ“жЁ«рЈ»№р§њ¶р¤‘›р¤‹Љз„ќр¤‰™рЁ§Ўдѕ°р¦ґЁеі‚р¤“Ћр§№Ќр¤ЋЅжЁЊр¤‰–рЎЊ„з‚¦з„ір¤Џ©г¶ҐжіџрЇ Ґр¤©Џз№Ґе§«еґЇг·іеЅњр¤©ќрЎџџз¶¤иђ¦"],
    ["98a1","е’…рЈ«єрЈЊЂр €”еќѕр Ј•р ™гїҐрЎѕћрЄЉ¶зЂѓр©…›еµ°зЋЏзі“рЁ©™р©ђ дї€зї§з‹ЌзЊђр§«ґзЊёзЊ№рҐ›¶зЌЃзЌ€гє©р§¬йЃ¬з‡µр¤ЈІзЏЎи‡¶г»ЉзњЊг»‘жІўе›Ѕзђ™зђћзђџг»ўг»°г»ґг»єз““гјЋгЅ“з•‚з•­з•Із–ЌгЅјз—€з—њгїЂз™Ќгї—з™ґгїњз™єр¤Ѕњз†€еЈи¦ЂеЎ©дЂќзќѓдЂ№жќЎдЃ…г—›зћдЃЄдЃЇе±ћзћѕзџ‹еЈІз з‚№з њд‚Ёз №зЎ‡зЎ‘зЎ¦и‘€рҐ”µз¤іж ѓз¤Ід„ѓ"],
    ["9940","д„‰з¦‘з¦™иѕ»зЁ†иѕјд…§зЄ‘д†ІзЄји‰№д‡„з«Џз«›д‡ЏдёЎз­ўз­¬з­»з°’з°›д‰ д‰єз±»зІњдЉЊзІёдЉ”зі­иѕ“зѓЂр іЏз·Џз·”з·ђз·Ѕзѕ®зѕґзЉџдЋ—иЂ иЂҐз¬№иЂ®иЂ±иЃ”г·Њећґз‚ и‚·иѓ©дЏ­и„ЊзЊЄи„Ћи„’з• и„”дђЃг¬№и…–и…™и…љ"],
    ["99a1","дђ“е єи…ји†„дђҐи†“дђ­и†ҐеџЇи‡Ѓи‡¤и‰”д’ЏиЉ¦и‰¶и‹Љи‹и‹їд’°иЌ—й™©ж¦Љиђ…зѓµи‘¤жѓЈи’€д”„и’ѕи“Ўи“ёи”ђи”ёи•’д”»и•Їи•°и— д•·и™Іиљ’иљІи›Їй™…ић‹д†д—иў®иЈїи¤¤иҐ‡и¦‘р§Ґ§иЁ©иЁёиЄ”иЄґи±‘иі”иіІиґњдћеЎџи·ѓдџ­д»®иёєе—еќ”и№±е—µиє°д ·и»Ћи»ўи»¤и»­и»Іиѕ·иїЃиїЉиїЊйЂій§„дў­йЈ й€“д¤ћй€Ёй‰й‰«йЉ±йЉ®йЉї"],
    ["9a40","й‹Јй‹«й‹ій‹ґй‹ЅйЌѓйЋ„йЋ­дҐ…дҐ‘йєїйђ—еЊЃйђќйђ­йђѕдҐЄй‘”й‘№й”­й–ўд¦§й—ґйід§Ґжћ дЁ¤йќЂдЁµйћІйџ‚е™”д«¤жѓЁйў№д¬™йЈ±еЎ„й¤Ћй¤™е†ґй¤њй¤·йҐ‚йҐќйҐўд­°й§…д®ќйЁјй¬ЏзЄѓй­©й®ЃйЇќйЇ±йЇґд±­й° гќЇрЎЇ‚йµ‰й°є"],
    ["9aa1","й»ѕе™ђй¶“й¶Ѕй·Ђй·јй“¶иѕ¶й№»йє¬йє±йєЅй»†й“њй»ўй»±й»ёз«€йЅ„р ‚”р Љ·р Ћ ж¤љй“ѓе¦¬р “—еЎЂй“Ѓгћ№р —•р •р ™¶рЎљєеќ—з…ір «‚р «Ќр ®їе‘ЄрЇ »р Ї‹е’ћр Ї»р °»р ±“р ±Ґр ±јжѓ§р ІЌе™єр Іµр іќр і­р µЇр ¶Ір ·€жҐ•й°ЇићҐр ё„р ёЋр »—р ѕђр ј­р №іе° р ѕјеё‹рЎЃњрЎЃЏрЎЃ¶жњћрЎЃ»рЎ‚€рЎ‚–г™‡рЎ‚їрЎѓ“рЎ„ЇрЎ„»еЌ¤и’­рЎ‹ЈрЎЌµрЎЊ¶и®ЃрЎ•·рЎ™рЎџѓрЎџ‡д№ёз‚»рЎ ­рЎҐЄ"],
    ["9b40","рЎЁ­рЎ©…рЎ°ЄрЎ±°рЎІ¬рЎ»€ж‹ѓрЎ»•рЎј•з†жЎ•рўЃ…ж§©г›€рў‰јрўЏ—рўЏєрўњЄрўЎ±рўҐЏи‹ЅрўҐ§рў¦“рў«•и¦Ґрў«Ёиѕ рў¬Ћйћёрў¬їйЎ‡йЄЅрў±Њ"],
    ["9b62","рўІ€рўІ·рҐЇЁрўґ€рўґ’рў¶·рў¶•рў№‚рўЅґрўїЊрЈЂірЈЃ¦рЈЊџрЈЏћеѕ±ж™€жљїр§©№рЈ•§рЈ—із€Ѓр¤¦єзџ—рЈљрЈњ–зє‡р Ќ†еўµжњЋ"],
    ["9ba1","ж¤рЈЄ§р§™—рҐїўрЈё‘рЈє№р§—ѕрў‚љдЈђдЄёр¤„™рЁЄљр¤‹®р¤ЊЌр¤Ђ»р¤Њґр¤Ћ–р¤©…р —Ље‡’р ‘е¦џрЎєЁг®ѕрЈіїр¤ђ„р¤“–ећ€р¤™ґг¦›р¤њЇрЁ—Ёр©§‰гќўрў‡ѓи­ћрЁ­Ћй§–р¤ ’р¤Ј»р¤Ё•з€‰р¤«Ђр ±ёеҐҐр¤єҐр¤ѕ†р ќ№и»љрҐЂ¬еЉЏењїз…±рҐЉ™рҐђ™рЈЅЉр¤Є§е–јрҐ‘†рҐ‘®р¦­’й‡”г‘ірҐ”їр§ІрҐ•ћдњрҐ•ўрҐ•¦рҐџ‡р¤¤їрҐЎќеЃ¦г“»рЈЏЊжѓћрҐ¤ѓдќјрЁҐ€рҐЄ®рҐ®‰рҐ°†рЎ¶ђећЎз…‘жѕ¶р¦„‚р§°’йЃ–р¦†Ір¤ѕљи­ўр¦ђ‚р¦‘Љ"],
    ["9c40","еµ›р¦Ї·иј¶р¦’„рЎ¤њи«Єр¤§¶р¦’€рЈїЇр¦”’дЇЂр¦–їр¦љµрўњ›й‘ҐрҐџЎж†•еЁ§рЇЈЌдѕ»ељ№р¤”Ўр¦›јд№Єр¤¤ґй™–ж¶Џр¦ІЅгиҐ·р¦ћ™р¦Ў®р¦ђ‘р¦Ўћз‡џр¦Ј‡з­‚р©ѓЂр Ё‘р¦¤¦й„„р¦¤№з©…й·°р¦§єйЁ¦р¦Ё­г™џр¦‘©р ЂЎз¦ѓр¦Ёґр¦­›еґ¬рЈ”™иЏЏр¦®ќд›ђр¦І¤з”»иЎҐр¦¶®еў¶"],
    ["9ca1","гњњрў–Ќр§Ѓ‹р§‡Ќг±”р§ЉЂр§Љ…йЉЃрў…єр§Љ‹йЊ°р§‹¦р¤§ђж°№й’џр§‘ђр »ёи §иЈµрў¤¦рЁ‘ірЎћ±жєёр¤ЁЄрЎ  г¦¤гљ№е°ђз§Јд”їжљ¶р©І­р©ў¤иҐѓр§џЊр§Ўе›–дѓџрЎЉг¦ЎрЈњЇрЁѓЁрЎЏ…з†­иЌ¦р§§ќр©†Ёе©§дІ·р§‚ЇрЁ¦«р§§Ѕр§ЁЉр§¬‹р§µ¦р¤…єз­ѓзҐѕрЁЂ‰жѕµрЄ‹џжЁѓрЁЊеЋўр¦ё‡йЋїж ¶йќќрЁ…ЇрЁЂЈр¦¦µрЎЏ­рЈ€ЇрЁЃ€е¶…рЁ°°рЁ‚ѓењ•й ЈрЁҐ‰е¶«р¤¦€ж–ѕж§•еЏ’р¤ЄҐрЈѕЃг°‘жњ¶рЁ‚ђрЁѓґрЁ„®рЎѕЎрЁ…Џ"],
    ["9d40","рЁ†‰рЁ†ЇрЁ€љрЁЊ†рЁЊЇрЁЋЉг—ЉрЁ‘ЁрЁљЄдЈєжЏ¦рЁҐ–з €й‰•рЁ¦ёдЏІрЁ§§дЏџрЁ§ЁрЁ­†рЁЇ”е§ёрЁ°‰иј‹рЁї…р©ѓ¬з­‘р©„ђр©„јг··р©…ћр¤«ЉиїђзЉЏељ‹р©“§р©—©р©–°р©–ёр©њІр©Ј‘р©Ґ‰р©ҐЄр©§ѓр©ЁЁр©¬Ћр©µљр©¶›зєџр©»ёр©јЈдІ¤й•‡рЄЉ“з†ўрЄ‹їд¶‘йЂ’рЄ—‹д¶њр Іњиѕѕе—Ѓ"],
    ["9da1","иѕєрў’°иѕ№р¤Є“д”‰з№їжЅ–жЄ±д»Єг“¤рЁ¬¬р§ўќгњєиєЂрЎџµрЁЂ¤рЁ­¬рЁ®™р§Ёѕр¦љЇг·«р§™•рЈІ·рҐµрҐҐ–дєљрҐєЃр¦‰ељїр №­иёЋе­­рЈє€р¤ІћжЏћж‹ђрЎџ¶рЎЎ»ж”°е­рҐ±ЉеђљрҐЊ‘г·†р©¶д±ЅеўећзЅ‰рҐ»еҐµрЈµЂиќ°дёњр їЄр µ‰рЈљєи„—йµћиґз»й±…з™Ћзћ№йЌ…еђІи…€и‹·еҐи„Іиђи‚Ѕе—ЄзҐўе™ѓеђ–р єќг—Ће…е—±ж›±рЁ‹ўг­з”ґе—°е–єе’—е•Ір ±Ѓр І–е»ђрҐ…€р №¶рў±ў"],
    ["9e40","р єўйє«зµље—ћрЎЃµжЉќйќ­е’”иіЌз‡¶й…¶жЏјжЋ№жЏѕе•©рў­ѓй±Ірўєіе†љг“џр ¶§е†§е‘Ќе”ће”“з™¦иё­р¦ўЉз–±и‚¶и „ић†иЈ‡и†¶иђњрЎѓЃд“¬зЊ„р¤њ†е®ђиЊ‹р¦ў“е™»рў›ґр§ґЇр¤†Јр§µір¦»ђр§Љ¶й…°рЎ‡™й€€рЈіјрЄљ©р є¬р »№з‰¦рЎІўдќЋр¤ї‚р§ї№р ї«дѓє"],
    ["9ea1","й±ќж”џрў¶ дЈір¤џ р©µјр ї¬р ёЉжЃўр§–Јр ї­"],
    ["9ead","р¦Ѓ€рЎ†‡з†ЈзєЋйµђдёљдё„г•·е¬ЌжІІеЌ§гљ¬г§њеЌЅгљҐр¤еўљр¤­®и€­е‘‹ећЄрҐЄ•р Ґ№"],
    ["9ec5","г©’рў‘ҐзЌґр©є¬дґ‰йЇ­рЈіѕр©ј°д±›р¤ѕ©р©–ћр©їћи‘њрЈ¶¶р§ЉІр¦ћірЈњ жЊ®зґҐрЈ»·рЈё¬гЁЄйЂ€е‹Њг№ґг™єд—©р ’Ћз™Ђе«°р є¶зЎєр§ј®еў§д‚їе™јй®‹еµґз™”рЄђґйє…діЎз—№гџ»ж„™рЈѓљр¤ЏІ"],
    ["9ef5","е™ќрЎЉ©ећ§р¤ҐЈр©ё†е€ґр§‚®г–­ж±Љйµј"],
    ["9f40","з±–й¬№еџћрЎќ¬е±“ж““р©“ђр¦Њµр§…¤иљ­р ґЁр¦ґўр¤«ўр µ±"],
    ["9f4f","е‡ѕрЎјЏе¶ЋйњѓрЎ·‘йєЃйЃЊз¬џй¬‚еі‘з®Јж‰ЁжЊµй«їзЇЏй¬Єз±ѕй¬®з±‚зІ†й°•зЇјй¬‰йј—й°›р¤¤ѕйЅље•іеЇѓдїЅйєдїІе‰ гё†е‹‘еќ§еЃ–е¦·её’йџ€й¶«иЅње‘©йћґйҐЂйћєеЊ¬ж„°"],
    ["9fa1","ж¤¬еЏљй°Љйґ‚д°»й™Ѓж¦Ђе‚¦з•†рЎќ­й§ље‰і"],
    ["9fae","й…™йљЃй…њ"],
    ["9fb2","й…‘рЁє—жЌїр¦ґЈж«Ље‘й†Ћз•єжЉ…р ЏјзЌЏз±°рҐ°ЎрЈіЅ"],
    ["9fc1","р¤¤™з›–й®ќдёЄр і”иЋѕиЎ‚"],
    ["9fc9","е±Љж§Ђеѓ­еќєе€џе·µд»Ћж°±р ‡Ідј№е’ње“љеЉљи¶‚г—ѕејЊг—і"],
    ["9fdb","ж­’й…јйѕҐй®—й ®йўґйЄєйєЁйє„з…єз¬”"],
    ["9fe7","жЇєи зЅё"],
    ["9feb","е рЄ™Љи№·йЅ“"],
    ["9ff0","и·”и№ЏйёњиёЃжЉ‚рЁЌЅиёЁи№µз«“р¤©·зЁѕзЈжіЄи©§з‡"],
    ["a040","рЁ©љйј¦жіЋиџ–з—ѓрЄЉІзЎ“рЇЎЂиґЊз‹ўзЌ±и¬­зЊ‚з“±иі«р¤Є»иЇеѕєиў д’·"],
    ["a055","рЎ »р¦ё…"],
    ["a058","и©ѕрў”›"],
    ["a05b","жѓЅз™§й«—йµ„йЌ®й®Џиџµ"],
    ["a063","и Џиі·зЊ¬йњЎй®°г—–зЉІд°‡з±‘йҐЉр¦…™ж…™д°„йє–ж…Ѕ"],
    ["a073","еќџж…ЇжЉ¦ж€№ж‹Ћг©њж‡ўеЋЄрЈЏµжЌ¤ж ‚г—’"],
    ["a0a1","еµ—рЁЇ‚иїљрЁё№"],
    ["a0a6","еѓ™рЎµ†з¤†еЊІйёр ј»дЃҐ"],
    ["a0ae","зџѕ"],
    ["a0b0","зі‚рҐјљзіљзЁ­иЃ¦иЃЈзµЌз”…з“Іи¦”и€љжњЊиЃўр§’†иЃ›з“°и„ѓзњ¤и¦‰р¦џЊз•“р¦»‘ић©иџЋи‡€ићЊи©‰иІ­и­ѓзњ«з“ёи“љгµж¦Іи¶¦"],
    ["a0d4","и¦©з‘Ёж¶№иџЃр¤Ђ‘з“§г·›з…¶ж‚¤ж†њгі‘з…ўжЃ·"],
    ["a0e2","зЅ±рЁ¬­з‰ђжѓ©д­ѕе€ г°рЈі‡рҐ»—р§™–рҐ”±рЎҐ„рЎ‹ѕр©¤ѓр¦·њр§‚­еіЃр¦†­рЁЁЏрЈ™·р ѓ®р¦Ў†р¤јЋд•ўе¬џр¦ЌЊйЅђйє¦р¦‰«"],
    ["a3c0","вђЂ",31,"вђЎ"],
    ["c6a1","в‘ ",9,"в‘ґ",9,"в…°",9,"дё¶дёїдє…дє е†‚е†–е†«е‹№еЊёеЌ©еЋ¶е¤Ље®Ђе·›вјіе№їе»ґеЅђеЅЎж”ґж— з–’з™¶иѕµйљ¶ВЁЛ†гѓЅгѓѕг‚ќг‚ћгЂѓд»ќгЂ…гЂ†гЂ‡гѓјпј»пјЅвњЅгЃЃ",23],
    ["c740","гЃ™",58,"г‚Ўг‚ўг‚Јг‚¤"],
    ["c7a1","г‚Ґ",81,"Рђ",5,"РЃР–",4],
    ["c840","Р›",26,"С‘Р¶",25,"в‡§в†ёв†№г‡Џр ѓЊд№љр ‚Ље€‚д’‘"],
    ["c8a1","йѕ°е†€йѕ±р§‡"],
    ["c8cd","пїўпї¤пј‡пј‚г€±в„–в„Ўг‚›г‚њвєЂвє„вє†вє‡вє€вєЉвєЊвєЌвє•вєњвєќвєҐвє§вєЄвє¬вє®вє¶вєјвєѕв»†в»Љв»Њв»Ќв»Џв»–в»—в»ћв»Ј"],
    ["c8f5","КѓЙђЙ›Й”ЙµЕ“ГёЕ‹КЉЙЄ"],
    ["f9fe","пї­"],
    ["fa40","р •‡й‹›р —џрЈї…и•ЊдЉµзЏЇе†µг™‰р¤Ґ‚рЁ§¤йЌ„рЎ§›и‹®рЈі€з јжќ„ж‹џр¤¤ірЁ¦Єр Љ р¦®ірЎЊ…дѕ«рў“­еЂ€р¦ґ©р§Є„рЈЂр¤Є±рў”“еЂ©р Ќѕеѕ¤р ЋЂр Ќ‡ж»›р ђџеЃЅе„Ѓг‘єе„ЋйЎ¬гќѓиђ–р¤¦¤р ’‡е… рЈЋґе…Єр Їїрўѓјр ‹Ґрў”°р –ЋрЈ€ірЎ¦ѓе®‚иќЅр –ірЈІ™е†Іе†ё"],
    ["faa1","йґґе‡‰е‡Џе‡‘гіње‡“р¤Є¦е†іе‡ўеЌ‚е‡­иЏЌж¤ѕрЈњ­еЅ»е€‹е€¦е€јеЉµе‰—еЉ”еЉ№е‹…з°•и•‚е‹ иЌр¦¬“еЊ…рЁ«ће•‰ж»™рЈѕЂр Ґ”рЈї¬еЊіеЌ„р Їўжі‹рЎњ¦ж ›зЏ•жЃЉгєЄгЈЊрЎ›Ёз‡ќд’ўеЌ­еЌґрЁљ«еЌѕеЌїрЎ––рЎ“зџ¦еЋ“рЁЄ›еЋ еЋ«еЋ®зЋ§рҐќІгЅ™зЋњеЏЃеЏ…ж±‰д№‰еџѕеЏ™гЄ«р ®ЏеЏ рЈї«рў¶ЈеЏ¶р ±·еђ“зЃ№е”«ж™—жµ›е‘­р¦­“р µґе•ќе’Џе’¤дћ¦рЎњЌр »ќг¶ґр µЌ"],
    ["fb40","рЁ¦јрўље•‡ді­еђЇзђ—е–†е–©е…рЎЈ—р¤Ђєд•’р¤ђµжљірЎ‚ґе·ж›ЌрЈЉЉжљ¤жљ­е™Ќе™ЏзЈ±е›±йћ‡еЏѕењЂе›Їе›­рЁ­¦гЈрЎ‰Џеќ†р¤†Ґж±®з‚‹еќ‚гљ±р¦±ѕеџ¦рЎђ–е ѓрЎ‘”р¤ЌЈе ¦р¤ЇµеЎњеўЄг•ЎеЈ еЈњрЎ€јеЈ»еЇїеќѓрЄ…ђр¤‰ёйЏ“г–Ўе¤џжў¦г›ѓж№™"],
    ["fba1","рЎѕеЁ¤е•“рЎљ’и”…е§‰р µЋр¦ІЃр¦ґЄрЎџње§™рЎџ»рЎћІр¦¶¦жµ±рЎ ЁрЎ›•е§№р¦№…еЄ«е©Јг›¦р¤¦©е©·гњ€еЄ–з‘Ґе«“р¦ѕЎрў•”г¶…рЎ¤‘гњІрЎљёеєѓе‹ђе­¶ж–€е­јр§ЁЋдЂ„дЎќр €„еЇ•ж… рЎЁґрҐ§Њр –ҐеЇіе®ќдґђе°…рЎ­„е°“зЏЋе°”рЎІҐр¦¬Ёе±‰дЈќеІ…еі©еіЇе¶‹рЎ·№рЎё·еґђеґеµ†рЎє¤еІєе·—и‹јг ­р¤¤ЃрўЃ‰рў…іиЉ‡г ¶гЇ‚её®жЄЉе№µе№єр¤’јр і“еЋ¦дє·е»ђеЋЁрЎќ±её‰е»ґрЁ’‚"],
    ["fc40","е»№е»»гў е»јж ѕйђ›ејЌр ‡ЃрЇў”г«ћдў®рЎЊєејєр¦ў€рўЏђеЅрў‘±еЅЈйћЅр¦№®еЅІйЌЂрЁЁ¶еѕ§е¶¶гµџрҐ‰ђрЎЅЄр§ѓёрў™Ёй‡–р ЉћрЁЁ©жЂ±жљ…рЎЎ·гҐЈг·‡г№ећђрўћґзҐ±г№Ђж‚ћж‚¤ж‚ір¤¦‚р¤¦Џр§©“з’¤еѓЎеЄ ж…¤иђ¤ж…‚рЇў¦р¦»’ж†Ѓе‡ґр ™–ж†‡е®ЄрЈѕ·"],
    ["fca1","рўЎџж‡“рЁ®ќр©Ґќж‡ђг¤Ірў¦ЂрўЈЃжЂЈж…њж”ћжЋ‹р „ж‹…рЎќ°ж‹•рўёЌжЌ¬р¤§џгЁ—жђёжЏёрЎЋЋрЎџјж’ђжѕЉрўё¶й ”р¤‚ЊрҐњќж“Ўж“Ґй‘»г©¦жђєг©—ж•Ќжј–р¤ЁЁр¤ЁЈж–…ж•­ж•џрЈЃѕж–µр¤ҐЂд¬·ж—‘дѓрЎ ©ж— ж—ЈеїџрЈђЂжрЈ‡·рЈ‡ёж™„рЈ†¤рЈ†Ґж™‹р №µж™§рҐ‡¦ж™іж™ґрЎёЅрЈ€±рЁ—ґрЈ‡€рҐЊ“зџ…рўЈ·й¦¤жњ‚р¤Ћњр¤ЁЎг¬«ж§єрЈџ‚жќћжќ§жќўр¤‡Ќр©ѓ­жџ—д“©ж ўж№ђй€јж ЃрЈЏ¦р¦¶ жЎќ"],
    ["fd40","рЈ‘Їж§ЎжЁ‹рЁ«џжҐіжЈѓрЈ—Ќж¤Ѓж¤ЂгґІгЁЃрЈјг®Ђжћ¬жҐЎрЁ©Љд‹јж¤¶ж¦г®Ўр Џ‰иЌЈе‚ђж§№рЈ™™рў„Єж©…рЈњѓжЄќгЇіжћ±ж«€р©†њг°Ќж¬ќр ¤Јжѓћж¬µж­ґрўџЌжєµрЈ«›р ЋµрЎҐгќЂеђЎрЈ­љжЇЎрЈ»јжЇњж°·рў’‹р¤Ј±р¦­‘ж±љи€¦ж±№рЈ¶јд“…рЈ¶Ѕр¤†¤р¤¤Њр¤¤Ђ"],
    ["fda1","рЈі‰г›Ґгі«р ґІй®ѓрЈ‡№рў’‘зѕЏж ·р¦ґҐр¦¶Ўр¦·«ж¶–жµњж№јжј„р¤Ґїр¤‚…р¦№Іи”ір¦Ѕґе‡‡жІњжёќиђ®рЁ¬ЎжёЇрЈёЇз‘“рЈѕ‚з§Њж№ЏеЄ‘рЈЃ‹жїёгњЌжѕќрЈё°ж»єрЎ’—р¤ЂЅд••йЏ°жЅ„жЅњгµЋжЅґр©…°гґ»жѕџр¤…„жї“р¤‚‘р¤…•р¤Ђ№рЈї°рЈѕґр¤„їе‡џр¤…–р¤…—р¤…Ђр¦‡ќзЃ‹зЃѕз‚§з‚ЃзѓЊзѓ•зѓ–зѓџд„„г·Ёз†ґз†–р¤‰·з„«з……еЄ€з…Љз…®еІњр¤ЌҐз…ЏйЌўр¤‹Ѓз„¬р¤‘љр¤Ё§р¤Ёўз†єрЁЇЁз‚Ѕз€Ћ"],
    ["fe40","й‘‚з€•е¤‘й‘ѓз€¤йЌЃрҐ…з€®з‰Ђр¤ҐґжўЅз‰•з‰—г№•рЈЃ„ж ЌжјЅзЉ‚зЊЄзЊ«р¤ ЈрЁ «дЈ­рЁ „зЊЁзЊ®зЏЏзЋЄр °єр¦Ё®зЏ‰з‘‰р¤‡ўрЎ›§р¤Ё¤жЈг›…р¤¦·р¤¦Ќр¤§»зЏ·зђ•ж¤ѓр¤Ё¦зђ№р —ѓг»—з‘њрўў­з‘ рЁєІз‘‡зЏ¤з‘¶иЋ№з‘¬гњ°з‘ґйЏ±жЁ¬з’‚дҐ“р¤ЄЊ"],
    ["fea1","р¤…џр¤©№рЁ®Џе­†рЁ°ѓрЎўћз“€рЎ¦€з”Ћз“©з”ћрЁ»™рЎ©‹еЇ—рЁє¬йЋ…з•Ќз•Љз•§з•®р¤ѕ‚гј„р¤ґ“з–Ћз‘ќз–ћз–ґз‚з¬з™‘з™Џз™Їз™¶р¦Џµзљђи‡Їгџёр¦¤‘р¦¤ЋзљЎзљҐзљ·з›Њр¦ѕџи‘ўрҐ‚ќрҐ…ЅрЎёњзњћзњ¦зќЂж’ЇрҐ€ зќрЈЉ¬зћЇрЁҐ¤рЁҐЁрЎ›Ѓзџґз ‰рЎЌ¶р¤Ё’жЈЉзўЇзЈ‡зЈ“йљҐз¤®рҐ— зЈ—з¤ґзў±р§Њиѕёиў„рЁ¬«р¦‚ѓрўњз¦†и¤Ђж¤‚з¦ЂрҐЎ—з¦ќр§¬№з¤јз¦©жёЄр§„¦гєЁз§†р©„Ќз§”"]
    ]
    
    },{}],17:[function(require,module,exports){
    module.exports=[
    ["0","\u0000",127,"в‚¬"],
    ["8140","дё‚дё„дё…дё†дёЏдё’дё—дёџдё дёЎдёЈдё¦дё©дё®дёЇдё±дёідёµдё·дёјд№Ђд№Ѓд№‚д№„д№†д№Љд№‘д№•д№—д№љд№›д№ўд№Јд№¤д№Ґд№§д№Ёд№Є",5,"д№Ід№ґ",9,"д№ї",6,"дє‡дєЉ"],
    ["8180","дєђдє–дє—дє™дєњдєќдєћдєЈдєЄдєЇдє°дє±дєґдє¶дє·дєёдє№дєјдєЅдєѕд»€д»Њд»Џд»ђд»’д»љд»›д»њд» д»ўд»¦д»§д»©д»­д»®д»Їд»±д»ґд»ёд»№д»єд»јд»ѕдјЂдј‚",6,"дј‹дјЊдј’",4,"дјњдјќдјЎдјЈдјЁдј©дј¬дј­дј®дј±дјідјµдј·дј№дј»дјѕ",4,"дЅ„дЅ…дЅ‡",5,"дЅ’дЅ”дЅ–дЅЎдЅўдЅ¦дЅЁдЅЄдЅ«дЅ­дЅ®дЅ±дЅІдЅµдЅ·дЅёдЅ№дЅєдЅЅдѕЂдѕЃдѕ‚дѕ…дѕ†дѕ‡дѕЉдѕЊдѕЋдѕђдѕ’дѕ“дѕ•дѕ–дѕдѕ™дѕљдѕњдѕћдѕџдѕЎдѕў"],
    ["8240","дѕ¤дѕ«дѕ­дѕ°",4,"дѕ¶",8,"дїЂдїЃдї‚дї†дї‡дї€дї‰дї‹дїЊдїЌдї’",4,"дї™дї›дї дїўдї¤дїҐдї§дї«дї¬дї°дїІдїґдїµдї¶дї·дї№дї»дїјдїЅдїї",11],
    ["8280","еЂ‹еЂЋеЂђеЂ‘еЂ“еЂ•еЂ–еЂ—еЂ›еЂќеЂћеЂ еЂўеЂЈеЂ¤еЂ§еЂ«еЂЇ",10,"еЂ»еЂЅеЂїеЃЂеЃЃеЃ‚еЃ„еЃ…еЃ†еЃ‰еЃЉеЃ‹еЃЌеЃђ",4,"еЃ–еЃ—еЃеЃ™еЃ›еЃќ",7,"еЃ¦",5,"еЃ­",8,"еЃёеЃ№еЃєеЃјеЃЅе‚Ѓе‚‚е‚ѓе‚„е‚†е‚‡е‚‰е‚Ље‚‹е‚Ње‚Ћ",20,"е‚¤е‚¦е‚Єе‚«е‚­",4,"е‚і",6,"е‚ј"],
    ["8340","е‚Ѕ",17,"еѓђ",5,"еѓ—еѓеѓ™еѓ›",10,"еѓЁеѓ©еѓЄеѓ«еѓЇеѓ°еѓ±еѓІеѓґеѓ¶",4,"еѓј",9,"е„€"],
    ["8380","е„‰е„Ље„Њ",5,"е„“",13,"е„ў",28,"е…‚е…‡е…Ље…Ње…Ће…Џе…ђе…’е…“е…—е…е…™е…›е…ќ",4,"е…Је…¤е…¦е…§е…©е…Єе…Їе…Іе…єе…ѕе…їе†ѓе†„е††е†‡е†Ље†‹е†Ће†Џе†ђе†‘е†“е†”е†е†ље†ќе†ће†џе†Ўе†Је†¦",4,"е†­е†®е†ґе†ёе†№е†єе†ѕе†їе‡Ѓе‡‚е‡ѓе‡…е‡€е‡Ље‡Ќе‡Ће‡ђе‡’",5],
    ["8440","е‡е‡™е‡ље‡ње‡ће‡џе‡ўе‡Је‡Ґ",5,"е‡¬е‡®е‡±е‡Іе‡ґе‡·е‡ѕе€„е€…е€‰е€‹е€Ње€Џе€ђе€“е€”е€•е€ње€ће€џе€Ўе€ўе€Је€Ґе€¦е€§е€Єе€¬е€Їе€±е€Іе€ґе€µе€је€ѕе‰„",5,"е‰‹е‰Ће‰Џе‰’е‰“е‰•е‰—е‰"],
    ["8480","е‰™е‰ље‰›е‰ќе‰џе‰ е‰ўе‰Је‰¤е‰¦е‰Ёе‰«е‰¬е‰­е‰®е‰°е‰±е‰і",9,"е‰ѕеЉЂеЉѓ",4,"еЉ‰",6,"еЉ‘еЉ’еЉ”",6,"еЉњеЉ¤еЉҐеЉ¦еЉ§еЉ®еЉЇеЉ°еЉґ",9,"е‹Ђе‹Ѓе‹‚е‹„е‹…е‹†е‹€е‹Ље‹Ње‹Ќе‹Ће‹Џе‹‘е‹“е‹”е‹•е‹—е‹™",5,"е‹ е‹Ўе‹ўе‹Је‹Ґ",10,"е‹±",7,"е‹»е‹је‹ЅеЊЃеЊ‚еЊѓеЊ„еЊ‡еЊ‰еЊЉеЊ‹еЊЊеЊЋ"],
    ["8540","еЊ‘еЊ’еЊ“еЊ”еЊеЊ›еЊњеЊћеЊџеЊўеЊ¤еЊҐеЊ§еЊЁеЊ©еЊ«еЊ¬еЊ­еЊЇ",9,"еЊјеЊЅеЌЂеЌ‚еЌ„еЌ†еЌ‹еЌЊеЌЌеЌђеЌ”еЌеЌ™еЌ›еЌќеЌҐеЌЁеЌЄеЌ¬еЌ­еЌІеЌ¶еЌ№еЌ»еЌјеЌЅеЌѕеЋЂеЋЃеЋѓеЋ‡еЋ€еЋЉеЋЋеЋЏ"],
    ["8580","еЋђ",4,"еЋ–еЋ—еЋ™еЋ›еЋњеЋћеЋ еЋЎеЋ¤еЋ§еЋЄеЋ«еЋ¬еЋ­еЋЇ",6,"еЋ·еЋёеЋ№еЋєеЋјеЋЅеЋѕеЏЂеЏѓ",4,"еЏЋеЏЏеЏђеЏ’еЏ“еЏ•еЏљеЏњеЏќеЏћеЏЎеЏўеЏ§еЏґеЏєеЏѕеЏїеђЂеђ‚еђ…еђ‡еђ‹еђ”еђеђ™еђљеђњеђўеђ¤еђҐеђЄеђ°еђіеђ¶еђ·еђєеђЅеђїе‘Ѓе‘‚е‘„е‘…е‘‡е‘‰е‘Ње‘Ќе‘Ће‘Џе‘‘е‘ље‘ќ",4,"е‘Је‘Ґе‘§е‘©",7,"е‘ґе‘№е‘єе‘ѕе‘їе’Ѓе’ѓе’…е’‡е’€е’‰е’Ље’Ќе’‘е’“е’—е’е’ње’ће’џе’ е’Ў"],
    ["8640","е’ўе’Ґе’®е’°е’Іе’µе’¶е’·е’№е’єе’је’ѕе“ѓе“…е“Ље“‹е“–е“е“›е“ ",4,"е“«е“¬е“Їе“°е“±е“ґ",5,"е“»е“ѕе”Ђе”‚е”ѓе”„е”…е”€е”Љ",4,"е”’е”“е”•",5,"е”ње”ќе”ће”џе”Ўе”Ґе”¦"],
    ["8680","е”Ёе”©е”«е”­е”Іе”ґе”µе”¶е”ёе”№е”єе”»е”Ѕе•Ђе•‚е•…е•‡е•€е•‹",4,"е•‘е•’е•“е•”е•—",4,"е•ќе•ће•џе• е•ўе•Је•Ёе•©е•«е•Ї",5,"е•№е•єе•Ѕе•їе–…е–†е–Ње–Ќе–Ће–ђе–’е–“е–•е––е–—е–ље–›е–ће– ",6,"е–Ё",8,"е–Іе–ґе–¶е–ёе–єе–је–ї",4,"е—†е—‡е—€е—Ље—‹е—Ће—Џе—ђе—•е——",4,"е—ће— е—ўе—§е—©е—­е—®е—°е—±е—ґе—¶е—ё",4,"е—їе‚еѓе„е…"],
    ["8740","е†е‡еЉе‹еЌеђ",7,"е™ељењеќе еЎеўеҐе¦еЁе©еЄе«е®еЇе°еіеµе·еёеєејеЅеѕе™Ђ",11,"е™Џ",4,"е™•е™–е™ље™›е™ќ",4],
    ["8780","е™Је™Ґе™¦е™§е™­е™®е™Їе™°е™Іе™іе™ґе™µе™·е™ёе™№е™єе™Ѕ",7,"ељ‡",6,"ељђељ‘ељ’ељ”",14,"ељ¤",10,"ељ°",6,"ељёељ№ељєељ»ељЅ",12,"е›‹",8,"е›•е›–е›е›™е›ње›Је›Ґ",5,"е›¬е›®е›Їе›Іе›іе›¶е›·е›ёе›»е›јењЂењЃењ‚ењ…ењ‡ењ‹",6],
    ["8840","ењ’",9,"ењќењћењ ењЎењўењ¤ењҐењ¦ењ§ењ«ењ±ењІењґ",4,"ењјењЅењїеќЃеќѓеќ„еќ…еќ†еќ€еќ‰еќ‹еќ’",4,"еќеќ™еќўеќЈеќҐеќ§еќ¬еќ®еќ°еќ±еќІеќґеќµеќёеќ№еќєеќЅеќѕеќїећЂ"],
    ["8880","ећЃећ‡ећ€ећ‰ећЉећЌ",4,"ећ”",6,"ећњећќећћећџећҐећЁећЄећ¬ећЇећ°ећ±ећіећµећ¶ећ·ећ№",8,"еџ„",6,"еџЊеџЌеџђеџ‘еџ“еџ–еџ—еџ›еџњеџћеџЎеџўеџЈеџҐ",7,"еџ®еџ°еџ±еџІеџіеџµеџ¶еџ·еџ»еџјеџѕеџїе Ѓе ѓе „е …е €е ‰е Ље Ње Ће Џе ђе ’е “е ”е –е —е е ље ›е ње ќе џе ўе Је Ґ",4,"е «",4,"е ±е Іе іе ґе ¶",7],
    ["8940","е ѕ",5,"еЎ…",6,"еЎЋеЎЏеЎђеЎ’еЎ“еЎ•еЎ–еЎ—еЎ™",4,"еЎџ",5,"еЎ¦",4,"еЎ­",16,"еЎїеў‚еў„еў†еў‡еў€еўЉеў‹еўЊ"],
    ["8980","еўЌ",4,"еў”",4,"еў›еўњеўќеў ",7,"еўЄ",17,"еўЅеўѕеўїеЈЂеЈ‚еЈѓеЈ„еЈ†",10,"еЈ’еЈ“еЈ”еЈ–",13,"еЈҐ",5,"еЈ­еЈЇеЈ±еЈІеЈґеЈµеЈ·еЈёеЈє",7,"е¤ѓе¤…е¤†е¤€",4,"е¤Ће¤ђе¤‘е¤’е¤“е¤—е¤е¤›е¤ќе¤ће¤ е¤Ўе¤ўе¤Је¤¦е¤Ёе¤¬е¤°е¤Іе¤іе¤µе¤¶е¤»"],
    ["8a40","е¤Ѕе¤ѕе¤їеҐЂеҐѓеҐ…еҐ†еҐЉеҐЊеҐЌеҐђеҐ’еҐ“еҐ™еҐ›",4,"еҐЎеҐЈеҐ¤еҐ¦",12,"еҐµеҐ·еҐєеҐ»еҐјеҐѕеҐїе¦Ђе¦…е¦‰е¦‹е¦Ње¦Ће¦Џе¦ђе¦‘е¦”е¦•е¦е¦ље¦›е¦ње¦ќе¦џе¦ е¦Ўе¦ўе¦¦"],
    ["8a80","е¦§е¦¬е¦­е¦°е¦±е¦і",5,"е¦єе¦је¦Ѕе¦ї",6,"е§‡е§€е§‰е§Ње§Ќе§Ће§Џе§•е§–е§™е§›е§ћ",4,"е§¤е§¦е§§е§©е§Єе§«е§­",11,"е§єе§је§Ѕе§ѕеЁЂеЁ‚еЁЉеЁ‹еЁЌеЁЋеЁЏеЁђеЁ’еЁ”еЁ•еЁ–еЁ—еЁ™еЁљеЁ›еЁќеЁћеЁЎеЁўеЁ¤еЁ¦еЁ§еЁЁеЁЄ",6,"еЁіеЁµеЁ·",4,"еЁЅеЁѕеЁїе©Ѓ",4,"е©‡е©€е©‹",9,"е©–е©—е©е©™е©›",5],
    ["8b40","е©Ўе©Је©¤е©Ґе©¦е©Ёе©©е©«",8,"е©ёе©№е©»е©је©Ѕе©ѕеЄЂ",17,"еЄ“",6,"еЄњ",13,"еЄ«еЄ¬"],
    ["8b80","еЄ­",4,"еЄґеЄ¶еЄ·еЄ№",4,"еЄїе«Ђе«ѓ",5,"е«Ље«‹е«Ќ",4,"е«“е«•е«—е«™е«ље«›е«ќе«ће«џе«ўе«¤е«Ґе«§е«Ёе«Єе«¬",4,"е«І",22,"е¬Љ",11,"е¬",25,"е¬іе¬µе¬¶е¬ё",7,"е­Ѓ",6],
    ["8c40","е­€",7,"е­’е­–е­ће­ е­Ўе­§е­Ёе­«е­­е­®е­Їе­Іе­ґе­¶е­·е­ёе­№е­»е­је­ѕе­їе®‚е®†е®Ље®Ќе®Ће®ђе®‘е®’е®”е®–е®џе®§е®Ёе®©е®¬е®­е®®е®Їе®±е®Іе®·е®єе®»е®јеЇЂеЇЃеЇѓеЇ€еЇ‰еЇЉеЇ‹еЇЌеЇЋеЇЏ"],
    ["8c80","еЇ‘еЇ”",8,"еЇ еЇўеЇЈеЇ¦еЇ§еЇ©",4,"еЇЇеЇ±",6,"еЇЅеЇѕе°Ђе°‚е°ѓе°…е°‡е°€е°‹е°Ње°Ќе°Ће°ђе°’е°“е°—е°™е°›е°ће°џе° е°Ўе°Је°¦е°Ёе°©е°Єе°«е°­е°®е°Їе°°е°Іе°іе°µе°¶е°·е±ѓе±„е±†е±‡е±Ње±Ќе±’е±“е±”е±–е±—е±е±ље±›е±ње±ќе±џе±ўе±¤е±§",6,"е±°е±І",6,"е±»е±је±Ѕе±ѕеІЂеІѓ",4,"еІ‰еІЉеІ‹еІЋеІЏеІ’еІ“еІ•еІќ",4,"еІ¤",4],
    ["8d40","еІЄеІ®еІЇеІ°еІІеІґеІ¶еІ№еІєеІ»еІјеІѕеіЂеі‚еіѓеі…",5,"еіЊ",5,"еі“",5,"еіљ",6,"еіўеіЈеі§еі©еі«еі¬еі®еіЇеі±",9,"еіј",4],
    ["8d80","еґЃеґ„еґ…еґ€",5,"еґЏ",4,"еґ•еґ—еґеґ™еґљеґњеґќеґџ",4,"еґҐеґЁеґЄеґ«еґ¬еґЇ",4,"еґµ",7,"еґї",7,"еµ€еµ‰еµЌ",10,"еµ™еµљеµњеµћ",10,"еµЄеµ­еµ®еµ°еµ±еµІеµіеµµ",12,"е¶ѓ",21,"е¶ље¶›е¶ње¶ће¶џе¶ "],
    ["8e40","е¶Ў",21,"е¶ё",12,"е·†",6,"е·Ћ",12,"е·ње·џе· е·Је·¤е·Єе·¬е·­"],
    ["8e80","е·°е·µе·¶е·ё",4,"е·їеёЂеё„её‡её‰еёЉеё‹еёЌеёЋеё’её“её—еёћ",7,"еёЁ",4,"еёЇеё°еёІ",4,"её№еёєеёѕеёїе№Ђе№Ѓе№ѓе№†",5,"е№Ќ",6,"е№–",4,"е№ње№ќе№џе№ е№Ј",14,"е№µе№·е№№е№ѕеєЃеє‚еєѓеє…еє€еє‰еєЊеєЌеєЋеє’еєеє›еєќеєЎеєўеєЈеє¤еєЁ",4,"еє®",4,"еєґеєєеє»еєјеєЅеєї",6],
    ["8f40","е»†е»‡е»€е»‹",5,"е»”е»•е»—е»е»™е»ље»њ",11,"е»©е»«",8,"е»µе»ёе»№е»»е»је»Ѕеј…еј†еј‡еј‰ејЊејЌејЋејђеј’еј”еј–еј™ејљејњејќејћејЎејўејЈеј¤"],
    ["8f80","ејЁеј«еј¬еј®еј°ејІ",6,"еј»ејЅејѕејїеЅЃ",14,"еЅ‘еЅ”еЅ™еЅљеЅ›еЅњеЅћеЅџеЅ еЅЈеЅҐеЅ§еЅЁеЅ«еЅ®еЅЇеЅІеЅґеЅµеЅ¶еЅёеЅєеЅЅеЅѕеЅїеѕѓеѕ†еѕЌеѕЋеѕЏеѕ‘еѕ“еѕ”еѕ–еѕљеѕ›еѕќеѕћеѕџеѕ еѕў",5,"еѕ©еѕ«еѕ¬еѕЇ",5,"еѕ¶еѕёеѕ№еѕєеѕ»еѕѕ",4,"еї‡еї€еїЉеї‹еїЋеї“еї”еї•еїљеї›еїњеїћеїџеїўеїЈеїҐеї¦еїЁеї©еї¬еїЇеї°еїІеїіеїґеї¶еї·еї№еїєеїјжЂ‡"],
    ["9040","жЂ€жЂ‰жЂ‹жЂЊжЂђжЂ‘жЂ“жЂ—жЂжЂљжЂћжЂџжЂўжЂЈжЂ¤жЂ¬жЂ­жЂ®жЂ°",4,"жЂ¶",4,"жЂЅжЂѕжЃЂжЃ„",6,"жЃЊжЃЋжЃЏжЃ‘жЃ“жЃ”жЃ–жЃ—жЃжЃ›жЃњжЃћжЃџжЃ жЃЎжЃҐжЃ¦жЃ®жЃ±жЃІжЃґжЃµжЃ·жЃѕж‚Ђ"],
    ["9080","ж‚Ѓж‚‚ж‚…ж‚†ж‚‡ж‚€ж‚Љж‚‹ж‚Ћж‚Џж‚ђж‚‘ж‚“ж‚•ж‚—ж‚ж‚™ж‚њж‚ћж‚Ўж‚ўж‚¤ж‚Ґж‚§ж‚©ж‚Єж‚®ж‚°ж‚іж‚µж‚¶ж‚·ж‚№ж‚єж‚Ѕ",7,"жѓ‡жѓ€жѓ‰жѓЊ",4,"жѓ’жѓ“жѓ”жѓ–жѓ—жѓ™жѓ›жѓћжѓЎ",4,"жѓЄжѓ±жѓІжѓµжѓ·жѓёжѓ»",4,"ж„‚ж„ѓж„„ж„…ж„‡ж„Љж„‹ж„Њж„ђ",4,"ж„–ж„—ж„ж„™ж„›ж„њж„ќж„ћж„Ўж„ўж„Ґж„Ёж„©ж„Єж„¬",18,"ж…Ђ",6],
    ["9140","ж…‡ж…‰ж…‹ж…Ќж…Џж…ђж…’ж…“ж…”ж…–",6,"ж…ћж…џж… ж…Ўж…Јж…¤ж…Ґж…¦ж…©",6,"ж…±ж…Іж…іж…ґж…¶ж…ё",18,"ж†Њж†Ќж†Џ",4,"ж†•"],
    ["9180","ж†–",6,"ж†ћ",8,"ж†Єж†«ж†­",9,"ж†ё",5,"ж†їж‡Ђж‡Ѓж‡ѓ",4,"ж‡‰ж‡Њ",4,"ж‡“ж‡•",16,"ж‡§",13,"ж‡¶",8,"ж€Ђ",5,"ж€‡ж€‰ж€“ж€”ж€™ж€њж€ќж€ћж€ ж€Јж€¦ж€§ж€Ёж€©ж€«ж€­ж€Їж€°ж€±ж€Іж€µж€¶ж€ё",4,"ж‰‚ж‰„ж‰…ж‰†ж‰Љ"],
    ["9240","ж‰Џж‰ђж‰•ж‰–ж‰—ж‰™ж‰љж‰њ",6,"ж‰¤ж‰Ґж‰Ёж‰±ж‰Іж‰ґж‰µж‰·ж‰ёж‰єж‰»ж‰ЅжЉЃжЉ‚жЉѓжЉ…жЉ†жЉ‡жЉ€жЉ‹",5,"жЉ”жЉ™жЉњжЉќжЉћжЉЈжЉ¦жЉ§жЉ©жЉЄжЉ­жЉ®жЉЇжЉ°жЉІжЉіжЉґжЉ¶жЉ·жЉёжЉєжЉѕж‹Ђж‹Ѓ"],
    ["9280","ж‹ѓж‹‹ж‹Џж‹‘ж‹•ж‹ќж‹ћж‹ ж‹Ўж‹¤ж‹Єж‹«ж‹°ж‹Іж‹µж‹ёж‹№ж‹єж‹»жЊЂжЊѓжЊ„жЊ…жЊ†жЊЉжЊ‹жЊЊжЊЌжЊЏжЊђжЊ’жЊ“жЊ”жЊ•жЊ—жЊжЊ™жЊњжЊ¦жЊ§жЊ©жЊ¬жЊ­жЊ®жЊ°жЊ±жЊі",5,"жЊ»жЊјжЊѕжЊїжЌЂжЌЃжЌ„жЌ‡жЌ€жЌЉжЌ‘жЌ’жЌ“жЌ”жЌ–",7,"жЌ жЌ¤жЌҐжЌ¦жЌЁжЌЄжЌ«жЌ¬жЌЇжЌ°жЌІжЌіжЌґжЌµжЌёжЌ№жЌјжЌЅжЌѕжЌїжЋЃжЋѓжЋ„жЋ…жЋ†жЋ‹жЋЌжЋ‘жЋ“жЋ”жЋ•жЋ—жЋ™",6,"жЋЎжЋ¤жЋ¦жЋ«жЋЇжЋ±жЋІжЋµжЋ¶жЋ№жЋ»жЋЅжЋїжЏЂ"],
    ["9340","жЏЃжЏ‚жЏѓжЏ…жЏ‡жЏ€жЏЉжЏ‹жЏЊжЏ‘жЏ“жЏ”жЏ•жЏ—",6,"жЏџжЏўжЏ¤",4,"жЏ«жЏ¬жЏ®жЏЇжЏ°жЏ±жЏіжЏµжЏ·жЏ№жЏєжЏ»жЏјжЏѕжђѓжђ„жђ†",4,"жђЌжђЋжђ‘жђ’жђ•",5,"жђќжђџжђўжђЈжђ¤"],
    ["9380","жђҐжђ§жђЁжђ©жђ«жђ®",5,"жђµ",4,"жђ»жђјжђѕж‘Ђж‘‚ж‘ѓж‘‰ж‘‹",6,"ж‘“ж‘•ж‘–ж‘—ж‘™",4,"ж‘џ",7,"ж‘Ёж‘Єж‘«ж‘¬ж‘®",9,"ж‘»",6,"ж’ѓж’†ж’€",8,"ж’“ж’”ж’—ж’ж’љж’›ж’њж’ќж’џ",4,"ж’Ґж’¦ж’§ж’Ёж’Єж’«ж’Їж’±ж’Іж’іж’ґж’¶ж’№ж’»ж’Ѕж’ѕж’їж“Ѓж“ѓж“„ж“†",6,"ж“Џж“‘ж““ж“”ж“•ж“–ж“™ж“љ"],
    ["9440","ж“›ж“њж“ќж“џж“ ж“Ўж“Јж“Ґж“§",24,"ж”Ѓ",7,"ж”Љ",7,"ж”“",4,"ж”™",8],
    ["9480","ж”ўж”Јж”¤ж”¦",4,"ж”¬ж”­ж”°ж”±ж”Іж”іж”·ж”єж”јж”Ѕж•Ђ",4,"ж•†ж•‡ж•Љж•‹ж•Ќж•Ћж•ђж•’ж•“ж•”ж•—ж•ж•љж•њж•џж• ж•Ўж•¤ж•Ґж•§ж•Ёж•©ж•Єж•­ж•®ж•Їж•±ж•іж•µж•¶ж•ё",14,"ж–€ж–‰ж–Љж–Ќж–Ћж–Џж–’ж–”ж–•ж––ж–ж–љж–ќж–ћж– ж–ўж–Јж–¦ж–Ёж–Єж–¬ж–®ж–±",7,"ж–єж–»ж–ѕж–їж—Ђж—‚ж—‡ж—€ж—‰ж—Љж—Ќж—ђж—‘ж—“ж—”ж—•ж—",7,"ж—Ўж—Јж—¤ж—Єж—«"],
    ["9540","ж—Іж—іж—ґж—µж—ёж—№ж—»",4,"жЃж„ж…ж‡ж€ж‰ж‹жЌжђж‘ж’ж–ж—жжљж›жњжћжЎжўжЈж¤ж¦ж©жЄж«ж¬ж®ж°жІжіж·",4,"жЅжїж™Ђж™‚ж™„",6,"ж™Ќж™Ћж™ђж™‘ж™"],
    ["9580","ж™™ж™›ж™њж™ќж™ћж™ ж™ўж™Јж™Ґж™§ж™©",4,"ж™±ж™Іж™іж™µж™ёж™№ж™»ж™јж™Ѕж™їжљЂжљЃжљѓжљ…жљ†жљ€жљ‰жљЉжљ‹жљЌжљЋжљЏжљђжљ’жљ“жљ”жљ•жљ",4,"жљћ",8,"жљ©",4,"жљЇ",4,"жљµжљ¶жљ·жљёжљєжљ»жљјжљЅжљї",25,"ж›љж›ћ",7,"ж›§ж›Ёж›Є",5,"ж›±ж›µж›¶ж›ёж›єж›»ж›ЅжњЃжњ‚жњѓ"],
    ["9640","жњ„жњ…жњ†жњ‡жњЊжњЋжњЏжњ‘жњ’жњ“жњ–жњжњ™жњљжњњжњћжњ ",5,"жњ§жњ©жњ®жњ°жњІжњіжњ¶жњ·жњёжњ№жњ»жњјжњѕжњїжќЃжќ„жќ…жќ‡жќЉжќ‹жќЌжќ’жќ”жќ•жќ—",4,"жќќжќўжќЈжќ¤жќ¦жќ§жќ«жќ¬жќ®жќ±жќґжќ¶"],
    ["9680","жќёжќ№жќєжќ»жќЅжћЂжћ‚жћѓжћ…жћ†жћ€жћЉжћЊжћЌжћЋжћЏжћ‘жћ’жћ“жћ”жћ–жћ™жћ›жћџжћ жћЎжћ¤жћ¦жћ©жћ¬жћ®жћ±жћІжћґжћ№",7,"жџ‚жџ…",9,"жџ•жџ–жџ—жџ›жџџжџЎжџЈжџ¤жџ¦жџ§жџЁжџЄжџ«жџ­жџ®жџІжџµ",7,"жџѕж Ѓж ‚ж ѓж „ж †ж Ќж ђж ’ж ”ж •ж ",4,"ж ћж џж  ж ў",6,"ж «",6,"ж ґж µж ¶ж єж »ж їжЎ‡жЎ‹жЎЌжЎЏжЎ’жЎ–",5],
    ["9740","жЎњжЎќжЎћжЎџжЎЄжЎ¬",7,"жЎµжЎё",8,"жў‚жў„жў‡",7,"жўђжў‘жў’жў”жў•жў–жў",9,"жўЈжў¤жўҐжў©жўЄжў«жў¬жў®жў±жўІжўґжў¶жў·жўё"],
    ["9780","жў№",6,"жЈЃжЈѓ",5,"жЈЉжЈЊжЈЋжЈЏжЈђжЈ‘жЈ“жЈ”жЈ–жЈ—жЈ™жЈ›",4,"жЈЎжЈўжЈ¤",9,"жЈЇжЈІжЈіжЈґжЈ¶жЈ·жЈёжЈ»жЈЅжЈѕжЈїж¤Ђж¤‚ж¤ѓж¤„ж¤†",4,"ж¤Њж¤Џж¤‘ж¤“",11,"ж¤Ўж¤ўж¤Јж¤Ґ",7,"ж¤®ж¤Їж¤±ж¤Іж¤іж¤µж¤¶ж¤·ж¤ёж¤єж¤»ж¤јж¤ѕжҐЂжҐЃжҐѓ",16,"жҐ•жҐ–жҐжҐ™жҐ›жҐњжҐџ"],
    ["9840","жҐЎжҐўжҐ¤жҐҐжҐ§жҐЁжҐ©жҐЄжҐ¬жҐ­жҐЇжҐ°жҐІ",4,"жҐєжҐ»жҐЅжҐѕжҐїж¦Ѓж¦ѓж¦…ж¦Љж¦‹ж¦Њж¦Ћ",5,"ж¦–ж¦—ж¦™ж¦љж¦ќ",9,"ж¦©ж¦Єж¦¬ж¦®ж¦Їж¦°ж¦Іж¦іж¦µж¦¶ж¦ёж¦№ж¦єж¦јж¦Ѕ"],
    ["9880","ж¦ѕж¦їж§Ђж§‚",7,"ж§‹ж§Ќж§Џж§‘ж§’ж§“ж§•",5,"ж§њж§ќж§ћж§Ў",11,"ж§®ж§Їж§°ж§±ж§і",9,"ж§ѕжЁЂ",9,"жЁ‹",11,"жЁ™",5,"жЁ жЁў",5,"жЁ©жЁ«жЁ¬жЁ­жЁ®жЁ°жЁІжЁіжЁґжЁ¶",6,"жЁї",4,"ж©…ж©†ж©€",7,"ж©‘",6,"ж©љ"],
    ["9940","ж©њ",4,"ж©ўж©Јж©¤ж©¦",10,"ж©І",6,"ж©єж©»ж©Ѕж©ѕж©їжЄЃжЄ‚жЄѓжЄ…",8,"жЄЏжЄ’",4,"жЄ",7,"жЄЎ",5],
    ["9980","жЄ§жЄЁжЄЄжЄ­",114,"ж¬Ґж¬¦ж¬Ё",6],
    ["9a40","ж¬Їж¬°ж¬±ж¬іж¬ґж¬µж¬¶ж¬ёж¬»ж¬јж¬Ѕж¬їж­Ђж­Ѓж­‚ж­„ж­…ж­€ж­Љж­‹ж­Ќ",11,"ж­љ",7,"ж­Ёж­©ж­«",13,"ж­єж­Ѕж­ѕж­їж®Ђж®…ж®€"],
    ["9a80","ж®Њж®Ћж®Џж®ђж®‘ж®”ж®•ж®—ж®ж®™ж®њ",4,"ж®ў",7,"ж®«",7,"ж®¶ж®ё",6,"жЇЂжЇѓжЇ„жЇ†",4,"жЇЊжЇЋжЇђжЇ‘жЇжЇљжЇњ",4,"жЇў",7,"жЇ¬жЇ­жЇ®жЇ°жЇ±жЇІжЇґжЇ¶жЇ·жЇёжЇєжЇ»жЇјжЇѕ",6,"ж°€",4,"ж°Ћж°’ж°—ж°њж°ќж°ћж° ж°Јж°Ґж°«ж°¬ж°­ж°±ж°іж°¶ж°·ж°№ж°єж°»ж°јж°ѕж°їж±ѓж±„ж±…ж±€ж±‹",4,"ж±‘ж±’ж±“ж±–ж±"],
    ["9b40","ж±™ж±љж±ўж±Јж±Ґж±¦ж±§ж±«",4,"ж±±ж±іж±µж±·ж±ёж±єж±»ж±јж±їжІЂжІ„жІ‡жІЉжІ‹жІЌжІЋжІ‘жІ’жІ•жІ–жІ—жІжІљжІњжІќжІћжІ жІўжІЁжІ¬жІЇжІ°жІґжІµжІ¶жІ·жІєжіЂжіЃжі‚жіѓжі†жі‡жі€жі‹жіЌжіЋжіЏжі‘жі’жі"],
    ["9b80","жі™жіљжіњжіќжіџжі¤жі¦жі§жі©жі¬жі­жіІжіґжі№жіїжґЂжґ‚жґѓжґ…жґ†жґ€жґ‰жґЉжґЌжґЏжґђжґ‘жґ“жґ”жґ•жґ–жґжґњжґќжґџ",5,"жґ¦жґЁжґ©жґ¬жґ­жґЇжґ°жґґжґ¶жґ·жґёжґєжґїжµЂжµ‚жµ„жµ‰жµЊжµђжµ•жµ–жµ—жµжµ›жµќжµџжµЎжµўжµ¤жµҐжµ§жµЁжµ«жµ¬жµ­жµ°жµ±жµІжµіжµµжµ¶жµ№жµєжµ»жµЅ",4,"ж¶ѓж¶„ж¶†ж¶‡ж¶Љж¶‹ж¶Ќж¶Џж¶ђж¶’ж¶–",4,"ж¶њж¶ўж¶Ґж¶¬ж¶­ж¶°ж¶±ж¶іж¶ґж¶¶ж¶·ж¶№",5,"ж·Ѓж·‚ж·ѓж·€ж·‰ж·Љ"],
    ["9c40","ж·Ќж·Ћж·Џж·ђж·’ж·“ж·”ж·•ж·—ж·љж·›ж·њж·џж·ўж·Јж·Ґж·§ж·Ёж·©ж·Єж·­ж·Їж·°ж·Іж·ґж·µж·¶ж·ёж·єж·Ѕ",7,"жё†жё‡жё€жё‰жё‹жёЏжё’жё“жё•жёжё™жё›жёњжёћжёџжёўжё¦жё§жёЁжёЄжё¬жё®жё°жё±жёіжёµ"],
    ["9c80","жё¶жё·жё№жё»",7,"ж№…",7,"ж№Џж№ђж№‘ж№’ж№•ж№—ж№™ж№љж№њж№ќж№ћж№ ",10,"ж№¬ж№­ж№Ї",14,"жєЂжєЃжє‚жє„жє‡жє€жєЉ",4,"жє‘",6,"жє™жєљжє›жєќжєћжє жєЎжєЈжє¤жє¦жєЁжє©жє«жє¬жє­жє®жє°жєіжєµжєёжє№жєјжєѕжєїж»Ђж»ѓж»„ж»…ж»†ж»€ж»‰ж»Љж»Њж»Ќж»Ћж»ђж»’ж»–ж»ж»™ж»›ж»њж»ќж»Јж»§ж»Є",5],
    ["9d40","ж»°ж»±ж»Іж»іж»µж»¶ж»·ж»ёж»є",7,"жјѓжј„жј…жј‡жј€жјЉ",4,"жјђжј‘жј’жј–",9,"жјЎжјўжјЈжјҐжј¦жј§жјЁжј¬жј®жј°жјІжјґжјµжј·",6,"жјїжЅЂжЅЃжЅ‚"],
    ["9d80","жЅѓжЅ„жЅ…жЅ€жЅ‰жЅЉжЅЊжЅЋ",9,"жЅ™жЅљжЅ›жЅќжЅџжЅ жЅЎжЅЈжЅ¤жЅҐжЅ§",5,"жЅЇжЅ°жЅ±жЅіжЅµжЅ¶жЅ·жЅ№жЅ»жЅЅ",6,"жѕ…жѕ†жѕ‡жѕЉжѕ‹жѕЏ",12,"жѕќжѕћжѕџжѕ жѕў",4,"жѕЁ",10,"жѕґжѕµжѕ·жѕёжѕє",5,"жїЃжїѓ",5,"жїЉ",6,"жї“",10,"жїџжїўжїЈжї¤жїҐ"],
    ["9e40","жї¦",7,"жї°",32,"зЂ’",7,"зЂњ",6,"зЂ¤",6],
    ["9e80","зЂ«",9,"зЂ¶зЂ·зЂёзЂє",17,"зЃЌзЃЋзЃђ",13,"зЃџ",11,"зЃ®зЃ±зЃІзЃізЃґзЃ·зЃ№зЃєзЃ»зЃЅз‚Ѓз‚‚з‚ѓз‚„з‚†з‚‡з‚€з‚‹з‚Њз‚Ќз‚Џз‚ђз‚‘з‚“з‚—з‚з‚љз‚›з‚ћ",12,"з‚°з‚Із‚ґз‚µз‚¶з‚єз‚ѕз‚їзѓ„зѓ…зѓ†зѓ‡зѓ‰зѓ‹",12,"зѓљ"],
    ["9f40","зѓњзѓќзѓћзѓ зѓЎзѓўзѓЈзѓҐзѓЄзѓ®зѓ°",6,"зѓёзѓєзѓ»зѓјзѓѕ",10,"з„‹",4,"з„‘з„’з„”з„—з„›",10,"з„§",7,"з„Із„із„ґ"],
    ["9f80","з„µз„·",13,"з…†з…‡з…€з…‰з…‹з…Ќз…Џ",12,"з…ќз…џ",4,"з…Ґз…©",4,"з…Їз…°з…±з…ґз…µз…¶з…·з…№з…»з…јз…ѕ",5,"з†…",4,"з†‹з†Њз†Ќз†Ћз†ђз†‘з†’з†“з†•з†–з†—з†љ",4,"з†Ў",6,"з†©з†Єз†«з†­",5,"з†ґз†¶з†·з†ёз†є",8,"з‡„",9,"з‡Џ",4],
    ["a040","з‡–",9,"з‡Ўз‡ўз‡Јз‡¤з‡¦з‡Ё",5,"з‡Ї",9,"з‡є",11,"з€‡",19],
    ["a080","з€›з€њз€ћ",9,"з€©з€«з€­з€®з€Їз€Із€із€ґз€єз€јз€ѕз‰Ђ",6,"з‰‰з‰Љз‰‹з‰Ћз‰Џз‰ђз‰‘з‰“з‰”з‰•з‰—з‰з‰љз‰њз‰ћз‰ з‰Јз‰¤з‰Ґз‰Ёз‰Єз‰«з‰¬з‰­з‰°з‰±з‰із‰ґз‰¶з‰·з‰ёз‰»з‰јз‰ЅзЉ‚зЉѓзЉ…",4,"зЉЊзЉЋзЉђзЉ‘зЉ“",11,"зЉ ",11,"зЉ®зЉ±зЉІзЉізЉµзЉє",6,"з‹…з‹†з‹‡з‹‰з‹Љз‹‹з‹Њз‹Џз‹‘з‹“з‹”з‹•з‹–з‹з‹љз‹›"],
    ["a1a1","гЂЂгЂЃгЂ‚В·Л‰Л‡ВЁгЂѓгЂ…вЂ”пЅћвЂ–вЂ¦вЂвЂ™вЂњвЂќгЂ”гЂ•гЂ€",7,"гЂ–гЂ—гЂђгЂ‘В±Г—Г·в€¶в€§в€Ёв€‘в€Џв€Єв€©в€€в€·в€љвЉҐв€Ґв€ вЊ’вЉ™в€«в€®в‰Ўв‰Њв‰€в€Ѕв€ќв‰ в‰®в‰Їв‰¤в‰Ґв€ћв€µв€ґв™‚в™ЂВ°вЂІвЂів„ѓпј„В¤пї пїЎвЂ°В§в„–в†в…в—‹в—Џв—Ћв—‡в—†в–Ўв– в–ів–ІвЂ»в†’в†ђв†‘в†“гЂ“"],
    ["a2a1","в…°",9],
    ["a2b1","в’€",19,"в‘ґ",19,"в‘ ",9],
    ["a2e5","г€ ",9],
    ["a2f1","в… ",11],
    ["a3a1","пјЃпј‚пјѓпїҐпј…",88,"пїЈ"],
    ["a4a1","гЃЃ",82],
    ["a5a1","г‚Ў",85],
    ["a6a1","О‘",16,"ОЈ",6],
    ["a6c1","О±",16,"Пѓ",6],
    ["a6e0","пёµпё¶пё№пёєпёїп№ЂпёЅпёѕп№Ѓп№‚п№ѓп№„"],
    ["a6ee","пё»пёјпё·пёёпё±"],
    ["a6f4","пёіпёґ"],
    ["a7a1","Рђ",5,"РЃР–",25],
    ["a7d1","Р°",5,"С‘Р¶",25],
    ["a840","ЛЉЛ‹Л™вЂ“вЂ•вЂҐвЂµв„…в„‰в†–в†—в†в†™в€•в€џв€Јв‰’в‰¦в‰§вЉїв•ђ",35,"в–Ѓ",6],
    ["a880","в–€",7,"в–“в–”в–•в–јв–Ѕв—ўв—Јв—¤в—Ґв‰вЉ•гЂ’гЂќгЂћ"],
    ["a8a1","ДЃГЎЗЋГ Д“Г©Д›ГЁД«Г­ЗђГ¬ЕЌГіЗ’ГІЕ«ГєЗ”Г№З–ЗЗљЗњГјГЄЙ‘"],
    ["a8bd","Е„Е€"],
    ["a8c0","ЙЎ"],
    ["a8c5","г„…",36],
    ["a940","гЂЎ",8,"гЉЈгЋЋгЋЏгЋњгЋќгЋћгЋЎгЏ„гЏЋгЏ‘гЏ’гЏ•пё°пїўпї¤"],
    ["a959","в„Ўг€±"],
    ["a95c","вЂђ"],
    ["a960","гѓјг‚›г‚њгѓЅгѓѕгЂ†г‚ќг‚ћп№‰",9,"п№”п№•п№–п№—п№™",8],
    ["a980","п№ў",4,"п№Ёп№©п№Єп№«"],
    ["a996","гЂ‡"],
    ["a9a4","в”Ђ",75],
    ["aa40","з‹њз‹ќз‹џз‹ў",5,"з‹Єз‹«з‹µз‹¶з‹№з‹Ѕз‹ѕз‹їзЊЂзЊ‚зЊ„",5,"зЊ‹зЊЊзЊЌзЊЏзЊђзЊ‘зЊ’зЊ”зЊзЊ™зЊљзЊџзЊ зЊЈзЊ¤зЊ¦зЊ§зЊЁзЊ­зЊЇзЊ°зЊІзЊізЊµзЊ¶зЊєзЊ»зЊјзЊЅзЌЂ",8],
    ["aa80","зЌ‰зЌЉзЌ‹зЌЊзЌЋзЌЏзЌ‘зЌ“зЌ”зЌ•зЌ–зЌ",7,"зЌЎ",10,"зЌ®зЌ°зЌ±"],
    ["ab40","зЌІ",11,"зЌї",4,"зЋ…зЋ†зЋ€зЋЉзЋЊзЋЌзЋЏзЋђзЋ’зЋ“зЋ”зЋ•зЋ—зЋзЋ™зЋљзЋњзЋќзЋћзЋ зЋЎзЋЈ",5,"зЋЄзЋ¬зЋ­зЋ±зЋґзЋµзЋ¶зЋёзЋ№зЋјзЋЅзЋѕзЋїзЏЃзЏѓ",4],
    ["ab80","зЏ‹зЏЊзЏЋзЏ’",6,"зЏљзЏ›зЏњзЏќзЏџзЏЎзЏўзЏЈзЏ¤зЏ¦зЏЁзЏЄзЏ«зЏ¬зЏ®зЏЇзЏ°зЏ±зЏі",4],
    ["ac40","зЏё",10,"зђ„зђ‡зђ€зђ‹зђЊзђЌзђЋзђ‘",8,"зђњ",5,"зђЈзђ¤зђ§зђ©зђ«зђ­зђЇзђ±зђІзђ·",4,"зђЅзђѕзђїз‘Ђз‘‚",11],
    ["ac80","з‘Ћ",6,"з‘–з‘з‘ќз‘ ",12,"з‘®з‘Їз‘±",4,"з‘ёз‘№з‘є"],
    ["ad40","з‘»з‘јз‘Ѕз‘їз’‚з’„з’…з’†з’€з’‰з’Љз’Њз’Ќз’Џз’‘",10,"з’ќз’џ",7,"з’Є",15,"з’»",12],
    ["ad80","з“€",9,"з““",8,"з“ќз“џз“Ўз“Ґз“§",6,"з“°з“±з“І"],
    ["ae40","з“із“µз“ё",6,"з”Ђз”Ѓз”‚з”ѓз”…",7,"з”Ћз”ђз”’з””з”•з”–з”—з”›з”ќз”ћз” ",4,"з”¦з”§з”Єз”®з”ґз”¶з”№з”јз”Ѕз”їз•Ѓз•‚з•ѓз•„з•†з•‡з•‰з•Љз•Ќз•ђз•‘з•’з•“з••з•–з•—з•"],
    ["ae80","з•ќ",7,"з•§з•Ёз•©з•«",6,"з•із•µз•¶з•·з•є",4,"з–Ђз–Ѓз–‚з–„з–…з–‡"],
    ["af40","з–€з–‰з–Љз–Њз–Ќз–Ћз–ђз–“з–•з–з–›з–њз–ћз–ўз–¦",4,"з–­з–¶з–·з–єз–»з–їз—Ђз—Ѓз—†з—‹з—Њз—Ћз—Џз—ђз—‘з—“з——з—™з—љз—њз—ќз—џз— з—Ўз—Ґз—©з—¬з—­з—®з—Їз—Із—із—µз—¶з—·з—ёз—єз—»з—Ѕз—ѕз‚з„з†з‡"],
    ["af80","з€з‰з‹зЌзЋзЏз‘з’з“з”з–зљзњзќзћзЎзЈз§зЁз¬з®зЇз±зІз¶з·з№зєз»зЅз™Ѓз™‚з™„"],
    ["b040","з™…",6,"з™Ћ",5,"з™•з™—",4,"з™ќз™џз™ з™Ўз™ўз™¤",6,"з™¬з™­з™®з™°",7,"з™№з™єз™јз™їзљЂзљЃзљѓзљ…зљ‰зљЉзљЊзљЌзљЏзљђзљ’зљ”зљ•зљ—зљзљљзљ›"],
    ["b080","зљњ",7,"зљҐ",8,"зљЇзљ°зљізљµ",9,"з›Ђз›Ѓз›ѓе•ЉйїеџѓжЊЁе“Ће”‰е“Ђзљ‘з™Њи”јзџ®и‰ѕзўЌз€±йљйћЌж°Ёе®‰дїєжЊ‰жљ—еІёиѓєжЎ€и‚®ж‚з›Ће‡№ж•–з†¬зї±иў„е‚ІеҐҐж‡ЉжѕіиЉ­жЌЊж‰’еЏ­еђ§з¬†е…«з–¤е·ґж‹”и·‹йќ¶жЉЉиЂ™еќќйњёзЅўз€ёз™ЅжџЏз™ѕж‘†дЅ°иґҐж‹њзЁ—ж–‘зЏ­жђ¬ж‰іи€¬йўЃжќїз‰€ж‰®ж‹Њдјґз“ЈеЌЉеЉћз»Љй‚¦её®жў†ж¦њи†Ђз»‘жЈ’зЈ…иљЊй•‘е‚Ќи°¤и‹ћиѓћеЊ…и¤’е‰Ґ"],
    ["b140","з›„з›‡з›‰з›‹з›Њз›“з›•з›™з›љз›њз›ќз›ћз› ",4,"з›¦",7,"з›°з›із›µз›¶з›·з›єз›»з›Ѕз›їзњЂзњ‚зњѓзњ…зњ†зњЉзњЊзњЋ",10,"зњ›зњњзњќзњћзњЎзњЈзњ¤зњҐзњ§зњЄзњ«"],
    ["b180","зњ¬зњ®зњ°",4,"зњ№зњ»зњЅзњѕзњїзќ‚зќ„зќ…зќ†зќ€",7,"зќ’",7,"зќњи–„й›№дїќе ЎйҐ±е®ќжЉ±жЉҐжљґи±№йІЌз€†жќЇзў‘ж‚ІеЌ‘еЊ—иѕ€иѓЊиґќй’ЎеЂЌз‹€е¤‡жѓ«з„™иў«еҐ”и‹Їжњ¬з¬Ёеґ©з»·з”­жіµи№¦иїёйЂјйј»жЇ”й„™з¬”еЅјзў§и“–и”ЅжЇ•жЇ™жЇ–еёЃеє‡з—№й—­ж•ќејЉеї…иѕџеЈЃи‡‚йЃїй™›йћ­иѕ№зј–иґ¬ж‰ЃдѕїеЏеЌћиѕЁиѕ©иѕ«йЃЌж ‡еЅЄи†иЎЁйі–ж†‹е€«зЄеЅ¬ж–Њжї’ж»Ёе®ѕж‘€е…µе†°жџ„дё™з§‰йҐјз‚і"],
    ["b240","зќќзќћзќџзќ зќ¤зќ§зќ©зќЄзќ­",11,"зќєзќ»зќјзћЃзћ‚зћѓзћ†",5,"зћЏзћђзћ“",11,"зћЎзћЈзћ¤зћ¦зћЁзћ«зћ­зћ®зћЇзћ±зћІзћґзћ¶",4],
    ["b280","зћјзћѕзџЂ",12,"зџЋ",8,"зџзџ™зџљзџќ",4,"зџ¤з—…е№¶зЋ»иЏ ж’­ж‹Ёй’µжіўеЌље‹ѓжђЏй“‚з®”дјЇеё›и€¶и„–и†Љжё¤жіЉй©іжЌ•еЌње“єиЎҐеџ дёЌеёѓж­Ґз°їйѓЁжЂ–ж“¦зЊњиЈЃжќђж‰Ќиґўзќ¬иё©й‡‡еЅ©иЏњи”Ўй¤ђеЏ‚иљ•ж®‹жѓ­жѓЁзЃїи‹Ќи€±д»“жІ§и—Џж“Ќзі™ж§Ѕж›№иЌ‰еЋ•з­–дѕ§е†Њжµ‹е±‚и№­жЏ’еЏ‰иЊ¬иЊ¶жџҐзўґжђЅеЇџеІ”е·®иЇ§ж‹†жџґи±єжђЂжЋєиќ‰й¦‹и°—зј й“Ідє§йђйў¤жЊзЊ–"],
    ["b340","зџ¦зџЁзџЄзџЇзџ°зџ±зџІзџґзџµзџ·зџ№зџєзџ»зџјз ѓ",5,"з Љз ‹з Ћз Џз ђз “з •з ™з ›з ћз  з Ўз ўз ¤з Ёз Єз «з ®з Їз ±з Із із µз ¶з Ѕз їзЎЃзЎ‚зЎѓзЎ„зЎ†зЎ€зЎ‰зЎЉзЎ‹зЎЌзЎЏзЎ‘зЎ“зЎ”зЎзЎ™зЎљ"],
    ["b380","зЎ›зЎњзЎћ",11,"зЎЇ",7,"зЎёзЎ№зЎєзЎ»зЎЅ",6,"ењєе°ќеёёй•їеЃїи‚ еЋ‚ж•ћз•…е”±еЂЎи¶…жЉ„й’ћжњќеІжЅ®е·ўеђµз‚’иЅ¦ж‰Їж’¤жЋЈеЅ»жѕ€йѓґи‡Јиѕ°е°ж™Ёеї±жІ‰й™€и¶ЃиЎ¬ж’‘з§°еџЋж©™ж€ђе‘€д№зЁ‹жѓ©жѕ„иЇљж‰їйЂћйЄ‹з§¤еђѓз—ґжЊЃеЊ™ж± иїџеј›й©°иЂ»йЅїдѕ€е°єиµ¤зї…ж–Ґз‚Ѕе……е†Іи™«еґ‡е® жЉЅй…¬з•ґиёЊзЁ ж„Ѓз­№д»‡з»ёзћ…дё‘и‡­е€ќе‡єж©±еЋЁиє‡й”„й›Џж»Ѓй™¤жҐљ"],
    ["b440","зў„зў…зў†зў€зўЉзў‹зўЏзўђзў’зў”зў•зў–зў™зўќзўћзў зўўзў¤зў¦зўЁ",7,"зўµзў¶зў·зўёзўєзў»зўјзўЅзўїзЈЂзЈ‚зЈѓзЈ„зЈ†зЈ‡зЈ€зЈЊзЈЌзЈЋзЈЏзЈ‘зЈ’зЈ“зЈ–зЈ—зЈзЈљ",9],
    ["b480","зЈ¤зЈҐзЈ¦зЈ§зЈ©зЈЄзЈ«зЈ­",4,"зЈізЈµзЈ¶зЈёзЈ№зЈ»",5,"з¤‚з¤ѓз¤„з¤†",6,"зЎЂе‚Ёзџ—жђђи§¦е¤„жЏЈе·ќз©їж¤Ѕдј и€№е–дёІз–®зЄ—е№ўеєЉй—Їе€›еђ№з‚ЉжЌ¶й”¤ећ‚жҐж¤їй†‡е”‡ж·ізєЇи ўж€із»°з–µиЊЁзЈЃй›Њиѕћж…€з“·иЇЌж­¤е€єиµђж¬ЎиЃЄи‘±е›±еЊ†д»Ћдё›е‡‘зІ—й†‹з°‡дїѓи№їзЇЎзЄњж‘§еґ”е‚¬и„†зЃзІ№ж·¬зї жќ‘е­еЇёзЈ‹ж’®жђ“жЋЄжЊ«й”™жђ­иѕѕз­”з©ж‰“е¤§е‘†ж­№е‚Јж€ґеё¦ж®†д»Јиґ·иў‹еѕ…йЂ®"],
    ["b540","з¤Ќ",5,"з¤”",9,"з¤џ",4,"з¤Ґ",14,"з¤µ",4,"з¤Ѕз¤їзҐ‚зҐѓзҐ„зҐ…зҐ‡зҐЉ",8,"зҐ”зҐ•зҐзҐ™зҐЎзҐЈ"],
    ["b580","зҐ¤зҐ¦зҐ©зҐЄзҐ«зҐ¬зҐ®зҐ°",6,"зҐ№зҐ»",4,"з¦‚з¦ѓз¦†з¦‡з¦€з¦‰з¦‹з¦Њз¦Ќз¦Ћз¦ђз¦‘з¦’жЂ иЂЅж‹…дё№еЌ•йѓёжЋёиѓ†ж—¦ж°®дЅ†жѓ®ж·ЎиЇћеј№и›‹еЅ“жЊЎе…љиЌЎжЎЈе€ЂжЌЈи№€еЂ’еІ›зҐ·еЇје€°зЁ»ж‚јйЃ“з›—еѕ·еѕ—зљ„и№¬зЃЇз™»з­‰зћЄе‡ій‚“е ¤дЅЋж»ґиїЄж•Њз¬›з‹„ж¶¤зїџе«ЎжЉµеє•ењ°и’‚з¬¬еёќејџйЂ’зј”йў жЋ‚ж»‡зўз‚№е…ёйќ›ећ«з”µдЅѓз”ёеє—жѓ¦еҐ ж·Ђж®їзў‰еЏјй›•е‡‹е€ЃжЋ‰еђЉй’“и°ѓи·Њз€№зўџиќ¶иї­и°ЌеЏ "],
    ["b640","з¦“",6,"з¦›",11,"з¦Ё",10,"з¦ґ",4,"з¦јз¦їз§‚з§„з§…з§‡з§€з§Љз§Њз§Ћз§Џз§ђз§“з§”з§–з§—з§™",5,"з§ з§Ўз§ўз§Ґз§Ёз§Є"],
    ["b680","з§¬з§®з§±",6,"з§№з§єз§јз§ѕз§їзЁЃзЁ„зЁ…зЁ‡зЁ€зЁ‰зЁЉзЁЊзЁЏ",4,"зЁ•зЁ–зЁзЁ™зЁ›зЁњдёЃз›ЇеЏ®й’‰йЎ¶йјЋй”­е®љи®ўдёўдёње†¬и‘Јж‡‚еЉЁж ‹дѕ—жЃ«е†»жґће…њжЉ–ж–—й™Ўи±†йЂ—з—йѓЅзќЈжЇ’зЉЉз‹¬иЇ»е µзќ№иµЊжќњй•Ђи‚љеє¦жёЎе¦’з«Їзџ­й”»ж®µж–­зјЋе †е…‘йџеЇ№еў©еђЁи№Іж•¦йЎїе›¤й’ќз›ѕйЃЃжЋ‡е“†е¤ље¤єећ›иєІжњµи·єи€µе‰Ѓжѓ°е •и›ѕеіЁй№…дї„йўќи®№еЁҐжЃ¶еЋ„ж‰јйЃЏй„‚йҐїжЃ©иЂЊе„їиЂіе°”йҐµжґ±дєЊ"],
    ["b740","зЁќзЁџзЁЎзЁўзЁ¤",14,"зЁґзЁµзЁ¶зЁёзЁєзЁѕз©Ђ",5,"з©‡",9,"з©’",4,"з©",16],
    ["b780","з©©",6,"з©±з©Із©із©µз©»з©јз©Ѕз©ѕзЄ‚зЄ…зЄ‡зЄ‰зЄЉзЄ‹зЄЊзЄЋзЄЏзЄђзЄ“зЄ”зЄ™зЄљзЄ›зЄћзЄЎзЄўиґ°еЏ‘зЅљз­Џдјђд№ЏйЂжі•зЏђи—©её†з•Єзї»жЁЉзџѕй’’з№Ѓе‡Ўзѓ¦еЏЌиї”иЊѓиґ©зЉЇйҐ­жі›еќЉиЉіж–№и‚Єж€їйІе¦Ёд»їи®їзєєж”ѕиЏІйќће•ЎйЈћи‚ҐеЊЄиЇЅеђ и‚єеєџжІёиґ№иЉ¬й…љеђ©ж°›е€†зє·еќџз„љж±ѕзІ‰еҐ‹д»Ѕеїїж„¤зІЄдё°е°Ѓжћ«ињ‚еі°й”‹йЈЋз–ЇзѓЅйЂўе†Їзјќи®ЅеҐ‰е‡¤дЅ›еђ¦е¤«ж•·и‚¤е­µж‰¶ж‹‚иѕђе№…ж°џз¬¦дјЏдїжњЌ"],
    ["b840","зЄЈзЄ¤зЄ§зЄ©зЄЄзЄ«зЄ®",4,"зЄґ",10,"з«Ђ",10,"з«Њ",9,"з«—з«з«љз«›з«њз«ќз«Ўз«ўз«¤з«§",5,"з«®з«°з«±з«Із«і"],
    ["b880","з«ґ",4,"з«»з«јз«ѕз¬Ђз¬Ѓз¬‚з¬…з¬‡з¬‰з¬Њз¬Ќз¬Ћз¬ђз¬’з¬“з¬–з¬—з¬з¬љз¬њз¬ќз¬џз¬Ўз¬ўз¬Јз¬§з¬©з¬­жµ®ж¶Єз¦Џиў±еј—з”«жЉљиѕ…дїЇй‡њж–§и„Їи…‘еєњи…ђиµґе‰Їи¦†иµ‹е¤Ќе‚…д»йњз€¶и…№иґџеЇЊи®Јй™„е¦‡зјље’ђе™¶еЋиЇҐж”№ж¦‚й’™з›–жє‰е№Із”жќ†жџ‘з«їи‚ќиµ¶ж„џз§†ж•ўиµЈе†€е€љй’ўзјёи‚›зєІеІ—жёЇжќ зЇ™зљ‹й«и†Џзѕ”зі•жђћй•ђзЁїе‘Ље“Ґж­ЊжђЃж€€йёЅиѓіз–™е‰Ійќ©и‘›ж ји›¤йЃйљ”й“¬дёЄеђ„з»™ж №и·џиЂ•ж›ґеєљзѕ№"],
    ["b940","з¬Їз¬°з¬Із¬ґз¬µз¬¶з¬·з¬№з¬»з¬Ѕз¬ї",5,"з­†з­€з­Љз­Ќз­Ћз­“з­•з­—з­™з­њз­ћз­џз­Ўз­Ј",10,"з­Їз­°з­із­ґз­¶з­ёз­єз­јз­Ѕз­їз®Ѓз®‚з®ѓз®„з®†",6,"з®Ћз®Џ"],
    ["b980","з®‘з®’з®“з®–з®з®™з®љз®›з®ћз®џз® з®Јз®¤з®Ґз®®з®Їз®°з®Із®із®µз®¶з®·з®№",7,"зЇ‚зЇѓзЇ„еџ‚иЂїжў—е·Ґж”»еЉџжЃ­йѕљдѕ›иє¬е…¬е®«еј“е·©ж±ћж‹±иґЎе…±й’©е‹ѕжІџи‹џз‹—ећўжћ„иґ­е¤џиѕњиЏ‡е’•з®Ќдј°жІЅе­¤е§‘йј“еЏ¤и›ЉйЄЁи°·и‚Ўж•…йЎѕе›єй›‡е€®з“ње‰ђеЇЎжЊ‚и¤‚д№–ж‹ђжЂЄжЈєе…іе®е† и§‚з®Ўй¦†зЅђжѓЇзЃЊиґЇе…‰е№їйЂ›з‘°и§„ењ­зЎ…еЅ’йѕџй—єиЅЁй¬јиЇЎз™ёжЎ‚жџњи·Єиґµе€ЅиѕЉж»љжЈЌй”…йѓ­е›ЅжћњиЈ№иї‡е“€"],
    ["ba40","зЇ…зЇ€зЇ‰зЇЉзЇ‹зЇЌзЇЋзЇЏзЇђзЇ’зЇ”",4,"зЇ›зЇњзЇћзЇџзЇ зЇўзЇЈзЇ¤зЇ§зЇЁзЇ©зЇ«зЇ¬зЇ­зЇЇзЇ°зЇІ",4,"зЇёзЇ№зЇєзЇ»зЇЅзЇї",7,"з°€з°‰з°Љз°Ќз°Ћз°ђ",5,"з°—з°з°™"],
    ["ba80","з°љ",4,"з° ",5,"з°Ёз°©з°«",12,"з°№",5,"з±‚йЄёе­©жµ·ж°¦дєҐе®ійЄ‡й…Јж†Ёй‚Їйџ©еђ«ж¶µеЇ’е‡Ѕе–ЉзЅ•зї°ж’јжЌЌж—±ж†ѕж‚Ќз„Љж±—ж±‰е¤Їжќ­и€ЄеЈ•ељЋи±ЄжЇ«йѓќеҐЅиЂ—еЏ·жµ©е‘µе–ќиЌ·иЏЏж ёз¦ѕе’ЊдЅ•еђ€з›’иІ‰й‚жІіж¶ёиµ«и¤ђй№¤иґєеїй»‘з—•еѕ€з‹ жЃЁе“јдєЁжЁЄиЎЎжЃ’иЅ°е“„зѓи™№йёїжґЄе®Џејзєўе–‰дѕЇзЊґеђјеЋљеЂ™еђЋе‘јд№ЋеїЅз‘љеЈ¶и‘«иѓЎиќґз‹ђзіЉж№–"],
    ["bb40","з±ѓ",9,"з±Ћ",36,"з±µ",5,"з±ѕ",9],
    ["bb80","зІ€зІЉ",6,"зІ“зІ”зІ–зІ™зІљзІ›зІ зІЎзІЈзІ¦зІ§зІЁзІ©зІ«зІ¬зІ­зІЇзІ°зІґ",4,"зІєзІ»еј§и™Ће”¬жЉ¤дє’жІЄж€·иЉ±е“—еЌЋзЊѕж»‘з”»е€’еЊ–иЇќж§ђеѕЉжЂЂж·®еќЏж¬ўзЋЇжЎ“иїзј“жЌўж‚Је”¤з—Єи±ўз„•ж¶Је®¦е№»иЌ’ж…Њй»„зЈєиќ—з°§зљ‡е‡°жѓ¶з…Њж™ѓе№ЊжЃЌи°ЋзЃ°жЊҐиѕ‰еѕЅжЃўи›”е›ћжЇЃж‚”ж…§еЌ‰жѓ ж™¦иґїз§Ѕдјљзѓ©ж±‡и®іиЇІз»иЌ¤жЏе©љй­‚жµ‘ж··и±Ѓжґ»дј™зЃ«иЋ·ж€–жѓ‘йњЌиґ§зҐёе‡»ењѕеџєжњєз•ёзЁЅз§Їз®•"],
    ["bc40","зІїзіЂзі‚зіѓзі„зі†зі‰зі‹зіЋ",6,"зізіљзі›зіќзіћзіЎ",6,"зі©",5,"зі°",7,"зі№зієзіј",13,"зґ‹",5],
    ["bc80","зґ‘",14,"зґЎзґЈзґ¤зґҐзґ¦зґЁзґ©зґЄзґ¬зґ­зґ®зґ°",6,"и‚ЊйҐҐиї№жїЂи®ҐйёЎе§¬з»©зј‰еђ‰жћЃжЈиѕ‘з±Ќй›†еЏЉжЂҐз–ѕж±ІеЌіе«‰зє§жЊ¤е‡ и„Ље·±и“џжЉЂе†Ђе­ЈдјЋзҐ­е‰‚ж‚ёжµЋеЇ„еЇ‚и®Ўи®°ж—ўеїЊй™…е¦“з»§зєЄе‰жћ·е¤№дЅіе®¶еЉ иЌљйўЉиґѕз”Ій’ѕеЃ‡зЁјд»·жћ¶й©ѕе«Ѓж­јз›‘еќље°–з¬єй—ґз…Ће…ји‚©и‰°еҐёзј„иЊ§жЈЂжџ¬зў±зЎ·ж‹ЈжЌЎз®Ђдї­е‰Єе‡ЏиЌђж§›й‰ґи·µиґ±и§Ѓй”®з®­д»¶"],
    ["bd40","зґ·",54,"зµЇ",7],
    ["bd80","зµё",32,"еЃҐи€°е‰‘йҐЇжёђжє…ж¶§е»єеѓµе§ње°†жµ†ж±џз–†и’‹жЎЁеҐ–и®ІеЊ й…±й™Ќи•‰ж¤’з¤Ѓз„¦иѓ¶дє¤йѓЉжµ‡йЄ„еЁ‡ељјжђ…й“°зџ«дѕҐи„љз‹Ўи§’йҐєзјґз»ће‰їж•™й…µиЅїиѕѓеЏ«зЄ–жЏ­жЋҐзљ†з§ёиЎ—й¶ж€ЄеЉ«иЉ‚жЎ”жќ°жЌ·зќ«з«­жґЃз»“и§Је§ђж€’и—‰иЉҐз•ЊеЂџд»‹з–ҐиЇ«е±Ље·ѕз­‹ж–¤й‡‘д»ЉжґҐиҐџзґ§й”¦д»…и°Ёиї›йќіж™‹з¦Ѓиї‘зѓ¬жµё"],
    ["be40","з¶™",12,"з¶§",6,"з¶Ї",42],
    ["be80","з·љ",32,"е°ЅеЉІиЌ†е…ўиЊЋзќ›ж™¶йІёдє¬жѓЉзІѕзІіз»Џдє•и­¦ж™Їйў€йќ™еўѓж•¬й•њеѕ„з—‰йќ–з«џз«ће‡Ђз‚ЇзЄжЏЄз©¶зє зЋ–йџ­д№…зЃёд№ќй…’еЋ©ж•‘ж—§и‡ји€…е’Ће°±з–љйћ ж‹з‹™з–Ѕе±…й©№иЏЉе±Ђе’Ђзџ©дёѕжІ®иЃљж‹’жЌ®е·Ёе…·и·ќиёћй”Їдї±еЏҐжѓ§з‚¬е‰§жЌђй№ѓеЁџеЂ¦зњ·еЌ·з»ўж’…ж”«жЉ‰жЋеЂ”з€µи§‰е†іиЇЂз»ќеќ‡иЏЊй’§е†›еђ›еі»"],
    ["bf40","з·»",62],
    ["bf80","зёєзёј",4,"з№‚",4,"з№€",21,"дїЉз«ЈжµљйѓЎйЄЏе–Ђе’–еЌЎе’ЇејЂжЏ©жҐ·е‡Їж…Ёе€Ље Єе‹еќЋз Ќзњ‹еє·ж…·зі ж‰›жЉ—дєўз‚•иЂѓж‹·зѓ¤йќ еќ·и‹›жџЇжЈµзЈ•йў—з§‘еЈіе’іеЏЇжёґе…‹е€»е®ўиЇѕи‚Їе•ѓећ¦жЃіеќ‘еђ­з©єжЃђе­”жЋ§жЉ еЏЈж‰ЈеЇ‡жћЇе“­зЄџи‹¦й…·еє“иЈ¤е¤ёећ®жЊЋи·ЁиѓЇеќ—з­·дѕ©еї«е®Ѕж¬ѕеЊЎз­ђз‹‚жЎ†зџїзњ¶ж—·е†µдєЏз›”еІїзЄҐи‘µеҐЋй­Ѓе‚Ђ"],
    ["c040","з№ћ",35,"зєѓ",23,"зєњзєќзєћ"],
    ["c080","зє®зєґзє»зєјз»–з»¤з»¬з»№зјЉзјђзјћзј·зј№зј»",6,"зЅѓзЅ†",9,"зЅ’зЅ“й¦€ж„§жєѓеќ¤ж†жЌ†е›°ж‹¬ж‰©е»“й”ећѓж‹‰е–‡ињЎи…ЉиѕЈе•¦иЋ±жќҐиµ–и“ќе©Єж Џж‹¦зЇ®й‘е…°жѕњи°°жЏЅи§€ж‡’зј†зѓ‚ж»Ґзђ…ж¦”з‹је»ЉйѓЋжњ—жµЄжЌћеЉіз‰ўиЂЃдЅ¬е§Ґй…Єзѓ™ж¶ќе‹’д№ђй›·й•­и•ѕзЈЉзґЇе„Ўећ’ж“‚и‚‹з±»жіЄжЈ±жҐће†·еЋжўЁзЉЃй»ЋзЇ±з‹ёз¦»жј“зђ†жќЋй‡ЊйІ¤з¤јиЋ‰иЌ”еђЏж —дёЅеЋ‰еЉ±з ѕеЋ†е€©е‚€дѕ‹дїђ"],
    ["c140","зЅ–зЅ™зЅ›зЅњзЅќзЅћзЅ зЅЈ",4,"зЅ«зЅ¬зЅ­зЅЇзЅ°зЅізЅµзЅ¶зЅ·зЅёзЅєзЅ»зЅјзЅЅзЅїзѕЂзѕ‚",7,"зѕ‹зѕЌзѕЏ",4,"зѕ•",4,"зѕ›зѕњзѕ зѕўзѕЈзѕҐзѕ¦зѕЁ",6,"зѕ±"],
    ["c180","зѕі",4,"зѕєзѕ»зѕѕзїЂзї‚зїѓзї„зї†зї‡зї€зї‰зї‹зїЌзїЏ",4,"зї–зї—зї™",5,"зїўзїЈз—ўз«‹зІ’жІҐйљ¶еЉ›з’ѓе“©дї©иЃ”иЋІиїћй•°е»‰жЂњж¶џеёж•›и„ёй“ѕжЃ‹з‚јз»ѓзІ®е‡‰жўЃзІ±и‰Їдё¤иѕ†й‡Џж™ѕдє®и°…ж’©иЃЉеѓљз–—з‡ЋеЇҐиѕЅжЅ¦дє†ж’‚й•Је»–ж–™е€—иЈ‚зѓ€еЉЈзЊЋзђіжћ—зЈ·йњ–дёґй‚»йіћж·‹е‡›иµЃеђќж‹ЋзЋІиЏ±й›¶йѕ„й“ѓдј¶зѕље‡ЊзЃµй™µеІ­йў†еЏ¦д»¤жєњзђ‰ж¦ґзЎ«й¦Џз•™е€з¤жµЃжџіе…­йѕ™иЃ‹е’™з¬јзЄї"],
    ["c240","зї¤зї§зїЁзїЄзї«зї¬зї­зїЇзїІзїґ",6,"зїЅзїѕзїїиЂ‚иЂ‡иЂ€иЂ‰иЂЉиЂЋиЂЏиЂ‘иЂ“иЂљиЂ›иЂќиЂћиЂџиЂЎиЂЈиЂ¤иЂ«",5,"иЂІиЂґиЂ№иЂєиЂјиЂѕиЃЂиЃЃиЃ„иЃ…иЃ‡иЃ€иЃ‰иЃЋиЃЏиЃђиЃ‘иЃ“иЃ•иЃ–иЃ—"],
    ["c280","иЃ™иЃ›",13,"иЃ«",5,"иЃІ",11,"йљ†ећ„ж‹ўй™‡жҐјеЁ„жђ‚зЇ“жјЏй™‹иЉ¦еЌўйў…еєђз‚‰жЋіеЌ¤и™ЏйІЃйє“зўЊйњІи·Їиµ‚й№їжЅћз¦„еЅ•й™†ж€®й©ґеђ•й“ќдѕЈж—…е±Ґе±Ўзј•и™‘ж°Їеѕ‹зЋ‡ж»¤з»їеі¦жЊ›е­Єж»¦еЌµд№±жЋ з•ҐжЉЎиЅ®дј¦д»‘жІ¦зє¶и®єиђќићєзЅ—йЂ»й”Јз®©йЄЎиЈёиђЅжґ›йЄ†з»ње¦€йє»зЋ›з Ѓиљ‚й©¬йЄ‚е›еђ—еџ‹д№°йє¦еЌ–иї€и„‰зћ’й¦’и›®ж»Ўи”“ж›јж…ўжј«"],
    ["c340","иЃѕи‚Ѓи‚‚и‚…и‚€и‚Љи‚Ќ",5,"и‚”и‚•и‚—и‚™и‚ћи‚Ји‚¦и‚§и‚Ёи‚¬и‚°и‚іи‚µи‚¶и‚ёи‚№и‚»иѓ…иѓ‡",4,"иѓЏ",6,"иѓиѓџиѓ иѓўиѓЈиѓ¦иѓ®иѓµиѓ·иѓ№иѓ»иѓѕиѓїи„Ђи„Ѓи„ѓи„„и„…и„‡и„€и„‹"],
    ["c380","и„Њи„•и„—и„™и„›и„њи„ќи„џ",12,"и„­и„®и„°и„іи„ґи„µи„·и„№",4,"и„їи°©иЉ’иЊ«з›Іж°“еї™иЋЅзЊ«иЊ…й”љжЇ›зџ›й“†еЌЇиЊ‚е†’еёЅиІЊиґёд№€зЋ«жћљжў…й…¶йњ‰з…¤жІЎзњ‰еЄ’й•ЃжЇЏзѕЋж§еЇђе¦№еЄљй—Ёй—·д»¬иђЊи’™жЄ¬з›џй”°зЊ›жў¦е­џзњЇй†љйќЎзіњиї·и°њејҐз±із§и§…жіЊињњеЇ†е№‚жЈ‰зњ з»µе†•е…Ќе‹‰еЁ©зј…йќўи‹—жЏЏзћ„и—ђз§’жёєеє™е¦™и”‘зЃ­ж°‘жЉїзљїж•Џж‚Їй—ЅжЋићџйёЈй“­еђЌе‘Ѕи°¬ж‘ё"],
    ["c440","и…Ђ",5,"и…‡и…‰и…Ќи…Ћи…Џи…’и…–и…—и…и…›",4,"и…Ўи…ўи…Ји…¤и…¦и…Ёи…Єи…«и…¬и…Їи…Іи…іи…µи…¶и…·и…ёи†Ѓи†ѓ",4,"и†‰и†‹и†Њи†Ќи†Ћи†ђи†’",5,"и†™и†љи†ћ",4,"и†¤и†Ґ"],
    ["c480","и†§и†©и†«",7,"и†ґ",5,"и†ји†Ѕи†ѕи†їи‡„и‡…и‡‡и‡€и‡‰и‡‹и‡Ќ",6,"ж‘№и‘жЁЎи†њзЈЁж‘©й­”жЉ№жњ«иЋ«еўЁй»жІ«жј еЇћй™Њи°‹з‰џжџђж‹‡з‰Ўдє©е§†жЇЌеў“жљ®е№•е‹џж…•жњЁз›®зќ¦з‰§з©†ж‹їе“Єе‘ђй’ й‚ЈеЁњзєіж°–д№ѓеҐ¶иЂђеҐ€еЌ—з”·йљѕе›ЉжЊ и„‘жЃјй—№ж·–е‘ўй¦Ѓе†…е«©иѓЅе¦®йњ“еЂЄжіҐе°јж‹џдЅ еЊїи…»йЂ†жєєи”«ж‹€е№ґзўѕж’µжЌ»еїµеЁй…їйёџе°їжЌЏиЃ‚е­Ѕе•®й•Љй•Ќж¶…ж‚Ёжџ з‹ће‡ќе®Ѓ"],
    ["c540","и‡”",14,"и‡¤и‡Ґи‡¦и‡Ёи‡©и‡«и‡®",4,"и‡µ",5,"и‡Ѕи‡їи€ѓи€‡",4,"и€Ћи€Џи€‘и€“и€•",5,"и€ќи€ и€¤и€Ґи€¦и€§и€©и€®и€Іи€єи€ји€Ѕи€ї"],
    ["c580","и‰Ђи‰Ѓи‰‚и‰ѓи‰…и‰†и‰€и‰Љи‰Њи‰Ќи‰Ћи‰ђ",7,"и‰™и‰›и‰њи‰ќи‰ћи‰ ",7,"и‰©ж‹§жіћз‰›ж‰­й’®зєЅи„“жµ“е†њеј„еҐґеЉЄжЂ’еҐіжљ–и™ђз–џжЊЄж‡¦зіЇиЇєе“¦ж¬§йёҐж®ґи—•е‘•еЃ¶жІ¤е•Єи¶ґз€¬её•жЂ•зђ¶ж‹ЌжЋ’з‰Њеѕж№ѓжґѕж”ЂжЅз›зЈђз›јз•”е€¤еЏ›д№“еєћж—ЃиЂЄиѓ–жЉ›е’†е€Ёз‚®иўЌи·‘жіЎе‘ёиѓљеџ№иЈґиµ”й™Єй…ЌдЅ©жІ›е–·з›†з °жЉЁзѓ№жѕЋеЅ­и“¬жЈљзЎјзЇ·и†Ёжњ‹й№ЏжЌ§зў°еќЇз ’йњ№ж‰№жЉ«еЉ€зђµжЇ—"],
    ["c640","и‰Єи‰«и‰¬и‰­и‰±и‰µи‰¶и‰·и‰ёи‰»и‰јиЉЂиЉЃиЉѓиЉ…иЉ†иЉ‡иЉ‰иЉЊиЉђиЉ“иЉ”иЉ•иЉ–иЉљиЉ›иЉћиЉ иЉўиЉЈиЉ§иЉІиЉµиЉ¶иЉєиЉ»иЉјиЉїи‹Ђи‹‚и‹ѓи‹…и‹†и‹‰и‹ђи‹–и‹™и‹љи‹ќи‹ўи‹§и‹Ёи‹©и‹Єи‹¬и‹­и‹®и‹°и‹Іи‹іи‹µи‹¶и‹ё"],
    ["c680","и‹єи‹ј",4,"иЊЉиЊ‹иЊЌиЊђиЊ’иЊ“иЊ–иЊиЊ™иЊќ",9,"иЊ©иЊЄиЊ®иЊ°иЊІиЊ·иЊ»иЊЅе•¤и„ѕз–Ізљ®еЊ№з—ћеѓ»е±Ѓи­¬зЇ‡еЃЏз‰‡йЄ—йЈжј‚з“ўзҐЁж’‡зћҐж‹јйў‘иґ«е“ЃиЃд№’еќЄи‹№иђЌе№іе‡­з“¶иЇ„е±ЏеќЎжіјйў‡е©†з ґй­„иї«зІ•е‰–ж‰‘й“єд»†иЋ†и‘ЎиЏ©и’Іеџ”жњґењѓж™®жµ¦и°±ж›ќзЂ‘жњџж¬єж –ж€ље¦»дёѓе‡„жј†жџ’жІЏе…¶жЈ‹еҐ‡ж­§з•¦еґЋи„ђйЅђж——зҐ€зҐЃйЄ‘иµ·еІ‚д№ћдјЃеђЇеҐ‘з Ње™Ёж°”иї„ејѓж±ЅжіЈи®«жЋђ"],
    ["c740","иЊѕиЊїиЌЃиЌ‚иЌ„иЌ…иЌ€иЌЉ",4,"иЌ“иЌ•",4,"иЌќиЌўиЌ°",6,"иЌ№иЌєиЌѕ",6,"иЋ‡иЋ€иЋЉиЋ‹иЋЊиЋЌиЋЏиЋђиЋ‘иЋ”иЋ•иЋ–иЋ—иЋ™иЋљиЋќиЋџиЋЎ",6,"иЋ¬иЋ­иЋ®"],
    ["c780","иЋЇиЋµиЋ»иЋѕиЋїиЏ‚иЏѓиЏ„иЏ†иЏ€иЏ‰иЏ‹иЏЌиЏЋиЏђиЏ‘иЏ’иЏ“иЏ•иЏ—иЏ™иЏљиЏ›иЏћиЏўиЏЈиЏ¤иЏ¦иЏ§иЏЁиЏ«иЏ¬иЏ­жЃ°жґЅз‰µж‰¦й’Ћй“…еЌѓиїЃз­ѕд»џи°¦д№ѕй»”й’±й’іе‰ЌжЅњйЃЈжµ…и°ґе ‘еµЊж¬ ж­‰жћЄе‘›и…”зѕЊеў™и”·ејєжЉўж©‡й”№ж•Іж‚„жЎҐзћ§д№”дѕЁе·§йћж’¬зїеі­дїЏзЄЌе€‡иЊ„дё”жЂЇзЄѓй’¦дѕµдєІз§¦зђґе‹¤иЉ№ж“’з¦ЅеЇќжІЃйќ’иЅ»ж°ўеЂѕеЌїжё…ж“Ћж™ґж°°жѓ…йЎ·иЇ·еє†зђјз©·з§‹дёй‚±зђѓж±‚е›љй…‹жі…и¶‹еЊєи›†ж›ІиєЇе±€й©±жё "],
    ["c840","иЏ®иЏЇиЏі",4,"иЏєиЏ»иЏјиЏѕиЏїиђЂиђ‚иђ…иђ‡иђ€иђ‰иђЉиђђиђ’",5,"иђ™иђљиђ›иђћ",5,"иђ©",7,"иђІ",5,"иђ№иђєиђ»иђѕ",7,"и‘‡и‘€и‘‰"],
    ["c880","и‘Љ",6,"и‘’",4,"и‘и‘ќи‘ћи‘џи‘ и‘ўи‘¤",4,"и‘Єи‘®и‘Їи‘°и‘Іи‘ґи‘·и‘№и‘»и‘јеЏ–еЁ¶йѕ‹и¶ЈеЋ»ењ€йў§жќѓй†›жі‰е…Ёз—Љж‹ізЉ¬е€ёеЉќзјєз‚”зёеЌґй№Љж¦·зЎ®й›ЂиЈ™зѕ¤з„¶з‡ѓе†‰жџ“з“¤еЈ¤ж”ељ·и®©йҐ¶ж‰°з»•жѓ№зѓ­еЈ¬д»ЃдєєеїЌйџ§д»»и®¤е€ѓе¦Љзє«ж‰”д»Ќж—Ґж€ЋиЊёи“‰иЌЈићЌз†”жє¶е®№з»’е†—жЏ‰жџ”и‚‰иЊ№и •е„’е­єе¦‚иѕ±д№іж±ќе…Ґи¤ҐиЅЇй®и•Љз‘ћй”ђй—°ж¶¦и‹Ґеј±ж’’жґ’иђЁи…®йіѓеЎћиµ›дё‰еЏЃ"],
    ["c940","и‘Ѕ",4,"и’ѓи’„и’…и’†и’Љи’Ќи’Џ",7,"и’и’љи’›и’ќи’ћи’џи’ и’ў",12,"и’°и’±и’іи’µи’¶и’·и’»и’ји’ѕи“Ђи“‚и“ѓи“…и“†и“‡и“€и“‹и“Њи“Ћи“Џи“’и“”и“•и“—"],
    ["c980","и“",4,"и“ћи“Ўи“ўи“¤и“§",4,"и“­и“®и“Їи“±",10,"и“Ѕи“ѕи”Ђи”Ѓи”‚дјћж•ЈжЎ‘е—“дё§жђ”йЄљж‰«е«‚з‘џи‰Іж¶©жЈ®еѓ§иЋЋз ‚жќЂе€№жІ™зє±е‚»е•Ґз…ћз­›ж™’зЏЉи‹«жќ‰е±±е€ з…ЅиЎ«й—Єй™•ж“…иµЎи†іе–„ж±•ж‰‡зј®еў’дј¤е•†иµЏж™ЊдёЉе°љиЈіжўўжЌЋзЁЌзѓ§иЉЌе‹єйџ¶е°‘е“Ёй‚µз»ЌеҐўиµЉи›‡и€Њи€Ќиµ¦ж‘„е°„ж…‘ж¶‰з¤ѕи®ѕз ·з”іе‘»дјёиє«ж·±еЁ з»…зҐћжІ€е®Ўе©¶з”љи‚ѕж…Ћжё—еЈ°з”џз”Ґз‰ІеЌ‡з»і"],
    ["ca40","и”ѓ",8,"и”Ќи”Ћи”Џи”ђи”’и””и”•и”–и”и”™и”›и”њи”ќи”ћи” и”ў",8,"и”­",9,"и”ѕ",4,"и•„и•…и•†и•‡и•‹",10],
    ["ca80","и•—и•и•љи•›и•њи•ќи•џ",4,"и•Ґи•¦и•§и•©",8,"и•іи•µи•¶и•·и•ёи•ји•Ѕи•їи–Ђи–ЃзњЃз››е‰©иѓњењЈеё€е¤±з‹®ж–Ѕж№їиЇ—е°ёи™±еЌЃзџіж‹ѕж—¶д»ЂйЈџиљЂе®ћиЇ†еЏІзџўдЅїе±Ћй©¶е§‹ејЏз¤єеЈ«дё–жџїдє‹ж‹­иЄ“йЂќеЉїжЇе—ње™¬йЂ‚д»•дѕЌй‡ЉйҐ°ж°Џеё‚жЃѓе®¤и§†иЇ•ж”¶ж‰‹й¦–е®€еЇїжЋ€е”®еЏ—з¦е…Ѕи”¬жћўжўіж®ЉжЉ’иѕ“еЏ”и€’ж·‘з–Џд№¦иµЋе­°з†џи–Їжљ‘ж›™зЅІињЂй»Ќйј е±ћжњЇиї°ж ‘жќџж€Ќз«–еў…еє¶ж•°жј±"],
    ["cb40","и–‚и–ѓи–†и–€",6,"и–ђ",10,"и–ќ",6,"и–Ґи–¦и–§и–©и–«и–¬и–­и–±",5,"и–ёи–є",6,"и—‚",6,"и—Љ",4,"и—‘и—’"],
    ["cb80","и—”и—–",5,"и—ќ",6,"и—Ґи—¦и—§и—Ёи—Є",14,"жЃ•е€·иЂЌж‘”иЎ°з”©её…ж “ж‹ґйњњеЏЊз€Ѕи°Ѓж°ґзќЎзЁЋеђ®зћ¬йЎєи€њиЇґзЎ•жњ”зѓЃж–Їж’•е¶жЂќз§ЃеЏёдёќж­»и‚†еЇєе—Је››дјєдјјйҐІе·іжќѕиЂёжЂ‚йў‚йЂЃе®‹и®јиЇµжђњи‰ж“ће—Ѕи‹Џй…Ґдї—зґ йЂџзІџеѓіеЎ‘жєЇе®їиЇ‰и‚ѓй…ёи’њз®—и™Ѕйљ‹йљЏз»Ґй«“зўЋеІЃз©—йЃ‚йљ§зҐџе­™жЌџз¬‹и“‘жў­е”†зј©зђђзґўй”Ѓж‰ЂеЎЊд»–е®ѓеҐ№еЎ”"],
    ["cc40","и—№и—єи—ји—Ѕи—ѕиЂ",4,"и†",10,"и’и“и”и•и—",15,"иЁиЄ",13,"и№иєи»иЅиѕиїи™Ђ"],
    ["cc80","и™Ѓ",11,"и™’и™“и™•",4,"и™›и™њи™ќи™џи™ и™Ўи™Ј",7,"зЌ­жЊћи№‹иёЏиѓЋи‹”жЉ¬еЏ°жі°й…ће¤ЄжЂЃж±°еќЌж‘ЉиґЄз«ж»©еќ›жЄЂз—°жЅ­и°­и°€еќ¦жЇЇиў’зўіжЋўеЏ№з‚­ж±¤еЎжђЄе ‚жЈ и†›е”ђзі–еЂиєєж·Њи¶џзѓ«жЋЏж¶›ж»”з»¦иђ„жЎѓйЂѓж·й™¶и®ЁеҐ—з‰№и—¤и…ѕз–јиЄЉжўЇе‰”иёўй”‘жЏђйўи№„е•јдЅ“ж›їељЏжѓ•ж¶•е‰ѓе±‰е¤©ж·»еЎ«з”°з”њжЃ¬и€”и…†жЊ‘жќЎиїўзњєи·іиґґй“Ѓеё–еЋ…еђ¬зѓѓ"],
    ["cd40","и™­и™Їи™°и™І",6,"иљѓ",6,"иљЋ",4,"иљ”иљ–",5,"иљћ",4,"иљҐиљ¦иљ«иљ­иљ®иљІиљіиљ·иљёиљ№иљ»",4,"и›Ѓи›‚и›ѓи›…и›€и›Њи›Ќи›’и›“и›•и›–и›—и›љи›њ"],
    ["cd80","и›ќи› и›Ўи›ўи›Ји›Ґи›¦и›§и›Ёи›Єи›«и›¬и›Їи›µи›¶и›·и›єи›»и›ји›Ѕи›їињЃињ„ињ…ињ†ињ‹ињЊињЋињЏињђињ‘ињ”ињ–ж±Ђе»·еЃњдє­еє­жЊєи‰‡йЂљжЎђй…®зћіеђЊй“њеЅ¤з«ҐжЎ¶жЌ…з­’з»џз—›еЃ·жЉ•е¤ґйЂЏе‡ёз§ѓзЄЃе›ѕеѕ’йЂ”ж¶‚е± ењџеђђе…”ж№Ќе›ўжЋЁйў“и…їињ•и¤ЄйЂЂеђће±Їи‡Ђж‹–ж‰и„±йёµй™Ђй©®й©јж¤­е¦Ґж‹“е”ѕжЊ–е“‡и›™жґјеЁѓз“¦иўњж­Єе¤–и±ЊејЇж№ѕзЋ©йЎЅдёёзѓ·е®Њзў—жЊЅж™љзљ–жѓ‹е®›е©‰дё‡и…•ж±ЄзЋ‹дєЎжћ‰зЅ‘еѕЂж—єжњ›еїе¦„еЁЃ"],
    ["ce40","ињ™ињ›ињќињџињ ињ¤ињ¦ињ§ињЁињЄињ«ињ¬ињ­ињЇињ°ињІињіињµињ¶ињёињ№ињєињјињЅиќЂ",6,"иќЉиќ‹иќЌиќЏиќђиќ‘иќ’иќ”иќ•иќ–иќиќљ",5,"иќЎиќўиќ¦",7,"иќЇиќ±иќІиќіиќµ"],
    ["ce80","иќ·иќёиќ№иќєиќїићЂићЃић„ић†ић‡ић‰ићЉићЊићЋ",4,"ић”ић•ић–ић",6,"ић ",4,"е·Ќеѕ®еЌ±йџ¦иїќжЎ…е›ґе”ЇжѓџдёєжЅЌз»ґи‹‡иђЋе§”дјџдјЄе°ѕзє¬жњЄи”ље‘із•Џиѓѓе–‚й­ЏдЅЌжё­и°“е°‰ж…°еЌ«зџжё©иљЉж–‡й—»зє№еђ»зЁізґЉй—®е—ЎзїЃз“®жЊќињ—ж¶ЎзЄќж€‘ж–ЎеЌ§жЏЎжІѓе·«е‘њй’Ёд№Њж±ЎиЇ¬е±‹ж— иЉњжў§еђѕеђґжЇ‹ж­¦дє”жЌ‚еЌ€и€ћдјЌдѕ®еќћж€Љй›ѕж™¤з‰©е‹їеЉЎж‚џиЇЇж”з†™жћђиҐїзЎ’зџЅж™°е»еђёй”Ўз‰є"],
    ["cf40","ићҐић¦ић§ић©ићЄић®ић°ић±ићІићґић¶ић·ићёић№ић»ићјићѕићїиџЃ",4,"иџ‡иџ€иџ‰иџЊ",4,"иџ”",6,"иџњиџќиџћиџџиџЎиџўиџЈиџ¤иџ¦иџ§иџЁиџ©иџ«иџ¬иџ­иџЇ",9],
    ["cf80","иџєиџ»иџјиџЅиџїи Ђи Ѓи ‚и „",5,"и ‹",7,"и ”и —и и ™и љи њ",4,"и ЈзЁЂжЃЇеёЊж‚‰и†ќе¤•жѓњз†„зѓЇжєЄж±ђзЉЂжЄ„иў­её­д№ еЄіе–њй“Јжґ—зі»йљ™ж€Џз»†зћЋи™ѕеЊЈйњћиѕ–жљ‡еіЎдѕ з‹­дё‹еЋ¦е¤Џеђ“жЋЂй”Ёе…€д»™йІњзє¤е’ёиґ¤иЎ”и€·й—Іж¶Ћеј¦е«Њжѕй™©зЋ°зЊ®еЋїи…єй¦…зѕЎе®Єй™·й™ђзєїз›ёеЋўй•¶й¦™з®±иҐ„ж№д№Ўзї”зҐҐиЇ¦жѓіе“Ќдє«йЎ№е··ж©ЎеѓЏеђ‘и±Ўиђ§зЎќйњ„е‰Ље“®ељЈй”Ђж¶€е®µж·†ж™“"],
    ["d040","и ¤",13,"и і",5,"и єи »и Ѕи ѕи їиЎЃиЎ‚иЎѓиЎ†",5,"иЎЋ",5,"иЎ•иЎ–иЎиЎљ",6,"иЎ¦иЎ§иЎЄиЎ­иЎЇиЎ±иЎіиЎґиЎµиЎ¶иЎёиЎ№иЎє"],
    ["d080","иЎ»иЎјиўЂиўѓиў†иў‡иў‰иўЉиўЊиўЋиўЏиўђиў‘иў“иў”иў•иў—",4,"иўќ",4,"иўЈиўҐ",5,"е°Џе­ќж Ўи‚–е•ёз¬‘ж•€жҐ”дє›ж­‡иќЋйћ‹еЌЏжЊџжђєй‚Єж–њиѓЃи°ђе†™жў°еЌёиџ№ж‡€жі„жі»и°ўе±‘и–ЄиЉЇй”Њж¬Јиѕ›ж–°еї»еїѓдїЎиЎ…жџи…ҐзЊ©жѓєе…ґе€‘ећ‹еЅўй‚ўиЎЊй†’е№ёжќЏжЂ§е§“е…„е‡¶иѓёеЊ€ж±№й›„з†Љдј‘дї®зѕћжњЅе—…й”€з§Ђиў–з»Јеўџж€ЊйњЂи™љейЎ»еѕђи®ёи“„й…—еЏ™ж—­еєЏз•њжЃ¤зµ®е©їз»Єз»­иЅ©е–§е®Јж‚¬ж—‹зЋ„"],
    ["d140","иў¬иў®иўЇиў°иўІ",4,"иўёиў№иўєиў»иўЅиўѕиўїиЈЂиЈѓиЈ„иЈ‡иЈ€иЈЉиЈ‹иЈЊиЈЌиЈЏиЈђиЈ‘иЈ“иЈ–иЈ—иЈљ",4,"иЈ иЈЎиЈ¦иЈ§иЈ©",6,"иЈІиЈµиЈ¶иЈ·иЈєиЈ»иЈЅиЈїи¤Ђи¤Ѓи¤ѓ",5],
    ["d180","и¤‰и¤‹",4,"и¤‘и¤”",4,"и¤њ",4,"и¤ўи¤Ји¤¤и¤¦и¤§и¤Ёи¤©и¤¬и¤­и¤®и¤Їи¤±и¤Іи¤іи¤µи¤·йЂ‰з™Јзњ©з»љйќґи–›е­¦з©ґй›ЄиЎЂе‹‹з†ЏеѕЄж—¬иЇўеЇ»й©Їе·Ўж®‰ж±›и®­и®ЇйЂЉиї…еЋ‹жЉјйё¦йё­е‘Ђдё«иЉЅз‰™иљњеґ–иЎ™ж¶Їй›…е“‘дєљи®¶з„‰е’Ѕй‰зѓџж·№з›ђдёҐз ”ињ’еІ©е»¶иЁЂйўњйЋз‚ЋжІїеҐ„жЋ©зњјиЎЌжј”и‰іе °з‡•еЋЊз љй›Ѓе”ЃеЅ¦з„°е®ґи°љйЄЊж®ѓе¤®йёЇз§§жќЁж‰¬дЅЇз–ЎзѕЉжґ‹йіж°§д»°з—’е…»ж ·жјѕй‚Ђи…°е¦–з‘¶"],
    ["d240","и¤ё",8,"иҐ‚иҐѓиҐ…",24,"иҐ ",5,"иҐ§",19,"иҐј"],
    ["d280","иҐЅиҐѕи¦Ђи¦‚и¦„и¦…и¦‡",26,"ж‘‡е°§йЃҐзЄ‘и°Је§ље’¬и€ЂиЌЇи¦ЃиЂЂж¤°е™ЋиЂ¶з€·й‡Ће†¶д№џйЎµжЋ–дёљеЏ¶ж›іи…‹е¤њж¶ІдёЂеЈ№еЊ»жЏ–й“±дѕќдјЉиЎЈйўђе¤·йЃ—з§»д»Єиѓ°з–‘жІ‚е®ње§ЁеЅќж¤…иљЃеЂље·Ід№™зџЈд»Ґи‰єжЉ‘ж“й‚‘е±№дєїеЅ№и‡†йЂёи‚„з–«дє¦иЈ”ж„ЏжЇ…еї†д№‰з›ЉжєўиЇЈи®®и°ЉиЇ‘еј‚зїјзїЊз»ЋиЊµиЌ«е› ж®·йџійґе§»еђџй“¶ж·«еЇ…йҐ®е°№еј•йљђ"],
    ["d340","и¦ў",30,"и§ѓи§Ќи§“и§”и§•и§—и§и§™и§›и§ќи§џи§ и§Ўи§ўи§¤и§§и§Ёи§©и§Єи§¬и§­и§®и§°и§±и§Іи§ґ",6],
    ["d380","и§»",4,"иЁЃ",5,"иЁ€",21,"еЌ°и‹±жЁ±е©ґй№°еє”зјЁиЋ№иђ¤иђҐиЌ§иќ‡иїЋиµўз›€еЅ±йў–зЎ¬ж е“џж‹ҐдЅЈи‡ѓз—€еєёй›ЌиёЉи›№е’Џжііж¶Њж°ёжЃїе‹‡з”Ёе№Ѕдјж‚ еї§е°¤з”±й‚®й“ЂзЉ№жІ№жёёй…‰жњ‰еЏ‹еЏідЅ‘й‡‰иЇ±еЏ€е№јиї‚ж·¤дєЋз›‚ж¦†и™ћж„љи€†дЅ™дїћйЂѕй±јж„‰жёќжё”йљ…дє€еЁ±й›ЁдёЋе±їз¦№е®‡иЇ­зѕЅзЋ‰еџџиЉ‹йѓЃеђЃйЃ‡е–»еіЄеѕЎж„€ж¬Із‹±и‚ІиЄ‰"],
    ["d440","иЁћ",31,"иЁї",8,"и©‰",21],
    ["d480","и©џ",25,"и©є",6,"жµґеЇ“иЈ•йў„и±«й©­йёіжёЉе†¤е…ѓећЈиўЃеЋџжЏґиѕ•е›­е‘ењ†зЊїжєђзјиїњи‹‘ж„їжЂЁй™ўж›°зє¦и¶Љи·ѓй’ҐеІізІ¤жњ€ж‚¦й…иЂдє‘йѓ§еЊЂй™Ёе…Ѓиїђи•ґй…ќж™•йџµе­•еЊќз ёжќ‚ж Ѕе“‰зЃѕе®°иЅЅе†ЌењЁе’±ж”’жљ‚иµћиµѓи„Џи‘¬йЃ­зіџе‡їи—»жћЈж—©жѕЎиљ¤иєЃе™ЄйЂ зљ‚зЃ¶з‡ҐиґЈж‹©е€™жіЅиґјжЂЋеўћж†Ћж›ѕиµ ж‰Ће–іжёЈжњ­иЅ§"],
    ["d540","иЄЃ",7,"иЄ‹",7,"иЄ”",46],
    ["d580","и«ѓ",32,"й“Ўй—ёзњЁж …ж¦Ёе’‹д№Ќз‚ёиЇ€ж‘ж–‹е®…зЄ„еЂєеЇЁзћ»жЇЎи©№зІжІѕз›Џж–©иѕ—еґ­е±•иёж €еЌ ж€з«™ж№›з»ЅжЁџз« еЅ°жјіеј жЋЊж¶Ёжќ–дё€еёђиґ¦д»—иѓЂзґйљњж‹›ж­ж‰ѕжІјиµµз…§зЅ©е…†и‚‡еЏ¬йЃ®жЉе“Іи›°иѕ™иЂ…й”—и”—иї™жµ™зЏЌж–џзњџз”„з §и‡»иґћй’€дѕ¦жћ•з–№иЇЉйњ‡жЊЇй•‡йµи’ёжЊЈзќЃеѕЃз‹°дє‰жЂ”ж•ґж‹Їж­Јж”ї"],
    ["d640","и«¤",34,"и¬€",27],
    ["d680","и¬¤и¬Ґи¬§",30,"её§з—‡йѓ‘иЇЃиЉќжћќж”Їеђ±ињзџҐи‚ўи„‚ж±Ѓд№‹з»‡иЃЊз›ґж¤Ќж®–ж‰§еЂјдѕ„еќЂжЊ‡ж­ўи¶ѕеЏЄж—Ёзєёеї—жЊљжЋ·и‡іи‡ґзЅ®еёњеі™е€¶ж™єз§©зЁљиґЁз‚™з—”ж»ћжІ»зЄ’дё­з›…еї й’џиЎ·з»€з§Ќи‚їй‡Ќд»Ідј—и€џе‘Ёе·ћжґІиЇЊзІҐиЅґи‚еёље’’зљ±е®™жјйЄ¤зЏ ж Єи››жњ±зЊЄиЇёиЇ›йЂђз«№зѓ›з…®ж‹„зћ©е±дё»и‘—жџ±еЉ©и›Ђиґ®й“ёз­‘"],
    ["d740","и­†",31,"и­§",4,"и­­",25],
    ["d780","и®‡",24,"и®¬и®±и®»иЇ‡иЇђиЇЄи°‰и°ћдЅЏжіЁзҐќй©»жЉ“з€Єж‹Ѕдё“з –иЅ¬ж’°иµљзЇ†жЎ©еє„иЈ…е¦†ж’ћеЈ®зЉ¶ж¤Ћй”ҐиїЅиµеќ зјЂи°†е‡†жЌ‰ж‹™еЌ“жЎЊзђўиЊЃй…Ње•„зќЂзЃјжµЉе…№е’Ёиµ„е§їж»‹ж·„е­њзґ«д»”з±Ѕж»“е­ђи‡ЄжёЌе­—й¬ѓжЈ•иёЄе®—з»јжЂ»зєµй‚№иµ°еҐЏжЏЌз§џи¶іеЌ’ж—ЏзҐ–иЇ…й»з»„й’»зє‚еґй†‰жњЂзЅЄе°ЉйЃµжЁе·¦дЅђжџћеЃљдЅњеќђеє§"],
    ["d840","и°ё",8,"и±‚и±ѓи±„и±…и±€и±Љи±‹и±Ќ",7,"и±–и±—и±и±™и±›",5,"и±Ј",6,"и±¬",6,"и±ґи±µи±¶и±·и±»",6,"иІѓиІ„иІ†иІ‡"],
    ["d880","иІ€иІ‹иІЌ",6,"иІ•иІ–иІ—иІ™",20,"дєЌдёЊе…Ђдёђе»їеЌ…дё•дєдёћй¬Іе­¬е™©дёЁз¦єдёїеЊ•д№‡е¤­з€»еЌ®ж°ђе›џиѓ¤й¦—жЇ“зќѕйј—дё¶дєџйјђд№њд№©дє“иЉ€е­›е•¬еЏд»„еЋЌеЋќеЋЈеЋҐеЋ®йќҐиµќеЊљеЏµеЊ¦еЊ®еЊѕиµњеЌ¦еЌЈе€‚е€€е€Ће€­е€іе€їе‰Ђе‰Ње‰ће‰Ўе‰њи’Їе‰ЅеЉ‚еЉЃеЉђеЉ“е†‚зЅ”дє»д»ѓд»‰д»‚д»Ёд»Ўд»«д»ћдј›д»ідјўдЅ¤д»µдјҐдј§дј‰дј«дЅћдЅ§ж”ёдЅљдЅќ"],
    ["d940","иІ®",62],
    ["d980","иі­",32,"дЅџдЅ—дјІдјЅдЅ¶дЅґдѕ‘дѕ‰дѕѓдѕЏдЅѕдЅ»дѕЄдЅјдѕ¬дѕ”дї¦дїЁдїЄдї…дїљдїЈдїњдї‘дїџдїёеЂ©еЃЊдїіеЂ¬еЂЏеЂ®еЂ­дїѕеЂњеЂЊеЂҐеЂЁеЃѕеЃѓеЃ•еЃ€еЃЋеЃ¬еЃ»е‚Ґе‚§е‚©е‚єеѓ–е„†еѓ­еѓ¬еѓ¦еѓ®е„‡е„‹д»ќж°ЅдЅдЅҐдїЋйѕ ж±†з±ґе…®е·Ѕй»‰й¦е†Ѓе¤”е‹№еЊЌиЁ‡еЊђе‡«е¤™е…•дє е…–дєіиЎ®иў¤дєµи„”иЈ’з¦Ђе¬ґи ѓзѕёе†«е†±е†Ѕе†ј"],
    ["da40","иґЋ",14,"иґ иµ‘иµ’иµ—иµџиµҐиµЁиµ©иµЄиµ¬иµ®иµЇиµ±иµІиµё",8,"и¶‚и¶ѓи¶†и¶‡и¶€и¶‰и¶Њ",4,"и¶’и¶“и¶•",9,"и¶ и¶Ў"],
    ["da80","и¶ўи¶¤",12,"и¶Іи¶¶и¶·и¶№и¶»и¶Ѕи·Ђи·Ѓи·‚и·…и·‡и·€и·‰и·Љи·Ќи·ђи·’и·“и·”е‡‡е†–е†ўе†Ґи® и®¦и®§и®Єи®ґи®µи®·иЇ‚иЇѓиЇ‹иЇЏиЇЋиЇ’иЇ“иЇ”иЇ–иЇиЇ™иЇњиЇџиЇ иЇ¤иЇЁиЇ©иЇ®иЇ°иЇіиЇ¶иЇ№иЇјиЇїи°Ђи°‚и°„и°‡и°Њи°Џи°‘и°’и°”и°•и°–и°™и°›и°и°ќи°џи° и°Ўи°Ґи°§и°Єи°«и°®и°Їи°Іи°іи°µи°¶еЌ©еЌєйќйўйЎй±йЄйЅйјй™‚й™‰й™”й™џй™§й™¬й™Ій™ґйљ€йљЌйљ—йљ°й‚—й‚›й‚ќй‚™й‚¬й‚Ўй‚ґй‚ій‚¶й‚є"],
    ["db40","и·•и·и·™и·њи· и·Ўи·ўи·Ґи·¦и·§и·©и·­и·®и·°и·±и·Іи·ґи·¶и·ји·ѕ",6,"иё†иё‡иё€иё‹иёЌиёЋиёђиё‘иё’иё“иё•",7,"иё иёЎиё¤",4,"иё«иё­иё°иёІиёіиёґиё¶иё·иёёиё»иёјиёѕ"],
    ["db80","иёїи№ѓи№…и№†и№Њ",4,"и№“",5,"и№љ",11,"и№§и№Ёи№Єи№«и№®и№±й‚ёй‚°йѓЏйѓ…й‚ѕйѓђйѓ„йѓ‡йѓ“йѓ¦йѓўйѓњйѓ—йѓ›йѓ«йѓЇйѓѕй„„й„ўй„ћй„Јй„±й„Їй„№й…ѓй…†е€ЌеҐ‚еЉўеЉ¬еЉ­еЉѕе“їе‹ђе‹–е‹°еЏџз‡®зџЌе»ґе‡µе‡јй¬ЇеЋ¶ејЃз•ље·ЇеќЊећ©ећЎеЎѕеўјеЈ…еЈ‘ењ©ењ¬ењЄењіењ№ењ®ењЇеќњењ»еќ‚еќ©ећ…еќ«ећ†еќјеќ»еќЁеќ­еќ¶еќіећ­ећ¤ећЊећІеџЏећ§ећґећ“ећ еџ•еџеџљеџ™еџ’ећёеџґеџЇеџёеџ¤еџќ"],
    ["dc40","и№іи№µи№·",4,"и№Ѕи№ѕиєЂиє‚иєѓиє„иє†иє€",6,"иє‘иє’иє“иє•",6,"иєќиєџ",11,"иє­иє®иє°иє±иєі",6,"иє»",7],
    ["dc80","и»ѓ",10,"и»Џ",21,"е ‹е ЌеџЅеџ­е Ђе ће ™еЎ„е  еЎҐеЎ¬еўЃеў‰еўљеўЂй¦Ёйј™ж‡їи‰№и‰Ѕи‰їиЉЏиЉЉиЉЁиЉ„иЉЋиЉ‘иЉ—иЉ™иЉ«иЉёиЉѕиЉ°и‹€и‹Љи‹ЈиЉиЉ·иЉ®и‹‹и‹Њи‹ЃиЉ©иЉґиЉЎиЉЄиЉџи‹„и‹ЋиЉ¤и‹ЎиЊ‰и‹·и‹¤иЊЏиЊ‡и‹њи‹ґи‹’и‹иЊЊи‹»и‹“иЊ‘иЊљиЊ†иЊ”иЊ•и‹ и‹•иЊњиЌ‘иЌ›иЌњиЊ€иЋ’иЊјиЊґиЊ±иЋ›иЌћиЊЇиЌЏиЌ‡иЌѓиЌџиЌЂиЊ—иЌ иЊ­иЊєиЊіиЌ¦иЌҐ"],
    ["dd40","и»Ґ",62],
    ["dd80","иј¤",32,"иЌЁиЊ›иЌ©иЌ¬иЌЄиЌ­иЌ®иЋ°иЌёиЋіиЋґиЋ иЋЄиЋ“иЋњиЋ…иЌјиЋ¶иЋ©иЌЅиЋёиЌ»иЋиЋћиЋЁиЋєиЋјиЏЃиђЃиЏҐиЏе ‡иђиђ‹иЏќиЏЅиЏ–иђњиђёиђ‘иђ†иЏ”иЏџиђЏиђѓиЏёиЏ№иЏЄиЏ…иЏЂиђ¦иЏ°иЏЎи‘њи‘‘и‘љи‘™и‘іи’‡и’€и‘єи’‰и‘ёиђји‘†и‘©и‘¶и’Њи’Ћиђ±и‘­и“Ѓи“Ќи“ђи“¦и’Ѕи““и“Љи’їи’єи“ и’Ўи’№и’ґи’—и“Ґи“Ји”Њз”Ќи”ёи“°и”№и”џи”є"],
    ["de40","иЅ…",32,"иЅЄиѕЂиѕЊиѕ’иѕќиѕ иѕЎиѕўиѕ¤иѕҐиѕ¦иѕ§иѕЄиѕ¬иѕ­иѕ®иѕЇиѕІиѕіиѕґиѕµиѕ·иѕёиѕєиѕ»иѕјиѕїиїЂиїѓиї†"],
    ["de80","иї‰",4,"иїЏиї’иї–иї—иїљиї иїЎиїЈиї§иї¬иїЇиї±иїІиїґиїµиї¶иїєиї»иїјиїѕиїїйЂ‡йЂ€йЂЊйЂЋйЂ“йЂ•йЂи•–и”»и“їи“ји•™и•€и•Ёи•¤и•ћи•єзћўи•ѓи•Іи•»и–¤и–Ёи–‡и–Џи•№и–®и–њи–…и–№и–·и–°и—“и—Ѓи—њи—їи§и…и©и–ије»ѕеј€е¤јеҐЃиЂ·еҐ•еҐљеҐеЊЏе°ўе°Ґе°¬е°ґж‰Њж‰ЄжЉџжЉ»ж‹Љж‹љж‹—ж‹®жЊўж‹¶жЊ№жЌ‹жЌѓжЋ­жЏ¶жЌ±жЌєжЋЋжЋґжЌ­жЋ¬жЋЉжЌ©жЋ®жЋјжЏІжЏёжЏ жЏїжЏ„жЏћжЏЋж‘’жЏ†жЋѕж‘…ж‘Ѓжђ‹жђ›жђ жђЊжђ¦жђЎж‘ћж’„ж‘­ж’–"],
    ["df40","йЂ™йЂњйЂЈйЂ¤йЂҐйЂ§",5,"йЂ°",4,"йЂ·йЂ№йЂєйЂЅйЂїйЃЂйЃѓйЃ…йЃ†йЃ€",4,"йЃЋйЃ”йЃ•йЃ–йЃ™йЃљйЃњ",5,"йЃ¤йЃ¦йЃ§йЃ©йЃЄйЃ«йЃ¬йЃЇ",4,"йЃ¶",6,"йЃѕй‚Ѓ"],
    ["df80","й‚„й‚…й‚†й‚‡й‚‰й‚Љй‚Њ",4,"й‚’й‚”й‚–й‚й‚љй‚њй‚ћй‚џй‚ й‚¤й‚Ґй‚§й‚Ёй‚©й‚«й‚­й‚Ій‚·й‚јй‚Ѕй‚їйѓЂж‘єж’·ж’ёж’™ж’єж“Ђж“ђж“—ж“¤ж“ўж”‰ж”Ґж”®еј‹еї’з”™еј‘еЌџеЏ±еЏЅеЏ©еЏЁеЏ»еђ’еђ–еђ†е‘‹е‘’е‘“е‘”е‘–е‘ѓеђЎе‘—е‘™еђЈеђІе’‚е’”е‘·е‘±е‘¤е’ље’›е’„е‘¶е‘¦е’ќе“ђе’­е“‚е’ґе“’е’§е’¦е““е“”е‘Іе’Је“•е’»е’їе“Ње“™е“ље“ње’©е’Єе’¤е“ќе“Џе“ће”›е“§е” е“Ѕе””е“іе”ўе”Је”Џе”‘е”§е”Єе•§е–Џе–µе•‰е•­е•Ѓе••е”їе•ђе”ј"],
    ["e040","йѓ‚йѓѓйѓ†йѓ€йѓ‰йѓ‹йѓЊйѓЌйѓ’йѓ”йѓ•йѓ–йѓйѓ™йѓљйѓћйѓџйѓ йѓЈйѓ¤йѓҐйѓ©йѓЄйѓ¬йѓ®йѓ°йѓ±йѓІйѓійѓµйѓ¶йѓ·йѓ№йѓєйѓ»йѓјйѓїй„Ђй„Ѓй„ѓй„…",19,"й„љй„›й„њ"],
    ["e080","й„ќй„џй„ й„Ўй„¤",10,"й„°й„І",6,"й„є",8,"й…„е”·е•–е•µе•¶е•·е”іе”°е•ње–‹е—’е–ѓе–±е–№е–€е–Ѓе–џе•ѕе—–е–‘е•»е—џе–Ѕе–ѕе–”е–™е—Єе—·е—‰еџе—‘е—«е—¬е—”е—¦е—ќе—„е—Їе—Ґе—Іе—іе—Ње—Ќе—Ёе—µе—¤иѕ”еће€еЊеЃе¤еЈе—ѕеЂе§е­е™е№е™—е¬е™Ќе™ўе™™е™ње™Ње™”ељ†е™¤е™±е™«е™»е™јељ…ељ“ељЇе›”е›—е›ќе›Ўе›µе›«е›№е›їењ„ењЉењ‰ењњеёЏеё™её”её‘её±её»еёј"],
    ["e140","й……й…‡й…€й…‘й…“й…”й…•й…–й…й…™й…›й…њй…џй… й…¦й…§й…Ёй…«й…­й…ій…єй…»й…јй†Ђ",4,"й††й†€й†Љй†Ћй†Џй†“",6,"й†њ",5,"й†¤",5,"й†«й†¬й†°й†±й†Ій†ій†¶й†·й†ёй†№й†»"],
    ["e180","й†ј",10,"й‡€й‡‹й‡ђй‡’",9,"й‡ќ",8,"её·е№„е№”е№›е№ће№ЎеІЊе±єеІЌеІђеІ–еІ€еІеІ™еІ‘еІљеІњеІµеІўеІЅеІ¬еІ«еІ±еІЈеіЃеІ·еі„еі’еі¤еі‹еіҐеґ‚еґѓеґ§еґ¦еґ®еґ¤еґћеґ†еґ›еµеґѕеґґеґЅеµ¬еµ›еµЇеµќеµ«еµ‹еµЉеµ©еµґе¶‚е¶™е¶ќи±іе¶·е·…еЅіеЅ·еѕ‚еѕ‡еѕ‰еѕЊеѕ•еѕ™еѕњеѕЁеѕ­еѕµеѕјиЎўеЅЎзЉ­зЉ°зЉґзЉ·зЉёз‹ѓз‹Ѓз‹Ћз‹Ќз‹’з‹Ёз‹Їз‹©з‹Із‹ґз‹·зЊЃз‹ізЊѓз‹є"],
    ["e240","й‡¦",62],
    ["e280","й€Ґ",32,"з‹»зЊ—зЊ“зЊЎзЊЉзЊћзЊќзЊ•зЊўзЊ№зЊҐзЊ¬зЊёзЊ±зЌђзЌЌзЌ—зЌ зЌ¬зЌЇзЌѕи€›е¤ҐйЈ§е¤¤е¤‚йҐЈйҐ§",5,"йҐґйҐ·йҐЅй¦Ђй¦„й¦‡й¦Љй¦Ќй¦ђй¦‘й¦“й¦”й¦•еєЂеє‘еє‹еє–еєҐеє еє№еєµеєѕеєіиµ“е»’е»‘е»›е»Ёе»Єи†єеї„еї‰еї–еїЏжЂѓеї®жЂ„еїЎеї¤еїѕжЂ…жЂ†еїЄеї­еїёжЂ™жЂµжЂ¦жЂ›жЂЏжЂЌжЂ©жЂ«жЂЉжЂїжЂЎжЃёжЃ№жЃ»жЃєжЃ‚"],
    ["e340","й‰†",45,"й‰µ",16],
    ["e380","йЉ†",7,"йЉЏ",24,"жЃЄжЃЅж‚–ж‚љж‚­ж‚ќж‚ѓж‚’ж‚Њж‚›жѓ¬ж‚»ж‚±жѓќжѓжѓ†жѓљж‚ґж„ ж„¦ж„•ж„Јжѓґж„Ђж„Ћж„«ж…Љж…µж†¬ж†”ж†§ж†·ж‡”ж‡µеїќйљій—©й—«й—±й—ій—µй—¶й—јй—ѕйѓй„й†й€йЉй‹йЊйЌйЏй’й•й–й—й™йљдё¬з€їж€•ж°µж±”ж±њж±ЉжІЈжІ…жІђжІ”жІЊж±Ёж±©ж±ґж±¶жІ†жІ©жіђжі”жІ­жі·жіёжі±жі—жІІжі жі–жієжі«жі®жІ±жі“жіЇжіѕ"],
    ["e440","йЉЁ",5,"йЉЇ",24,"й‹‰",31],
    ["e480","й‹©",32,"жґ№жґ§жґЊжµѓжµ€жґ‡жґ„жґ™жґЋжґ«жµЌжґ®жґµжґљжµЏжµ’жµ”жґіж¶‘жµЇж¶ћж¶ жµћж¶“ж¶”жµњжµ жµјжµЈжёљж·‡ж·…ж·ћжёЋж¶їж· жё‘ж·¦ж·ќж·™жё–ж¶«жёЊж¶®жё«ж№®ж№Ћж№«жєІж№џжє†ж№“ж№”жёІжёҐж№„ж»џжє±жєж» жј­ж»ўжєҐжє§жєЅжє»жє·ж»—жєґж»ЏжєЏж»‚жєџжЅўжЅ†жЅ‡жј¤жј•ж»№жјЇжј¶жЅ‹жЅґжјЄжј‰жј©жѕ‰жѕЌжѕЊжЅёжЅІжЅјжЅєжї‘"],
    ["e540","йЊЉ",51,"йЊї",10],
    ["e580","йЌЉ",31,"йЌ«жї‰жѕ§жѕ№жѕ¶жї‚жїЎжї®жїћжї жїЇзЂљзЂЈзЂ›зЂ№зЂµзЃЏзЃће®Ђе®„е®•е®“е®Ґе®ёз”ЇйЄћжђґеЇ¤еЇ®и¤°еЇ°и№‡и¬‡иѕ¶иї“иї•иїҐиї®иї¤иї©иї¦иїіиїЁйЂ…йЂ„йЂ‹йЂ¦йЂ‘йЂЌйЂ–йЂЎйЂµйЂ¶йЂ­йЂЇйЃ„йЃ‘йЃ’йЃђйЃЁйЃйЃўйЃ›жљ№йЃґйЃЅй‚‚й‚€й‚ѓй‚‹еЅђеЅ—еЅ–еЅе°»е’«е±ђе±™е­±е±Је±¦зѕјејЄеј©еј­и‰ґејјй¬»е±®е¦Ѓе¦ѓе¦Ќе¦©е¦Єе¦Ј"],
    ["e640","йЌ¬",34,"йЋђ",27],
    ["e680","йЋ¬",29,"йЏ‹йЏЊйЏЌе¦—е§Ље¦«е¦ће¦¤е§’е¦Іе¦Їе§—е¦ѕеЁ…еЁ†е§ќеЁ€е§Је§е§№еЁЊеЁ‰еЁІеЁґеЁ‘еЁЈеЁ“е©Ђе©§е©Ље©•еЁје©ўе©µиѓ¬еЄЄеЄ›е©·е©єеЄѕе««еЄІе«’е«”еЄёе« е«Је«±е«–е«¦е«е«ње¬‰е¬—е¬–е¬Іе¬·е­Ђе°•е°ње­ље­Ґе­іе­‘е­“е­ўй©µй©·й©ёй©єй©їй©ЅйЄЂйЄЃйЄ…йЄ€йЄЉйЄђйЄ’йЄ“йЄ–йЄйЄ›йЄњйЄќйЄџйЄ йЄўйЄЈйЄҐйЄ§зєџзєЎзєЈзєҐзєЁзє©"],
    ["e740","йЏЋ",7,"йЏ—",54],
    ["e780","йђЋ",32,"зє­зє°зєѕз»Ђз»Ѓз»‚з»‰з»‹з»Њз»ђз»”з»—з»›з» з»Ўз»Ёз»«з»®з»Їз»±з»ІзјЌз»¶з»єз»»з»ѕзјЃзј‚зјѓзј‡зј€зј‹зјЊзјЏзј‘зј’зј—зј™зјњзј›зјџзјЎ",6,"зјЄзј«зј¬зј­зјЇ",4,"зјµе№єз•їе·›з”ѕй‚•зЋЋзЋ‘зЋ®зЋўзЋџзЏЏзЏ‚зЏ‘зЋ·зЋізЏЂзЏ‰зЏ€зЏҐзЏ™йЎјзђЉзЏ©зЏ§зЏћзЋєзЏІзђЏзђЄз‘›зђ¦зђҐзђЁзђ°зђ®зђ¬"],
    ["e840","йђЇ",14,"йђї",43,"й‘¬й‘­й‘®й‘Ї"],
    ["e880","й‘°",20,"й’‘й’–й’й“‡й“Џй““й“”й“љй“¦й“»й”њй” зђ›зђљз‘Ѓз‘њз‘—з‘•з‘™з‘·з‘­з‘ѕз’њз’Ћз’Ђз’Ѓз’‡з’‹з’ћз’Ёз’©з’ђз’§з“’з’єйџЄйџ«йџ¬жќЊжќ“жќћжќ€жќ©жћҐжћ‡жќЄжќіжћжћ§жќµжћЁжћћжћ­жћ‹жќ·жќјжџ°ж ‰жџж Љжџ©жћ°ж Њжџ™жћµжџљжћіжџќж Ђжџѓжћёжџўж ЋжџЃжџЅж Іж іжЎ жЎЎжЎЋжЎўжЎ„жЎ¤жўѓж ќжЎ•жЎ¦жЎЃжЎ§жЎЂж ѕжЎЉжЎ‰ж ©жўµжўЏжЎґжЎ·жў“жЎ«жЈ‚жҐ®жЈјж¤џж¤ жЈ№"],
    ["e940","й”§й”ій”Ѕй•ѓй•€й•‹й••й•љй• й•®й•ґй•µй•·",7,"й–Ђ",42],
    ["e980","й–«",32,"ж¤¤жЈ°ж¤‹ж¤ЃжҐ—жЈЈж¤ђжҐ±ж¤№жҐ жҐ‚жҐќж¦„жҐ«ж¦Ђж¦жҐёж¤ґж§Њж¦‡ж¦€ж§Ћж¦‰жҐ¦жҐЈжҐ№ж¦›ж¦§ж¦»ж¦«ж¦­ж§”ж¦±ж§Ѓж§Љж§џж¦•ж§ ж¦Ќж§їжЁЇж§­жЁ—жЁж©Ґж§Іж©„жЁѕжЄ ж©ђж©›жЁµжЄЋж©№жЁЅжЁЁж©ж©јжЄ‘жЄђжЄ©жЄ—жЄ«зЊ·зЌ’ж®Ѓж®‚ж®‡ж®„ж®’ж®“ж®Ќж®љж®›ж®Ўж®ЄиЅ«иЅ­иЅ±иЅІиЅіиЅµиЅ¶иЅёиЅ·иЅ№иЅєиЅјиЅѕиѕЃиѕ‚иѕ„иѕ‡иѕ‹"],
    ["ea40","й—Њ",27,"й—¬й—їй‡й“йй›йћй йЈ",6,"й«й¬й­йЇй°й·йёй№йєйѕй™Ѓй™ѓй™Љй™Ћй™Џй™‘й™’й™“й™–й™—"],
    ["ea80","й™й™™й™љй™њй™ќй™ћй™ й™Јй™Ґй™¦й™«й™­",4,"й™ій™ё",12,"йљ‡йљ‰йљЉиѕЌиѕЋиѕЏиѕиѕљи»Ћж€‹ж€—ж€›ж€џж€ўж€Ўж€Ґж€¤ж€¬и‡§з“Їз“ґз“їз”Џз”‘з”“ж”ґж—®ж—Їж—°жЉж™жќІжѓж•жЂз‚…ж›·жќжґж±ж¶жµиЂ†ж™џж™”ж™Ѓж™Џж™–ж™Ўж™—ж™·жљ„жљЊжљ§жљќжљѕж››ж›њж›¦ж›©иґІиґіиґ¶иґ»иґЅиµЂиµ…иµ†иµ€иµ‰иµ‡иµЌиµ•иµ™и§‡и§Љи§‹и§Њи§Ћи§Џи§ђи§‘з‰®зЉџз‰ќз‰¦з‰Їз‰ѕз‰їзЉ„зЉ‹зЉЌзЉЏзЉ’жЊ€жЊІжЋ°"],
    ["eb40","йљЊйљЋйљ‘йљ’йљ“йљ•йљ–йљљйљ›йљќ",9,"йљЁ",7,"йљ±йљІйљґйљµйљ·йљёйљєйљ»йљїй›‚й›ѓй›€й›Љй›‹й›ђй›‘й›“й›”й›–",9,"й›Ў",6,"й›«"],
    ["eb80","й›¬й›­й›®й›°й›±й›Ій›ґй›µй›ёй›єй›»й›јй›Ѕй›їйњ‚йњѓйњ…йњЉйњ‹йњЊйњђйњ‘йњ’йњ”йњ•йњ—",4,"йњќйњџйњ жђїж“иЂ„жЇЄжЇіжЇЅжЇµжЇ№ж°…ж°‡ж°†ж°Ќж°•ж°ж°™ж°љж°Ўж°©ж°¤ж°Єж°Іж”µж••ж•«з‰Ќз‰’з‰–з€°и™ўе€–и‚џи‚њи‚“и‚јжњЉи‚Ѕи‚±и‚«и‚­и‚ґи‚·иѓ§иѓЁиѓ©иѓЄиѓ›иѓ‚иѓ„иѓ™иѓЌиѓ—жњђиѓќиѓ«иѓ±иѓґиѓ­и„Ќи„ЋиѓІиѓјжњ•и„’и±љи„¶и„ћи„¬и„и„Іи…€и…Њи…“и…ґи…™и…љи…±и… и…©и…ји…Ѕи…­и…§еЎЌеЄµи†€и†‚и†‘ж»•и†Ји†Єи‡Њжњ¦и‡Љи†»"],
    ["ec40","йњЎ",8,"йњ«йњ¬йњ®йњЇйњ±йњі",4,"йњєйњ»йњјйњЅйњї",18,"йќ”йќ•йќ—йќйќљйќњйќќйќџйќЈйќ¤йќ¦йќ§йќЁйќЄ",7],
    ["ec80","йќІйќµйќ·",4,"йќЅ",7,"йћ†",4,"йћЊйћЋйћЏйћђйћ“йћ•йћ–йћ—йћ™",4,"и‡Ѓи†¦ж¬¤ж¬·ж¬№ж­ѓж­†ж­™йЈ‘йЈ’йЈ“йЈ•йЈ™йЈљж®іеЅЂжЇ‚и§іж–ђйЅ‘ж–“ж–јж—†ж—„ж—ѓж—Њж—Ћж—’ж—–з‚Ђз‚њз‚–з‚ќз‚»зѓЂз‚·з‚«з‚±зѓЁзѓЉз„ђз„“з„–з„Їз„±з…із…њз…Ёз……з…Із…Љз…ёз…єз†з†із†µз†Ёз† з‡ з‡”з‡§з‡№з€ќз€ЁзЃ¬з„з…¦з†№ж€ѕж€Ѕж‰ѓж‰€ж‰‰з¤»зҐЂзҐ†зҐ‰зҐ›зҐњзҐ“зҐљзҐўзҐ—зҐ зҐЇзҐ§зҐєз¦…з¦Љз¦љз¦§з¦іеї‘еїђ"],
    ["ed40","йћћйћџйћЎйћўйћ¤",6,"йћ¬йћ®йћ°йћ±йћійћµ",46],
    ["ed80","йџ¤йџҐйџЁйџ®",4,"йџґйџ·",23,"жЂјжЃќжЃљжЃ§жЃЃжЃ™жЃЈж‚«ж„†ж„Ќж…ќж†©ж†ќж‡‹ж‡‘ж€†и‚ЂиЃїжІ“жі¶ж·јзџ¶зџёз Ђз ‰з —з з ‘ж–«з ­з њз ќз №з єз »з џз јз Ґз ¬з Јз ©зЎЋзЎ­зЎ–зЎ—з ¦зЎђзЎ‡зЎЊзЎЄзў›зў“зўљзў‡зўњзўЎзўЈзўІзў№зўҐзЈ”зЈ™зЈ‰зЈ¬зЈІз¤…зЈґз¤“з¤¤з¤ћз¤ґйѕ›й»№й»»й»јз›±зњ„зњЌз›№зњ‡зњ€зњљзњўзњ™зњ­зњ¦зњµзњёзќђзќ‘зќ‡зќѓзќљзќЁ"],
    ["ee40","й Џ",62],
    ["ee80","йЎЋ",32,"зќўзќҐзќїзћЌзќЅзћЂзћЊзћ‘зћџзћ зћ°зћµзћЅз”єз•Ђз•Ћз•‹з•€з•›з•Із•№з–ѓзЅзЅЎзЅџи©€зЅЁзЅґзЅ±зЅ№зѕЃзЅѕз›Ќз›Ґи Ій’…й’†й’‡й’‹й’Љй’Њй’Ќй’Џй’ђй’”й’—й’•й’љй’›й’њй’Јй’¤й’«й’Єй’­й’¬й’Їй’°й’Ій’ґй’¶",4,"й’јй’Ѕй’їй“„й“€",6,"й“ђй“‘й“’й“•й“–й“—й“™й“й“›й“ћй“џй“ й“ўй“¤й“Ґй“§й“Ёй“Є"],
    ["ef40","йЎЇ",5,"йў‹йўЋйў’йў•йў™йўЈйўЁ",37,"йЈЏйЈђйЈ”йЈ–йЈ—йЈ›йЈњйЈќйЈ ",4],
    ["ef80","йЈҐйЈ¦йЈ©",30,"й“©й“«й“®й“Їй“ій“ґй“µй“·й“№й“јй“Ѕй“їй”ѓй”‚й”†й”‡й”‰й”Љй”Ќй”Ћй”Џй”’",4,"й”й”›й”ќй”ћй”џй”ўй”Єй”«й”©й”¬й”±й”Ій”ґй”¶й”·й”ёй”јй”ѕй”їй•‚й”µй•„й•…й•†й•‰й•Њй•Ћй•Џй•’й•“й•”й•–й•—й•й•™й•›й•ћй•џй•ќй•Ўй•ўй•¤",8,"й•Їй•±й•Ій•ій”єзџ§зџ¬й›‰з§•з§­з§Јз§«зЁ†еµ‡зЁѓзЁ‚зЁћзЁ”"],
    ["f040","й¤€",4,"й¤Ћй¤Џй¤‘",28,"й¤Ї",26],
    ["f080","йҐЉ",9,"йҐ–",12,"йҐ¤йҐ¦йҐійҐёйҐ№йҐ»йҐѕй¦‚й¦ѓй¦‰зЁ№зЁ·з©‘й»Џй¦Ґз©°зљ€зљЋзљ“зљ™зљ¤з“ћз“ з”¬йё йёўйёЁ",4,"йёІйё±йё¶йёёйё·йё№йёєйёѕй№Ѓй№‚й№„й№†й№‡й№€й№‰й№‹й№Њй№Ћй№‘й№•й№—й№љй№›й№њй№ћй№Јй№¦",6,"й№±й№­й№із–’з–”з––з– з–ќз–¬з–Јз–із–ґз–ёз—„з–±з–°з—ѓз—‚з—–з—Ќз—Јз—Ёз—¦з—¤з—«з—§зѓз—±з—јз—їзђзЂз…зЊз—зЉзҐзз•з™"],
    ["f140","й¦Њй¦Ћй¦љ",10,"й¦¦й¦§й¦©",47],
    ["f180","й§™",32,"з›зјзўз з™Ђз­з°зїзµз™ѓзѕзіз™Ќз™ћз™”з™њз™–з™«з™ЇзїЉз«¦з©ёз©№зЄЂзЄ†зЄ€зЄ•зЄ¦зЄ зЄ¬зЄЁзЄ­зЄіиЎ¤иЎ©иЎІиЎЅиЎїиў‚иўўиЈ†иў·иўјиЈ‰иЈўиЈЋиЈЈиЈҐиЈ±и¤љиЈјиЈЁиЈѕиЈ°и¤Ўи¤™и¤“и¤›и¤Љи¤ґи¤«и¤¶иҐЃиҐ¦иҐ»з–‹иѓҐзљІзљґзџњиЂ’иЂ”иЂ–иЂњиЂ иЂўиЂҐиЂ¦иЂ§иЂ©иЂЁиЂ±иЂ‹иЂµиЃѓиЃ†иЃЌиЃ’иЃ©иЃ±и¦ѓйЎёйўЂйўѓ"],
    ["f240","й§є",62],
    ["f280","йЁ№",32,"йў‰йўЊйўЌйўЏйў”йўљйў›йўћйўџйўЎйўўйўҐйў¦и™Ќи™”и™¬и™®и™їи™єи™ји™»иљЁиљЌиљ‹иљ¬иљќиљ§иљЈиљЄиљ“иљ©иљ¶и›„иљµи›Ћиљ°иљєиљ±иљЇи›‰и›Џиљґи›©и›±и›Іи›­и›іи›ђињ“и›ћи›ґи›џи›и›‘ињѓињ‡и›ёињ€ињЉињЌињ‰ињЈињ»ињћињҐињ®ињљињѕиќ€ињґињ±ињ©ињ·ињїић‚ињўиќЅиќѕиќ»иќ иќ°иќЊиќ®ић‹иќ“иќЈиќјиќ¤иќ™иќҐић“ићЇићЁиџ’"],
    ["f340","й©љ",17,"й©ІйЄѓйЄ‰йЄЌйЄЋйЄ”йЄ•йЄ™йЄ¦йЄ©",6,"йЄІйЄійЄґйЄµйЄ№йЄ»йЄЅйЄѕйЄїй«ѓй«„й«†",4,"й«Ќй«Ћй«Џй«ђй«’й«”й«•й«–й«—й«™й«љй«›й«њ"],
    ["f380","й«ќй«ћй« й«ўй«Јй«¤й«Ґй«§й«Ёй«©й«Єй«¬й«®й«°",8,"й«єй«ј",6,"й¬„й¬…й¬†иџ†ић€ић…ић­ић—ићѓић«иџҐић¬ићµићіиџ‹иџ“ићЅиџ‘иџЂиџЉиџ›иџЄиџ иџ®и –и “иџѕи Љи ›и Ўи №и јзј¶зЅ‚зЅ„зЅ…и€ђз«єз«Ѕз¬€з¬ѓз¬„з¬•з¬Љз¬«з¬Џз­‡з¬ёз¬Єз¬™з¬®з¬±з¬ з¬Ґз¬¤з¬із¬ѕз¬ћз­з­љз­…з­µз­Њз­ќз­ з­®з­»з­ўз­Із­±з®ђз®¦з®§з®ёз®¬з®ќз®Ёз®…з®Єз®њз®ўз®«з®ґзЇ‘зЇЃзЇЊзЇќзЇљзЇҐзЇ¦зЇЄз°ЊзЇѕзЇјз°Џз°–з°‹"],
    ["f440","й¬‡й¬‰",5,"й¬ђй¬‘й¬’й¬”",10,"й¬ й¬Ўй¬ўй¬¤",10,"й¬°й¬±й¬і",7,"й¬Ѕй¬ѕй¬їй­Ђй­†й­Љй­‹й­Њй­Ћй­ђй­’й­“й­•",5],
    ["f480","й­›",32,"з°џз°Єз°¦з°ёз±Ѓз±Ђи‡ѕи€Ѓи€‚и€„и‡¬иЎ„и€Ўи€ўи€Ји€­и€Їи€Ёи€«и€ёи€»и€іи€ґи€ѕи‰„и‰‰и‰‹и‰Џи‰љи‰џи‰ЁиЎѕиў…иў€иЈиЈџиҐћзѕќзѕџзѕ§зѕЇзѕ°зѕІз±јж•‰зІ‘зІќзІњзІћзІўзІІзІјзІЅзіЃзі‡зіЊзіЌзі€зі…зі—зіЁи‰®жљЁзѕїзїЋзї•зїҐзїЎзї¦зї©зї®зїізіёзµ·з¶¦з¶®з№‡зє›йєёйєґиµіи¶„и¶”и¶‘и¶±иµ§иµ­и±‡и±‰й…Љй…ђй…Ћй…Џй…¤"],
    ["f540","й­ј",62],
    ["f580","й®»",32,"й…ўй…Ўй…°й…©й…Їй…Ѕй…ѕй…Ій…ґй…№й†Њй†…й†ђй†Ќй†‘й†ўй†Јй†Єй†­й†®й†Їй†µй†ґй†єи±•й№ѕи¶ёи·«иё…и№™и№©и¶µи¶їи¶ји¶єи·„и·–и·—и·љи·ћи·Ћи·Џи·›и·†и·¬и··и·ёи·Ји·№и·»и·¤иё‰и·Ѕиё”иёќиёџиё¬иё®иёЈиёЇиёєи№Ђиё№иёµиёЅиё±и№‰и№Ѓи№‚и№‘и№’и№Љи№°и№¶и№ји№Їи№ґиє…иєЏиє”иєђиєњиєћи±ёиІ‚иІЉиІ…иІиІ”ж–›и§–и§ћи§љи§њ"],
    ["f640","йЇњ",62],
    ["f680","й°›",32,"и§Ґи§«и§ЇиЁѕи¬¦йќ“й›©й›ій›Їйњ†йњЃйњ€йњЏйњЋйњЄйњ­йњ°йњѕйѕЂйѕѓйѕ…",5,"йѕЊй»ѕйј‹йјЌйљ№йљјйљЅй›Ћй›’зћїй› йЉЋйЉ®й‹€йЊѕйЌЄйЏЉйЋЏйђѕй‘«й±їйІ‚йІ…йІ†йІ‡йІ€зЁЈйІ‹йІЋйІђйІ‘йІ’йІ”йІ•йІљйІ›йІћ",5,"йІҐ",4,"йІ«йІ­йІ®йІ°",7,"йІєйІ»йІјйІЅйі„йі…йі†йі‡йіЉйі‹"],
    ["f740","й°ј",62],
    ["f780","й±»й±Ѕй±ѕйІЂйІѓйІ„йІ‰йІЉйІЊйІЏйІ“йІ–йІ—йІйІ™йІќйІЄйІ¬йІЇйІ№йІѕ",4,"йі€йі‰йі‘йі’йіљйі›йі йіЎйіЊ",4,"йі“йі”йі•йі—йійі™йіњйіќйіџйіўйќјйћ…йћ‘йћ’йћ”йћЇйћ«йћЈйћІйћґйЄ±йЄ°йЄ·й№йЄ¶йЄєйЄјй«Ѓй«Ђй«…й«‚й«‹й«Њй«‘й­…й­ѓй­‡й­‰й­€й­Ќй­‘йЈЁй¤Ќй¤®йҐ•йҐ”й«џй«Ўй«¦й«Їй««й«»й«­й«№й¬€й¬Џй¬“й¬џй¬ЈйєЅйєѕзё»йє‚йє‡йє€йє‹йє’йЏ–йєќйєџй»›й»њй»ќй» й»џй»ўй»©й»§й»Ґй»Єй»Їйјўйј¬йјЇйј№йј·йјЅйјѕйЅ„"],
    ["f840","йіЈ",62],
    ["f880","йґў",32],
    ["f940","йµѓ",62],
    ["f980","й¶‚",32],
    ["fa40","й¶Ј",62],
    ["fa80","й·ў",32],
    ["fb40","йёѓ",27,"йё¤йё§йё®йё°йёґйё»йёјй№Ђй№Ќй№ђй№’й№“й№”й№–й№™й№ќй№џй№ й№Ўй№ўй№Ґй№®й№Їй№Ій№ґ",9,"йєЂ"],
    ["fb80","йєЃйєѓйє„йє…йє†йє‰йєЉйєЊ",5,"йє”",8,"йєћйє ",5,"йє§йєЁйє©йєЄ"],
    ["fc40","йє«",8,"йєµйє¶йє·йє№йєєйєјйєї",4,"й»…й»†й»‡й»€й»Љй»‹й»Њй»ђй»’й»“й»•й»–й»—й»™й»љй»ћй»Ўй»Јй»¤й»¦й»Ёй»«й»¬й»­й»®й»°",8,"й»єй»Ѕй»ї",6],
    ["fc80","йј†",4,"йјЊйјЏйј‘йј’йј”йј•йј–йјйјљ",5,"йјЎйјЈ",8,"йј­йј®йј°йј±"],
    ["fd40","йјІ",4,"йјёйјєйјјйјї",4,"йЅ…",10,"йЅ’",38],
    ["fd80","йЅ№",5,"йѕЃйѕ‚йѕЌ",11,"йѕњйѕќйѕћйѕЎ",4,"п¤¬пҐ№п¦•п§§п§±"],
    ["fe40","пЁЊпЁЌпЁЋпЁЏпЁ‘пЁ“пЁ”пЁпЁџпЁ пЁЎпЁЈпЁ¤пЁ§пЁЁпЁ©"]
    ]
    
    },{}],18:[function(require,module,exports){
    module.exports=[
    ["0","\u0000",127],
    ["8141","к°‚к°ѓк°…к°†к°‹",4,"к°к°ћк°џк°Ўк°ўк°Јк°Ґ",6,"к°®к°Ік°ік°ґ"],
    ["8161","к°µк°¶к°·к°єк°»к°Ѕк°ѕк°їк±Ѓ",9,"к±Њк±Ћ",5,"к±•"],
    ["8181","к±–к±—к±™к±љк±›к±ќ",18,"к±Ік±ік±µк±¶к±№к±»",4,"кІ‚кІ‡кІ€кІЌкІЋкІЏкІ‘кІ’кІ“кІ•",6,"кІћкІў",5,"кІ«кІ­кІ®кІ±",6,"кІєкІѕкІїкіЂкі‚кіѓкі…кі†кі‡кі‰кіЉкі‹кіЌ",7,"кі–кі",7,"кіўкіЈкіҐкі¦кі©кі«кі­кі®кіІкіґкі·",4,"кіѕкіїкґЃкґ‚кґѓкґ…кґ‡",4,"кґЋкґђкґ’кґ“"],
    ["8241","кґ”кґ•кґ–кґ—кґ™кґљкґ›кґќкґћкґџкґЎ",7,"кґЄкґ«кґ®",5],
    ["8261","кґ¶кґ·кґ№кґєкґ»кґЅ",6,"кµ†кµ€кµЉ",5,"кµ‘кµ’кµ“кµ•кµ–кµ—"],
    ["8281","кµ™",7,"кµўкµ¤",7,"кµ®кµЇкµ±кµІкµ·кµёкµ№кµєкµѕк¶Ђк¶ѓ",4,"к¶Љк¶‹к¶Ќк¶Ћк¶Џк¶‘",10,"к¶ћ",5,"к¶Ґ",17,"к¶ё",7,"к·‚к·ѓк·…к·†к·‡к·‰",6,"к·’к·”",7,"к·ќк·ћк·џк·Ўк·ўк·Јк·Ґ",18],
    ["8341","к·єк·»к·Ѕк·ѕкё‚",5,"кёЉкёЊкёЋ",5,"кё•",7],
    ["8361","кёќ",18,"кёІкёікёµкё¶кё№кё»кёј"],
    ["8381","кёЅкёѕкёїк№‚к№„к№‡к№€к№‰к№‹к№Џк№‘к№’к№“к№•к№—",4,"к№ћк№ўк№Јк№¤к№¦к№§к№Єк№«к№­к№®к№Їк№±",6,"к№єк№ѕ",5,"кє†",5,"кєЌ",46,"кєїк»Ѓк»‚к»ѓк»…",6,"к»Ћк»’",5,"к»љк»›к»ќ",8],
    ["8441","к»¦к»§к»©к»Єк»¬к»®",5,"к»µк»¶к»·к»№к»єк»»к»Ѕ",8],
    ["8461","кј†кј‰кјЉкј‹кјЊкјЋкјЏкј‘",18],
    ["8481","кј¤",7,"кј®кјЇкј±кјікјµ",6,"кјѕкЅЂкЅ„кЅ…кЅ†кЅ‡кЅЉ",5,"кЅ‘",10,"кЅћ",5,"кЅ¦",18,"кЅє",5,"кѕЃкѕ‚кѕѓкѕ…кѕ†кѕ‡кѕ‰",6,"кѕ’кѕ“кѕ”кѕ–",5,"кѕќ",26,"кѕєкѕ»кѕЅкѕѕ"],
    ["8541","кѕїкїЃ",5,"кїЉкїЊкїЏ",4,"кї•",6,"кїќ",4],
    ["8561","кїў",5,"кїЄ",5,"кїІкїікїµкї¶кї·кї№",6,"лЂ‚лЂѓ"],
    ["8581","лЂ…",6,"лЂЌлЂЋлЂЏлЂ‘лЂ’лЂ“лЂ•",6,"лЂћ",9,"лЂ©",26,"лЃ†лЃ‡лЃ‰лЃ‹лЃЌлЃЏлЃђлЃ‘лЃ’лЃ–лЃлЃљлЃ›лЃњлЃћ",29,"лЃѕлЃїл‚Ѓл‚‚л‚ѓл‚…",6,"л‚Ћл‚ђл‚’",5,"л‚›л‚ќл‚ћл‚Јл‚¤"],
    ["8641","л‚Ґл‚¦л‚§л‚Єл‚°л‚Іл‚¶л‚·л‚№л‚єл‚»л‚Ѕ",6,"лѓ†лѓЉ",5,"лѓ’"],
    ["8661","лѓ“лѓ•лѓ–лѓ—лѓ™",6,"лѓЎлѓўлѓЈлѓ¤лѓ¦",10],
    ["8681","лѓ±",22,"л„Љл„Ќл„Ћл„Џл„‘л„”л„•л„–л„—л„љл„ћ",4,"л„¦л„§л„©л„Єл„«л„­",6,"л„¶л„є",5,"л…‚л…ѓл……л…†л…‡л…‰",6,"л…’л…“л…–л…—л…™л…љл…›л…ќл…ћл…џл…Ў",22,"л…єл…»л…Ѕл…ѕл…їл†Ѓл†ѓ",4,"л†Љл†Њл†Ћл†Џл†ђл†‘л†•л†–л†—л†™л†љл†›л†ќ"],
    ["8741","л†ћ",9,"л†©",15],
    ["8761","л†№",18,"л‡Ќл‡Ћл‡Џл‡‘л‡’л‡“л‡•"],
    ["8781","л‡–",5,"л‡ћл‡ ",7,"л‡Єл‡«л‡­л‡®л‡Їл‡±",7,"л‡єл‡јл‡ѕ",5,"л€†л€‡л€‰л€Љл€Ќ",6,"л€–л€л€љ",5,"л€Ў",18,"л€µ",6,"л€Ѕ",26,"л‰™л‰љл‰›л‰ќл‰ћл‰џл‰Ў",6,"л‰Є",4],
    ["8841","л‰Ї",4,"л‰¶",5,"л‰Ѕ",6,"лЉ†лЉ‡лЉ€лЉЉ",4],
    ["8861","лЉЏлЉ’лЉ“лЉ•лЉ–лЉ—лЉ›",4,"лЉўлЉ¤лЉ§лЉЁлЉ©лЉ«лЉ­лЉ®лЉЇлЉ±лЉІлЉілЉµлЉ¶лЉ·"],
    ["8881","лЉё",15,"л‹Љл‹‹л‹Ќл‹Ћл‹Џл‹‘л‹“",4,"л‹љл‹њл‹ћл‹џл‹ л‹Ўл‹Јл‹§л‹©л‹Єл‹°л‹±л‹Іл‹¶л‹јл‹Ѕл‹ѕлЊ‚лЊѓлЊ…лЊ†лЊ‡лЊ‰",6,"лЊ’лЊ–",5,"лЊќ",54,"лЌ—лЌ™лЌљлЌќлЌ лЌЎлЌўлЌЈ"],
    ["8941","лЌ¦лЌЁлЌЄлЌ¬лЌ­лЌЇлЌІлЌілЌµлЌ¶лЌ·лЌ№",6,"лЋ‚лЋ†",5,"лЋЌ"],
    ["8961","лЋЋлЋЏлЋ‘лЋ’лЋ“лЋ•",10,"лЋў",5,"лЋ©лЋЄлЋ«лЋ­"],
    ["8981","лЋ®",21,"лЏ†лЏ‡лЏ‰лЏЉлЏЌлЏЏлЏ‘лЏ’лЏ“лЏ–лЏлЏљлЏњлЏћлЏџлЏЎлЏўлЏЈлЏҐлЏ¦лЏ§лЏ©",18,"лЏЅ",18,"лђ‘",6,"лђ™лђљлђ›лђќлђћлђџлђЎ",6,"лђЄлђ¬",7,"лђµ",15],
    ["8a41","л‘…",10,"л‘’л‘“л‘•л‘–л‘—л‘™",6,"л‘ўл‘¤л‘¦"],
    ["8a61","л‘§",4,"л‘­",18,"л’Ѓл’‚"],
    ["8a81","л’ѓ",4,"л’‰",19,"л’ћ",5,"л’Ґл’¦л’§л’©л’Єл’«л’­",7,"л’¶л’ёл’є",5,"л“Ѓл“‚л“ѓл“…л“†л“‡л“‰",6,"л“‘л“’л““л“”л“–",5,"л“ћл“џл“Ўл“ўл“Ґл“§",4,"л“®л“°л“І",5,"л“№",26,"л”–л”—л”™л”љл”ќ"],
    ["8b41","л”ћ",5,"л”¦л”«",4,"л”Іл”іл”µл”¶л”·л”№",6,"л•‚л•†"],
    ["8b61","л•‡л•€л•‰л•Љл•Ћл•Џл•‘л•’л•“л••",6,"л•ћл•ў",8],
    ["8b81","л•«",52,"л–ўл–Јл–Ґл–¦л–§л–©л–¬л–­л–®л–Їл–Іл–¶",4,"л–ѕл–їл—Ѓл—‚л—ѓл—…",6,"л—Ћл—’",5,"л—™",18,"л—­",18],
    ["8c41","лЂ",15,"л’л“л•л–л—л™",4],
    ["8c61","лћ",6,"л¦",5,"л­",6,"лµ",5],
    ["8c81","л»",12,"л™‰",26,"л™Ґл™¦л™§л™©",50,"лљћлљџлљЎлљўлљЈлљҐ",5,"лљ­лљ®лљЇлљ°лљІ",16],
    ["8d41","л›ѓ",16,"л›•",8],
    ["8d61","л›ћ",17,"л›±л›Іл›іл›µл›¶л›·л›№л›є"],
    ["8d81","л›»",4,"лњ‚лњѓлњ„лњ†",33,"лњЄлњ«лњ­лњ®лњ±",6,"лњєлњј",7,"лќ…лќ†лќ‡лќ‰лќЉлќ‹лќЌ",6,"лќ–",9,"лќЎлќўлќЈлќҐлќ¦лќ§лќ©",6,"лќІлќґлќ¶",5,"лќѕлќїлћЃлћ‚лћѓлћ…",6,"лћЋлћ“лћ”лћ•лћљлћ›лћќлћћ"],
    ["8e41","лћџлћЎ",6,"лћЄлћ®",5,"лћ¶лћ·лћ№",8],
    ["8e61","лџ‚",4,"лџ€лџЉ",19],
    ["8e81","лџћ",13,"лџ®лџЇлџ±лџІлџілџµ",6,"лџѕл ‚",4,"л Љл ‹л Ќл Ћл Џл ‘",6,"л љл њл ћ",5,"л ¦л §л ©л Єл «л ­",6,"л ¶л є",5,"лЎЃлЎ‚лЎѓлЎ…",11,"лЎ’лЎ”",7,"лЎћлЎџлЎЎлЎўлЎЈлЎҐ",6,"лЎ®лЎ°лЎІ",5,"лЎ№лЎєлЎ»лЎЅ",7],
    ["8f41","лў…",7,"лўЋ",17],
    ["8f61","лў ",7,"лў©",6,"лў±лўІлўілўµлў¶лў·лў№",4],
    ["8f81","лўѕлўїлЈ‚лЈ„лЈ†",5,"лЈЌлЈЋлЈЏлЈ‘лЈ’лЈ“лЈ•",7,"лЈћлЈ лЈў",5,"лЈЄлЈ«лЈ­лЈ®лЈЇлЈ±",6,"лЈєлЈјлЈѕ",5,"л¤…",18,"л¤™",6,"л¤Ў",26,"л¤ѕл¤їлҐЃлҐ‚лҐѓлҐ…",6,"лҐЌлҐЋлҐђлҐ’",5],
    ["9041","лҐљлҐ›лҐќлҐћлҐџлҐЎ",6,"лҐЄлҐ¬лҐ®",5,"лҐ¶лҐ·лҐ№лҐєлҐ»лҐЅ"],
    ["9061","лҐѕ",5,"л¦†л¦€л¦‹л¦Њл¦Џ",15],
    ["9081","л¦џ",12,"л¦®л¦Їл¦±л¦Іл¦іл¦µ",6,"л¦ѕл§Ђл§‚",5,"л§Љл§‹л§Ќл§“",4,"л§љл§њл§џл§ л§ўл§¦л§§л§©л§Єл§«л§­",6,"л§¶л§»",4,"лЁ‚",5,"лЁ‰",11,"лЁ–",33,"лЁєлЁ»лЁЅлЁѕлЁїл©Ѓл©ѓл©„л©…л©†"],
    ["9141","л©‡л©Љл©Њл©Џл©ђл©‘л©’л©–л©—л©™л©љл©›л©ќ",6,"л©¦л©Є",5],
    ["9161","л©Іл©іл©µл©¶л©·л©№",9,"лЄ†лЄ€лЄ‰лЄЉлЄ‹лЄЌ",5],
    ["9181","лЄ“",20,"лЄЄлЄ­лЄ®лЄЇлЄ±лЄі",4,"лЄєлЄјлЄѕ",5,"л«…л«†л«‡л«‰",14,"л«љ",33,"л«Ѕл«ѕл«їл¬Ѓл¬‚л¬ѓл¬…",7,"л¬Ћл¬ђл¬’",5,"л¬™л¬љл¬›л¬ќл¬ћл¬џл¬Ў",6],
    ["9241","л¬Ёл¬Єл¬¬",7,"л¬·л¬№л¬єл¬ї",4,"л­†л­€л­Љл­‹л­Њл­Ћл­‘л­’"],
    ["9261","л­“л­•л­–л­—л­™",7,"л­ўл­¤",7,"л­­",4],
    ["9281","л­І",21,"л®‰л®Љл®‹л®Ќл®Ћл®Џл®‘",18,"л®Ґл®¦л®§л®©л®Єл®«л®­",6,"л®µл®¶л®ё",7,"лЇЃлЇ‚лЇѓлЇ…лЇ†лЇ‡лЇ‰",6,"лЇ‘лЇ’лЇ”",35,"лЇєлЇ»лЇЅлЇѕл°Ѓ"],
    ["9341","л°ѓ",4,"л°Љл°Ћл°ђл°’л°“л°™л°љл° л°Ўл°ўл°Јл°¦л°Ёл°Єл°«л°¬л°®л°Їл°Іл°іл°µ"],
    ["9361","л°¶л°·л°№",6,"л±‚л±†л±‡л±€л±Љл±‹л±Ћл±Џл±‘",8],
    ["9381","л±љл±›л±њл±ћ",37,"лІ†лІ‡лІ‰лІЉлІЌлІЏ",4,"лІ–лІлІ›",4,"лІўлІЈлІҐлІ¦лІ©",6,"лІІлІ¶",5,"лІѕлІїліЃлі‚ліѓлі…",7,"ліЋлі’лі“лі”лі–лі—лі™ліљлі›ліќ",22,"лі·лі№лієлі»ліЅ"],
    ["9441","ліѕ",5,"лґ†лґ€лґЉ",5,"лґ‘лґ’лґ“лґ•",8],
    ["9461","лґћ",5,"лґҐ",6,"лґ­",12],
    ["9481","лґє",5,"лµЃ",6,"лµЉлµ‹лµЌлµЋлµЏлµ‘",6,"лµљ",9,"лµҐлµ¦лµ§лµ©",22,"л¶‚л¶ѓл¶…л¶†л¶‹",4,"л¶’л¶”л¶–л¶—л¶л¶›л¶ќ",6,"л¶Ґ",10,"л¶±",6,"л¶№",24],
    ["9541","л·’л·“л·–л·—л·™л·љл·›л·ќ",11,"л·Є",5,"л·±"],
    ["9561","л·Іл·іл·µл·¶л··л·№",6,"лёЃлё‚лё„лё†",5,"лёЋлёЏлё‘лё’лё“"],
    ["9581","лё•",6,"лёћлё ",35,"л№†л№‡л№‰л№Љл№‹л№Ќл№Џ",4,"л№–л№л№њл№ќл№ћл№џл№ўл№Јл№Ґл№¦л№§л№©л№«",4,"л№Іл№¶",4,"л№ѕл№їлєЃлє‚лєѓлє…",6,"лєЋлє’",5,"лєљ",13,"лє©",14],
    ["9641","лєё",23,"л»’л»“"],
    ["9661","л»•л»–л»™",6,"л»Ўл»ўл»¦",5,"л»­",8],
    ["9681","л»¶",10,"лј‚",5,"лјЉ",13,"лјљлјћ",33,"лЅ‚лЅѓлЅ…лЅ†лЅ‡лЅ‰",6,"лЅ’лЅ“лЅ”лЅ–",44],
    ["9741","лѕѓ",16,"лѕ•",8],
    ["9761","лѕћ",17,"лѕ±",7],
    ["9781","лѕ№",11,"лї†",5,"лїЋлїЏлї‘лї’лї“лї•",6,"лїќлїћлї лїў",89,"мЂЅмЂѕмЂї"],
    ["9841","мЃЂ",16,"мЃ’",5,"мЃ™мЃљмЃ›"],
    ["9861","мЃќмЃћмЃџмЃЎ",6,"мЃЄ",15],
    ["9881","мЃє",21,"м‚’м‚“м‚•м‚–м‚—м‚™",6,"м‚ўм‚¤м‚¦",5,"м‚®м‚±м‚Ім‚·",4,"м‚ѕмѓ‚мѓѓмѓ„мѓ†мѓ‡мѓЉмѓ‹мѓЌмѓЋмѓЏмѓ‘",6,"мѓљмѓћ",5,"мѓ¦мѓ§мѓ©мѓЄмѓ«мѓ­",6,"мѓ¶мѓёмѓє",5,"м„Ѓм„‚м„ѓм„…м„†м„‡м„‰",6,"м„‘м„’м„“м„”м„–",5,"м„Ўм„ўм„Ґм„Ём„©м„Єм„«м„®"],
    ["9941","м„Ім„ім„ґм„µм„·м„єм„»м„Ѕм„ѕм„їм…Ѓ",6,"м…Љм…Ћ",5,"м…–м…—"],
    ["9961","м…™м…љм…›м…ќ",6,"м…¦м…Є",5,"м…±м…Ім…ім…µм…¶м…·м…№м…єм…»"],
    ["9981","м…ј",8,"м††",5,"м†Џм†‘м†’м†“м†•м†—",4,"м†ћм† м†ўм†Јм†¤м†¦м†§м†Єм†«м†­м†®м†Їм†±",11,"м†ѕ",5,"м‡…м‡†м‡‡м‡‰м‡Љм‡‹м‡Ќ",6,"м‡•м‡–м‡™",6,"м‡Ўм‡ўм‡Јм‡Ґм‡¦м‡§м‡©",6,"м‡Ім‡ґ",7,"м‡ѕм‡їм€Ѓм€‚м€ѓм€…",6,"м€Ћм€ђм€’",5,"м€љм€›м€ќм€ћм€Ўм€ўм€Ј"],
    ["9a41","м€¤м€Ґм€¦м€§м€Єм€¬м€®м€°м€ім€µ",16],
    ["9a61","м‰†м‰‡м‰‰",6,"м‰’м‰“м‰•м‰–м‰—м‰™",6,"м‰Ўм‰ўм‰Јм‰¤м‰¦"],
    ["9a81","м‰§",4,"м‰®м‰Їм‰±м‰Ім‰ім‰µ",6,"м‰ѕмЉЂмЉ‚",5,"мЉЉ",5,"мЉ‘",6,"мЉ™мЉљмЉњмЉћ",5,"мЉ¦мЉ§мЉ©мЉЄмЉ«мЉ®",5,"мЉ¶мЉёмЉє",33,"м‹ћм‹џм‹Ўм‹ўм‹Ґ",5,"м‹®м‹°м‹Ім‹ім‹ґм‹µм‹·м‹єм‹Ѕм‹ѕм‹їмЊЃ",6,"мЊЉмЊ‹мЊЋмЊЏ"],
    ["9b41","мЊђмЊ‘мЊ’мЊ–мЊ—мЊ™мЊљмЊ›мЊќ",6,"мЊ¦мЊ§мЊЄ",8],
    ["9b61","мЊі",17,"мЌ†",7],
    ["9b81","мЌЋ",25,"мЌЄмЌ«мЌ­мЌ®мЌЇмЌ±мЌі",4,"мЌємЌ»мЌѕ",5,"мЋ…мЋ†мЋ‡мЋ‰мЋЉмЋ‹мЋЌ",50,"мЏЃ",22,"мЏљ"],
    ["9c41","мЏ›мЏќмЏћмЏЎмЏЈ",4,"мЏЄмЏ«мЏ¬мЏ®",5,"мЏ¶мЏ·мЏ№",5],
    ["9c61","мЏї",8,"мђ‰",6,"мђ‘",9],
    ["9c81","мђ›",8,"мђҐ",6,"мђ­мђ®мђЇмђ±мђІмђімђµ",6,"мђѕ",9,"м‘‰",26,"м‘¦м‘§м‘©м‘Єм‘«м‘­",6,"м‘¶м‘·м‘ём‘є",5,"м’Ѓ",18,"м’•",6,"м’ќ",12],
    ["9d41","м’Є",13,"м’№м’єм’»м’Ѕ",8],
    ["9d61","м“†",25],
    ["9d81","м“ ",8,"м“Є",5,"м“Ім“ім“µм“¶м“·м“№м“»м“јм“Ѕм“ѕм”‚",9,"м”Ќм”Ћм”Џм”‘м”’м”“м”•",6,"м”ќ",10,"м”Єм”«м”­м”®м”Їм”±",6,"м”єм”јм”ѕ",5,"м•†м•‡м•‹м•Џм•ђм•‘м•’м•–м•љм•›м•њм•џм•ўм•Јм•Ґм•¦м•§м•©",6,"м•Ім•¶",5,"м•ѕм•їм–Ѓм–‚м–ѓм–…м–†м–€м–‰м–Љм–‹м–Ћм–ђм–’м–“м–”"],
    ["9e41","м––м–™м–љм–›м–ќм–ћм–џм–Ў",7,"м–Є",9,"м–¶"],
    ["9e61","м–·м–єм–ї",4,"м—‹м—Ќм—Џм—’м—“м—•м—–м——м—™",6,"м—ўм—¤м—¦м—§"],
    ["9e81","м—Ём—©м—Єм—«м—Їм—±м—Ім—ім—µм—ём—№м—єм—»м‚мѓм„м‰мЉм‹мЌмЋмЏм‘",6,"мљмќ",6,"м¦м§м©мЄм«мЇм±мІм¶мёмємјмЅмѕмїм™‚м™ѓм™…м™†м™‡м™‰",6,"м™’м™–",5,"м™ћм™џм™Ў",10,"м™­м™®м™°м™І",5,"м™єм™»м™Ѕм™ѕм™їмљЃ",6,"мљЉмљЊмљЋ",5,"мљ–мљ—мљ™мљљмљ›мљќ",6,"мљ¦"],
    ["9f41","мљЁмљЄ",5,"мљІмљімљµмљ¶мљ·мљ»",4,"м›‚м›„м›†",5,"м›Ћ"],
    ["9f61","м›Џм›‘м›’м›“м›•",6,"м›ћм›џм›ў",5,"м›Єм›«м›­м›®м›Їм›±м›І"],
    ["9f81","м›і",4,"м›єм›»м›јм›ѕ",5,"мњ†мњ‡мњ‰мњЉмњ‹мњЌ",6,"мњ–мњмњљ",5,"мњўмњЈмњҐмњ¦мњ§мњ©",6,"мњІмњґмњ¶мњёмњ№мњємњ»мњѕмњїмќЃмќ‚мќѓмќ…",4,"мќ‹мќЋмќђмќ™мќљмќ›мќќмќћмќџмќЎ",6,"мќ©мќЄмќ¬",7,"мќ¶мќ·мќ№мќємќ»мќїмћЂмћЃмћ‚мћ†мћ‹мћЊмћЌмћЏмћ’мћ“мћ•мћ™мћ›",4,"мћўмћ§",4,"мћ®мћЇмћ±мћІмћімћµмћ¶мћ·"],
    ["a041","мћёмћ№мћємћ»мћѕмџ‚",5,"мџЉмџ‹мџЌмџЏмџ‘",6,"мџ™мџљмџ›мџњ"],
    ["a061","мџћ",5,"мџҐмџ¦мџ§мџ©мџЄмџ«мџ­",13],
    ["a081","мџ»",4,"м ‚м ѓм …м †м ‡м ‰м ‹",4,"м ’м ”м —",4,"м ћм џм Ўм ўм Јм Ґ",6,"м ®м °м І",5,"м №м єм »м Ѕм ѕм їмЎЃ",6,"мЎЉмЎ‹мЎЋ",5,"мЎ•",26,"мЎІмЎімЎµмЎ¶мЎ·мЎ№мЎ»",4,"мў‚мў„мў€мў‰мўЉмўЋ",5,"мў•",7,"мўћмў мўўмўЈмў¤"],
    ["a141","мўҐмў¦мў§мў©",18,"мўѕмўїмЈЂмЈЃ"],
    ["a161","мЈ‚мЈѓмЈ…мЈ†мЈ‡мЈ‰мЈЉмЈ‹мЈЌ",6,"мЈ–мЈмЈљ",5,"мЈўмЈЈмЈҐ"],
    ["a181","мЈ¦",14,"мЈ¶",5,"мЈѕмЈїм¤Ѓм¤‚м¤ѓм¤‡",4,"м¤ЋгЂЂгЂЃгЂ‚В·вЂҐвЂ¦ВЁгЂѓВ­вЂ•в€Ґпјјв€јвЂвЂ™вЂњвЂќгЂ”гЂ•гЂ€",9,"В±Г—Г·в‰ в‰¤в‰Ґв€ћв€ґВ°вЂІвЂів„ѓв„«пї пїЎпїҐв™‚в™Ђв€ вЉҐвЊ’в€‚в€‡в‰Ўв‰’В§вЂ»в†в…в—‹в—Џв—Ћв—‡в—†в–Ўв– в–ів–Ів–Ѕв–јв†’в†ђв†‘в†“в†”гЂ“в‰Єв‰«в€љв€Ѕв€ќв€µв€«в€¬в€€в€‹вЉ†вЉ‡вЉ‚вЉѓв€Єв€©в€§в€Ёпїў"],
    ["a241","м¤ђм¤’",5,"м¤™",18],
    ["a261","м¤­",6,"м¤µ",18],
    ["a281","мҐ€",7,"мҐ’мҐ“мҐ•мҐ–мҐ—мҐ™",6,"мҐўмҐ¤",7,"мҐ­мҐ®мҐЇв‡’в‡”в€Ђв€ѓВґпЅћЛ‡ЛЛќЛљЛ™ВёЛ›ВЎВїЛђв€®в€‘в€ЏВ¤в„‰вЂ°в—Ѓв—Ђв–·в–¶в™¤в™ в™Ўв™Ґв™§в™ЈвЉ™в—€в–Јв—ђв—‘в–’в–¤в–Ґв–Ёв–§в–¦в–©в™ЁвЏвЋвњвћВ¶вЂ вЂЎв†•в†—в†™в†–в†в™­в™©в™Єв™¬г‰їг€њв„–гЏ‡в„ўгЏ‚гЏв„Ўв‚¬В®"],
    ["a341","мҐ±мҐІмҐімҐµ",6,"мҐЅ",10,"м¦Љм¦‹м¦Ќм¦Ћм¦Џ"],
    ["a361","м¦‘",6,"м¦љм¦њм¦ћ",16],
    ["a381","м¦Ї",16,"м§‚м§ѓм§…м§†м§‰м§‹",4,"м§’м§”м§—м§м§›пјЃ",58,"пї¦пјЅ",32,"пїЈ"],
    ["a441","м§ћм§џм§Ўм§Јм§Ґм§¦м§Ём§©м§Єм§«м§®м§І",5,"м§єм§»м§Ѕм§ѕм§їмЁЃмЁ‚мЁѓмЁ„"],
    ["a461","мЁ…мЁ†мЁ‡мЁЉмЁЋ",5,"мЁ•мЁ–мЁ—мЁ™",12],
    ["a481","мЁ¦мЁ§мЁЁмЁЄ",28,"г„±",93],
    ["a541","м©‡",4,"м©Ћм©Џм©‘м©’м©“м©•",6,"м©ћм©ў",5,"м©©м©Є"],
    ["a561","м©«",17,"м©ѕ",5,"мЄ…мЄ†"],
    ["a581","мЄ‡",16,"мЄ™",14,"в…°",9],
    ["a5b0","в… ",9],
    ["a5c1","О‘",16,"ОЈ",6],
    ["a5e1","О±",16,"Пѓ",6],
    ["a641","мЄЁ",19,"мЄѕмЄїм«Ѓм«‚м«ѓм«…"],
    ["a661","м«†",5,"м«Ћм«ђм«’м«”м«•м«–м«—м«љ",5,"м«Ў",6],
    ["a681","м«Ём«©м«Єм««м«­",6,"м«µ",18,"м¬‰м¬Љв”Ђв”‚в”Њв”ђв”в””в”њв”¬в”¤в”ґв”јв”Ѓв”ѓв”Џв”“в”›в”—в”Јв”ів”«в”»в•‹в” в”Їв”Ёв”·в”їв”ќв”°в”Ґв”ёв•‚в”’в”‘в”љв”™в”–в”•в”Ћв”Ќв”ћв”џв”Ўв”ўв”¦в”§в”©в”Єв”­в”®в”±в”Ів”µв”¶в”№в”єв”Ѕв”ѕв•Ђв•Ѓв•ѓ",7],
    ["a741","м¬‹",4,"м¬‘м¬’м¬“м¬•м¬–м¬—м¬™",6,"м¬ў",7],
    ["a761","м¬Є",22,"м­‚м­ѓм­„"],
    ["a781","м­…м­†м­‡м­Љм­‹м­Ќм­Ћм­Џм­‘",6,"м­љм­›м­њм­ћ",5,"м­Ґ",7,"гЋ•гЋ–гЋ—в„“гЋгЏ„гЋЈгЋ¤гЋҐгЋ¦гЋ™",9,"гЏЉгЋЌгЋЋгЋЏгЏЏгЋ€гЋ‰гЏ€гЋ§гЋЁгЋ°",9,"гЋЂ",4,"гЋє",5,"гЋђ",4,"в„¦гЏЂгЏЃгЋЉгЋ‹гЋЊгЏ–гЏ…гЋ­гЋ®гЋЇгЏ›гЋ©гЋЄгЋ«гЋ¬гЏќгЏђгЏ“гЏѓгЏ‰гЏњгЏ†"],
    ["a841","м­­",10,"м­є",14],
    ["a861","м®‰",18,"м®ќ",6],
    ["a881","м®¤",19,"м®№",11,"Г†ГђВЄД¦"],
    ["a8a6","ДІ"],
    ["a8a8","ДїЕЃГЕ’ВєГћЕ¦ЕЉ"],
    ["a8b1","г‰ ",27,"в“ђ",25,"в‘ ",14,"ВЅв…“в…”ВјВѕв…›в…њв…ќв…ћ"],
    ["a941","мЇ…",14,"мЇ•",10],
    ["a961","мЇ мЇЎмЇўмЇЈмЇҐмЇ¦мЇЁмЇЄ",18],
    ["a981","мЇЅ",14,"м°Ћм°Џм°‘м°’м°“м°•",6,"м°ћм°џм° м°Јм°¤Г¦Д‘Г°Д§Д±ДіДёЕЂЕ‚ГёЕ“ГџГѕЕ§Е‹Е‰г€Ђ",27,"в’њ",25,"в‘ґ",14,"В№ВІВівЃґвЃїв‚Ѓв‚‚в‚ѓв‚„"],
    ["aa41","м°Ґм°¦м°Єм°«м°­м°Їм°±",6,"м°єм°ї",4,"м±†м±‡м±‰м±Љм±‹м±Ќм±Ћ"],
    ["aa61","м±Џ",4,"м±–м±љ",5,"м±Ўм±ўм±Јм±Ґм±§м±©",6,"м±±м±І"],
    ["aa81","м±ім±ґм±¶",29,"гЃЃ",82],
    ["ab41","мІ”мІ•мІ–мІ—мІљмІ›мІќмІћмІџмІЎ",6,"мІЄмІ®",5,"мІ¶мІ·мІ№"],
    ["ab61","мІємІ»мІЅ",6,"мі†мі€міЉ",5,"мі‘мі’мі“мі•",5],
    ["ab81","мі›",8,"міҐ",6,"мі­мі®міЇмі±",12,"г‚Ў",85],
    ["ac41","міѕміїмґЂмґ‚",5,"мґЉмґ‹мґЌмґЋмґЏмґ‘",6,"мґљмґњмґћмґџмґ "],
    ["ac61","мґЎмґўмґЈмґҐмґ¦мґ§мґ©мґЄмґ«мґ­",11,"мґє",4],
    ["ac81","мґї",28,"мµќмµћмµџРђ",5,"РЃР–",25],
    ["acd1","Р°",5,"С‘Р¶",25],
    ["ad41","мµЎмµўмµЈмµҐ",6,"мµ®мµ°мµІ",5,"мµ№",7],
    ["ad61","м¶Ѓ",6,"м¶‰",10,"м¶–м¶—м¶™м¶љм¶›м¶ќм¶ћм¶џ"],
    ["ad81","м¶ м¶Ўм¶ўм¶Јм¶¦м¶Ём¶Є",5,"м¶±",18,"м·…"],
    ["ae41","м·†",5,"м·Ќм·Ћм·Џм·‘",16],
    ["ae61","м·ў",5,"м·©м·Єм·«м·­м·®м·Їм·±",6,"м·єм·јм·ѕ",4],
    ["ae81","мёѓмё…мё†мё‡мё‰мёЉмё‹мёЌ",6,"мё•мё–мё—мёмёљ",5,"мёўмёЈмёҐмё¦мё§мё©мёЄмё«"],
    ["af41","мё¬мё­мё®мёЇмёІмёґмё¶",19],
    ["af61","м№Љ",13,"м№љм№›м№ќм№ћм№ў",5,"м№Єм№¬"],
    ["af81","м№®",5,"м№¶м№·м№№м№єм№»м№Ѕ",6,"мє†мє€мєЉ",5,"мє’мє“мє•мє–мє—мє™"],
    ["b041","мєљ",5,"мєўмє¦",5,"мє®",12],
    ["b061","мє»",5,"м»‚",19],
    ["b081","м»–",13,"м»¦м»§м»©м»Єм»­",6,"м»¶м»є",5,"к°Ђк°Ѓк°„к°‡к°€к°‰к°Љк°ђ",7,"к°™",4,"к° к°¤к°¬к°­к°Їк°°к°±к°ёк°№к°јк±Ђк±‹к±Ќк±”к±к±њк±°к±±к±ґк±·к±ёк±єкІЂкІЃкІѓкІ„кІ…кІ†кІ‰кІЉкІ‹кІЊкІђкІ”кІњкІќкІџкІ кІЎкІЁкІ©кІЄкІ¬кІЇкІ°кІёкІ№кІ»кІјкІЅкіЃкі„кі€кіЊкі•кі—кі кіЎкі¤кі§кіЁкіЄкі¬кіЇкі°кі±кіікіµкі¶кіјкіЅкґЂкґ„кґ†"],
    ["b141","мј‚мјѓмј…мј†мј‡мј‰",6,"мј’мј”мј–",5,"мјќмјћмјџмјЎмјўмјЈ"],
    ["b161","мјҐ",6,"мј®мјІ",5,"мј№",11],
    ["b181","мЅ…",14,"мЅ–мЅ—мЅ™мЅљмЅ›мЅќ",6,"мЅ¦мЅЁмЅЄмЅ«мЅ¬кґЊкґЌкґЏкґ‘кґкґњкґ кґ©кґ¬кґ­кґґкґµкґёкґјкµ„кµ…кµ‡кµ‰кµђкµ”кµкµЎкµЈкµ¬кµ­кµ°кµікµґкµµкµ¶кµ»кµјкµЅкµїк¶Ѓк¶‚к¶€к¶‰к¶Њк¶ђк¶њк¶ќк¶¤к¶·к·Ђк·Ѓк·„к·€к·ђк·‘к·“к·њк· к·¤к·ёк·№к·јк·їкёЂкёЃкё€кё‰кё‹кёЌкё”кё°кё±кёґкё·кёёкёєк№Ђк№Ѓк№ѓк№…к№†к№Љк№Њк№Ќк№Ћк№ђк№”к№–к№њк№ќк№џк№ к№Ўк№Ґк№Ёк№©к№¬к№°к№ё"],
    ["b241","мЅ­мЅ®мЅЇмЅІмЅімЅµмЅ¶мЅ·мЅ№",6,"мѕЃмѕ‚мѕѓмѕ„мѕ†",5,"мѕЌ"],
    ["b261","мѕЋ",18,"мѕў",5,"мѕ©"],
    ["b281","мѕЄ",5,"мѕ±",18,"мї…",6,"к№№к№»к№јк№Ѕкє„кє…кєЊкєјкєЅкєѕк»Ђк»„к»Њк»Ќк»Џк»ђк»‘к»к»™к»њк»Ёк»«к»­к»ґк»ёк»јкј‡кј€кјЌкјђкј¬кј­кј°кјІкјґкјјкјЅкјїкЅЃкЅ‚кЅѓкЅ€кЅ‰кЅђкЅњкЅќкЅ¤кЅҐкЅ№кѕЂкѕ„кѕ€кѕђкѕ‘кѕ•кѕњкѕёкѕ№кѕјкїЂкї‡кї€кї‰кї‹кїЌкїЋкї”кїњкїЁкї©кї°кї±кїґкїёлЂЂлЂЃлЂ„лЂЊлЂђлЂ”лЂњлЂќлЂЁлЃ„лЃ…лЃ€лЃЉлЃЊлЃЋлЃ“лЃ”лЃ•лЃ—лЃ™"],
    ["b341","мїЊ",19,"мїўмїЈмїҐмї¦мї§мї©"],
    ["b361","мїЄ",5,"мїІмїґмї¶",5,"мїЅмїѕмїїнЂЃнЂ‚нЂѓнЂ…",5],
    ["b381","нЂ‹",5,"нЂ’",5,"нЂ™",19,"лЃќлЃјлЃЅл‚Ђл‚„л‚Њл‚Ќл‚Џл‚‘л‚л‚™л‚љл‚њл‚џл‚ л‚Ўл‚ўл‚Ёл‚©л‚«",4,"л‚±л‚іл‚ґл‚µл‚ёл‚јлѓ„лѓ…лѓ‡лѓ€лѓ‰лѓђлѓ‘лѓ”лѓлѓ лѓҐл„€л„‰л„‹л„Њл„ђл„’л„“л„л„™л„›л„њл„ќл„Јл„¤л„Ґл„Ёл„¬л„ґл„µл„·л„ёл„№л…Ђл…Ѓл…„л…€л…ђл…‘л…”л…•л…л…њл… л…ёл…№л…јл†Ђл†‚л†€л†‰л†‹л†Ќл†’л†“л†”л†л†њл†Ёл‡Њл‡ђл‡”л‡њл‡ќ"],
    ["b441","нЂ®",5,"нЂ¶нЂ·нЂ№нЂєнЂ»нЂЅ",6,"нЃ†нЃ€нЃЉ",5],
    ["b461","нЃ‘нЃ’нЃ“нЃ•нЃ–нЃ—нЃ™",6,"нЃЎ",10,"нЃ®нЃЇ"],
    ["b481","нЃ±нЃІнЃінЃµ",6,"нЃѕнЃїн‚Ђн‚‚",18,"л‡џл‡Ёл‡©л‡¬л‡°л‡№л‡»л‡Ѕл€„л€…л€€л€‹л€Њл€”л€•л€—л€™л€ л€ґл€јл‰л‰њл‰ л‰Ёл‰©л‰ґл‰µл‰јлЉ„лЉ…лЉ‰лЉђлЉ‘лЉ”лЉлЉ™лЉљлЉ лЉЎлЉЈлЉҐлЉ¦лЉЄлЉ¬лЉ°лЉґл‹€л‹‰л‹Њл‹ђл‹’л‹л‹™л‹›л‹ќл‹ўл‹¤л‹Ґл‹¦л‹Ёл‹«",4,"л‹іл‹ґл‹µл‹·",4,"л‹їлЊЂлЊЃлЊ„лЊ€лЊђлЊ‘лЊ“лЊ”лЊ•лЊњлЌ”лЌ•лЌ–лЌлЌ›лЌњлЌћлЌџлЌ¤лЌҐ"],
    ["b541","н‚•",14,"н‚¦н‚§н‚©н‚Єн‚«н‚­",5],
    ["b561","н‚ін‚¶н‚ён‚є",5,"нѓ‚нѓѓнѓ…нѓ†нѓ‡нѓЉ",5,"нѓ’нѓ–",4],
    ["b581","нѓ›нѓћнѓџнѓЎнѓўнѓЈнѓҐ",6,"нѓ®нѓІ",5,"нѓ№",11,"лЌ§лЌ©лЌ«лЌ®лЌ°лЌ±лЌґлЌёлЋЂлЋЃлЋѓлЋ„лЋ…лЋЊлЋђлЋ”лЋ лЋЎлЋЁлЋ¬лЏ„лЏ…лЏ€лЏ‹лЏЊлЏЋлЏђлЏ”лЏ•лЏ—лЏ™лЏ›лЏќлЏ лЏ¤лЏЁлЏјлђђлђлђњлђ лђЁлђ©лђ«лђґл‘ђл‘‘л‘”л‘л‘ л‘Ўл‘Јл‘Ґл‘¬л’Ђл’€л’ќл’¤л’Ёл’¬л’µл’·л’№л“Ђл“„л“€л“ђл“•л“њл“ќл“ л“Јл“¤л“¦л“¬л“­л“Їл“±л“ёл””л”•л”л”›л”њл”¤л”Ґл”§л”Ёл”©л”Єл”°л”±л”ґл”ё"],
    ["b641","н„…",7,"н„Ћ",17],
    ["b661","н„ ",15,"н„Ін„ін„µн„¶н„·н„№н„»н„јн„Ѕн„ѕ"],
    ["b681","н„їн…‚н…†",5,"н…Ћн…Џн…‘н…’н…“н…•",6,"н…ћн… н…ў",5,"н…©н…Єн…«н…­л•Ђл•Ѓл•ѓл•„л•…л•‹л•Њл•Ќл•ђл•”л•њл•ќл•џл• л•Ўл– л–Ўл–¤л–Ёл–Єл–«л–°л–±л–іл–ґл–µл–»л–јл–Ѕл—Ђл—„л—Њл—Ќл—Џл—ђл—‘л—л—¬лђл‘л”ллҐл¬лґл™€л™¤л™Ёлљњлљќлљ лљ¤лљ«лљ¬лљ±л›”л›°л›ґл›ёлњЂлњЃлњ…лњЁлњ©лњ¬лњЇлњ°лњёлњ№лњ»лќ„лќ€лќЊлќ”лќ•лќ лќ¤лќЁлќ°лќ±лќілќµлќјлќЅлћЂлћ„лћЊлћЌлћЏлћђлћ‘лћ’лћ–лћ—"],
    ["b741","н…®",13,"н…Ѕ",6,"н†…н††н†‡н†‰н†Љ"],
    ["b761","н†‹",20,"н†ўн†Јн†Ґн†¦н†§"],
    ["b781","н†©",6,"н†Ін†ґн†¶н†·н†ён†№н†»н†Ѕн†ѕн†їн‡Ѓ",14,"лћлћ™лћњлћ лћЁлћ©лћ«лћ¬лћ­лћґлћµлћёлџ‡лџ‰лџ¬лџ­лџ°лџґлџјлџЅлџїл Ђл Ѓл ‡л €л ‰л Њл ђл л ™л ›л ќл ¤л Ґл Ёл ¬л ґл µл ·л ёл №лЎЂлЎ„лЎ‘лЎ“лЎњлЎќлЎ лЎ¤лЎ¬лЎ­лЎЇлЎ±лЎёлЎјлўЌлўЁлў°лўґлўёлЈЂлЈЃлЈѓлЈ…лЈЊлЈђлЈ”лЈќлЈџлЈЎлЈЁлЈ©лЈ¬лЈ°лЈёлЈ№лЈ»лЈЅл¤„л¤л¤ л¤јл¤ЅлҐЂлҐ„лҐЊлҐЏлҐ‘лҐлҐ™лҐњлҐ лҐЁлҐ©"],
    ["b841","н‡ђ",7,"н‡™",17],
    ["b861","н‡«",8,"н‡µн‡¶н‡·н‡№",13],
    ["b881","н€€н€Љ",5,"н€‘",24,"лҐ«лҐ­лҐґлҐµлҐёлҐјл¦„л¦…л¦‡л¦‰л¦Љл¦Ќл¦Ћл¦¬л¦­л¦°л¦ґл¦јл¦Ѕл¦їл§Ѓл§€л§‰л§Њл§Ћ",4,"л§л§™л§›л§ќл§ћл§Ўл§Јл§¤л§Ґл§Ёл§¬л§ґл§µл§·л§ёл§№л§єлЁЂлЁЃлЁ€лЁ•лЁёлЁ№лЁјл©Ђл©‚л©€л©‰л©‹л©Ќл©Ћл©“л©”л©•л©л©њл©¤л©Ґл©§л©Ёл©©л©°л©±л©ґл©ёлЄѓлЄ„лЄ…лЄ‡лЄЊлЄЁлЄ©лЄ«лЄ¬лЄ°лЄІлЄёлЄ№лЄ»лЄЅл«„л«€л«л«™л«ј"],
    ["b941","н€Єн€«н€®н€Їн€±н€Ін€ін€µ",6,"н€ѕн‰Ђн‰‚",5,"н‰‰н‰Љн‰‹н‰Њ"],
    ["b961","н‰Ќ",14,"н‰ќ",6,"н‰Ґн‰¦н‰§н‰Ё"],
    ["b981","н‰©",22,"нЉ‚нЉѓнЉ…нЉ†нЉ‡нЉ‰нЉЉнЉ‹нЉЊл¬Ђл¬„л¬Ќл¬Џл¬‘л¬л¬њл¬ л¬©л¬«л¬ґл¬µл¬¶л¬ёл¬»л¬јл¬Ѕл¬ѕл­„л­…л­‡л­‰л­Ќл­Џл­ђл­”л­л­Ўл­Јл­¬л®€л®Њл®ђл®¤л®Ёл®¬л®ґл®·лЇЂлЇ„лЇ€лЇђлЇ“лЇёлЇ№лЇјлЇїл°Ђл°‚л°€л°‰л°‹л°Њл°Ќл°Џл°‘л°”",4,"л°›",4,"л°¤л°Ґл°§л°©л°­л°°л°±л°ґл°ёл±Ђл±Ѓл±ѓл±„л±…л±‰л±Њл±Ќл±ђл±ќлІ„лІ…лІ€лІ‹лІЊлІЋлІ”лІ•лІ—"],
    ["ba41","нЉЌнЉЋнЉЏнЉ’нЉ“нЉ”нЉ–",5,"нЉќнЉћнЉџнЉЎнЉўнЉЈнЉҐ",6,"нЉ­"],
    ["ba61","нЉ®нЉЇнЉ°нЉІ",5,"нЉєнЉ»нЉЅнЉѕн‹Ѓн‹ѓ",4,"н‹Љн‹Њ",5],
    ["ba81","н‹’н‹“н‹•н‹–н‹—н‹™н‹љн‹›н‹ќ",6,"н‹¦",9,"н‹Ін‹ін‹µн‹¶н‹·н‹№н‹єлІ™лІљлІ лІЎлІ¤лІ§лІЁлІ°лІ±лІілІґлІµлІјлІЅліЂлі„ліЌліЏліђлі‘лі•ліліњліґліµлі¶ліёліјлґ„лґ…лґ‡лґ‰лґђлґ”лґ¤лґ¬лµЂлµ€лµ‰лµЊлµђлµлµ™лµ¤лµЁл¶Ђл¶Ѓл¶„л¶‡л¶€л¶‰л¶Љл¶ђл¶‘л¶“л¶•л¶™л¶љл¶њл¶¤л¶°л¶ёл·”л·•л·л·њл·©л·°л·ґл·ёлёЂлёѓлё…лёЊлёЌлёђлё”лёњлёќлёџл№„л№…л№€л№Њл№Ћл№”л№•л№—л№™л№љл№›л№ л№Ўл№¤"],
    ["bb41","н‹»",4,"нЊ‚нЊ„нЊ†",5,"нЊЏнЊ‘нЊ’нЊ“нЊ•нЊ—",4,"нЊћнЊўнЊЈ"],
    ["bb61","нЊ¤нЊ¦нЊ§нЊЄнЊ«нЊ­нЊ®нЊЇнЊ±",6,"нЊєнЊѕ",5,"нЌ†нЌ‡нЌ€нЌ‰"],
    ["bb81","нЌЉ",31,"л№Ёл№Єл№°л№±л№іл№ґл№µл№»л№јл№ЅлєЂлє„лєЊлєЌлєЏлєђлє‘лєлє™лєЁл»ђл»‘л»”л»—л»л» л»Јл»¤л»Ґл»¬лјЃлј€лј‰лјлј™лј›лјњлјќлЅЂлЅЃлЅ„лЅ€лЅђлЅ‘лЅ•лѕ”лѕ°лї…лїЊлїЌлїђлї”лїњлїџлїЎмЂјмЃ‘мЃмЃњмЃ мЃЁмЃ©м‚ђм‚‘м‚”м‚м‚ м‚Ўм‚Јм‚Ґм‚¬м‚­м‚Їм‚°м‚ім‚ґм‚µм‚¶м‚јм‚Ѕм‚їмѓЂмѓЃмѓ…мѓ€мѓ‰мѓЊмѓђмѓмѓ™мѓ›мѓњмѓќмѓ¤"],
    ["bc41","нЌЄ",17,"нЌѕнЌїнЋЃнЋ‚нЋѓнЋ…нЋ†нЋ‡"],
    ["bc61","нЋ€нЋ‰нЋЉнЋ‹нЋЋнЋ’",5,"нЋљнЋ›нЋќнЋћнЋџнЋЎ",6,"нЋЄнЋ¬нЋ®"],
    ["bc81","нЋЇ",4,"нЋµнЋ¶нЋ·нЋ№нЋєнЋ»нЋЅ",6,"нЏ†нЏ‡нЏЉ",5,"нЏ‘",5,"мѓҐмѓЁмѓ¬мѓґмѓµмѓ·мѓ№м„Ђм„„м„€м„ђм„•м„њ",4,"м„Јм„¤м„¦м„§м„¬м„­м„Їм„°м„±м„¶м„ём„№м„јм…Ђм…€м…‰м…‹м…Њм…Ќм…”м…•м…м…њм…¤м…Ґм…§м…Ём…©м…°м…ґм…ём†…м†Њм†Ќм†Ћм†ђм†”м†–м†њм†ќм†џм†Ўм†Ґм†Ём†©м†¬м†°м†Ѕм‡„м‡€м‡Њм‡”м‡—м‡м‡ м‡¤м‡Ём‡°м‡±м‡ім‡јм‡Ѕм€Ђм€„м€Њм€Ќм€Џм€‘м€м€™м€њм€џм€ м€Ём€©м€«м€­"],
    ["bd41","нЏ—нЏ™",7,"нЏўнЏ¤",7,"нЏ®нЏЇнЏ±нЏІнЏінЏµнЏ¶нЏ·"],
    ["bd61","нЏёнЏ№нЏєнЏ»нЏѕнђЂнђ‚",5,"нђ‰",13],
    ["bd81","нђ—",5,"нђћ",25,"м€Їм€±м€Ім€ґм‰€м‰ђм‰‘м‰”м‰м‰ м‰Ґм‰¬м‰­м‰°м‰ґм‰јм‰Ѕм‰їмЉЃмЉ€мЉ‰мЉђмЉмЉ›мЉќмЉ¤мЉҐмЉЁмЉ¬мЉ­мЉґмЉµмЉ·мЉ№м‹њм‹ќм‹ м‹Јм‹¤м‹«м‹¬м‹­м‹Їм‹±м‹¶м‹ём‹№м‹»м‹јмЊЂмЊ€мЊ‰мЊЊмЊЌмЊ“мЊ”мЊ•мЊмЊњмЊ¤мЊҐмЊЁмЊ©мЌ…мЌЁмЌ©мЌ¬мЌ°мЌІмЌёмЌ№мЌјмЌЅмЋ„мЋ€мЋЊмЏЂмЏмЏ™мЏњмЏџмЏ мЏўмЏЁмЏ©мЏ­мЏґмЏµмЏёмђ€мђђмђ¤мђ¬мђ°"],
    ["be41","нђё",7,"н‘Ѓн‘‚н‘ѓн‘…",14],
    ["be61","н‘”",7,"н‘ќн‘ћн‘џн‘Ўн‘ўн‘Јн‘Ґ",7,"н‘®н‘°н‘±н‘І"],
    ["be81","н‘і",4,"н‘єн‘»н‘Ѕн‘ѕн’Ѓн’ѓ",4,"н’Љн’Њн’Ћ",5,"н’•",8,"мђґмђјмђЅм‘€м‘¤м‘Ґм‘Ём‘¬м‘ґм‘µм‘№м’Ђм’”м’њм’ём’јм“©м“°м“±м“ґм“ём“єм“їм”Ђм”Ѓм”Њм”ђм””м”њм”Ём”©м”¬м”°м”ём”№м”»м”Ѕм•„м•…м•€м•‰м•Љм•Њм•Ќм•Ћм•“м•”м••м•—м•м•™м•ќм•ћм• м•Ўм•¤м•Ём•°м•±м•ім•ґм•µм•јм•Ѕм–Ђм–„м–‡м–Њм–Ќм–Џм–‘м–•м–—м–м–њм– м–©м–ґм–µм–ём–№м–»м–јм–Ѕм–ѕм—„",6,"м—Њм—Ћ"],
    ["bf41","н’ћ",10,"н’Є",14],
    ["bf61","н’№",18,"н“Ќн“Ћн“Џн“‘н“’н““н“•"],
    ["bf81","н“–",5,"н“ќн“ћн“ ",7,"н“©н“Єн“«н“­н“®н“Їн“±",6,"н“№н“єн“јм—ђм—‘м—”м—м— м—Ўм—Јм—Ґм—¬м—­м—®м—°м—ґм—¶м—·м—ј",5,"м…м†м‡м€мЊмђмм™м›мњм¤мҐмЁм¬м­м®м°мімґмµм·м№м»м™Ђм™Ѓм™„м™€м™ђм™‘м™“м™”м™•м™њм™ќм™ м™¬м™Їм™±м™ём™№м™јмљЂмљ€мљ‰мљ‹мљЌмљ”мљ•мљмљњмљ¤мљҐмљ§мљ©мљ°мљ±мљґмљёмљ№мљєм›Ђм›Ѓм›ѓм›…м›Њм›Ќм›ђм›”м›њм›ќм› м›Ўм›Ё"],
    ["c041","н“ѕ",5,"н”…н”†н”‡н”‰н”Љн”‹н”Ќ",6,"н”–н”",5],
    ["c061","н”ћ",25],
    ["c081","н”ён”№н”єн”»н”ѕн”їн•Ѓн•‚н•ѓн•…",6,"н•Ћн•ђн•’",5,"н•љн•›н•ќн•ћн•џн•Ўн•ўн•Јм›©м›¬м›°м›ём›№м›Ѕмњ„мњ…мњ€мњЊмњ”мњ•мњ—мњ™мњ мњЎмњ¤мњЁмњ°мњ±мњімњµмњ·мњјмњЅмќЂмќ„мќЉмќЊмќЌмќЏмќ‘",7,"мќњмќ мќЁмќ«мќґмќµмќёмќјмќЅмќѕмћѓмћ„мћ…мћ‡мћ€мћ‰мћЉмћЋмћђмћ‘мћ”мћ–мћ—мћмћљмћ мћЎмћЈмћ¤мћҐмћ¦мћ¬мћ­мћ°мћґмћјмћЅмћїмџЂмџЃмџ€мџ‰мџЊмџЋмџђмџмџќмџ¤мџЁмџ¬м Ђм Ѓм „м €м Љ"],
    ["c141","н•¤н•¦н•§н•Єн•¬н•®",5,"н•¶н•·н•№н•єн•»н•Ѕ",6,"н–†н–Љн–‹"],
    ["c161","н–Њн–Ќн–Ћн–Џн–‘",19,"н–¦н–§"],
    ["c181","н–Ё",31,"м ђм ‘м “м •м –м њм ќм  м ¤м ¬м ­м Їм ±м ём јмЎЂмЎ€мЎ‰мЎЊмЎЌмЎ”мЎ°мЎ±мЎґмЎёмЎємўЂмўЃмўѓмў…мў†мў‡мў‹мўЊмўЌмў”мўќмўџмўЎмўЁмўјмўЅмЈ„мЈ€мЈЊмЈ”мЈ•мЈ—мЈ™мЈ мЈЎмЈ¤мЈµмЈјмЈЅм¤Ђм¤„м¤…м¤†м¤Њм¤Ќм¤Џм¤‘м¤м¤¬м¤ґмҐђмҐ‘мҐ”мҐмҐ мҐЎмҐЈмҐ¬мҐ°мҐґмҐјм¦€м¦‰м¦Њм¦ђм¦м¦™м¦›м¦ќм§Ђм§Ѓм§„м§‡м§€м§Љм§ђм§‘м§“"],
    ["c241","н—Љн—‹н—Ќн—Ћн—Џн—‘н—“",4,"н—љн—њн—ћ",5,"н—¦н—§н—©н—Єн—«н—­н—®"],
    ["c261","н—Ї",4,"н—¶н—ён—є",5,"н‚нѓн…н†н‡н‰",6,"н’"],
    ["c281","н–",5,"нќнћнџнЎнўнЈнҐ",7,"н®",9,"нєн»м§•м§–м§™м§љм§њм§ќм§ м§ўм§¤м§§м§¬м§­м§Їм§°м§±м§ём§№м§јмЁЂмЁ€мЁ‰мЁ‹мЁЊмЁЌмЁ”мЁмЁ©м©Њм©Ќм©ђм©”м©њм©ќм©џм© м©Ўм©Ём©ЅмЄ„мЄмЄјмЄЅм«Ђм«„м«Њм«Ќм«Џм«‘м«“м«м«™м« м«¬м«ґм¬€м¬ђм¬”м¬м¬ м¬Ўм­Ѓм­€м­‰м­Њм­ђм­м­™м­ќм­¤м­ём­№м®њм®ёмЇ”мЇ¤мЇ§мЇ©м°Њм°Ќм°ђм°”м°њм°ќм°Ўм°ўм°§м°Ём°©м°¬м°®м°°м°ём°№м°»"],
    ["c341","нЅнѕнїн™Ѓн™‚н™ѓн™„н™†н™‡н™Љн™Њн™Ћн™Џн™ђн™’н™“н™–н™—н™™н™љн™›н™ќ",4],
    ["c361","н™ў",4,"н™Ён™Є",5,"н™Ін™ін™µ",11],
    ["c381","нљЃнљ‚нљ„нљ†",5,"нљЋнљЏнљ‘нљ’нљ“нљ•",7,"нљћнљ нљў",5,"нљ©нљЄм°јм°Ѕм°ѕм±„м±…м±€м±Њм±”м±•м±—м±м±™м± м±¤м±¦м±Ём±°м±µмІмІ™мІњмІ мІЁмІ©мІ«мІ¬мІ­мІґмІµмІёмІјмі„мі…мі‡мі‰міђмі”мі¤мі¬мі°мґЃмґ€мґ‰мґЊмґђмґмґ™мґ›мґќмґ¤мґЁмґ¬мґ№мµњмµ мµ¤мµ¬мµ­мµЇмµ±мµём¶€м¶”м¶•м¶м¶њм¶¤м¶Ґм¶§м¶©м¶°м·„м·Њм·ђм·Ём·¬м·°м·ём·№м·»м·Ѕмё„мё€мёЊмё”мё™мё мёЎмё¤мёЁмё°мё±мёімёµ"],
    ["c441","нљ«нљ­нљ®нљЇнљ±",7,"нљєнљј",7,"н›†н›‡н›‰н›Љн›‹"],
    ["c461","н›Ќн›Ћн›Џн›ђн›’н›“н›•н›–н›н›љ",5,"н›Ўн›ўн›Јн›Ґн›¦н›§н›©",4],
    ["c481","н›®н›Їн›±н›Ін›ін›ґн›¶",5,"н›ѕн›їнњЃнњ‚нњѓнњ…",11,"нњ’нњ“нњ”м№м№™м№њм№џм№ м№Ўм№Ём№©м№«м№­м№ґм№µм№ём№јмє„мє…мє‡мє‰мєђмє‘мє”мємє мєЎмєЈмє¤мєҐмє¬мє­м»Ѓм»¤м»Ґм»Ём»«м»¬м»ґм»µм»·м»ём»№мјЂмјЃмј„мј€мјђмј‘мј“мј•мјњмј мј¤мј¬мј­мјЇмј°мј±мјёмЅ”мЅ•мЅмЅњмЅ¤мЅҐмЅ§мЅ©мЅ°мЅ±мЅґмЅёмѕЂмѕ…мѕЊмѕЎмѕЁмѕ°мї„мї мїЎмї¤мїЁмї°мї±мїімїµмїјнЂЂнЂ„нЂ‘нЂнЂ­нЂґнЂµнЂёнЂј"],
    ["c541","нњ•нњ–нњ—нњљнњ›нњќнњћнњџнњЎ",6,"нњЄнњ¬нњ®",5,"нњ¶нњ·нњ№"],
    ["c561","нњєнњ»нњЅ",6,"нќ…нќ†нќ€нќЉ",5,"нќ’нќ“нќ•нќљ",4],
    ["c581","нќџнќўнќ¤нќ¦нќ§нќЁнќЄнќ«нќ­нќ®нќЇнќ±нќІнќінќµ",6,"нќѕнќїнћЂнћ‚",5,"нћЉнћ‹нЃ„нЃ…нЃ‡нЃ‰нЃђнЃ”нЃнЃ нЃ¬нЃ­нЃ°нЃґнЃјнЃЅн‚Ѓн‚¤н‚Ґн‚Ён‚¬н‚ґн‚µн‚·н‚№нѓЂнѓЃнѓ„нѓ€нѓ‰нѓђнѓ‘нѓ“нѓ”нѓ•нѓњнѓќнѓ нѓ¤нѓ¬нѓ­нѓЇнѓ°нѓ±нѓён„Ќн„°н„±н„ґн„ён„єн…Ђн…Ѓн…ѓн…„н……н…Њн…Ќн…ђн…”н…њн…ќн…џн…Ўн…Ён…¬н…јн†„н†€н† н†Ўн†¤н†Ён†°н†±н†ін†µн†єн†јн‡Ђн‡н‡ґн‡ён€‡н€‰н€ђн€¬н€­н€°н€ґн€јн€Ѕн€їн‰Ѓн‰€н‰њ"],
    ["c641","нћЌнћЋнћЏнћ‘",6,"нћљнћњнћћ",5],
    ["c6a1","н‰¤нЉЂнЉЃнЉ„нЉ€нЉђнЉ‘нЉ•нЉњнЉ нЉ¤нЉ¬нЉ±нЉёнЉ№нЉјнЉїн‹Ђн‹‚н‹€н‹‰н‹‹н‹”н‹н‹њн‹¤н‹Ґн‹°н‹±н‹ґн‹ёнЊЂнЊЃнЊѓнЊ…нЊЊнЊЌнЊЋнЊђнЊ”нЊ–нЊњнЊќнЊџнЊ нЊЎнЊҐнЊЁнЊ©нЊ¬нЊ°нЊёнЊ№нЊ»нЊјнЊЅнЌ„нЌ…нЌјнЌЅнЋЂнЋ„нЋЊнЋЌнЋЏнЋђнЋ‘нЋнЋ™нЋњнЋ нЋЁнЋ©нЋ«нЋ­нЋґнЋёнЋјнЏ„нЏ…нЏ€нЏ‰нЏђнЏнЏЎнЏЈнЏ¬нЏ­нЏ°нЏґнЏјнЏЅнЏїнђЃ"],
    ["c7a1","нђ€нђќн‘Ђн‘„н‘њн‘ н‘¤н‘­н‘Їн‘ён‘№н‘јн‘їн’Ђн’‚н’€н’‰н’‹н’Ќн’”н’©н“Њн“ђн“”н“њн“џн“Ён“¬н“°н“ён“»н“Ѕн”„н”€н”Њн””н”•н”—н”јн”Ѕн•Ђн•„н•Њн•Ќн•Џн•‘н•н•™н•њн• н•Ґн•Ён•©н•«н•­н•ґн•µн•ён•јн–„н–…н–‡н–€н–‰н–ђн–Ґн—€н—‰н—Њн—ђн—’н—н—™н—›н—ќн—¤н—Ґн—Ён—¬н—ґн—µн—·н—№нЂнЃн„н€нђн‘н“н”н•нњн "],
    ["c8a1","н¤н­нён№нјн™Ђн™…н™€н™‰н™‹н™Ќн™‘н™”н™•н™н™њн™§н™©н™°н™±н™ґнљѓнљ…нљЊнљЌнљђнљ”нљќнљџнљЎнљЁнљ¬нљ°нљ№нљ»н›„н›…н›€н›Њн›‘н›”н›—н›™н› н›¤н›Ён›°н›µн›јн›ЅнњЂнњ„нњ‘нњнњ™нњњнњ нњЁнњ©нњ«нњ­нњґнњµнњёнњјнќ„нќ‡нќ‰нќђнќ‘нќ”нќ–нќ—нќнќ™нќ нќЎнќЈнќҐнќ©нќ¬нќ°нќґнќјнќЅнћЃнћ€нћ‰нћЊнћђнћнћ™нћ›нћќ"],
    ["caa1","дјЅдЅіеЃ‡еѓ№еЉ еЏЇе‘µе“Ґе‰е«Ѓе®¶жљ‡жћ¶жћ·жџЇж­ЊзЏ‚з—‚зЁји‹›иЊ„иЎ—иў€иЁ¶иі€и·Џи»»иї¦й§•е€»еЌґеђ„жЃЄж…¤ж®јзЏЏи„љи¦єи§’й–Јдѕѓе€ЉеўѕеҐёе§¦е№Іе№№ж‡‡жЏЂжќ†жџ¬жЎїжѕ—з™Ћзњ‹зЈµзЁ€з«їз°Ўи‚ќи‰®и‰±и««й–“д№«е–ќж›·жёґзўЈз«­и‘›и¤ђиќЋйћЁе‹еќЋе ЄеµЊж„џж†ѕж€Ўж•ўжџ‘ж©„жё›з”з–із›Јзћ°зґєй‚Їй‘‘й‘’йѕ•"],
    ["cba1","еЊЈеІ¬з”Іиѓ›й‰Ђй–е‰›е €е§њеІЎеґ—еє·ејєеЅЉж…·ж±џз•єз–†зі зµіз¶±зѕЊи…”и€Ўи–‘иҐЃи¬›й‹јй™Ќй±‡д»‹д»·еЂ‹е‡±еЎЏж„·ж„ѕж…Ёж”№ж§Єжј‘з–Ґзљ†з›–з®‡иЉҐи“‹п¤ЂйЋ§й–‹е–Ђе®ўеќ‘п¤ЃзІізѕ№й†µеЂЁеЋ»е±…е·Ёж‹’жЌ®ж“љж“§жё з‚¬зҐ›и·ќиёћп¤‚йЃЅй‰…й‹ёд№ѕд»¶еЃҐе·ѕе»єж„†жҐ—и…±и™”и№‡йЌµйЁ«д№ће‚‘жќ°жЎЂе„‰еЉЌеЉ’жЄў"],
    ["cca1","зћјй€ђй»”еЉ«жЂЇиїІеЃ€ж†©жЏ­ж“Љж јжЄ„жїЂи†€и¦Ўйљ”е …з‰ЅзЉ¬з”„зµ№з№­и‚©и¦‹и­ґйЃЈйµ‘жЉ‰ж±єжЅ”зµђзјєиЁЈе…јж…Љз®ќи¬™й‰—йЋЊдє¬дї“еЂће‚ѕе„†е‹Ѓе‹ЌеЌїеќ°еўѓеєљеѕ‘ж…¶ж†¬ж“Ћж•¬ж™Їжљ»ж›ґжў—ж¶‡з‚…зѓ±з’џз’Ґз“Љз—™зЎ¬зЈ¬з«џз«¶зµ…з¶“иЂ•иЂїи„›иЋ–и­¦иј•йЂ•йЏЎй ѓй ёй©љйЇЁдї‚е•“е єеҐ‘е­Је±†ж‚ёж€’жЎ‚жў°"],
    ["cda1","жЈЁжєЄз•Њз™ёзЈЋзЁЅзі»з№«з№јиЁ€иЄЎи°їйљЋй·„еЏ¤еЏ©е‘Ље‘±е›єе§‘е­¤е°»еє«ж‹·ж”·ж•…ж•Іжљ жћЇж§ЃжІЅз—јзљђзќѕзЁїзѕ”иЂѓи‚Ўи†Џи‹¦и‹ЅиЏ°и—Ѓи ±иўґиЄҐп¤ѓиѕњйЊ®й›‡йЎ§й«йј“е“­ж–›ж›ІжўЏз©Ђи°·йµ е›°еќ¤еґ‘ж†жў±жЈЌж»ѕзђЁиўћйЇ¤ж±Ёп¤„йЄЁдѕ›е…¬е…±еЉџе­”е·ҐжЃђжЃ­ж‹±жЋ§ж”»зЏ™з©єиљЈиІўйћЏдёІеЇЎж€€жћњз“њ"],
    ["cea1","з§‘иЏ“иЄ‡иЄІи·ЁйЃЋйЌ‹йЎ†е»“ж§Ёи—їйѓ­п¤…е† е®еЇ¬ж…ЈжЈєж¬ѕзЃЊзђЇз“з®ЎзЅђиЏ…и§ЂиІ«й—њй¤Ёе€®жЃќж‹¬йЂ‚дѕЉе…‰еЊЎеЈ™е»Јж› жґёз‚љз‹‚зЏ–з­ђиѓ±й‘›еЌ¦жЋ›зЅ«д№–е‚ЂеЎЉеЈћжЂЄж„§ж‹ђж§ђй­Ѓе®Џзґи‚±иЅџдє¤еѓ‘е’¬е–¬е¬Ње¶ е·§ж”Єж•Ћж Ўж©‹з‹ЎзљЋзџЇзµћзї№и† и•Ћи›џијѓиЅЋйѓЉй¤ѓй©•й®«дёд№…д№ќд»‡дї±е…·е‹ѕ"],
    ["cfa1","еЌЂеЏЈеЏҐе’Ће”еќµећўеЇ‡е¶‡е»ђж‡јж‹ж•‘жћёжџ©ж§‹ж­ђжЇ†жЇ¬ж±‚жєќзЃёз‹—зЋ–зђѓзћїзџ©з©¶зµїиЂ‰и‡ји€…и€Љи‹џиЎўи¬іиіји»ЂйЂ‘й‚±й‰¤йЉ¶й§’й©…йі©й·—йѕњењ‹е±ЂиЏЉйћ йћ«йєґеђ›зЄзѕ¤иЈ™и»ЌйѓЎе Ђе±€жЋзЄџе®®еј“з©№зЄ®иЉЋиє¬еЂ¦е€ёе‹ёеЌ·ењ€ж‹іжЌІж¬Љж·ѓзњ·еЋҐзЌ—и•Ёи№¶й—•жњєж«ѓжЅ°и©­и»ЊйҐ‹п¤†ж™·ж­ёиІґ"],
    ["d0a1","й¬јп¤‡еЏ«ењ­еҐЋжЏ†ж§»зЏЄзЎ…зЄєз«…зіѕи‘µи¦ЏиµійЂµй–Ёе‹»еќ‡з•‡з­ иЏЊй€ћп¤€ж©е…‹е‰‹еЉ‡ж€џжЈжҐµйљ™еѓ…еЉ¤е‹¤ж‡ѓж–¤ж №ж§їз‘ѕз­‹иЉ№иЏ«и¦Іи¬№иї‘йҐ‰п¤‰д»Ље¦—ж“’ж‘жЄЋзђґз¦Ѓз¦ЅиЉ©иЎѕиЎїиҐџп¤ЉйЊ¦дј‹еЏЉжЂҐж‰±ж±Ізґљзµ¦дєе…ўзџњи‚ЇдјЃдјЋе…¶е†Ђе—ње™Ёењ»еџєеџје¤”еҐ‡е¦“еЇ„еІђеґЋе·±е№ѕеїЊжЉЂж——ж—Ј"],
    ["d1a1","жњћжњџжќћжЈ‹жЈ„ж©џж¬єж°Јж±ЅжІ‚ж·‡зЋзђ¦зђЄз’‚з’Јз•ёз•їзўЃзЈЇзҐЃзҐ‡зҐ€зҐєз®•зґЂз¶єзѕ€иЂ†иЂ­и‚ЊиЁи­Џи±€иµ·йЊЎйЊ¤йЈўйҐ‘йЁЋйЁЏй©Ґйє’з·ЉдЅ¶еђ‰ж‹®жЎ”й‡‘е–«е„єп¤‹п¤ЊеЁњж‡¦п¤Ќж‹Џж‹їп¤Ћ",5,"й‚Јп¤”",4,"и«ѕп¤™п¤љп¤›п¤њжљ–п¤ќз…–п¤ћп¤џй›Јп¤ жЌЏжЌєеЌ—п¤ЎжћЏжҐ ж№іп¤ўз”·п¤Јп¤¤п¤Ґ"],
    ["d2a1","зґЌп¤¦п¤§иЎІе›ЉеЁп¤Ё",4,"д№ѓп¤­е…§еҐ€жџ°иЂђп¤®еҐіе№ґж’љз§ЉеїµжЃ¬ж‹€жЌ»еЇ§еЇ—еЉЄп¤ЇеҐґеј©жЂ’п¤°п¤±п¤Із‘™п¤і",5,"й§‘п¤№",10,"жїѓпҐ„пҐ…и†їиѕІжѓ±пҐ†пҐ‡и…¦пҐ€пҐ‰е°їпҐЉ",7,"е«©иЁҐжќ»зґђпҐ’",5,"иѓЅпҐпҐ™е°јжіҐеЊїжєєе¤љиЊ¶"],
    ["d3a1","дё№дє¶дЅ†е–®ењеЈ‡еЅ–ж–·ж—¦жЄЂж®µж№Ќзџ­з«Їз°ћз·ћи›‹иў’й„ІйЌ›ж’»жѕѕзЌєз–ёйЃ”е•–еќЌж†єж“”ж›‡ж·Ўж№›жЅ­жѕ№з—°иЃѓи†Ѕи•Ѓи¦ѓи«‡и­љйЊџжІ“з•“з­”иёЏйЃќе”ђе ‚еЎе№ўж€‡ж’ћжЈ з•¶зі–ићій»Ёд»Јећ€еќ®е¤§е°ЌеІ±её¶еѕ…ж€ґж“ЎзЋіи‡єиў‹иІёйљЉй»›е®…еѕ·ж‚іеЂ’е€Ђе€°ењ–е µеЎ—е°Ће± еі¶е¶‹еє¦еѕ’ж‚јжЊ‘жЋ‰жђ—жЎѓ"],
    ["d4a1","жЈ№ж«‚ж·жёЎж»”жї¤з‡ѕз›њзќ№з¦±зЁ»иђ„и¦©иі­и·іи№€йЂѓйЂ”йЃ“йѓЅйЌЌй™¶йџњжЇ’зЂ†з‰зЉўзЌЁзќЈз¦їзЇ¤зє›и®Ђеў©жѓ‡ж•¦ж—ЅжљѕжІЊз„ћз‡‰и±љй “д№­зЄЃд»ќе†¬е‡Ќе‹•еђЊж†§жќ±жЎђжЈџжґћжЅјз–јзћіз«Ґиѓґи‘ЈйЉ…е…њж–—жќњжћ“з—з«‡иЌіпҐљи±†йЂ—й ­е±Їи‡ЂиЉљйЃЃйЃЇй€Ќеѕ—е¶ќж©™з‡€з™»з­‰и—¤и¬„й„§йЁ°е–‡ж‡¶пҐ›з™©зѕ…"],
    ["d5a1","иїићєиЈёй‚ЏпҐњжґ›зѓ™зЏћзµЎиђЅпҐќй…Єй§±пҐћдє‚еЌµж¬„ж¬’зЂѕз€›и­йёће‰ЊиѕЈеµђж“Ґж”¬ж¬–жї«з±ѓзєњи—ЌиҐ¤и¦Ѕж‹‰и‡и џе»Љжњ—жµЄз‹јзђ…з‘Їић‚йѓћдѕ†еґЌеѕ иђЉе†·жЋ з•Ґдє®еЂ†е…©е‡‰жўЃжЁ‘зІ®зІ±зі§и‰Їи«’иј›й‡Џдѕ¶е„·е‹µе‘‚е»¬ж…®ж€ѕж—…ж«љжїѕз¤Єи—њи Јй–­й©ўй©Єйє—й»ЋеЉ›ж›†ж­·зЂќз¤«иЅўйќ‚ж†ђж€Ђж”ЈжјЈ"],
    ["d6a1","з…‰з’‰з·ґиЃЇи“®иј¦йЂЈйЌЉе†Ѕе€—еЉЈжґЊзѓ€иЈ‚е»‰ж–‚ж®®жї‚з°ѕзЌµд»¤дј¶е›№пҐџеІєе¶єжЂњзЋІз¬­зѕљзїЋиЃ†йЂћй€ґй›¶йќ€й йЅЎдѕ‹жѕ§з¦®й†ґйљ·е‹ћпҐ ж’€ж“„ж«“жЅћзЂз€ђз›§иЂЃи†и™њи·Їиј…йњІй­Їй·єй№µзўЊзҐїз¶ иЏ‰йЊ„й№їйє“и«–еЈџеј„жњ§зЂ§з“Џз± иЃѕе„ЎзЂЁз‰ўзЈЉиі‚иіљиіґй›·дє†еѓљеЇ®е»–ж–™з‡Ћз™‚зћ­иЃЉи“ј"],
    ["d7a1","йЃјй¬§йѕЌеЈе©Ѓе±ўжЁ“ж·љжјЏз»зґЇзё·и”ћи¤ёйЏ¤й™‹еЉ‰ж—’жџіж¦ґжµЃжєњзЂЏзђ‰з‘ з•™з¤зЎ«и¬¬йЎће…­ж€®й™ёдѕ–еЂ«еґ™ж·Єз¶ёијЄеѕ‹ж…„ж —пҐЎйљ†е‹’и‚‹е‡ње‡ЊжҐћзЁњз¶ѕиЏ±й™µдїље€©еЋеђЏе”Ће±Ґж‚§жќЋжўЁжµ¬зЉЃз‹ёзђ†з’ѓпҐўз—ўз±¬зЅ№зѕёиЋ‰иЈЏиЈЎй‡Њй‡ђй›ўйЇ‰еђќжЅѕз‡ђз’и—єиєЄйљЈй±—йєџжћ—ж·‹зђіи‡Ёйњ–з ¬"],
    ["d8a1","з«‹з¬ зІ’ж‘©з‘Єз—ІзўјзЈЁй¦¬й­”йє»еЇће№•жј и†њиЋ«й‚€дё‡еЌЌеЁ©е·’еЅЋж…ўжЊЅж™©ж›јж»їжј«зЃЈзћћиђ¬и”“и »иј“йҐ…й°»е”њжЉ№жњ«жІ«иЊ‰иҐЄйќєдєЎе¦„еїеї™жњ›з¶ІзЅ”иЉ’иЊ«иЋЅијћй‚™еџ‹е¦№еЄ’еЇђж§жћљжў…жЇЏз…¤зЅµиІ·иіЈй‚Ѓй­…и„€иІЉй™Њй©ЂйєҐе­џж°“зЊ›з›Із›џиђЊе†Єи¦“е…Ќе†•е‹‰жЈ‰жІ”зњ„зњ з¶їз·¬йќўйєµж»…"],
    ["d9a1","и”‘е†ҐеђЌе‘ЅжЋжљќж¤§жєџзљїзћ‘иЊ—и“‚ићџй…©йЉйіґиў‚дѕ®е†’е‹џе§†еёЅж…•ж‘ёж‘№жљ®жџђжЁЎжЇЌжЇ›з‰џз‰Ўз‘Ѓзњёзџ›иЂ—иЉјиЊ…и¬Ђи¬ЁиІЊжњЁжІђз‰§з›®зќ¦з©†й¶©ж­їжІ’е¤ўжњ¦и’™еЌЇеў“е¦™е»џжЏЏжґжќіжёєзЊ«з«—и‹—йЊЁе‹™е·«ж†®ж‡‹ж€Љж‹‡ж’«ж— жҐ™ж­¦жЇ‹з„ЎзЏ·з•ќз№†и€ћиЊ‚и•ЄиЄЈиІїйњ§йµЎеўЁй»еЂ‘е€Ћеђ»е•Џж–‡"],
    ["daa1","ж±¶зґЉзґ‹иЃћиљЉй–Ђй›Їе‹їжІ•з‰©е‘іеЄље°ѕеµ‹еЅЊеѕ®жњЄжў¶жҐЈжёјж№„зњ‰з±ізѕЋи–‡и¬Ћиї·йќЎй»ґеІ·ж‚¶ж„Ќж†«ж•Џж—»ж—јж°‘жіЇзЋџзЏ‰з·Ўй–”еЇ†ињњи¬ђе‰ќеЌљж‹ЌжђЏж’ІжњґжЁёжіЉзЏЂз’ћз®”зІ•зё›и†Љи€¶и–„иї«й›№й§ЃдјґеЌЉеЏЌеЏ›ж‹Њжђ¬ж”Ђж–‘ж§ѓжі®жЅзЏ­з•”зўз›¤з›јзЈђзЈ»з¤¬зµ†и€¬иџ иї”й ’йЈЇе‹ѓж‹”ж’Ґжё¤жЅ‘"],
    ["dba1","з™ји·‹й†±й‰ўй«®й­ѓеЂЈе‚ЌеќЉе¦Ёе°Ёе№‡еЅ·ж€їж”ѕж–№ж—Ѓж‰жћ‹ж¦њж»‚зЈ…зґЎи‚Єи†Ђи€«иЉіи’ЎиљЊиЁЄи¬—й‚¦йІйѕђеЂЌдїіпҐЈеџ№еѕж‹њжЋ’жќЇж№ѓз„™з›ѓиѓЊиѓљиЈґиЈµи¤™иі иј©й…Ќй™ЄдјЇдЅ°её›жџЏж ўз™Ѕз™ѕй­„е№ЎжЁЉз…©з‡”з•ЄпҐ¤з№Ѓи•ѓи—©йЈњдјђз­ЏзЅ°й–Ґе‡Ўеё†жўµж°ѕж±Ћжі›зЉЇзЇ„иЊѓжі•зђєеѓ»еЉ€еЈЃж“жЄ—з’§з™–"],
    ["dca1","зў§и—й—ўйњ№пҐҐеЌћејЃи®ЉиѕЁиѕЇй‚Ље€ҐзћҐй±‰йј€дё™еЂ‚е…µе±›е№·жћжєжџ„жЈ…з‚із”Ѓз—…з§‰з«ќиј§й¤ йЁ€дїќе Ўе ±еЇ¶ж™®ж­Ґжґ‘ж№єжЅЅзЏ¤з”«иЏ©иЈњи¤“и­њиј”дјЏеѓ•еЊђеЌње®“еѕ©жњЌз¦Џи…№иЊЇи””и¤‡и¦†иј№иј»й¦Ґй°’жњ¬д№¶дїёеҐ‰е°ЃеіЇеі°жЌ§жЈ’зѓЅз†ўзђ«зё«и“¬ињ‚йЂўй‹’йіідёЌд»дїЇе‚…е‰–е‰Їеђ¦е’ђеџ е¤«е©¦"],
    ["dda1","е­ље­µеЇЊеєњпҐ¦ж‰¶ж•·ж–§жµ®жєҐз€¶з¬¦з°їзј¶и…ђи…‘и†љи‰ЂиЉ™иЋ©иЁѓиІ иі¦иі»иµґи¶єйѓЁй‡њйњй™„й§™йі§еЊ—е€†еђ©е™ґеўіеҐ”еҐ®еїїж†¤ж‰®жђж±ѕз„љз›†зІ‰зіћзґ›иЉ¬иіЃй›°пҐ§дЅ›еј—еЅїж‹‚еґ©жњ‹жЈљзЎјз№ѓйµ¬дё•е‚™еЊ•еЊЄеЌ‘е¦ѓе©ўеє‡ж‚Іж†Љж‰‰ж‰№ж–ђжћ‡ж¦§жЇ”жЇ–жЇ—жЇжІёпҐЁзђµз—єз ’зў‘з§•з§зІѓз·‹зїЎи‚Ґ"],
    ["dea1","и„ѕи‡‚иЏІињљиЈЁиЄ№и­¬иІ»й„™йќћйЈ›йј»ељ¬е¬ЄеЅ¬ж–ЊжЄіж®Їжµњжї±зЂ•з‰ќзЋ­иІ§иі“й »ж†‘ж°·иЃйЁЃд№Ќдє‹дє›д»•дјєдјјдЅїдїџеѓїеЏІеЏёе”†е—Је››еЈ«еҐўеЁ‘еЇ«еЇєе°„е·іеё«еѕ™жЂќжЌЁж–њж–Їжџ¶жџ»жў­ж­»жІ™жі—жёЈзЂ‰зЌ…з ‚з¤ѕзҐЂзҐ з§ЃзЇ©зґ—зµІи‚†и€ЌиЋЋи“‘и›‡иЈџи©ђи©ћи¬ќиіњиµ¦иѕ­й‚ЄйЈјй§џйєќе‰ЉпҐ©жњ”пҐЄ"],
    ["dfa1","е‚е€Єе±±ж•Јж±•зЏЉз”Јз–ќз®—и’њй…ёйњ°д№·ж’’ж®єз…ћи–©дё‰пҐ«жќ‰жЈ®жё—иЉџи”иЎ«жЏ·жѕЃй€’йўЇдёЉе‚·еѓЏе„џе•†е–Єе—е­Ђе°™еі еёёеєЉеє е»‚жѓіжЎ‘ж©Ўж№з€Ѕз‰Ђз‹Ђз›ёзҐҐз®±зї”иЈіи§ґи©іи±ЎиіћйњњеЎћз’ЅиіЅе—‡пҐ¬з©Ўзґўи‰Із‰Із”џз”ҐпҐ­з¬™еў…еЈ»е¶јеєЏеє¶еѕђжЃ•жЉ’жЌїж•Ќжљ‘ж›™ж›ёж –жЈІзЉЂз‘ћз­®зµ®з·–зЅІ"],
    ["e0a1","иѓҐи€’и–ЇиҐїиЄ“йЂќй‹¤й»Ќйј е¤•еҐ­её­жѓњж”ж™іжћђж±ђж·…жЅџзџізў©и“†й‡‹йЊ«д»™еѓЉе…€е–„е¬‹е®Јж‰‡ж•ѕж—‹жёІз…ЅзђЃз‘„з’‡з’їз™¬з¦Єз·љз№•зѕЁи…єи†іи€№иљиџ¬и©µи·ЈйЃёйЉ‘йђҐйҐЌй®®еЌЁе±‘жҐ”жі„жґ©жё«и€Њи–›и¤»иЁ­иЄЄй›ЄйЅ§е‰Ўжљ№ж®Ізє–иџѕиґЌй–ѓй™ќж”ќж¶‰з‡®пҐ®еџЋе§“е®¬жЂ§жѓєж€ђжџж™џзЊ©зЏ№з››зњЃз­¬"],
    ["e1a1","иЃ–иЃІи…ҐиЄ й†’дё–е‹ўж­Іжґ—зЁ…з¬№зґ°пҐЇиІ°еЏ¬еЇеЎ‘е®µе°Џе°‘е·ўж‰ЂжЋѓжђ”ж­жўіжІјж¶€жєЇзЂџз‚¤з‡’з”¦з–Џз–Ћз™з¬‘зЇ з°«зґ зґ№и”¬и•­и‡иЁґйЂЌйЃЎй‚µйЉ·йџ¶йЁ·дї—е±¬жќџж¶‘зІџзєЊи¬–иґ–йЂџе­«е·ЅжђЌи“ЂйЃњйЈЎзЋ‡е®‹ж‚љжќѕж·ћиЁџиЄ¦йЂЃй Ње€·пҐ°зЃ‘зўЋйЋ–иЎ°й‡—дї®еЏ—е—Ѕе›љећ‚еЈЅе«‚е®€еІ«еіЂеёҐж„Ѓ"],
    ["e2a1","ж€Ќж‰‹жЋ€жђњж”¶ж•ёжЁ№ж®Љж°ґжґ™жј±з‡§з‹©зЌёзђ‡з’Із¦зќЎз§Ђз©—з«ЄзІ№з¶Џз¶¬з№Ўзѕћи„©иЊ±и’ђи“љи—Єиў–иЄ°и®ђијёйЃ‚й‚ѓй…¬йЉ–йЉ№йљ‹йљ§йљЁй›–йњЂй €й¦–й«“й¬љеЏ”еЎѕе¤™е­°е®їж·‘жЅљз†џзђЎз’№и‚…иЏЅе·Ўеѕ‡еѕЄжЃ‚ж—¬ж ’жҐЇж©“ж®‰жґµж·ізЏЈз›ѕзћ¬з­Ќзґ”и„Ји€њиЌЂи“ґи•Ји©ўи«„й†‡йЊћй †й¦ґж€ЊиЎ“иї°й‰Ґеґ‡еґ§"],
    ["e3a1","еµ©з‘џи†ќиќЁжї•ж‹ѕзї’и¤¶иҐІдёћд№еѓ§е‹ќеЌ‡ж‰їж‡з№©и …й™ћдѕЌеЊ™е¶е§‹еЄ¤е°ёе±Ће±Ќеё‚еј‘жЃѓж–ЅжЇж™‚жћѕжџґзЊњзџўз¤єзї…и’”и“Ќи¦–и©¦и©©и«Ўи±•и±єеџґеЇ”ејЏжЃЇж‹­ж¤Ќж®–ж№њз†„зЇ’иќ•и­и»ѕйЈџйЈѕдјёдѕЃдїЎе‘»еЁ е®ёж„јж–°ж™Ёз‡јз”ізҐћзґіи…Ћи‡ЈиЋи–Єи—ЋињѓиЁЉиє«иѕ›пҐ±иї…е¤±е®¤еЇ¦ж‚‰еЇ©е°‹еїѓжІЃ"],
    ["e4a1","пҐІж·±зЂ‹з”љиЉЇи«¶д»ЂеЌЃпҐій›™ж°Џдєћдї„е…’е•ћеЁҐеіЁж€‘з‰™иЉЅиЋЄи›ѕиЎ™иЁќйїй›…й¤“йґ‰йµќе ЉеІіе¶Ѕе№„жѓЎж„•жЏЎжЁ‚жёҐй„‚йЌ”йЎЋй°ђйЅ·е®‰еІёжЊ‰ж™ЏжЎ€зњјй›ЃйћЌйЎ”й®џж–Ўи¬Ѓи»‹й–је”µеІ©е·–еєµжљ—з™ЊиЏґй—‡еЈ“жЉјз‹ЋйґЁд»°е¤®жЂЏж»ж®ѓз§§йґ¦еЋ“е“Ђеџѓеґ–ж„›ж›–ж¶ЇзўЌи‰ѕйљйќ„еЋ„ж‰јжЋ–ж¶ІзёЉи…‹йЎЌ"],
    ["e5a1","ж«»зЅЊй¶Їйёљд№џеЂ»е†¶е¤њжѓ№жЏ¶ж¤°з€єиЂ¶пҐґй‡Ћеј±пҐµпҐ¶зґ„и‹Ґи‘Їи’»и—ҐиєЌпҐ·дЅЇпҐёпҐ№еЈ¤е­ѓжЃ™жЏљж”ж•­жљпҐєжҐЉжЁЈжґ‹зЂЃз…¬з—’зЌз¦із©°пҐ»зѕЉпҐјиҐ„пҐЅи®“й‡Ђй™ЅпҐѕй¤Љењ„еѕЎж–јжјЃзЂз¦¦иЄћй¦­й­љйЅ¬е„„ж†¶жЉ‘жЄЌи‡†еЃѓе °еЅ¦з„‰иЁЂи«єе­ји–дїєе„јељґеҐ„жЋ©ж·№е¶ЄжҐ­е††дє€дЅ™пҐїп¦Ђп¦Ѓе¦‚п¦‚"],
    ["e6a1","п¦ѓж­џж±ќп¦„з’µз¤–п¦…и€‡и‰…иЊ№ијїиЅќп¦†й¤п¦‡п¦€п¦‰дє¦п¦ЉеџџеЅ№ж“п¦‹п¦Њз–«з№№и­Їп¦ЌйЂ†й©›ељҐе §е§ёеЁџе®ґп¦Ће»¶п¦Џп¦ђжЌђжЊ»п¦‘ж¤ЅжІ‡жІїж¶Ћж¶“ж·µжј”п¦’зѓџз„¶з…™п¦“з‡ѓз‡•п¦”зЎЏзЎЇп¦•з­µз·Јп¦–зёЇп¦—иЎЌи»џп¦п¦™п¦љй‰›п¦›йі¶п¦њп¦ќп¦ћж‚…ж¶…п¦џз†±п¦ п¦Ўй–±еЋ­п¦ўп¦Јп¦¤жџ“п¦Ґз‚Ћз„°зђ°и‰¶и‹’"],
    ["e7a1","п¦¦й–»й«Ґй№Ѕж›„п¦§з‡Ѓи‘‰п¦Ёп¦©еЎ‹п¦Єп¦«е¶ёеЅ±п¦¬ж жљЋжҐ№ж¦®ж°ёжііжё¶жЅЃжїљзЂ›зЂЇз…ђз‡џзЌ°п¦­з‘›п¦®з“”з›€з©Ћзє“п¦Їп¦°и‹±и© иїЋп¦±йЌ€п¦Ійњ™п¦іп¦ґд№‚еЂЄп¦µе€€еЏЎж›іж±­жїЉзЊЉзќїз©ўиЉ®и—ќи‚п¦¶иЈ”и©Ји­Ѕи±«п¦·йЉіп¦ёйњ“й ђдє”дјЌдї‰е‚ІеЌ€еђѕеђіе—љеЎўеўєеҐ§еЁ›еЇ¤ж‚џп¦№ж‡Љж•–ж—їж™¤жў§ж±љжѕі"],
    ["e8a1","зѓЏз†¬зЌ’з­Ѕињ€иЄ¤й°Ійј‡е±‹жІѓзЌ„зЋ‰й€єжє«з‘Ґзџз©©зё•иЉе…ЂеЈ…ж“Ѓз“®з”•з™°зїЃй‚•й›ЌйҐ”жё¦з“¦зЄ©зЄЄи‡Ґи›™иќёиЁ›е©‰е®Ње®›жўЎж¤ЂжµЈзЋ©зђ“зђ¬зў—з·©зї«и„и…•иЋћи±Њй®й ‘ж›°еѕЂж—єжћ‰ж±ЄзЋ‹еЂ­еЁѓж­Єзџ®е¤–еµ¬е·ЌзЊҐз•Џп¦єп¦»еѓҐе‡№е Їе¤­е¦–е§љеЇҐп¦јп¦Ѕе¶ўж‹—жђ–ж’“ж“ѕп¦ѕж›њп¦їж©€п§Ђз‡їз‘¤п§Ѓ"],
    ["e9a1","зЄ€зЄЇз№‡з№ћиЂЂи…°п§‚иџЇи¦Ѓи¬ йЃ™п§ѓй‚ЂйҐ’ж…ѕж¬Іжµґзёџи¤Ґиѕ±дї‘е‚­е†—е‹‡еџ‡еў‰е®№еєёж…‚ж¦•ж¶Њж№§жє¶з†”з‘ўз”Ёз”¬иЃіиЊёи“‰иёЉйЋ”йЏћп§„дєЋдЅ‘еЃ¶е„ЄеЏ€еЏ‹еЏіе®‡еЇ“е°¤ж„љж†‚ж—ґз‰›зЋ—з‘Ђз›‚зҐђз¦‘з¦№зґ†зѕЅиЉ‹и—•и™ћиї‚йЃ‡йѓµй‡Єйљ…й›Ёй›©е‹–еЅ§ж—­ж±ж Їз…њзЁ¶йѓЃй Љдє‘п§…ж©’ж®ћжѕђз†‰иЂиЉёи•“"],
    ["eaa1","йЃ‹йљ•й›Ійџ»и”љй¬±дєђз†Љй›„е…ѓеЋџе“Ўењ“ењ’ећЈеЄ›е«„еЇѓжЂЁж„їжЏґжІ…жґ№ж№Іжєђз€°зЊїз‘—и‹‘иўЃиЅ…йЃ п§†й™ўйЎйґ›жњ€и¶Љй‰ћдЅЌеЃ‰еѓћеЌ±ењЌе§”еЁЃе°‰ж…°жљђжё­з€Із‘‹з·ЇиѓѓиђЋи‘¦и”їиќџиЎ›и¤и¬‚йЃ•йџ‹й­Џд№ідѕ‘е„’е…Єп§‡е”Їе–©е­єе®Ґе№је№Ѕеєѕж‚ жѓџж„€ж„‰жЏ„ж”ёжњ‰п§€жџ”жџљп§‰жҐЎжҐўжІ№жґ§п§Љжёёп§‹"],
    ["eba1","жїЎзЊ¶зЊ·п§Њз‘њз”±п§Ќз™’п§Ћп§Џз¶­и‡ѕиђёиЈ•иЄи«›и«­иё°и№‚йЃЉйЂѕйЃєй…‰й‡‰йЌ®п§ђп§‘е ‰п§’жЇ“и‚‰и‚Іп§“п§”е…ЃеҐ«е°№п§•п§–жЅ¤зЋ§иѓ¤иґ‡п§—й€—й–Џп§п§™п§љп§›иЃїж€ЋзЂњзµЁићЌп§њећ жЃ©ж…‡ж®·иЄѕйЉЂйљ±д№™еђџж·«и”­й™°йџійЈ®жЏ–жіЈй‚‘е‡ќж‡‰и†єй·№дѕќеЂље„Ђе®њж„Џж‡їж“¬ж¤…жЇ…з–‘зџЈзѕ©и‰¤и–Џиџ»иЎЈиЄј"],
    ["eca1","и­°й†«дєЊд»ҐдјЉп§ќп§ће¤·е§Ёп§џе·Іеј›еЅ›жЂЎп§ п§Ўп§ўп§Јз€ѕзЏҐп§¤з•°з—Ќп§Ґз§»п§¦иЂЊиЂіи‚„и‹ЎиЌ‘п§§п§ЁиІЅиІій‚‡п§©п§ЄйЈґй¤Њп§«п§¬зЂ·з›ЉзїЉзїЊзїји¬љдєєд»Ѓе€ѓеЌ°п§­е’Ѕе› е§»еЇ…еј•еїЌж№®п§®п§ЇзµЄиЊµп§°иљ“иЄЌп§±йќ­йќ·п§Іп§ідёЂдЅљдЅѕеЈ№ж—ҐжєўйЂёйЋ°й¦№д»»еЈ¬е¦Ље§™жЃЃп§ґп§µзЁ”п§¶иЌЏиіѓе…ҐеЌ„"],
    ["eda1","п§·п§ёп§№д»Ќе‰©е­•иЉїд»”е€єе’Ёе§‰е§їе­ђе­—е­њжЃЈж…€ж»‹з‚™з…®зЋ†з“·з–µзЈЃзґ«иЂ…и‡ЄиЊЁи”—и—‰и«®иі‡й›ЊдЅње‹єељјж–«жЁзЃјз‚ёз€µз¶ЅиЉЌй…Њй›ЂйµІе­±жЈ§ж®жЅєз›ћеІ‘жљ«жЅ›з®ґз°Єи ¶й›њдё€д»—еЊ е ґеў»еЈЇеҐ¬е°‡еёіеє„ејµжЋЊжљІжќ–жЁџжЄЈж¬Њжјїз‰†п§єзЌђз’‹з« зІ§и…ёи‡џи‡§иЋЉи‘¬и”Ји–”и—ЏиЈќиґ“й†¬й•·"],
    ["eea1","йљње†Ќе“‰ењЁе®°ж‰Ќжќђж Ѕжў“жёЅж»“зЃЅзёЎиЈЃиІЎиј‰йЅ‹йЅЋз€­з®Џи«ЌйЊљдЅ‡дЅЋе„Іе’Ђе§ђеє•жЉµжќµжҐ®жЁ—жІ®жёљз‹™зЊЄз–Ѕз®ёзґµи‹§иЏ№и‘—и—·и©›иІЇиє‡йЂ™й‚ёй›ЋйЅџе‹ЈеђЉе«ЎеЇ‚ж‘ж•µж»ґз‹„п§»зљ„з©Ќз¬›з±ЌзёѕзїџиЌ»и¬«иіЉиµ¤и·Ўи№џиїЄиї№йЃ©йЏ‘дЅѓдЅєе‚іе…Ёе…ёе‰Ќе‰ЄеЎЎеЎјеҐ е°€е±•е»›ж‚›ж€°ж “ж®їж°€жѕ±"],
    ["efa1","з…Ћзђ з”°з”ёз•‘з™Із­Њз®‹з®­зЇ†зєЏи©®ијѕиЅ‰й€їйЉ“йЊўйђ«й›»йЎљйЎ«й¤ће€‡ж€ЄжЉжµ™з™¤з«ЉзЇЂзµ¶еЌ еІѕеє—жјёз‚№зІйњ‘й®Ћй»ћжЋҐж‘єиќ¶дёЃдє•дє­еЃњеЃµе‘€е§ѓе®ље№Ђеє­е»·еѕЃжѓ…жЊєж”їж•ґж—Њж™¶ж™ёжџѕжҐЁжЄ‰ж­Јж±Ђж·Ђж·Ёжёџж№ћзЂћз‚ЎзЋЋзЏЅз”єзќ›зў‡з¦ЋзЁ‹з©ЅзІѕз¶Ћи‰‡иЁ‚и«ЄиІћй„­й…Љй‡й‰¦й‹ЊйЊ йњ†йќ–"],
    ["f0a1","йќњй ‚йјЋе€¶еЉ‘е•је ¤еёќејџж‚ЊжЏђжўЇжїџзҐ­з¬¬и‡Ќи–єиЈЅи«ёи№„й†Ќй™¤йљ›йњЅйЎЊйЅЉдїЋе…†е‡‹еЉ©еІеј”еЅ«жЋЄж“Ќж—©ж™Ѓж›єж›№жњќжўќжЈ—ж§Ѕжј•жЅ®з…§з‡Ґз€Єз’ЄзњєзҐ–зҐљз§џзЁ зЄ•зІ—зіџзµ„з№°и‚‡и—»иљ¤и©”иЄїи¶™иєЃйЂ йЃ­й‡Јй»й›•йіҐж—Џз°‡и¶ійЏѓе­е°ЉеЌ’ж‹™зЊќеЂ§е®—еѕћж‚°ж…«жЈ•ж·™зђ®зЁ®зµ‚з¶њзё±и…«"],
    ["f1a1","иёЄиёµйЌѕйђдЅђеќђе·¦еє§жЊ«зЅЄдё»дЅЏдѕЏеЃље§ќиѓ„е‘Єе‘Ёе—ѕеҐЏе®™е·ће»љж™ќжњ±жџ±ж ЄжіЁжґІж№ЉжѕЌз‚·зЏ з–‡з±Њзґ‚зґ¬з¶ўи€џи››иЁ»иЄ…иµ°иєЉијійЂ±й…Ћй…’й‘„й§ђз«№зІҐдїЉе„Ѓе‡†еџ€еЇЇеі»ж™™жЁЅжµљжє–жї¬з„Њз•Їз«Ји ўйЂЎйЃµй›‹й§їиЊЃдё­д»ІиЎ†й‡ЌеЌЅж«›жҐ«ж±Ѓи‘єеўћж†Ћж›ѕж‹Їзѓќз”‘з—‡з№’и’ёи­‰иґ€д№‹еЏЄ"],
    ["f2a1","е’«ењ°еќЂеї—жЊЃжЊ‡ж‘Їж”Їж—Ёж™єжћќжћіж­ўж± жІљжј¬зџҐз ҐзҐ‰зҐ—зґ™и‚ўи„‚и‡іиЉќиЉ·ињиЄЊп§јиґ„и¶ѕйЃІз›ґзЁ™зЁ·з№”иЃ·е”‡е—”еЎµжЊЇжђўж™‰ж™‹жЎ­ж¦›ж®„жґҐжє±зЏЌз‘Ёз’Ўз•›з–№з›Ўзњћзћ‹з§¦зё‰зёќи‡»и”Їиў—иЁєиі‘и»«иѕ°йЂІйЋ­й™Јй™ійњ‡дѕ„еЏ±е§Єе«‰её™жЎЋз“†з–ѕз§©зЄ’и†Ји›­иіЄи·Њиї­ж–џжњ•п§Ѕеџ·жЅ—з·ќијЇ"],
    ["f3a1","йЏ¶й›†еѕµж‡Іжѕ„дё”дѕеЂџеЏ‰е—џеµЇе·®ж¬Ўж­¤зЈ‹з®љп§ѕи№‰и»ЉйЃ®жЌ‰жђѕзќЂзЄ„йЊЇй‘їйЅЄж’°жѕЇз‡¦з’Ёз“љз«„з°’зє‚зІІзєи®љиґЉй‘Ѕй¤ђйҐЊе€№еЇџж“¦жњ­зґ®еѓ­еЏѓеЎ№ж…ж…™ж‡єж–¬з«™и®’и®–еЂ‰еЂЎе‰µе”±еЁје» еЅ°ж„ґж•ћжЊж¶жљўж§Ќж»„жјІзЊ–зЎзЄ“и„№и‰™иЏ–и’је‚µеџ°еЇЂеЇЁеЅ©жЋЎз ¦з¶µиЏњи”Ўй‡‡й‡µе†Љжџµз­–"],
    ["f4a1","иІ¬е‡„е¦»ж‚Ѕи™•еЂњп§їе‰”е°єж…Ѕж€љж‹“ж“Іж–Ґж»Њз и„Љи№ й™џйљ»д»џеЌѓе–е¤©е·ќж“…жі‰ж·єзЋ”з©їи€›и–¦иі¤иёђйЃ·й‡§й—ЎйЎйџ†е‡ёе“Іе–†еѕ№ж’¤жѕ€з¶ґијџиЅЌйђµеѓ‰е°–жІѕж·»з”›зћ»з°Ѕз±¤и©№и«‚е ће¦ѕеё–жЌ·з‰’з–Љзќ«и«њиІјиј’е»іж™ґж·ёиЃЅиЏЃи«‹йќ‘йЇ–пЁЂе‰ѓж›їж¶•ж»Їз· и«¦йЂ®йЃћй«”е€ќе‰їе“Ёж†”жЉ„ж‹›жўў"],
    ["f5a1","ж¤’жҐљжЁµз‚’з„¦зЎќз¤Ѓз¤Ћз§’зЁЌи‚–и‰ёи‹•иЌ‰и•‰иІ‚и¶…й…ўй†‹й†®дїѓе›‘з‡­зџ—ињЂи§ёеЇёеї–жќ‘й‚ЁеЏўеЎљеЇµж‚¤ж†Ѓж‘ зёЅиЃ°и”ҐйЉѓж’®е‚¬еґ”жњЂеўњжЉЅжЋЁж¤ЋжҐёжЁћж№«зљєз§‹иЉ»иђ©и«Џи¶ЁиїЅй„’й…‹й†њйЊђйЊйЋљй››йЁ¶й°Ќдё‘з•њзҐќз«єз­‘зЇ‰зё®и“„и№™и№ґи»ёйЂђжҐж¤їз‘ѓе‡єжњ®й»ње……еї жІ–иџІиЎќиЎ·ж‚ґи†µиђѓ"],
    ["f6a1","иґ…еЏ–еђ№еґеЁ¶е°±з‚Љзї иЃљи„†и‡­и¶Јй†‰й©џй·ІеЃґд»„еЋ жѓ»жё¬е±¤дѕ€еЂ¤е—¤еі™е№џжЃҐжў”жІ»ж·„з†ѕз—”з—ґз™ЎзЁљз©‰з·‡з·»зЅ®и‡ґиљ©ијњй›‰й¦ійЅ’е‰‡е‹…йЈ­и¦Єдёѓжџ’жј†дѕµеЇўжћ•жІ€жµёзђ›з §й‡ќйЌјиџ„з§¤зЁ±еї«д»–е’¤е”ѕеў®е¦Ґжѓ°ж‰“ж‹–жњ¶жҐ•и€µй™Ђй¦±й§ќеЂ¬еЌ“е•„еќјпЁЃж‰пЁ‚ж“ўж™«жџќжїЃжїЇзђўзђёиЁ—"],
    ["f7a1","йђёе‘‘е†еќ¦еЅ€ж†љж­ЋзЃз‚­з¶»иЄ•еҐЄи„«жЋўзњ€иЂЅиІЄеЎ”жђ­ж¦»е®•её‘ж№ЇпЁѓи•©е…ЊеЏ°е¤ЄжЂ ж…‹ж®†ж±°жі°з¬ћиѓЋи‹”и·†й‚°йў±пЁ„ж“‡жѕ¤ж’‘ж”„е…ЋеђђењџиЁЋж…џжЎ¶пЁ…з—›з­’зµ±йЂље †ж§Њи…їи¤ЄйЂЂй №еЃёеҐ—е¦¬жЉ•йЂЏй¬Єж…ќз‰№й—–еќЎе©†е·ґжЉЉж’­ж“єжќ·жіўжґѕз€¬зђ¶з ґзЅ·иЉ­и·›й —е€¤еќ‚жќїз‰€з“ЈиІ©иѕ¦й€‘"],
    ["f8a1","йЄе…«еЏ­жЌЊдЅ©е”„ж‚–ж•—жІ›жµїз‰Њз‹ЅзЁ—и¦‡иІќеЅ­жѕЋзѓ№и†Ёж„ЋдѕїеЃЏж‰Ѓз‰‡зЇ‡з·Ёзї©йЃЌйћ­йЁ™иІ¶еќЄе№іжћ°иђЌи©•еђ е¬–е№Је»ўејЉж–ѓи‚єи”Ѕй–‰й™›дЅ€еЊ…еЊЌеЊЏе’†е“єењѓеёѓжЂ–жЉ›жЉ±жЌ•пЁ†жіЎжµ¦з–±з Іиѓћи„Їи‹ћи‘Ўи’ІиўЌи¤’йЂ‹й‹ЄйЈЅй®‘е№…жљґж›ќзЂ‘з€†пЁ‡дїµе‰ЅеЅЄж…“жќ“жЁ™жј‚з“ўзҐЁиЎЁи±№йЈ‡йЈ„й©ѓ"],
    ["f9a1","е“ЃзЁџжҐ“и«·и±ЉйўЁй¦®еЅјжЉ«з–Ізљ®иў«йЃїй™‚еЊ№ејјеї…жіЊзЏЊз•ўз–‹з­†и‹ѕй¦ќд№ЏйЂјдё‹дЅ•еЋ¦е¤Џе»€ж°жІіз‘•иЌ·иќ¦иіЂйЃђйњћй°•еЈ‘е­ёи™ђи¬”й¶ґеЇ’жЃЁж‚Ќж—±ж±—жјўжѕЈзЂљзЅ•зї°й–‘й–’й™ђйџ“е‰ІиЅ„е‡Ѕеђ«е’ёе•Је–ЉжЄ»ж¶µз·и‰¦йЉњй™·й№№еђ€е“€з›’и›¤й–¤й—”й™њдєўдј‰е§®е«¦е··жЃ’жЉ—жќ­жЎЃжІ†жёЇзјёи‚›и€Є"],
    ["faa1","пЁ€пЁ‰й …дєҐеЃ•е’іећ“еҐље­©е®іж‡€жҐ·жµ·зЂЈиџ№и§Ји©Іи«§й‚‚й§­йЄёеЉѕж ёеЂ–е№ёжќЏиЌ‡иЎЊдє«еђ‘ељ®зЏ¦й„•йџїй¤‰йҐ—й¦™е™“еўџи™›иЁ±ж†Іж«¶зЌ»и»’ж­‡йљЄй©—еҐ•з€Ђиµ«йќ©дї”еіґеј¦ж‡ёж™›жі«з‚«зЋ„зЋ№зЏѕзњ©зќЌзµѓзµўзёЈи€·иЎ’пЁЉиіўй‰‰йЎЇе­‘з©ґиЎЂй Ѓе«Њдї еЌ”е¤ѕеіЅжЊѕжµ№з‹№и„…и„‡иЋўй‹Џй °дєЁе…„е€‘ећ‹"],
    ["fba1","еЅўжі‚ж»ЋзЂ…зЃђз‚Їз†’зЏ©з‘©иЌЉићўиЎЎйЂ€й‚ўйЋЈй¦Ёе…®еЅ—жѓ ж…§жљіи•™и№Љй†Їйћ‹д№Ћдє’е‘јеЈ•еЈєеҐЅеІµеј§ж€¶ж‰€жЉж™§жЇ«жµ©ж·Џж№–ж»ёжѕ”жї жї©зЃќз‹ђзђҐз‘љз“ зљ“зҐњзіЉзёћиѓЎиЉ¦и‘«и’їи™Ћи™џиќґи­·и±ЄйЋ¬й ЂйЎҐжѓ‘ж€–й…·е©љжЏж··жёѕзђїй­‚еїЅжѓљз¬Џе“„ејж±ћжі“жґЄзѓзґ…и™№иЁЊйґ»еЊ–е’Ње¬…жЁєзЃ«з•µ"],
    ["fca1","з¦Ќз¦ѕиЉ±иЏЇи©±и­ЃиІЁйќґпЁ‹ж“ґж”«зўєзў»з©«дёёе–љеҐђе®¦е№»ж‚ЈжЏ›ж­Ўж™ҐжЎ“жё™з…Ґз’°зґ€й‚„й©©й°Ґжґ»ж»‘зЊѕи±Ѓй—Ље‡°е№ЊеѕЁжЃЌжѓ¶ж„°ж…Њж™ѓж™„ж¦ҐжіЃж№џж»‰жЅўз…Њз’њзљ‡зЇЃз°§иЌ’иќ—йЃ‘йљЌй»ѓеЊЇе›ће»»еѕЉжЃўж‚”ж‡·ж™¦жњѓжЄњж·®жѕ®зЃ°зЌЄз№Єи†ѕиЊґи›”иЄЁиі„еЉѓзЌІе®–ж©«йђ„е“®ељ†е­ќж•€ж–…ж›‰жўџж¶Ќж·†"],
    ["fda1","з€»и‚ґй…µй©ЌдѕЇеЂ™еЋљеђЋеђје–‰е—…еёїеѕЊжњЅз…¦зЏќйЂ…е‹›е‹іеЎ¤еЈЋз„„з†Џз‡»и–°иЁ“жљ€и–Ёе–§жљ„з…Љиђ±еЌ‰е–™жЇЃеЅ™еѕЅжЏ®жљ‰з…‡и«±ијќйєѕдј‘жђєзѓ‹з•¦и™§жЃ¤и­Ћй·ёе…‡е‡¶еЊ€жґ¶иѓёй»‘ж•ж¬Јз‚з—•еђѓе±№зґ‡иЁ–ж¬ ж¬Ѕж­†еђёжЃ°жґЅзї•и€€еѓ–е‡ће–ње™«е›Ќе§¬е¬‰еёЊж†™ж†ж€±ж™ћж›¦з†™з†№з†єзЉ§з¦§зЁЂзѕІи©°"]
    ]
    
    },{}],19:[function(require,module,exports){
    module.exports=[
    ["0","\u0000",127],
    ["a140","гЂЂпјЊгЂЃгЂ‚пјЋвЂ§пј›пјљпјџпјЃпё°вЂ¦вЂҐп№ђп№‘п№’В·п№”п№•п№–п№—пЅњвЂ“пё±вЂ”пёів•ґпёґп№Џпј€пј‰пёµпё¶пЅ›пЅќпё·пёёгЂ”гЂ•пё№пёєгЂђгЂ‘пё»пёјгЂЉгЂ‹пёЅпёѕгЂ€гЂ‰пёїп№ЂгЂЊгЂЌп№Ѓп№‚гЂЋгЂЏп№ѓп№„п№™п№љ"],
    ["a1a1","п№›п№њп№ќп№ћвЂвЂ™вЂњвЂќгЂќгЂћвЂµвЂІпјѓпј†пјЉвЂ»В§гЂѓв—‹в—Џв–ів–Ів—Ћв†в…в—‡в—†в–Ўв– в–Ѕв–јгЉЈв„…ВЇпїЈпјїЛЌп№‰п№Љп№Ќп№Ћп№‹п№Њп№џп№ п№Ўпј‹пјЌГ—Г·В±в€љпјњпјћпјќв‰¦в‰§в‰ в€ћв‰’в‰Ўп№ў",4,"пЅћв€©в€ЄвЉҐв€ в€џвЉїгЏ’гЏ‘в€«в€®в€µв€ґв™Ђв™‚вЉ•вЉ™в†‘в†“в†ђв†’в†–в†—в†™в†в€Ґв€ЈпјЏ"],
    ["a240","пјјв€•п№Ёпј„пїҐгЂ’пї пїЎпј…пј в„ѓв„‰п№©п№Єп№«гЏ•гЋњгЋќгЋћгЏЋгЋЎгЋЋгЋЏгЏ„В°е…™е…›е…ће…ќе…Ўе…Је—§з“©зіЋв–Ѓ",7,"в–Џв–Ћв–Ќв–Њв–‹в–Љв–‰в”јв”ґв”¬в”¤в”њв–”в”Ђв”‚в–•в”Њв”ђв””в”в•­"],
    ["a2a1","в•®в•°в•Їв•ђв•ћв•Єв•Ўв—ўв—Јв—Ґв—¤в•±в•Ів•іпјђ",9,"в… ",9,"гЂЎ",8,"еЌЃеЌ„еЌ…пјЎ",25,"пЅЃ",21],
    ["a340","пЅ—пЅпЅ™пЅљО‘",16,"ОЈ",6,"О±",16,"Пѓ",6,"г„…",10],
    ["a3a1","г„ђ",25,"Л™Л‰ЛЉЛ‡Л‹"],
    ["a3e1","в‚¬"],
    ["a440","дёЂд№™дёЃдёѓд№ѓд№ќдє†дєЊдєєе„їе…Ґе…«е‡ е€Ђе€ЃеЉ›еЊ•еЌЃеЌњеЏ€дё‰дё‹дё€дёЉдё«дёёе‡Ўд№…д№€д№џд№ћдєЋдєЎе…Ђе€ѓе‹єеЌѓеЏ‰еЏЈењџеЈ«е¤•е¤§еҐіе­ђе­‘е­“еЇёе°Џе°ўе°ёе±±е·ќе·Ґе·±е·Іе·іе·ѕе№Іе»ѕеј‹еј“ж‰Ќ"],
    ["a4a1","дё‘дёђдёЌдё­дё°дё№д№‹е°№дє€дє‘дє•дє’дє”дєўд»Ѓд»Ђд»ѓд»†д»‡д»Ќд»Љд»‹д»„е…ѓе…Ѓе…§е…­е…®е…¬е†—е‡¶е€†е€‡е€€е‹»е‹ѕе‹їеЊ–еЊ№еЌ€еЌ‡еЌ…еЌћеЋ„еЏ‹еЏЉеЏЌеЈ¬е¤©е¤«е¤Єе¤­е­”е°‘е°¤е°єе±Їе·ґе№»е»їеј”еј•еїѓж€€ж€¶ж‰‹ж‰Ћж”Їж–‡ж–—ж–¤ж–№ж—Ґж›°жњ€жњЁж¬ ж­ўж­№жЇ‹жЇ”жЇ›ж°Џж°ґзЃ«з€Єз€¶з€»з‰‡з‰™з‰›зЉ¬зЋ‹дё™"],
    ["a540","дё–дё•дё”дёдё»д№Ќд№Џд№Ћд»Ґд»д»”д»•д»–д»—д»Јд»¤д»™д»ће……е…„е†‰е†Ље†¬е‡№е‡єе‡ёе€ЉеЉ еЉџеЊ…еЊ†еЊ—еЊќд»џеЌЉеЌ‰еЌЎеЌ еЌЇеЌ®еЋ»еЏЇеЏ¤еЏіеЏ¬еЏ®еЏ©еЏЁеЏјеЏёеЏµеЏ«еЏ¦еЏЄеЏІеЏ±еЏ°еЏҐеЏ­еЏ»е››е›ље¤–"],
    ["a5a1","е¤®е¤±еҐґеҐ¶е­•е®ѓе°је·Ёе·§е·¦её‚еёѓе№іе№јејЃејеј—еї…ж€Љж‰“ж‰”ж‰’ж‰‘ж–Ґж—¦жњ®жњ¬жњЄжњ«жњ­ж­ЈжЇЌж°‘ж°ђж°ёж±Ѓж±Ђж°ѕзЉЇзЋ„зЋ‰з“њз“¦з”з”џз”Ёз”©з”°з”±з”Із”із–‹з™Ѕзљ®зљїз›®зџ›зџўзџіз¤єз¦ѕз©ґз«‹дёћдёџд№’д№“д№©дє™дє¤дє¦дєҐд»їдј‰дј™дјЉдј•дјЌдјђдј‘дјЏд»Ід»¶д»»д»°д»ід»ЅдјЃдј‹е…‰е…‡е…†е…€е…Ё"],
    ["a640","е…±е†Ќе†°е€—е€‘е€’е€Ће€–еЉЈеЊ€еЊЎеЊ еЌ°еЌ±еђ‰еђЏеђЊеђЉеђђеђЃеђ‹еђ„еђ‘еђЌеђ€еђѓеђЋеђ†еђ’е› е›ће›ќењіењ°ењЁењ­ењ¬ењЇењ©е¤™е¤ље¤·е¤ёе¦„еҐёе¦ѓеҐЅеҐ№е¦‚е¦Ѓе­—е­е®‡е®€е®…е®‰еЇєе°–е±№е·ћеё†е№¶е№ґ"],
    ["a6a1","ејЏеј›еї™еї–ж€Ћж€Њж€Ќж€ђж‰Јж‰›ж‰ж”¶ж—©ж—Ёж—¬ж—­ж›Іж›іжњ‰жњЅжњґжњ±жњµж¬Ўж­¤ж­»ж°–ж±ќж±—ж±™ж±џж± ж±ђж±•ж±Ўж±›ж±Ќж±ЋзЃ°з‰џз‰ќз™ѕз«№з±ізіёзј¶зѕЉзѕЅиЂЃиЂѓиЂЊиЂ’иЂіиЃїи‚‰и‚‹и‚Њи‡Ји‡Єи‡іи‡ји€Њи€›и€џи‰®и‰Іи‰ѕи™«иЎЂиЎЊиЎЈиҐїйЎдёІдєЁдЅЌдЅЏдЅ‡дЅ—дЅћдјґдЅ›дЅ•дј°дЅђдЅ‘дјЅдјєдјёдЅѓдЅ”дјјдЅ†дЅЈ"],
    ["a740","дЅњдЅ дјЇдЅЋдј¶дЅ™дЅќдЅ€дЅље…Ње…‹е…Ќе…µе†¶е†·е€Ґе€¤е€©е€Єе€ЁеЉ«еЉ©еЉЄеЉ¬еЊЈеЌіеЌµеђќеђ­еђћеђѕеђ¦е‘Ћеђ§е‘†е‘ѓеђіе‘€е‘‚еђ›еђ©е‘Љеђ№еђ»еђёеђ®еђµеђ¶еђ еђје‘Ђеђ±еђ«еђџеђ¬е›Єе›°е›¤е›«еќЉеќ‘еќЂеќЌ"],
    ["a7a1","еќ‡еќЋењѕеќђеќЏењ»еЈЇе¤ѕе¦ќе¦’е¦Ёе¦ће¦Је¦™е¦–е¦Ќе¦¤е¦“е¦Ље¦Ґе­ќе­ње­ље­›е®Ње®‹е®Џе°¬е±Ђе±Ѓе°їе°ѕеІђеІ‘еІ”еІЊе·«еёЊеєЏеє‡еєЉе»·еј„ејџеЅ¤еЅўеЅ·еЅ№еїеїЊеї—еїЌеї±еї«еїёеїЄж€’ж€‘жЉ„жЉ—жЉ–жЉЂж‰¶жЉ‰ж‰­жЉЉж‰јж‰ѕж‰№ж‰іжЉ’ж‰ЇжЉж‰®жЉ•жЉ“жЉ‘жЉ†ж”№ж”»ж”ёж—±ж›ґжќџжќЋжќЏжќђжќ‘жќњжќ–жќћжќ‰жќ†жќ "],
    ["a840","жќ“жќ—ж­ҐжЇЏж±‚ж±ћжІ™жІЃжІ€жІ‰жІ…жІ›ж±Єж±єжІђж±°жІЊж±ЁжІ–жІ’ж±ЅжІѓж±Іж±ѕж±ґжІ†ж±¶жІЌжІ”жІжІ‚зЃ¶зЃјзЃЅзЃёз‰ўз‰Ўз‰ з‹„з‹‚зЋ–з”¬з”«з”·з”ёзљ‚з›ЇзџЈз§Ѓз§Ђз¦їз©¶зі»зЅ•и‚–и‚“и‚ќи‚и‚›и‚љи‚Іи‰ЇиЉ’"],
    ["a8a1","иЉ‹иЉЌи¦‹и§’иЁЂи°·и±†и±•иІќиµ¤иµ°и¶іиє«и»Љиѕ›иѕ°иї‚иї†иї…иї„е·Ўй‚‘й‚ўй‚Єй‚¦й‚Јй…‰й‡†й‡ЊйІй®й±йЄй¬дё¦д№–д№ідє‹дє›дєћдє«дє¬дЅЇдѕќдѕЌдЅідЅїдЅ¬дѕ›дѕ‹дѕ†дѕѓдЅ°дЅµдѕ€дЅ©дЅ»дѕ–дЅѕдѕЏдѕ‘дЅєе…”е…’е…•е…©е…·е…¶е…ёе†Ѕе‡Ѕе€»е€ёе€·е€єе€°е€®е€¶е‰ЃеЉѕеЉ»еЌ’еЌ”еЌ“еЌ‘еЌ¦еЌ·еЌёеЌ№еЏ–еЏ”еЏ—е‘іе‘µ"],
    ["a940","е’–е‘ёе’•е’Ђе‘»е‘·е’„е’’е’†е‘је’ђе‘±е‘¶е’Ње’ље‘ўе‘Ёе’‹е‘Ѕе’Ће›єећѓеќ·еќЄеќ©еќЎеќ¦еќ¤еќје¤њеҐ‰еҐ‡еҐ€еҐ„еҐ”е¦ѕе¦»е§”е¦№е¦®е§‘е§†е§ђе§Ќе§‹е§“е§Ље¦Їе¦іе§’е§…е­џе­¤е­Је®—е®ље®е®ње®™е®›е°ље±€е±…"],
    ["a9a1","е±†еІ·еІЎеІёеІ©еІ«еІ±еІіеёеёљеё–её•её›её‘е№ёеєљеє—еєњеє•еє–е»¶еј¦еј§еј©еѕЂеѕЃеЅїеЅјеїќеї еїЅеїµеїїжЂЏжЂ”жЂЇжЂµжЂ–жЂЄжЂ•жЂЎжЂ§жЂ©жЂ«жЂ›ж€–ж€•ж€їж€ѕж‰Ђж‰їж‹‰ж‹Њж‹„жЉїж‹‚жЉ№ж‹’ж‹›жЉ«ж‹“ж‹”ж‹‹ж‹€жЉЁжЉЅжЉјж‹ђж‹™ж‹‡ж‹ЌжЉµж‹љжЉ±ж‹ж‹–ж‹—ж‹†жЉ¬ж‹Ћж”ѕж–§ж–јж—єж”ж“жЊж†ж‚жЋжЂжЏж•жЉ"],
    ["aa40","ж‡жњЌжњ‹жќ­жћ‹жћ•жќ±жћњжќіжќ·жћ‡жћќжћ—жќЇжќ°жќїжћ‰жќѕжћђжќµжћљжћ“жќјжќЄжќІж¬Јж­¦ж­§ж­їж°“ж°›жіЈжіЁжііжІ±жіЊжіҐжІіжІЅжІѕжІјжіўжІ«жі•жі“жІёжі„жІ№жіЃжІ®жі—жі…жі±жІїжІ»жіЎжі›жіЉжІ¬жіЇжіњжі–жі "],
    ["aaa1","з‚•з‚Ћз‚’з‚Љз‚™з€¬з€­з€ёз‰€з‰§з‰©з‹Ђз‹Ћз‹™з‹—з‹ђзЋ©зЋЁзЋџзЋ«зЋҐз”Ѕз–ќз–™з–љзљ„з›‚з›Із›ґзџҐзџЅз¤ѕзҐЂзҐЃз§‰з§€з©єз©№з«єзіѕзЅ”зѕЊзѕ‹иЂ…и‚єи‚Ґи‚ўи‚±и‚Ўи‚«и‚©и‚ґи‚Єи‚Їи‡Ґи‡ѕи€ЌиЉіиЉќиЉ™иЉ­иЉЅиЉџиЉ№иЉ±иЉ¬иЉҐиЉЇиЉёиЉЈиЉ°иЉѕиЉ·и™Ћи™±е€ќиЎЁи»‹иїЋиї”иї‘й‚µй‚ёй‚±й‚¶й‡‡й‡‘й•·й–Ђйњй™Ђйїй»й™„"],
    ["ab40","й™‚йљ№й›Ёйќ’йќћдєџдє­дє®дїЎдѕµдѕЇдѕїдї дї‘дїЏдїќдїѓдѕ¶дїдїџдїЉдї—дѕ®дїђдї„дї‚дїљдїЋдїћдѕ·е…—е†’е†‘е† е‰Ће‰ѓе‰Ље‰Ќе‰Ње‰‹е‰‡е‹‡е‹‰е‹ѓе‹ЃеЊЌеЌ—еЌ»еЋљеЏ›е’¬е“Ђе’Ёе“Ће“‰е’ёе’¦е’іе“‡е“‚е’Ѕе’Єе“Ѓ"],
    ["aba1","е“„е“€е’Їе’«е’±е’»е’©е’§е’їе›їећ‚ећ‹ећ ећЈећўеџЋећ®ећ“еҐ•еҐ‘еҐЏеҐЋеҐђе§ње§е§їе§Је§ЁеЁѓе§Ґе§Єе§ље§¦еЁЃе§»е­©е®Је®¦е®¤е®ўе®Ґе°Ѓе±Ће±Џе±Ќе±‹еі™еі’е··еёќеёҐеёџе№Ѕеє еє¦е»єеј€еј­еЅҐеѕ€еѕ…еѕЉеѕ‹еѕ‡еѕЊеѕ‰жЂ’жЂќжЂ жЂҐжЂЋжЂЁжЃЌжЃ°жЃЁжЃўжЃ†жЃѓжЃ¬жЃ«жЃЄжЃ¤ж‰Ѓж‹њжЊ–жЊ‰ж‹јж‹­жЊЃж‹®ж‹ЅжЊ‡ж‹±ж‹·"],
    ["ac40","ж‹Їж‹¬ж‹ѕж‹ґжЊ‘жЊ‚ж”їж•…ж–«ж–Ѕж—ўжҐж­ж ж§жЇжџжЁж±ж¤ж›·жџїжџ“жџ±жџ”жџђжџ¬жћ¶жћЇжџµжџ©жџЇжџ„жџ‘жћґжџљжџҐжћёжџЏжџћжџіжћ°жџ™жџўжџќжџ’ж­Єж®ѓж®†ж®µжЇ’жЇ—ж°џжі‰жґ‹жґІжґЄжµЃжґҐжґЊжґ±жґћжґ—"],
    ["aca1","жґ»жґЅжґѕжґ¶жґ›жіµжґ№жґ§жґёжґ©жґ®жґµжґЋжґ«з‚«з‚єз‚із‚¬з‚Їз‚­з‚ёз‚®з‚¤з€°з‰Із‰Їз‰ґз‹©з‹ з‹ЎзЋ·зЏЉзЋ»зЋІзЏЌзЏЂзЋіз”љз”­з•Џз•Њз•Ћз•‹з–«з–¤з–Ґз–ўз–Јз™ёзљ†зљ‡зљ€з›€з›†з›ѓз›…зњЃз›№з›ёзњ‰зњ‹з›ѕз›јзњ‡зџњз ‚з ”з Њз ЌзҐ†зҐ‰зҐ€зҐ‡з¦№з¦єз§‘з§’з§‹з©їзЄЃз«їз«Ѕз±Ѕзґ‚зґ…зґЂзґ‰зґ‡зґ„зґ†зјёзѕЋзѕїиЂ„"],
    ["ad40","иЂђиЂЌиЂ‘иЂ¶иѓ–иѓҐиѓљиѓѓиѓ„иѓЊиѓЎиѓ›иѓЋиѓћиѓ¤иѓќи‡ґи€ўи‹§иЊѓиЊ…и‹Ји‹›и‹¦иЊ„и‹ҐиЊ‚иЊ‰и‹’и‹—и‹±иЊЃи‹њи‹”и‹‘и‹ћи‹“и‹џи‹ЇиЊ†и™ђи™№и™»и™єиЎЌиЎ«и¦Ѓи§”иЁ€иЁ‚иЁѓиІћиІ иµґиµіи¶ґи»Ќи»Њиї°иї¦иїўиїЄиїҐ"],
    ["ada1","иї­иї«иї¤иїЁйѓЉйѓЋйѓЃйѓѓй…‹й…Љй‡Ќй–‚й™ђй™‹й™Њй™Ќйќўйќ©йџ‹йџ­йџій ЃйўЁйЈ›йЈџй¦–й¦™д№дєіеЂЊеЂЌеЂЈдїЇеЂ¦еЂҐдїёеЂ©еЂ–еЂ†еЂјеЂџеЂљеЂ’еЂ‘дїєеЂЂеЂ”еЂЁдї±еЂЎеЂ‹еЂ™еЂдїідї®еЂ­еЂЄдїѕеЂ«еЂ‰е…је†¤е†Ґе†ўе‡Ќе‡Ње‡†е‡‹е‰–е‰ње‰”е‰›е‰ќеЊЄеЌїеЋџеЋќеЏџе“Ёе”ђе”Ѓе”·е“је“Ґе“Іе”†е“єе””е“©е“­е“Ўе”‰е“®е“Є"],
    ["ae40","е“¦е”§е”‡е“Ѕе”Џењѓењ„еџ‚еџ”еџ‹еџѓе ‰е¤ЏеҐ—еҐеҐљеЁ‘еЁеЁњеЁџеЁ›еЁ“е§¬еЁ еЁЈеЁ©еЁҐеЁЊеЁ‰е­«е±е®°е®іе®¶е®ґе®®е®µе®№е®ёе°„е±‘е±•е±ђеі­еіЅеі»еіЄеіЁеі°еі¶еґЃеіґе·®её­её«еє«еє­еє§еј±еѕ’еѕ‘еѕђжЃ™"],
    ["aea1","жЃЈжЃҐжЃђжЃ•жЃ­жЃ©жЃЇж‚„ж‚џж‚љж‚Ќж‚”ж‚Њж‚…ж‚–ж‰‡ж‹іжЊ€ж‹їжЌЋжЊѕжЊЇжЌ•жЌ‚жЌ†жЌЏжЌ‰жЊєжЌђжЊЅжЊЄжЊ«жЊЁжЌЌжЌЊж•€ж•‰ж–™ж—Ѓж—…ж™‚ж™‰ж™Џж™ѓж™’ж™Њж™…ж™Ѓж›ёжњ”жњ•жњ—ж Ўж ёжЎ€жЎ†жЎ“ж №жЎ‚жЎ”ж ©жўіж —жЎЊжЎ‘ж ЅжџґжЎђжЎЂж јжЎѓж ЄжЎ…ж “ж жЎЃж®Љж®‰ж®·ж°Јж°§ж°Ёж°¦ж°¤жі°жµЄж¶•ж¶€ж¶‡жµ¦жµёжµ·жµ™ж¶“"],
    ["af40","жµ¬ж¶‰жµ®жµљжµґжµ©ж¶Њж¶Љжµ№ж¶…жµҐж¶”зѓЉзѓзѓ¤зѓ™зѓ€зѓЏз€№з‰№з‹јз‹№з‹Ѕз‹ёз‹·зЋ†зЏ­зђ‰зЏ®зЏ зЏЄзЏћз•”з•ќз•њз•љз•™з–ѕз—…з—‡з–Із–із–Ѕз–јз–№з—‚з–ёзљ‹зљ°з›Љз›Ќз›Ћзњ©зњџзњ зњЁзџ©з °з §з ёз ќз ґз ·"],
    ["afa1","з Ґз ­з  з џз ІзҐ•зҐђзҐ зҐџзҐ–зҐћзҐќзҐ—зҐљз§¤з§Јз§§з§џз§¦з§©з§зЄ„зЄ€з«™з¬†з¬‘зІ‰зґЎзґ—зґ‹зґЉзґ зґўзґ”зґђзґ•зґљзґњзґЌзґ™зґ›зјєзЅџзѕ”зї…зїЃиЂ†иЂиЂ•иЂ™иЂ—иЂЅиЂїиѓ±и„‚иѓ°и„…иѓ­иѓґи„†иѓёиѓіи„€иѓЅи„ЉиѓјиѓЇи‡­и‡¬и€Ђи€ђи€Єи€«и€Ёи€¬иЉ»иЊ«иЌ’иЌ”иЌЉиЊёиЌђиЌ‰иЊµиЊґиЌЏиЊІиЊ№иЊ¶иЊ—иЌЂиЊ±иЊЁиЌѓ"],
    ["b040","и™”иљЉиљЄиљ“иљ¤иљ©иљЊиљЈиљњиЎ°иЎ·иўЃиў‚иЎЅиЎ№иЁиЁђиЁЋиЁЊиЁ•иЁЉиЁ—иЁ“иЁ–иЁЏиЁ‘и±€и±єи±№иІЎиІўиµ·иє¬и»’и»”и»Џиѕ±йЂЃйЂ†иї·йЂЂиїєиїґйЂѓиїЅйЂ…иїёй‚•йѓЎйѓќйѓўй…’й…Ќй…Њй‡й‡ќй‡—й‡њй‡™й–ѓй™ўй™Јй™Ў"],
    ["b0a1","й™›й™ќй™¤й™й™ћйљ»йЈўй¦¬йЄЁй«й¬Ґй¬Ій¬јд№ѕеЃєеЃЅеЃњеЃ‡еЃѓеЃЊеЃљеЃ‰еЃҐеЃ¶еЃЋеЃ•еЃµеЃґеЃ·еЃЏеЂЏеЃЇеЃ­е…ње†•е‡°е‰Єе‰Їе‹’е‹™е‹е‹•еЊђеЊЏеЊ™еЊїеЌЂеЊѕеЏѓж›је•†е•Єе•¦е•„е•ће•Ўе•ѓе•Ље”±е•–е•Џе••е”Їе•¤е”ёе”®е•ње”¬е•Је”іе•Ѓе•—ењ€ењ‹ењ‰еџџе …е Ље †еџ еџ¤еџєе ‚е µеџ·еџ№е¤ еҐўеЁ¶е©Ѓе©‰е©¦е©Єе©Ђ"],
    ["b140","еЁје©ўе©ље©†е©Ље­°еЇ‡еЇ…еЇ„еЇ‚е®їеЇ†е°‰е°€е°‡е± е±ње±ќеґ‡еґ†еґЋеґ›еґ–еґўеґ‘еґ©еґ”еґ™еґ¤еґ§еґ—е·ўеёёеё¶еёіеё·еє·еєёеє¶еєµеєѕејµеј·еЅ—еЅ¬еЅ©еЅ«еѕ—еѕ™еѕћеѕеѕЎеѕ еѕњжЃїж‚Јж‚‰ж‚ ж‚Ёжѓ‹ж‚ґжѓ¦ж‚Ѕ"],
    ["b1a1","жѓ…ж‚»ж‚µжѓњж‚јжѓжѓ•жѓ†жѓџж‚ёжѓљжѓ‡ж€љж€›ж‰€жЋ жЋ§жЌІжЋ–жЋўжЋҐжЌ·жЌ§жЋжЋЄжЌ±жЋ©жЋ‰жЋѓжЋ›жЌ«жЋЁжЋ„жЋ€жЋ™жЋЎжЋ¬жЋ’жЋЏжЋЂжЌ»жЌ©жЌЁжЌєж•ќж•–ж•‘ж•™ж•—е•џж•Џж•ж••ж•”ж–њж–›ж–¬ж—Џж—‹ж—Њж—Ћж™ќж™љж™¤ж™Ёж™¦ж™ћж›№е‹—жњ›жўЃжўЇжўўжў“жўµжЎїжЎ¶жў±жў§жў—жў°жўѓжЈ„жў­жў†жў…жў”жўќжўЁжўџжўЎжў‚ж¬Іж®є"],
    ["b240","жЇ«жЇ¬ж°«ж¶Ћж¶јж·іж·™ж¶Іж·Ўж·Њж·¤ж·»ж·єжё…ж·‡ж·‹ж¶Їж·‘ж¶®ж·ћж·№ж¶ёж··ж·µж·…ж·’жёљж¶µж·љж·«ж·ж·Єж·±ж·®ж·Ёж·†ж·„ж¶Єж·¬ж¶їж·¦зѓ№з„‰з„ЉзѓЅзѓЇз€Ѕз‰ЅзЉЃзЊњзЊ›зЊ–зЊ“зЊ™зЋ‡зђ…зђЉзђѓзђ†зЏѕзђЌз“ з“¶"],
    ["b2a1","з“·з”њз”ўз•Ґз•¦з•ўз•°з–Џз—”з—•з–µз—Љз—ЌзљЋз›”з›’з››зњ·зњѕзњјзњ¶зњёзњєзЎ«зЎѓзЎЋзҐҐзҐЁзҐ­з§»зЄ’зЄ•з¬ з¬Ёз¬›з¬¬з¬¦з¬™з¬ћз¬®зІ’зІ—зІ•зµ†зµѓзµ±зґ®зґ№зґјзµЂзґ°зґізµ„зґЇзµ‚зґІзґ±зјЅзѕћзѕљзїЊзїЋзї’иЂњиЃЉиЃ†и„Їи„–и„Ји„«и„©и„°и„¤и€‚и€µи€·и€¶и€№иЋЋиЋћиЋиЌёиЋўиЋ–иЋЅиЋ«иЋ’иЋЉиЋ“иЋ‰иЋ иЌ·иЌ»иЌј"],
    ["b340","иЋ†иЋ§и™•еЅЄи›‡и›Ђиљ¶и›„иљµи›†и›‹иљ±иљЇи›‰иЎ“иўћиў€иў«иў’иў–иўЌиў‹и¦“и¦ЏиЁЄиЁќиЁЈиЁҐиЁ±иЁ­иЁџиЁ›иЁўи±‰и±љиІ©иІ¬иІ«иІЁиІЄиІ§иµ§иµ¦и¶ѕи¶єи»›и»џйЂ™йЂЌйЂљйЂ—йЂЈйЂџйЂќйЂђйЂ•йЂћйЂ йЂЏйЂўйЂ–йЂ›йЂ”"],
    ["b3a1","йѓЁйѓ­йѓЅй…—й‡Ћй‡µй‡¦й‡Јй‡§й‡­й‡©й–‰й™Єй™µй™ій™ёй™°й™ґй™¶й™·й™¬й›Ђй›Єй›©з« з«џй ‚й ѓй­љйіҐй№µй№їйєҐйє»е‚ўе‚Ќе‚…е‚™е‚‘е‚Ђе‚–е‚е‚љжњЂе‡±е‰Іе‰ґе‰µе‰©е‹ће‹ќе‹›еЌљеЋҐе•»е–Ђе–§е•је–Ље–ќе–е–‚е–ње–Єе–”е–‡е–‹е–ѓе–іе–®е–џе”ѕе–Іе–ље–»е–¬е–±е•ѕе–‰е–«е–™ењЌе Їе Єе ґе ¤е °е ±е Ўе ќе  еЈ№еЈєеҐ "],
    ["b440","е©·еЄље©їеЄ’еЄ›еЄ§е­іе­±еЇ’еЇЊеЇ“еЇђе°Ље°‹е°±еµЊеµђеґґеµ‡е·Ѕе№…еёЅе№Ђе№ѓе№ѕе»Ље»Ѓе»‚е»„ејјеЅ­еѕ©еѕЄеѕЁжѓ‘жѓЎж‚Іж‚¶жѓ ж„њж„Јжѓєж„•жѓ°жѓ»жѓґж…Ёжѓ±ж„Ћжѓ¶ж„‰ж„Ђж„’ж€џж‰‰жЋЈжЋЊжЏЏжЏЂжЏ©жЏ‰жЏ†жЏЌ"],
    ["b4a1","жЏ’жЏЈжЏђжЏЎжЏ–жЏ­жЏ®жЌ¶жЏґжЏЄжЏ›ж‘’жЏљжЏ№ж•ћж•¦ж•ўж•Јж–‘ж–ђж–Їж™®ж™°ж™ґж™¶ж™Їжљ‘ж™єж™ѕж™·ж›ѕж›їжњџжњќжЈєжЈ•жЈ жЈжЈ—ж¤…жЈџжЈµжЈ®жЈ§жЈ№жЈ’жЈІжЈЈжЈ‹жЈЌж¤Ќж¤’ж¤ЋжЈ‰жЈљжҐ®жЈ»ж¬ѕж¬єж¬Ѕж®ж®–ж®јжЇЇж°®ж°Їж°¬жёЇжёёж№”жёЎжёІж№§ж№Љжё жёҐжёЈжё›ж№›ж№жё¤ж№–ж№®жё­жё¦ж№Їжёґж№Ќжёєжё¬ж№ѓжёќжёѕж»‹"],
    ["b540","жє‰жё™ж№Ћж№Јж№„ж№Іж№©ж№џз„™з„љз„¦з„°з„Ўз„¶з…®з„њз‰ЊзЉ„зЉЂзЊ¶зЊҐзЊґзЊ©зђєзђЄзђізђўзђҐзђµзђ¶зђґзђЇзђ›зђ¦зђЁз”Ґз”¦з•«з•Єз—ўз—›з—Јз—™з—з—ћз— з™»з™јзљ–зљ“зљґз›њзќЏзџ­зЎќзЎ¬зЎЇзЁЌзЁ€зЁ‹зЁ…зЁЂзЄ"],
    ["b5a1","зЄ—зЄ–з«Ґз«Јз­‰з­–з­†з­ђз­’з­”з­Ќз­‹з­Џз­‘зІџзІҐзµћзµђзµЁзµ•зґ«зµ®зµІзµЎзµ¦зµўзµ°зµіе–„зї”зї•иЂ‹иЃ’и‚…и…•и…”и…‹и…‘и…Ћи„№и…†и„ѕи…Њи…“и…ґи€’и€њиЏ©иђѓиЏёиђЌиЏ иЏ…иђ‹иЏЃиЏЇиЏ±иЏґи‘—иђЉиЏ°иђЊиЏЊиЏЅиЏІиЏЉиђёиђЋиђ„иЏњиђ‡иЏ”иЏџи™›и›џи›™и›­и›”и››и›¤и›ђи›ћиЎ—иЈЃиЈ‚иў±и¦ѓи¦–иЁ»и© и©•и©ћиЁји©Ѓ"],
    ["b640","и©”и©›и©ђи©†иЁґиЁєиЁ¶и©–и±ЎиІ‚иІЇиІјиІіиІЅиіЃиІ»иіЂиІґиІ·иІ¶иІїиІёи¶Љи¶…и¶Ѓи·Ћи·ќи·‹и·љи·‘и·Њи·›и·†и»»и»ёи»јиѕњйЂ®йЂµйЂ±йЂёйЂІйЂ¶й„‚йѓµй„‰йѓѕй…Јй…Ґй‡Џй€”й€•й€Јй€‰й€ћй€Ќй€ђй€‡й€‘й–”й–Џй–‹й–‘"],
    ["b6a1","й–“й–’й–ЋйљЉйљЋйљ‹й™Ѕйљ…йљ†йљЌй™Ійљ„й›Ѓй›…й›„й›†й›‡й›Їй›ІйџЊй …й †й €йЈ§йЈЄйЈЇйЈ©йЈІйЈ­й¦®й¦­й»ѓй»Ќй»‘дє‚е‚­е‚µе‚Іе‚іеѓ…е‚ѕе‚¬е‚·е‚»е‚Їеѓ‡е‰їе‰·е‰Ѕе‹џе‹¦е‹¤е‹ўе‹ЈеЊЇе—џе—Ёе—“е—¦е—Ће—ње—‡е—‘е—Је—¤е—Їе—ље—Ўе—…е—†е—Ґе—‰ењ’ењ“еЎћеЎ‘еЎеЎ—еЎљеЎ”еЎ«еЎЊеЎ­еЎЉеЎўеЎ’еЎ‹еҐ§е«Ѓе«‰е«ЊеЄѕеЄЅеЄј"],
    ["b740","еЄіе«‚еЄІеµ©еµЇе№Ње№№е»‰е»€еј’еЅ™еѕ¬еѕ®ж„љж„Џж…€ж„џжѓіж„›жѓ№ж„Ѓж„€ж…Ћж…Њж…„ж…Ќж„ѕж„ґж„§ж„Ќж„†ж„·ж€Ўж€ўжђ“жђѕжђћжђЄжђ­жђЅжђ¬жђЏжђњжђ”жђЌжђ¶жђ–жђ—жђ†ж•¬ж–џж–°жљ—жљ‰жљ‡жљ€жљ–жљ„жљжљЌжњѓж¦”жҐ­"],
    ["b7a1","жҐљжҐ·жҐ жҐ”жҐµж¤°ж¦‚жҐЉжҐЁжҐ«жҐћжҐ“жҐ№ж¦†жҐќжҐЈжҐ›ж­‡ж­ІжЇЂж®їжЇ“жЇЅжєўжєЇж»“жє¶ж»‚жєђжєќж»‡ж»…жєҐжєжєјжєєжє«ж»‘жє–жєњж»„ж»”жєЄжє§жєґз…Ћз…™з…©з…¤з…‰з…§з…њз…¬з…¦з…Њз…Ґз…ћз…†з…Ёз…–з€єз‰’зЊ·зЌ…зЊїзЊѕз‘Їз‘љз‘•з‘џз‘ћз‘Ѓзђїз‘™з‘›з‘њз•¶з•ёзЂз—°зЃз—Із—±з—єз—їз—ґз—із›ћз›џзќ›зќ«зќ¦зќћзќЈ"],
    ["b840","зќ№зќЄзќ¬зќњзќҐзќЁзќўзџ®зўЋзў°зў—зўзўЊзў‰зЎјзў‘зў“зЎїзҐєзҐїз¦Ѓиђ¬з¦ЅзЁњзЁљзЁ зЁ”зЁџзЁћзЄџзЄ з­·зЇЂз­ з­®з­§зІ±зІізІµз¶“зµ№з¶‘з¶Ѓз¶Џзµ›зЅ®зЅ©зЅЄзЅІзѕ©зѕЁзѕ¤иЃ–иЃи‚†и‚„и…±и…°и…ёи…Ґи…®и…іи…«"],
    ["b8a1","и…№и…єи…¦и€…и‰‡и’‚и‘·иђЅиђ±и‘µи‘¦и‘«и‘‰и‘¬и‘›иђјиђµи‘Ўи‘Ји‘©и‘­и‘†и™ћи™њи™џи›№ињ“ињ€ињ‡ињЂи›ѕи›»ињ‚ињѓињ†ињЉиЎ™иЈџиЈ”иЈ™иЈњиЈиЈќиЈЎиЈЉиЈ•иЈ’и¦њи§Ји©«и©Іи©іи©¦и©©и©°иЄ‡и©ји©ЈиЄ и©±иЄ…и©­и©ўи©®и©¬и©№и©»иЁѕи©Ёи±ўиІЉиІ‰иіЉиі‡иі€иі„иІІиіѓиі‚иі…и·Ўи·џи·Ёи·Їи·іи·єи·Єи·¤и·¦иєІијѓиј‰и»ѕијЉ"],
    ["b940","иѕџиѕІйЃ‹йЃЉйЃ“йЃ‚йЃ”йЂјйЃ•йЃђйЃ‡йЃЏйЃЋйЃЌйЃ‘йЂѕйЃЃй„’й„—й…¬й…Єй…©й‡‰й€·й‰—й€ёй€Ѕй‰Ђй€ѕй‰›й‰‹й‰¤й‰‘й€ґй‰‰й‰Ќй‰…й€№й€їй‰љй–йљйљ”йљ•й›Ќй›‹й›‰й›Љй›·й›»й›№й›¶йќ–йќґйќ¶й ђй ‘й “й Љй ’й ЊйЈјйЈґ"],
    ["b9a1","йЈЅйЈѕй¦ій¦±й¦ґй«Ўйі©йє‚йјЋйј“йј еѓ§еѓ®еѓҐеѓ–еѓ­еѓљеѓ•еѓЏеѓ‘еѓ±еѓЋеѓ©е…ўе‡іеЉѓеЉ‚еЊ±еЋ­е—ѕеЂе›е—е—Ѕе”е†е‰еЌеЋе—·е–еџе€еђе—¶ењењ–еЎµеЎѕеўѓеў“еўЉеЎ№еў…еЎЅеЈЅе¤Ґе¤ўе¤¤еҐЄеҐ©е«Ўе«¦е«©е«—е«–е«е«Је­µеЇћеЇ§еЇЎеЇҐеЇ¦еЇЁеЇўеЇ¤еЇџе°Ќе±ўе¶„е¶‡е№›е№Је№•е№—е№”е»“е»–ејЉеЅ†еЅ°еѕ№ж…‡"],
    ["ba40","ж„їж…‹ж…·ж…ўж…Јж…џж…љж…ж…µж€Єж’‡ж‘ж‘”ж’¤ж‘ёж‘џж‘єж‘‘ж‘§жђґж‘­ж‘»ж•Іж–Ўж——ж—–жљўжљЁжљќж¦њж¦Ёж¦•ж§Ѓж¦®ж§“ж§‹ж¦›ж¦·ж¦»ж¦«ж¦ґж§ђж§Ќж¦­ж§Њж¦¦ж§ѓж¦Јж­‰ж­Њж°іжјіжј”ж»ѕжј“ж»ґжј©жјѕжј жј¬жјЏжј‚жјў"],
    ["baa1","ж»їж»Їжј†жј±жјёжјІжјЈжј•жј«жјЇжѕ€жјЄж»¬жјЃж»Іж»Њж»·з†”з†™з…Ѕз†Љз†„з†’з€ѕзЉ’зЉ–зЌ„зЌђз‘¤з‘Јз‘Єз‘°з‘­з”„з–‘з§зЌз‹з‰з“з›Ўз›Јзћ„зќЅзќїзќЎзЈЃзўџзў§зўізў©зўЈз¦Ћз¦Џз¦ЌзЁ®зЁ±зЄЄзЄ©з«­з«Їз®Ўз®•з®‹з­µз®—з®ќз®”з®Џз®ёз®‡з®„зІ№зІЅзІѕз¶»з¶°з¶њз¶Ѕз¶ѕз¶ з·Љз¶ґз¶Із¶±з¶єз¶ўз¶їз¶µз¶ёз¶­з·’з·‡з¶¬"],
    ["bb40","зЅ°зї зїЎзїџиЃћиЃљи‚‡и…ђи†Ђи†Џи†€и†Љи…їи†‚и‡§и‡єи€‡и€”и€ћи‰‹и“‰и’їи“†и“„и’™и’ћи’Іи’њи“‹и’ёи“Ђи““и’ђи’ји“‘и“Љињїињњињ»ињўињҐињґињиќ•ињ·ињ©иЈіи¤‚иЈґиЈ№иЈёиЈЅиЈЁи¤љиЈЇиЄ¦иЄЊиЄћиЄЈиЄЌиЄЎиЄ“иЄ¤"],
    ["bba1","иЄЄиЄҐиЄЁиЄиЄ‘иЄљиЄ§и±ЄиІЌиІЊиі“иі‘иі’иµ«и¶™и¶•и·јиј”иј’иј•иј“иѕЈйЃ йЃйЃњйЃЈйЃ™йЃћйЃўйЃќйЃ›й„™й„й„ћй…µй…ёй…·й…ґй‰ёйЉЂйЉ…йЉйЉ–й‰»йЉ“йЉњйЉЁй‰јйЉ‘й–Ўй–Ёй–©й–Јй–Ґй–¤йљ™йљњйљ›й›Њй›’йњЂйќјйћ…йџ¶й —й йўЇйў±й¤ѓй¤…й¤Њй¤‰й§ЃйЄЇйЄ°й«¦й­Ѓй­‚йіґйі¶йіійєјйј»йЅЉе„„е„Ђеѓ»еѓµеѓ№е„‚е„€е„‰е„…е‡њ"],
    ["bc40","еЉ‡еЉ€еЉ‰еЉЌеЉЉе‹°еЋІе®е»е№еІеїеґе©е™“е™Ће™—е™ґе¶еЇе°еўЂеўџеўћеўіеўњеў®еў©еў¦еҐ­е¬‰е«»е¬‹е«µе¬Ње¬€еЇ®еЇ¬еЇ©еЇ«е±¤е±Ґе¶ќе¶”е№ўе№џе№Ўе»ўе»ље»џе»ќе»Је» еЅ€еЅ±еѕ·еѕµж…¶ж…§ж…®ж…ќж…•ж†‚"],
    ["bca1","ж…јж…°ж…«ж…ѕж†§ж†ђж†«ж†Ћж†¬ж†љж†¤ж†”ж†®ж€®ж‘©ж‘Їж‘№ж’ћж’Іж’€ж’ђж’°ж’Ґж’“ж’•ж’©ж’’ж’®ж’­ж’«ж’љж’¬ж’™ж’ўж’іж•µж•·ж•ёжљ®жљ«жљґжљ±жЁЈжЁџж§ЁжЁЃжЁћжЁ™ж§ЅжЁЎжЁ“жЁЉж§іжЁ‚жЁ…ж§­жЁ‘ж­ђж­Ћж®¤жЇ…жЇ†жјїжЅјжѕ„жЅ‘жЅ¦жЅ”жѕ†жЅ­жЅ›жЅёжЅ®жѕЋжЅєжЅ°жЅ¤жѕ—жЅж»•жЅЇжЅ жЅџз†џз†¬з†±з†Ёз‰–зЉ›зЌЋзЌ—з‘©з’‹з’ѓ"],
    ["bd40","з‘ѕз’Ђз•їз з©зџз¤з¦зЎзўзљљзљєз›¤зћЋзћ‡зћЊзћ‘зћ‹зЈ‹зЈ…зўєзЈЉзўѕзЈ•зўјзЈђзЁїзЁјз©ЂзЁЅзЁ·зЁ»зЄЇзЄ®з®­з®±зЇ„з®ґзЇ†зЇ‡зЇЃз® зЇЊзіЉз· з·ґз·Їз·»з·з·¬з·ќз·Ёз·Јз·љз·ћз·©з¶ћз·™з·Із·№зЅµзЅ·зѕЇ"],
    ["bda1","зї©иЂ¦и†›и†њи†ќи† и†љи†и”—и”Ѕи”љи“®и”¬и”­и”“и”‘и”Ји”Ўи””и“¬и”Ґи“їи”†ић‚иќґиќ¶иќ иќ¦иќёиќЁиќ™иќ—иќЊиќ“иЎ›иЎќи¤ђи¤‡и¤’и¤“и¤•и¤ЉиЄји«’и«‡и«„иЄ•и«‹и«ёиЄІи«‰и«‚иЄїиЄ°и«–и«ЌиЄ¶иЄ№и«›и±Њи±Ћи±¬иі иіћиі¦иі¤иі¬иі­иіўиіЈиіњиіЄиіЎиµ­и¶џи¶Јиё«иёђиёќиёўиёЏиё©иёџиёЎиёћиєєијќиј›ијџиј©иј¦ијЄијњијћ"],
    ["be40","ијҐйЃ©йЃ®йЃЁйЃ­йЃ·й„°й„­й„§й„±й†‡й†‰й†‹й†ѓй‹…йЉ»йЉ·й‹ЄйЉ¬й‹¤й‹ЃйЉійЉјй‹’й‹‡й‹°йЉІй–­й–±йњ„йњ†йњ‡йњ‰йќ йћЌйћ‹йћЏй Ўй «й њйўій¤Љй¤“й¤’й¤й§ќй§ђй§џй§›й§‘й§•й§’й§™йЄ·й«®й«Їй¬§й­…й­„й­·й­Їйґ†йґ‰"],
    ["bea1","йґѓйє©йєѕй»ЋеўЁйЅ’е„’е„е„”е„ђе„•е†Ђе†Єе‡ќеЉ‘еЉ“е‹іе™™е™«е™№е™©е™¤е™ёе™Єе™Ёе™Ґе™±е™Їе™¬е™ўе™¶еЈЃеўѕеЈ‡еЈ…еҐ®е¬ќе¬ґе­ёеЇ°е°ЋеЅЉж†Іж†‘ж†©ж†Љж‡Ќж†¶ж†ѕж‡Љж‡€ж€°ж“…ж“Ѓж“‹ж’»ж’јж“љж“„ж“‡ж“‚ж“Ќж’їж“’ж“”ж’ѕж•ґж›†ж›‰жљ№ж›„ж›‡жљёжЁЅжЁёжЁєж©™ж©«ж©жЁ№ж©„ж©ўж©Ўж©‹ж©‡жЁµж©џж©€ж­™ж­·ж°…жї‚жѕ±жѕЎ"],
    ["bf40","жїѓжѕ¤жїЃжѕ§жѕіжїЂжѕ№жѕ¶жѕ¦жѕ жѕґз†ѕз‡‰з‡ђз‡’з‡€з‡•з†№з‡Ћз‡™з‡њз‡ѓз‡„зЌЁз’њз’Јз’з’џз’ћз“ўз”Њз”Ќзґзёзєз›§з›Ґзћ зћћзћџзћҐзЈЁзЈљзЈ¬зЈ§з¦¦з©Ќз©Ћз©†з©Њз©‹зЄєзЇ™з°‘зЇ‰зЇ¤зЇ›зЇЎзЇ©зЇ¦зі•зі–зёЉ"],
    ["bfa1","зё‘зё€зё›зёЈзёћзёќзё‰зёђзЅ№зѕІзї°зї±зї®иЂЁи†іи†©и†Ёи‡»и€€и‰и‰™и•Љи•™и•€и•Ёи•©и•ѓи•‰и•­и•Єи•ћићѓићџићћићўићЌиЎЎи¤Єи¤Іи¤Ґи¤«и¤Ўи¦Єи¦¦и«¦и«єи««и«±и¬Ђи«њи«§и«®и«ѕи¬Ѓи¬‚и«·и«­и«іи«¶и«ји±«и±­иІ“иіґи№„иё±иёґи№‚иё№иёµиј»ијЇијёијіиѕЁиѕ¦йЃµйЃґйЃёйЃІйЃјйЃєй„ґй†’йЊ йЊ¶й‹ёйЊійЊЇйЊўй‹јйЊ«йЊ„йЊљ"],
    ["c040","йЊђйЊ¦йЊЎйЊ•йЊ®йЊ™й–»йљ§йљЁйљЄй›•йњЋйњ‘йњ–йњЌйњ“йњЏйќ›йќњйќ¦йћй °й ёй »й ·й ­й №й ¤й¤ђй¤Ёй¤ћй¤›й¤Ўй¤љй§­й§ўй§±йЄёйЄјй«»й«­й¬Ёй®‘йґ•йґЈйґ¦йґЁйґ’йґ›й»й»”йѕЌйѕње„Єе„џе„Ўе„Іе‹µељЋељЂељђељ…ељ‡"],
    ["c0a1","ељЏеЈ•еЈ“еЈ‘еЈЋе¬°е¬Єе¬¤е­єе°·е±Ёе¶је¶єе¶Ѕе¶ёе№«еЅЊеѕЅж‡‰ж‡‚ж‡‡ж‡¦ж‡‹ж€Іж€ґж“Ћж“Љж“ж“ ж“°ж“¦ж“¬ж“±ж“ўж“­ж–‚ж–ѓж›™ж›–жЄЂжЄ”жЄ„жЄўжЄњж«›жЄЈж©ѕжЄ—жЄђжЄ ж­њж®®жЇљж°€жїжї±жїџжї жї›жї¤жї«жїЇжѕЂжї¬жїЎжї©жї•жї®жї°з‡§з‡џз‡®з‡¦з‡Ґз‡­з‡¬з‡ґз‡ з€µз‰†зЌ°зЌІз’©з’°з’¦з’Ёз™†з™‚з™Њз›ЄзћізћЄзћ°зћ¬"],
    ["c140","зћ§зћ­зџЇзЈ·зЈєзЈґзЈЇз¤Ѓз¦§з¦Єз©—зЄїз°‡з°ЌзЇѕзЇ·з°ЊзЇ зі зіњзіћзіўзіџзі™зіќзё®зёѕз№†зё·зёІз№ѓзё«зёЅзё±з№…з№Ѓзёґзё№з№€зёµзёїзёЇзЅ„зїізїјиЃ±иЃІиЃ°иЃЇиЃіи‡†и‡ѓи†єи‡‚и‡Ђи†їи†Ѕи‡‰и†ѕи‡Ёи€‰и‰±и–Є"],
    ["c1a1","и–„и•ѕи–њи–‘и–”и–Їи–›и–‡и–Ёи–Љи™§иџЂиџ‘ићіиџ’иџ†ић«ић»ићєиџ€иџ‹и¤»и¤¶иҐ„и¤ёи¤Ѕи¦¬и¬Ћи¬—и¬™и¬›и¬Љи¬ и¬ќи¬„и¬ђи±Ѓи°їи±іиієиіЅиіјиіёиі»и¶Ёи№‰и№‹и№€и№ЉиЅ„ијѕиЅ‚иЅ…ијїйЃїйЃЅй‚„й‚Ѓй‚‚й‚Ђй„№й†Јй†ћй†њйЌЌйЋ‚йЊЁйЌµйЌЉйЌҐйЌ‹йЊйЌѕйЌ¬йЌ›йЌ°йЌљйЌ”й—Љй—‹й—Њй—€й—†йљ±йљёй›–йњњйњћйћ йџ“йЎ†йў¶й¤µйЁЃ"],
    ["c240","й§їй®®й®«й®Єй®­йґ»йґїйє‹й»Џй»ћй»њй»ќй»›йјѕйЅ‹еЏўељ•ељ®еЈ™еЈе¬ёеЅќж‡Јж€іж“ґж“Іж“ѕж”†ж“єж“»ж“·ж–·ж›њжњ¦жЄіжЄ¬ж«ѓжЄ»жЄёж«‚жЄ®жЄЇж­џж­ёж®ЇзЂ‰зЂ‹жїѕзЂ†жїєзЂ‘зЂЏз‡»з‡јз‡ѕз‡ёзЌ·зЌµз’§з’їз”•з™–з™"],
    ["c2a1","з™’зћЅзћїзћ»зћјз¤Ћз¦®з©Ўз©ўз© з«„з«…з°«з°§з°Єз°ћз°Јз°Ўзі§з№”з№•з№ћз№љз№Ўз№’з№™зЅ€зї№зї»иЃ·иЃ¶и‡Ќи‡Џи€Љи—Џи–©и—Ќи—ђи—‰и–°и–єи–№и–¦иџЇиџ¬иџІиџ и¦†и¦Іи§ґи¬Ёи¬№и¬¬и¬«и±ђиґ…и№™и№Ји№¦и№¤и№џи№•и»ЂиЅ‰иЅЌй‚‡й‚ѓй‚€й†«й†¬й‡ђйЋ”йЋЉйЋ–йЋўйЋійЋ®йЋ¬йЋ°йЋйЋљйЋ—й—”й—–й—ђй—•й›ўй›њй›™й››й›ћйњ¤йћЈйћ¦"],
    ["c340","йћ­йџ№йЎЌйЎЏйЎЊйЎЋйЎ“йўєй¤ѕй¤їй¤Ѕй¤®й¦ҐйЁЋй«Ѓй¬ѓй¬†й­Џй­Ћй­ЌйЇЉйЇ‰йЇЅйЇ€йЇЂйµ‘йµќйµ й» йј•йј¬е„іељҐеЈћеЈџеЈўеЇµйѕђе»¬ж‡Іж‡·ж‡¶ж‡µж”Ђж”Џж› ж›ќж«Ґж«ќж«љж«“зЂ›зЂџзЂЁзЂљзЂќзЂ•зЂз€†з€Ќз‰зЉўзЌё"],
    ["c3a1","зЌєз’Ѕз“Љз“Јз–‡з–†з™џз™Ўзџ‡з¤™з¦±з©«з©©з°ѕз°їз°ёз°Ѕз°·з±Ђз№«з№­з№№з№©з№Єзѕ…з№ізѕ¶зѕ№зѕёи‡и—©и—ќи—Єи—•и—¤и—Ґи—·иџ»и …и Ќиџ№иџѕиҐ иҐџиҐ–иҐћи­Ѓи­њи­и­‰и­љи­Ћи­Џи­†и­™иґ€иґЉи№ји№Іиє‡и№¶и№¬и№єи№ґиЅ”иЅЋиѕ­й‚Љй‚‹й†±й†®йЏЎйЏ‘йЏџйЏѓйЏ€йЏњйЏќйЏ–йЏўйЏЌйЏйЏ¤йЏ—йЏЁй—њйљґй›ЈйњЄйњ§йќЎйџњйџ»йЎћ"],
    ["c440","йЎйЎ›йўјйҐ…йҐ‰йЁ–йЁ™й¬ЌйЇЁйЇ§йЇ–йЇ›й¶‰йµЎйµІйµЄйµ¬йє’йє—йє“йєґе‹ёељЁељ·ељ¶ељґељјеЈ¤е­Ђе­ѓе­ЅеЇ¶е·‰ж‡ёж‡єж”ж””ж”™ж›¦жњ§ж«¬зЂѕзЂ°зЂІз€ђзЌ»з“Џз™ўз™Ґз¤¦з¤Єз¤¬з¤«з«‡з«¶з±Њз±ѓз±ЌзіЇзі°иѕ®з№Ѕз№ј"],
    ["c4a1","зє‚зЅЊиЂЂи‡љи‰¦и—»и—№и‘и—єи†и‹и‡иЉи ”и •иҐ¤и¦єи§ёи­°и­¬и­¦и­Їи­џи­«иґЏиґЌиє‰иєЃиє…иє‚й†ґй‡‹йђйђѓйЏЅй—Ўйњ°йЈ„йҐ’йҐ‘й¦ЁйЁ«йЁ°йЁ·йЁµй°“й°Ќй№№йєµй»ЁйјЇйЅџйЅЈйЅЎе„·е„ёе›Ѓе›Ђе›‚е¤”е±¬е·Ќж‡јж‡ѕж”ќж”њж–•ж›©ж«»ж¬„ж«єж®ІзЃЊз€›зЉ§з“–з“”з™©зџ“з±ђзєЏзєЊзѕји—и­иљи Ји ўи Ўи џиҐЄиҐ¬и¦Ѕи­ґ"],
    ["c540","и­·и­Ѕиґ“иєЉиєЌиє‹иЅџиѕЇй†єйђ®йђійђµйђєйђёйђІйђ«й—ўйњёйњ№йњІйџїйЎ§йЎҐйҐ—й©…й©ѓй©ЂйЁѕй«Џй­”й­‘й°­й°Ґй¶Їй¶ґй·‚й¶ёйєќй»Їйј™йЅњйЅ¦йЅ§е„је„»е›€е›Ље›‰е­їе·”е·’еЅЋж‡їж”¤ж¬Љж­ЎзЃ‘зЃзЋЂз“¤з–Љз™®з™¬"],
    ["c5a1","з¦із± з±џиЃѕиЃЅи‡џиҐІиҐЇи§ји®Ђиґ–иґ—иє‘иє“иЅЎй…€й‘„й‘‘й‘’йњЅйњѕйџѓйџЃйЎ«йҐ•й©•й©Ќй«’й¬љй±‰й°±й°ѕй°»й·“й·—йјґйЅ¬йЅЄйѕ”е›Ње·–ж€Ђж”Јж”«ж”Єж›¬ж¬ђз“љз«Љз±¤з±Јз±Ґзє“зє–зє”и‡ўиёиїи ±и®Љй‚ђй‚Џй‘Јй‘ й‘¤йќЁйЎЇйҐњй©љй©›й©—й«“й«”й«‘й±”й±—й±–й·Ґйєџй»ґе›‘еЈ©ж”¬зЃћз™±з™Ізџ—зЅђзѕ€и ¶и №иЎўи®“и®’"],
    ["c640","и®–и‰·иґ›й‡Ђй‘Єйќ‚йќ€йќ„йџ†йЎ°й©џй¬ўй­й±џй·№й·єй№јй№Ѕйј‡йЅ·йЅІе»іж¬–зЃЈз±¬з±®и »и§ЂиєЎй‡Ѓй‘Ій‘°йЎ±йҐћй«–й¬Јй»ЊзЃ¤зџљи®љй‘·йџ‰й©ўй©Ґзєњи®њиєЄй‡…й‘Ѕй‘ѕй‘јй±·й±ёй»·и±”й‘їйёљз€Ёй©Єй¬±йё›йёћз±І"],
    ["c940","д№‚д№ње‡µеЊљеЋ‚дё‡дёЊд№‡дєЌе›—пЁЊе±®еЅідёЏе†‡дёЋдё®дє“д»‚д»‰д»€е†е‹јеЌ¬еЋ№ењ е¤ѓе¤¬е°ђе·їж—Ўж®іжЇЊж°”з€їдё±дёјд»Ёд»њд»©д»Ўд»ќд»ље€ЊеЊњеЌЊењўењЈе¤—е¤Їе®Ѓе®„е°’е°»е±ґе±іеё„еєЂеє‚еї‰ж€‰ж‰ђж°•"],
    ["c9a1","ж°¶ж±ѓж°їж°»зЉ®зЉ°зЋЉз¦ёи‚ЉйћдјЋдјдј¬д»µдј”д»±дјЂд»·дј€дјќдј‚дј…дјўдј“дј„д»ґдј’е†±е€“е€‰е€ђеЉ¦еЊўеЊџеЌЌеЋЉеђ‡е›Ўе›џењ®ењЄењґе¤је¦ЂеҐје¦…еҐ»еҐѕеҐ·еҐїе­–е°•е°Ґе±је±єе±»е±ѕе·џе№µеє„еј‚ејљеЅґеї•еї”еїЏж‰њж‰ћж‰¤ж‰Ўж‰¦ж‰ўж‰™ж‰ ж‰љж‰Ґж—Їж—®жњѕжњ№жњёжњ»жњєжњїжњјжњіж°ж±†ж±’ж±њж±Џж±Љж±”ж±‹"],
    ["ca40","ж±ЊзЃ±з‰ћзЉґзЉµзЋЋз”Єз™їз©µзЅ‘и‰ёи‰јиЉЂи‰Ѕи‰їи™ЌиҐѕй‚™й‚—й‚й‚›й‚”йўй¤й йЈдЅ–дј»дЅўдЅ‰дЅ“дЅ¤дјѕдЅ§дЅ’дЅџдЅЃдЅдј­дјідјїдЅЎе†Џе†№е€ње€ће€ЎеЉ­еЉ®еЊ‰еЌЈеЌІеЋЋеЋЏеђ°еђ·еђЄе‘”е‘…еђ™еђњеђҐеђ"],
    ["caa1","еђЅе‘Џе‘ЃеђЁеђ¤е‘‡е›®е›§е›ҐеќЃеќ…еќЊеќ‰еќ‹еќ’е¤†еҐЂе¦¦е¦е¦ е¦—е¦Ће¦ўе¦ђе¦Џе¦§е¦Ўе®Ће®’е°Ёе°ЄеІЌеІЏеІ€еІ‹еІ‰еІ’еІЉеІ†еІ“еІ•е· еёЉеёЋеє‹еє‰еєЊеє€еєЌеј…ејќеЅёеЅ¶еї’еї‘еїђеї­еїЁеї®еїіеїЎеї¤еїЈеїєеїЇеї·еї»жЂЂеїґж€єжЉѓжЉЊжЉЋжЉЏжЉ”жЉ‡ж‰±ж‰»ж‰єж‰°жЉЃжЉ€ж‰·ж‰Ѕж‰Іж‰ґж”·ж—°ж—ґж—іж—Іж—µжќ…жќ‡"],
    ["cb40","жќ™жќ•жќЊжќ€жќќжќЌжќљжќ‹жЇђж°™ж°љж±ёж±§ж±«жІ„жІ‹жІЏж±±ж±Їж±©жІљж±­жІ‡жІ•жІњж±¦ж±іж±Ґж±»жІЋзЃґзЃєз‰ЈзЉїзЉЅз‹ѓз‹†з‹ЃзЉєз‹…зЋ•зЋ—зЋ“зЋ”зЋ’з”єз”№з–”з–•зљЃз¤ЅиЂґи‚•и‚™и‚ђи‚’и‚њиЉђиЉЏиЉ…иЉЋиЉ‘иЉ“"],
    ["cba1","иЉЉиЉѓиЉ„и±ёиї‰иѕїй‚џй‚Ўй‚Ґй‚ћй‚§й‚ й°йЁйЇй­дёідѕдЅјдѕ…дЅЅдѕЂдѕ‡дЅ¶дЅґдѕ‰дѕ„дЅ·дЅЊдѕ—дЅЄдѕљдЅ№дѕЃдЅёдѕђдѕњдѕ”дѕћдѕ’дѕ‚дѕ•дЅ«дЅ®е†ће†је†ѕе€µе€Іе€іе‰†е€±еЉјеЊЉеЊ‹еЊјеЋ’еЋ”е’‡е‘їе’Ѓе’‘е’‚е’€е‘«е‘єе‘ѕе‘Ґе‘¬е‘ґе‘¦е’Ќе‘Їе‘Ўе‘ е’е‘Је‘§е‘¤е›·е›№еќЇеќІеќ­еќ«еќ±еќ°еќ¶ећЂеќµеќ»еќіеќґеќў"],
    ["cc40","еќЁеќЅе¤ЊеҐ…е¦µе¦єе§Џе§Ће¦Іе§Ње§Ѓе¦¶е¦је§ѓе§–е¦±е¦Ѕе§Ђе§€е¦ґе§‡е­ўе­Ґе®“е®•е±„е±‡еІ®еІ¤еІ еІµеІЇеІЁеІ¬еІџеІЈеІ­еІўеІЄеІ§еІќеІҐеІ¶еІ°еІ¦её—её”её™ејЁејўејЈеј¤еЅ”еѕ‚еЅѕеЅЅеїћеїҐжЂ­жЂ¦жЂ™жЂІжЂ‹"],
    ["cca1","жЂґжЂЉжЂ—жЂіжЂљжЂћжЂ¬жЂўжЂЌжЂђжЂ®жЂ“жЂ‘жЂЊжЂ‰жЂњж€”ж€ЅжЉ­жЉґж‹‘жЉѕжЉЄжЉ¶ж‹ЉжЉ®жЉіжЉЇжЉ»жЉ©жЉ°жЉёж”Ѕж–Ёж–»ж‰ж—јж„ж’ж€ж—»жѓж‹жЌж…ж—Ѕж‘жђж›¶жњЉжћ…жќ¬жћЋжћ’жќ¶жќ»жћжћ†жћ„жќґжћЌжћЊжќєжћџжћ‘жћ™жћѓжќЅжћЃжќёжќ№жћ”ж¬Ґж®Ђж­ѕжЇћж°ќжІ“жі¬жі«жі®жі™жІ¶жі”жІ­жі§жІ·жіђжі‚жІєжіѓжі†жі­жіІ"],
    ["cd40","жі’жіќжІґжІЉжІќжІЂжіћжіЂжґ°жіЌжі‡жІ°жі№жіЏжі©жі‘з‚”з‚з‚…з‚“з‚†з‚„з‚‘з‚–з‚‚з‚љз‚ѓз‰Єз‹–з‹‹з‹з‹‰з‹њз‹’з‹”з‹љз‹Њз‹‘зЋ¤зЋЎзЋ­зЋ¦зЋўзЋ зЋ¬зЋќз“ќз“Ёз”їз•Ђз”ѕз–Њз–зљЇз›із›±з›°з›µзџёзџјзџ№зџ»зџє"],
    ["cda1","зџ·зҐ‚з¤їз§…з©ёз©»з«»з±µзіЅиЂµи‚Џи‚®и‚Ји‚ёи‚µи‚­и€ иЉ и‹ЂиЉ«иЉљиЉиЉ›иЉµиЉ§иЉ®иЉјиЉћиЉєиЉґиЉЁиЉЎиЉ©и‹‚иЉ¤и‹ѓиЉ¶иЉўи™°и™Їи™­и™®и±–иї’иї‹иї“иїЌиї–иї•иї—й‚Ій‚ґй‚Їй‚ій‚°й№йЅйјйєй™ѓдїЌдї…дї“дѕІдї‰дї‹дїЃдї”дїњдї™дѕ»дѕідї›дї‡дї–дѕєдїЂдѕ№дї¬е‰„е‰‰е‹Ђе‹‚еЊЅеЌјеЋ—еЋ–еЋ™еЋе’єе’Ўе’­е’Ґе“Џ"],
    ["ce40","е“ѓиЊЌе’·е’®е“–е’¶е“…е“†е’ е‘°е’је’ўе’ѕе‘Іе“ће’°ећµећћећџећ¤ећЊећ—ећќећ›ећ”ећећЏећ™ећҐећљећ•еЈґе¤ЌеҐ“е§Ўе§ће§®еЁЂе§±е§ќе§єе§Ѕе§је§¶е§¤е§Іе§·е§›е§©е§іе§µе§ е§ѕе§ґе§­е®Ёе±ЊеіђеіеіЊеі—еі‹еі›"],
    ["cea1","еіћеіљеі‰еі‡еіЉеі–еі“еі”еіЏеі€еі†еіЋеіџеіёе·№еёЎеёўеёЈеё её¤еє°еє¤еєўеє›еєЈеєҐеј‡еј®еЅ–еѕ†жЂ·жЂ№жЃ”жЃІжЃћжЃ…жЃ“жЃ‡жЃ‰жЃ›жЃЊжЃЂжЃ‚жЃџжЂ¤жЃ„жЃжЃ¦жЃ®ж‰‚ж‰ѓж‹ЏжЊЌжЊ‹ж‹µжЊЋжЊѓж‹«ж‹№жЊЏжЊЊж‹ёж‹¶жЊЂжЊ“жЊ”ж‹єжЊ•ж‹»ж‹°ж•Ѓж•ѓж–Єж–їж¶жЎжІжµжњж¦жўжіж«жєжќжґж№ж®жњЏжњђжџЃжџІжџ€жћє"],
    ["cf40","жџњжћ»жџёжџжџЂжћ·жџ…жџ«жџ¤жџџжћµжџЌжћіжџ·жџ¶жџ®жџЈжџ‚жћ№жџЋжџ§жџ°жћІжџјжџ†жџ­жџЊжћ®жџ¦жџ›жџєжџ‰жџЉжџѓжџЄжџ‹ж¬Ёж®‚ж®„ж®¶жЇ–жЇжЇ ж° ж°ЎжґЁжґґжґ­жґџжґјжґїжґ’жґЉжіљжґіжґ„жґ™жґєжґљжґ‘жґЂжґќжµ‚"],
    ["cfa1","жґЃжґжґ·жґѓжґЏжµЂжґ‡жґ жґ¬жґ€жґўжґ‰жґђз‚·з‚џз‚ѕз‚±з‚°з‚Ўз‚ґз‚µз‚©з‰Ѓз‰‰з‰Љз‰¬з‰°з‰із‰®з‹Љз‹¤з‹Ёз‹«з‹џз‹Єз‹¦з‹ЈзЋ…зЏЊзЏ‚зЏ€зЏ…зЋ№зЋ¶зЋµзЋґзЏ«зЋїзЏ‡зЋѕзЏѓзЏ†зЋёзЏ‹з“¬з“®з”®з•‡з•€з–§з–Єз™№з›„зњ€зњѓзњ„зњ…зњЉз›·з›»з›єзџ§зџЁз †з ‘з ’з …з ђз Џз Ћз ‰з ѓз “зҐЉзҐЊзҐ‹зҐ…зҐ„з§•з§Ќз§Џз§–з§ЋзЄЂ"],
    ["d040","з©ѕз«‘з¬Ђз¬Ѓз±єз±ёз±№з±їзІЂзІЃзґѓзґ€зґЃзЅзѕ‘зѕЌзѕѕиЂ‡иЂЋиЂЏиЂ”иЂ·иѓиѓ‡иѓ иѓ‘иѓ€иѓ‚иѓђиѓ…иѓЈиѓ™иѓњиѓЉиѓ•иѓ‰иѓЏиѓ—иѓ¦иѓЌи‡їи€ЎиЉ”и‹™и‹ѕи‹№иЊ‡и‹ЁиЊЂи‹•иЊєи‹«и‹–и‹ґи‹¬и‹Ўи‹Іи‹µиЊЊи‹»и‹¶и‹°и‹Є"],
    ["d0a1","и‹¤и‹ и‹єи‹іи‹­и™·и™ґи™ји™іиЎЃиЎЋиЎ§иЎЄиЎ©и§“иЁ„иЁ‡иµІиїЈиїЎиї®иї йѓ±й‚Ѕй‚їйѓ•йѓ…й‚ѕйѓ‡йѓ‹йѓ€й‡”й‡“й™”й™Џй™‘й™“й™Љй™ЋеЂћеЂ…еЂ‡еЂ“еЂўеЂ°еЂ›дїµдїґеЂіеЂ·еЂ¬дї¶дї·еЂ—еЂњеЂ еЂ§еЂµеЂЇеЂ±еЂЋе…ље†”е†“е‡Ље‡„е‡…е‡€е‡Ће‰Ўе‰ље‰’е‰ће‰џе‰•е‰ўе‹ЌеЊЋеЋће”¦е“ўе”—е”’е“§е“іе“¤е”ље“їе”„е”€е“«е”‘е”…е“±"],
    ["d140","е”Ље“»е“·е“ёе“ е”Ће”ѓе”‹ењЃењ‚еџЊе Іеџ•еџ’ећєеџ†ећЅећјећёећ¶ећїеџ‡еџђећ№еџЃе¤ЋеҐЉеЁ™еЁ–еЁ­еЁ®еЁ•еЁЏеЁ—еЁЉеЁћеЁіе­¬е®§е®­е®¬е°ѓе±–е±”еі¬еіїеі®еі±еі·еґЂеі№её©еёЁеєЁеє®еєЄеє¬ејіеј°еЅ§жЃќжЃљжЃ§"],
    ["d1a1","жЃЃж‚ўж‚€ж‚Ђж‚’ж‚Ѓж‚ќж‚ѓж‚•ж‚›ж‚—ж‚‡ж‚њж‚Ћж€™ж‰†ж‹ІжЊђжЌ–жЊ¬жЌ„жЌ…жЊ¶жЌѓжЏ¤жЊ№жЌ‹жЌЉжЊјжЊ©жЌЃжЊґжЌжЌ”жЌ™жЊ­жЌ‡жЊіжЌљжЌ‘жЊёжЌ—жЌЂжЌ€ж•Љж•†ж—†ж—ѓж—„ж—‚ж™Љж™џж™‡ж™‘жњ’жњ“ж џж љжЎ‰ж Іж іж »жЎ‹жЎЏж –ж ±ж њж µж «ж ­ж ЇжЎЋжЎ„ж ґж ќж ’ж ”ж ¦ж Ёж ®жЎЌж єж Ґж  ж¬¬ж¬Їж¬­ж¬±ж¬ґж­­и‚‚ж®€жЇ¦жЇ¤"],
    ["d240","жЇЁжЇЈжЇўжЇ§ж°ҐжµєжµЈжµ¤жµ¶жґЌжµЎж¶’жµжµўжµ­жµЇж¶‘ж¶Ќж·Їжµїж¶†жµћжµ§жµ ж¶—жµ°жµјжµџж¶‚ж¶жґЇжµЁж¶‹жµѕж¶Ђж¶„жґ–ж¶ѓжµ»жµЅжµµж¶ђзѓњзѓ“зѓ‘зѓќзѓ‹зј№зѓўзѓ—зѓ’зѓћзѓ зѓ”зѓЌзѓ…зѓ†зѓ‡зѓљзѓЋзѓЎз‰‚з‰ё"],
    ["d2a1","з‰·з‰¶зЊЂз‹єз‹ґз‹ѕз‹¶з‹із‹»зЊЃзЏ“зЏ™зЏҐзЏ–зЋјзЏ§зЏЈзЏ©зЏњзЏ’зЏ›зЏ”зЏќзЏљзЏ—зЏзЏЁз“ћз“џз“ґз“µз”Ўз•›з•џз–°з—Ѓз–»з—„з—Ђз–їз–¶з–єзљЉз›‰зњќзњ›зњђзњ“зњ’зњЈзњ‘зњ•зњ™зњљзњўзњ§з Јз ¬з ўз µз Їз Ёз ®з «з Ўз ©з із Єз ±зҐ”зҐ›зҐЏзҐњзҐ“зҐ’зҐ‘з§«з§¬з§ з§®з§­з§Єз§њз§ћз§ќзЄ†зЄ‰зЄ…зЄ‹зЄЊзЄЉзЄ‡з«з¬ђ"],
    ["d340","з¬„з¬“з¬…з¬Џз¬€з¬Љз¬Ћз¬‰з¬’зІ„зІ‘зІЉзІЊзІ€зІЌзІ…зґћзґќзґ‘зґЋзґзґ–зґ“зґџзґ’зґЏзґЊзЅњзЅЎзЅћзЅ зЅќзЅ›зѕ–зѕ’зїѓзї‚зїЂиЂ–иЂѕиЂ№иѓєиѓІиѓ№иѓµи„Ѓиѓ»и„Ђи€Ѓи€Їи€ҐиЊіиЊ­иЌ„иЊ™иЌ‘иЊҐиЌ–иЊїиЌЃиЊ¦иЊњиЊў"],
    ["d3a1","иЌ‚иЌЋиЊ›иЊЄиЊ€иЊјиЌЌиЊ–иЊ¤иЊ иЊ·иЊЇиЊ©иЌ‡иЌ…иЌЊиЌ“иЊћиЊ¬иЌ‹иЊ§иЌ€и™“и™’иљўиљЁиљ–иљЌиљ‘иљћиљ‡иљ—иљ†иљ‹иљљиљ…иљҐиљ™иљЎиљ§иљ•иљиљЋиљќиљђиљ”иЎѓиЎ„иЎ­иЎµиЎ¶иЎІиўЂиЎ±иЎїиЎЇиўѓиЎѕиЎґиЎјиЁ’и±‡и±—и±»иІ¤иІЈиµ¶иµёи¶µи¶·и¶¶и»‘и»“иїѕиїµйЂ‚иїїиї»йЂ„иїјиї¶йѓ–йѓ йѓ™йѓљйѓЈйѓџйѓҐйѓйѓ›йѓ—йѓњйѓ¤й…ђ"],
    ["d440","й…Ћй…Џй‡•й‡ўй‡љй™њй™џйљјйЈЈй«џй¬Їд№їеЃ°еЃЄеЃЎеЃћеЃ еЃ“еЃ‹еЃќеЃІеЃ€еЃЌеЃЃеЃ›еЃЉеЃўеЂ•еЃ…еЃџеЃ©еЃ«еЃЈеЃ¤еЃ†еЃЂеЃ®еЃіеЃ—еЃ‘е‡ђе‰«е‰­е‰¬е‰®е‹–е‹“еЊ­еЋње•µе•¶е”је•Ќе•ђе”ґе”Єе•‘е•ўе”¶е”µе”°е•’е•…"],
    ["d4a1","е”Ње”Іе•Ґе•Ће”№е•€е”­е”»е•Ђе•‹ењЉењ‡еџ»е ”еџўеџ¶еџњеџґе Ђеџ­еџЅе €еџёе ‹еџіеџЏе ‡еџ®еџЈеџІеџҐеџ¬еџЎе Ћеџје ђеџ§е Ѓе Њеџ±еџ©еџ°е Ќе „еҐње© е©е©•е©§е©ћеЁёеЁµе©­е©ђе©џе©Ґе©¬е©“е©¤е©—е©ѓе©ќе©’е©„е©›е©€еЄЋеЁѕе©ЌеЁ№е©Ње©°е©©е©‡е©‘е©–е©‚е©ње­Іе­®еЇЃеЇЂе±™еґћеґ‹еґќеґљеґ еґЊеґЁеґЌеґ¦еґҐеґЏ"],
    ["d540","еґ°еґ’еґЈеґџеґ®еёѕеёґеє±еєґеє№еєІеєіеј¶ејёеѕ›еѕ–еѕџж‚Љж‚ђж‚†ж‚ѕж‚°ж‚єжѓ“жѓ”жѓЏжѓ¤жѓ™жѓќжѓ€ж‚±жѓ›ж‚·жѓЉж‚їжѓѓжѓЌжѓЂжЊІжЌҐжЋЉжЋ‚жЌЅжЋЅжЋћжЋ­жЋќжЋ—жЋ«жЋЋжЌЇжЋ‡жЋђжЌ®жЋЇжЌµжЋњжЌ­жЋ®жЌјжЋ¤жЊ»жЋџ"],
    ["d5a1","жЌёжЋ…жЋЃжЋ‘жЋЌжЌ°ж•“ж—Ќж™Ґж™Ўж™›ж™™ж™њж™ўжњжЎ№жў‡жўђжўњжЎ­жЎ®жў®жў«жҐ–жЎЇжўЈжў¬жў©жЎµжЎґжўІжўЏжЎ·жў’жЎјжЎ«жЎІжўЄжўЂжЎ±жЎѕжў›жў–жў‹жў жў‰жў¤жЎёжЎ»жў‘жўЊжўЉжЎЅж¬¶ж¬іж¬·ж¬ёж®‘ж®Џж®Ќж®Ћж®Њж°Єж·Ђж¶«ж¶ґж¶іж№ґж¶¬ж·©ж·ўж¶·ж·¶ж·”жёЂж·€ж· ж·џж·–ж¶ѕж·Ґж·њж·ќж·›ж·ґж·Љж¶Ѕж·­ж·°ж¶єж·•ж·‚ж·Џж·‰"],
    ["d640","ж·ђж·Іж·“ж·Ѕж·—ж·Ќж·Јж¶»зѓєз„Ќзѓ·з„—зѓґз„Њзѓ°з„„зѓіз„ђзѓјзѓїз„†з„“з„Ђзѓёзѓ¶з„‹з„‚з„Ћз‰ѕз‰»з‰јз‰їзЊќзЊ—зЊ‡зЊ‘зЊзЊЉзЊ€з‹їзЊЏзЊћзЋ€зЏ¶зЏёзЏµзђ„зђЃзЏЅзђ‡зђЂзЏєзЏјзЏїзђЊзђ‹зЏґзђ€з•¤з•Јз—Ћз—’з—Џ"],
    ["d6a1","з—‹з—Њз—‘з—ђзљЏзљ‰з›“зњ№зњЇзњ­зњ±зњІзњґзњізњЅзњҐзњ»зњµзЎ€зЎ’зЎ‰зЎЌзЎЉзЎЊз ¦зЎ…зЎђзҐ¤зҐ§зҐ©зҐЄзҐЈзҐ«зҐЎз¦»з§єз§ёз§¶з§·зЄЏзЄ”зЄђз¬µз­‡з¬ґз¬Ґз¬°з¬ўз¬¤з¬із¬з¬Єз¬ќз¬±з¬«з¬­з¬Їз¬Із¬ёз¬љз¬ЈзІ”зІзІ–зІЈзґµзґЅзґёзґ¶зґєзµ…зґ¬зґ©зµЃзµ‡зґѕзґїзµЉзґ»зґЁзЅЈзѕ•зѕњзѕќзѕ›зїЉзї‹зїЌзїђзї‘зї‡зїЏзї‰иЂџ"],
    ["d740","иЂћиЂ›иЃ‡иЃѓиЃ€и„и„Ґи„™и„›и„­и„џи„¬и„ћи„Ўи„•и„§и„ќи„ўи€‘и€ёи€іи€єи€ґи€Іи‰ґиЋђиЋЈиЋЁиЋЌиЌєиЌіиЋ¤иЌґиЋЏиЋЃиЋ•иЋ™иЌµиЋ”иЋ©иЌЅиЋѓиЋЊиЋќиЋ›иЋЄиЋ‹иЌѕиЋҐиЋЇиЋ€иЋ—иЋ°иЌїиЋ¦иЋ‡иЋ®иЌ¶иЋљи™™и™–иљїиљ·"],
    ["d7a1","и›‚и›Ѓи›…иљєиљ°и›€иљ№иљіиљёи›Њиљґиљ»иљји›ѓиљЅиљѕиЎ’иў‰иў•иўЁиўўиўЄиўљиў‘иўЎиўџиўиў§иў™иў›иў—иў¤иў¬иўЊиў“иўЋи¦‚и§–и§™и§•иЁ°иЁ§иЁ¬иЁћи°№и°»и±њи±ќи±ЅиІҐиµЅиµ»иµ№и¶ји·‚и¶№и¶їи·Ѓи»и»ћи»ќи»њи»—и» и»ЎйЂ¤йЂ‹йЂ‘йЂњйЂЊйЂЎйѓЇйѓЄйѓ°йѓґйѓІйѓійѓ”йѓ«йѓ¬йѓ©й…–й…й…љй…“й…•й‡¬й‡ґй‡±й‡ій‡ёй‡¤й‡№й‡Є"],
    ["d840","й‡«й‡·й‡Ёй‡®й•єй–†й–€й™јй™­й™«й™±й™ЇйљїйќЄй „йЈҐй¦—е‚›е‚•е‚”е‚ће‚‹е‚Је‚ѓе‚Ње‚Ће‚ќеЃЁе‚ње‚’е‚‚е‚‡е…џе‡”еЊ’еЊ‘еЋ¤еЋ§е–‘е–Ёе–Ґе–­е•·е™…е–ўе–“е–€е–Џе–µе–Ѓе–Је–’е–¤е•Ѕе–Ње–¦е•їе–•е–Ўе–ЋењЊе ©е ·"],
    ["d8a1","е ™е ће §е Је ЁеџµеЎ€е Ґе ње ›е іе їе ¶е ®е №е ёе ­е ¬е »еҐЎеЄЇеЄ”еЄџе©єеЄўеЄће©ёеЄ¦е©јеЄҐеЄ¬еЄ•еЄ®еЁ·еЄ„еЄЉеЄ—еЄѓеЄ‹еЄ©е©»е©ЅеЄЊеЄњеЄЏеЄ“еЄќеЇЄеЇЌеЇ‹еЇ”еЇ‘еЇЉеЇЋе°Ње°°еґ·еµѓеµ«еµЃеµ‹еґїеґµеµ‘еµЋеµ•еґіеґєеµ’еґЅеґ±еµ™еµ‚еґ№еµ‰еґёеґјеґІеґ¶еµЂеµ…е№„е№ЃеЅеѕ¦еѕҐеѕ«жѓ‰ж‚№жѓЊжѓўжѓЋжѓ„ж„”"],
    ["d940","жѓІж„Љж„–ж„…жѓµж„“жѓёжѓјжѓѕжѓЃж„ѓж„ж„ќж„ђжѓїж„„ж„‹ж‰ЉжЋ”жЋ±жЋ°жЏЋжЏҐжЏЁжЏЇжЏѓж’ќжЏіжЏЉжЏ жЏ¶жЏ•жЏІжЏµж‘ЎжЏџжЋѕжЏќжЏњжЏ„жЏжЏ“жЏ‚жЏ‡жЏЊжЏ‹жЏ€жЏ°жЏ—жЏ™ж”Іж•§ж•Єж•¤ж•њж•Ёж•Ґж–Њж–ќж–ћж–®ж—ђж—’"],
    ["d9a1","ж™јж™¬ж™»жљЂж™±ж™№ж™Єж™ІжњЃж¤ЊжЈ“ж¤„жЈњж¤ЄжЈ¬жЈЄжЈ±ж¤ЏжЈ–жЈ·жЈ«жЈ¤жЈ¶ж¤“ж¤ђжЈіжЈЎж¤‡жЈЊж¤€жҐ°жўґж¤‘жЈЇжЈ†ж¤”жЈёжЈђжЈЅжЈјжЈЁж¤‹ж¤Љж¤—жЈЋжЈ€жЈќжЈћжЈ¦жЈґжЈ‘ж¤†жЈ”жЈ©ж¤•ж¤ҐжЈ‡ж¬№ж¬»ж¬їж¬јж®”ж®—ж®™ж®•ж®ЅжЇ°жЇІжЇіж°°ж·јж№†ж№‡жёџж№‰жє€жёјжёЅж№…ж№ўжё«жёїж№Ѓж№ќж№іжёњжёіж№‹ж№Ђж№‘жё»жёѓжё®ж№ћ"],
    ["da40","ж№Ёж№њж№Ўжё±жёЁж№ ж№±ж№«жё№жёўжё°ж№“ж№Ґжё§ж№ёж№¤ж№·ж№•ж№№ж№’ж№¦жёµжё¶ж№љз„ з„ћз„Їзѓ»з„®з„±з„Јз„Ґз„ўз„Із„џз„Ёз„єз„›з‰‹з‰љзЉ€зЉ‰зЉ†зЉ…зЉ‹зЊ’зЊ‹зЊ°зЊўзЊ±зЊізЊ§зЊІзЊ­зЊ¦зЊЈзЊµзЊЊзђ®зђ¬зђ°зђ«зђ–"],
    ["daa1","зђљзђЎзђ­зђ±зђ¤зђЈзђќзђ©зђ зђІз“»з”Їз•Їз•¬з—§з—љз—Ўз—¦з—ќз—џз—¤з——зљ•зљ’з›љзќ†зќ‡зќ„зќЌзќ…зќЉзќЋзќ‹зќЊзџћзџ¬зЎ зЎ¤зЎҐзЎњзЎ­зЎ±зЎЄзЎ®зЎ°зЎ©зЎЁзЎћзЎўзҐґзҐізҐІзҐ°зЁ‚зЁЉзЁѓзЁЊзЁ„зЄ™з«¦з«¤з­Љз¬»з­„з­€з­Њз­Ћз­Ђз­з­…зІўзІћзІЁзІЎзµзµЇзµЈзµ“зµ–зµ§зµЄзµЏзµ­зµњзµ«зµ’зµ”зµ©зµ‘зµџзµЋзјѕзјїзЅҐ"],
    ["db40","зЅ¦зѕўзѕ зѕЎзї—иЃ‘иЃЏиЃђиѓѕиѓ”и…ѓи…Љи…’и…Џи…‡и„Ѕи…Ќи„єи‡¦и‡®и‡·и‡ёи‡№и€„и€ји€Ѕи€їи‰µиЊ»иЏЏиЏ№иђЈиЏЂиЏЁиђ’иЏ§иЏ¤иЏјиЏ¶иђђиЏ†иЏ€иЏ«иЏЈиЋїиђЃиЏќиЏҐиЏиЏїиЏЎиЏ‹иЏЋиЏ–иЏµиЏ‰иђ‰иђЏиЏћиђ‘иђ†иЏ‚иЏі"],
    ["dba1","иЏ•иЏєиЏ‡иЏ‘иЏЄиђ“иЏѓиЏ¬иЏ®иЏ„иЏ»иЏ—иЏўиђ›иЏ›иЏѕи›и›ўи›¦и›“и›Ји›љи›Єи›ќи›«и›њи›¬и›©и›—и›Ёи›‘иЎ€иЎ–иЎ•иўєиЈ—иў№иўёиЈЂиўѕиў¶иўјиў·иўЅиўІи¤ЃиЈ‰и¦•и¦и¦—и§ќи§љи§›и©Ћи©ЌиЁ№и©™и©Ђи©—и©и©„и©…и©’и©€и©‘и©Љи©Њи©Џи±џиІЃиІЂиІєиІѕиІ°иІ№иІµи¶„и¶Ђи¶‰и·и·“и·Ќи·‡и·–и·њи·Џи·•и·™и·€и·—и·…и»Їи»·и»є"],
    ["dc40","и»№и»¦и»®и»Ґи»µи»§и»Ёи»¶и»«и»±и»¬и»ґи»©йЂ­йЂґйЂЇй„†й„¬й„„йѓїйѓјй„€йѓ№йѓ»й„Ѓй„Ђй„‡й„…й„ѓй…Ўй…¤й…џй…ўй… й€Ѓй€Љй€Ґй€ѓй€љй€¦й€Џй€Њй€Ђй€’й‡їй‡Ѕй€†й€„й€§й€‚й€њй€¤й€™й€—й€…й€–й•»й–Ќй–Њй–ђйљ‡й™ѕйљ€"],
    ["dca1","йљ‰йљѓйљЂй›‚й›€й›ѓй›±й›°йќ¬йќ°йќ®й ‡йў©йЈ«йі¦й»№дєѓдє„дє¶е‚Ѕе‚їеѓ†е‚®еѓ„еѓЉе‚ґеѓ€еѓ‚е‚°еѓЃе‚єе‚±еѓ‹еѓ‰е‚¶е‚ёе‡—е‰єе‰ёе‰»е‰је—ѓе—›е—Ње—ђе—‹е—Ље—ќе—Ђе—”е—„е—©е–їе—’е–Ќе—Џе—•е—ўе—–е—€е—Іе—Ќе—™е—‚ењ”еЎ“еЎЁеЎ¤еЎЏеЎЌеЎ‰еЎЇеЎ•еЎЋеЎќеЎ™еЎҐеЎ›е ЅеЎЈеЎ±еЈје«‡е«„е«‹еЄєеЄёеЄ±еЄµеЄ°еЄїе«€еЄ»е«†"],
    ["dd40","еЄ·е«Ђе«ЉеЄґеЄ¶е«ЌеЄ№еЄђеЇ–еЇеЇ™е°џе°іеµ±еµЈеµЉеµҐеµІеµ¬еµћеµЁеµ§еµўе·°е№Џе№Ће№Ље№Ќе№‹е»…е»Ње»†е»‹е»‡еЅЂеѕЇеѕ­жѓ·ж…‰ж…Љж„«ж……ж„¶ж„Іж„®ж…†ж„Їж…Џж„©ж…Ђж€ й…Ёж€Јж€Ґж€¤жЏ…жЏ±жЏ«жђђжђ’жђ‰жђ жђ¤"],
    ["dda1","жђіж‘ѓжђџжђ•жђжђ№жђ·жђўжђЈжђЊжђ¦жђ°жђЁж‘ЃжђµжђЇжђЉжђљж‘ЂжђҐжђ§жђ‹жЏ§жђ›жђ®жђЎжђЋж•Їж–’ж—“жљ†жљЊжљ•жљђжљ‹жљЉжљ™жљ”ж™ёжњ жҐ¦жҐџж¤ёжҐЋжҐўжҐ±ж¤їжҐ…жҐЄж¤№жҐ‚жҐ—жҐ™жҐєжҐ€жҐ‰ж¤µжҐ¬ж¤іж¤ЅжҐҐжЈ°жҐёж¤ґжҐ©жҐЂжҐЇжҐ„жҐ¶жҐжҐЃжҐґжҐЊж¤»жҐ‹ж¤·жҐњжҐЏжҐ‘ж¤ІжҐ’ж¤ЇжҐ»ж¤јж­†ж­…ж­ѓж­‚ж­€ж­Ѓж®›пЁЌжЇ»жЇј"],
    ["de40","жЇ№жЇ·жЇёжє›ж»–ж»€жєЏж»Ђжєџжє“жє”жє жє±жє№ж»†ж»’жєЅж»Ѓжєћж»‰жє·жє°ж»Ќжє¦ж»ЏжєІжєѕж»ѓж»њж»жє™жє’жєЋжєЌжє¤жєЎжєїжєіж»ђж»Љжє—жє®жєЈз…‡з…”з…’з…Јз… з…Ѓз…ќз…ўз…Із…ёз…Єз…Ўз…‚з…з…ѓз…‹з…°з…џз…ђз…“"],
    ["dea1","з…„з…Ќз…љз‰ЏзЉЌзЉЊзЉ‘зЉђзЉЋзЊјзЌ‚зЊ»зЊєзЌЂзЌЉзЌ‰з‘„з‘Љз‘‹з‘’з‘‘з‘—з‘Ђз‘Џз‘ђз‘Ћз‘‚з‘†з‘Ќз‘”з“Ўз“їз“ѕз“Ѕз”ќз•№з•·ж¦ѓз—ЇзЏзѓз—·з—ѕз—јз—№з—ёзђз—»з—¶з—­з—µз—Ѕзљ™зљµз›ќзќ•зќџзќ зќ’зќ–зќљзќ©зќ§зќ”зќ™зќ­зџ зў‡зўљзў”зўЏзў„зў•зў…зў†зўЎзўѓзЎ№зў™зўЂзў–зЎ»зҐјз¦‚зҐЅзҐ№зЁ‘зЁзЁ™зЁ’зЁ—зЁ•зЁўзЁ“"],
    ["df40","зЁ›зЁђзЄЈзЄўзЄћз««з­¦з­¤з­­з­ґз­©з­Із­Ґз­із­±з­°з­Ўз­ёз­¶з­ЈзІІзІґзІЇз¶€з¶†з¶Ђз¶Ќзµїз¶…зµєз¶Ћзµ»з¶ѓзµјз¶Њз¶”з¶„зµЅз¶’зЅ­зЅ«зЅ§зЅЁзЅ¬зѕ¦зѕҐзѕ§зї›зїњиЂЎи…¤и… и…·и…њи…©и…›и…ўи…ІжњЎи…ћи…¶и…§и…Ї"],
    ["dfa1","и…„и…Ўи€ќи‰‰и‰„и‰Ђи‰‚и‰…и“±иђїи‘–и‘¶и‘№и’Џи’Ќи‘Ґи‘‘и‘Ђи’†и‘§иђ°и‘Ќи‘Ѕи‘љи‘™и‘ґи‘іи‘ќи”‡и‘ћиђ·иђєиђґи‘єи‘ѓи‘ёиђІи‘…иђ©иЏ™и‘‹иђЇи‘‚иђ­и‘џи‘°иђ№и‘Ћи‘Њи‘’и‘Їи“…и’Ћиђ»и‘‡иђ¶иђіи‘Ёи‘ѕи‘„иђ«и‘ и‘”и‘®и‘ђињ‹ињ„и›·ињЊи›єи›–и›µиќЌи›ёињЋињ‰ињЃи›¶ињЌињ…иЈ–иЈ‹иЈЌиЈЋиЈћиЈ›иЈљиЈЊиЈђи¦…и¦›и§џи§Ґи§¤"],
    ["e040","и§Ўи§ и§ўи§њи§¦и©¶иЄ†и©їи©ЎиЁїи©·иЄ‚иЄ„и©µиЄѓиЄЃи©ґи©єи°ји±‹и±Љи±Ґи±¤и±¦иІ†иІ„иІ…иіЊиµЁиµ©и¶‘и¶Њи¶Ћи¶Џи¶Ќи¶“и¶”и¶ђи¶’и·°и· и·¬и·±и·®и·ђи·©и·Ји·ўи·§и·Іи·«и·ґиј†и»їијЃијЂиј…иј‡иј€иј‚иј‹йЃ’йЂї"],
    ["e0a1","йЃ„йЃ‰йЂЅй„ђй„Ќй„Џй„‘й„–й„”й„‹й„Ћй…®й…Їй‰€й‰’й€°й€єй‰¦й€ій‰Ґй‰ћйЉѓй€®й‰Љй‰†й‰­й‰¬й‰Џй‰ й‰§й‰Їй€¶й‰Ўй‰°й€±й‰”й‰Јй‰ђй‰Ій‰Ћй‰“й‰Њй‰–й€Ій–џй–њй–ћй–›йљ’йљ“йљ‘йљ—й›Ћй›єй›Ѕй›ёй›µйќійќ·йќёйќІй Џй Ќй Ћйў¬йЈ¶йЈ№й¦Їй¦Ій¦°й¦µйЄ­йЄ«й­›йіЄйі­йі§йєЂй»Ѕеѓ¦еѓ”еѓ—еѓЁеѓіеѓ›еѓЄеѓќеѓ¤еѓ“еѓ¬еѓ°еѓЇеѓЈеѓ "],
    ["e140","е‡еЉЂеЉЃе‹©е‹«еЊ°еЋ¬е§е•еЊе’е—јеЏењеЃе“е‚е—єеќе„е—їе—№еў‰еЎјеўђеўеў†еўЃеЎїеЎґеў‹еЎєеў‡еў‘еўЋеЎ¶еў‚еў€еЎ»еў”еўЏеЈѕеҐ«е«ње«®е«Ґе«•е«Єе«ље«­е««е«іе«ўе« е«›е«¬е«ће«ќе«™е«Ёе«џе­·еЇ "],
    ["e1a1","еЇЈе±Је¶‚е¶ЂеµЅе¶†еµєе¶Ѓеµ·е¶Ље¶‰е¶€еµѕеµје¶Ќеµ№еµїе№е№™е№“е»е»‘е»—е»Ће»ње»•е»™е»’е»”еЅ„еЅѓеЅЇеѕ¶ж„¬ж„Ёж…Ѓж…ћж…±ж…іж…’ж…“ж…Іж…¬ж†Ђж…ґж…”ж…єж…›ж…Ґж„»ж…Єж…Ўж…–ж€©ж€§ж€«жђ«ж‘Ќж‘›ж‘ќж‘ґж‘¶ж‘Іж‘іж‘Ѕж‘µж‘¦ж’¦ж‘Ћж’‚ж‘ћж‘њж‘‹ж‘“ж‘ ж‘ђж‘їжђїж‘¬ж‘«ж‘™ж‘Ґж‘·ж•іж– жљЎжљ жљџжњ…жњ„жњўж¦±ж¦¶ж§‰"],
    ["e240","ж¦ ж§Ћж¦–ж¦°ж¦¬ж¦јж¦‘ж¦™ж¦Ћж¦§ж¦Ќж¦©ж¦ѕж¦Їж¦їж§„ж¦Ѕж¦¤ж§”ж¦№ж§Љж¦љж§Џж¦іж¦“ж¦Єж¦Ўж¦ћж§™ж¦—ж¦ђж§‚ж¦µж¦Ґж§†ж­Љж­Ќж­‹ж®ћж®џж® жЇѓжЇ„жЇѕж»Ћж»µж»±жјѓжјҐж»ёжј·ж»»жј®жј‰жЅЋжј™жјљжј§жјжј»жј’ж»­жјЉ"],
    ["e2a1","жј¶жЅіж»№ж»®жј­жЅЂжј°жјјжјµж»«жј‡жјЋжЅѓжј…ж»Ѕж»¶жј№жјњж»јжјєжјџжјЌжјћжј€жјЎз†‡з†ђз†‰з†Ђз†…з†‚з†Џз…»з††з†Ѓз†—з‰„з‰“зЉ—зЉ•зЉ“зЌѓзЌЌзЌ‘зЌЊз‘ўз‘із‘±з‘µз‘Із‘§з‘®з”Ђз”‚з”ѓз•Ѕз–ђз–з€зЊз•з‘зЉз”зљёзћЃзќјзћ…зћ‚зќ®зћЂзќЇзќѕзћѓзўІзўЄзўґзў­зўЁзЎѕзў«зўћзўҐзў зў¬зўўзў¤з¦з¦Љз¦‹з¦–з¦•з¦”з¦“"],
    ["e340","з¦—з¦€з¦’з¦ђзЁ«з©ЉзЁ°зЁЇзЁЁзЁ¦зЄЁзЄ«зЄ¬з«®з®€з®њз®Љз®‘з®ђз®–з®Ќз®Њз®›з®Ћз®…з®еЉ„з®™з®¤з®‚зІ»зІїзІјзІєз¶§з¶·з·‚з¶Јз¶Єз·Ѓз·Ђз·…з¶ќз·Ћз·„з·†з·‹з·Њз¶Їз¶№з¶–з¶јз¶џз¶¦з¶®з¶©з¶Ўз·‰зЅізїўзїЈзїҐзїћ"],
    ["e3a1","иЂ¤иЃќиЃњи†‰и††и†ѓи†‡и†Ќи†Њи†‹и€•и’—и’¤и’Ўи’џи’єи“Ћи“‚и’¬и’®и’«и’№и’ґи“Ѓи“Ќи’Єи’љи’±и“ђи’ќи’§и’»и’ўи’”и“‡и“Њи’›и’©и’Їи’Ёи“–и’и’¶и“Џи’ и“—и“”и“’и“›и’°и’‘и™ЎињіињЈињЁиќ«иќЂињ®ињћињЎињ™ињ›иќѓињ¬иќЃињѕиќ†ињ ињІињЄињ­ињјињ’ињєињ±ињµиќ‚ињ¦ињ§ињёињ¤ињљињ°ињ‘иЈ·иЈ§иЈ±иЈІиЈєиЈѕиЈ®иЈјиЈ¶иЈ»"],
    ["e440","иЈ°иЈ¬иЈ«и¦ќи¦Ўи¦џи¦ћи§©и§«и§ЁиЄ«иЄ™иЄ‹иЄ’иЄЏиЄ–и°Ѕи±Ёи±©иі•иіЏиі—и¶–иё‰иё‚и·їиёЌи·ЅиёЉиёѓиё‡иё†иё…и·ѕиёЂиё„ијђиј‘ијЋијЌй„Јй„њй„ й„ўй„џй„ќй„љй„¤й„Ўй„›й…єй…Ій…№й…ійЉҐйЉ¤й‰¶йЉ›й‰єйЉ йЉ”йЉЄйЉЌ"],
    ["e4a1","йЉ¦йЉљйЉ«й‰№йЉ—й‰їйЉЈй‹®йЉЋйЉ‚йЉ•йЉўй‰ЅйЉ€йЉЎйЉЉйЉ†йЉЊйЉ™йЉ§й‰ѕйЉ‡йЉ©йЉќйЉ‹й€­йљћйљЎй›їйќйќЅйќєйќѕйћѓйћЂйћ‚йќ»йћ„йћЃйќїйџЋйџЌй –йў­йў®й¤‚й¤Ђй¤‡й¦ќй¦њй§ѓй¦№й¦»й¦єй§‚й¦Ѕй§‡йЄ±й«Јй«§й¬ѕй¬їй­ й­Ўй­џйі±йіІйіµйє§еѓїе„ѓе„°еѓёе„†е„‡еѓ¶еѓѕе„‹е„ЊеѓЅе„ЉеЉ‹еЉЊе‹±е‹Їе™€е™‚е™Њеµе™Ѓе™Ље™‰е™†е™"],
    ["e540","е™ље™ЂеіеЅе¬еѕеёеЄеєењљеў«еўќеў±еў еўЈеўЇеў¬еўҐеўЎеЈїе«їе«ґе«Ѕе«·е«¶е¬ѓе«ёе¬‚е«№е¬Ѓе¬‡е¬…е¬Џе±§е¶™е¶—е¶џе¶’е¶ўе¶“е¶•е¶ е¶ње¶Ўе¶ље¶ће№©е№ќе№ е№њз·іе»›е»ће»ЎеЅ‰еѕІж†‹ж†ѓж…№ж†±ж†°ж†ўж†‰"],
    ["e5a1","ж†›ж†“ж†Їж†­ж†џж†’ж†Єж†Ўж†Ќж…¦ж†іж€­ж‘®ж‘°ж’–ж’ ж’…ж’—ж’њж’Џж’‹ж’Љж’Њж’Јж’џж‘Ёж’±ж’ж•¶ж•єж•№ж•»ж–Іж–іжљµжљ°жљ©жљІжљ·жљЄжљЇжЁЂжЁ†жЁ—ж§Ґж§ёжЁ•ж§±ж§¤жЁ ж§їж§¬ж§ўжЁ›жЁќж§ѕжЁ§ж§Іж§®жЁ”ж§·ж§§ж©ЂжЁ€ж§¦ж§»жЁЌж§јж§«жЁ‰жЁ„жЁжЁҐжЁЏж§¶жЁ¦жЁ‡ж§ґжЁ–ж­‘ж®Ґж®Јж®ўж®¦ж°Ѓж°ЂжЇїж°‚жЅЃжј¦жЅѕжѕ‡жї†жѕ’"],
    ["e640","жѕЌжѕ‰жѕЊжЅўжЅЏжѕ…жЅљжѕ–жЅ¶жЅ¬жѕ‚жЅ•жЅІжЅ’жЅђжЅ—жѕ”жѕ“жЅќжјЂжЅЎжЅ«жЅЅжЅ§жѕђжЅ“жѕ‹жЅ©жЅїжѕ•жЅЈжЅ·жЅЄжЅ»з†Із†Їз†›з†°з† з†љз†©з†µз†ќз†Ґз†ћз†¤з†Ўз†Єз†њз†§з†ізЉзЉљзЌзЌ’зЌћзЌџзЌ зЌќзЌ›зЌЎзЌљзЌ™"],
    ["e6a1","зЌўз’‡з’‰з’Љз’†з’Ѓз‘Ѕз’…з’€з‘јз‘№з”€з”‡з•ѕзҐзћз™зќзњзЈзљзЁз›зљњзљќзљћзљ›зћЌзћЏзћ‰зћ€зЈЌзў»зЈЏзЈЊзЈ‘зЈЋзЈ”зЈ€зЈѓзЈ„зЈ‰з¦љз¦Ўз¦ з¦њз¦ўз¦›ж­¶зЁ№зЄІзЄґзЄіз®·зЇ‹з®ѕз®¬зЇЋз®Їз®№зЇЉз®µзі…зі€зіЊзі‹з··з·›з·Єз·§з·—з·Ўзёѓз·єз·¦з·¶з·±з·°з·®з·џзЅ¶зѕ¬зѕ°зѕ­зї­зї«зїЄзї¬зї¦зїЁиЃ¤иЃ§и†Ји†џ"],
    ["e740","и†ћи†•и†ўи†™и†—и€–и‰Џи‰“и‰’и‰ђи‰Ћи‰‘и”¤и”»и”Џи”Ђи”©и”Ћи”‰и”Ќи”џи”Љи”§и”њи“»и”«и“єи”€и”Њи“ґи”Єи“Іи”•и“·и“«и“іи“ји”’и“Єи“©и”–и“ѕи”Ёи”ќи”®и”‚и“Ѕи”ћи“¶и”±и”¦и“§и“Ёи“°и“Їи“№и”и” и”°и”‹и”™и”Їи™ў"],
    ["e7a1","иќ–иќЈиќ¤иќ·иџЎиќіиќиќ”иќ›иќ’иќЎиќљиќ‘иќћиќ­иќЄиќђиќЋиќџиќќиќЇиќ¬иќєиќ®иќњиќҐиќЏиќ»иќµиќўиќ§иќ©иЎљи¤…и¤Њи¤”и¤‹и¤—и¤и¤™и¤†и¤–и¤‘и¤Ћи¤‰и¦ўи¦¤и¦Ји§­и§°и§¬и«Џи«†иЄёи«“и«‘и«”и«•иЄ»и«—иЄѕи«Ђи«…и«и«ѓиЄєиЄЅи«™и°ѕи±ЌиІЏиіҐиіџиі™иіЁиіљиіќиі§и¶ и¶њи¶Ўи¶›иё иёЈиёҐиё¤иё®иё•иё›иё–иё‘иё™иё¦иё§"],
    ["e840","иё”иё’иёиё“иёњиё—иёљиј¬иј¤ијијљиј ијЈиј–иј—йЃійЃ°йЃЇйЃ§йЃ«й„Їй„«й„©й„Єй„Ій„¦й„®й†…й††й†Љй†Ѓй†‚й†„й†Ђй‹ђй‹ѓй‹„й‹Ђй‹™йЉ¶й‹Џй‹±й‹џй‹й‹©й‹—й‹ќй‹Њй‹Їй‹‚й‹Ёй‹Љй‹€й‹Ћй‹¦й‹Ќй‹•й‹‰й‹ й‹ћй‹§й‹‘й‹“"],
    ["e8a1","йЉµй‹Ўй‹†йЉґй•јй–¬й–«й–®й–°йљ¤йљўй›“йњ…йњ€йњ‚йќљйћЉйћЋйћ€йџђйџЏй ћй ќй ¦й ©й Ёй  й ›й §йўІй¤€йЈєй¤‘й¤”й¤–й¤—й¤•й§њй§Ќй§Џй§“й§”й§Ћй§‰й§–й§й§‹й§—й§ЊйЄій«¬й««й«ій«Ій«±й­†й­ѓй­§й­ґй­±й­¦й­¶й­µй­°й­Ёй­¤й­¬йіјйієйіЅйіїйі·йґ‡йґЂйі№йі»йґ€йґ…йґ„йєѓй»“йјЏйјђе„ње„“е„—е„ље„‘е‡ћеЊґеЏЎе™°е™ е™®"],
    ["e940","е™іе™¦е™Је™­е™Іе™ће™·ењњењ›еЈ€еўЅеЈ‰еўїеўєеЈ‚еўјеЈ†е¬—е¬™е¬›е¬Ўе¬”е¬“е¬ђе¬–е¬Ёе¬ље¬ е¬ћеЇЇе¶¬е¶±е¶©е¶§е¶µе¶°е¶®е¶Єе¶Ёе¶Іе¶­е¶Їе¶ґе№§е№Ёе№¦е№Їе»©е»§е»¦е»Ёе»ҐеЅ‹еѕјж†ќж†Ёж†–ж‡…ж†ґж‡†ж‡Ѓж‡Њж†є"],
    ["e9a1","ж†їж†ёж†Њж“—ж“–ж“ђж“Џж“‰ж’Ѕж’‰ж“ѓж“›ж“іж“™ж”іж•їж•јж–ўж›€жљѕж›Ђж›Љж›‹ж›ЏжљЅжљ»жљєж›ЊжњЈжЁґж©¦ж©‰ж©§жЁІж©ЁжЁѕж©ќж©­ж©¶ж©›ж©‘жЁЁж©љжЁ»жЁїж©Ѓж©Єж©¤ж©ђж©Џж©”ж©Їж©©ж© жЁјж©ћж©–ж©•ж©Ќж©Ћж©†ж­•ж­”ж­–ж®§ж®Єж®«жЇ€жЇ‡ж°„ж°ѓж°†жѕ­жї‹жѕЈжї‡жѕјжїЋжї€жЅћжї„жѕЅжѕћжїЉжѕЁзЂ„жѕҐжѕ®жѕєжѕ¬жѕЄжїЏжѕїжѕё"],
    ["ea40","жѕўжї‰жѕ«жїЌжѕЇжѕІжѕ°з‡…з‡‚з†їз†ёз‡–з‡Ђз‡Ѓз‡‹з‡”з‡Љз‡‡з‡Џз†Ѕз‡з†јз‡†з‡љз‡›зЉќзЉћзЌ©зЌ¦зЌ§зЌ¬зЌҐзЌ«зЌЄз‘їз’љз’ з’”з’’з’•з’Ўз”‹з–ЂзЇз­з±зЅзізјзµзІз°зљ»з›¦зћљзћќзћЎзћњзћ›зћўзћЈзћ•зћ™"],
    ["eaa1","зћ—зЈќзЈ©зЈҐзЈЄзЈћзЈЈзЈ›зЈЎзЈўзЈ­зЈџзЈ з¦¤з©„з©€з©‡зЄ¶зЄёзЄµзЄ±зЄ·зЇћзЇЈзЇ§зЇќзЇ•зЇҐзЇљзЇЁзЇ№зЇ”зЇЄзЇўзЇњзЇ«зЇзЇџзі’зі”зі—зіђзі‘зё’зёЎзё—зёЊзёџзё зё“зёЋзёњзё•зёљзёўзё‹зёЏзё–зёЌзё”зёҐзё¤зЅѓзЅ»зЅјзЅєзѕ±зїЇиЂЄиЂ©иЃ¬и†±и†¦и†®и†№и†µи†«и†°и†¬и†ґи†Іи†·и†§и‡Іи‰•и‰–и‰—и•–и•…и•«и•Ќи•“и•Ўи•"],
    ["eb40","и•Ђи•†и•¤и•Ѓи•ўи•„и•‘и•‡и•Ји”ѕи•›и•±и•Ћи•®и•µи••и•§и• и–Њи•¦и•ќи•”и•Ґи•¬и™Ји™Ґи™¤ић›ићЏић—ић“ић’ић€ићЃић–ићиќ№ић‡ићЈић…ићђић‘ићќић„ић”ићњићљић‰и¤ћи¤¦и¤°и¤­и¤®и¤§и¤±и¤ўи¤©и¤Ји¤Їи¤¬и¤џи§±и« "],
    ["eba1","и«ўи«Іи«ґи«µи«ќи¬”и«¤и«џи«°и«€и«ћи«Ўи«Ёи«їи«Їи«»иІ‘иІ’иІђиіµиі®иі±иі°иііиµ¬иµ®и¶Ґи¶§иёіиёѕиёёи№Ђи№…иё¶иёјиёЅи№Ѓиё°иёїиєЅиј¶иј®ијµијІиј№иј·ијґйЃ¶йЃ№йЃ»й‚†йѓєй„ій„µй„¶й†“й†ђй†‘й†Ќй†ЏйЊ§йЊћйЊ€йЊџйЊ†йЊЏйЌєйЊёйЊјйЊ›йЊЈйЊ’йЊЃйЌ†йЊ­йЊЋйЊЌй‹‹йЊќй‹єйЊҐйЊ“й‹№й‹·йЊґйЊ‚йЊ¤й‹їйЊ©йЊ№йЊµйЊЄйЊ”йЊЊ"],
    ["ec40","йЊ‹й‹ѕйЊ‰йЊЂй‹»йЊ–й–јй—Ќй–ѕй–№й–єй–¶й–їй–µй–Ѕйљ©й›”йњ‹йњ’йњђйћ™йћ—йћ”йџ°йџёй µй Їй Ій¤¤й¤џй¤§й¤©й¦ћй§®й§¬й§Ґй§¤й§°й§Јй§Єй§©й§§йЄ№йЄїйЄґйЄ»й«¶й«єй«№й«·й¬ій®Ђй®…й®‡й­јй­ѕй­»й®‚й®“й®’й®ђй­єй®•"],
    ["eca1","й­Ѕй®€йґҐйґ—йґ йґћйґ”йґ©йґќйґйґўйґђйґ™йґџйє€йє†йє‡йє®йє­й»•й»–й»єйј’йјЅе„¦е„Ґе„ўе„¤е„ е„©е‹ґељ“ељЊељЌељ†ељ„ељѓе™ѕељ‚е™їељЃеЈ–еЈ”еЈЏеЈ’е¬­е¬Ґе¬Іе¬Је¬¬е¬§е¬¦е¬Їе¬®е­»еЇ±еЇІе¶·е№¬е№Єеѕѕеѕ»ж‡ѓж†µж†јж‡§ж‡ ж‡Ґж‡¤ж‡Ёж‡ћж“Їж“©ж“Јж“«ж“¤ж“Ёж–Ѓж–Ђж–¶ж—љж›’жЄЌжЄ–жЄЃжЄҐжЄ‰жЄџжЄ›жЄЎжЄћжЄ‡жЄ“жЄЋ"],
    ["ed40","жЄ•жЄѓжЄЁжЄ¤жЄ‘ж©їжЄ¦жЄљжЄ…жЄЊжЄ’ж­›ж®­ж°‰жїЊжѕ©жїґжї”жїЈжїњжї­жї§жї¦жїћжїІжїќжїўжїЁз‡Ўз‡±з‡Ёз‡Із‡¤з‡°з‡ўзЌізЌ®зЌЇз’—з’Із’«з’ђз’Єз’­з’±з’Ґз’Їз”ђз”‘з”’з”Џз–„з™ѓз™€з™‰з™‡зљ¤з›©зћµзћ«зћІзћ·зћ¶"],
    ["eda1","зћґзћ±зћЁзџ°зЈізЈЅз¤‚зЈ»зЈјзЈІз¤…зЈ№зЈѕз¤„з¦«з¦Ёз©њз©›з©–з©з©”з©љзЄѕз«Ђз«Ѓз°…з°ЏзЇІз°ЂзЇїзЇ»з°ЋзЇґз°‹зЇіз°‚з°‰з°ѓз°ЃзЇёзЇЅз°†зЇ°зЇ±з°ђз°ЉзіЁзё­зёјз№‚зёійЎ€зёёзёЄз№‰з№Ђз№‡зё©з№Њзё°зё»зё¶з№„зёєзЅ…зЅїзЅѕзЅЅзїґзїІиЂ¬и†»и‡„и‡Њи‡Љи‡…и‡‡и†ји‡©и‰›и‰љи‰њи–ѓи–Ђи–Џи–§и–•и– и–‹и–Ји•»и–¤и–љи–ћ"],
    ["ee40","и•·и•ји–‰и–Ўи•єи•ёи•—и–Ћи––и–†и–Ќи–™и–ќи–Ѓи–ўи–‚и–€и–…и•№и•¶и–и–ђи–џи™ЁићѕићЄић­иџ…ић°ић¬ић№ићµићјић®иџ‰иџѓиџ‚иџЊић·ићЇиџ„иџЉићґић¶ићїићёићЅиџћићІи¤µи¤іи¤ји¤ѕиҐЃиҐ’и¤·иҐ‚и¦­и¦Їи¦®и§Іи§іи¬ћ"],
    ["eea1","и¬и¬–и¬‘и¬…и¬‹и¬ўи¬Џи¬’и¬•и¬‡и¬Ќи¬€и¬†и¬њи¬“и¬љи±Џи±°и±Іи±±и±ЇиІ•иІ”иі№иµЇи№Ћи№Ќи№“и№ђи№Њи№‡иЅѓиЅЂй‚…йЃѕй„ёй†љй†ўй†›й†™й†џй†Ўй†ќй† йЋЎйЋѓйЋЇйЌ¤йЌ–йЌ‡йЌјйЌйЌњйЌ¶йЌ‰йЌђйЌ‘йЌ йЌ­йЋЏйЌЊйЌЄйЌ№йЌ—йЌ•йЌ’йЌЏйЌ±йЌ·йЌ»йЌЎйЌћйЌЈйЌ§йЋЂйЌЋйЌ™й—‡й—Ђй—‰й—ѓй—…й–·йљ®йљ°йљ¬йњ йњџйњйњќйњ™йћљйћЎйћњ"],
    ["ef40","йћћйћќйџ•йџ”йџ±йЎЃйЎ„йЎЉйЎ‰йЎ…йЎѓй¤Ґй¤«й¤¬й¤Єй¤ій¤Ій¤Їй¤­й¤±й¤°й¦й¦Јй¦ЎйЁ‚й§єй§ґй§·й§№й§ёй§¶й§»й§Ѕй§ѕй§јйЁѓйЄѕй«ѕй«Ѕй¬Ѓй«јй­€й®љй®Ёй®ћй®›й®¦й®Ўй®Ґй®¤й®†й®ўй® й®ЇйґійµЃйµ§йґ¶йґ®йґЇйґ±йґёйґ°"],
    ["efa1","йµ…йµ‚йµѓйґѕйґ·йµЂйґЅзїµйґ­йєЉйє‰йєЌйє°й»€й»љй»»й»їйј¤йјЈйјўйЅ”йѕ е„±е„­е„®ељељњељ—ељљељќељ™еҐ°е¬је±©е±Єе·Ђе№­е№®ж‡ж‡џж‡­ж‡®ж‡±ж‡Єж‡°ж‡«ж‡–ж‡©ж“їж”„ж“Ѕж“ёж”Ѓж”ѓж“јж–”ж—›ж›љж››ж›ж«…жЄ№жЄЅж«Ўж«†жЄєжЄ¶жЄ·ж«‡жЄґжЄ­ж­ћжЇ‰ж°‹зЂ‡зЂЊзЂЌзЂЃзЂ…зЂ”зЂЋжїїзЂЂжї»зЂ¦жїјжї·зЂЉз€Ѓз‡їз‡№з€ѓз‡ЅзЌ¶"],
    ["f040","з’ёз“Ђз’µз“Ѓз’ѕз’¶з’»з“‚з””з”“з™њз™¤з™™з™ђз™“з™—з™љзљ¦зљЅз›¬зџ‚зћєзЈїз¤Њз¤“з¤”з¤‰з¤ђз¤’з¤‘з¦­з¦¬з©џз°њз°©з°™з° з°џз°­з°ќз°¦з°Ёз°ўз°Ґз°°з№њз№ђз№–з№Јз№з№ўз№џз№‘з№ з№—з№“зѕµзѕізї·зїёиЃµи‡‘и‡’"],
    ["f0a1","и‡ђи‰џи‰ћи–ґи—†и—Ђи—ѓи—‚и–іи–µи–Ѕи—‡и—„и–їи—‹и—Ћи—€и—…и–±и–¶и—’и¤и–ёи–·и–ѕи™©иџ§иџ¦иџўиџ›иџ«иџЄиџҐиџџиџіиџ¤иџ”иџњиџ“иџ­иџиџЈић¤иџ—иџ™и ЃиџґиџЁиџќиҐ“иҐ‹иҐЏиҐЊиҐ†иҐђиҐ‘иҐ‰и¬Єи¬§и¬Ји¬іи¬°и¬µи­‡и¬Їи¬ји¬ѕи¬±и¬Ґи¬·и¬¦и¬¶и¬®и¬¤и¬»и¬Ѕи¬єи±‚и±µиІ™иІиІ—иіѕиґ„иґ‚иґЂи№њи№ўи№ и№—и№–и№ћи№Ґи№§"],
    ["f140","и№›и№љи№Ўи№ќи№©и№”иЅ†иЅ‡иЅ€иЅ‹й„Ёй„єй„»й„ѕй†Ёй†Ґй†§й†Їй†ЄйЋµйЋЊйЋ’йЋ·йЋ›йЋќйЋ‰йЋ§йЋЋйЋЄйЋћйЋ¦йЋ•йЋ€йЋ™йЋџйЋЌйЋ±йЋ‘йЋІйЋ¤йЋЁйЋґйЋЈйЋҐй—’й—“й—‘йљій›—й›ље·‚й›џй›й›ќйњЈйњўйњҐйћ¬йћ®йћЁйћ«йћ¤йћЄ"],
    ["f1a1","йћўйћҐйџ—йџ™йџ–йџйџєйЎђйЎ‘йЎ’йўёйҐЃй¤јй¤єйЁЏйЁ‹йЁ‰йЁЌйЁ„йЁ‘йЁЉйЁ…йЁ‡йЁ†й«Ђй«њй¬€й¬„й¬…й¬©й¬µй­Љй­Њй­‹йЇ‡йЇ†йЇѓй®їйЇЃй®µй®ёйЇ“й®¶йЇ„й®№й®Ѕйµњйµ“йµЏйµЉйµ›йµ‹йµ™йµ–йµЊйµ—йµ’йµ”йµџйµйµљйєЋйєЊй»џйјЃйјЂйј–йјҐйј«йјЄйј©йјЁйЅЊйЅ•е„ґе„µеЉ–е‹·еЋґељ«ељ­ељ¦ељ§ељЄељ¬еЈљеЈќеЈ›е¤’е¬Ѕе¬ѕе¬їе·ѓе№°"],
    ["f240","еѕїж‡»ж”‡ж”ђж”Ќж”‰ж”Њж”Ћж–„ж—ћж—ќж›ћж«§ж« ж«Њж«‘ж«™ж«‹ж«џж«њж«ђж««ж«Џж«Ќж«ћж­ ж®°ж°ЊзЂ™зЂ§зЂ зЂ–зЂ«зЂЎзЂўзЂЈзЂ©зЂ—зЂ¤зЂњзЂЄз€Њз€Љз€‡з€‚з€…зЉҐзЉ¦зЉ¤зЉЈзЉЎз“‹з“…з’·з“ѓз”–з™ зџ‰зџЉзџ„зџ±з¤ќз¤›"],
    ["f2a1","з¤Ўз¤њз¤—з¤ћз¦°з©§з©Ёз°із°јз°№з°¬з°»зі¬зіЄз№¶з№µз№ёз№°з№·з№Їз№єз№Із№ґз№ЁзЅ‹зЅЉзѕѓзѕ†зѕ·зїЅзїѕиЃёи‡—и‡•и‰¤и‰Ўи‰Ји—«и—±и—­и—™и—Ўи—Ёи—љи——и—¬и—Іи—ёи—и—џи—Ји—њи—‘и—°и—¦и—Їи—ћи—ўи Ђиџєи ѓиџ¶иџ·и ‰и Њи ‹и †иџји €иџїи Љи ‚иҐўиҐљиҐ›иҐ—иҐЎиҐњиҐиҐќиҐ™и¦€и¦·и¦¶и§¶и­ђи­€и­Љи­Ђи­“и­–и­”и­‹и­•"],
    ["f340","и­‘и­‚и­’и­—и±ѓи±·и±¶иІљиґ†иґ‡иґ‰и¶¬и¶Єи¶­и¶«и№­и№ёи№іи№Єи№Їи№»и»‚иЅ’иЅ‘иЅЏиЅђиЅ“иѕґй…Ђй„їй†°й†­йЏћйЏ‡йЏЏйЏ‚йЏљйЏђйЏ№йЏ¬йЏЊйЏ™йЋ©йЏ¦йЏЉйЏ”йЏ®йЏЈйЏ•йЏ„йЏЋйЏЂйЏ’йЏ§й•Ѕй—љй—›й›Ўйњ©йњ«йњ¬йњЁйњ¦"],
    ["f3a1","йћійћ·йћ¶йџќйџћйџџйЎњйЎ™йЎќйЎ—йўїйўЅйў»йўѕйҐ€йҐ‡йҐѓй¦¦й¦§йЁљйЁ•йЁҐйЁќйЁ¤йЁ›йЁўйЁ йЁ§йЁЈйЁћйЁњйЁ”й«‚й¬‹й¬Љй¬Ћй¬Њй¬·йЇЄйЇ«йЇ йЇћйЇ¤йЇ¦йЇўйЇ°йЇ”йЇ—йЇ¬йЇњйЇ™йЇҐйЇ•йЇЎйЇљйµ·й¶Ѓй¶Љй¶„й¶€йµ±й¶Ђйµёй¶†й¶‹й¶ЊйµЅйµ«йµґйµµйµ°йµ©й¶…йµійµ»й¶‚йµЇйµ№йµїй¶‡йµЁйє”йє‘й»Ђй»јйј­йЅЂйЅЃйЅЌйЅ–йЅ—йЅеЊ·ељІ"],
    ["f440","ељµељіеЈЈе­…е·†е·‡е»®е»ЇеїЂеїЃж‡№ж”—ж”–ж”•ж”“ж—џж›Ёж›Јж›¤ж«іж«°ж«Єж«Ёж«№ж«±ж«®ж«ЇзЂјзЂµзЂЇзЂ·зЂґзЂ±зЃ‚зЂёзЂїзЂєзЂ№зЃЂзЂ»зЂізЃЃз€“з€”зЉЁзЌЅзЌјз’єзљ«зљЄзљѕз›­зџЊзџЋзџЏзџЌзџІз¤Ґз¤Јз¤§з¤Ёз¤¤з¤©"],
    ["f4a1","з¦Із©®з©¬з©­з«·з±‰з±€з±Љз±‡з±…зі®з№»з№ѕзєЃзєЂзѕєзїїиЃ№и‡›и‡™и€‹и‰Ёи‰©иўи—їиЃи—ѕи›иЂи—¶и„и‰и…иЊи—Ѕи ™и ђи ‘и —и “и –иҐЈиҐ¦и¦№и§·и­ и­Єи­ќи­Ёи­Ји­Ґи­§и­­и¶®иє†иє€иє„иЅ™иЅ–иЅ—иЅ•иЅиЅљй‚Ќй…ѓй…Ѓй†·й†µй†Ій†ійђ‹йђ“йЏ»йђ йђЏйђ”йЏѕйђ•йђђйђЁйђ™йђЌйЏµйђЂйЏ·йђ‡йђЋйђ–йђ’йЏєйђ‰йЏёйђЉйЏї"],
    ["f540","йЏјйђЊйЏ¶йђ‘йђ†й—ћй— й—џйњ®йњЇйћ№йћ»йџЅйџѕйЎ йЎўйЎЈйЎџйЈЃйЈ‚йҐђйҐЋйҐ™йҐЊйҐ‹йҐ“йЁІйЁґйЁ±йЁ¬йЁЄйЁ¶йЁ©йЁ®йЁёйЁ­й«‡й«Љй«†й¬ђй¬’й¬‘й°‹й°€йЇ·й°…й°’йЇёй±Ђй°‡й°Ћй°†й°—й°”й°‰й¶џй¶™й¶¤й¶ќй¶’й¶й¶ђй¶›"],
    ["f5a1","й¶ й¶”й¶њй¶Єй¶—й¶Ўй¶љй¶ўй¶Ёй¶ћй¶Јй¶їй¶©й¶–й¶¦й¶§йє™йє›йєљй»Ґй»¤й»§й»¦йј°йј®йЅ›йЅ йЅћйЅќйЅ™йѕ‘е„єе„№еЉеЉ—е›ѓељЅељѕе­€е­‡е·‹е·Џе»±ж‡Ѕж”›ж¬‚ж«јж¬ѓж«ёж¬ЂзЃѓзЃ„зЃЉзЃ€зЃ‰зЃ…зЃ†з€ќз€љз€™зЌѕз”—з™Єзџђз¤­з¤±з¤Їз±”з±“зіІзєЉзє‡зє€зє‹зє†зєЌзЅЌзѕ»иЂ°и‡ќииЄи¦иџиЈињи™и§и®иЎи и©ићиҐ"],
    ["f640","и ©и ќи ›и  и ¤и њи «иЎЉиҐ­иҐ©иҐ®иҐ«и§єи­№и­ёи­…и­єи­»иґђиґ”и¶ЇиєЋиєЊиЅћиЅ›иЅќй…†й…„й……й†№йђїйђ»йђ¶йђ©йђЅйђјйђ°йђ№йђЄйђ·йђ¬й‘Ђйђ±й—Ґй—¤й—ЈйњµйњєйћїйџЎйЎ¤йЈ‰йЈ†йЈЂйҐйҐ–йЁ№йЁЅй©†й©„й©‚й©ЃйЁє"],
    ["f6a1","йЁїй«Ќй¬•й¬—й¬й¬–й¬єй­’й°«й°ќй°њй°¬й°Јй°Ёй°©й°¤й°Ўй¶·й¶¶й¶јй·Ѓй·‡й·Љй·Џй¶ѕй·…й·ѓй¶»й¶µй·Ћй¶№й¶єй¶¬й·€й¶±й¶­й·Њй¶ій·Ќй¶Ій№єйєњй»«й»®й»­йј›йјйјљйј±йЅЋйЅҐйЅ¤йѕ’дє№е›†е›…е›‹еҐ±е­‹е­Ње·•е·‘е»Іж”Ўж” ж”¦ж”ўж¬‹ж¬€ж¬‰ж°ЌзЃ•зЃ–зЃ—зЃ’з€ћз€џзЉ©зЌїз“з“•з“™з“—з™­зљ­з¤µз¦ґз©°з©±з±—з±њз±™з±›з±љ"],
    ["f740","зіґзі±зє‘зЅЏзѕ‡и‡ћи‰«иґиµиіи¬иІи¶и ¬и Ёи ¦и Єи ҐиҐ±и¦їи¦ѕи§»и­ѕи®„и®‚и®†и®…и­їиґ•иє•иє”иєљиє’иєђиє–иє—иЅ иЅўй…‡й‘Њй‘ђй‘Љй‘‹й‘Џй‘‡й‘…й‘€й‘‰й‘†йњїйџЈйЎЄйЎ©йЈ‹йҐ”йҐ›й©Ћй©“й©”й©Њй©Џй©€й©Љ"],
    ["f7a1","й©‰й©’й©ђй«ђй¬™й¬«й¬»й­–й­•й±†й±€й°їй±„й°№й°ій±Ѓй°јй°·й°ґй°Ій°Ѕй°¶й·›й·’й·ћй·љй·‹й·ђй·њй·‘й·џй·©й·™й·й·–й·µй·•й·ќйє¶й»°йјµйјійјІйЅ‚йЅ«йѕ•йѕўе„ЅеЉ™еЈЁеЈ§еҐІе­Ќе·и ЇеЅЏж€Ѓж€ѓж€„ж”©ж”Ґж––ж›«ж¬‘ж¬’ж¬ЏжЇЉзЃ›зЃљз€ўзЋ‚зЋЃзЋѓз™°зџ”з±§з±¦зє•и‰¬иєи™Ђи№ији±и»иѕи °и Іи ®и іиҐ¶иҐґиҐіи§ѕ"],
    ["f840","и®Њи®Ћи®‹и®€и±…иґ™иєиЅ¤иЅЈй†јй‘ўй‘•й‘ќй‘—й‘ћйџ„йџ…й Ђй©–й©™й¬ћй¬џй¬ й±’й±й±ђй±Љй±Ќй±‹й±•й±™й±Њй±Ћй·»й··й·Їй·Јй·«й·ёй·¤й·¶й·Ўй·®й·¦й·Ій·°й·ўй·¬й·ґй·ій·Ёй·­й»‚й»ђй»Ій»ійј†йјњйјёйј·йј¶йЅѓйЅЏ"],
    ["f8a1","йЅ±йЅ°йЅ®йЅЇе›“е›Ќе­Ће±­ж”­ж›­ж›®ж¬“зЃџзЃЎзЃќзЃ з€Јз“›з“Ґзџ•з¤ёз¦·з¦¶з±Єзє—зѕ‰и‰­и™ѓи ёи ·и µиЎ‹и®”и®•иєћиєџиє иєќй†ѕй†Ѕй‡‚й‘«й‘Ёй‘©й›Ґйќ†йќѓйќ‡йџ‡йџҐй©ћй«•й­™й±Јй±§й±¦й±ўй±ћй± йё‚й·ѕйё‡йёѓйё†йё…йёЂйёЃйё‰й·їй·Ѕйё„йє йјћйЅ†йЅґйЅµйЅ¶е›”ж”®ж–ёж¬ж¬™ж¬—ж¬љзЃўз€¦зЉЄзџзџ™з¤№з±©з±«зі¶зєљ"],
    ["f940","зєзє›зє™и‡ и‡Ўи™†и™‡и™€иҐ№иҐєиҐјиҐ»и§їи®и®™иєҐиє¤иєЈй‘®й‘­й‘Їй‘±й‘ійќ‰йЎІйҐџй±Ёй±®й±­йё‹йёЌйёђйёЏйё’йё‘йєЎй»µйј‰йЅ‡йЅёйЅ»йЅєйЅ№ењћзЃ¦з±Їи ји¶Іиє¦й‡ѓй‘ґй‘ёй‘¶й‘µй© й±ґй±ій±±й±µйё”йё“й»¶йјЉ"],
    ["f9a1","йѕ¤зЃЁзЃҐзі·и™Єи ѕи Ѕи їи®ћиІњиє©и»‰йќ‹йЎійЎґйЈЊйҐЎй¦«й©¤й©¦й©§й¬¤йё•йё—йЅ€ж€‡ж¬ћз€§и™ЊиєЁй’‚й’Ђй’Ѓй©©й©Ёй¬®йё™з€©и™‹и®џй’ѓй±№йє·з™µй©«й±єйёќзЃ©зЃЄйє¤йЅѕйЅ‰йѕзўЃйЉ№иЈЏеў»жЃ’зІ§е«єв•”в•¦в•—в• в•¬в•Јв•љв•©в•ќв•’в•¤в••в•ћв•Єв•Ўв•в•§в•›в•“в•Ґв•–в•џв•«в•ўв•™в•Ёв•њв•‘в•ђв•­в•®в•°в•Їв–“"]
    ]
    
    },{}],20:[function(require,module,exports){
    module.exports=[
    ["0","\u0000",127],
    ["8ea1","пЅЎ",62],
    ["a1a1","гЂЂгЂЃгЂ‚пјЊпјЋгѓ»пјљпј›пјџпјЃг‚›г‚њВґпЅЂВЁпјѕпїЈпјїгѓЅгѓѕг‚ќг‚ћгЂѓд»ќгЂ…гЂ†гЂ‡гѓјвЂ•вЂђпјЏпјјпЅћв€ҐпЅњвЂ¦вЂҐвЂвЂ™вЂњвЂќпј€пј‰гЂ”гЂ•пј»пјЅпЅ›пЅќгЂ€",9,"пј‹пјЌВ±Г—Г·пјќв‰ пјњпјћв‰¦в‰§в€ћв€ґв™‚в™ЂВ°вЂІвЂів„ѓпїҐпј„пї пїЎпј…пјѓпј†пјЉпј В§в†в…в—‹в—Џв—Ћв—‡"],
    ["a2a1","в—†в–Ўв– в–ів–Ів–Ѕв–јвЂ»гЂ’в†’в†ђв†‘в†“гЂ“"],
    ["a2ba","в€€в€‹вЉ†вЉ‡вЉ‚вЉѓв€Єв€©"],
    ["a2ca","в€§в€Ёпїўв‡’в‡”в€Ђв€ѓ"],
    ["a2dc","в€ вЉҐвЊ’в€‚в€‡в‰Ўв‰’в‰Єв‰«в€љв€Ѕв€ќв€µв€«в€¬"],
    ["a2f2","в„«вЂ°в™Їв™­в™ЄвЂ вЂЎВ¶"],
    ["a2fe","в—Ї"],
    ["a3b0","пјђ",9],
    ["a3c1","пјЎ",25],
    ["a3e1","пЅЃ",25],
    ["a4a1","гЃЃ",82],
    ["a5a1","г‚Ў",85],
    ["a6a1","О‘",16,"ОЈ",6],
    ["a6c1","О±",16,"Пѓ",6],
    ["a7a1","Рђ",5,"РЃР–",25],
    ["a7d1","Р°",5,"С‘Р¶",25],
    ["a8a1","в”Ђв”‚в”Њв”ђв”в””в”њв”¬в”¤в”ґв”јв”Ѓв”ѓв”Џв”“в”›в”—в”Јв”ів”«в”»в•‹в” в”Їв”Ёв”·в”їв”ќв”°в”Ґв”ёв•‚"],
    ["ada1","в‘ ",19,"в… ",9],
    ["adc0","гЌ‰гЊ”гЊўгЌЌгЊгЊ§гЊѓгЊ¶гЌ‘гЌ—гЊЌгЊ¦гЊЈгЊ«гЌЉгЊ»гЋњгЋќгЋћгЋЋгЋЏгЏ„гЋЎ"],
    ["addf","гЌ»гЂќгЂџв„–гЏЌв„ЎгЉ¤",4,"г€±г€Іг€№гЌѕгЌЅгЌјв‰’в‰Ўв€«в€®в€‘в€љвЉҐв€ в€џвЉїв€µв€©в€Є"],
    ["b0a1","дєње”–еЁѓйїе“Ђж„›жЊЁе§¶йЂўи‘µиЊњз©ђж‚ЄжЏЎжёҐж—­и‘¦иЉ¦йЇµжў“ењ§ж–Ўж‰±е®›е§ђи™»йЈґзµўз¶ѕй®Ћж€–зІџиў·е®‰еєµжЊ‰жљ—жЎ€й—‡йћЌжќЏд»ҐдјЉдЅЌдѕќеЃ‰е›Іе¤·е§”еЁЃе°‰жѓџж„Џж…°ж“ж¤…з‚єз•Џз•°з§»з¶­з·ЇиѓѓиђЋиЎЈи¬‚йЃ•йЃєеЊ»дє•дєҐеџџи‚ІйѓЃзЈЇдёЂеЈ±жєўйЂёзЁІиЊЁиЉ‹й°Їе…ЃеЌ°е’Ѕе“Ўе› е§»еј•йЈІж·«иѓ¤и”­"],
    ["b1a1","й™ўй™°йљ йџ»еђ‹еЏіе®‡зѓЏзѕЅиї‚й›ЁеЌЇйµњзЄєдё‘зў“и‡јжё¦ее”„ж¬ќи”љй°»е§ҐеЋ©жµ¦з“њй–Џе™‚дє‘йЃ‹й›ІиЌЏй¤ЊеЏЎе–¶е¬°еЅ±ж ж›іж „ж°ёжііжґ©з‘›з›€з©Ћй ґи‹±иЎ›и© й‹­ж¶Із–«з›Љй§…ж‚¦и¬Ѓи¶Љй–Іж¦ЋеЋ­е††ењ’е °еҐ„е®ґе»¶жЂЁжЋ©жЏґжІїжј”з‚Ћз„”з…™з‡•зЊїзёЃи‰¶и‹‘и–—йЃ й‰›йґ›еЎ©ж–јж±љз”Ґе‡№е¤®еҐҐеѕЂеїњ"],
    ["b2a1","жЉјж—єжЁЄж¬§ж®ґзЋ‹зїЃиҐ–йґ¬йґЋй»„еІЎжІ–иЌ»е„„е±‹ж†¶и‡†жЎ¶з‰Ўд№™дїєеЌёжЃ©жё©з©Џйџідё‹еЊ–д»®дЅ•дјЅдѕЎдЅіеЉ еЏЇе‰е¤Џе«Ѓе®¶еЇЎз§‘жљ‡жћњжћ¶ж­ЊжІізЃ«зЏ‚з¦Ќз¦ѕзЁјз®‡иЉ±и‹›иЊ„иЌ·иЏЇиЏ“иќ¦иЄІе©иІЁиї¦йЃЋйњћиљЉдї„еіЁж€‘з‰™з”»и‡ҐиЉЅи›ѕиіЂй›…й¤“й§•д»‹дјљи§Је›ћеЎЉеЈЉе»»еї«жЂЄж‚”жЃўж‡ђж€’ж‹ђж”№"],
    ["b3a1","й­Ѓж™¦жў°жµ·зЃ°з•Њзљ†зµµиЉҐиџ№й–‹йљЋиІќе‡±еЉѕе¤–е’іе®іеґ–ж…Ёж¦‚ж¶ЇзўЌи“‹иЎ—и©ІйЋ§йЄёжµ¬й¦Ёи›™ећЈжџїи›Ћй€ЋеЉѓељ‡еђ„е»“ж‹Ўж’№ж јж ёж®»зЌІзўєз©«и¦љи§’иµ«ијѓйѓ­й–Јйљ”йќ©е­¦еІіжҐЅйЎЌйЎЋжЋ›з¬ жЁ«ж©їжў¶й°ЌжЅџе‰Іе–ќжЃ°ж‹¬жґ»жё‡ж»‘и‘›и¤ђиЅ„дё”й°№еЏ¶ж¤›жЁєйћ„ж Єе…њз«ѓи’Ій‡њйЋЊе™›йґЁж ўиЊ…иђ±"],
    ["b4a1","зІҐе€€и‹…з“¦д№ѕдѕѓе† еЇ’е€Ље‹е‹§е·»е–ље Єе§¦е®Ње®еЇ›е№Іе№№ж‚Јж„џж…Јж†ѕжЏ›ж•ўжџ‘жЎ“жЈєж¬ѕж­“ж±—жјўжѕ—жЅ…з’°з”з›Јзњ‹з«їз®Ўз°Ўз·©зј¶зї°и‚ќи‰¦иЋћи¦іи«ЊиІ«й‚„й‘‘й–“й–‘й–ўй™Ґйџ“й¤Ёи€дёёеђ«еІёе·ЊзЋ©з™ЊзњјеІ©зї«иґ‹й›Ѓй ‘йЎ”йЎдјЃдјЋеЌ±е–ње™ЁеџєеҐ‡е¬‰еЇ„еІђеёЊе№ѕеїЊжЏ®жњєж——ж—ўжњџжЈ‹жЈ„"],
    ["b5a1","ж©џеё°жЇ…ж°—ж±Ѕз•їзҐ€е­ЈзЁЂзґЂеѕЅи¦ЏиЁиІґиµ·и»ЊијќйЈўйЁЋй¬јдєЂеЃЅе„Ђе¦“е®њж€ЇжЉЂж“¬ж¬єзЉ з–‘зҐ‡зѕ©иџ»иЄји­°жЋ¬иЏЉйћ еђ‰еђѓе–«жЎ”ж©и©°з §жќµй»ЌеЌґе®ўи„љи™ђйЂ†дёд№…д»‡дј‘еЏЉеђёе®®еј“жЂҐж•‘жњЅж±‚ж±ІжіЈзЃёзђѓз©¶зЄ®з¬€зґљзіѕзµ¦ж—§з‰›еЋ»е±…е·Ёж‹’ж‹ жЊ™жё и™љиЁ±и·ќй‹ёжјЃз¦¦й­љдєЁдє«дє¬"],
    ["b6a1","дѕ›дѕ еѓ‘е…‡з«¶е…±е‡¶еЌ”еЊЎеЌїеЏ«е–¬еўѓеіЎеј·еЅЉжЂЇжЃђжЃ­жЊџж•™ж©‹жіЃз‹‚з‹­зџЇиѓёи„…и€€и•Ћйѓ·йЏЎйџїйҐ—й©љд»°е‡ќе°­жљЃжҐ­е±Ђж›ІжҐµзЋ‰жЎђзІЃеѓ…е‹¤еќ‡е·ѕйЊ¦ж–¤ж¬Јж¬Ѕзђґз¦Ѓз¦Ѕз­‹з·ЉиЉ№иЏЊиЎїиҐџи¬№иї‘й‡‘еђџйЉЂд№ќеЂ¶еЏҐеЊєз‹—зЋ–зџ©и‹¦иєЇй§†й§€й§’е…·ж„љи™ће–°з©єеЃ¶еЇ“йЃ‡йљ…дёІж«›й‡§е±‘е±€"],
    ["b7a1","жЋзЄџжІ“йќґиЅЎзЄЄз†Љйљ€зІ‚ж —з№°жЎ‘йЌ¬е‹Іеђ›и–«иЁ“зѕ¤и»ЌйѓЎеЌ¦иў€зҐЃдї‚е‚ѕе€‘е…„е•“ењ­зЏЄећ‹еҐ‘еЅўеѕ„жЃµж…¶ж…§ж†©жЋІжђєж•¬ж™ЇжЎ‚жё“з•¦зЁЅзі»зµЊз¶™з№‹зЅ«иЊЋиЌЉи›ЌиЁ€и©Ји­¦и»Ѕй љй¶ЏиЉёиїЋйЇЁеЉ‡ж€џж’ѓжїЂйљ™жЎЃе‚‘ж¬ ж±єжЅ”з©ґзµђиЎЂиЁЈжњ€д»¶еЂ№еЂ¦еЃҐе…је€ёе‰Је–§ењЏе …е«Ње»єж†Іж‡ёж‹іжЌІ"],
    ["b8a1","ж¤њжЁ©з‰ЅзЉ¬зЊ®з ”зЎЇзµ№зњЊи‚©и¦‹и¬™иіўи»’йЃЈйЌµй™єйЎ•йЁ“й№ёе…ѓеЋџеЋіе№»еј¦жё›жєђзЋ„зЏѕзµѓи€·иЁЂи«єй™ђд№ЋеЂ‹еЏ¤е‘је›єе§‘е­¤е·±еє«еј§ж€ёж•…жћЇж№–з‹ђзіЉиўґи‚ЎиѓЎиЏ°и™ЋиЄ‡и·Ёй€·й›‡йЎ§йј“дє”дє’дјЌеЌ€е‘‰еђѕеЁЇеѕЊеѕЎж‚џжў§жЄЋз‘љзўЃиЄћиЄ¤и­·й†ђд№ћйЇ‰дє¤дЅјдѕЇеЂ™еЂ–е…‰е…¬еЉџеЉ№е‹ѕеЋљеЏЈеђ‘"],
    ["b9a1","еђЋе–‰еќ‘ећўеҐЅе­”е­ќе®Џе·Ґе·§е··е№ёеєѓеєљеє·ејжЃ’ж…ЊжЉ—ж‹жЋ§ж”»ж‚ж™ѓж›ґжќ­ж Ўжў—ж§‹ж±џжґЄжµ©жёЇжєќз”Ізљ‡зЎ¬зЁїзі зґ…зґзµћз¶±иЂ•иЂѓи‚Їи‚±и…”и†Џи€ЄиЌ’иЎЊиЎЎи¬›иІўиіјйѓЉй…µй‰±з їй‹јй–¤й™Ќй …й¦™й«йґ»е‰›еЉ«еЏ·еђ€еЈ•ж‹·жї и±ЄиЅџйє№е…‹е€»е‘Ље›Ѕз©Ђй…·йµ й»’зЌ„жј‰и…°з”‘еїЅжѓљйЄЁз‹›иѕј"],
    ["baa1","ж­¤й ѓд»Ље›°еќ¤еўѕе©љжЃЁж‡‡жЏж†ж №жў±ж··з—•зґєи‰®й­‚дє›дЅђеЏ‰е”†еµЇе·¦е·®жџ»жІ™з‘із ‚и©ђйЋ–иЈџеќђеє§жЊ«е‚µе‚¬е†ЌжњЂе“‰еЎће¦»е®°еЅ©ж‰ЌжЋЎж Ѕж­іжё€зЃЅй‡‡зЉЂз •з ¦зҐ­ж–Ћзґ°иЏњиЈЃиј‰йљ›е‰¤ењЁжќђзЅЄиІЎе†ґеќ‚йЄе єж¦Љи‚ґе’ІеґЋеџјзў•й·єдЅње‰Ље’‹жђѕжЁжњ”жџµзЄ„з­–зґўйЊЇжЎњй®­з¬№еЊ™е†Ље€·"],
    ["bba1","еЇџж‹¶ж’®ж“¦жњ­ж®єи–©й›‘зљђйЇ–жЌЊйЊ†й®«зљїж™’дё‰е‚еЏ‚е±±жѓЁж’’ж•ЈжЎџз‡¦зЏЉз”Јз®—зє‚иљ•и®ѓиі›й…ёй¤ђж–¬жљ«ж®‹д»•д»”дјєдЅїе€єеЏёеЏІе—Је››еЈ«е§‹е§‰е§їе­ђе±Ќеё‚её«еї—жЂќжЊ‡ж”Їе­њж–Їж–Ѕж—Ёжћќж­ўж­»ж°ЏзЌ…зҐ‰з§Ѓзіёзґ™зґ«и‚ўи„‚и‡іи¦–и©ћи©©и©¦иЄЊи«®иі‡иіњй›ЊйЈјж­Їдє‹дјјдѕЌе…ђе­—еЇєж…€жЊЃж™‚"],
    ["bca1","ж¬Ўж»‹жІ»з€ѕз’Ѕз—”зЈЃз¤єиЂЊиЂіи‡Єи’”иѕћж±ђй№їејЏи­йґ«з«єи»ёе®Ќй›«дёѓеЏ±еџ·е¤±е«‰е®¤ж‚‰ж№їжј†з–ѕиіЄе®џи”ЂзЇ еЃІжџґиЉќе±Ўи•Љзёћи€Ће†™е°„жЌЁиµ¦ж–њз…®з¤ѕзґ—иЂ…и¬ќи»ЉйЃ®и›‡й‚ЄеЂџе‹єе°єжќ“зЃјз€µй…Њй‡€йЊ«и‹ҐеЇ‚еј±жѓ№дё»еЏ–е®€ж‰‹жњ±ж®Љз‹©зЏ зЁ®и…«и¶Јй…’й¦–е„’еЏ—е‘ЄеЇїжЋ€жЁ№з¶¬йњЂе›љеЏЋе‘Ё"],
    ["bda1","е®—е°±е·ћдї®ж„Ѓж‹ѕжґІз§Ђз§‹зµ‚з№Ќзї’и‡­и€џи’ђиЎ†иҐІи®ђи№ґијЇйЂ±й…‹й…¬й›†й†њд»ЂдЅЏе……еЌЃеѕ“ж€Ћжџ”ж±Ѓжё‹зЌЈзё¦й‡ЌйЉѓеЏ”е¤™е®їж·‘зҐќзё®зІ›еЎѕз†џе‡єиЎ“иї°дїЉеі»жҐзћ¬з«Ји€њй§їе‡†еѕЄж—¬жҐЇж®‰ж·іжє–жЅ¤з›ѕзґ”е·ЎйЃµй†‡й †е‡¦е€ќж‰Ђжљ‘ж›™жёљеє¶з·’зЅІж›ёи–Їи—·и«ёеЉ©еЏ™еҐіеєЏеѕђжЃ•й‹¤й™¤е‚·е„џ"],
    ["bea1","е‹ќеЊ еЌ‡еЏ¬е“Ёе•†е”±е—еҐЁе¦ѕеЁје®µе°†е°Џе°‘е°љеє„еєЉе» еЅ°ж‰їжЉ„ж‹›жЋЊжЌ·ж‡жЊж­ж™¶жќѕжўўжЁџжЁµжІјж¶€жё‰ж№з„јз„¦з…§з—‡зњЃзЎќз¤ЃзҐҐз§°з« з¬‘зІ§зґ№и‚–иЏ–и’‹и•‰иЎќиЈіиЁџиЁји©”и©іи±Ўиіћй†¤й‰¦йЌѕйђйљњйћдёЉдё€дёћд№—е†—е‰°еџЋе ґеЈЊе¬ўеёёжѓ…ж“ѕжќЎжќ–жµ„зЉ¶з•із©Ји’ёи­Ій†ёйЊ е±еџґйЈѕ"],
    ["bfa1","ж‹­ж¤Ќж®–з‡­з№”иЃ·и‰Іи§¦йЈџиќ•иѕ±е°»дјёдїЎдѕµе”‡еЁ еЇќеЇ©еїѓж…ЋжЊЇж–°ж™‹жЈ®ж¦›жµёж·±з”із–№зњџзҐћз§¦зґіи‡ЈиЉЇи–Єи¦ЄиЁєиє«иѕ›йЂІй‡ќйњ‡дєєд»Ѓе€ѓеЎµеЈ¬е°‹з”ље°Ѕи…ЋиЁЉиї…й™Јйќ­з¬Ґи«Џй €й…ўе›іеЋЁйЂ—еђ№ећ‚еёҐжЋЁж°ґз‚ЉзќЎзІ‹зї иЎ°йЃ‚й…”йЊђйЊйљЏз‘ћй«„еґ‡еµ©ж•°жћўи¶Ёй››жЌ®жќ‰ж¤™иЏ…й —й›ЂиЈѕ"],
    ["c0a1","жѕ„ж‘єеЇёдё–зЂ¬з•ќжЇе‡„е€¶е‹ўе§“еѕЃжЂ§ж€ђж”їж•ґжџж™ґжЈІж –ж­Јжё…з‰Із”џз››зІѕиЃ–еЈ°иЈЅиҐїиЄ иЄ“и«‹йЂќй†’йќ’йќ™ж–‰зЁЋи„†йљ»её­жѓњж€љж–Ґж”жћђзџіз©Ќз±Ќзёѕи„ЉиІ¬иµ¤и·Ўи№џзў©е€‡ж‹™жЋҐж‘‚жЉиЁ­зЄѓзЇЂиЄ¬й›Єзµ¶и€Њиќ‰д»™е…€еЌѓеЌ е®Је°‚е°–е·ќж€¦ж‰‡ж’°ж “ж ґжі‰жµ…жґ—жџ“жЅњз…Ћз…Ѕж—‹з©їз®­з·љ"],
    ["c1a1","з№ЉзѕЁи…єи€›и€№и–¦и©®иіЋи·µйЃёйЃ·йЉ­йЉ‘й–ѓй®®е‰Ќе–„жјёз„¶е…Ёз¦…з№•и†ізіЋе™ЊеЎ‘еІЁжЋЄж›ѕж›ЅжҐљз‹™з–Џз–Ћз¤ЋзҐ–з§џзІ—зґ зµ„и‡иЁґй»йЃЎйј еѓ§е‰µеЏЊеЏўеЂ‰е–ЄеЈ®еҐЏз€Ѕе®‹е±¤еЊќжѓЈжѓіжЌњжЋѓжЊїжЋ»ж“Ќж—©ж›№е·Јж§Ќж§Ѕжј•з‡Ґдє‰з—©з›ёзЄ“зіџз·Џз¶њиЃЎиЌ‰иЌи‘¬и’ји—»иЈ…иµ°йЂЃйЃ­йЋ—йњњйЁ’еѓЏеў—ж†Ћ"],
    ["c2a1","и‡“и”µиґ€йЂ дїѓеЃґе‰‡еЌіжЃЇжЌ‰жќџжё¬и¶ійЂџдї—е±ћиіЉж—Џз¶љеЌ’иў–е…¶жЏѓе­е­«е°ЉжђЌжќ‘йЃњд»–е¤ље¤Єж±°и©‘е”ѕе •е¦Ґжѓ°ж‰“жџЃи€µжҐ•й™Ђй§„йЁЁдЅ“е †еЇѕиЂђеІ±еёЇеѕ…жЂ ж…‹ж€ґж›їжі°ж»ћиѓЋи…їи‹”иў‹иІёйЂЂйЂ®йљЉй»›йЇ›д»ЈеЏ°е¤§з¬¬й†ЌйЎЊй·№ж»ќзЂ§еЌ“е•„е®…ж‰жЉћж‹“жІўжїЇзђўиЁ—йђёжїЃи«ѕиЊёе‡§и›ёеЏЄ"],
    ["c3a1","еЏ©дЅ†йЃ”иѕ°еҐЄи„±е·Ѕз«ЄиѕїжЈљи°·з‹ёй±€жЁЅиЄ°дё№еЌе†еќ¦ж‹…жЋўж—¦ж­Ћж·Ўж№›з‚­зџ­з«Їз®Єз¶»иЂЅиѓ†и›‹иЄ•йЌ›е›ЈеЈ‡ејѕж–­жљ–жЄЂж®µз”·и«‡еЂ¤зџҐењ°еј›жЃҐж™єж± з—ґзЁљзЅ®и‡ґињйЃ…й¦ізЇ‰з•њз«№з­‘и“„йЂђз§©зЄ’иЊ¶е«ЎзќЂдё­д»Іе®™еї жЉЅжјжџ±жіЁи™«иЎ·иЁ»й…Ћй‹ій§ђжЁ—зЂ¦зЊЄи‹§и‘—иІЇдёЃе…†е‡‹е–‹еЇµ"],
    ["c4a1","её–еёіеєЃеј”ејµеЅ«еѕґж‡ІжЊ‘жљўжњќжЅ®з‰’з”єзњєиЃґи„№и…ёиќ¶иЄїи«њи¶…и·ійЉљй•·й ‚йіҐе‹…жЌ—з›ґжњ•жІ€зЏЌиіѓйЋ®й™іжґҐеўњж¤Ћж§ЊиїЅйЋљз—›йЂљеЎљж ‚жЋґж§»дЅѓжј¬жџиѕ»и”¦з¶ґйЌ”ж¤їжЅ°еќЄеЈ·е¬¬зґ¬з€ЄеђЉй‡Јй¶ґдє­дЅЋеЃњеЃµе‰ѓиІће‘€е ¤е®љеёќеє•еє­е»·ејџж‚ЊжЉµжЊєжЏђжўЇж±Ђзў‡з¦ЋзЁ‹з· и‰‡иЁ‚и«¦и№„йЂ“"],
    ["c5a1","й‚ёй„­й‡йјЋжіҐж‘ж“ўж•µж»ґзљ„з¬›йЃ©йЏ‘жєєе“Іеѕ№ж’¤иЅЌиї­й‰„е…ёеЎ«е¤©е±•еє—ж·»зєЏз”њиІји»ўйЎ›з‚№дјќж®їжѕ±з”°й›»е…Ћеђђе µеЎ—е¦¬е± еѕ’ж–—жќњжёЎз™»иЏџиі­йЂ”йѓЅйЌЌз Ґз єеЉЄеє¦ењџеҐґжЂ’еЂ’е…ље†¬е‡Ќе€Ђе”ђеЎ”еЎеҐ—е®•еі¶е¶‹ж‚јжЉ•жђ­жќ±жЎѓжўјжЈџз›—ж·ж№Їж¶›зЃЇз‡€еЅ“з—зҐ·з­‰з­”з­’зі–зµ±е€°"],
    ["c6a1","и‘Ји•©и—¤иЁЋи¬„и±†иёЏйЂѓйЂЏйђ™й™¶й ­йЁ°й—еѓЌе‹•еђЊе ‚е°Ћж†§ж’ћжґћзћіз«Ґиѓґиђ„йЃ“йЉ…еі йґ‡еЊїеѕ—еѕіж¶њз‰№зќЈз¦їзЇ¤жЇ’з‹¬иЄ­ж ѓж©Ўе‡ёзЄЃж¤ґе±Љйі¶и‹«еЇ…й…‰зЂће™ёе±Їжѓ‡ж•¦жІЊи±љйЃЃй “е‘‘ж›‡й€ЌеҐ€й‚Је†…д№Ќе‡Єи–™и¬ЋзЃжЌєйЌ‹жҐўй¦ґзё„з•·еЌ—жҐ и»џй›Јж±ќдєЊе°јејђиї©еЊ‚иі‘и‚‰и™№е»їж—Ґд№іе…Ґ"],
    ["c7a1","е¦‚е°їйџ®д»»е¦ЉеїЌиЄЌжїЎз¦°зҐўеЇ§и‘±зЊ«з†±е№ґеїµжЌ»ж’љз‡ѓзІд№ѓе»јд№‹еџњељўж‚©жїѓзґЌиѓЅи„іи†їиѕІи¦—иљ¤е·ґжЉЉж’­и¦‡жќ·жіўжґѕзђ¶з ґе©†зЅµиЉ­й¦¬дїіе»ѓж‹ќжЋ’ж•—жќЇз›ѓз‰ЊиѓЊи‚єиј©й…ЌеЂЌеџ№еЄ’жў…жҐіз…¤з‹ЅиІ·еЈІиі й™ЄйЂ™иќїз§¤зџ§иђ©дјЇе‰ҐеЌљж‹ЌжџЏжіЉз™Ѕз®”зІ•и€¶и–„иї«ж›ќжј з€†зё›иЋ«й§Ѓйє¦"],
    ["c8a1","е‡Ѕз®±зЎІз®ёи‚‡з­€ж«Ёе№Ўи‚Њз•‘з• е…«й‰ўжєЊз™єй†—й«ЄдјђзЅ°жЉњз­Џй–Ґйі©е™єеЎ™и›¤йљјдјґе€¤еЌЉеЏЌеЏ›её†жђ¬ж–‘жќїж°ѕж±Ћз‰€зЉЇзЏ­з•”з№Ѓи€¬и—©иІ©зЇ„й‡†з…©й ’йЈЇжЊЅж™©з•Єз›¤зЈђи•ѓи›®еЊЄеЌ‘еђ¦е¦ѓеє‡еЅјж‚Іж‰‰ж‰№жЉ«ж–ђжЇ”жіЊз–Ізљ®зў‘з§з·‹зЅ·и‚Ґиў«иЄ№иІ»йЃїйќћйЈ›жЁ‹з°ёе‚™е°ѕеѕ®жћ‡жЇзђµзњ‰зѕЋ"],
    ["c9a1","йј»жџЉзЁ—еЊ№з–‹й«­еЅ¦и†ќиЏ±и‚ејјеї…з•ўз­†йЂјжЎ§е§«еЄ›зґђз™ѕи¬¬дїµеЅЄжЁ™ж°·жј‚з“ўзҐЁиЎЁи©•и±№е»џжЏЏз—…з§’и‹—йЊЁй‹Іи’њи›­й°­е“ЃеЅ¬ж–ЊжµњзЂ•иІ§иі“й »ж•Џз“¶дёЌд»еџ е¤«е©¦еЇЊе†ЁеёѓеєњжЂ–ж‰¶ж•·ж–§ж™®жµ®з€¶з¬¦и…ђи†љиЉ™и­њиІ иі¦иµґйњй™„дѕ®ж’«ж­¦и€ћи‘Ўи•ЄйѓЁе°ЃжҐ“йўЁи‘єи•—дјЏе‰Їеѕ©е№…жњЌ"],
    ["caa1","з¦Џи…№и¤‡и¦†ж·µеј—ж‰•жІёд»Џз‰©й®’е€†еђ»е™ґеўіж†¤ж‰®з„љеҐ®зІ‰зіћзґ›й›°ж–‡иЃћдё™дЅµе…µеЎЂе№Је№іејЉжџ„дё¦и”Ѕй–‰й™›з±ій Ѓеѓ»еЈЃз™–зў§е€ҐзћҐи”‘з®†еЃЏе¤‰з‰‡зЇ‡з·Ёиѕєиї”йЃЌдѕїе‹‰еЁ©ејЃйћ­дїќи€—й‹ЄењѓжЌ•ж­©з”«иЈњиј”з©‚е‹џеў“ж…•ж€Љжљ®жЇЌз°їиЏ©еЂЈдїёеЊ…е‘†е ±еҐ‰е®ќеі°еіЇеґ©еє–жЉ±жЌ§ж”ѕж–№жњ‹"],
    ["cba1","жі•жіЎзѓ№з Ізё«иѓћиЉіиђЊи“¬ињ‚и¤’иЁЄи±Љй‚¦й‹’йЈЅйіійµ¬д№ЏдєЎе‚Ќе‰–еќЉе¦ЁеёЅеїеї™ж€їжљґжњ›жџђжЈ’е†’зґЎи‚Єи†Ёи¬ЂиІЊиІїй‰ѕйІеђ й ¬еЊ—еѓ•еЌњеўЁж’Іжњґз‰§зќ¦з©†й‡¦е‹ѓжІЎж®†е Ђе№ЊеҐ”жњ¬зї»е‡Ўз›†ж‘©зЈЁй­”йє»еџ‹е¦№ж§жћљжЇЋе“©ж§™е№•и†њжћ•й®Єжџѕй±’жЎќдє¦дїЈеЏ€жЉ№жњ«жІ«иї„дѕ­з№­йєїдё‡ж…ўжєЂ"],
    ["cca1","жј«и”“е‘іжњЄй­…е·із®•еІ¬еЇ†ињњж№Љи“‘зЁ”и„€е¦™зІЌж°‘зњ е‹™е¤ўз„Ўз‰џзџ›йњ§йµЎж¤‹е©їеЁе†ҐеђЌе‘ЅжЋз›џиї·йЉйіґе§Єз‰ќж»…е…ЌжЈ‰з¶їз·¬йќўйєєж‘ёжЁЎиЊ‚е¦„е­џжЇ›зЊ›з›Із¶ІиЂ—и’™е„ІжњЁй»™з›®жќўе‹їй¤…е°¤ж€»з±ѕиІ°е•Џж‚¶зґ‹й–ЂеЊЃд№џе†¶е¤њз€єиЂ¶й‡ЋејҐзџўеЋ„еЅ№зґ„и–¬иЁіиєЌйќ–жџіи–®й‘“ж„‰ж„€жІ№з™’"],
    ["cda1","и«­ијёе”ЇдЅ‘е„Єе‹‡еЏ‹е®Ґе№Ѕж‚ ж†‚жЏ–жњ‰жџљж№§ж¶ЊзЊ¶зЊ·з”±зҐђиЈ•иЄйЃЉй‚‘йѓµй›„ићЌе¤•дє€дЅ™дёЋиЄ‰ијїй ђе‚­е№је¦–е®№еєёжЏљжЏєж“Ѓж›њжҐЉж§жґ‹жє¶з†”з”ЁзЄЇзѕЉиЂЂи‘‰и“‰и¦Ѓи¬ЎиёЉйЃҐй™Ѕй¤Љж…ѕжЉ‘ж¬ІжІѓжµґзїЊзїјж·Ђзѕ…ићєиЈёжќҐиЋ±й јй›·жґ›зµЎиђЅй…Єд№±еЌµеµђж¬„жї«и—Ќи­и¦§е€©еђЏе±ҐжќЋжўЁзђ†з’ѓ"],
    ["cea1","з—ўиЈЏиЈЎй‡Њй›ўй™ёеѕ‹зЋ‡з«‹и‘ЋжЋ з•ҐеЉ‰жµЃжєњзђ‰з•™зЎ«зІ’йљ†з«њйѕЌдѕ¶ж…®ж—…и™њдє†дє®еѓљдёЎе‡ЊеЇ®ж–™жўЃж¶јзЊџз™‚зћ­зЁњзі§и‰Їи«’йЃјй‡Џй™µй еЉ›з·‘еЂ«еЋжћ—ж·‹з‡ђзђіи‡ЁијЄйљЈй±—йєџз‘ еЎЃж¶™зґЇйЎћд»¤дј¶дѕ‹е†·еЉ±е¶єжЂњзЋІз¤ји‹“й€ґйљ·й›¶йњЉйє—йЅўжљ¦ж­ґе€—еЉЈзѓ€иЈ‚е»‰жЃ‹ж†ђжјЈз…‰з°ѕз·ґиЃЇ"],
    ["cfa1","и“®йЂЈйЊ¬е‘‚й­Їж«“з‚‰иі‚и·ЇйњІеЉґе©Ѓе»Љеј„жњ—жҐјж¦”жµЄжјЏз‰ўз‹јзЇ­иЂЃиЃѕиќ‹йѓЋе…­йє“з¦„и‚‹йЊІи«–еЂ­е’Њи©±ж­Єиі„и„‡жѓ‘жћ й·Ідє™дєй°ђи©«и—Ѓи•Ёж¤Ђж№ѕзў—и…•"],
    ["d0a1","ејЊдёђдё•дёЄдё±дё¶дёјдёїд№‚д№–д№дє‚дє…и±«дєЉи€’ејЌдєЋдєћдєџдє дєўдє°дєідє¶д»Ћд»Ќд»„д»†д»‚д»—д»ћд»­д»џд»·дј‰дЅљдј°дЅ›дЅќдЅ—дЅ‡дЅ¶дѕ€дѕЏдѕдЅ»дЅ©дЅ°дѕ‘дЅЇдѕ†дѕ–е„дї”дїџдїЋдїдї›дї‘дїљдїђдї¤дїҐеЂљеЂЁеЂ”еЂЄеЂҐеЂ…дјњдї¶еЂЎеЂ©еЂ¬дїѕдїЇеЂ‘еЂ†еЃѓеЃ‡жњѓеЃ•еЃђеЃ€еЃљеЃ–еЃ¬еЃёе‚Ђе‚ље‚…е‚ґе‚І"],
    ["d1a1","еѓ‰еѓЉе‚іеѓ‚еѓ–еѓћеѓҐеѓ­еѓЈеѓ®еѓ№еѓµе„‰е„Ѓе„‚е„–е„•е„”е„ље„Ўе„єе„·е„је„»е„їе…Ђе…’е…Ње…”е…ўз«ёе…©е…Єе…®е†Ђе†‚е›е†Ње†‰е†Џе†‘е†“е†•е†–е†¤е†¦е†ўе†©е†Єе†«е†іе†±е†Іе†°е†µе†Ѕе‡…е‡‰е‡›е‡ и™•е‡©е‡­е‡°е‡µе‡ѕе€„е€‹е€”е€Ће€§е€Єе€®е€іе€№е‰Џе‰„е‰‹е‰Ње‰ће‰”е‰Єе‰ґе‰©е‰іе‰їе‰ЅеЉЌеЉ”еЉ’е‰±еЉ€еЉ‘иѕЁ"],
    ["d2a1","иѕ§еЉ¬еЉ­еЉјеЉµе‹Ѓе‹Ќе‹—е‹ће‹Је‹¦йЈ­е‹ е‹іе‹µе‹ёе‹№еЊ†еЊ€з”ёеЊЌеЊђеЊЏеЊ•еЊљеЊЈеЊЇеЊ±еЊіеЊёеЌЂеЌ†еЌ…дё—еЌ‰еЌЌе‡–еЌћеЌ©еЌ®е¤еЌ»еЌ·еЋ‚еЋ–еЋ еЋ¦еЋҐеЋ®еЋ°еЋ¶еЏѓз°’й›™еЏџж›јз‡®еЏ®еЏЁеЏ­еЏєеђЃеђЅе‘Ђеђ¬еђ­еђјеђ®еђ¶еђ©еђќе‘Ће’Џе‘µе’Ће‘џе‘±е‘·е‘°е’’е‘»е’Ђе‘¶е’„е’ђе’†е“‡е’ўе’ёе’Ґе’¬е“„е“€е’Ё"],
    ["d3a1","е’«е“‚е’¤е’ѕе’је“е“Ґе“¦е”Џе””е“Ѕе“®е“­е“єе“ўе”№е•Ђе•Је•Ње”®е•ње•…е•–е•—е”ёе”іе•ќе–™е–Ђе’Їе–Ље–џе•»е•ѕе–е–ће–®е•је–ѓе–©е–‡е–Ёе—ље—…е—џе—„е—ње—¤е—”е”е—·е–е—ѕе—Ѕе›е—№е™Ће™ђз‡џеґе¶еІеёе™«е™¤еЇе™¬е™Єељ†ељЂељЉељ ељ”ељЏељҐељ®ељ¶ељґе›‚ељје›Ѓе›ѓе›Ђе›€е›Ће›‘е›“е›—е›®е›№ењЂе›їењ„ењ‰"],
    ["d4a1","ењ€ењ‹ењЌењ“ењењ–е—‡ењњењ¦ењ·ењёеќЋењ»еќЂеќЏеќ©еџЂећ€еќЎеќїећ‰ећ“ећ ећіећ¤ећЄећ°еџѓеџ†еџ”еџ’еџ“е Љеџ–еџЈе ‹е ™е ќеЎІе ЎеЎўеЎ‹еЎ°жЇЂеЎ’е ЅеЎ№еў…еў№еўџеў«еўєеЈћеў»еўёеў®еЈ…еЈ“еЈ‘еЈ—еЈ™еЈеЈҐеЈњеЈ¤еЈџеЈЇеЈєеЈ№еЈ»еЈјеЈЅе¤‚е¤Ље¤ђе¤›жў¦е¤Ґе¤¬е¤­е¤Іе¤ёе¤ѕз«’еҐ•еҐђеҐЋеҐљеҐеҐўеҐ еҐ§еҐ¬еҐ©"],
    ["d5a1","еҐёе¦Ѓе¦ќдЅћдѕ«е¦Је¦Іе§†е§Ёе§ње¦Ќе§™е§љеЁҐеЁџеЁ‘еЁњеЁ‰еЁље©Ђе©¬е©‰еЁµеЁ¶е©ўе©ЄеЄљеЄјеЄѕе«‹е«‚еЄЅе«Је«—е«¦е«©е«–е«єе«»е¬Ње¬‹е¬–е¬Іе«ђе¬Єе¬¶е¬ѕе­ѓе­…е­Ђе­‘е­•е­ље­›е­Ґе­©е­°е­іе­µе­ёж–€е­єе®Ђе®ѓе®¦е®ёеЇѓеЇ‡еЇ‰еЇ”еЇђеЇ¤еЇ¦еЇўеЇћеЇҐеЇ«еЇ°еЇ¶еЇіе°…е°‡е°€е°Ќе°“е° е°ўе°Ёе°ёе°№е±Ѓе±†е±Ће±“"],
    ["d6a1","е±ђе±Џе­±е±¬е±®д№ўе±¶е±№еІЊеІ‘еІ”е¦›еІ«еІ»еІ¶еІјеІ·еі…еІѕеі‡еі™еі©еіЅеієеі­е¶ЊеіЄеґ‹еґ•еґ—еµњеґџеґ›еґ‘еґ”еґўеґљеґ™еґеµЊеµ’еµЋеµ‹еµ¬еµіеµ¶е¶‡е¶„е¶‚е¶ўе¶ќе¶¬е¶®е¶Ѕе¶ђе¶·е¶је·‰е·Ќе·“е·’е·–е·›е·«е·Іе·µеё‹еёљеё™её‘её›её¶её·е№„е№ѓе№Ђе№Ће№—е№”е№џе№ўе№¤е№‡е№µе№¶е№єйєје№їеє е»Ѓе»‚е»€е»ђе»Џ"],
    ["d7a1","е»–е»Је»ќе»ље»›е»ўе»Ўе»Ёе»©е»¬е»±е»іе»°е»ґе»ёе»ѕејѓеј‰еЅќеЅњеј‹еј‘еј–еј©еј­ејёеЅЃеЅ€еЅЊеЅЋејЇеЅ‘еЅ–еЅ—еЅ™еЅЎеЅ­еЅіеЅ·еѕѓеѕ‚еЅїеѕЉеѕ€еѕ‘еѕ‡еѕћеѕ™еѕеѕ еѕЁеѕ­еѕјеї–еї»еї¤еїёеї±еїќж‚іеїїжЂЎжЃ жЂ™жЂђжЂ©жЂЋжЂ±жЂ›жЂ•жЂ«жЂ¦жЂЏжЂєжЃљжЃЃжЃЄжЃ·жЃџжЃЉжЃ†жЃЌжЃЈжЃѓжЃ¤жЃ‚жЃ¬жЃ«жЃ™ж‚Ѓж‚Ќжѓ§ж‚ѓж‚љ"],
    ["d8a1","ж‚„ж‚›ж‚–ж‚—ж‚’ж‚§ж‚‹жѓЎж‚ёжѓ жѓ“ж‚ґеї°ж‚Ѕжѓ†ж‚µжѓж…Ќж„•ж„†жѓ¶жѓ·ж„Ђжѓґжѓєж„ѓж„Ўжѓ»жѓ±ж„Ќж„Ћж…‡ж„ѕж„Ёж„§ж…Љж„їж„јж„¬ж„ґж„Ѕж…‚ж…„ж…іж…·ж…ж…™ж…љж…«ж…ґж…Їж…Ґж…±ж…џж…ќж…“ж…µж†™ж†–ж†‡ж†¬ж†”ж†љж†Љж†‘ж†«ж†®ж‡Њж‡Љж‡‰ж‡·ж‡€ж‡ѓж‡†ж†єж‡‹зЅ№ж‡Ќж‡¦ж‡Јж‡¶ж‡єж‡ґж‡їж‡Ѕж‡јж‡ѕж€Ђж€€ж€‰ж€Ќж€Њж€”ж€›"],
    ["d9a1","ж€ћж€Ўж€Єж€®ж€°ж€Іж€іж‰Ѓж‰Ћж‰ћж‰Јж‰›ж‰ ж‰Ёж‰јжЉ‚жЉ‰ж‰ѕжЉ’жЉ“жЉ–ж‹”жЉѓжЉ”ж‹—ж‹‘жЉ»ж‹Џж‹їж‹†ж“”ж‹€ж‹њж‹Њж‹Љж‹‚ж‹‡жЉ›ж‹‰жЊЊж‹®ж‹±жЊ§жЊ‚жЊ€ж‹Їж‹µжЌђжЊѕжЌЌжђњжЌЏжЋ–жЋЋжЋЂжЋ«жЌ¶жЋЈжЋЏжЋ‰жЋџжЋµжЌ«жЌ©жЋѕжЏ©жЏЂжЏ†жЏЈжЏ‰жЏ’жЏ¶жЏ„жђ–жђґжђ†жђ“жђ¦жђ¶ж”ќжђ—жђЁжђЏж‘§ж‘Їж‘¶ж‘Ћж”Єж’•ж’“ж’Ґж’©ж’€ж’ј"],
    ["daa1","ж“љж“’ж“…ж“‡ж’»ж“ж“‚ж“±ж“§и€‰ж“ ж“ЎжЉ¬ж“Јж“Їж”¬ж“¶ж“ґж“Іж“єж”Ђж“Ѕж”ж”њж”…ж”¤ж”Јж”«ж”ґж”µж”·ж”¶ж”ёз•‹ж•€ж•–ж••ж•Ќж•ж•ћж•ќж•Іж•ёж–‚ж–ѓи®Љж–›ж–џж–«ж–·ж—ѓж—†ж—Ѓж—„ж—Њж—’ж—›ж—™ж— ж—Ўж—±жќІжЉжѓж—»жќіжµж¶жґжњж™Џж™„ж™‰ж™Ѓж™ћж™ќж™¤ж™§ж™Ёж™џж™ўж™°жљѓжљ€жљЋжљ‰жљ„жљжљќж›Ѓжљ№ж›‰жљѕжљј"],
    ["dba1","ж›„жљёж›–ж›љж› жїж›¦ж›©ж›°ж›µж›·жњЏжњ–жњћжњ¦жњ§йњёжњ®жњїжњ¶жќЃжњёжњ·жќ†жќћжќ жќ™жќЈжќ¤жћ‰жќ°жћ©жќјжќЄжћЊжћ‹жћ¦жћЎжћ…жћ·жџЇжћґжџ¬жћіжџ©жћёжџ¤жџћжџќжџўжџ®жћ№жџЋжџ†жџ§жЄњж ћжЎ†ж ©жЎЂжЎЌж ІжЎЋжўіж «жЎ™жЎЈжЎ·жЎїжўџжўЏжў­жў”жўќжў›жўѓжЄ®жў№жЎґжўµжў жўєж¤ЏжўЌжЎѕж¤ЃжЈЉж¤€жЈж¤ўж¤¦жЈЎж¤ЊжЈЌ"],
    ["dca1","жЈ”жЈ§жЈ•ж¤¶ж¤’ж¤„жЈ—жЈЈж¤ҐжЈ№жЈ жЈЇж¤Ёж¤Єж¤љж¤Јж¤ЎжЈ†жҐ№жҐ·жҐњжҐёжҐ«жҐ”жҐѕжҐ®ж¤№жҐґж¤ЅжҐ™ж¤°жҐЎжҐћжҐќж¦ЃжҐЄж¦Іж¦®ж§ђж¦їж§Ѓж§“ж¦ѕж§ЋеЇЁж§Љж§ќж¦»ж§ѓж¦§жЁ®ж¦‘ж¦ ж¦њж¦•ж¦ґж§ћж§ЁжЁ‚жЁ›ж§їж¬Љж§№ж§Іж§§жЁ…ж¦±жЁћж§­жЁ”ж§«жЁЉжЁ’ж«ЃжЁЈжЁ“ж©„жЁЊж©ІжЁ¶ж©ёж©‡ж©ўж©™ж©¦ж©€жЁёжЁўжЄђжЄЌжЄ жЄ„жЄўжЄЈ"],
    ["dda1","жЄ—и—жЄ»ж«ѓж«‚жЄёжЄіжЄ¬ж«ћж«‘ж«џжЄЄж«љж«Єж«»ж¬…и–ж«єж¬’ж¬–й¬±ж¬џж¬ёж¬·з›њж¬№йЈ®ж­‡ж­ѓж­‰ж­ђж­™ж­”ж­›ж­џж­Ўж­ёж­№ж­їж®Ђж®„ж®ѓж®Ќж®ж®•ж®ћж®¤ж®Єж®«ж®Їж®Іж®±ж®іж®·ж®јжЇ†жЇ‹жЇ“жЇџжЇ¬жЇ«жЇіжЇЇйєѕж°€ж°“ж°”ж°›ж°¤ж°Јж±ћж±•ж±ўж±ЄжІ‚жІЌжІљжІЃжІ›ж±ѕж±Ёж±іжІ’жІђжі„жі±жі“жІЅжі—жі…жіќжІ®жІ±жІѕ"],
    ["dea1","жІєжі›жіЇжі™жіЄжґџиЎЌжґ¶жґ«жґЅжґёжґ™жґµжґіжґ’жґЊжµЈж¶“жµ¤жµљжµ№жµ™ж¶Ћж¶•жї¤ж¶…ж·№жё•жёЉж¶µж·‡ж·¦ж¶ёж·†ж·¬ж·ћж·Њж·Ёж·’ж·…ж·єж·™ж·¤ж·•ж·Єж·®жё­ж№®жё®жё™ж№Іж№џжёѕжёЈж№«жё«ж№¶ж№Ќжёџж№ѓжёєж№Ћжё¤ж»їжёќжёёжє‚жєЄжєж»‰жє·ж»“жєЅжєЇж»„жєІж»”ж»•жєЏжєҐж»‚жєџжЅЃжј‘зЃЊж»¬ж»ёж»ѕжјїж»Іжј±ж»ЇжјІж»Њ"],
    ["dfa1","жјѕжј“ж»·жѕ†жЅєжЅёжѕЃжѕЂжЅЇжЅ›жїіжЅ­жѕ‚жЅјжЅжѕЋжѕ‘жї‚жЅ¦жѕіжѕЈжѕЎжѕ¤жѕ№жї†жѕЄжїџжї•жї¬жї”жїжї±жї®жї›зЂ‰зЂ‹жїєзЂ‘зЂЃзЂЏжїѕзЂ›зЂљжЅґзЂќзЂзЂџзЂ°зЂѕзЂІзЃ‘зЃЈз‚™з‚’з‚Їзѓ±з‚¬з‚ёз‚із‚®зѓџзѓ‹зѓќзѓ™з„‰зѓЅз„њз„™з…Ґз…•з†€з…¦з…ўз…Њз…–з…¬з†Џз‡»з†„з†•з†Ёз†¬з‡—з†№з†ѕз‡’з‡‰з‡”з‡Ћз‡ з‡¬з‡§з‡µз‡ј"],
    ["e0a1","з‡№з‡їз€Ќз€ђз€›з€Ёз€­з€¬з€°з€Із€»з€јз€їз‰Ђз‰†з‰‹з‰з‰ґз‰ѕзЉ‚зЉЃзЉ‡зЉ’зЉ–зЉўзЉ§зЉ№зЉІз‹ѓз‹†з‹„з‹Ћз‹’з‹ўз‹ з‹Ўз‹№з‹·еЂЏзЊ—зЊЉзЊњзЊ–зЊќзЊґзЊЇзЊ©зЊҐзЊѕзЌЋзЌЏй»зЌ—зЌЄзЌЁзЌ°зЌёзЌµзЌ»зЌєзЏ€зЋізЏЋзЋ»зЏЂзЏҐзЏ®зЏћз’ўзђ…з‘ЇзђҐзЏёзђІзђєз‘•зђїз‘џз‘™з‘Ѓз‘њз‘©з‘°з‘Јз‘Єз‘¶з‘ѕз’‹з’ћз’§з“Љз“Џз“”зЏ±"],
    ["e1a1","з“ з“Јз“§з“©з“®з“Із“°з“±з“ёз“·з”„з”ѓз”…з”Њз”Ћз”Ќз”•з”“з”ћз”¦з”¬з”јз•„з•Ќз•Љз•‰з•›з•†з•љз•©з•¤з•§з•«з•­з•ёз•¶з–†з–‡з•ґз–Љз–‰з–‚з–”з–љз–ќз–Ґз–Јз—‚з–із—ѓз–µз–Ѕз–ёз–јз–±з—Ќз—Љз—’з—™з—Јз—ћз—ѕз—їз—јзЃз—°з—єз—Із—із‹зЌз‰зџз§з зЎзўз¤зґз°з»з™‡з™€з™†з™њз™з™Ўз™ўз™Ёз™©з™Єз™§з™¬з™°"],
    ["e2a1","з™Із™¶з™ёз™јзљЂзљѓзљ€зљ‹зљЋзљ–зљ“зљ™зљљзљ°зљґзљёзљ№зљєз›‚з›Ќз›–з›’з›ћз›Ўз›Ґз›§з›ЄиЇз›»зњ€зњ‡зњ„зњ©зњ¤зњћзњҐзњ¦зњ›зњ·зњёзќ‡зќљзќЁзќ«зќ›зќҐзќїзќѕзќ№зћЋзћ‹зћ‘зћ зћћзћ°зћ¶зћ№зћїзћјзћЅзћ»зџ‡зџЌзџ—зџљзџњзџЈзџ®зџјз Њз ’з¤¦з  з¤ЄзЎ…зўЋзЎґзў†зЎјзўљзўЊзўЈзўµзўЄзўЇзЈ‘зЈ†зЈ‹зЈ”зўѕзўјзЈ…зЈЉзЈ¬"],
    ["e3a1","зЈ§зЈљзЈЅзЈґз¤‡з¤’з¤‘з¤™з¤¬з¤«зҐЂзҐ зҐ—зҐџзҐљзҐ•зҐ“зҐєзҐїз¦Љз¦ќз¦§йЅ‹з¦Єз¦®з¦із¦№з¦єз§‰з§•з§§з§¬з§Ўз§ЈзЁ€зЁЌзЁзЁ™зЁ зЁџз¦ЂзЁ±зЁ»зЁѕзЁ·з©ѓз©—з©‰з©Ўз©ўз©©йѕќз©°з©№з©ЅзЄ€зЄ—зЄ•зЄзЄ–зЄ©з«€зЄ°зЄ¶з«…з«„зЄїй‚ѓз«‡з«Љз«Ќз«Џз«•з«“з«™з«љз«ќз«Ўз«ўз«¦з«­з«°з¬‚з¬Џз¬Љз¬†з¬із¬з¬™з¬ћз¬µз¬Ёз¬¶з­ђ"],
    ["e4a1","з­єз¬„з­Ќз¬‹з­Њз­…з­µз­Ґз­ґз­§з­°з­±з­¬з­®з®ќз®з®џз®Ќз®њз®љз®‹з®’з®Џз­ќз®™зЇ‹зЇЃзЇЊзЇЏз®ґзЇ†зЇќзЇ©з°‘з°”зЇ¦зЇҐз± з°Ђз°‡з°“зЇізЇ·з°—з°ЌзЇ¶з°Јз°§з°Єз°џз°·з°«з°Ѕз±Њз±ѓз±”з±Џз±Ђз±ђз±з±џз±¤з±–з±Ґз±¬з±µзІѓзІђзІ¤зІ­зІўзІ«зІЎзІЁзІізІІзІ±зІ®зІ№зІЅзіЂзі…зі‚зізі’зіњзіўй¬»зіЇзіІзіґзі¶зієзґ†"],
    ["e5a1","зґ‚зґњзґ•зґЉзµ…зµ‹зґ®зґІзґїзґµзµ†зµізµ–зµЋзµІзµЁзµ®зµЏзµЈз¶“з¶‰зµ›з¶ЏзµЅз¶›з¶єз¶®з¶Јз¶µз·‡з¶Ѕз¶«зёЅз¶ўз¶Їз·њз¶ёз¶џз¶°з·з·ќз·¤з·ћз·»з·Із·Ўзё…зёЉзёЈзёЎзё’зё±зёџзё‰зё‹зёўз№†з№¦зё»зёµзё№з№ѓзё·зёІзёєз№§з№ќз№–з№ћз№™з№љз№№з№Єз№©з№јз№»зєѓз·•з№Ѕиѕ®з№їзє€зє‰зєЊзє’зєђзє“зє”зє–зєЋзє›зєњзјёзјє"],
    ["e6a1","зЅ…зЅЊзЅЌзЅЋзЅђзЅ‘зЅ•зЅ”зЅзЅџзЅ зЅЁзЅ©зЅ§зЅёзѕ‚зѕ†зѕѓзѕ€зѕ‡зѕЊзѕ”зѕћзѕќзѕљзѕЈзѕЇзѕІзѕ№зѕ®зѕ¶зѕёи­±зї…зї†зїЉзї•зї”зїЎзї¦зї©зїізї№йЈњиЂ†иЂ„иЂ‹иЂ’иЂиЂ™иЂњиЂЎиЂЁиЂїиЂ»иЃЉиЃ†иЃ’иЃиЃљиЃџиЃўиЃЁиЃіиЃІиЃ°иЃ¶иЃ№иЃЅиЃїи‚„и‚†и‚…и‚›и‚“и‚љи‚­е†ђи‚¬иѓ›иѓҐиѓ™иѓќиѓ„иѓљиѓ–и„‰иѓЇиѓ±и„›и„©и„Ји„Їи…‹"],
    ["e7a1","йљ‹и…†и„ѕи…“и…‘иѓји…±и…®и…Ґи…¦и…ґи†ѓи†€и†Љи†Ђи†‚и† и†•и†¤и†Ји…џи†“и†©и†°и†µи†ѕи†ёи†Ѕи‡Ђи‡‚и†єи‡‰и‡Ќи‡‘и‡™и‡и‡€и‡љи‡џи‡ и‡§и‡єи‡»и‡ѕи€Ѓи€‚и€…и€‡и€Љи€Ќи€ђи€–и€©и€«и€ёи€іи‰Ђи‰™и‰и‰ќи‰љи‰џи‰¤и‰ўи‰Ёи‰Єи‰«и€®и‰±и‰·и‰ёи‰ѕиЉЌиЉ’иЉ«иЉџиЉ»иЉ¬и‹Ўи‹Ји‹џи‹’и‹ґи‹іи‹єиЋ“иЊѓи‹»и‹№и‹ћиЊ†и‹њиЊ‰и‹™"],
    ["e8a1","иЊµиЊґиЊ–иЊІиЊ±иЌЂиЊ№иЌђиЌ…иЊЇиЊ«иЊ—иЊиЋ…иЋљиЋЄиЋџиЋўиЋ–иЊЈиЋЋиЋ‡иЋЉиЌјиЋµиЌіиЌµиЋ иЋ‰иЋЁиЏґиђ“иЏ«иЏЋиЏЅиђѓиЏиђ‹иЏЃиЏ·иђ‡иЏ иЏІиђЌиђўиђ иЋЅиђёи”†иЏ»и‘­иђЄиђји•љи’„и‘·и‘«и’­и‘®и’‚и‘©и‘†иђ¬и‘Їи‘№иђµи“Љи‘ўи’№и’їи’џи“™и“Ќи’»и“љи“ђи“Ѓи“†и“–и’Ўи”Ўи“їи“ґи”—и”и”¬и”џи”•и””и“ји•Ђи•Ји•и•€"],
    ["e9a1","и•Ѓи‚и•‹и••и–Ђи–¤и–€и–‘и–Љи–Ёи•­и–”и–›и—Єи–‡и–њи•·и•ѕи–ђи—‰и–єи—Џи–№и—ђи—•и—ќи—Ґи—њи—№иЉи“и‹и—ѕи—єи†иўиљи°иїи™Ќд№•и™”и™џи™§и™±иљ“иљЈиљ©иљЄиљ‹иљЊиљ¶иљЇи›„и›†иљ°и›‰и Јиљ«и›”и›ћи›©и›¬и›џи››и›Їињ’ињ†ињ€ињЂињѓи›»ињ‘ињ‰ињЌи›№ињЉињґињїињ·ињ»ињҐињ©ињљиќ иќџиќёиќЊиќЋиќґиќ—иќЁиќ®иќ™"],
    ["eaa1","иќ“иќЈиќЄи …ићўићџић‚ићЇиџ‹ићЅиџЂиџђй›–ић«иџ„ићіиџ‡иџ†ић»иџЇиџІиџ и Џи Ќиџѕиџ¶иџ·и Ћиџ’и ‘и –и •и ўи Ўи ±и ¶и №и §и »иЎ„иЎ‚иЎ’иЎ™иЎћиЎўиЎ«иўЃиЎѕиўћиЎµиЎЅиўµиЎІиў‚иў—иў’иў®иў™иўўиўЌиў¤иў°иўїиў±иЈѓиЈ„иЈ”иЈиЈ™иЈќиЈ№и¤‚иЈјиЈґиЈЁиЈІи¤„и¤Њи¤Љи¤“иҐѓи¤ћи¤Ґи¤Єи¤«иҐЃиҐ„и¤»и¤¶и¤ёиҐЊи¤ќиҐ иҐћ"],
    ["eba1","иҐ¦иҐ¤иҐ­иҐЄиҐЇиҐґиҐ·иҐѕи¦ѓи¦€и¦Љи¦“и¦и¦Ўи¦©и¦¦и¦¬и¦Їи¦Іи¦єи¦Ѕи¦їи§Ђи§љи§њи§ќи§§и§ґи§ёиЁѓиЁ–иЁђиЁЊиЁ›иЁќиЁҐиЁ¶и©Ѓи©›и©’и©†и©€и©ји©­и©¬и©ўиЄ…иЄ‚иЄ„иЄЁиЄЎиЄ‘иЄҐиЄ¦иЄљиЄЈи«„и«Ќи«‚и«љи««и«іи«§и«¤и«±и¬”и« и«ўи«·и«ћи«›и¬Њи¬‡и¬љи«Ўи¬–и¬ђи¬—и¬ и¬ійћ«и¬¦и¬«и¬ѕи¬Ёи­Ѓи­Њи­Џи­Ћи­‰и­–и­›и­љи­«"],
    ["eca1","и­џи­¬и­Їи­ґи­Ѕи®Ђи®Њи®Ћи®’и®“и®–и®™и®љи°єи±Ѓи°їи±€и±Њи±Ћи±ђи±•и±ўи±¬и±ёи±єиІ‚иІ‰иІ…иІЉиІЌиІЋиІ”и±јиІж€ќиІ­иІЄиІЅиІІиІіиІ®иІ¶иі€иіЃиі¤иіЈиіљиіЅиієиі»иґ„иґ…иґЉиґ‡иґЏиґЌиґђйЅЋиґ“иіЌиґ”иґ–иµ§иµ­иµ±иµіи¶Ѓи¶™и·‚и¶ѕи¶єи·Џи·љи·–и·Њи·›и·‹и·Єи·«и·џи·Ји·јиё€иё‰и·їиёќиёћиёђиёџи№‚иёµиё°иёґи№Љ"],
    ["eda1","и№‡и№‰и№Њи№ђи№€и№™и№¤и№ иёЄи№Ји№•и№¶и№Іи№јиєЃиє‡иє…иє„иє‹иєЉиє“иє‘иє”иє™иєЄиєЎиє¬иє°и»†иє±иєѕи»…и»€и»‹и»›и»Ји»ји»»и»«и»ѕијЉиј…иј•иј’иј™иј“ијњијџиј›ијЊиј¦ијіиј»иј№иЅ…иЅ‚ијѕиЅЊиЅ‰иЅ†иЅЋиЅ—иЅњиЅўиЅЈиЅ¤иѕњиѕџиѕЈиѕ­иѕЇиѕ·иїљиїҐиїўиїЄиїЇй‚‡иїґйЂ…иї№иїєйЂ‘йЂ•йЂЎйЂЌйЂћйЂ–йЂ‹йЂ§йЂ¶йЂµйЂ№иїё"],
    ["eea1","йЃЏйЃђйЃ‘йЃ’йЂЋйЃ‰йЂѕйЃ–йЃйЃћйЃЁйЃЇйЃ¶йљЁйЃІй‚‚йЃЅй‚Ѓй‚Ђй‚Љй‚‰й‚Џй‚Ёй‚Їй‚±й‚µйѓўйѓ¤ж‰€йѓ›й„‚й„’й„™й„Ій„°й…Љй…–й…й…Јй…Ґй…©й…ій…Ій†‹й†‰й†‚й†ўй†«й†Їй†Єй†µй†ґй†єй‡Ђй‡Ѓй‡‰й‡‹й‡ђй‡–й‡џй‡Ўй‡›й‡јй‡µй‡¶й€ћй‡їй€”й€¬й€•й€‘й‰ћй‰—й‰…й‰‰й‰¤й‰€йЉ•й€їй‰‹й‰ђйЉњйЉ–йЉ“йЉ›й‰љй‹ЏйЉ№йЉ·й‹©йЊЏй‹єйЌ„йЊ®"],
    ["efa1","йЊ™йЊўйЊљйЊЈйЊєйЊµйЊ»йЌњйЌ йЌјйЌ®йЌ–йЋ°йЋ¬йЋ­йЋ”йЋ№йЏ–йЏ—йЏЁйЏҐйЏйЏѓйЏќйЏђйЏ€йЏ¤йђљйђ”йђ“йђѓйђ‡йђђйђ¶йђ«йђµйђЎйђєй‘Ѓй‘’й‘„й‘›й‘ й‘ўй‘ћй‘Єй€©й‘°й‘µй‘·й‘Ѕй‘љй‘јй‘ѕй’Ѓй‘їй–‚й–‡й–Љй–”й––й–й–™й– й–Ёй–§й–­й–јй–»й–№й–ѕй—Љжї¶й—ѓй—Ќй—Њй—•й—”й—–й—њй—Ўй—Ґй—ўйЎйЁй®йЇй™‚й™Њй™Џй™‹й™·й™њй™ћ"],
    ["f0a1","й™ќй™џй™¦й™Ій™¬йљЌйљйљ•йљ—йљЄйљ§йљ±йљІйљ°йљґйљ¶йљёйљ№й›Ћй›‹й›‰й›ЌиҐЌй›њйњЌй›•й›№йњ„йњ†йњ€йњ“йњЋйњ‘йњЏйњ–йњ™йњ¤йњЄйњ°йњ№йњЅйњѕйќ„йќ†йќ€йќ‚йќ‰йќњйќ йќ¤йќ¦йќЁе‹’йќ«йќ±йќ№йћ…йќјйћЃйќєйћ†йћ‹йћЏйћђйћњйћЁйћ¦йћЈйћійћґйџѓйџ†йџ€йџ‹йџњйџ­йЅЏйџІз«џйџ¶йџµй Џй Њй ёй ¤й Ўй ·й ЅйЎ†йЎЏйЎ‹йЎ«йЎЇйЎ°"],
    ["f1a1","йЎ±йЎґйЎійўЄйўЇйў±йў¶йЈ„йЈѓйЈ†йЈ©йЈ«й¤ѓй¤‰й¤’й¤”й¤й¤Ўй¤ќй¤ћй¤¤й¤ й¤¬й¤®й¤Ѕй¤ѕйҐ‚йҐ‰йҐ…йҐђйҐ‹йҐ‘йҐ’йҐЊйҐ•й¦—й¦й¦Ґй¦­й¦®й¦јй§џй§›й§ќй§й§‘й§­й§®й§±й§Ій§»й§ёйЁЃйЁЏйЁ…й§ўйЁ™йЁ«йЁ·й©…й©‚й©Ђй©ѓйЁѕй©•й©Ќй©›й©—й©џй©ўй©Ґй©¤й©©й©«й©ЄйЄ­йЄ°йЄјй«Ђй«Џй«‘й«“й«”й«ћй«џй«ўй«Јй«¦й«Їй««й«®й«ґй«±й«·"],
    ["f2a1","й«»й¬†й¬й¬љй¬џй¬ўй¬Јй¬Ґй¬§й¬Ёй¬©й¬Єй¬®й¬Їй¬Ій­„й­ѓй­Џй­Ќй­Ћй­‘й­й­ґй®“й®ѓй®‘й®–й®—й®џй® й®Ёй®ґйЇЂйЇЉй®№йЇ†йЇЏйЇ‘йЇ’йЇЈйЇўйЇ¤йЇ”йЇЎй°єйЇІйЇ±йЇ°й°•й°”й°‰й°“й°Њй°†й°€й°’й°Љй°„й°®й°›й°Ґй°¤й°Ўй°°й±‡й°Ій±†й°ѕй±љй± й±§й±¶й±ёйі§йі¬йі°йґ‰йґ€йі«йґѓйґ†йґЄйґ¦й¶ЇйґЈйґџйµ„йґ•йґ’йµЃйґїйґѕйµ†йµ€"],
    ["f3a1","йµќйµћйµ¤йµ‘йµђйµ™йµІй¶‰й¶‡й¶«йµЇйµєй¶љй¶¤й¶©й¶Ій·„й·Ѓй¶»й¶ёй¶єй·†й·Џй·‚й·™й·“й·ёй·¦й·­й·Їй·Ѕйёљйё›йёћй№µй№№й№ЅйєЃйє€йє‹йєЊйє’йє•йє‘йєќйєҐйє©йєёйєЄйє­йќЎй»Њй»Ћй»Џй»ђй»”й»њй»ћй»ќй» й»Ґй»Ёй»Їй»ґй»¶й»·й»№й»»й»јй»Ѕйј‡йј€зљ·йј•йјЎйј¬йјѕйЅЉйЅ’йЅ”йЅЈйЅџйЅ йЅЎйЅ¦йЅ§йЅ¬йЅЄйЅ·йЅІйЅ¶йѕ•йѕњйѕ "],
    ["f4a1","е Їж§‡йЃ™з‘¤е‡њз†™"],
    ["f9a1","зєЉи¤њйЌ€йЉ€и“њдї‰з‚»ж±жЈ€й‹№ж›»еЅ…дёЁд»Ўд»јдјЂдјѓдј№дЅ–дѕ’дѕЉдѕљдѕ”дїЌеЃЂеЂўдїїеЂћеЃ†еЃ°еЃ‚е‚”еѓґеѓе…Ље…¤е†ќе†ѕе‡¬е€•еЉњеЉ¦е‹Ђе‹›еЊЂеЊ‡еЊ¤еЌІеЋ“еЋІеЏќпЁЋе’ње’Ље’©е“їе–†еќ™еќҐећ¬еџ€еџ‡пЁЏпЁђеўћеўІе¤‹еҐ“еҐ›еҐќеҐЈе¦¤е¦єе­–еЇЂз”ЇеЇеЇ¬е°ћеІ¦еІєеіµеґ§еµ“пЁ‘еµ‚еµ­е¶ёе¶№е·ђејЎејґеЅ§еѕ·"],
    ["faa1","еїћжЃќж‚…ж‚Љжѓћжѓ•ж„ жѓІж„‘ж„·ж„°ж†ж€“жЉ¦жЏµж‘ ж’ќж“Ћж•ЋжЂж•ж»ж‰ж®жћж¤ж™Ґж™—ж™™пЁ’ж™іжљ™жљ жљІжљїж›єжњЋп¤©жќ¦жћ»жЎ’жџЂж ЃжЎ„жЈЏпЁ“жҐЁпЁ”ж¦ж§ўжЁ°ж©«ж©†ж©іж©ѕж«ўж«¤жЇ–ж°їж±њжІ†ж±Їжіљжґ„ж¶‡жµЇж¶–ж¶¬ж·Џж·ёж·Іж·јжё№ж№њжё§жёјжєїжѕ€жѕµжїµзЂ…зЂ‡зЂЁз‚…з‚«з„Џз„„з…њз…†з…‡пЁ•з‡Ѓз‡ѕзЉ±"],
    ["fba1","зЉѕзЊ¤пЁ–зЌ·зЋЅзЏ‰зЏ–зЏЈзЏ’зђ‡зЏµзђ¦зђЄзђ©зђ®з‘ўз’‰з’џз”Ѓз•Їзљ‚зљњзљћзљ›зљ¦пЁ—зќ†еЉЇз ЎзЎЋзЎ¤зЎєз¤°пЁпЁ™пЁљз¦”пЁ›з¦›з«‘з«§пЁњз««з®ћпЁќзµ€зµњз¶·з¶ з·–з№’зЅ‡зѕЎпЁћиЊЃиЌўиЌїиЏ‡иЏ¶и‘€и’ґи•“и•™и•«пЁџи–°пЁ пЁЎи ‡иЈµиЁ’иЁ·и©№иЄ§иЄѕи«џпЁўи«¶и­“и­їиі°иіґиґ’иµ¶пЁЈи»ЏпЁ¤пЁҐйЃ§йѓћпЁ¦й„•й„§й‡љ"],
    ["fca1","й‡—й‡ћй‡­й‡®й‡¤й‡Ґй€†й€ђй€Љй€єй‰Ђй€јй‰Ћй‰™й‰‘й€№й‰§йЉ§й‰·й‰ёй‹§й‹—й‹™й‹ђпЁ§й‹•й‹ й‹“йЊҐйЊЎй‹»пЁЁйЊћй‹їйЊќйЊ‚йЌ°йЌ—йЋ¤йЏ†йЏћйЏёйђ±й‘…й‘€й–’п§њпЁ©йљќйљЇйњійњ»йќѓйќЌйќЏйќ‘йќ•йЎ—йЎҐпЁЄпЁ«й¤§пЁ¬й¦ћй©Ћй«™й«њй­µй­Ій®Џй®±й®»й°Ђйµ°йµ«пЁ­йё™й»‘"],
    ["fcf1","в…°",9,"пїўпї¤пј‡пј‚"],
    ["8fa2af","ЛЛ‡ВёЛ™ЛќВЇЛ›ЛљпЅћО„О…"],
    ["8fa2c2","ВЎВ¦Вї"],
    ["8fa2eb","ВєВЄВ©В®в„ўВ¤в„–"],
    ["8fa6e1","О†О€О‰ОЉОЄ"],
    ["8fa6e7","ОЊ"],
    ["8fa6e9","ОЋО«"],
    ["8fa6ec","ОЏ"],
    ["8fa6f1","О¬О­О®ОЇПЉОђПЊП‚ПЌП‹О°ПЋ"],
    ["8fa7c2","Р‚",10,"РЋРЏ"],
    ["8fa7f2","С’",10,"СћСџ"],
    ["8fa9a1","Г†Дђ"],
    ["8fa9a4","Д¦"],
    ["8fa9a6","ДІ"],
    ["8fa9a8","ЕЃДї"],
    ["8fa9ab","ЕЉГЕ’"],
    ["8fa9af","Е¦Гћ"],
    ["8fa9c1","Г¦Д‘Г°Д§Д±ДіДёЕ‚ЕЂЕ‰Е‹ГёЕ“ГџЕ§Гѕ"],
    ["8faaa1","ГЃГЂГ„Г‚Д‚ЗЌДЂД„Г…ГѓД†Д€ДЊГ‡ДЉДЋГ‰Г€Г‹ГЉДљД–Д’Д"],
    ["8faaba","ДњДћДўД Д¤ГЌГЊГЏГЋЗЏД°ДЄД®ДЁДґД¶Д№ДЅД»ЕѓЕ‡Е…Г‘Г“Г’Г–Г”З‘ЕђЕЊГ•Е”ЕЕ–ЕљЕњЕ ЕћЕ¤ЕўГљГ™ГњГ›Е¬З“Е°ЕЄЕІЕ®ЕЁЗ—З›З™З•ЕґГќЕёЕ¶Е№ЕЅЕ»"],
    ["8faba1","ГЎГ Г¤ГўДѓЗЋДЃД…ГҐГЈД‡Д‰ДЌГ§Д‹ДЏГ©ГЁГ«ГЄД›Д—Д“Д™ЗµДќДџ"],
    ["8fabbd","ДЎДҐГ­Г¬ГЇГ®Зђ"],
    ["8fabc5","Д«ДЇД©ДµД·ДєДѕДјЕ„Е€Е†Г±ГіГІГ¶ГґЗ’Е‘ЕЌГµЕ•Е™Е—Е›ЕќЕЎЕџЕҐЕЈГєГ№ГјГ»Е­З”Е±Е«ЕіЕЇЕ©ЗЗњЗљЗ–ЕµГЅГїЕ·ЕєЕѕЕј"],
    ["8fb0a1","дё‚дё„дё…дёЊдё’дёџдёЈдё¤дёЁдё«дё®дёЇдё°дёµд№Ђд№Ѓд№„д№‡д№‘д№љд№њд№Јд№Ёд№©д№ґд№µд№№д№їдєЌдє–дє—дєќдєЇдє№д»ѓд»ђд»љд»›д» д»Ўд»ўд»Ёд»Їд»±д»ід»µд»Ѕд»ѕд»їдјЂдј‚дјѓдј€дј‹дјЊдј’дј•дј–дј—дј™дј®дј±дЅ дјідјµдј·дј№дј»дјѕдЅЂдЅ‚дЅ€дЅ‰дЅ‹дЅЊдЅ’дЅ”дЅ–дЅдЅџдЅЈдЅЄдЅ¬дЅ®дЅ±дЅ·дЅёдЅ№дЅєдЅЅдЅѕдѕЃдѕ‚дѕ„"],
    ["8fb1a1","дѕ…дѕ‰дѕЉдѕЊдѕЋдѕђдѕ’дѕ“дѕ”дѕ—дѕ™дѕљдѕћдѕџдѕІдѕ·дѕ№дѕ»дѕјдѕЅдѕѕдїЂдїЃдї…дї†дї€дї‰дї‹дїЊдїЌдїЏдї’дїњдї дїўдї°дїІдїјдїЅдїїеЂЂеЂЃеЂ„еЂ‡еЂЉеЂЊеЂЋеЂђеЂ“еЂ—еЂеЂ›еЂњеЂќеЂћеЂўеЂ§еЂ®еЂ°еЂІеЂіеЂµеЃЂеЃЃеЃ‚еЃ…еЃ†еЃЉеЃЊеЃЋеЃ‘еЃ’еЃ“еЃ—еЃ™еЃџеЃ еЃўеЃЈеЃ¦еЃ§еЃЄеЃ­еЃ°еЃ±еЂ»е‚Ѓе‚ѓе‚„е‚†е‚Ље‚Ће‚Џе‚ђ"],
    ["8fb2a1","е‚’е‚“е‚”е‚–е‚›е‚ње‚ћ",4,"е‚Єе‚Їе‚°е‚№е‚єе‚ЅеѓЂеѓѓеѓ„еѓ‡еѓЊеѓЋеѓђеѓ“еѓ”еѓеѓњеѓќеѓџеѓўеѓ¤еѓ¦еѓЁеѓ©еѓЇеѓ±еѓ¶еѓєеѓѕе„ѓе„†е„‡е„€е„‹е„Ње„Ќе„ЋеѓІе„ђе„—е„™е„›е„ње„ќе„ће„Је„§е„Ёе„¬е„­е„Їе„±е„іе„ґе„µе„ёе„№е…‚е…Ље…Џе…“е…•е…—е…е…џе…¤е…¦е…ѕе†ѓе†„е†‹е†Ће†е†ќе†Ўе†Је†­е†ёе†єе†је†ѕе†їе‡‚"],
    ["8fb3a1","е‡€е‡Џе‡‘е‡’е‡“е‡•е‡е‡ће‡ўе‡Ґе‡®е‡Іе‡іе‡ґе‡·е€Ѓе€‚е€…е€’е€“е€•е€–е€е€ўе€Ёе€±е€Іе€µе€је‰…е‰‰е‰•е‰—е‰е‰ље‰ње‰џе‰ е‰Ўе‰¦е‰®е‰·е‰ёе‰№еЉЂеЉ‚еЉ…еЉЉеЉЊеЉ“еЉ•еЉ–еЉ—еЉеЉљеЉњеЉ¤еЉҐеЉ¦еЉ§еЉЇеЉ°еЉ¶еЉ·еЉёеЉєеЉ»еЉЅе‹Ђе‹„е‹†е‹€е‹Ње‹Џе‹‘е‹”е‹–е‹›е‹ње‹Ўе‹Ґе‹Ёе‹©е‹Єе‹¬е‹°е‹±е‹ґе‹¶е‹·еЊЂеЊѓеЊЉеЊ‹"],
    ["8fb4a1","еЊЊеЊ‘еЊ“еЊеЊ›еЊњеЊћеЊџеЊҐеЊ§еЊЁеЊ©еЊ«еЊ¬еЊ­еЊ°еЊІеЊµеЊјеЊЅеЊѕеЌ‚еЌЊеЌ‹еЌ™еЌ›еЌЎеЌЈеЌҐеЌ¬еЌ­еЌІеЌ№еЌѕеЋѓеЋ‡еЋ€еЋЋеЋ“еЋ”еЋ™еЋќеЋЎеЋ¤еЋЄеЋ«еЋЇеЋІеЋґеЋµеЋ·еЋёеЋєеЋЅеЏЂеЏ…еЏЏеЏ’еЏ“еЏ•еЏљеЏќеЏћеЏ еЏ¦еЏ§еЏµеђ‚еђ“еђљеђЎеђ§еђЁеђЄеђЇеђ±еђґеђµе‘ѓе‘„е‘‡е‘Ќе‘Џе‘ће‘ўе‘¤е‘¦е‘§е‘©е‘«е‘­е‘®е‘ґе‘ї"],
    ["8fb5a1","е’Ѓе’ѓе’…е’€е’‰е’Ќе’‘е’•е’–е’ње’џе’Ўе’¦е’§е’©е’Єе’­е’®е’±е’·е’№е’єе’»е’їе“†е“Ље“Ќе“Ће“ е“Єе“¬е“Їе“¶е“је“ѕе“їе”Ђе”Ѓе”…е”€е”‰е”Ње”Ќе”Ће”•е”Єе”«е”Іе”µе”¶е”»е”је”Ѕе•Ѓе•‡е•‰е•Ље•Ќе•ђе•‘е•е•ље•›е•ће• е•Ўе•¤е•¦е•їе–Ѓе–‚е–†е–€е–Ће–Џе–‘е–’е–“е–”е–—е–Је–¤е–­е–Іе–їе—Ѓе—ѓе—†е—‰е—‹е—Ње—Ће—‘е—’"],
    ["8fb6a1","е—“е——е—е—›е—ће—ўе—©е—¶е—їе…е€еЉеЌ",5,"е™е¬е°еіеµе·е№е»ејеЅеїе™Ђе™Ѓе™ѓе™„е™†е™‰е™‹е™Ќе™Џе™”е™ће™ е™Ўе™ўе™Је™¦е™©е™­е™Їе™±е™Іе™µељ„ељ…ељ€ељ‹ељЊељ•ељ™ељљељќељћељџељ¦ељ§ељЁељ©ељ«ељ¬ељ­ељ±ељіељ·ељѕе›…е›‰е›Ље›‹е›Џе›ђе›Ње›Ќе›™е›ње›ќе›џе›Ўе›¤",4,"е›±е›«е›­"],
    ["8fb7a1","е›¶е›·ењЃењ‚ењ‡ењЉењЊењ‘ењ•ењљењ›ењќењ ењўењЈењ¤ењҐењ©ењЄењ¬ењ®ењЇењіењґењЅењѕењїеќ…еќ†еќЊеќЌеќ’еќўеќҐеќ§еќЁеќ«еќ­",4,"еќіеќґеќµеќ·еќ№еќєеќ»еќјеќѕећЃећѓећЊећ”ећ—ећ™ећљећњећќећћећџећЎећ•ећ§ећЁећ©ећ¬ећёећЅеџ‡еџ€еџЊеџЏеџ•еџќеџћеџ¤еџ¦еџ§еџ©еџ­еџ°еџµеџ¶еџёеџЅеџѕеџїе ѓе „е €е ‰еџЎ"],
    ["8fb8a1","е Ње Ќе ›е ће џе  е ¦е §е ­е Іе №е їеЎ‰еЎЊеЎЌеЎЏеЎђеЎ•еЎџеЎЎеЎ¤еЎ§еЎЁеЎёеЎјеЎїеўЂеўЃеў‡еў€еў‰еўЉеўЊеўЌеўЏеўђеў”еў–еўќеў еўЎеўўеў¦еў©еў±еўІеЈ„еўјеЈ‚еЈ€еЈЌеЈЋеЈђеЈ’еЈ”еЈ–еЈљеЈќеЈЎеЈўеЈ©еЈіе¤…е¤†е¤‹е¤Ње¤’е¤“е¤”и™Ѓе¤ќе¤Ўе¤Је¤¤е¤Ёе¤Їе¤°е¤іе¤µе¤¶е¤їеҐѓеҐ†еҐ’еҐ“еҐ™еҐ›еҐќеҐћеҐџеҐЎеҐЈеҐ«еҐ­"],
    ["8fb9a1","еҐЇеҐІеҐµеҐ¶еҐ№еҐ»еҐје¦‹е¦Ње¦Ће¦’е¦•е¦—е¦џе¦¤е¦§е¦­е¦®е¦Їе¦°е¦іе¦·е¦єе¦је§Ѓе§ѓе§„е§€е§Ље§Ќе§’е§ќе§ће§џе§Је§¤е§§е§®е§Їе§±е§Іе§ґе§·еЁЂеЁ„еЁЊеЁЌеЁЋеЁ’еЁ“еЁћеЁЈеЁ¤еЁ§еЁЁеЁЄеЁ­еЁ°е©„е©…е©‡е©€е©Ње©ђе©•е©ће©Је©Ґе©§е©­е©·е©єе©»е©ѕеЄ‹еЄђеЄ“еЄ–еЄ™еЄњеЄћеЄџеЄ еЄўеЄ§еЄ¬еЄ±еЄІеЄіеЄµеЄёеЄєеЄ»еЄї"],
    ["8fbaa1","е«„е«†е«€е«Џе«ље«ње« е«Ґе«Єе«®е«µе«¶е«Ѕе¬Ђе¬Ѓе¬€е¬—е¬ґе¬™е¬›е¬ќе¬Ўе¬Ґе¬­е¬ёе­Ѓе­‹е­Ње­’е­–е­ће­Ёе­®е­Їе­је­Ѕе­ѕе­їе®Ѓе®„е®†е®Ље®Ће®ђе®‘е®“е®”е®–е®Ёе®©е®¬е®­е®Їе®±е®Іе®·е®єе®јеЇЂеЇЃеЇЌеЇЏеЇ–",4,"еЇ еЇЇеЇ±еЇґеЇЅе°Ње°—е°ће°џе°Је°¦е°©е°«е°¬е°®е°°е°Іе°µе°¶е±™е±ље±ње±ўе±Је±§е±Ёе±©"],
    ["8fbba1","е±­е±°е±ґе±µе±єе±»е±је±ЅеІ‡еІ€еІЉеІЏеІ’еІќеІџеІ еІўеІЈеІ¦еІЄеІІеІґеІµеІєеі‰еі‹еі’еіќеі—еі®еі±еіІеіґеґЃеґ†еґЌеґ’еґ«еґЈеґ¤еґ¦еґ§еґ±еґґеґ№еґЅеґїеµ‚еµѓеµ†еµ€еµ•еµ‘еµ™еµЉеµџеµ еµЎеµўеµ¤еµЄеµ­еµ°еµ№еµєеµѕеµїе¶Ѓе¶ѓе¶€е¶Ље¶’е¶“е¶”е¶•е¶™е¶›е¶џе¶ е¶§е¶«е¶°е¶ґе¶ёе¶№е·ѓе·‡е·‹е·ђе·Ће·е·™е· е·¤"],
    ["8fbca1","е·©е·ёе·№еёЂеё‡еёЌеё’её”её•еёеёџеё её®еёЁеёІеёµеёѕе№‹е№ђе№‰е№‘е№–е№е№›е№ње№ће№Ёе№Є",4,"е№°еєЂеє‹еєЋеєўеє¤еєҐеєЁеєЄеє¬еє±еєіеєЅеєѕеєїе»†е»Ње»‹е»Ће»‘е»’е»”е»•е»ње»ће»Ґе»«еј‚еј†еј‡еј€ејЋеј™ејњејќејЎејўејЈеј¤ејЁеј«еј¬еј®еј°ејґеј¶еј»ејЅејїеЅЂеЅ„еЅ…еЅ‡еЅЌеЅђеЅ”еЅеЅ›еЅ еЅЈеЅ¤еЅ§"],
    ["8fbda1","еЅЇеЅІеЅґеЅµеЅёеЅєеЅЅеЅѕеѕ‰еѕЌеѕЏеѕ–еѕњеѕќеѕўеѕ§еѕ«еѕ¤еѕ¬еѕЇеѕ°еѕ±еѕёеї„еї‡еї€еї‰еї‹еїђ",4,"еїћеїЎеїўеїЁеї©еїЄеї¬еї­еї®еїЇеїІеїіеї¶еїєеїјжЂ‡жЂЉжЂЌжЂ“жЂ”жЂ—жЂжЂљжЂџжЂ¤жЂ­жЂіжЂµжЃЂжЃ‡жЃ€жЃ‰жЃЊжЃ‘жЃ”жЃ–жЃ—жЃќжЃЎжЃ§жЃ±жЃѕжЃїж‚‚ж‚†ж‚€ж‚Љж‚Ћж‚‘ж‚“ж‚•ж‚ж‚ќж‚ћж‚ўж‚¤ж‚Ґж‚Ёж‚°ж‚±ж‚·"],
    ["8fbea1","ж‚»ж‚ѕжѓ‚жѓ„жѓ€жѓ‰жѓЉжѓ‹жѓЋжѓЏжѓ”жѓ•жѓ™жѓ›жѓќжѓћжѓўжѓҐжѓІжѓµжѓёжѓјжѓЅж„‚ж„‡ж„Љж„Њж„ђ",4,"ж„–ж„—ж„™ж„њж„ћж„ўж„Єж„«ж„°ж„±ж„µж„¶ж„·ж„№ж…Ѓж……ж…†ж…‰ж…ћж… ж…¬ж…Іж…ёж…»ж…јж…їж†Ђж†Ѓж†ѓж†„ж†‹ж†Ќж†’ж†“ж†—ж†ж†њж†ќж†џж† ж†Ґж†Ёж†Єж†­ж†ёж†№ж†јж‡Ђж‡Ѓж‡‚ж‡Ћж‡Џж‡•ж‡њж‡ќж‡ћж‡џж‡Ўж‡ўж‡§ж‡©ж‡Ґ"],
    ["8fbfa1","ж‡¬ж‡­ж‡Їж€Ѓж€ѓж€„ж€‡ж€“ж€•ж€њж€ ж€ўж€Јж€§ж€©ж€«ж€№ж€Ѕж‰‚ж‰ѓж‰„ж‰†ж‰Њж‰ђж‰‘ж‰’ж‰”ж‰–ж‰љж‰њж‰¤ж‰­ж‰Їж‰іж‰єж‰ЅжЉЌжЉЋжЉЏжЉђжЉ¦жЉЁжЉіжЉ¶жЉ·жЉєжЉѕжЉїж‹„ж‹Ћж‹•ж‹–ж‹љж‹Єж‹Іж‹ґж‹јж‹ЅжЊѓжЊ„жЊЉжЊ‹жЊЌжЊђжЊ“жЊ–жЊжЊ©жЊЄжЊ­жЊµжЊ¶жЊ№жЊјжЌЃжЌ‚жЌѓжЌ„жЌ†жЌЉжЌ‹жЌЋжЌ’жЌ“жЌ”жЌжЌ›жЌҐжЌ¦жЌ¬жЌ­жЌ±жЌґжЌµ"],
    ["8fc0a1","жЌёжЌјжЌЅжЌїжЋ‚жЋ„жЋ‡жЋЉжЋђжЋ”жЋ•жЋ™жЋљжЋћжЋ¤жЋ¦жЋ­жЋ®жЋЇжЋЅжЏЃжЏ…жЏ€жЏЋжЏ‘жЏ“жЏ”жЏ•жЏњжЏ жЏҐжЏЄжЏ¬жЏІжЏіжЏµжЏёжЏ№жђ‰жђЉжђђжђ’жђ”жђжђћжђ жђўжђ¤жђҐжђ©жђЄжђЇжђ°жђµжђЅжђїж‘‹ж‘Џж‘‘ж‘’ж‘“ж‘”ж‘љж‘›ж‘њж‘ќж‘џж‘ ж‘Ўж‘Јж‘­ж‘іж‘ґж‘»ж‘Ѕж’…ж’‡ж’Џж’ђж’‘ж’ж’™ж’›ж’ќж’џж’Ўж’Јж’¦ж’Ёж’¬ж’іж’Ѕж’ѕж’ї"],
    ["8fc1a1","ж“„ж“‰ж“Љж“‹ж“Њж“Ћж“ђж“‘ж“•ж“—ж“¤ж“Ґж“©ж“Єж“­ж“°ж“µж“·ж“»ж“їж”Ѓж”„ж”€ж”‰ж”Љж”Џж”“ж””ж”–ж”™ж”›ж”ћж”џж”ўж”¦ж”©ж”®ж”±ж”єж”јж”Ѕж•ѓж•‡ж•‰ж•ђж•’ж•”ж•џж• ж•§ж•«ж•єж•Ѕж–Ѓж–…ж–Љж–’ж–•ж–ж–ќж– ж–Јж–¦ж–®ж–Іж–іж–ґж–їж—‚ж—€ж—‰ж—Ћж—ђж—”ж—–ж—ж—џж—°ж—Іж—ґж—µж—№ж—ѕж—їжЂж„ж€ж‰жЌж‘ж’ж•ж–жќ"],
    ["8fc2a1","жћжЎжўжЈж¤ж¦ж©жЄж«ж¬ж®ж°ж±жіж№ж·ж™Ђж™…ж™†ж™Љж™Њж™‘ж™Ћж™—ж™ж™™ж™›ж™њж™ ж™Ўж›»ж™Єж™«ж™¬ж™ѕж™іж™µж™їж™·ж™ёж™№ж™»жљЂж™јжљ‹жљЊжљЌжљђжљ’жљ™жљљжљ›жљњжљџжљ жљ¤жљ­жљ±жљІжљµжљ»жљїж›Ђж›‚ж›ѓж›€ж›Њж›Ћж›Џж›”ж››ж›џж›Ёж›«ж›¬ж›®ж›єжњ…жњ‡жњЋжњ“жњ™жњњжњ жњўжњіжњѕжќ…жќ‡жќ€жќЊжќ”жќ•жќќ"],
    ["8fc3a1","жќ¦жќ¬жќ®жќґжќ¶жќ»жћЃжћ„жћЋжћЏжћ‘жћ“жћ–жћжћ™жћ›жћ°жћ±жћІжћµжћ»жћјжћЅжџ№жџЂжџ‚жџѓжџ…жџ€жџ‰жџ’жџ—жџ™жџњжџЎжџ¦жџ°жџІжџ¶жџ·жЎ’ж ”ж ™ж ќж џж Ёж §ж ¬ж ­ж Їж °ж ±ж іж »ж їжЎ„жЎ…жЎЉжЎЊжЎ•жЎ—жЎжЎ›жЎ«жЎ®",4,"жЎµжЎ№жЎєжЎ»жЎјжў‚жў„жў†жў€жў–жўжўљжўњжўЎжўЈжўҐжў©жўЄжў®жўІжў»жЈ…жЈ€жЈЊжЈЏ"],
    ["8fc4a1","жЈђжЈ‘жЈ“жЈ–жЈ™жЈњжЈќжЈҐжЈЁжЈЄжЈ«жЈ¬жЈ­жЈ°жЈ±жЈµжЈ¶жЈ»жЈјжЈЅж¤†ж¤‰ж¤Љж¤ђж¤‘ж¤“ж¤–ж¤—ж¤±ж¤іж¤µж¤ёж¤»жҐ‚жҐ…жҐ‰жҐЋжҐ—жҐ›жҐЈжҐ¤жҐҐжҐ¦жҐЁжҐ©жҐ¬жҐ°жҐ±жҐІжҐєжҐ»жҐїж¦Ђж¦Ќж¦’ж¦–ж¦ж¦Ўж¦Ґж¦¦ж¦Ёж¦«ж¦­ж¦Їж¦·ж¦ёж¦єж¦јж§…ж§€ж§‘ж§–ж§—ж§ўж§Ґж§®ж§Їж§±ж§іж§µж§ѕжЁЂжЁЃжЁѓжЁЏжЁ‘жЁ•жЁљжЁќжЁ жЁ¤жЁЁжЁ°жЁІ"],
    ["8fc5a1","жЁґжЁ·жЁ»жЁѕжЁїж©…ж©†ж©‰ж©Љж©Ћж©ђж©‘ж©’ж©•ж©–ж©›ж©¤ж©§ж©Єж©±ж©іж©ѕжЄЃжЄѓжЄ†жЄ‡жЄ‰жЄ‹жЄ‘жЄ›жЄќжЄћжЄџжЄҐжЄ«жЄЇжЄ°жЄ±жЄґжЄЅжЄѕжЄїж«†ж«‰ж«€ж«Њж«ђж«”ж«•ж«–ж«њж«ќж«¤ж«§ж«¬ж«°ж«±ж«Іж«јж«Ѕж¬‚ж¬ѓж¬†ж¬‡ж¬‰ж¬Џж¬ђж¬‘ж¬—ж¬›ж¬ћж¬¤ж¬Ёж¬«ж¬¬ж¬Їж¬µж¬¶ж¬»ж¬їж­†ж­Љж­Ќж­’ж­–ж­ж­ќж­ ж­§ж­«ж­®ж­°ж­µж­Ѕ"],
    ["8fc6a1","ж­ѕж®‚ж®…ж®—ж®›ж®џж® ж®ўж®Јж®Ёж®©ж®¬ж®­ж®®ж®°ж®ёж®№ж®Ѕж®ѕжЇѓжЇ„жЇ‰жЇЊжЇ–жЇљжЇЎжЇЈжЇ¦жЇ§жЇ®жЇ±жЇ·жЇ№жЇїж°‚ж°„ж°…ж°‰ж°Ќж°Ћж°ђж°’ж°™ж°џж°¦ж°§ж°Ёж°¬ж°®ж°іж°µж°¶ж°єж°»ж°їж±Љж±‹ж±Ќж±Џж±’ж±”ж±™ж±›ж±њж±«ж±­ж±Їж±ґж±¶ж±ёж±№ж±»жІ…жІ†жІ‡жІ‰жІ”жІ•жІ—жІжІњжІџжІ°жІІжІґжі‚жі†жіЌжіЏжіђжі‘жі’жі”жі–"],
    ["8fc7a1","жіљжіњжі жі§жі©жі«жі¬жі®жіІжіґжґ„жґ‡жґЉжґЋжґЏжґ‘жґ“жґљжґ¦жґ§жґЁж±§жґ®жґЇжґ±жґ№жґјжґїжµ—жµћжµџжµЎжµҐжµ§жµЇжµ°жµјж¶‚ж¶‡ж¶‘ж¶’ж¶”ж¶–ж¶—ж¶ж¶Єж¶¬ж¶ґж¶·ж¶№ж¶Ѕж¶їж·„ж·€ж·Љж·Ћж·Џж·–ж·›ж·ќж·џж· ж·ўж·Ґж·©ж·Їж·°ж·ґж·¶ж·јжёЂжё„жёћжёўжё§жёІжё¶жё№жё»жёјж№„ж№…ж№€ж№‰ж№‹ж№Џж№‘ж№’ж№“ж№”ж№—ж№њж№ќж№ћ"],
    ["8fc8a1","ж№ўж№Јж№Ёж№іж№»ж№ЅжєЌжє“жє™жє жє§жє­жє®жє±жєіжє»жєїж»Ђж»Ѓж»ѓж»‡ж»€ж»Љж»Ќж»Ћж»Џж»«ж»­ж»®ж»№ж»»ж»Ѕжј„жј€жјЉжјЊжјЌжј–жјжјљжј›жј¦жј©жјЄжјЇжј°жјіжј¶жј»жјјжј­жЅЏжЅ‘жЅ’жЅ“жЅ—жЅ™жЅљжЅќжЅћжЅЎжЅўжЅЁжЅ¬жЅЅжЅѕжѕѓжѕ‡жѕ€жѕ‹жѕЊжѕЌжѕђжѕ’жѕ“жѕ”жѕ–жѕљжѕџжѕ жѕҐжѕ¦жѕ§жѕЁжѕ®жѕЇжѕ°жѕµжѕ¶жѕјжї…жї‡жї€жїЉ"],
    ["8fc9a1","жїљжїћжїЁжї©жї°жїµжї№жїјжїЅзЂЂзЂ…зЂ†зЂ‡зЂЌзЂ—зЂ зЂЈзЂЇзЂґзЂ·зЂ№зЂјзЃѓзЃ„зЃ€зЃ‰зЃЉзЃ‹зЃ”зЃ•зЃќзЃћзЃЋзЃ¤зЃҐзЃ¬зЃ®зЃµзЃ¶зЃѕз‚Ѓз‚…з‚†з‚”",4,"з‚›з‚¤з‚«з‚°з‚±з‚ґз‚·зѓЉзѓ‘зѓ“зѓ”зѓ•зѓ–зѓзѓњзѓ¤зѓєз„ѓ",4,"з„‹з„Њз„Џз„ћз„ з„«з„­з„Їз„°з„±з„ёз…Ѓз……з…†з…‡з…Љз…‹з…ђз…’з…—з…љз…њз…ћз… "],
    ["8fcaa1","з…Ёз…№з†Ђз†…з†‡з†Њз†’з†љз†›з† з†ўз†Їз†°з†Із†із†єз†їз‡Ђз‡Ѓз‡„з‡‹з‡Њз‡“з‡–з‡™з‡љз‡њз‡ёз‡ѕз€Ђз€‡з€€з€‰з€“з€—з€љз€ќз€џз€¤з€«з€Їз€ґз€ёз€№з‰Ѓз‰‚з‰ѓз‰…з‰Ћз‰Џз‰ђз‰“з‰•з‰–з‰љз‰њз‰ћз‰ з‰Јз‰Ёз‰«з‰®з‰Їз‰±з‰·з‰ёз‰»з‰јз‰їзЉ„зЉ‰зЉЌзЉЋзЉ“зЉ›зЉЁзЉ­зЉ®зЉ±зЉґзЉѕз‹Ѓз‹‡з‹‰з‹Њз‹•з‹–з‹з‹џз‹Ґз‹із‹ґз‹єз‹»"],
    ["8fcba1","з‹ѕзЊ‚зЊ„зЊ…зЊ‡зЊ‹зЊЌзЊ’зЊ“зЊзЊ™зЊћзЊўзЊ¤зЊ§зЊЁзЊ¬зЊ±зЊІзЊµзЊєзЊ»зЊЅзЌѓзЌЌзЌђзЌ’зЌ–зЌзЌќзЌћзЌџзЌ зЌ¦зЌ§зЌ©зЌ«зЌ¬зЌ®зЌЇзЌ±зЌ·зЌ№зЌјзЋЂзЋЃзЋѓзЋ…зЋ†зЋЋзЋђзЋ“зЋ•зЋ—зЋзЋњзЋћзЋџзЋ зЋўзЋҐзЋ¦зЋЄзЋ«зЋ­зЋµзЋ·зЋ№зЋјзЋЅзЋїзЏ…зЏ†зЏ‰зЏ‹зЏЊзЏЏзЏ’зЏ“зЏ–зЏ™зЏќзЏЎзЏЈзЏ¦зЏ§зЏ©зЏґзЏµзЏ·зЏ№зЏєзЏ»зЏЅ"],
    ["8fcca1","зЏїзђЂзђЃзђ„зђ‡зђЉзђ‘зђљзђ›зђ¤зђ¦зђЁ",9,"зђ№з‘Ђз‘ѓз‘„з‘†з‘‡з‘‹з‘Ќз‘‘з‘’з‘—з‘ќз‘ўз‘¦з‘§з‘Ёз‘«з‘­з‘®з‘±з‘Із’Ђз’Ѓз’…з’†з’‡з’‰з’Џз’ђз’‘з’’з’з’™з’љз’њз’џз’ з’Ўз’Јз’¦з’Ёз’©з’Єз’«з’®з’Їз’±з’Із’µз’№з’»з’їз“€з“‰з“Њз“ђз““з“з“љз“›з“ћз“џз“¤з“Ёз“Єз“«з“Їз“ґз“єз“»з“јз“їз”†"],
    ["8fcda1","з”’з”–з”—з” з”Ўз”¤з”§з”©з”Єз”Їз”¶з”№з”Ѕз”ѕз”їз•Ђз•ѓз•‡з•€з•Ћз•ђз•’з•—з•ћз•џз•Ўз•Їз•±з•№",5,"з–Ѓз–…з–ђз–’з–“з–•з–™з–њз–ўз–¤з–ґз–єз–їз—Ђз—Ѓз—„з—†з—Њз—Ћз—Џз——з—њз—џз— з—Ўз—¤з—§з—¬з—®з—Їз—±з—№зЂз‚зѓз„з‡з€зЉзЊзЏз’з“з•з–з™з›зњзќзћзЈзҐз¦з©з­зІзізµзёз№"],
    ["8fcea1","зєзјз™Љз™Ђз™Ѓз™ѓз™„з™…з™‰з™‹з™•з™™з™џз™¤з™Ґз™­з™®з™Їз™±з™ґзљЃзљ…зљЊзљЌзљ•зљ›зљњзљќзљџзљ зљў",6,"зљЄзљ­зљЅз›Ѓз›…з›‰з›‹з›Њз›Ћз›”з›™з› з›¦з›Ёз›¬з›°з›±з›¶з›№з›јзњЂзњ†зњЉзњЋзњ’зњ”зњ•зњ—зњ™зњљзњњзњўзњЁзњ­зњ®зњЇзњґзњµзњ¶зњ№зњЅзњѕзќ‚зќ…зќ†зќЉзќЌзќЋзќЏзќ’зќ–зќ—зќњзќћзќџзќ зќў"],
    ["8fcfa1","зќ¤зќ§зќЄзќ¬зќ°зќІзќізќґзќєзќЅзћЂзћ„зћЊзћЌзћ”зћ•зћ–зћљзћџзћўзћ§зћЄзћ®зћЇзћ±зћµзћѕзџѓзџ‰зџ‘зџ’зџ•зџ™зџћзџџзџ зџ¤зџ¦зџЄзџ¬зџ°зџ±зџґзџёзџ»з …з †з ‰з Ќз Ћз ‘з ќз Ўз ўз Јз ­з ®з °з µз ·зЎѓзЎ„зЎ‡зЎ€зЎЊзЎЋзЎ’зЎњзЎћзЎ зЎЎзЎЈзЎ¤зЎЁзЎЄзЎ®зЎєзЎѕзўЉзўЏзў”зўзўЎзўќзўћзўџзў¤зўЁзў¬зў­зў°зў±зўІзўі"],
    ["8fd0a1","зў»зўЅзўїзЈ‡зЈ€зЈ‰зЈЊзЈЋзЈ’зЈ“зЈ•зЈ–зЈ¤зЈ›зЈџзЈ зЈЎзЈ¦зЈЄзЈІзЈіз¤ЂзЈ¶зЈ·зЈєзЈ»зЈїз¤†з¤Њз¤ђз¤љз¤њз¤ћз¤џз¤ з¤Ґз¤§з¤©з¤­з¤±з¤ґз¤µз¤»з¤Ѕз¤їзҐ„зҐ…зҐ†зҐЉзҐ‹зҐЏзҐ‘зҐ”зҐзҐ›зҐњзҐ§зҐ©зҐ«зҐІзҐ№зҐ»зҐјзҐѕз¦‹з¦Њз¦‘з¦“з¦”з¦•з¦–з¦з¦›з¦њз¦Ўз¦Ёз¦©з¦«з¦Їз¦±з¦ґз¦ёз¦»з§‚з§„з§‡з§€з§Љз§Џз§”з§–з§љз§ќз§ћ"],
    ["8fd1a1","з§ з§ўз§Ґз§Єз§«з§­з§±з§ёз§јзЁ‚зЁѓзЁ‡зЁ‰зЁЉзЁЊзЁ‘зЁ•зЁ›зЁћзЁЎзЁ§зЁ«зЁ­зЁЇзЁ°зЁґзЁµзЁёзЁ№зЁєз©„з©…з©‡з©€з©Њз©•з©–з©™з©њз©ќз©џз© з©Ґз©§з©Єз©­з©µз©ёз©ѕзЄЂзЄ‚зЄ…зЄ†зЄЉзЄ‹зЄђзЄ‘зЄ”зЄћзЄ зЄЈзЄ¬зЄізЄµзЄ№зЄ»зЄјз«†з«‰з«Њз«Ћз«‘з«›з«Ёз«©з««з«¬з«±з«ґз«»з«Ѕз«ѕз¬‡з¬”з¬џз¬Јз¬§з¬©з¬Єз¬«з¬­з¬®з¬Їз¬°"],
    ["8fd2a1","з¬±з¬ґз¬Ѕз¬їз­Ђз­Ѓз­‡з­Ћз­•з­ з­¤з­¦з­©з­Єз­­з­Їз­Із­із­·з®„з®‰з®Ћз®ђз®‘з®–з®›з®ћз® з®Ґз®¬з®Їз®°з®Із®µз®¶з®єз®»з®јз®ЅзЇ‚зЇ…зЇ€зЇЉзЇ”зЇ–зЇ—зЇ™зЇљзЇ›зЇЁзЇЄзЇІзЇґзЇµзЇёзЇ№зЇєзЇјзЇѕз°Ѓз°‚з°ѓз°„з°†з°‰з°‹з°Њз°Ћз°Џз°™з°›з° з°Ґз°¦з°Ёз°¬з°±з°із°ґз°¶з°№з°єз±†з±Љз±•з±‘з±’з±“з±™",5],
    ["8fd3a1","з±Ўз±Јз±§з±©з±­з±®з±°з±Із±№з±јз±ЅзІ†зІ‡зІЏзІ”зІћзІ зІ¦зІ°зІ¶зІ·зІєзІ»зІјзІїзі„зі‡зі€зі‰зіЌзіЏзі“зі”зі•зі—зі™зіљзіќзі¦зі©зі«зіµзґѓзґ‡зґ€зґ‰зґЏзґ‘зґ’зґ“зґ–зґќзґћзґЈзґ¦зґЄзґ­зґ±зґјзґЅзґѕзµЂзµЃзµ‡зµ€зµЌзµ‘зµ“зµ—зµ™зµљзµњзµќзµҐзµ§зµЄзµ°зµёзµєзµ»зµїз¶Ѓз¶‚з¶ѓз¶…з¶†з¶€з¶‹з¶Њз¶Ќз¶‘з¶–з¶—з¶ќ"],
    ["8fd4a1","з¶ћз¶¦з¶§з¶Єз¶із¶¶з¶·з¶№з·‚",4,"з·Њз·Ќз·Ћз·—з·™зёЂз·ўз·Ґз·¦з·Єз·«з·­з·±з·µз·¶з·№з·єзё€зёђзё‘зё•зё—зёњзёќзё зё§зёЁзё¬зё­зёЇзёізё¶зёїз№„з№…з№‡з№Ћз№ђз№’з№з№џз№Ўз№ўз№Ґз№«з№®з№Їз№із№ёз№ѕзєЃзє†зє‡зєЉзєЌзє‘зє•зєзєљзєќзєћзјјзј»зјЅзјѕзјїзЅѓзЅ„зЅ‡зЅЏзЅ’зЅ“зЅ›зЅњзЅќзЅЎзЅЈзЅ¤зЅҐзЅ¦зЅ­"],
    ["8fd5a1","зЅ±зЅЅзЅѕзЅїзѕЂзѕ‹зѕЌзѕЏзѕђзѕ‘зѕ–зѕ—зѕњзѕЎзѕўзѕ¦зѕЄзѕ­зѕґзѕјзѕїзїЂзїѓзї€зїЋзїЏзї›зїџзїЈзїҐзїЁзї¬зї®зїЇзїІзїєзїЅзїѕзїїиЂ‡иЂ€иЂЉиЂЌиЂЋиЂЏиЂ‘иЂ“иЂ”иЂ–иЂќиЂћиЂџиЂ иЂ¤иЂ¦иЂ¬иЂ®иЂ°иЂґиЂµиЂ·иЂ№иЂєиЂјиЂѕиЃЂиЃ„иЃ иЃ¤иЃ¦иЃ­иЃ±иЃµи‚Ѓи‚€и‚Ћи‚њи‚ћи‚¦и‚§и‚«и‚ёи‚№иѓ€иѓЌиѓЏиѓ’иѓ”иѓ•иѓ—иѓиѓ иѓ­иѓ®"],
    ["8fd6a1","иѓ°иѓІиѓіиѓ¶иѓ№иѓєиѓѕи„ѓи„‹и„–и„—и„и„њи„ћи„ и„¤и„§и„¬и„°и„µи„єи„ји……и…‡и…Љи…Њи…’и…—и… и…Ўи…§и…Ёи…©и…­и…Їи…·и†Ѓи†ђи†„и†…и††и†‹и†Ћи†–и†и†›и†ћи†ўи†®и†Іи†ґи†»и‡‹и‡ѓи‡…и‡Љи‡Ћи‡Џи‡•и‡—и‡›и‡ќи‡ћи‡Ўи‡¤и‡«и‡¬и‡°и‡±и‡Іи‡µи‡¶и‡ёи‡№и‡Ѕи‡їи€Ђи€ѓи€Џи€“и€”и€™и€љи€ќи€Ўи€ўи€Ёи€Іи€ґи€єи‰ѓи‰„и‰…и‰†"],
    ["8fd7a1","и‰‹и‰Ћи‰Џи‰‘и‰–и‰њи‰ и‰Ји‰§и‰­и‰ґи‰»и‰Ѕи‰їиЉЂиЉЃиЉѓиЉ„иЉ‡иЉ‰иЉЉиЉЋиЉ‘иЉ”иЉ–иЉиЉљиЉ›иЉ иЉЎиЉЈиЉ¤иЉ§иЉЁиЉ©иЉЄиЉ®иЉ°иЉІиЉґиЉ·иЉєиЉјиЉѕиЉїи‹†и‹ђи‹•и‹љи‹ и‹ўи‹¤и‹Ёи‹Єи‹­и‹Їи‹¶и‹·и‹Ѕи‹ѕиЊЂиЊЃиЊ‡иЊ€иЊЉиЊ‹иЌ”иЊ›иЊќиЊћиЊџиЊЎиЊўиЊ¬иЊ­иЊ®иЊ°иЊіиЊ·иЊєиЊјиЊЅиЌ‚иЌѓиЌ„иЌ‡иЌЌиЌЋиЌ‘иЌ•иЌ–иЌ—иЌ°иЌё"],
    ["8fd8a1","иЌЅиЌїиЋЂиЋ‚иЋ„иЋ†иЋЌиЋ’иЋ”иЋ•иЋиЋ™иЋ›иЋњиЋќиЋ¦иЋ§иЋ©иЋ¬иЋѕиЋїиЏЂиЏ‡иЏ‰иЏЏиЏђиЏ‘иЏ”иЏќиЌ“иЏЁиЏЄиЏ¶иЏёиЏ№иЏјиђЃиђ†иђЉиђЏиђ‘иђ•иђ™иЋ­иђЇиђ№и‘…и‘‡и‘€и‘Љи‘Ќи‘Џи‘‘и‘’и‘–и‘и‘™и‘љи‘њи‘ и‘¤и‘Ґи‘§и‘Єи‘°и‘іи‘ґи‘¶и‘ёи‘ји‘Ѕи’Ѓи’…и’’и’“и’•и’ћи’¦и’Ёи’©и’Єи’Їи’±и’ґи’єи’Ѕи’ѕи“Ђи“‚и“‡и“€и“Њи“Џи““"],
    ["8fd9a1","и“њи“§и“Єи“Їи“°и“±и“Іи“·и”Іи“єи“»и“Ѕи”‚и”ѓи”‡и”Њи”Ћи”ђи”њи”ћи”ўи”Ји”¤и”Ґи”§и”Єи”«и”Їи”іи”ґи”¶и”їи•†и•Џ",4,"и•–и•™и•њ",6,"и•¤и•«и•Їи•№и•єи•»и•Ѕи•їи–Ѓи–…и–†и–‰и–‹и–Њи–Џи–“и–и–ќи–џи– и–ўи–Ґи–§и–ґи–¶и–·и–ёи–ји–Ѕи–ѕи–їи—‚и—‡и—Љи—‹и—Ћи–­и—и—љи—џи— и—¦и—Ёи—­и—іи—¶и—ј"],
    ["8fdaa1","и—їиЂи„и…иЌиЋиђи‘и’ии™и›ићиЎи§и©и¶иёиєијиЅи™Ђи™‚и™†и™’и™“и™–и™—и™и™™и™ќи™ ",4,"и™©и™¬и™Їи™µи™¶и™·и™єиљЌиљ‘иљ–иљиљљиљњиљЎиљ¦иљ§иљЁиљ­иљ±иљіиљґиљµиљ·иљёиљ№иљїи›Ђи›Ѓи›ѓи›…и›‘и›’и›•и›—и›љи›њи› и›Ји›Ґи›§иљ€и›єи›ји›Ѕињ„ињ…ињ‡ињ‹ињЋињЏињђињ“ињ”ињ™ињћињџињЎињЈ"],
    ["8fdba1","ињЁињ®ињЇињ±ињІињ№ињєињјињЅињѕиќЂиќѓиќ…иќЌиќиќќиќЎиќ¤иќҐиќЇиќ±иќІиќ»ићѓ",6,"ић‹ићЊићђић“ић•ић—ићић™ићћић ићЈић§ић¬ић­ић®ић±ићµићѕићїиџЃиџ€иџ‰иџЉиџЋиџ•иџ–иџ™иџљиџњиџџиџўиџЈиџ¤иџЄиџ«иџ­иџ±иџіиџёиџєиџїи Ѓи ѓи †и ‰и Љи ‹и ђи ™и ’и “и ”и и љи ›и њи ћи џи Ёи ­и ®и °и Іи µ"],
    ["8fdca1","и єи јиЎЃиЎѓиЎ…иЎ€иЎ‰иЎЉиЎ‹иЎЋиЎ‘иЎ•иЎ–иЎиЎљиЎњиЎџиЎ иЎ¤иЎ©иЎ±иЎ№иЎ»иўЂиўиўљиў›иўњиўџиў иўЁиўЄиўєиўЅиўѕиЈЂиЈЉ",4,"иЈ‘иЈ’иЈ“иЈ›иЈћиЈ§иЈЇиЈ°иЈ±иЈµиЈ·и¤Ѓи¤†и¤Ќи¤Ћи¤Џи¤•и¤–и¤и¤™и¤љи¤њи¤ и¤¦и¤§и¤Ёи¤°и¤±и¤Іи¤µи¤№и¤єи¤ѕиҐЂиҐ‚иҐ…иҐ†иҐ‰иҐЏиҐ’иҐ—иҐљиҐ›иҐњиҐЎиҐўиҐЈиҐ«иҐ®иҐ°иҐіиҐµиҐє"],
    ["8fdda1","иҐ»иҐјиҐЅи¦‰и¦Ќи¦ђи¦”и¦•и¦›и¦њи¦џи¦ и¦Ґи¦°и¦ґи¦µи¦¶и¦·и¦ји§”",4,"и§Ґи§©и§«и§­и§±и§іи§¶и§№и§Ѕи§їиЁ„иЁ…иЁ‡иЁЏиЁ‘иЁ’иЁ”иЁ•иЁћиЁ иЁўиЁ¤иЁ¦иЁ«иЁ¬иЁЇиЁµиЁ·иЁЅиЁѕи©Ђи©ѓи©…и©‡и©‰и©Ќи©Ћи©“и©–и©—и©и©њи©ќи©Ўи©Ґи©§и©µи©¶и©·и©№и©єи©»и©ѕи©їиЄЂиЄѓиЄ†иЄ‹иЄЏиЄђиЄ’иЄ–иЄ—иЄ™иЄџиЄ§иЄ©иЄ®иЄЇиЄі"],
    ["8fdea1","иЄ¶иЄ·иЄ»иЄѕи«ѓи«†и«€и«‰и«Љи«‘и«“и«”и«•и«—и«ќи«џи«¬и«°и«ґи«µи«¶и«ји«їи¬…и¬†и¬‹и¬‘и¬њи¬ћи¬џи¬Љи¬­и¬°и¬·и¬ји­‚",4,"и­€и­’и­“и­”и­™и­Ќи­ћи­Ји­­и­¶и­ёи­№и­ји­ѕи®Ѓи®„и®…и®‹и®Ќи®Џи®”и®•и®њи®ћи®џи°ёи°№и°Ѕи°ѕи±…и±‡и±‰и±‹и±Џи±‘и±“и±”и±—и±и±›и±ќи±™и±Ји±¤и±¦и±Ёи±©и±­и±іи±µи±¶и±»и±ѕиІ†"],
    ["8fdfa1","иІ‡иІ‹иІђиІ’иІ“иІ™иІ›иІњиІ¤иІ№иІєиі…иі†иі‰иі‹иіЏиі–иі•иі™иіќиіЎиіЁиі¬иіЇиі°иіІиіµиі·иіёиіѕиіїиґЃиґѓиґ‰иґ’иґ—иґ›иµҐиµ©иµ¬иµ®иµїи¶‚и¶„и¶€и¶Ќи¶ђи¶‘и¶•и¶ћи¶џи¶ и¶¦и¶«и¶¬и¶Їи¶Іи¶µи¶·и¶№и¶»и·Ђи·…и·†и·‡и·€и·Љи·Ћи·‘и·”и·•и·—и·™и·¤и·Ґи·§и·¬и·°и¶ји·±и·Іи·ґи·ЅиёЃиё„иё…иё†иё‹иё‘иё”иё–иё иёЎиёў"],
    ["8fe0a1","иёЈиё¦иё§иё±иёіиё¶иё·иёёиё№иёЅи№Ђи№Ѓи№‹и№Ќи№Ћи№Џи№”и№›и№њи№ќи№ћи№Ўи№ўи№©и№¬и№­и№Їи№°и№±и№№и№єи№»иє‚иєѓиє‰иєђиє’иє•иєљиє›иєќиєћиєўиє§иє©иє­иє®иєіиєµиєєиє»и»Ђи»Ѓи»ѓи»„и»‡и»Џи»‘и»”и»њи»Ёи»®и»°и»±и»·и»№и»єи»­ијЂиј‚иј‡иј€ијЏијђиј–иј—ијијћиј ијЎијЈијҐиј§ијЁиј¬иј­иј®ијґијµиј¶иј·ијєиЅЂиЅЃ"],
    ["8fe1a1","иЅѓиЅ‡иЅЏиЅ‘",4,"иЅиЅќиЅћиЅҐиѕќиѕ иѕЎиѕ¤иѕҐиѕ¦иѕµиѕ¶иѕёиѕѕиїЂиїЃиї†иїЉиї‹иїЌиїђиї’иї“иї•иї иїЈиї¤иїЁиї®иї±иїµиї¶иї»иїѕйЂ‚йЂ„йЂ€йЂЊйЂйЂ›йЂЁйЂ©йЂЇйЂЄйЂ¬йЂ­йЂійЂґйЂ·йЂїйЃѓйЃ„йЃЊйЃ›йЃќйЃўйЃ¦йЃ§йЃ¬йЃ°йЃґйЃ№й‚…й‚€й‚‹й‚Њй‚Ћй‚ђй‚•й‚—й‚й‚™й‚›й‚ й‚Ўй‚ўй‚Ґй‚°й‚Ій‚ій‚ґй‚¶й‚ЅйѓЊй‚ѕйѓѓ"],
    ["8fe2a1","йѓ„йѓ…йѓ‡йѓ€йѓ•йѓ—йѓйѓ™йѓњйѓќйѓџйѓҐйѓ’йѓ¶йѓ«йѓЇйѓ°йѓґйѓѕйѓїй„Ђй„„й„…й„†й„€й„Ќй„ђй„”й„–й„—й„й„љй„њй„ћй„ й„Ґй„ўй„Јй„§й„©й„®й„Їй„±й„ґй„¶й„·й„№й„єй„јй„Ѕй…ѓй…‡й…€й…Џй…“й…—й…™й…љй…›й…Ўй…¤й…§й…­й…ґй…№й…єй…»й†Ѓй†ѓй†…й††й†Љй†Ћй†‘й†“й†”й†•й†й†ћй†Ўй†¦й†Ёй†¬й†­й†®й†°й†±й†Ій†ій†¶й†»й†јй†Ѕй†ї"],
    ["8fe3a1","й‡‚й‡ѓй‡…й‡“й‡”й‡—й‡™й‡љй‡ћй‡¤й‡Ґй‡©й‡Єй‡¬",5,"й‡·й‡№й‡»й‡Ѕй€Ђй€Ѓй€„й€…й€†й€‡й€‰й€Љй€Њй€ђй€’й€“й€–й€й€њй€ќй€Јй€¤й€Ґй€¦й€Ёй€®й€Їй€°й€ій€µй€¶й€ёй€№й€єй€јй€ѕй‰Ђй‰‚й‰ѓй‰†й‰‡й‰Љй‰Ќй‰Ћй‰Џй‰‘й‰й‰™й‰њй‰ќй‰ й‰Ўй‰Ґй‰§й‰Ёй‰©й‰®й‰Їй‰°й‰µ",4,"й‰»й‰јй‰Ѕй‰їйЉ€йЉ‰йЉЉйЉЌйЉЋйЉ’йЉ—"],
    ["8fe4a1","йЉ™йЉџйЉ йЉ¤йЉҐйЉ§йЉЁйЉ«йЉЇйЉІйЉ¶йЉёйЉєйЉ»йЉјйЉЅйЉї",4,"й‹…й‹†й‹‡й‹€й‹‹й‹Њй‹Ќй‹Ћй‹ђй‹“й‹•й‹—й‹й‹™й‹њй‹ќй‹џй‹ й‹Ўй‹Јй‹Ґй‹§й‹Ёй‹¬й‹®й‹°й‹№й‹»й‹їйЊЂйЊ‚йЊ€йЊЌйЊ‘йЊ”йЊ•йЊњйЊќйЊћйЊџйЊЎйЊ¤йЊҐйЊ§йЊ©йЊЄйЊійЊґйЊ¶йЊ·йЌ‡йЌ€йЌ‰йЌђйЌ‘йЌ’йЌ•йЌ—йЌйЌљйЌћйЌ¤йЌҐйЌ§йЌ©йЌЄйЌ­йЌЇйЌ°йЌ±йЌійЌґйЌ¶"],
    ["8fe5a1","йЌєйЌЅйЌїйЋЂйЋЃйЋ‚йЋ€йЋЉйЋ‹йЋЌйЋЏйЋ’йЋ•йЋйЋ›йЋћйЋЎйЋЈйЋ¤йЋ¦йЋЁйЋ«йЋґйЋµйЋ¶йЋєйЋ©йЏЃйЏ„йЏ…йЏ†йЏ‡йЏ‰",4,"йЏ“йЏ™йЏњйЏћйЏџйЏўйЏ¦йЏ§йЏ№йЏ·йЏёйЏєйЏ»йЏЅйђЃйђ‚йђ„йђ€йђ‰йђЌйђЋйђЏйђ•йђ–йђ—йђџйђ®йђЇйђ±йђІйђійђґйђ»йђїйђЅй‘ѓй‘…й‘€й‘Љй‘Њй‘•й‘™й‘њй‘џй‘Ўй‘Јй‘Ёй‘«й‘­й‘®й‘Їй‘±й‘Ій’„й’ѓй•ёй•№"],
    ["8fe6a1","й•ѕй–„й–€й–Њй–Ќй–Ћй–ќй–ћй–џй–Ўй–¦й–©й–«й–¬й–ґй–¶й–єй–Ѕй–їй—†й—€й—‰й—‹й—ђй—‘й—’й—“й—™й—љй—ќй—ћй—џй— й—¤й—¦йќйћйўй¤йҐй¦й¬й±йій·йёй№йєйјйЅй™Ѓй™’й™”й™–й™—й™й™Ўй™®й™ґй™»й™јй™ѕй™їйљЃйљ‚йљѓйљ„йљ‰йљ‘йљ–йљљйљќйљџйљ¤йљҐйљ¦йљ©йљ®йљЇйљійљєй›Љй›’е¶Ій›й›љй›ќй›ћй›џй›©й›Їй›±й›єйњ‚"],
    ["8fe7a1","йњѓйњ…йњ‰йњљйњ›йњќйњЎйњўйњЈйњЁйњ±йњійќЃйќѓйќЉйќЋйќЏйќ•йќ—йќйќљйќ›йќЈйќ§йќЄйќ®йќійќ¶йќ·йќёйќ»йќЅйќїйћЂйћ‰йћ•йћ–йћ—йћ™йћљйћћйћџйћўйћ¬йћ®йћ±йћІйћµйћ¶йћёйћ№йћєйћјйћѕйћїйџЃйџ„йџ…йџ‡йџ‰йџЉйџЊйџЌйџЋйџђйџ‘йџ”йџ—йџйџ™йџќйџћйџ йџ›йџЎйџ¤йџЇйџ±йџґйџ·йџёйџєй ‡й Љй ™й Ќй Ћй ”й –й њй ћй  й Јй ¦"],
    ["8fe8a1","й «й ®й Їй °й Ій ій µй Ґй ѕйЎ„йЎ‡йЎЉйЎ‘йЎ’йЎ“йЎ–йЎ—йЎ™йЎљйЎўйЎЈйЎҐйЎ¦йЎЄйЎ¬йў«йў­йў®йў°йўґйў·йўёйўєйў»йўїйЈ‚йЈ…йЈ€йЈЊйЈЎйЈЈйЈҐйЈ¦йЈ§йЈЄйЈійЈ¶й¤‚й¤‡й¤€й¤‘й¤•й¤–й¤—й¤љй¤›й¤њй¤џй¤ўй¤¦й¤§й¤«й¤±",4,"й¤№й¤єй¤»й¤јйҐЂйҐЃйҐ†йҐ‡йҐ€йҐЌйҐЋйҐ”йҐйҐ™йҐ›йҐњйҐћйҐџйҐ й¦›й¦ќй¦џй¦¦й¦°й¦±й¦Ій¦µ"],
    ["8fe9a1","й¦№й¦єй¦Ѕй¦їй§ѓй§‰й§“й§”й§™й§љй§њй§ћй§§й§Єй§«й§¬й§°й§ґй§µй§№й§Ѕй§ѕйЁ‚йЁѓйЁ„йЁ‹йЁЊйЁђйЁ‘йЁ–йЁћйЁ йЁўйЁЈйЁ¤йЁ§йЁ­йЁ®йЁійЁµйЁ¶йЁёй©‡й©Ѓй©„й©Љй©‹й©Њй©Ћй©‘й©”й©–й©ќйЄЄйЄ¬йЄ®йЄЇйЄІйЄґйЄµйЄ¶йЄ№йЄ»йЄѕйЄїй«Ѓй«ѓй«†й«€й«Ћй«ђй«’й«•й«–й«—й«›й«њй« й«¤й«Ґй«§й«©й«¬й«Ій«ій«µй«№й«єй«Ѕй«ї",4],
    ["8feaa1","й¬„й¬…й¬€й¬‰й¬‹й¬Њй¬Ќй¬Ћй¬ђй¬’й¬–й¬™й¬›й¬њй¬ й¬¦й¬«й¬­й¬ій¬ґй¬µй¬·й¬№й¬єй¬Ѕй­€й­‹й­Њй­•й­–й­—й­›й­ћй­Ўй­Јй­Ґй­¦й­Ёй­Є",4,"й­ій­µй­·й­ёй­№й­їй®Ђй®„й®…й®†й®‡й®‰й®Љй®‹й®Ќй®Џй®ђй®”й®љй®ќй®ћй®¦й®§й®©й®¬й®°й®±й®Ій®·й®ёй®»й®јй®ѕй®їйЇЃйЇ‡йЇ€йЇЋйЇђйЇ—йЇйЇќйЇџйЇҐйЇ§йЇЄйЇ«йЇЇйЇійЇ·йЇё"],
    ["8feba1","йЇ№йЇєйЇЅйЇїй°Ђй°‚й°‹й°Џй°‘й°–й°й°™й°љй°њй°ћй°ўй°Јй°¦",4,"й°±й°µй°¶й°·й°Ѕй±Ѓй±ѓй±„й±…й±‰й±Љй±Ћй±Џй±ђй±“й±”й±–й±й±›й±ќй±ћй±џй±Јй±©й±Єй±њй±«й±Ёй±®й±°й±Ій±µй±·й±»йі¦йіІйі·йі№йґ‹йґ‚йґ‘йґ—йґйґњйґќйґћйґЇйґ°йґІйґійґґйґєйґјйµ…йґЅйµ‚йµѓйµ‡йµЉйµ“йµ”йµџйµЈйµўйµҐйµ©йµЄйµ«йµ°йµ¶йµ·йµ»"],
    ["8feca1","йµјйµѕй¶ѓй¶„й¶†й¶Љй¶Ќй¶Ћй¶’й¶“й¶•й¶–й¶—й¶й¶Ўй¶Єй¶¬й¶®й¶±й¶µй¶№й¶јй¶їй·ѓй·‡й·‰й·Љй·”й·•й·–й·—й·љй·ћй·џй· й·Ґй·§й·©й·«й·®й·°й·ій·ґй·ѕйёЉйё‚йё‡йёЋйёђйё‘йё’йё•йё–йё™йёњйёќй№єй№»й№јйєЂйє‚йєѓйє„йє…йє‡йєЋйєЏйє–йєйє›йєћйє¤йєЁйє¬йє®йєЇйє°йєійєґйєµй»†й»€й»‹й»•й»џй»¤й»§й»¬й»­й»®й»°й»±й»Ій»µ"],
    ["8feda1","й»ёй»їйј‚йјѓйј‰йјЏйјђйј‘йј’йј”йј–йј—йј™йјљйј›йјџйјўйј¦йјЄйј«йјЇйј±йјІйјґйј·йј№йјєйјјйјЅйјїйЅЃйЅѓ",4,"йЅ“йЅ•йЅ–йЅ—йЅйЅљйЅќйЅћйЅЁйЅ©йЅ­",4,"йЅійЅµйЅєйЅЅйѕЏйѕђйѕ‘йѕ’йѕ”йѕ–йѕ—йѕћйѕЎйѕўйѕЈйѕҐ"]
    ]
    
    },{}],21:[function(require,module,exports){
    module.exports={"uChars":[128,165,169,178,184,216,226,235,238,244,248,251,253,258,276,284,300,325,329,334,364,463,465,467,469,471,473,475,477,506,594,610,712,716,730,930,938,962,970,1026,1104,1106,8209,8215,8218,8222,8231,8241,8244,8246,8252,8365,8452,8454,8458,8471,8482,8556,8570,8596,8602,8713,8720,8722,8726,8731,8737,8740,8742,8748,8751,8760,8766,8777,8781,8787,8802,8808,8816,8854,8858,8870,8896,8979,9322,9372,9548,9588,9616,9622,9634,9652,9662,9672,9676,9680,9702,9735,9738,9793,9795,11906,11909,11913,11917,11928,11944,11947,11951,11956,11960,11964,11979,12284,12292,12312,12319,12330,12351,12436,12447,12535,12543,12586,12842,12850,12964,13200,13215,13218,13253,13263,13267,13270,13384,13428,13727,13839,13851,14617,14703,14801,14816,14964,15183,15471,15585,16471,16736,17208,17325,17330,17374,17623,17997,18018,18212,18218,18301,18318,18760,18811,18814,18820,18823,18844,18848,18872,19576,19620,19738,19887,40870,59244,59336,59367,59413,59417,59423,59431,59437,59443,59452,59460,59478,59493,63789,63866,63894,63976,63986,64016,64018,64021,64025,64034,64037,64042,65074,65093,65107,65112,65127,65132,65375,65510,65536],"gbChars":[0,36,38,45,50,81,89,95,96,100,103,104,105,109,126,133,148,172,175,179,208,306,307,308,309,310,311,312,313,341,428,443,544,545,558,741,742,749,750,805,819,820,7922,7924,7925,7927,7934,7943,7944,7945,7950,8062,8148,8149,8152,8164,8174,8236,8240,8262,8264,8374,8380,8381,8384,8388,8390,8392,8393,8394,8396,8401,8406,8416,8419,8424,8437,8439,8445,8482,8485,8496,8521,8603,8936,8946,9046,9050,9063,9066,9076,9092,9100,9108,9111,9113,9131,9162,9164,9218,9219,11329,11331,11334,11336,11346,11361,11363,11366,11370,11372,11375,11389,11682,11686,11687,11692,11694,11714,11716,11723,11725,11730,11736,11982,11989,12102,12336,12348,12350,12384,12393,12395,12397,12510,12553,12851,12962,12973,13738,13823,13919,13933,14080,14298,14585,14698,15583,15847,16318,16434,16438,16481,16729,17102,17122,17315,17320,17402,17418,17859,17909,17911,17915,17916,17936,17939,17961,18664,18703,18814,18962,19043,33469,33470,33471,33484,33485,33490,33497,33501,33505,33513,33520,33536,33550,37845,37921,37948,38029,38038,38064,38065,38066,38069,38075,38076,38078,39108,39109,39113,39114,39115,39116,39265,39394,189000]}
    },{}],22:[function(require,module,exports){
    module.exports=[
    ["a140","о“†",62],
    ["a180","о”…",32],
    ["a240","о”¦",62],
    ["a280","о•Ґ",32],
    ["a2ab","оќ¦",5],
    ["a2e3","в‚¬оќ­"],
    ["a2ef","оќ®оќЇ"],
    ["a2fd","оќ°оќ±"],
    ["a340","о–†",62],
    ["a380","о—…",31,"гЂЂ"],
    ["a440","о—¦",62],
    ["a480","оҐ",32],
    ["a4f4","оќІ",10],
    ["a540","о™†",62],
    ["a580","ољ…",32],
    ["a5f7","оќЅ",7],
    ["a640","ољ¦",62],
    ["a680","о›Ґ",32],
    ["a6b9","оћ…",7],
    ["a6d9","оћЌ",6],
    ["a6ec","оћ”оћ•"],
    ["a6f3","оћ–"],
    ["a6f6","оћ—",8],
    ["a740","оњ†",62],
    ["a780","оќ…",32],
    ["a7c2","оћ ",14],
    ["a7f2","оћЇ",12],
    ["a896","оћј",10],
    ["a8bc","оџ‡"],
    ["a8bf","З№"],
    ["a8c1","оџ‰оџЉоџ‹оџЊ"],
    ["a8ea","оџЌ",20],
    ["a958","оџў"],
    ["a95b","оџЈ"],
    ["a95d","оџ¤оџҐоџ¦"],
    ["a989","гЂѕвї°",11],
    ["a997","оџґ",12],
    ["a9f0","о Ѓ",14],
    ["aaa1","оЂЂ",93],
    ["aba1","оЃћ",93],
    ["aca1","о‚ј",93],
    ["ada1","о„љ",93],
    ["aea1","о…ё",93],
    ["afa1","о‡–",93],
    ["d7fa","о ђ",4],
    ["f8a1","о€ґ",93],
    ["f9a1","оЉ’",93],
    ["faa1","о‹°",93],
    ["fba1","оЌЋ",93],
    ["fca1","оЋ¬",93],
    ["fda1","ођЉ",93],
    ["fe50","вєЃо –о —о вє„г‘іг‘‡вє€вє‹о ћг–ћгљгЋвєЊвє—гҐ®г¤о ¦г§Џг§џг©іг§ђо «о ¬г­Ћг±®гі вє§о ±о ІвєЄдЃ–д…џвє®дЊ·вєівє¶вє·о »дЋ±дЋ¬вє»дЏќд“–д™Ўд™ЊоЎѓ"],
    ["fe80","дњЈдњ©дќјдћЌв»ЉдҐ‡дҐєдҐЅд¦‚д¦ѓд¦…д¦†д¦џд¦›д¦·д¦¶оЎ”оЎ•дІЈдІџдІ дІЎд±·дІўдґ“",6,"д¶®оЎ¤о‘Ё",93]
    ]
    
    },{}],23:[function(require,module,exports){
    module.exports=[
    ["0","\u0000",128],
    ["a1","пЅЎ",62],
    ["8140","гЂЂгЂЃгЂ‚пјЊпјЋгѓ»пјљпј›пјџпјЃг‚›г‚њВґпЅЂВЁпјѕпїЈпјїгѓЅгѓѕг‚ќг‚ћгЂѓд»ќгЂ…гЂ†гЂ‡гѓјвЂ•вЂђпјЏпјјпЅћв€ҐпЅњвЂ¦вЂҐвЂвЂ™вЂњвЂќпј€пј‰гЂ”гЂ•пј»пјЅпЅ›пЅќгЂ€",9,"пј‹пјЌВ±Г—"],
    ["8180","Г·пјќв‰ пјњпјћв‰¦в‰§в€ћв€ґв™‚в™ЂВ°вЂІвЂів„ѓпїҐпј„пї пїЎпј…пјѓпј†пјЉпј В§в†в…в—‹в—Џв—Ћв—‡в—†в–Ўв– в–ів–Ів–Ѕв–јвЂ»гЂ’в†’в†ђв†‘в†“гЂ“"],
    ["81b8","в€€в€‹вЉ†вЉ‡вЉ‚вЉѓв€Єв€©"],
    ["81c8","в€§в€Ёпїўв‡’в‡”в€Ђв€ѓ"],
    ["81da","в€ вЉҐвЊ’в€‚в€‡в‰Ўв‰’в‰Єв‰«в€љв€Ѕв€ќв€µв€«в€¬"],
    ["81f0","в„«вЂ°в™Їв™­в™ЄвЂ вЂЎВ¶"],
    ["81fc","в—Ї"],
    ["824f","пјђ",9],
    ["8260","пјЎ",25],
    ["8281","пЅЃ",25],
    ["829f","гЃЃ",82],
    ["8340","г‚Ў",62],
    ["8380","гѓ ",22],
    ["839f","О‘",16,"ОЈ",6],
    ["83bf","О±",16,"Пѓ",6],
    ["8440","Рђ",5,"РЃР–",25],
    ["8470","Р°",5,"С‘Р¶",7],
    ["8480","Рѕ",17],
    ["849f","в”Ђв”‚в”Њв”ђв”в””в”њв”¬в”¤в”ґв”јв”Ѓв”ѓв”Џв”“в”›в”—в”Јв”ів”«в”»в•‹в” в”Їв”Ёв”·в”їв”ќв”°в”Ґв”ёв•‚"],
    ["8740","в‘ ",19,"в… ",9],
    ["875f","гЌ‰гЊ”гЊўгЌЌгЊгЊ§гЊѓгЊ¶гЌ‘гЌ—гЊЌгЊ¦гЊЈгЊ«гЌЉгЊ»гЋњгЋќгЋћгЋЋгЋЏгЏ„гЋЎ"],
    ["877e","гЌ»"],
    ["8780","гЂќгЂџв„–гЏЌв„ЎгЉ¤",4,"г€±г€Іг€№гЌѕгЌЅгЌјв‰’в‰Ўв€«в€®в€‘в€љвЉҐв€ в€џвЉїв€µв€©в€Є"],
    ["889f","дєње”–еЁѓйїе“Ђж„›жЊЁе§¶йЂўи‘µиЊњз©ђж‚ЄжЏЎжёҐж—­и‘¦иЉ¦йЇµжў“ењ§ж–Ўж‰±е®›е§ђи™»йЈґзµўз¶ѕй®Ћж€–зІџиў·е®‰еєµжЊ‰жљ—жЎ€й—‡йћЌжќЏд»ҐдјЉдЅЌдѕќеЃ‰е›Іе¤·е§”еЁЃе°‰жѓџж„Џж…°ж“ж¤…з‚єз•Џз•°з§»з¶­з·ЇиѓѓиђЋиЎЈи¬‚йЃ•йЃєеЊ»дє•дєҐеџџи‚ІйѓЃзЈЇдёЂеЈ±жєўйЂёзЁІиЊЁиЉ‹й°Їе…ЃеЌ°е’Ѕе“Ўе› е§»еј•йЈІж·«иѓ¤и”­"],
    ["8940","й™ўй™°йљ йџ»еђ‹еЏіе®‡зѓЏзѕЅиї‚й›ЁеЌЇйµњзЄєдё‘зў“и‡јжё¦ее”„ж¬ќи”љй°»е§ҐеЋ©жµ¦з“њй–Џе™‚дє‘йЃ‹й›ІиЌЏй¤ЊеЏЎе–¶е¬°еЅ±ж ж›іж „ж°ёжііжґ©з‘›з›€з©Ћй ґи‹±иЎ›и© й‹­ж¶Із–«з›Љй§…ж‚¦и¬Ѓи¶Љй–Іж¦ЋеЋ­е††"],
    ["8980","ењ’е °еҐ„е®ґе»¶жЂЁжЋ©жЏґжІїжј”з‚Ћз„”з…™з‡•зЊїзёЃи‰¶и‹‘и–—йЃ й‰›йґ›еЎ©ж–јж±љз”Ґе‡№е¤®еҐҐеѕЂеїњжЉјж—єжЁЄж¬§ж®ґзЋ‹зїЃиҐ–йґ¬йґЋй»„еІЎжІ–иЌ»е„„е±‹ж†¶и‡†жЎ¶з‰Ўд№™дїєеЌёжЃ©жё©з©Џйџідё‹еЊ–д»®дЅ•дјЅдѕЎдЅіеЉ еЏЇе‰е¤Џе«Ѓе®¶еЇЎз§‘жљ‡жћњжћ¶ж­ЊжІізЃ«зЏ‚з¦Ќз¦ѕзЁјз®‡иЉ±и‹›иЊ„иЌ·иЏЇиЏ“иќ¦иЄІе©иІЁиї¦йЃЋйњћиљЉдї„еіЁж€‘з‰™з”»и‡ҐиЉЅи›ѕиіЂй›…й¤“й§•д»‹дјљи§Је›ћеЎЉеЈЉе»»еї«жЂЄж‚”жЃўж‡ђж€’ж‹ђж”№"],
    ["8a40","й­Ѓж™¦жў°жµ·зЃ°з•Њзљ†зµµиЉҐиџ№й–‹йљЋиІќе‡±еЉѕе¤–е’іе®іеґ–ж…Ёж¦‚ж¶ЇзўЌи“‹иЎ—и©ІйЋ§йЄёжµ¬й¦Ёи›™ећЈжџїи›Ћй€ЋеЉѓељ‡еђ„е»“ж‹Ўж’№ж јж ёж®»зЌІзўєз©«и¦љи§’иµ«ијѓйѓ­й–Јйљ”йќ©е­¦еІіжҐЅйЎЌйЎЋжЋ›з¬ жЁ«"],
    ["8a80","ж©їжў¶й°ЌжЅџе‰Іе–ќжЃ°ж‹¬жґ»жё‡ж»‘и‘›и¤ђиЅ„дё”й°№еЏ¶ж¤›жЁєйћ„ж Єе…њз«ѓи’Ій‡њйЋЊе™›йґЁж ўиЊ…иђ±зІҐе€€и‹…з“¦д№ѕдѕѓе† еЇ’е€Ље‹е‹§е·»е–ље Єе§¦е®Ње®еЇ›е№Іе№№ж‚Јж„џж…Јж†ѕжЏ›ж•ўжџ‘жЎ“жЈєж¬ѕж­“ж±—жјўжѕ—жЅ…з’°з”з›Јзњ‹з«їз®Ўз°Ўз·©зј¶зї°и‚ќи‰¦иЋћи¦іи«ЊиІ«й‚„й‘‘й–“й–‘й–ўй™Ґйџ“й¤Ёи€дёёеђ«еІёе·ЊзЋ©з™ЊзњјеІ©зї«иґ‹й›Ѓй ‘йЎ”йЎдјЃдјЋеЌ±е–ње™ЁеџєеҐ‡е¬‰еЇ„еІђеёЊе№ѕеїЊжЏ®жњєж——ж—ўжњџжЈ‹жЈ„"],
    ["8b40","ж©џеё°жЇ…ж°—ж±Ѕз•їзҐ€е­ЈзЁЂзґЂеѕЅи¦ЏиЁиІґиµ·и»ЊијќйЈўйЁЋй¬јдєЂеЃЅе„Ђе¦“е®њж€ЇжЉЂж“¬ж¬єзЉ з–‘зҐ‡зѕ©иџ»иЄји­°жЋ¬иЏЉйћ еђ‰еђѓе–«жЎ”ж©и©°з §жќµй»ЌеЌґе®ўи„љи™ђйЂ†дёд№…д»‡дј‘еЏЉеђёе®®еј“жЂҐж•‘"],
    ["8b80","жњЅж±‚ж±ІжіЈзЃёзђѓз©¶зЄ®з¬€зґљзіѕзµ¦ж—§з‰›еЋ»е±…е·Ёж‹’ж‹ жЊ™жё и™љиЁ±и·ќй‹ёжјЃз¦¦й­љдєЁдє«дє¬дѕ›дѕ еѓ‘е…‡з«¶е…±е‡¶еЌ”еЊЎеЌїеЏ«е–¬еўѓеіЎеј·еЅЉжЂЇжЃђжЃ­жЊџж•™ж©‹жіЃз‹‚з‹­зџЇиѓёи„…и€€и•Ћйѓ·йЏЎйџїйҐ—й©љд»°е‡ќе°­жљЃжҐ­е±Ђж›ІжҐµзЋ‰жЎђзІЃеѓ…е‹¤еќ‡е·ѕйЊ¦ж–¤ж¬Јж¬Ѕзђґз¦Ѓз¦Ѕз­‹з·ЉиЉ№иЏЊиЎїиҐџи¬№иї‘й‡‘еђџйЉЂд№ќеЂ¶еЏҐеЊєз‹—зЋ–зџ©и‹¦иєЇй§†й§€й§’е…·ж„љи™ће–°з©єеЃ¶еЇ“йЃ‡йљ…дёІж«›й‡§е±‘е±€"],
    ["8c40","жЋзЄџжІ“йќґиЅЎзЄЄз†Љйљ€зІ‚ж —з№°жЎ‘йЌ¬е‹Іеђ›и–«иЁ“зѕ¤и»ЌйѓЎеЌ¦иў€зҐЃдї‚е‚ѕе€‘е…„е•“ењ­зЏЄећ‹еҐ‘еЅўеѕ„жЃµж…¶ж…§ж†©жЋІжђєж•¬ж™ЇжЎ‚жё“з•¦зЁЅзі»зµЊз¶™з№‹зЅ«иЊЋиЌЉи›ЌиЁ€и©Ји­¦и»Ѕй љй¶ЏиЉёиїЋйЇЁ"],
    ["8c80","еЉ‡ж€џж’ѓжїЂйљ™жЎЃе‚‘ж¬ ж±єжЅ”з©ґзµђиЎЂиЁЈжњ€д»¶еЂ№еЂ¦еЃҐе…је€ёе‰Је–§ењЏе …е«Ње»єж†Іж‡ёж‹іжЌІж¤њжЁ©з‰ЅзЉ¬зЊ®з ”зЎЇзµ№зњЊи‚©и¦‹и¬™иіўи»’йЃЈйЌµй™єйЎ•йЁ“й№ёе…ѓеЋџеЋіе№»еј¦жё›жєђзЋ„зЏѕзµѓи€·иЁЂи«єй™ђд№ЋеЂ‹еЏ¤е‘је›єе§‘е­¤е·±еє«еј§ж€ёж•…жћЇж№–з‹ђзіЉиўґи‚ЎиѓЎиЏ°и™ЋиЄ‡и·Ёй€·й›‡йЎ§йј“дє”дє’дјЌеЌ€е‘‰еђѕеЁЇеѕЊеѕЎж‚џжў§жЄЋз‘љзўЃиЄћиЄ¤и­·й†ђд№ћйЇ‰дє¤дЅјдѕЇеЂ™еЂ–е…‰е…¬еЉџеЉ№е‹ѕеЋљеЏЈеђ‘"],
    ["8d40","еђЋе–‰еќ‘ећўеҐЅе­”е­ќе®Џе·Ґе·§е··е№ёеєѓеєљеє·ејжЃ’ж…ЊжЉ—ж‹жЋ§ж”»ж‚ж™ѓж›ґжќ­ж Ўжў—ж§‹ж±џжґЄжµ©жёЇжєќз”Ізљ‡зЎ¬зЁїзі зґ…зґзµћз¶±иЂ•иЂѓи‚Їи‚±и…”и†Џи€ЄиЌ’иЎЊиЎЎи¬›иІўиіјйѓЉй…µй‰±з їй‹јй–¤й™Ќ"],
    ["8d80","й …й¦™й«йґ»е‰›еЉ«еЏ·еђ€еЈ•ж‹·жї и±ЄиЅџйє№е…‹е€»е‘Ље›Ѕз©Ђй…·йµ й»’зЌ„жј‰и…°з”‘еїЅжѓљйЄЁз‹›иѕјж­¤й ѓд»Ље›°еќ¤еўѕе©љжЃЁж‡‡жЏж†ж №жў±ж··з—•зґєи‰®й­‚дє›дЅђеЏ‰е”†еµЇе·¦е·®жџ»жІ™з‘із ‚и©ђйЋ–иЈџеќђеє§жЊ«е‚µе‚¬е†ЌжњЂе“‰еЎће¦»е®°еЅ©ж‰ЌжЋЎж Ѕж­іжё€зЃЅй‡‡зЉЂз •з ¦зҐ­ж–Ћзґ°иЏњиЈЃиј‰йљ›е‰¤ењЁжќђзЅЄиІЎе†ґеќ‚йЄе єж¦Љи‚ґе’ІеґЋеџјзў•й·єдЅње‰Ље’‹жђѕжЁжњ”жџµзЄ„з­–зґўйЊЇжЎњй®­з¬№еЊ™е†Ље€·"],
    ["8e40","еЇџж‹¶ж’®ж“¦жњ­ж®єи–©й›‘зљђйЇ–жЌЊйЊ†й®«зљїж™’дё‰е‚еЏ‚е±±жѓЁж’’ж•ЈжЎџз‡¦зЏЉз”Јз®—зє‚иљ•и®ѓиі›й…ёй¤ђж–¬жљ«ж®‹д»•д»”дјєдЅїе€єеЏёеЏІе—Је››еЈ«е§‹е§‰е§їе­ђе±Ќеё‚её«еї—жЂќжЊ‡ж”Їе­њж–Їж–Ѕж—Ёжћќж­ў"],
    ["8e80","ж­»ж°ЏзЌ…зҐ‰з§Ѓзіёзґ™зґ«и‚ўи„‚и‡іи¦–и©ћи©©и©¦иЄЊи«®иі‡иіњй›ЊйЈјж­Їдє‹дјјдѕЌе…ђе­—еЇєж…€жЊЃж™‚ж¬Ўж»‹жІ»з€ѕз’Ѕз—”зЈЃз¤єиЂЊиЂіи‡Єи’”иѕћж±ђй№їејЏи­йґ«з«єи»ёе®Ќй›«дёѓеЏ±еџ·е¤±е«‰е®¤ж‚‰ж№їжј†з–ѕиіЄе®џи”ЂзЇ еЃІжџґиЉќе±Ўи•Љзёћи€Ће†™е°„жЌЁиµ¦ж–њз…®з¤ѕзґ—иЂ…и¬ќи»ЉйЃ®и›‡й‚ЄеЂџе‹єе°єжќ“зЃјз€µй…Њй‡€йЊ«и‹ҐеЇ‚еј±жѓ№дё»еЏ–е®€ж‰‹жњ±ж®Љз‹©зЏ зЁ®и…«и¶Јй…’й¦–е„’еЏ—е‘ЄеЇїжЋ€жЁ№з¶¬йњЂе›љеЏЋе‘Ё"],
    ["8f40","е®—е°±е·ћдї®ж„Ѓж‹ѕжґІз§Ђз§‹зµ‚з№Ќзї’и‡­и€џи’ђиЎ†иҐІи®ђи№ґијЇйЂ±й…‹й…¬й›†й†њд»ЂдЅЏе……еЌЃеѕ“ж€Ћжџ”ж±Ѓжё‹зЌЈзё¦й‡ЌйЉѓеЏ”е¤™е®їж·‘зҐќзё®зІ›еЎѕз†џе‡єиЎ“иї°дїЉеі»жҐзћ¬з«Ји€њй§їе‡†еѕЄж—¬жҐЇж®‰ж·і"],
    ["8f80","жє–жЅ¤з›ѕзґ”е·ЎйЃµй†‡й †е‡¦е€ќж‰Ђжљ‘ж›™жёљеє¶з·’зЅІж›ёи–Їи—·и«ёеЉ©еЏ™еҐіеєЏеѕђжЃ•й‹¤й™¤е‚·е„џе‹ќеЊ еЌ‡еЏ¬е“Ёе•†е”±е—еҐЁе¦ѕеЁје®µе°†е°Џе°‘е°љеє„еєЉе» еЅ°ж‰їжЉ„ж‹›жЋЊжЌ·ж‡жЊж­ж™¶жќѕжўўжЁџжЁµжІјж¶€жё‰ж№з„јз„¦з…§з—‡зњЃзЎќз¤ЃзҐҐз§°з« з¬‘зІ§зґ№и‚–иЏ–и’‹и•‰иЎќиЈіиЁџиЁји©”и©іи±Ўиіћй†¤й‰¦йЌѕйђйљњйћдёЉдё€дёћд№—е†—е‰°еџЋе ґеЈЊе¬ўеёёжѓ…ж“ѕжќЎжќ–жµ„зЉ¶з•із©Ји’ёи­Ій†ёйЊ е±еџґйЈѕ"],
    ["9040","ж‹­ж¤Ќж®–з‡­з№”иЃ·и‰Іи§¦йЈџиќ•иѕ±е°»дјёдїЎдѕµе”‡еЁ еЇќеЇ©еїѓж…ЋжЊЇж–°ж™‹жЈ®ж¦›жµёж·±з”із–№зњџзҐћз§¦зґіи‡ЈиЉЇи–Єи¦ЄиЁєиє«иѕ›йЂІй‡ќйњ‡дєєд»Ѓе€ѓеЎµеЈ¬е°‹з”ље°Ѕи…ЋиЁЉиї…й™Јйќ­з¬Ґи«Џй €й…ўе›іеЋЁ"],
    ["9080","йЂ—еђ№ећ‚еёҐжЋЁж°ґз‚ЉзќЎзІ‹зї иЎ°йЃ‚й…”йЊђйЊйљЏз‘ћй«„еґ‡еµ©ж•°жћўи¶Ёй››жЌ®жќ‰ж¤™иЏ…й —й›ЂиЈѕжѕ„ж‘єеЇёдё–зЂ¬з•ќжЇе‡„е€¶е‹ўе§“еѕЃжЂ§ж€ђж”їж•ґжџж™ґжЈІж –ж­Јжё…з‰Із”џз››зІѕиЃ–еЈ°иЈЅиҐїиЄ иЄ“и«‹йЂќй†’йќ’йќ™ж–‰зЁЋи„†йљ»её­жѓњж€љж–Ґж”жћђзџіз©Ќз±Ќзёѕи„ЉиІ¬иµ¤и·Ўи№џзў©е€‡ж‹™жЋҐж‘‚жЉиЁ­зЄѓзЇЂиЄ¬й›Єзµ¶и€Њиќ‰д»™е…€еЌѓеЌ е®Је°‚е°–е·ќж€¦ж‰‡ж’°ж “ж ґжі‰жµ…жґ—жџ“жЅњз…Ћз…Ѕж—‹з©їз®­з·љ"],
    ["9140","з№ЉзѕЁи…єи€›и€№и–¦и©®иіЋи·µйЃёйЃ·йЉ­йЉ‘й–ѓй®®е‰Ќе–„жјёз„¶е…Ёз¦…з№•и†ізіЋе™ЊеЎ‘еІЁжЋЄж›ѕж›ЅжҐљз‹™з–Џз–Ћз¤ЋзҐ–з§џзІ—зґ зµ„и‡иЁґй»йЃЎйј еѓ§е‰µеЏЊеЏўеЂ‰е–ЄеЈ®еҐЏз€Ѕе®‹е±¤еЊќжѓЈжѓіжЌњжЋѓжЊїжЋ»"],
    ["9180","ж“Ќж—©ж›№е·Јж§Ќж§Ѕжј•з‡Ґдє‰з—©з›ёзЄ“зіџз·Џз¶њиЃЎиЌ‰иЌи‘¬и’ји—»иЈ…иµ°йЂЃйЃ­йЋ—йњњйЁ’еѓЏеў—ж†Ћи‡“и”µиґ€йЂ дїѓеЃґе‰‡еЌіжЃЇжЌ‰жќџжё¬и¶ійЂџдї—е±ћиіЉж—Џз¶љеЌ’иў–е…¶жЏѓе­е­«е°ЉжђЌжќ‘йЃњд»–е¤ље¤Єж±°и©‘е”ѕе •е¦Ґжѓ°ж‰“жџЃи€µжҐ•й™Ђй§„йЁЁдЅ“е †еЇѕиЂђеІ±еёЇеѕ…жЂ ж…‹ж€ґж›їжі°ж»ћиѓЋи…їи‹”иў‹иІёйЂЂйЂ®йљЉй»›йЇ›д»ЈеЏ°е¤§з¬¬й†ЌйЎЊй·№ж»ќзЂ§еЌ“е•„е®…ж‰жЉћж‹“жІўжїЇзђўиЁ—йђёжїЃи«ѕиЊёе‡§и›ёеЏЄ"],
    ["9240","еЏ©дЅ†йЃ”иѕ°еҐЄи„±е·Ѕз«ЄиѕїжЈљи°·з‹ёй±€жЁЅиЄ°дё№еЌе†еќ¦ж‹…жЋўж—¦ж­Ћж·Ўж№›з‚­зџ­з«Їз®Єз¶»иЂЅиѓ†и›‹иЄ•йЌ›е›ЈеЈ‡ејѕж–­жљ–жЄЂж®µз”·и«‡еЂ¤зџҐењ°еј›жЃҐж™єж± з—ґзЁљзЅ®и‡ґињйЃ…й¦ізЇ‰з•њз«№з­‘и“„"],
    ["9280","йЂђз§©зЄ’иЊ¶е«ЎзќЂдё­д»Іе®™еї жЉЅжјжџ±жіЁи™«иЎ·иЁ»й…Ћй‹ій§ђжЁ—зЂ¦зЊЄи‹§и‘—иІЇдёЃе…†е‡‹е–‹еЇµеё–еёіеєЃеј”ејµеЅ«еѕґж‡ІжЊ‘жљўжњќжЅ®з‰’з”єзњєиЃґи„№и…ёиќ¶иЄїи«њи¶…и·ійЉљй•·й ‚йіҐе‹…жЌ—з›ґжњ•жІ€зЏЌиіѓйЋ®й™іжґҐеўњж¤Ћж§ЊиїЅйЋљз—›йЂљеЎљж ‚жЋґж§»дЅѓжј¬жџиѕ»и”¦з¶ґйЌ”ж¤їжЅ°еќЄеЈ·е¬¬зґ¬з€ЄеђЉй‡Јй¶ґдє­дЅЋеЃњеЃµе‰ѓиІће‘€е ¤е®љеёќеє•еє­е»·ејџж‚ЊжЉµжЊєжЏђжўЇж±Ђзў‡з¦ЋзЁ‹з· и‰‡иЁ‚и«¦и№„йЂ“"],
    ["9340","й‚ёй„­й‡йјЋжіҐж‘ж“ўж•µж»ґзљ„з¬›йЃ©йЏ‘жєєе“Іеѕ№ж’¤иЅЌиї­й‰„е…ёеЎ«е¤©е±•еє—ж·»зєЏз”њиІји»ўйЎ›з‚№дјќж®їжѕ±з”°й›»е…Ћеђђе µеЎ—е¦¬е± еѕ’ж–—жќњжёЎз™»иЏџиі­йЂ”йѓЅйЌЌз Ґз єеЉЄеє¦ењџеҐґжЂ’еЂ’е…ље†¬"],
    ["9380","е‡Ќе€Ђе”ђеЎ”еЎеҐ—е®•еі¶е¶‹ж‚јжЉ•жђ­жќ±жЎѓжўјжЈџз›—ж·ж№Їж¶›зЃЇз‡€еЅ“з—зҐ·з­‰з­”з­’зі–зµ±е€°и‘Ји•©и—¤иЁЋи¬„и±†иёЏйЂѓйЂЏйђ™й™¶й ­йЁ°й—еѓЌе‹•еђЊе ‚е°Ћж†§ж’ћжґћзћіз«Ґиѓґиђ„йЃ“йЉ…еі йґ‡еЊїеѕ—еѕіж¶њз‰№зќЈз¦їзЇ¤жЇ’з‹¬иЄ­ж ѓж©Ўе‡ёзЄЃж¤ґе±Љйі¶и‹«еЇ…й…‰зЂће™ёе±Їжѓ‡ж•¦жІЊи±љйЃЃй “е‘‘ж›‡й€ЌеҐ€й‚Је†…д№Ќе‡Єи–™и¬ЋзЃжЌєйЌ‹жҐўй¦ґзё„з•·еЌ—жҐ и»џй›Јж±ќдєЊе°јејђиї©еЊ‚иі‘и‚‰и™№е»їж—Ґд№іе…Ґ"],
    ["9440","е¦‚е°їйџ®д»»е¦ЉеїЌиЄЌжїЎз¦°зҐўеЇ§и‘±зЊ«з†±е№ґеїµжЌ»ж’љз‡ѓзІд№ѓе»јд№‹еџњељўж‚©жїѓзґЌиѓЅи„іи†їиѕІи¦—иљ¤е·ґжЉЉж’­и¦‡жќ·жіўжґѕзђ¶з ґе©†зЅµиЉ­й¦¬дїіе»ѓж‹ќжЋ’ж•—жќЇз›ѓз‰ЊиѓЊи‚єиј©й…ЌеЂЌеџ№еЄ’жў…"],
    ["9480","жҐіз…¤з‹ЅиІ·еЈІиі й™ЄйЂ™иќїз§¤зџ§иђ©дјЇе‰ҐеЌљж‹ЌжџЏжіЉз™Ѕз®”зІ•и€¶и–„иї«ж›ќжј з€†зё›иЋ«й§Ѓйє¦е‡Ѕз®±зЎІз®ёи‚‡з­€ж«Ёе№Ўи‚Њз•‘з• е…«й‰ўжєЊз™єй†—й«ЄдјђзЅ°жЉњз­Џй–Ґйі©е™єеЎ™и›¤йљјдјґе€¤еЌЉеЏЌеЏ›её†жђ¬ж–‘жќїж°ѕж±Ћз‰€зЉЇзЏ­з•”з№Ѓи€¬и—©иІ©зЇ„й‡†з…©й ’йЈЇжЊЅж™©з•Єз›¤зЈђи•ѓи›®еЊЄеЌ‘еђ¦е¦ѓеє‡еЅјж‚Іж‰‰ж‰№жЉ«ж–ђжЇ”жіЊз–Ізљ®зў‘з§з·‹зЅ·и‚Ґиў«иЄ№иІ»йЃїйќћйЈ›жЁ‹з°ёе‚™е°ѕеѕ®жћ‡жЇзђµзњ‰зѕЋ"],
    ["9540","йј»жџЉзЁ—еЊ№з–‹й«­еЅ¦и†ќиЏ±и‚ејјеї…з•ўз­†йЂјжЎ§е§«еЄ›зґђз™ѕи¬¬дїµеЅЄжЁ™ж°·жј‚з“ўзҐЁиЎЁи©•и±№е»џжЏЏз—…з§’и‹—йЊЁй‹Іи’њи›­й°­е“ЃеЅ¬ж–ЊжµњзЂ•иІ§иі“й »ж•Џз“¶дёЌд»еџ е¤«е©¦еЇЊе†ЁеёѓеєњжЂ–ж‰¶ж•·"],
    ["9580","ж–§ж™®жµ®з€¶з¬¦и…ђи†љиЉ™и­њиІ иі¦иµґйњй™„дѕ®ж’«ж­¦и€ћи‘Ўи•ЄйѓЁе°ЃжҐ“йўЁи‘єи•—дјЏе‰Їеѕ©е№…жњЌз¦Џи…№и¤‡и¦†ж·µеј—ж‰•жІёд»Џз‰©й®’е€†еђ»е™ґеўіж†¤ж‰®з„љеҐ®зІ‰зіћзґ›й›°ж–‡иЃћдё™дЅµе…µеЎЂе№Је№іејЉжџ„дё¦и”Ѕй–‰й™›з±ій Ѓеѓ»еЈЃз™–зў§е€ҐзћҐи”‘з®†еЃЏе¤‰з‰‡зЇ‡з·Ёиѕєиї”йЃЌдѕїе‹‰еЁ©ејЃйћ­дїќи€—й‹ЄењѓжЌ•ж­©з”«иЈњиј”з©‚е‹џеў“ж…•ж€Љжљ®жЇЌз°їиЏ©еЂЈдїёеЊ…е‘†е ±еҐ‰е®ќеі°еіЇеґ©еє–жЉ±жЌ§ж”ѕж–№жњ‹"],
    ["9640","жі•жіЎзѓ№з Ізё«иѓћиЉіиђЊи“¬ињ‚и¤’иЁЄи±Љй‚¦й‹’йЈЅйіійµ¬д№ЏдєЎе‚Ќе‰–еќЉе¦ЁеёЅеїеї™ж€їжљґжњ›жџђжЈ’е†’зґЎи‚Єи†Ёи¬ЂиІЊиІїй‰ѕйІеђ й ¬еЊ—еѓ•еЌњеўЁж’Іжњґз‰§зќ¦з©†й‡¦е‹ѓжІЎж®†е Ђе№ЊеҐ”жњ¬зї»е‡Ўз›†"],
    ["9680","ж‘©зЈЁй­”йє»еџ‹е¦№ж§жћљжЇЋе“©ж§™е№•и†њжћ•й®Єжџѕй±’жЎќдє¦дїЈеЏ€жЉ№жњ«жІ«иї„дѕ­з№­йєїдё‡ж…ўжєЂжј«и”“е‘іжњЄй­…е·із®•еІ¬еЇ†ињњж№Љи“‘зЁ”и„€е¦™зІЌж°‘зњ е‹™е¤ўз„Ўз‰џзџ›йњ§йµЎж¤‹е©їеЁе†ҐеђЌе‘ЅжЋз›џиї·йЉйіґе§Єз‰ќж»…е…ЌжЈ‰з¶їз·¬йќўйєєж‘ёжЁЎиЊ‚е¦„е­џжЇ›зЊ›з›Із¶ІиЂ—и’™е„ІжњЁй»™з›®жќўе‹їй¤…е°¤ж€»з±ѕиІ°е•Џж‚¶зґ‹й–ЂеЊЃд№џе†¶е¤њз€єиЂ¶й‡ЋејҐзџўеЋ„еЅ№зґ„и–¬иЁіиєЌйќ–жџіи–®й‘“ж„‰ж„€жІ№з™’"],
    ["9740","и«­ијёе”ЇдЅ‘е„Єе‹‡еЏ‹е®Ґе№Ѕж‚ ж†‚жЏ–жњ‰жџљж№§ж¶ЊзЊ¶зЊ·з”±зҐђиЈ•иЄйЃЉй‚‘йѓµй›„ићЌе¤•дє€дЅ™дёЋиЄ‰ијїй ђе‚­е№је¦–е®№еєёжЏљжЏєж“Ѓж›њжҐЉж§жґ‹жє¶з†”з”ЁзЄЇзѕЉиЂЂи‘‰и“‰и¦Ѓи¬ЎиёЉйЃҐй™Ѕй¤Љж…ѕжЉ‘ж¬І"],
    ["9780","жІѓжµґзїЊзїјж·Ђзѕ…ићєиЈёжќҐиЋ±й јй›·жґ›зµЎиђЅй…Єд№±еЌµеµђж¬„жї«и—Ќи­и¦§е€©еђЏе±ҐжќЋжўЁзђ†з’ѓз—ўиЈЏиЈЎй‡Њй›ўй™ёеѕ‹зЋ‡з«‹и‘ЋжЋ з•ҐеЉ‰жµЃжєњзђ‰з•™зЎ«зІ’йљ†з«њйѕЌдѕ¶ж…®ж—…и™њдє†дє®еѓљдёЎе‡ЊеЇ®ж–™жўЃж¶јзЊџз™‚зћ­зЁњзі§и‰Їи«’йЃјй‡Џй™µй еЉ›з·‘еЂ«еЋжћ—ж·‹з‡ђзђіи‡ЁијЄйљЈй±—йєџз‘ еЎЃж¶™зґЇйЎћд»¤дј¶дѕ‹е†·еЉ±е¶єжЂњзЋІз¤ји‹“й€ґйљ·й›¶йњЉйє—йЅўжљ¦ж­ґе€—еЉЈзѓ€иЈ‚е»‰жЃ‹ж†ђжјЈз…‰з°ѕз·ґиЃЇ"],
    ["9840","и“®йЂЈйЊ¬е‘‚й­Їж«“з‚‰иі‚и·ЇйњІеЉґе©Ѓе»Љеј„жњ—жҐјж¦”жµЄжјЏз‰ўз‹јзЇ­иЂЃиЃѕиќ‹йѓЋе…­йє“з¦„и‚‹йЊІи«–еЂ­е’Њи©±ж­Єиі„и„‡жѓ‘жћ й·Ідє™дєй°ђи©«и—Ѓи•Ёж¤Ђж№ѕзў—и…•"],
    ["989f","ејЊдёђдё•дёЄдё±дё¶дёјдёїд№‚д№–д№дє‚дє…и±«дєЉи€’ејЌдєЋдєћдєџдє дєўдє°дєідє¶д»Ћд»Ќд»„д»†д»‚д»—д»ћд»­д»џд»·дј‰дЅљдј°дЅ›дЅќдЅ—дЅ‡дЅ¶дѕ€дѕЏдѕдЅ»дЅ©дЅ°дѕ‘дЅЇдѕ†дѕ–е„дї”дїџдїЋдїдї›дї‘дїљдїђдї¤дїҐеЂљеЂЁеЂ”еЂЄеЂҐеЂ…дјњдї¶еЂЎеЂ©еЂ¬дїѕдїЇеЂ‘еЂ†еЃѓеЃ‡жњѓеЃ•еЃђеЃ€еЃљеЃ–еЃ¬еЃёе‚Ђе‚ље‚…е‚ґе‚І"],
    ["9940","еѓ‰еѓЉе‚іеѓ‚еѓ–еѓћеѓҐеѓ­еѓЈеѓ®еѓ№еѓµе„‰е„Ѓе„‚е„–е„•е„”е„ље„Ўе„єе„·е„је„»е„їе…Ђе…’е…Ње…”е…ўз«ёе…©е…Єе…®е†Ђе†‚е›е†Ње†‰е†Џе†‘е†“е†•е†–е†¤е†¦е†ўе†©е†Єе†«е†іе†±е†Іе†°е†µе†Ѕе‡…е‡‰е‡›е‡ и™•е‡©е‡­"],
    ["9980","е‡°е‡µе‡ѕе€„е€‹е€”е€Ће€§е€Єе€®е€іе€№е‰Џе‰„е‰‹е‰Ње‰ће‰”е‰Єе‰ґе‰©е‰іе‰їе‰ЅеЉЌеЉ”еЉ’е‰±еЉ€еЉ‘иѕЁиѕ§еЉ¬еЉ­еЉјеЉµе‹Ѓе‹Ќе‹—е‹ће‹Је‹¦йЈ­е‹ е‹іе‹µе‹ёе‹№еЊ†еЊ€з”ёеЊЌеЊђеЊЏеЊ•еЊљеЊЈеЊЇеЊ±еЊіеЊёеЌЂеЌ†еЌ…дё—еЌ‰еЌЌе‡–еЌћеЌ©еЌ®е¤еЌ»еЌ·еЋ‚еЋ–еЋ еЋ¦еЋҐеЋ®еЋ°еЋ¶еЏѓз°’й›™еЏџж›јз‡®еЏ®еЏЁеЏ­еЏєеђЃеђЅе‘Ђеђ¬еђ­еђјеђ®еђ¶еђ©еђќе‘Ће’Џе‘µе’Ће‘џе‘±е‘·е‘°е’’е‘»е’Ђе‘¶е’„е’ђе’†е“‡е’ўе’ёе’Ґе’¬е“„е“€е’Ё"],
    ["9a40","е’«е“‚е’¤е’ѕе’је“е“Ґе“¦е”Џе””е“Ѕе“®е“­е“єе“ўе”№е•Ђе•Је•Ње”®е•ње•…е•–е•—е”ёе”іе•ќе–™е–Ђе’Їе–Ље–џе•»е•ѕе–е–ће–®е•је–ѓе–©е–‡е–Ёе—ље—…е—џе—„е—ње—¤е—”е”е—·е–е—ѕе—Ѕе›е—№е™Ће™ђз‡џеґе¶еІеё"],
    ["9a80","е™«е™¤еЇе™¬е™Єељ†ељЂељЉељ ељ”ељЏељҐељ®ељ¶ељґе›‚ељје›Ѓе›ѓе›Ђе›€е›Ће›‘е›“е›—е›®е›№ењЂе›їењ„ењ‰ењ€ењ‹ењЌењ“ењењ–е—‡ењњењ¦ењ·ењёеќЋењ»еќЂеќЏеќ©еџЂећ€еќЎеќїећ‰ећ“ећ ећіећ¤ећЄећ°еџѓеџ†еџ”еџ’еџ“е Љеџ–еџЈе ‹е ™е ќеЎІе ЎеЎўеЎ‹еЎ°жЇЂеЎ’е ЅеЎ№еў…еў№еўџеў«еўєеЈћеў»еўёеў®еЈ…еЈ“еЈ‘еЈ—еЈ™еЈеЈҐеЈњеЈ¤еЈџеЈЇеЈєеЈ№еЈ»еЈјеЈЅе¤‚е¤Ље¤ђе¤›жў¦е¤Ґе¤¬е¤­е¤Іе¤ёе¤ѕз«’еҐ•еҐђеҐЋеҐљеҐеҐўеҐ еҐ§еҐ¬еҐ©"],
    ["9b40","еҐёе¦Ѓе¦ќдЅћдѕ«е¦Је¦Іе§†е§Ёе§ње¦Ќе§™е§љеЁҐеЁџеЁ‘еЁњеЁ‰еЁље©Ђе©¬е©‰еЁµеЁ¶е©ўе©ЄеЄљеЄјеЄѕе«‹е«‚еЄЅе«Је«—е«¦е«©е«–е«єе«»е¬Ње¬‹е¬–е¬Іе«ђе¬Єе¬¶е¬ѕе­ѓе­…е­Ђе­‘е­•е­ље­›е­Ґе­©е­°е­іе­µе­ёж–€е­єе®Ђ"],
    ["9b80","е®ѓе®¦е®ёеЇѓеЇ‡еЇ‰еЇ”еЇђеЇ¤еЇ¦еЇўеЇћеЇҐеЇ«еЇ°еЇ¶еЇіе°…е°‡е°€е°Ќе°“е° е°ўе°Ёе°ёе°№е±Ѓе±†е±Ће±“е±ђе±Џе­±е±¬е±®д№ўе±¶е±№еІЊеІ‘еІ”е¦›еІ«еІ»еІ¶еІјеІ·еі…еІѕеі‡еі™еі©еіЅеієеі­е¶ЊеіЄеґ‹еґ•еґ—еµњеґџеґ›еґ‘еґ”еґўеґљеґ™еґеµЊеµ’еµЋеµ‹еµ¬еµіеµ¶е¶‡е¶„е¶‚е¶ўе¶ќе¶¬е¶®е¶Ѕе¶ђе¶·е¶је·‰е·Ќе·“е·’е·–е·›е·«е·Іе·µеё‹еёљеё™её‘её›её¶её·е№„е№ѓе№Ђе№Ће№—е№”е№џе№ўе№¤е№‡е№µе№¶е№єйєје№їеє е»Ѓе»‚е»€е»ђе»Џ"],
    ["9c40","е»–е»Је»ќе»ље»›е»ўе»Ўе»Ёе»©е»¬е»±е»іе»°е»ґе»ёе»ѕејѓеј‰еЅќеЅњеј‹еј‘еј–еј©еј­ејёеЅЃеЅ€еЅЊеЅЋејЇеЅ‘еЅ–еЅ—еЅ™еЅЎеЅ­еЅіеЅ·еѕѓеѕ‚еЅїеѕЉеѕ€еѕ‘еѕ‡еѕћеѕ™еѕеѕ еѕЁеѕ­еѕјеї–еї»еї¤еїёеї±еїќж‚іеїїжЂЎжЃ "],
    ["9c80","жЂ™жЂђжЂ©жЂЋжЂ±жЂ›жЂ•жЂ«жЂ¦жЂЏжЂєжЃљжЃЃжЃЄжЃ·жЃџжЃЉжЃ†жЃЌжЃЈжЃѓжЃ¤жЃ‚жЃ¬жЃ«жЃ™ж‚Ѓж‚Ќжѓ§ж‚ѓж‚љж‚„ж‚›ж‚–ж‚—ж‚’ж‚§ж‚‹жѓЎж‚ёжѓ жѓ“ж‚ґеї°ж‚Ѕжѓ†ж‚µжѓж…Ќж„•ж„†жѓ¶жѓ·ж„Ђжѓґжѓєж„ѓж„Ўжѓ»жѓ±ж„Ќж„Ћж…‡ж„ѕж„Ёж„§ж…Љж„їж„јж„¬ж„ґж„Ѕж…‚ж…„ж…іж…·ж…ж…™ж…љж…«ж…ґж…Їж…Ґж…±ж…џж…ќж…“ж…µж†™ж†–ж†‡ж†¬ж†”ж†љж†Љж†‘ж†«ж†®ж‡Њж‡Љж‡‰ж‡·ж‡€ж‡ѓж‡†ж†єж‡‹зЅ№ж‡Ќж‡¦ж‡Јж‡¶ж‡єж‡ґж‡їж‡Ѕж‡јж‡ѕж€Ђж€€ж€‰ж€Ќж€Њж€”ж€›"],
    ["9d40","ж€ћж€Ўж€Єж€®ж€°ж€Іж€іж‰Ѓж‰Ћж‰ћж‰Јж‰›ж‰ ж‰Ёж‰јжЉ‚жЉ‰ж‰ѕжЉ’жЉ“жЉ–ж‹”жЉѓжЉ”ж‹—ж‹‘жЉ»ж‹Џж‹їж‹†ж“”ж‹€ж‹њж‹Њж‹Љж‹‚ж‹‡жЉ›ж‹‰жЊЊж‹®ж‹±жЊ§жЊ‚жЊ€ж‹Їж‹µжЌђжЊѕжЌЌжђњжЌЏжЋ–жЋЋжЋЂжЋ«жЌ¶жЋЈжЋЏжЋ‰жЋџжЋµжЌ«"],
    ["9d80","жЌ©жЋѕжЏ©жЏЂжЏ†жЏЈжЏ‰жЏ’жЏ¶жЏ„жђ–жђґжђ†жђ“жђ¦жђ¶ж”ќжђ—жђЁжђЏж‘§ж‘Їж‘¶ж‘Ћж”Єж’•ж’“ж’Ґж’©ж’€ж’јж“љж“’ж“…ж“‡ж’»ж“ж“‚ж“±ж“§и€‰ж“ ж“ЎжЉ¬ж“Јж“Їж”¬ж“¶ж“ґж“Іж“єж”Ђж“Ѕж”ж”њж”…ж”¤ж”Јж”«ж”ґж”µж”·ж”¶ж”ёз•‹ж•€ж•–ж••ж•Ќж•ж•ћж•ќж•Іж•ёж–‚ж–ѓи®Љж–›ж–џж–«ж–·ж—ѓж—†ж—Ѓж—„ж—Њж—’ж—›ж—™ж— ж—Ўж—±жќІжЉжѓж—»жќіжµж¶жґжњж™Џж™„ж™‰ж™Ѓж™ћж™ќж™¤ж™§ж™Ёж™џж™ўж™°жљѓжљ€жљЋжљ‰жљ„жљжљќж›Ѓжљ№ж›‰жљѕжљј"],
    ["9e40","ж›„жљёж›–ж›љж› жїж›¦ж›©ж›°ж›µж›·жњЏжњ–жњћжњ¦жњ§йњёжњ®жњїжњ¶жќЃжњёжњ·жќ†жќћжќ жќ™жќЈжќ¤жћ‰жќ°жћ©жќјжќЄжћЊжћ‹жћ¦жћЎжћ…жћ·жџЇжћґжџ¬жћіжџ©жћёжџ¤жџћжџќжџўжџ®жћ№жџЋжџ†жџ§жЄњж ћжЎ†ж ©жЎЂжЎЌж ІжЎЋ"],
    ["9e80","жўіж «жЎ™жЎЈжЎ·жЎїжўџжўЏжў­жў”жўќжў›жўѓжЄ®жў№жЎґжўµжў жўєж¤ЏжўЌжЎѕж¤ЃжЈЉж¤€жЈж¤ўж¤¦жЈЎж¤ЊжЈЌжЈ”жЈ§жЈ•ж¤¶ж¤’ж¤„жЈ—жЈЈж¤ҐжЈ№жЈ жЈЇж¤Ёж¤Єж¤љж¤Јж¤ЎжЈ†жҐ№жҐ·жҐњжҐёжҐ«жҐ”жҐѕжҐ®ж¤№жҐґж¤ЅжҐ™ж¤°жҐЎжҐћжҐќж¦ЃжҐЄж¦Іж¦®ж§ђж¦їж§Ѓж§“ж¦ѕж§ЋеЇЁж§Љж§ќж¦»ж§ѓж¦§жЁ®ж¦‘ж¦ ж¦њж¦•ж¦ґж§ћж§ЁжЁ‚жЁ›ж§їж¬Љж§№ж§Іж§§жЁ…ж¦±жЁћж§­жЁ”ж§«жЁЉжЁ’ж«ЃжЁЈжЁ“ж©„жЁЊж©ІжЁ¶ж©ёж©‡ж©ўж©™ж©¦ж©€жЁёжЁўжЄђжЄЌжЄ жЄ„жЄўжЄЈ"],
    ["9f40","жЄ—и—жЄ»ж«ѓж«‚жЄёжЄіжЄ¬ж«ћж«‘ж«џжЄЄж«љж«Єж«»ж¬…и–ж«єж¬’ж¬–й¬±ж¬џж¬ёж¬·з›њж¬№йЈ®ж­‡ж­ѓж­‰ж­ђж­™ж­”ж­›ж­џж­Ўж­ёж­№ж­їж®Ђж®„ж®ѓж®Ќж®ж®•ж®ћж®¤ж®Єж®«ж®Їж®Іж®±ж®іж®·ж®јжЇ†жЇ‹жЇ“жЇџжЇ¬жЇ«жЇіжЇЇ"],
    ["9f80","йєѕж°€ж°“ж°”ж°›ж°¤ж°Јж±ћж±•ж±ўж±ЄжІ‚жІЌжІљжІЃжІ›ж±ѕж±Ёж±іжІ’жІђжі„жі±жі“жІЅжі—жі…жіќжІ®жІ±жІѕжІєжі›жіЇжі™жіЄжґџиЎЌжґ¶жґ«жґЅжґёжґ™жґµжґіжґ’жґЊжµЈж¶“жµ¤жµљжµ№жµ™ж¶Ћж¶•жї¤ж¶…ж·№жё•жёЉж¶µж·‡ж·¦ж¶ёж·†ж·¬ж·ћж·Њж·Ёж·’ж·…ж·єж·™ж·¤ж·•ж·Єж·®жё­ж№®жё®жё™ж№Іж№џжёѕжёЈж№«жё«ж№¶ж№Ќжёџж№ѓжёєж№Ћжё¤ж»їжёќжёёжє‚жєЄжєж»‰жє·ж»“жєЅжєЇж»„жєІж»”ж»•жєЏжєҐж»‚жєџжЅЃжј‘зЃЊж»¬ж»ёж»ѕжјїж»Іжј±ж»ЇжјІж»Њ"],
    ["e040","жјѕжј“ж»·жѕ†жЅєжЅёжѕЃжѕЂжЅЇжЅ›жїіжЅ­жѕ‚жЅјжЅжѕЋжѕ‘жї‚жЅ¦жѕіжѕЈжѕЎжѕ¤жѕ№жї†жѕЄжїџжї•жї¬жї”жїжї±жї®жї›зЂ‰зЂ‹жїєзЂ‘зЂЃзЂЏжїѕзЂ›зЂљжЅґзЂќзЂзЂџзЂ°зЂѕзЂІзЃ‘зЃЈз‚™з‚’з‚Їзѓ±з‚¬з‚ёз‚із‚®зѓџзѓ‹зѓќ"],
    ["e080","зѓ™з„‰зѓЅз„њз„™з…Ґз…•з†€з…¦з…ўз…Њз…–з…¬з†Џз‡»з†„з†•з†Ёз†¬з‡—з†№з†ѕз‡’з‡‰з‡”з‡Ћз‡ з‡¬з‡§з‡µз‡јз‡№з‡їз€Ќз€ђз€›з€Ёз€­з€¬з€°з€Із€»з€јз€їз‰Ђз‰†з‰‹з‰з‰ґз‰ѕзЉ‚зЉЃзЉ‡зЉ’зЉ–зЉўзЉ§зЉ№зЉІз‹ѓз‹†з‹„з‹Ћз‹’з‹ўз‹ з‹Ўз‹№з‹·еЂЏзЊ—зЊЉзЊњзЊ–зЊќзЊґзЊЇзЊ©зЊҐзЊѕзЌЋзЌЏй»зЌ—зЌЄзЌЁзЌ°зЌёзЌµзЌ»зЌєзЏ€зЋізЏЋзЋ»зЏЂзЏҐзЏ®зЏћз’ўзђ…з‘ЇзђҐзЏёзђІзђєз‘•зђїз‘џз‘™з‘Ѓз‘њз‘©з‘°з‘Јз‘Єз‘¶з‘ѕз’‹з’ћз’§з“Љз“Џз“”зЏ±"],
    ["e140","з“ з“Јз“§з“©з“®з“Із“°з“±з“ёз“·з”„з”ѓз”…з”Њз”Ћз”Ќз”•з”“з”ћз”¦з”¬з”јз•„з•Ќз•Љз•‰з•›з•†з•љз•©з•¤з•§з•«з•­з•ёз•¶з–†з–‡з•ґз–Љз–‰з–‚з–”з–љз–ќз–Ґз–Јз—‚з–із—ѓз–µз–Ѕз–ёз–јз–±з—Ќз—Љз—’з—™з—Јз—ћз—ѕз—ї"],
    ["e180","з—јзЃз—°з—єз—Із—із‹зЌз‰зџз§з зЎзўз¤зґз°з»з™‡з™€з™†з™њз™з™Ўз™ўз™Ёз™©з™Єз™§з™¬з™°з™Із™¶з™ёз™јзљЂзљѓзљ€зљ‹зљЋзљ–зљ“зљ™зљљзљ°зљґзљёзљ№зљєз›‚з›Ќз›–з›’з›ћз›Ўз›Ґз›§з›ЄиЇз›»зњ€зњ‡зњ„зњ©зњ¤зњћзњҐзњ¦зњ›зњ·зњёзќ‡зќљзќЁзќ«зќ›зќҐзќїзќѕзќ№зћЋзћ‹зћ‘зћ зћћзћ°зћ¶зћ№зћїзћјзћЅзћ»зџ‡зџЌзџ—зџљзџњзџЈзџ®зџјз Њз ’з¤¦з  з¤ЄзЎ…зўЋзЎґзў†зЎјзўљзўЊзўЈзўµзўЄзўЇзЈ‘зЈ†зЈ‹зЈ”зўѕзўјзЈ…зЈЉзЈ¬"],
    ["e240","зЈ§зЈљзЈЅзЈґз¤‡з¤’з¤‘з¤™з¤¬з¤«зҐЂзҐ зҐ—зҐџзҐљзҐ•зҐ“зҐєзҐїз¦Љз¦ќз¦§йЅ‹з¦Єз¦®з¦із¦№з¦єз§‰з§•з§§з§¬з§Ўз§ЈзЁ€зЁЌзЁзЁ™зЁ зЁџз¦ЂзЁ±зЁ»зЁѕзЁ·з©ѓз©—з©‰з©Ўз©ўз©©йѕќз©°з©№з©ЅзЄ€зЄ—зЄ•зЄзЄ–зЄ©з«€зЄ°"],
    ["e280","зЄ¶з«…з«„зЄїй‚ѓз«‡з«Љз«Ќз«Џз«•з«“з«™з«љз«ќз«Ўз«ўз«¦з«­з«°з¬‚з¬Џз¬Љз¬†з¬із¬з¬™з¬ћз¬µз¬Ёз¬¶з­ђз­єз¬„з­Ќз¬‹з­Њз­…з­µз­Ґз­ґз­§з­°з­±з­¬з­®з®ќз®з®џз®Ќз®њз®љз®‹з®’з®Џз­ќз®™зЇ‹зЇЃзЇЊзЇЏз®ґзЇ†зЇќзЇ©з°‘з°”зЇ¦зЇҐз± з°Ђз°‡з°“зЇізЇ·з°—з°ЌзЇ¶з°Јз°§з°Єз°џз°·з°«з°Ѕз±Њз±ѓз±”з±Џз±Ђз±ђз±з±џз±¤з±–з±Ґз±¬з±µзІѓзІђзІ¤зІ­зІўзІ«зІЎзІЁзІізІІзІ±зІ®зІ№зІЅзіЂзі…зі‚зізі’зіњзіўй¬»зіЇзіІзіґзі¶зієзґ†"],
    ["e340","зґ‚зґњзґ•зґЉзµ…зµ‹зґ®зґІзґїзґµзµ†зµізµ–зµЋзµІзµЁзµ®зµЏзµЈз¶“з¶‰зµ›з¶ЏзµЅз¶›з¶єз¶®з¶Јз¶µз·‡з¶Ѕз¶«зёЅз¶ўз¶Їз·њз¶ёз¶џз¶°з·з·ќз·¤з·ћз·»з·Із·Ўзё…зёЉзёЈзёЎзё’зё±зёџзё‰зё‹зёўз№†з№¦зё»зёµзё№з№ѓзё·"],
    ["e380","зёІзёєз№§з№ќз№–з№ћз№™з№љз№№з№Єз№©з№јз№»зєѓз·•з№Ѕиѕ®з№їзє€зє‰зєЊзє’зєђзє“зє”зє–зєЋзє›зєњзјёзјєзЅ…зЅЊзЅЌзЅЋзЅђзЅ‘зЅ•зЅ”зЅзЅџзЅ зЅЁзЅ©зЅ§зЅёзѕ‚зѕ†зѕѓзѕ€зѕ‡зѕЊзѕ”зѕћзѕќзѕљзѕЈзѕЇзѕІзѕ№зѕ®зѕ¶зѕёи­±зї…зї†зїЉзї•зї”зїЎзї¦зї©зїізї№йЈњиЂ†иЂ„иЂ‹иЂ’иЂиЂ™иЂњиЂЎиЂЁиЂїиЂ»иЃЉиЃ†иЃ’иЃиЃљиЃџиЃўиЃЁиЃіиЃІиЃ°иЃ¶иЃ№иЃЅиЃїи‚„и‚†и‚…и‚›и‚“и‚љи‚­е†ђи‚¬иѓ›иѓҐиѓ™иѓќиѓ„иѓљиѓ–и„‰иѓЇиѓ±и„›и„©и„Ји„Їи…‹"],
    ["e440","йљ‹и…†и„ѕи…“и…‘иѓји…±и…®и…Ґи…¦и…ґи†ѓи†€и†Љи†Ђи†‚и† и†•и†¤и†Ји…џи†“и†©и†°и†µи†ѕи†ёи†Ѕи‡Ђи‡‚и†єи‡‰и‡Ќи‡‘и‡™и‡и‡€и‡љи‡џи‡ и‡§и‡єи‡»и‡ѕи€Ѓи€‚и€…и€‡и€Љи€Ќи€ђи€–и€©и€«и€ёи€іи‰Ђи‰™и‰и‰ќи‰љи‰џи‰¤"],
    ["e480","и‰ўи‰Ёи‰Єи‰«и€®и‰±и‰·и‰ёи‰ѕиЉЌиЉ’иЉ«иЉџиЉ»иЉ¬и‹Ўи‹Ји‹џи‹’и‹ґи‹іи‹єиЋ“иЊѓи‹»и‹№и‹ћиЊ†и‹њиЊ‰и‹™иЊµиЊґиЊ–иЊІиЊ±иЌЂиЊ№иЌђиЌ…иЊЇиЊ«иЊ—иЊиЋ…иЋљиЋЄиЋџиЋўиЋ–иЊЈиЋЋиЋ‡иЋЉиЌјиЋµиЌіиЌµиЋ иЋ‰иЋЁиЏґиђ“иЏ«иЏЋиЏЅиђѓиЏиђ‹иЏЃиЏ·иђ‡иЏ иЏІиђЌиђўиђ иЋЅиђёи”†иЏ»и‘­иђЄиђји•љи’„и‘·и‘«и’­и‘®и’‚и‘©и‘†иђ¬и‘Їи‘№иђµи“Љи‘ўи’№и’їи’џи“™и“Ќи’»и“љи“ђи“Ѓи“†и“–и’Ўи”Ўи“їи“ґи”—и”и”¬и”џи”•и””и“ји•Ђи•Ји•и•€"],
    ["e540","и•Ѓи‚и•‹и••и–Ђи–¤и–€и–‘и–Љи–Ёи•­и–”и–›и—Єи–‡и–њи•·и•ѕи–ђи—‰и–єи—Џи–№и—ђи—•и—ќи—Ґи—њи—№иЉи“и‹и—ѕи—єи†иўиљи°иїи™Ќд№•и™”и™џи™§и™±иљ“иљЈиљ©иљЄиљ‹иљЊиљ¶иљЇи›„и›†иљ°и›‰и Јиљ«и›”и›ћи›©и›¬"],
    ["e580","и›џи››и›Їињ’ињ†ињ€ињЂињѓи›»ињ‘ињ‰ињЌи›№ињЉињґињїињ·ињ»ињҐињ©ињљиќ иќџиќёиќЊиќЋиќґиќ—иќЁиќ®иќ™иќ“иќЈиќЄи …ићўићџић‚ићЇиџ‹ићЅиџЂиџђй›–ић«иџ„ићіиџ‡иџ†ић»иџЇиџІиџ и Џи Ќиџѕиџ¶иџ·и Ћиџ’и ‘и –и •и ўи Ўи ±и ¶и №и §и »иЎ„иЎ‚иЎ’иЎ™иЎћиЎўиЎ«иўЃиЎѕиўћиЎµиЎЅиўµиЎІиў‚иў—иў’иў®иў™иўўиўЌиў¤иў°иўїиў±иЈѓиЈ„иЈ”иЈиЈ™иЈќиЈ№и¤‚иЈјиЈґиЈЁиЈІи¤„и¤Њи¤Љи¤“иҐѓи¤ћи¤Ґи¤Єи¤«иҐЃиҐ„и¤»и¤¶и¤ёиҐЊи¤ќиҐ иҐћ"],
    ["e640","иҐ¦иҐ¤иҐ­иҐЄиҐЇиҐґиҐ·иҐѕи¦ѓи¦€и¦Љи¦“и¦и¦Ўи¦©и¦¦и¦¬и¦Їи¦Іи¦єи¦Ѕи¦їи§Ђи§љи§њи§ќи§§и§ґи§ёиЁѓиЁ–иЁђиЁЊиЁ›иЁќиЁҐиЁ¶и©Ѓи©›и©’и©†и©€и©ји©­и©¬и©ўиЄ…иЄ‚иЄ„иЄЁиЄЎиЄ‘иЄҐиЄ¦иЄљиЄЈи«„и«Ќи«‚и«љи««и«іи«§"],
    ["e680","и«¤и«±и¬”и« и«ўи«·и«ћи«›и¬Њи¬‡и¬љи«Ўи¬–и¬ђи¬—и¬ и¬ійћ«и¬¦и¬«и¬ѕи¬Ёи­Ѓи­Њи­Џи­Ћи­‰и­–и­›и­љи­«и­џи­¬и­Їи­ґи­Ѕи®Ђи®Њи®Ћи®’и®“и®–и®™и®љи°єи±Ѓи°їи±€и±Њи±Ћи±ђи±•и±ўи±¬и±ёи±єиІ‚иІ‰иІ…иІЉиІЌиІЋиІ”и±јиІж€ќиІ­иІЄиІЅиІІиІіиІ®иІ¶иі€иіЃиі¤иіЈиіљиіЅиієиі»иґ„иґ…иґЉиґ‡иґЏиґЌиґђйЅЋиґ“иіЌиґ”иґ–иµ§иµ­иµ±иµіи¶Ѓи¶™и·‚и¶ѕи¶єи·Џи·љи·–и·Њи·›и·‹и·Єи·«и·џи·Ји·јиё€иё‰и·їиёќиёћиёђиёџи№‚иёµиё°иёґи№Љ"],
    ["e740","и№‡и№‰и№Њи№ђи№€и№™и№¤и№ иёЄи№Ји№•и№¶и№Іи№јиєЃиє‡иє…иє„иє‹иєЉиє“иє‘иє”иє™иєЄиєЎиє¬иє°и»†иє±иєѕи»…и»€и»‹и»›и»Ји»ји»»и»«и»ѕијЉиј…иј•иј’иј™иј“ијњијџиј›ијЊиј¦ијіиј»иј№иЅ…иЅ‚ијѕиЅЊиЅ‰иЅ†иЅЋиЅ—иЅњ"],
    ["e780","иЅўиЅЈиЅ¤иѕњиѕџиѕЈиѕ­иѕЇиѕ·иїљиїҐиїўиїЄиїЇй‚‡иїґйЂ…иї№иїєйЂ‘йЂ•йЂЎйЂЌйЂћйЂ–йЂ‹йЂ§йЂ¶йЂµйЂ№иїёйЃЏйЃђйЃ‘йЃ’йЂЋйЃ‰йЂѕйЃ–йЃйЃћйЃЁйЃЇйЃ¶йљЁйЃІй‚‚йЃЅй‚Ѓй‚Ђй‚Љй‚‰й‚Џй‚Ёй‚Їй‚±й‚µйѓўйѓ¤ж‰€йѓ›й„‚й„’й„™й„Ій„°й…Љй…–й…й…Јй…Ґй…©й…ій…Ій†‹й†‰й†‚й†ўй†«й†Їй†Єй†µй†ґй†єй‡Ђй‡Ѓй‡‰й‡‹й‡ђй‡–й‡џй‡Ўй‡›й‡јй‡µй‡¶й€ћй‡їй€”й€¬й€•й€‘й‰ћй‰—й‰…й‰‰й‰¤й‰€йЉ•й€їй‰‹й‰ђйЉњйЉ–йЉ“йЉ›й‰љй‹ЏйЉ№йЉ·й‹©йЊЏй‹єйЌ„йЊ®"],
    ["e840","йЊ™йЊўйЊљйЊЈйЊєйЊµйЊ»йЌњйЌ йЌјйЌ®йЌ–йЋ°йЋ¬йЋ­йЋ”йЋ№йЏ–йЏ—йЏЁйЏҐйЏйЏѓйЏќйЏђйЏ€йЏ¤йђљйђ”йђ“йђѓйђ‡йђђйђ¶йђ«йђµйђЎйђєй‘Ѓй‘’й‘„й‘›й‘ й‘ўй‘ћй‘Єй€©й‘°й‘µй‘·й‘Ѕй‘љй‘јй‘ѕй’Ѓй‘їй–‚й–‡й–Љй–”й––й–й–™"],
    ["e880","й– й–Ёй–§й–­й–јй–»й–№й–ѕй—Љжї¶й—ѓй—Ќй—Њй—•й—”й—–й—њй—Ўй—Ґй—ўйЎйЁй®йЇй™‚й™Њй™Џй™‹й™·й™њй™ћй™ќй™џй™¦й™Ій™¬йљЌйљйљ•йљ—йљЄйљ§йљ±йљІйљ°йљґйљ¶йљёйљ№й›Ћй›‹й›‰й›ЌиҐЌй›њйњЌй›•й›№йњ„йњ†йњ€йњ“йњЋйњ‘йњЏйњ–йњ™йњ¤йњЄйњ°йњ№йњЅйњѕйќ„йќ†йќ€йќ‚йќ‰йќњйќ йќ¤йќ¦йќЁе‹’йќ«йќ±йќ№йћ…йќјйћЃйќєйћ†йћ‹йћЏйћђйћњйћЁйћ¦йћЈйћійћґйџѓйџ†йџ€йџ‹йџњйџ­йЅЏйџІз«џйџ¶йџµй Џй Њй ёй ¤й Ўй ·й ЅйЎ†йЎЏйЎ‹йЎ«йЎЇйЎ°"],
    ["e940","йЎ±йЎґйЎійўЄйўЇйў±йў¶йЈ„йЈѓйЈ†йЈ©йЈ«й¤ѓй¤‰й¤’й¤”й¤й¤Ўй¤ќй¤ћй¤¤й¤ й¤¬й¤®й¤Ѕй¤ѕйҐ‚йҐ‰йҐ…йҐђйҐ‹йҐ‘йҐ’йҐЊйҐ•й¦—й¦й¦Ґй¦­й¦®й¦јй§џй§›й§ќй§й§‘й§­й§®й§±й§Ій§»й§ёйЁЃйЁЏйЁ…й§ўйЁ™йЁ«йЁ·й©…й©‚й©Ђй©ѓ"],
    ["e980","йЁѕй©•й©Ќй©›й©—й©џй©ўй©Ґй©¤й©©й©«й©ЄйЄ­йЄ°йЄјй«Ђй«Џй«‘й«“й«”й«ћй«џй«ўй«Јй«¦й«Їй««й«®й«ґй«±й«·й«»й¬†й¬й¬љй¬џй¬ўй¬Јй¬Ґй¬§й¬Ёй¬©й¬Єй¬®й¬Їй¬Ій­„й­ѓй­Џй­Ќй­Ћй­‘й­й­ґй®“й®ѓй®‘й®–й®—й®џй® й®Ёй®ґйЇЂйЇЉй®№йЇ†йЇЏйЇ‘йЇ’йЇЈйЇўйЇ¤йЇ”йЇЎй°єйЇІйЇ±йЇ°й°•й°”й°‰й°“й°Њй°†й°€й°’й°Љй°„й°®й°›й°Ґй°¤й°Ўй°°й±‡й°Ій±†й°ѕй±љй± й±§й±¶й±ёйі§йі¬йі°йґ‰йґ€йі«йґѓйґ†йґЄйґ¦й¶ЇйґЈйґџйµ„йґ•йґ’йµЃйґїйґѕйµ†йµ€"],
    ["ea40","йµќйµћйµ¤йµ‘йµђйµ™йµІй¶‰й¶‡й¶«йµЇйµєй¶љй¶¤й¶©й¶Ій·„й·Ѓй¶»й¶ёй¶єй·†й·Џй·‚й·™й·“й·ёй·¦й·­й·Їй·Ѕйёљйё›йёћй№µй№№й№ЅйєЃйє€йє‹йєЊйє’йє•йє‘йєќйєҐйє©йєёйєЄйє­йќЎй»Њй»Ћй»Џй»ђй»”й»њй»ћй»ќй» й»Ґй»Ёй»Ї"],
    ["ea80","й»ґй»¶й»·й»№й»»й»јй»Ѕйј‡йј€зљ·йј•йјЎйј¬йјѕйЅЉйЅ’йЅ”йЅЈйЅџйЅ йЅЎйЅ¦йЅ§йЅ¬йЅЄйЅ·йЅІйЅ¶йѕ•йѕњйѕ е Їж§‡йЃ™з‘¤е‡њз†™"],
    ["ed40","зєЉи¤њйЌ€йЉ€и“њдї‰з‚»ж±жЈ€й‹№ж›»еЅ…дёЁд»Ўд»јдјЂдјѓдј№дЅ–дѕ’дѕЉдѕљдѕ”дїЌеЃЂеЂўдїїеЂћеЃ†еЃ°еЃ‚е‚”еѓґеѓе…Ље…¤е†ќе†ѕе‡¬е€•еЉњеЉ¦е‹Ђе‹›еЊЂеЊ‡еЊ¤еЌІеЋ“еЋІеЏќпЁЋе’ње’Ље’©е“їе–†еќ™еќҐећ¬еџ€еџ‡пЁЏ"],
    ["ed80","пЁђеўћеўІе¤‹еҐ“еҐ›еҐќеҐЈе¦¤е¦єе­–еЇЂз”ЇеЇеЇ¬е°ћеІ¦еІєеіµеґ§еµ“пЁ‘еµ‚еµ­е¶ёе¶№е·ђејЎејґеЅ§еѕ·еїћжЃќж‚…ж‚Љжѓћжѓ•ж„ жѓІж„‘ж„·ж„°ж†ж€“жЉ¦жЏµж‘ ж’ќж“Ћж•ЋжЂж•ж»ж‰ж®жћж¤ж™Ґж™—ж™™пЁ’ж™іжљ™жљ жљІжљїж›єжњЋп¤©жќ¦жћ»жЎ’жџЂж ЃжЎ„жЈЏпЁ“жҐЁпЁ”ж¦ж§ўжЁ°ж©«ж©†ж©іж©ѕж«ўж«¤жЇ–ж°їж±њжІ†ж±Їжіљжґ„ж¶‡жµЇж¶–ж¶¬ж·Џж·ёж·Іж·јжё№ж№њжё§жёјжєїжѕ€жѕµжїµзЂ…зЂ‡зЂЁз‚…з‚«з„Џз„„з…њз…†з…‡пЁ•з‡Ѓз‡ѕзЉ±"],
    ["ee40","зЉѕзЊ¤пЁ–зЌ·зЋЅзЏ‰зЏ–зЏЈзЏ’зђ‡зЏµзђ¦зђЄзђ©зђ®з‘ўз’‰з’џз”Ѓз•Їзљ‚зљњзљћзљ›зљ¦пЁ—зќ†еЉЇз ЎзЎЋзЎ¤зЎєз¤°пЁпЁ™пЁљз¦”пЁ›з¦›з«‘з«§пЁњз««з®ћпЁќзµ€зµњз¶·з¶ з·–з№’зЅ‡зѕЎпЁћиЊЃиЌўиЌїиЏ‡иЏ¶и‘€и’ґи•“и•™"],
    ["ee80","и•«пЁџи–°пЁ пЁЎи ‡иЈµиЁ’иЁ·и©№иЄ§иЄѕи«џпЁўи«¶и­“и­їиі°иіґиґ’иµ¶пЁЈи»ЏпЁ¤пЁҐйЃ§йѓћпЁ¦й„•й„§й‡љй‡—й‡ћй‡­й‡®й‡¤й‡Ґй€†й€ђй€Љй€єй‰Ђй€јй‰Ћй‰™й‰‘й€№й‰§йЉ§й‰·й‰ёй‹§й‹—й‹™й‹ђпЁ§й‹•й‹ й‹“йЊҐйЊЎй‹»пЁЁйЊћй‹їйЊќйЊ‚йЌ°йЌ—йЋ¤йЏ†йЏћйЏёйђ±й‘…й‘€й–’п§њпЁ©йљќйљЇйњійњ»йќѓйќЌйќЏйќ‘йќ•йЎ—йЎҐпЁЄпЁ«й¤§пЁ¬й¦ћй©Ћй«™й«њй­µй­Ій®Џй®±й®»й°Ђйµ°йµ«пЁ­йё™й»‘"],
    ["eeef","в…°",9,"пїўпї¤пј‡пј‚"],
    ["f040","оЂЂ",62],
    ["f080","оЂї",124],
    ["f140","о‚ј",62],
    ["f180","оѓ»",124],
    ["f240","о…ё",62],
    ["f280","о†·",124],
    ["f340","о€ґ",62],
    ["f380","о‰і",124],
    ["f440","о‹°",62],
    ["f480","оЊЇ",124],
    ["f540","оЋ¬",62],
    ["f580","оЏ«",124],
    ["f640","о‘Ё",62],
    ["f680","о’§",124],
    ["f740","о”¤",62],
    ["f780","о•Ј",124],
    ["f840","о— ",62],
    ["f880","оџ",124],
    ["f940","ољњ"],
    ["fa40","в…°",9,"в… ",9,"пїўпї¤пј‡пј‚г€±в„–в„Ўв€µзєЉи¤њйЌ€йЉ€и“њдї‰з‚»ж±жЈ€й‹№ж›»еЅ…дёЁд»Ўд»јдјЂдјѓдј№дЅ–дѕ’дѕЉдѕљдѕ”дїЌеЃЂеЂўдїїеЂћеЃ†еЃ°еЃ‚е‚”еѓґеѓе…Љ"],
    ["fa80","е…¤е†ќе†ѕе‡¬е€•еЉњеЉ¦е‹Ђе‹›еЊЂеЊ‡еЊ¤еЌІеЋ“еЋІеЏќпЁЋе’ње’Ље’©е“їе–†еќ™еќҐећ¬еџ€еџ‡пЁЏпЁђеўћеўІе¤‹еҐ“еҐ›еҐќеҐЈе¦¤е¦єе­–еЇЂз”ЇеЇеЇ¬е°ћеІ¦еІєеіµеґ§еµ“пЁ‘еµ‚еµ­е¶ёе¶№е·ђејЎејґеЅ§еѕ·еїћжЃќж‚…ж‚Љжѓћжѓ•ж„ жѓІж„‘ж„·ж„°ж†ж€“жЉ¦жЏµж‘ ж’ќж“Ћж•ЋжЂж•ж»ж‰ж®жћж¤ж™Ґж™—ж™™пЁ’ж™іжљ™жљ жљІжљїж›єжњЋп¤©жќ¦жћ»жЎ’жџЂж ЃжЎ„жЈЏпЁ“жҐЁпЁ”ж¦ж§ўжЁ°ж©«ж©†ж©іж©ѕж«ўж«¤жЇ–ж°їж±њжІ†ж±Їжіљжґ„ж¶‡жµЇ"],
    ["fb40","ж¶–ж¶¬ж·Џж·ёж·Іж·јжё№ж№њжё§жёјжєїжѕ€жѕµжїµзЂ…зЂ‡зЂЁз‚…з‚«з„Џз„„з…њз…†з…‡пЁ•з‡Ѓз‡ѕзЉ±зЉѕзЊ¤пЁ–зЌ·зЋЅзЏ‰зЏ–зЏЈзЏ’зђ‡зЏµзђ¦зђЄзђ©зђ®з‘ўз’‰з’џз”Ѓз•Їзљ‚зљњзљћзљ›зљ¦пЁ—зќ†еЉЇз ЎзЎЋзЎ¤зЎєз¤°пЁпЁ™"],
    ["fb80","пЁљз¦”пЁ›з¦›з«‘з«§пЁњз««з®ћпЁќзµ€зµњз¶·з¶ з·–з№’зЅ‡зѕЎпЁћиЊЃиЌўиЌїиЏ‡иЏ¶и‘€и’ґи•“и•™и•«пЁџи–°пЁ пЁЎи ‡иЈµиЁ’иЁ·и©№иЄ§иЄѕи«џпЁўи«¶и­“и­їиі°иіґиґ’иµ¶пЁЈи»ЏпЁ¤пЁҐйЃ§йѓћпЁ¦й„•й„§й‡љй‡—й‡ћй‡­й‡®й‡¤й‡Ґй€†й€ђй€Љй€єй‰Ђй€јй‰Ћй‰™й‰‘й€№й‰§йЉ§й‰·й‰ёй‹§й‹—й‹™й‹ђпЁ§й‹•й‹ й‹“йЊҐйЊЎй‹»пЁЁйЊћй‹їйЊќйЊ‚йЌ°йЌ—йЋ¤йЏ†йЏћйЏёйђ±й‘…й‘€й–’п§њпЁ©йљќйљЇйњійњ»йќѓйќЌйќЏйќ‘йќ•йЎ—йЎҐпЁЄпЁ«й¤§пЁ¬й¦ћй©Ћй«™"],
    ["fc40","й«њй­µй­Ій®Џй®±й®»й°Ђйµ°йµ«пЁ­йё™й»‘"]
    ]
    
    },{}],24:[function(require,module,exports){
    "use strict";
    var Buffer = require("safer-buffer").Buffer;
    
    // Note: UTF16-LE (or UCS2) codec is Node.js native. See encodings/internal.js
    
    // == UTF16-BE codec. ==========================================================
    
    exports.utf16be = Utf16BECodec;
    function Utf16BECodec() {
    }
    
    Utf16BECodec.prototype.encoder = Utf16BEEncoder;
    Utf16BECodec.prototype.decoder = Utf16BEDecoder;
    Utf16BECodec.prototype.bomAware = true;
    
    
    // -- Encoding
    
    function Utf16BEEncoder() {
    }
    
    Utf16BEEncoder.prototype.write = function(str) {
        var buf = Buffer.from(str, 'ucs2');
        for (var i = 0; i < buf.length; i += 2) {
            var tmp = buf[i]; buf[i] = buf[i+1]; buf[i+1] = tmp;
        }
        return buf;
    }
    
    Utf16BEEncoder.prototype.end = function() {
    }
    
    
    // -- Decoding
    
    function Utf16BEDecoder() {
        this.overflowByte = -1;
    }
    
    Utf16BEDecoder.prototype.write = function(buf) {
        if (buf.length == 0)
            return '';
    
        var buf2 = Buffer.alloc(buf.length + 1),
            i = 0, j = 0;
    
        if (this.overflowByte !== -1) {
            buf2[0] = buf[0];
            buf2[1] = this.overflowByte;
            i = 1; j = 2;
        }
    
        for (; i < buf.length-1; i += 2, j+= 2) {
            buf2[j] = buf[i+1];
            buf2[j+1] = buf[i];
        }
    
        this.overflowByte = (i == buf.length-1) ? buf[buf.length-1] : -1;
    
        return buf2.slice(0, j).toString('ucs2');
    }
    
    Utf16BEDecoder.prototype.end = function() {
    }
    
    
    // == UTF-16 codec =============================================================
    // Decoder chooses automatically from UTF-16LE and UTF-16BE using BOM and space-based heuristic.
    // Defaults to UTF-16LE, as it's prevalent and default in Node.
    // http://en.wikipedia.org/wiki/UTF-16 and http://encoding.spec.whatwg.org/#utf-16le
    // Decoder default can be changed: iconv.decode(buf, 'utf16', {defaultEncoding: 'utf-16be'});
    
    // Encoder uses UTF-16LE and prepends BOM (which can be overridden with addBOM: false).
    
    exports.utf16 = Utf16Codec;
    function Utf16Codec(codecOptions, iconv) {
        this.iconv = iconv;
    }
    
    Utf16Codec.prototype.encoder = Utf16Encoder;
    Utf16Codec.prototype.decoder = Utf16Decoder;
    
    
    // -- Encoding (pass-through)
    
    function Utf16Encoder(options, codec) {
        options = options || {};
        if (options.addBOM === undefined)
            options.addBOM = true;
        this.encoder = codec.iconv.getEncoder('utf-16le', options);
    }
    
    Utf16Encoder.prototype.write = function(str) {
        return this.encoder.write(str);
    }
    
    Utf16Encoder.prototype.end = function() {
        return this.encoder.end();
    }
    
    
    // -- Decoding
    
    function Utf16Decoder(options, codec) {
        this.decoder = null;
        this.initialBytes = [];
        this.initialBytesLen = 0;
    
        this.options = options || {};
        this.iconv = codec.iconv;
    }
    
    Utf16Decoder.prototype.write = function(buf) {
        if (!this.decoder) {
            // Codec is not chosen yet. Accumulate initial bytes.
            this.initialBytes.push(buf);
            this.initialBytesLen += buf.length;
            
            if (this.initialBytesLen < 16) // We need more bytes to use space heuristic (see below)
                return '';
    
            // We have enough bytes -> detect endianness.
            var buf = Buffer.concat(this.initialBytes),
                encoding = detectEncoding(buf, this.options.defaultEncoding);
            this.decoder = this.iconv.getDecoder(encoding, this.options);
            this.initialBytes.length = this.initialBytesLen = 0;
        }
    
        return this.decoder.write(buf);
    }
    
    Utf16Decoder.prototype.end = function() {
        if (!this.decoder) {
            var buf = Buffer.concat(this.initialBytes),
                encoding = detectEncoding(buf, this.options.defaultEncoding);
            this.decoder = this.iconv.getDecoder(encoding, this.options);
    
            var res = this.decoder.write(buf),
                trail = this.decoder.end();
    
            return trail ? (res + trail) : res;
        }
        return this.decoder.end();
    }
    
    function detectEncoding(buf, defaultEncoding) {
        var enc = defaultEncoding || 'utf-16le';
    
        if (buf.length >= 2) {
            // Check BOM.
            if (buf[0] == 0xFE && buf[1] == 0xFF) // UTF-16BE BOM
                enc = 'utf-16be';
            else if (buf[0] == 0xFF && buf[1] == 0xFE) // UTF-16LE BOM
                enc = 'utf-16le';
            else {
                // No BOM found. Try to deduce encoding from initial content.
                // Most of the time, the content has ASCII chars (U+00**), but the opposite (U+**00) is uncommon.
                // So, we count ASCII as if it was LE or BE, and decide from that.
                var asciiCharsLE = 0, asciiCharsBE = 0, // Counts of chars in both positions
                    _len = Math.min(buf.length - (buf.length % 2), 64); // Len is always even.
    
                for (var i = 0; i < _len; i += 2) {
                    if (buf[i] === 0 && buf[i+1] !== 0) asciiCharsBE++;
                    if (buf[i] !== 0 && buf[i+1] === 0) asciiCharsLE++;
                }
    
                if (asciiCharsBE > asciiCharsLE)
                    enc = 'utf-16be';
                else if (asciiCharsBE < asciiCharsLE)
                    enc = 'utf-16le';
            }
        }
    
        return enc;
    }
    
    
    
    },{"safer-buffer":28}],25:[function(require,module,exports){
    "use strict";
    var Buffer = require("safer-buffer").Buffer;
    
    // UTF-7 codec, according to https://tools.ietf.org/html/rfc2152
    // See also below a UTF-7-IMAP codec, according to http://tools.ietf.org/html/rfc3501#section-5.1.3
    
    exports.utf7 = Utf7Codec;
    exports.unicode11utf7 = 'utf7'; // Alias UNICODE-1-1-UTF-7
    function Utf7Codec(codecOptions, iconv) {
        this.iconv = iconv;
    };
    
    Utf7Codec.prototype.encoder = Utf7Encoder;
    Utf7Codec.prototype.decoder = Utf7Decoder;
    Utf7Codec.prototype.bomAware = true;
    
    
    // -- Encoding
    
    var nonDirectChars = /[^A-Za-z0-9'\(\),-\.\/:\? \n\r\t]+/g;
    
    function Utf7Encoder(options, codec) {
        this.iconv = codec.iconv;
    }
    
    Utf7Encoder.prototype.write = function(str) {
        // Naive implementation.
        // Non-direct chars are encoded as "+<base64>-"; single "+" char is encoded as "+-".
        return Buffer.from(str.replace(nonDirectChars, function(chunk) {
            return "+" + (chunk === '+' ? '' : 
                this.iconv.encode(chunk, 'utf16-be').toString('base64').replace(/=+$/, '')) 
                + "-";
        }.bind(this)));
    }
    
    Utf7Encoder.prototype.end = function() {
    }
    
    
    // -- Decoding
    
    function Utf7Decoder(options, codec) {
        this.iconv = codec.iconv;
        this.inBase64 = false;
        this.base64Accum = '';
    }
    
    var base64Regex = /[A-Za-z0-9\/+]/;
    var base64Chars = [];
    for (var i = 0; i < 256; i++)
        base64Chars[i] = base64Regex.test(String.fromCharCode(i));
    
    var plusChar = '+'.charCodeAt(0), 
        minusChar = '-'.charCodeAt(0),
        andChar = '&'.charCodeAt(0);
    
    Utf7Decoder.prototype.write = function(buf) {
        var res = "", lastI = 0,
            inBase64 = this.inBase64,
            base64Accum = this.base64Accum;
    
        // The decoder is more involved as we must handle chunks in stream.
    
        for (var i = 0; i < buf.length; i++) {
            if (!inBase64) { // We're in direct mode.
                // Write direct chars until '+'
                if (buf[i] == plusChar) {
                    res += this.iconv.decode(buf.slice(lastI, i), "ascii"); // Write direct chars.
                    lastI = i+1;
                    inBase64 = true;
                }
            } else { // We decode base64.
                if (!base64Chars[buf[i]]) { // Base64 ended.
                    if (i == lastI && buf[i] == minusChar) {// "+-" -> "+"
                        res += "+";
                    } else {
                        var b64str = base64Accum + buf.slice(lastI, i).toString();
                        res += this.iconv.decode(Buffer.from(b64str, 'base64'), "utf16-be");
                    }
    
                    if (buf[i] != minusChar) // Minus is absorbed after base64.
                        i--;
    
                    lastI = i+1;
                    inBase64 = false;
                    base64Accum = '';
                }
            }
        }
    
        if (!inBase64) {
            res += this.iconv.decode(buf.slice(lastI), "ascii"); // Write direct chars.
        } else {
            var b64str = base64Accum + buf.slice(lastI).toString();
    
            var canBeDecoded = b64str.length - (b64str.length % 8); // Minimal chunk: 2 quads -> 2x3 bytes -> 3 chars.
            base64Accum = b64str.slice(canBeDecoded); // The rest will be decoded in future.
            b64str = b64str.slice(0, canBeDecoded);
    
            res += this.iconv.decode(Buffer.from(b64str, 'base64'), "utf16-be");
        }
    
        this.inBase64 = inBase64;
        this.base64Accum = base64Accum;
    
        return res;
    }
    
    Utf7Decoder.prototype.end = function() {
        var res = "";
        if (this.inBase64 && this.base64Accum.length > 0)
            res = this.iconv.decode(Buffer.from(this.base64Accum, 'base64'), "utf16-be");
    
        this.inBase64 = false;
        this.base64Accum = '';
        return res;
    }
    
    
    // UTF-7-IMAP codec.
    // RFC3501 Sec. 5.1.3 Modified UTF-7 (http://tools.ietf.org/html/rfc3501#section-5.1.3)
    // Differences:
    //  * Base64 part is started by "&" instead of "+"
    //  * Direct characters are 0x20-0x7E, except "&" (0x26)
    //  * In Base64, "," is used instead of "/"
    //  * Base64 must not be used to represent direct characters.
    //  * No implicit shift back from Base64 (should always end with '-')
    //  * String must end in non-shifted position.
    //  * "-&" while in base64 is not allowed.
    
    
    exports.utf7imap = Utf7IMAPCodec;
    function Utf7IMAPCodec(codecOptions, iconv) {
        this.iconv = iconv;
    };
    
    Utf7IMAPCodec.prototype.encoder = Utf7IMAPEncoder;
    Utf7IMAPCodec.prototype.decoder = Utf7IMAPDecoder;
    Utf7IMAPCodec.prototype.bomAware = true;
    
    
    // -- Encoding
    
    function Utf7IMAPEncoder(options, codec) {
        this.iconv = codec.iconv;
        this.inBase64 = false;
        this.base64Accum = Buffer.alloc(6);
        this.base64AccumIdx = 0;
    }
    
    Utf7IMAPEncoder.prototype.write = function(str) {
        var inBase64 = this.inBase64,
            base64Accum = this.base64Accum,
            base64AccumIdx = this.base64AccumIdx,
            buf = Buffer.alloc(str.length*5 + 10), bufIdx = 0;
    
        for (var i = 0; i < str.length; i++) {
            var uChar = str.charCodeAt(i);
            if (0x20 <= uChar && uChar <= 0x7E) { // Direct character or '&'.
                if (inBase64) {
                    if (base64AccumIdx > 0) {
                        bufIdx += buf.write(base64Accum.slice(0, base64AccumIdx).toString('base64').replace(/\//g, ',').replace(/=+$/, ''), bufIdx);
                        base64AccumIdx = 0;
                    }
    
                    buf[bufIdx++] = minusChar; // Write '-', then go to direct mode.
                    inBase64 = false;
                }
    
                if (!inBase64) {
                    buf[bufIdx++] = uChar; // Write direct character
    
                    if (uChar === andChar)  // Ampersand -> '&-'
                        buf[bufIdx++] = minusChar;
                }
    
            } else { // Non-direct character
                if (!inBase64) {
                    buf[bufIdx++] = andChar; // Write '&', then go to base64 mode.
                    inBase64 = true;
                }
                if (inBase64) {
                    base64Accum[base64AccumIdx++] = uChar >> 8;
                    base64Accum[base64AccumIdx++] = uChar & 0xFF;
    
                    if (base64AccumIdx == base64Accum.length) {
                        bufIdx += buf.write(base64Accum.toString('base64').replace(/\//g, ','), bufIdx);
                        base64AccumIdx = 0;
                    }
                }
            }
        }
    
        this.inBase64 = inBase64;
        this.base64AccumIdx = base64AccumIdx;
    
        return buf.slice(0, bufIdx);
    }
    
    Utf7IMAPEncoder.prototype.end = function() {
        var buf = Buffer.alloc(10), bufIdx = 0;
        if (this.inBase64) {
            if (this.base64AccumIdx > 0) {
                bufIdx += buf.write(this.base64Accum.slice(0, this.base64AccumIdx).toString('base64').replace(/\//g, ',').replace(/=+$/, ''), bufIdx);
                this.base64AccumIdx = 0;
            }
    
            buf[bufIdx++] = minusChar; // Write '-', then go to direct mode.
            this.inBase64 = false;
        }
    
        return buf.slice(0, bufIdx);
    }
    
    
    // -- Decoding
    
    function Utf7IMAPDecoder(options, codec) {
        this.iconv = codec.iconv;
        this.inBase64 = false;
        this.base64Accum = '';
    }
    
    var base64IMAPChars = base64Chars.slice();
    base64IMAPChars[','.charCodeAt(0)] = true;
    
    Utf7IMAPDecoder.prototype.write = function(buf) {
        var res = "", lastI = 0,
            inBase64 = this.inBase64,
            base64Accum = this.base64Accum;
    
        // The decoder is more involved as we must handle chunks in stream.
        // It is forgiving, closer to standard UTF-7 (for example, '-' is optional at the end).
    
        for (var i = 0; i < buf.length; i++) {
            if (!inBase64) { // We're in direct mode.
                // Write direct chars until '&'
                if (buf[i] == andChar) {
                    res += this.iconv.decode(buf.slice(lastI, i), "ascii"); // Write direct chars.
                    lastI = i+1;
                    inBase64 = true;
                }
            } else { // We decode base64.
                if (!base64IMAPChars[buf[i]]) { // Base64 ended.
                    if (i == lastI && buf[i] == minusChar) { // "&-" -> "&"
                        res += "&";
                    } else {
                        var b64str = base64Accum + buf.slice(lastI, i).toString().replace(/,/g, '/');
                        res += this.iconv.decode(Buffer.from(b64str, 'base64'), "utf16-be");
                    }
    
                    if (buf[i] != minusChar) // Minus may be absorbed after base64.
                        i--;
    
                    lastI = i+1;
                    inBase64 = false;
                    base64Accum = '';
                }
            }
        }
    
        if (!inBase64) {
            res += this.iconv.decode(buf.slice(lastI), "ascii"); // Write direct chars.
        } else {
            var b64str = base64Accum + buf.slice(lastI).toString().replace(/,/g, '/');
    
            var canBeDecoded = b64str.length - (b64str.length % 8); // Minimal chunk: 2 quads -> 2x3 bytes -> 3 chars.
            base64Accum = b64str.slice(canBeDecoded); // The rest will be decoded in future.
            b64str = b64str.slice(0, canBeDecoded);
    
            res += this.iconv.decode(Buffer.from(b64str, 'base64'), "utf16-be");
        }
    
        this.inBase64 = inBase64;
        this.base64Accum = base64Accum;
    
        return res;
    }
    
    Utf7IMAPDecoder.prototype.end = function() {
        var res = "";
        if (this.inBase64 && this.base64Accum.length > 0)
            res = this.iconv.decode(Buffer.from(this.base64Accum, 'base64'), "utf16-be");
    
        this.inBase64 = false;
        this.base64Accum = '';
        return res;
    }
    
    
    
    },{"safer-buffer":28}],26:[function(require,module,exports){
    "use strict";
    
    var BOMChar = '\uFEFF';
    
    exports.PrependBOM = PrependBOMWrapper
    function PrependBOMWrapper(encoder, options) {
        this.encoder = encoder;
        this.addBOM = true;
    }
    
    PrependBOMWrapper.prototype.write = function(str) {
        if (this.addBOM) {
            str = BOMChar + str;
            this.addBOM = false;
        }
    
        return this.encoder.write(str);
    }
    
    PrependBOMWrapper.prototype.end = function() {
        return this.encoder.end();
    }
    
    
    //------------------------------------------------------------------------------
    
    exports.StripBOM = StripBOMWrapper;
    function StripBOMWrapper(decoder, options) {
        this.decoder = decoder;
        this.pass = false;
        this.options = options || {};
    }
    
    StripBOMWrapper.prototype.write = function(buf) {
        var res = this.decoder.write(buf);
        if (this.pass || !res)
            return res;
    
        if (res[0] === BOMChar) {
            res = res.slice(1);
            if (typeof this.options.stripBOM === 'function')
                this.options.stripBOM();
        }
    
        this.pass = true;
        return res;
    }
    
    StripBOMWrapper.prototype.end = function() {
        return this.decoder.end();
    }
    
    
    },{}],27:[function(require,module,exports){
    (function (process){
    "use strict";
    
    // Some environments don't have global Buffer (e.g. React Native).
    // Solution would be installing npm modules "buffer" and "stream" explicitly.
    var Buffer = require("safer-buffer").Buffer;
    
    var bomHandling = require("./bom-handling"),
        iconv = module.exports;
    
    // All codecs and aliases are kept here, keyed by encoding name/alias.
    // They are lazy loaded in `iconv.getCodec` from `encodings/index.js`.
    iconv.encodings = null;
    
    // Characters emitted in case of error.
    iconv.defaultCharUnicode = 'пїЅ';
    iconv.defaultCharSingleByte = '?';
    
    // Public API.
    iconv.encode = function encode(str, encoding, options) {
        str = "" + (str || ""); // Ensure string.
    
        var encoder = iconv.getEncoder(encoding, options);
    
        var res = encoder.write(str);
        var trail = encoder.end();
        
        return (trail && trail.length > 0) ? Buffer.concat([res, trail]) : res;
    }
    
    iconv.decode = function decode(buf, encoding, options) {
        if (typeof buf === 'string') {
            if (!iconv.skipDecodeWarning) {
                console.error('Iconv-lite warning: decode()-ing strings is deprecated. Refer to https://github.com/ashtuchkin/iconv-lite/wiki/Use-Buffers-when-decoding');
                iconv.skipDecodeWarning = true;
            }
    
            buf = Buffer.from("" + (buf || ""), "binary"); // Ensure buffer.
        }
    
        var decoder = iconv.getDecoder(encoding, options);
    
        var res = decoder.write(buf);
        var trail = decoder.end();
    
        return trail ? (res + trail) : res;
    }
    
    iconv.encodingExists = function encodingExists(enc) {
        try {
            iconv.getCodec(enc);
            return true;
        } catch (e) {
            return false;
        }
    }
    
    // Legacy aliases to convert functions
    iconv.toEncoding = iconv.encode;
    iconv.fromEncoding = iconv.decode;
    
    // Search for a codec in iconv.encodings. Cache codec data in iconv._codecDataCache.
    iconv._codecDataCache = {};
    iconv.getCodec = function getCodec(encoding) {
        if (!iconv.encodings)
            iconv.encodings = require("../encodings"); // Lazy load all encoding definitions.
        
        // Canonicalize encoding name: strip all non-alphanumeric chars and appended year.
        var enc = iconv._canonicalizeEncoding(encoding);
    
        // Traverse iconv.encodings to find actual codec.
        var codecOptions = {};
        while (true) {
            var codec = iconv._codecDataCache[enc];
            if (codec)
                return codec;
    
            var codecDef = iconv.encodings[enc];
    
            switch (typeof codecDef) {
                case "string": // Direct alias to other encoding.
                    enc = codecDef;
                    break;
    
                case "object": // Alias with options. Can be layered.
                    for (var key in codecDef)
                        codecOptions[key] = codecDef[key];
    
                    if (!codecOptions.encodingName)
                        codecOptions.encodingName = enc;
                    
                    enc = codecDef.type;
                    break;
    
                case "function": // Codec itself.
                    if (!codecOptions.encodingName)
                        codecOptions.encodingName = enc;
    
                    // The codec function must load all tables and return object with .encoder and .decoder methods.
                    // It'll be called only once (for each different options object).
                    codec = new codecDef(codecOptions, iconv);
    
                    iconv._codecDataCache[codecOptions.encodingName] = codec; // Save it to be reused later.
                    return codec;
    
                default:
                    throw new Error("Encoding not recognized: '" + encoding + "' (searched as: '"+enc+"')");
            }
        }
    }
    
    iconv._canonicalizeEncoding = function(encoding) {
        // Canonicalize encoding name: strip all non-alphanumeric chars and appended year.
        return (''+encoding).toLowerCase().replace(/:\d{4}$|[^0-9a-z]/g, "");
    }
    
    iconv.getEncoder = function getEncoder(encoding, options) {
        var codec = iconv.getCodec(encoding),
            encoder = new codec.encoder(options, codec);
    
        if (codec.bomAware && options && options.addBOM)
            encoder = new bomHandling.PrependBOM(encoder, options);
    
        return encoder;
    }
    
    iconv.getDecoder = function getDecoder(encoding, options) {
        var codec = iconv.getCodec(encoding),
            decoder = new codec.decoder(options, codec);
    
        if (codec.bomAware && !(options && options.stripBOM === false))
            decoder = new bomHandling.StripBOM(decoder, options);
    
        return decoder;
    }
    
    
    // Load extensions in Node. All of them are omitted in Browserify build via 'browser' field in package.json.
    var nodeVer = typeof process !== 'undefined' && process.versions && process.versions.node;
    if (nodeVer) {
    
        // Load streaming support in Node v0.10+
        var nodeVerArr = nodeVer.split(".").map(Number);
        if (nodeVerArr[0] > 0 || nodeVerArr[1] >= 10) {
            require("./streams")(iconv);
        }
    
        // Load Node primitive extensions.
        require("./extend-node")(iconv);
    }
    
    if ("ДЂ" != "\u0100") {
        console.error("iconv-lite warning: javascript files use encoding different from utf-8. See https://github.com/ashtuchkin/iconv-lite/wiki/Javascript-source-file-encodings for more info.");
    }
    
    }).call(this,require('_process'))
    },{"../encodings":11,"./bom-handling":26,"./extend-node":2,"./streams":2,"_process":5,"safer-buffer":28}],28:[function(require,module,exports){
    (function (process){
    /* eslint-disable node/no-deprecated-api */
    
    'use strict'
    
    var buffer = require('buffer')
    var Buffer = buffer.Buffer
    
    var safer = {}
    
    var key
    
    for (key in buffer) {
      if (!buffer.hasOwnProperty(key)) continue
      if (key === 'SlowBuffer' || key === 'Buffer') continue
      safer[key] = buffer[key]
    }
    
    var Safer = safer.Buffer = {}
    for (key in Buffer) {
      if (!Buffer.hasOwnProperty(key)) continue
      if (key === 'allocUnsafe' || key === 'allocUnsafeSlow') continue
      Safer[key] = Buffer[key]
    }
    
    safer.Buffer.prototype = Buffer.prototype
    
    if (!Safer.from || Safer.from === Uint8Array.from) {
      Safer.from = function (value, encodingOrOffset, length) {
        if (typeof value === 'number') {
          throw new TypeError('The "value" argument must not be of type number. Received type ' + typeof value)
        }
        if (value && typeof value.length === 'undefined') {
          throw new TypeError('The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type ' + typeof value)
        }
        return Buffer(value, encodingOrOffset, length)
      }
    }
    
    if (!Safer.alloc) {
      Safer.alloc = function (size, fill, encoding) {
        if (typeof size !== 'number') {
          throw new TypeError('The "size" argument must be of type number. Received type ' + typeof size)
        }
        if (size < 0 || size >= 2 * (1 << 30)) {
          throw new RangeError('The value "' + size + '" is invalid for option "size"')
        }
        var buf = Buffer(size)
        if (!fill || fill.length === 0) {
          buf.fill(0)
        } else if (typeof encoding === 'string') {
          buf.fill(fill, encoding)
        } else {
          buf.fill(fill)
        }
        return buf
      }
    }
    
    if (!safer.kStringMaxLength) {
      try {
        safer.kStringMaxLength = process.binding('buffer').kStringMaxLength
      } catch (e) {
        // we can't determine kStringMaxLength in environments where process.binding
        // is unsupported, so let's not set it
      }
    }
    
    if (!safer.constants) {
      safer.constants = {
        MAX_LENGTH: safer.kMaxLength
      }
      if (safer.kStringMaxLength) {
        safer.constants.MAX_STRING_LENGTH = safer.kStringMaxLength
      }
    }
    
    module.exports = safer
    
    }).call(this,require('_process'))
    },{"_process":5,"buffer":3}]},{},[8]);