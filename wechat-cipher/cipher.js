/* 微信翻译克星 —— 纯前端，无依赖，可离线运行 */
(function (root, factory) {
  var api = factory();
  if (typeof module !== 'undefined' && module.exports) { module.exports = api; }
  else { root.Cipher = api; }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  var EMOJI = ['😀','😃','😄','😁','😆','😅','😂','🤣','😊','😇','🙂','🙃','😉','😌','😍','🥰'];
  var ZW0 = '\u200b', ZW1 = '\u200c';

  function utf8Bytes(str) {
    var out = [];
    for (var i = 0; i < str.length; i++) {
      var cp = str.codePointAt(i);
      if (cp > 0xffff) { i++; }
      if (cp < 0x80) { out.push(cp); }
      else if (cp < 0x800) { out.push(0xc0 | (cp >> 6), 0x80 | (cp & 63)); }
      else if (cp < 0x10000) { out.push(0xe0 | (cp >> 12), 0x80 | ((cp >> 6) & 63), 0x80 | (cp & 63)); }
      else { out.push(0xf0 | (cp >> 18), 0x80 | ((cp >> 12) & 63), 0x80 | ((cp >> 6) & 63), 0x80 | (cp & 63)); }
    }
    return out;
  }

  function bytesToUtf8(b) {
    var s = '', i = 0;
    while (i < b.length) {
      var c = b[i++];
      if (c < 0x80) { s += String.fromCharCode(c); }
      else if (c < 0xe0) { s += String.fromCharCode(((c & 31) << 6) | (b[i++] & 63)); }
      else if (c < 0xf0) { s += String.fromCharCode(((c & 15) << 12) | ((b[i++] & 63) << 6) | (b[i++] & 63)); }
      else {
        var cp = ((c & 7) << 18) | ((b[i++] & 63) << 12) | ((b[i++] & 63) << 6) | (b[i++] & 63);
        cp -= 0x10000;
        s += String.fromCharCode(0xd800 + (cp >> 10), 0xdc00 + (cp & 1023));
      }
    }
    return s;
  }

  function toBase64(str) {
    var b = utf8Bytes(str), o = '';
    for (var i = 0; i < b.length; i += 3) {
      var b0 = b[i], b1 = b[i + 1], b2 = b[i + 2];
      var n = (b0 << 16) | ((b1 === undefined ? 0 : b1) << 8) | (b2 === undefined ? 0 : b2);
      o += B64[(n >> 18) & 63] + B64[(n >> 12) & 63];
      o += (b1 === undefined) ? '=' : B64[(n >> 6) & 63];
      o += (b2 === undefined) ? '=' : B64[n & 63];
    }
    return o;
  }

  function fromBase64(s) {
    s = String(s).replace(/[^A-Za-z0-9+/=]/g, '');
    var out = [];
    for (var i = 0; i < s.length; i += 4) {
      var c0 = B64.indexOf(s[i]), c1 = B64.indexOf(s[i + 1]);
      var c2 = (s[i + 2] === '=' || s[i + 2] === undefined) ? -1 : B64.indexOf(s[i + 2]);
      var c3 = (s[i + 3] === '=' || s[i + 3] === undefined) ? -1 : B64.indexOf(s[i + 3]);
      if (c0 < 0 || c1 < 0) { break; }
      var n = (c0 << 18) | (c1 << 12) | ((c2 < 0 ? 0 : c2) << 6) | (c3 < 0 ? 0 : c3);
      out.push((n >> 16) & 255);
      if (c2 >= 0) { out.push((n >> 8) & 255); }
      if (c3 >= 0) { out.push(n & 255); }
    }
    return bytesToUtf8(out);
  }

  function toEmoji(str) {
    var b = utf8Bytes(str), o = '';
    for (var i = 0; i < b.length; i++) { o += EMOJI[b[i] >> 4] + EMOJI[b[i] & 15]; }
    return o;
  }

  function fromEmoji(s) {
    var chars = Array.from(String(s)), nib = [], out = [];
    for (var i = 0; i < chars.length; i++) {
      var k = EMOJI.indexOf(chars[i]);
      if (k >= 0) { nib.push(k); }
    }
    for (var j = 0; j + 1 < nib.length; j += 2) { out.push((nib[j] << 4) | nib[j + 1]); }
    return bytesToUtf8(out);
  }

  function toPython(str) {
    var cps = [];
    for (var i = 0; i < str.length; i++) {
      var cp = str.codePointAt(i);
      if (cp > 0xffff) { i++; }
      cps.push(cp);
    }
    return 'print("".join(chr(c) for c in ' + JSON.stringify(cps) + '))';
  }

  function fromPython(s) {
    var m = String(s).match(/\d+/g) || [];
    var out = '';
    for (var i = 0; i < m.length; i++) { out += String.fromCodePoint(parseInt(m[i], 10)); }
    return out;
  }

  function toBrainfuck(str) {
    var b = utf8Bytes(str), o = '';
    for (var i = 0; i < b.length; i++) {
      var v = b[i];
      var a = Math.max(1, Math.round(Math.sqrt(v)));
      var q = Math.floor(v / a), r = v - a * q;
      o += '+'.repeat(a);
      o += '[>' + '+'.repeat(q) + '<-]';
      o += '>' + '+'.repeat(r) + '.[-]<';
    }
    return o;
  }

  function runBrainfuck(code, maxSteps) {
    var tape = new Uint8Array(200000), ptr = 0, out = [], pc = 0, steps = 0;
    var stack = [], map = {};
    for (var i = 0; i < code.length; i++) {
      if (code[i] === '[') { stack.push(i); }
      else if (code[i] === ']') { var j = stack.pop(); map[i] = j; map[j] = i; }
    }
    var limit = maxSteps || 20000000;
    while (pc < code.length) {
      if (++steps > limit) { throw new Error('脑力操跑太久，放弃'); }
      var c = code[pc];
      if (c === '+') { tape[ptr] = (tape[ptr] + 1) & 255; }
      else if (c === '-') { tape[ptr] = (tape[ptr] - 1) & 255; }
      else if (c === '>') { ptr++; }
      else if (c === '<') { ptr = ptr > 0 ? ptr - 1 : 0; }
      else if (c === '.') { out.push(tape[ptr]); }
      else if (c === '[') { if (tape[ptr] === 0) { pc = map[pc]; } }
      else if (c === ']') { if (tape[ptr] !== 0) { pc = map[pc]; } }
      pc++;
    }
    return bytesToUtf8(out);
  }

  function toInvisible(str) {
    var b = utf8Bytes(str), o = '';
    for (var i = 0; i < b.length; i++) {
      for (var k = 7; k >= 0; k--) { o += ((b[i] >> k) & 1) ? ZW1 : ZW0; }
    }
    return o;
  }

  function fromInvisible(s) {
    var chars = String(s), bits = '';
    for (var i = 0; i < chars.length; i++) {
      if (chars[i] === ZW0) { bits += '0'; }
      else if (chars[i] === ZW1) { bits += '1'; }
    }
    var out = [];
    for (var j = 0; j + 8 <= bits.length; j += 8) { out.push(parseInt(bits.substr(j, 8), 2)); }
    return bytesToUtf8(out);
  }

  return {
    utf8Bytes: utf8Bytes, bytesToUtf8: bytesToUtf8,
    toBase64: toBase64, fromBase64: fromBase64,
    toEmoji: toEmoji, fromEmoji: fromEmoji,
    toPython: toPython, fromPython: fromPython,
    toBrainfuck: toBrainfuck, fromBrainfuck: runBrainfuck,
    toInvisible: toInvisible, fromInvisible: fromInvisible
  };
});
