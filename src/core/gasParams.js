import maxFee from "./maxFee.js";
import { toGwei, toWei } from "../converters/index.js";
import { log } from "../log/index.js";
import { FLOOR_GAS_GWEI, GAS_CAP_BUMP, GAS_BUF, TIP_GWEI } from "../config/index.js";

/**
 * Computes the EIP-1559 gas settings to be used for all transactions
 * in the next sweep batch.
 *
 * Procedure:
 *
 * 1. Read `baseFeePerGas` from the latest block.
 * 2. Convert constants and user cap (`capGwei`) to wei.
 * 3. `need = 3 × baseWei + tipWei` (per EIP-1559).
 * 4. Optionally bump the cap (`GAS_CAP_BUMP`) if aggressive and `need > cap`.
 * 5. `maxWei = min(need, capWei) * GAS_BUF`, then clamp to `floorWei`.
 *
 * @async
 * @param {import("web3").Web3} web3 - Web3 instance.
 * @param {string | number} capGwei - User gas-price cap (gwei).
 * @param {boolean} [aggressive=false] Auto-raise the cap when network fees
 *   already exceed it.
 * @returns {Promise<{
 *   maxWei:  bigint,   // final maxFeePerGas (wei) with buffer & floor
 *   tipWei:  bigint,   // fixed miner tip (wei)
 *   baseWei: bigint,   // latest block base fee (wei)
 *   capGwei: string    // (possibly bumped) user cap in gwei
 * }>}
 */
export default async (web3, capGwei, aggressive = false) => {
  const lastBlock = await web3.eth.getBlock("latest");
  const baseWei = BigInt(lastBlock.baseFeePerGas);
  const baseGwei = toGwei(baseWei);
  const tipGwei = TIP_GWEI(baseGwei);
  const tipWei = toWei(web3, tipGwei);
  const floorWei = toWei(web3, FLOOR_GAS_GWEI);
  const need = maxFee(baseWei, tipWei);
  let capWei = toWei(web3, capGwei);

  ({ capWei, capGwei } = bumpCap({
    web3,
    capGwei,
    capWei,
    need,
    aggressive
  }));

  const capped = need > capWei ? capWei : need;
  const maxWei = buffered(capped, GAS_BUF, floorWei);

  return { maxWei, tipWei, baseWei, capGwei };
}

/**
 * Scales `wei` by `buf`; clamps to `floorWei`.
 *
 * @private
 * @param {bigint} wei - Raw value (wei).
 * @param {number} buf - Multiplier (e.g. 1.2 → +20 % head-room).
 * @param {bigint} floorWei - Lower bound (wei).
 * @returns {bigint} Adjusted value in wei.
 */
function buffered(wei, buf, floorWei) {
  const withBuf = BigInt(Number(wei) * buf);

  return withBuf < floorWei ? floorWei : withBuf;
}

/**
 * Bumps the user gas-price cap when the network fee already exceeds it
 * and aggressive mode is enabled.
 *
 * @param {object} ctx
 * @param {import("web3").Web3} ctx.web3 - A Web3 instance.
 * @param {string} ctx.capGwei - Current cap (gwei, string).
 * @param {bigint} ctx.capWei - Current cap (wei).
 * @param {bigint} ctx.need - Required max fee (wei).
 * @param {boolean} ctx.aggressive - Aggressive-mode flag.
 * @returns {{ capWei: bigint, capGwei: string }} Possibly bumped cap pair.
 */
function bumpCap({ web3, capGwei, capWei, need, aggressive }) {
  if (!aggressive || need <= capWei) {
    return { capWei, capGwei };
  }

  capGwei = (parseFloat(capGwei) * GAS_CAP_BUMP).toString();
  capWei  = toWei(web3, capGwei);

  log(`⚡ aggressive: gas cap bumped to ${capGwei} gwei`);

  return { capWei, capGwei };
}
