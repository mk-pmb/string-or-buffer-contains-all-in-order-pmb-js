// -*- coding: utf-8, tab-width: 2 -*-

const doNothing = Boolean;
let cdbg = doNothing;


const EX = function containsAllInOrder(haystack, needles, opt) {
  cdbg(EX.name, '?', [haystack], needles, opt);
  const result = EX.core(haystack, needles, opt || false);
  cdbg(EX.name, '=', result);
  return result;
};


Object.assign(EX, {

  setVerbose(v) {
    if (v) { cdbg = console.debug.bind(console, 'T:'); };
  },


  core(haystack, needles, opt) {
    const neeCount = needles.length;
    const capture = opt.captureIndexes;
    if (neeCount < 1) { return (capture || true); }
    EX.mustBeFinNum('number of needles', neeCount);

    const hayCount = haystack.length;
    // if (hayCount < 1) { return false; } // nope, all needles could be empty!
    EX.mustBeFinNum('haystack length', hayCount);

    const anchored = EX.decodeAnchored(opt.anchored);
    const state = {
      capture,
      neeIdx: -1,
      neeVal: false,
      hayCount,
      haystack,
      latestCapture: false,
      neeCount,
      needles,
      pos: 0,
    };
    if (state.capture === true) { state.capture = []; }
    EX.learnNextNeedle(state);

    if (anchored.start) {
      cdbg('if anchored.start:', state);
      if (!EX.robustStartsWith(state)) { return false; }
      cdbg('found anchored.start!');
      EX.foundNeedle(state);
    }

    const unanchoredStop = neeCount - (anchored.end ? 1 : 0);
    while (state.neeIdx < unanchoredStop) { /* no `&& (pos < hayCount)`:
      We may still have to check and report empty needles! */
      if (!EX.checkUnanchoredNeedle(state)) { return false; }
    }
    if (anchored.end) {
      const at = state.hayCount - state.neeLen;
      cdbg('if anchored.end:', at, state);
      if (at < state.pos) { return false; } /* Why not `<=`?
        Consider the trivial case: single needle => pos = 0.
        neeVal === haystack === 'hello'. hayCount = neeLen = 5 => at = 0.
        For pos = 0, we have to check. For pos >= 1, neeVal cannot fit. */
      state.pos = at;
      if (!EX.checkUnanchoredNeedle(state)) { return false; }
    }
    return (state.capture || true);
  },


  decodeAnchored(a) {
    if (!a) { return false; }
    const both = (a === 'both');
    const start = (both || (a === 'start'));
    const end = (both || (a === 'end'));
    return { start, end, any: true, both };
  },


  mustBeFinNum(what, n) {
    if (Number.isFinite(n)) { return; }
    throw new RangeError('Expected a finite number for ' + what + '!');
  },


  learnNextNeedle(state) {
    const st = state; // shorten and exempt from linter rule no-param-reassign
    const ni = st.neeIdx + 1;
    st.neeIdx = ni;
    const nv = st.needles[ni];
    st.neeVal = nv;
    st.neeLen = (nv && +nv.length) || 0; /* Need to guard because
      spec explicitly treats any false-y value as an empty needle. */
  },


  foundNeedle(state) {
    const st = state; // shorten and exempt from linter rule no-param-reassign
    const { pos, neeLen } = st;
    const after = pos + neeLen;
    st.capture?.push({ start: pos, length: neeLen, after });
    EX.learnNextNeedle(st);
    st.pos = after;
  },


  checkUnanchoredNeedle(state) {
    const st = state; // shorten and exempt from linter rule no-param-reassign
    let at = st.pos;
    cdbg('checkUnanchoredNeedle?', st);
    if (st.neeLen >= 1) { at = st.haystack.indexOf(st.neeVal, at); }
    cdbg('checkUnanchoredNeedle=', at);
    if (at < 0) { return false; }
    st.pos = at; // eslint-disable-line no-param-reassign
    EX.foundNeedle(st);
    return true;
  },


  robustStartsWith(state) {
    const { haystack, hayCount, neeLen, neeVal } = state;
    cdbg('robustStartsWith?', 1, neeLen, hayCount, state);
    if (neeLen < 1) { return true; }
    if (neeLen > hayCount) { return false; }
    const sw = haystack.startsWith?.(neeVal);
    cdbg('robustStartsWith', { sw });
    if (sw !== undefined) { return sw; }
    return EX.robustSliceEquals(haystack, 0, neeLen, neeVal);
  },


  robustSliceEquals(haystack, offset, exLen, expect) {
    const actual = haystack.slice?.(offset, offset + exLen);
    if (actual === expect) { return true; }
    if (actual?.substr && expect?.substr) { return (actual === expect); }
    if (actual) {
      if (expect.equals?.call) { return expect.equals(actual); }
      if (actual.equals?.call) { return actual.equals(expect); }
    }
    cdbg('robustSliceEquals fail', { haystack, offset, exLen, expect });
    throw new TypeError('Unsupported haystack type!');
  },


  readWildcards(input, patternParts) {
    return EX.readAllGaps(input, EX(input, patternParts,
      { anchored: 'both', captureIndexes: true }));
  },

  readAllGaps(haystack, capturedIndexes) {
    const cap = capturedIndexes;
    if (!cap) { return false; }
    const n = (+cap.length || 0);
    const gaps = [];
    let pos = cap[0].after;
    for (let nextIdx = 1; nextIdx < n; nextIdx += 1) {
      const { start, after } = cap[nextIdx];
      gaps.push(haystack.slice(pos, start));
      pos = after;
    }
    return gaps;
  },


});


export default EX;
