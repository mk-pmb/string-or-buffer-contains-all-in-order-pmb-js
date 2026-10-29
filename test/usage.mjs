// -*- coding: utf-8, tab-width: 2 -*-

import eq from 'equal-pmb';

import caio from '../index.mjs';
import libTestUtil from './libTestUtil.mjs';


const hw = 'Hello world!';

eq(caio(hw, ['Hel', 'lo w', 'or', 'ld!']), true);
eq(caio(hw, ['Hel', 'or', 'ld!']), true);
eq(caio(hw, ['Hel', 'lo w', 'ld!']), true);
eq(caio(hw, ['hel', 'lo w', 'ld!']), false);
eq(caio(hw, ['llo']), true);
eq(caio(hw, ['Llo']), false);
eq(caio(hw, ['lo w']), true);
eq(caio(hw, ['low']), false);
eq(caio(hw, ['ello', 'lo w']), false);
eq(caio(hw, ['', 'lo w']), true);
eq(caio(hw, ['', 'lo w', '']), true);
eq(caio(hw, ['lo w', '']), true);
eq(caio(hw, ['', '', '']), true);

const aS = { anchored: 'start' };
const aE = { anchored: 'end' };
const aB = { anchored: 'both' };
eq(caio(hw, ['Hel', 'o w']), true);
eq(caio(hw, ['Hel', 'o w'], aS), true);
eq(caio(hw, ['Hel', 'o w'], aB), false);
eq(caio(hw, ['ell', 'o w']), true);
eq(caio(hw, ['ell', 'o w'], aS), false);
eq(caio(hw, ['ell', 'o w'], aB), false);
eq(caio(hw, ['o w', 'ld']), true);
eq(caio(hw, ['o w', 'ld'], aE), false);
eq(caio(hw, ['o w', 'ld'], aB), false);



const gz = libTestUtil.gzipStr(hw);
const { hex2buf, buf2hex8 } = libTestUtil;
// Verify we invoked zlib correctly:
eq(buf2hex8(gz), '1f8b0800 00000000 0003f348 cdc9c957'
              + ' 28cf2fca 49510400 9519851b 0c000000');

eq(caio(gz, ['Hel', 'lo w', 'or', 'ld!']), false);
eq(caio(gz, hex2buf(['1f8b0800', '0003f348', 'cdc9c957'])), true);
eq(caio(gz, hex2buf(['1f8b0800', '0003f348', 'cdc9c957']), aS), true);
eq(caio(gz, hex2buf(['0003f348', 'cdc9c957', '0c000000']), aS), false);
eq(caio(gz, hex2buf(['1f8b0800', '0003f348', 'cdc9c957']), aE), false);
eq(caio(gz, hex2buf(['1f8b0800', '0003f348', '0c000000']), aE), true);
eq(caio(gz, hex2buf(['1f8b0800', '0003f348', '0c000000']), aB), true);
eq(caio(gz, hex2buf(['1f8b0800', '0003f348', 'cdc9c957']), aB), false);
eq(caio(gz, hex2buf(['0003f348', '0003f348', '0c000000']), aB), false);


const { capture } = libTestUtil;
capture.store = true;
capture(hw, ['Hel', 'o w'], null, true, [
  { start: 0, length: 3, after: 3 },
  { start: 4, length: 3, after: 7 },
]);
capture(hw, ['Hel', 'o w'], aS, true, [
  { start: 0, length: 3, after: 3 },
  { start: 4, length: 3, after: 7 },
]);
capture(hw, ['Hel', 'o w'], aB, false);
capture(hw, ['ell', 'o w'], null, true, [
  { start: 1, length: 3, after: 4 },
  { start: 4, length: 3, after: 7 },
]);
capture(hw, ['ell', 'o w'], aS, false);
capture(hw, ['ell', 'o w'], aB, false);
capture.store = [];
capture(hw, ['o w', 'ld'], null, true, [
  { start: 4, length: 3, after: 7 },
  { start: 9, length: 2, after: 11 },
]);

// The next test will capture a partial match before failing the end anchor:
capture(hw, ['o w', 'ld'], aE, false);
eq(capture.store, [
  // The old captures are still in:
  { start: 4, length: 3, after: 7 },
  { start: 9, length: 2, after: 11 },
  // The new captures from the partial match were appended:
  { start: 4, length: 3, after: 7 },
]);

capture(hw, ['o w', 'ld'], aB, false);
// No capture because the start anchor failed:
eq(capture.store.length, 3);

/* Now we repeat the first capture(…, aS, …) start anchor test from above
  to demonstrate that our capture array has not been cleaned up. */
capture(hw, ['Hel', 'o w'], aS, true, [
  // The old captures are still in:
  { start: 4, length: 3, after: 7 },
  { start: 9, length: 2, after: 11 },
  { start: 4, length: 3, after: 7 },
  // The new captures from the start anchor test were appended:
  { start: 0, length: 3, after: 3 },
  { start: 4, length: 3, after: 7 },
]);


/* Demonstrate how the end anchor affects match position: */
const zeroBuf = hex2buf('000000');
const emptyBuf = Buffer.from('');
capture.store = ['old array content unaffected'];
capture(gz, [zeroBuf], aS, false);
capture(gz, [zeroBuf], null, true, [
  'old array content unaffected',
  // Zero buffer matched without anchor:
  { start: 3, length: 3, after: 6 },
]);
capture(gz, [zeroBuf], aE, true, [
  'old array content unaffected',
  { start: 3, length: 3, after: 6 },
  // Zero buffer matched with end anchor:
  { start: 29, length: 3, after: gz.length },
]);
capture(gz, [zeroBuf, emptyBuf], aE, true, [
  'old array content unaffected',
  { start: 3, length: 3, after: 6 },
  { start: 29, length: 3, after: gz.length },
  // Zero buffer matched early because end anchor only affects the emptyBuf:
  { start: 3, length: 3, after: 6 },
  { start: gz.length, length: 0, after: gz.length },
]);


function rwc(mask) { return caio.readWildcards(hw, mask.split('*')); }
eq(rwc('Hel*lo w*or*ld!'), ['', '', '']);
eq(rwc('Hel*or*ld!'), ['lo w', '']);
eq(rwc('Hel*lo w*ld!'), ['', 'or']);
eq(rwc('Hel*lo w***ld!*'), ['', '', '', 'or', '']);
eq(rwc('hel*lo w*ld!'), false);
eq(rwc('llo'), false);  // didn't match because rwc is anchored=both
eq(rwc('Llo'), false);  // case mismatch
eq(rwc('lo w'), false); // both anchors
eq(rwc('low'), false);  // both anchors
eq(rwc('ello*lo w'), false);  // both anchors
eq(rwc('*lo w'), false);  // end anchor
eq(rwc('*lo w*'), ['Hel', 'orld!']);
eq(rwc('lo w*'), false);  // start anchor
eq(rwc('**'), ['', hw]);
eq(rwc('***'), ['', '', hw]);







console.info('+OK usage test passed.');
