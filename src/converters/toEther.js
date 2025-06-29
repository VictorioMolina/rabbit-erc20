/**
 * Converts a `bigint` amount in wei to a human-readable Ether string.
 *
 * @param {import("web3").Web3} web3  - A Web3 instance.
 * @param {number | bigint | string} wei - Amount in wei.
 * @returns {string} The value expressed in ether (as decimal string).
 * @example
 * ```js
 * const eth = toEther(web3, 1234560000000000000n); // "1.23456"
 * ```
 */
export default (web3, wei) =>
  web3.utils.fromWei(wei.toString(), "ether");
