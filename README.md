
<!--#echo json="package.json" key="name" underline="=" -->
string-or-buffer-contains-all-in-order-pmb
==========================================
<!--/#echo -->

<!--#echo json="package.json" key="description" -->
Check whether your string or buffer contains all the expected slices in
correct order. Useful for checking wildcard patterns.
<!--/#echo -->



API
---

This module exports one function, with some methods on it:

### containsAllInOrder(haystack, needles[, opt])

Return whether all `needles` were found, in their original order,
potentially with other hay in-between, in `haystack`.
Result will be boolean except when using `captureIndexes` (see below).

`haystack` must be a string or a Buffer.

`needles` must be an array of what to search for.

* Empty needles (e.g. string or Buffer with `.length === 0`)
  always immediately match at the current search position.
* As a performance optimization, to not waste effort on whether a needle
  actually does have a `.length` and whether it is a number, false-y needles
  and needles with a false-y `.length` are considered empty as well.
* As a side effect, this gives a simplified notation for optional needles:
  Instead of `(cond ? needleValue : emptyBuffer)`,
  you can shorten that array element to just `(cond && needleValue)`.
* For robustness, non-empty needles should be the same type (string or Buffer)
  as `haystack` is.
  * ⚠ Needles with a wrong type may go undetected until it's their turn,
    but then they are passed to `.indexOf()` as-is,
    which in some runtimes may throw an Error.
    The performance trade-off here is to not waste CPU cycles on cases where
    the needles are hard-coded or pre-validated.
    If you have user-provided needles, consider pre-validating them yourself.
* Needles are always matched verbatim, which implies case-sensitive.
  * For the wildcard usecase, you split the pattern by the wildcard character,
    so that each non-wildcard part becomes a needle.
    You can then use `captureIndexes` to find the parts between the needles
    (from previous needle's `after` to next needle's `start`),
    which are your wildcard matches.


`opt` is an optional options object that supports these optional keys:

* `anchored` (string or false-y, default false):
  * If `'start'`, the first needle must be at the start of `haystack`.
  * If `'end'`, the last needle must be at the end of `haystack`.
  * If `'both'`, both first and last needle must be at their sides.
  * Since empty needles match at any search position, having an empty
    first or last needle will trivially match.
    * That's exactly what you need for the wildcard usecase, because that
      empty needle means your pattern started or ended with a wildcard.
  * False-y values: Don't check.

* `captureIndexes` (boolean or array, default false):
  * If false-y, ignored, no effect.
  * If `true`, treated as if an empty array was given.
  * If otherwise truthy, assumed to be an array.
    In that case, whenever a needle is found,
    an object with index positions `{ start: …, length: …, after: … }`
    is `.push()`ed to `captureIndexes`
    so you can know where those needles were hiding.
    * The `after` is the index of the assumed hay that might come next after
      the needle. If `after >= haystack.length`,
      it means the needle was found at the very end of the `haystack`.
    * The `after` value is a copy of the internal cursor for where to start
      the next search attempt, so storing it for you is an almost-free bonus.
    * To find the hay between needles, you can `.reduce()` the results array
      to easily keep track of the previous needle's `after` index.
    * As a convenience, if `captureIndexes` is truthy and the overall result
      would be `true`, `captureIndexes` is returned instead.
      * By the assumption above, that should be an array, and thus should
        work just the same in all conditionals that auto-cast to boolean.
        In cases where you need strict booleans, you'll have to add `!!`.
        That small price buys us the convenience of not having to track a
        separate temporary variable for the capture array.
      * If you need a boolean because you intend to use an equality comparison
        on it, you're probably wasting CPU cycles. Leverage JS's truthiness.
  * ⚠ Be aware that if you give your own array, in case of a partial match,
    positions from the needles that did match will still be in that array,
    no cleanup. Which may be exactly what you want, because that way you
    can try another set of needles on the remaining hay.



### .mustBeFinNum(n, what)

A little helper for throwing a RangeError complaining about `what`
(a human-readable description of `n`) if `n` is not a finite number.



### .robustSliceEquals(haystack, offset, exLen, expect)

Return whether the `haystack` (string or buffer),
when read starting at `offset`, has data `expect`.
`exLen` must be the length of `expect`.
`expect` is expected to be the same type as `haystack`.



### .readWildcards(input, patternParts)

If `input` (haystack) contains all the `patternParts` (needles),
report an array of gaps, i.e. what data has been skipped between
the `patternParts`.
Otherwise (i.e. if some pattern part was missing), return `false`.



Usage
-----

see [test/usage.mjs](test/usage.mjs).



Known issues
------------

* If you need type checking for the inputs, you have to bring your own.
  There are so many flavors of validation that most users will probably
  prefer I don't bloat this library with a flavor they won't like.
* Needs more/better tests and docs.





<!--#toc stop="scan" -->

&nbsp;


License
-------
<!--#echo json="package.json" key="license" -->
ISC
<!--/#echo -->
