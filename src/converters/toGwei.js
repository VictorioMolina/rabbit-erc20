/**
 * Converts a value in wei to gwei as a JavaScript `number`, preserving
 * any sub-gwei decimals (e.g. 750 000 000 000 wei -> 0.75 gwei).
 *
 * Precision note – IEEE-754 doubles keep 53 bits of integer precision, which is
 * plenty for any realistic gas price (< 9 × 10¹⁵ gwei). If you ever handle
 * larger magnitudes, switch to a bignumber library.
 *
 * @param {number | bigint | string} wei – Amount in wei.
 * @returns {number} Equivalent amount in gwei (may include decimals).
 * @example
 * ```js
 * toGwei(750_000_000_000n);   // 0.75
 * toGwei(5_000_000_000n);     // 5
 * toGwei("123456789012345");  // 0.123456789012345
 * ```
 */
export default (wei) => Number(wei) / 1e9; // 1 gwei = 1 e9 wei
