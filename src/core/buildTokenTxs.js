import parallelGasCraft from "./parallelGasCraft.js";
import { toGwei } from "../converters/index.js";
import { log } from "../log/index.js";

/**
 * Builds the list of ERC-20 transfer transactions for the sweep batch and
 * computes their aggregate gas cost.
 *
 * For each token result:
 * 1. Skips null results (empty balances).
 * 2. Verifies the hot wallet holds enough ETH to pay each transfer’s gas;
 *    if not, logs a skip message.
 * 3. Pushes valid transfer TXs into `txs` and accumulates the gas cost.
 *
 * @async
 * @param {object} params
 * @param {import("web3").Web3} params.web3 - Web3 instance.
 * @param {string} params.hot - Hot-wallet address (sender).
 * @param {string} params.cold - Cold-wallet address (recipient).
 * @param {{ maxWei: bigint, tipWei: bigint }} params.gas - Gas configuration.
 * @param {bigint} params.ethBal - Current ETH balance of the hot wallet (wei).
 * @param {bigint[]} params.bals - ERC-20 balances for `hot`, aligned with `ERC20_TOKENS`.
 * @returns {Promise<{ txs: object[], totalGasWei: bigint, tokensPending: boolean }>}
 *   A promise that resolves to the token transfer TXs plus their cumulative
 *   gas cost and a flag indicating there are still tokens to be swept.
 */
export default async ({ web3, hot, cold, gas, ethBal, bals }) => {
  const txs = [];
  const maxFeeGwei = toGwei(gas.maxWei);
  let totalGasWei = 0n;
  let tokensPending = false; 

  // Compute gas estimations in parallel
  const results = await parallelGasCraft({ web3, hot, cold, bals });

  // Process results
  for (const result of results) {
    if (!result) continue; // Skip null results (empty balances)

    const { sym, addr, gas: gUnits, data } = result;
    const gasCostWei = gUnits * (gas.maxWei + gas.tipWei);

    // console.log({ ethBal, gasCostWei });

    if (ethBal < gasCostWei) {
      tokensPending = true;
      log(`💨 skip ${sym} - not enough ETH for gas (${gasCostWei} wei)`);
      continue;
    }

    txs.push({ sym, to: addr, val: "0", data, gas: gUnits });
    totalGasWei += gasCostWei;
    log(`⚡ add ${sym} - gas ${gUnits} @ ${maxFeeGwei} gwei`);
  }

  return { txs, totalGasWei, tokensPending };
}
