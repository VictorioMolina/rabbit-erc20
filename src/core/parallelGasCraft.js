import computeTransferGas from "./computeTransferGas.js";
import { ERC20_TOKENS } from "../config/index.js";

/**
 * Computes gas estimations for all non-zero balance ERC-20 token transfers
 * in parallel.
 *
 * For each token in `ERC20_TOKENS`, the routine:
 * 1. Skips empty balances.
 * 2. Computes gas limit (`gUnits`) and calldata (`data`) via
 * `computeTransferGas`.
 *
 * @async
 * @param {object} params
 * @param {import("web3").Web3} params.web3 - Web3 instance.
 * @param {string} params.hot - Hot-wallet address (sender).
 * @param {string} params.cold - Cold-wallet address (recipient).
 * @param {bigint[]} params.bals - ERC-20 balances for `hot`, aligned with `ERC20_TOKENS`.
 * @returns {Promise<(object|null)[]>} A promise that resolves to an array of
 *   gas estimation results or null for skipped tokens.
 */
export default async ({ web3, hot, cold, bals }) => {
  const gasEstimations = ERC20_TOKENS.map(async ([sym, addr], index) => {
    const bal = bals[index];

    if (bal === 0n) {    // Skip empty balances
      return null;
    }

    const result = await computeTransferGas(web3, addr, hot, cold, bal);

    return { sym, addr, bal, gas: result.gas, data: result.data };
  });

  return Promise.all(gasEstimations);
}