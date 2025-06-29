import buildBatch from "./buildBatch.js";
import signAndSend from "./signAndSend.js";
import { log } from "../log/index.js";
import { EXIT_DUST, LOOP_MS } from "../config/index.js";


/**
 * Main sweep loop: build a batch, send it (if any), then reschedule itself.
 *
 * Detailed flow:
 * 1. `buildBatch`: produce the next set of ERC-20 transfers (and the
 *    optional ETH sweep) based on current balances and gas limits.  
 * 2. Exit the process when there is no work left and the hot wallet
 *    holds <= `EXIT_DUST`.  
 * 3. Otherwise, call `signAndSend` to broadcast the batch and store the
 *    latest `capGwei` back in the context for the next iteration.  
 * 4. Schedule another run after `LOOP_MS` milliseconds.  
 *
 * @param {object} ctx
 * @param {import("alchemy-sdk").Alchemy} ctx.alch - Alchemy SDK instance (WS).
 * @param {import("web3").Web3} ctx.web3 - Web3 instance.
 * @param {string} ctx.hot - Hot-wallet address.
 * @param {string} ctx.cap - Current gas-price cap (gwei).
 * @returns {Promise<void>}
 */
export default async function sweepLoop(ctx) {
  // Build a new batch
  const batch = await buildBatch(ctx);

  // Exit if nothing left to sweep and dust is below threshold
  const balance = await ctx.web3.eth.getBalance(ctx.hot);
  const balAfter = BigInt(balance);

  if (!batch.txs.length && balAfter <= EXIT_DUST) {
    log(`🥳 sweep complete - leftover dust ${balAfter} wei`);
    process.exit(0);
  }

  // Sign and send if there is work
  if (batch.txs.length) {
    await signAndSend(ctx, batch);
    ctx.cap = batch.gas.capGwei;    // remember latest cap
  }

  // Self-schedule
  setTimeout(() => sweepLoop(ctx), LOOP_MS);
}

