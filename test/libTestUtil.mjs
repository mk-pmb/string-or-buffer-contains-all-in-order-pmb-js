// -*- coding: utf-8, tab-width: 2 -*-

import zlib from 'node:zlib';


const tu = {

  oneLineJson(x) { return JSON.stringify(x, null, 1).replace(/\n\s*/g, ' '); },

  gzipStr(s) { return zlib.gzipSync(Buffer.from(s, 'UTF-8')); },

  hex2buf(h) {
    if (Array.isArray(h)) { return h.map(tu.hex2buf); }
    return Buffer.from(h.replace(/\s/g, ''), 'hex');
  },

  buf2hex8(b) {
    if (Array.isArray(b)) { return b.map(tu.buf2hex8); }
    if (!Buffer.isBuffer(b)) { throw new TypeError('Need array or Buffer!'); }
    return b.toString('hex').replace(/(\S{8})(?!$)/g, '$1 ');
  },

};


export default tu;
