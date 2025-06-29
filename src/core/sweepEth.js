import { toEther, toGwei } from "../converters/index.js";
import { log } from "../log/index.js";
import { STANDARD_ETH_GAS_UNITS, DUST_MIN } from "../config/index.js";

/**
 * Attempts to append an ETH sweep transaction to the TXs batch.
 *
 * The function checks whether the hot-wallet balance (`hotBal`) still covers:
 *
 * 1. All gas already required by the queued ERC-20 transfers (`tokenGasWei`),  
 * 2. The gas needed for one ETH transfer (`ethGasWei`), and  
 * 3. A dust buffer (`DUST_MIN`) to leave behind.  
 *
 * If the check passes, it pushes a sweep TX that transfers the excess ETH
 * to the cold wallet and logs a success message. Otherwise it only logs that
 * the sweep was skipped.
 *
 * @param {object} params
 * @param {import("web3").Web3} params.web3 - Web3 instance.
 * @param {object[]} params.txs - Mutable array of batch transactions.
 * @param {bigint} params.hotBal - Current ETH balance of the hot wallet (wei).
 * @param {bigint} params.tokenGasWei - Total gas cost (wei) of queued ERC-20 TXs.
 * @param {{ maxWei: bigint }} params.gas - Gas configuration.
 * @param {string} params.cold - Destination (cold-wallet) address.
 * @param {boolean} params.tokensPending - Whether there are still ERC20 tokens
 *   requiring fee to be swept.
 * @returns {void}
 */
export default ({ web3, txs, hotBal, tokenGasWei, gas, cold, tokensPending }) => {
  const sweepGasWei = STANDARD_ETH_GAS_UNITS * gas.maxWei;    // gas for the ETH tx
  const safetyDustWei = DUST_MIN;    // leave this behind
  const minRequired = tokenGasWei + sweepGasWei + safetyDustWei;
  
  // Other tokens still pending
  if (tokensPending) {
    return log("🤏 skip ETH sweep - tokens still pending");
  }

  // Balance is too low
  if (hotBal <= minRequired) {
    return log("🤏 skip ETH sweep - balance < reserve");
  }

  // Build and push the sweep tx
  const sendWei = hotBal - minRequired;
  const maxFeeGwei = toGwei(gas.maxWei)

  txs.push({
    sym: "ETH",
    to:  cold,
    val: sendWei.toString(),
    data: "0x",
    gas: STANDARD_ETH_GAS_UNITS,
  });

  return log(`⚡ sweep ${toEther(web3, sendWei)} ETH @ ${maxFeeGwei} gwei`);
}
