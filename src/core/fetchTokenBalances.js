import balanceOf from "./balanceOf.js";
import { ERC20_TOKENS } from "../config/index.js";

/**
 * Fetches the balances of all tokens listed in `ERC20_TOKENS` for a given
 * owner. The resulting array preserves the original token order.
 *
 * @param {import("web3").Web3} web3 - A Web3 instance.
 * @param {string} owner - Address to query.
 * @returns {Promise<bigint[]>} Promise resolving to an array of balances (wei).
 * @example
 * ```js
 * const balances = await fetchTokenBalances(web3, "0xHot...");
 * console.log(balances[0]); // balance of the first token (e.g., 'WLFI')
 * ```
 */
export default (web3, owner) =>
  Promise.all(
    ERC20_TOKENS.map(([, addr]) => balanceOf(web3, addr, owner))
  );
