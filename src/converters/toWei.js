/**
 * Converts a value expressed in gwei to wei (`bigint`).
 *
 * A thin wrapper around `web3.utils.toWei` that always returns a `bigint`,
 * eliminating repeated casts elsewhere in the codebase.
 *
 * @param {import("web3").Web3} web3 - A Web3 instance.
 * @param {number | bigint | string} gwei - Value in gwei (numeric, string,
 *   or bigint).
 * @returns {bigint} The equivalent amount in wei.
 * @example
 * ```js
 * const maxWei = toWei(web3, 75); // 75 gwei → 75000000000n
 * ```
 */
export default (web3, gwei) =>
  BigInt(web3.utils.toWei(gwei.toString(), "gwei"));
