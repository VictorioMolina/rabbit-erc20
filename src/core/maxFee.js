/**
 * Computes the recommended `maxFeePerGas` according to EIP-1559:
 * `maxFee = 3 * baseFee + tip`.
 *
 * @param {bigint} baseWei - Current block base fee (wei).
 * @param {bigint} tipWei - Desired miner tip (wei).
 * @returns {bigint} Resulting max fee in wei.
 * @example
 * ```js
 * const maxWei = maxFee(baseWei, tipWei);
 * ```
 */
export default (baseWei, tipWei) => baseWei * 3n + tipWei;
