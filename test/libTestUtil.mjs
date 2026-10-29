// -*- coding: utf-8, tab-width: 2 -*-

import zlib from 'node:zlib';

import eq from 'equal-pmb';

import caio from '../index.mjs';

caio.setVerbose(+process.env.DEBUGLEVEL >= 2);


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

  capture(hay, needles, opt, expectedResult, expectedCapture) {
    const { store } = tu.capture;
    const actualResult = caio(hay, needles, { captureIndexes: store, ...opt });
    eq(!!actualResult, expectedResult);
    if (actualResult) {
      eq(actualResult, expectedCapture);
      if (Array.isArray(store)) {
        eq.strictEqual(actualResult, store);
        eq(actualResult, expectedCapture);
      }
    }
  },


};


tu.capture.store = false;


export default tu;
