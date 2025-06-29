import { AlchemySubscription } from "alchemy-sdk";

import sweepLoop from "./sweepLoop.js";
import { log } from "../log/index.js";

/**
 * Attach two sockets (via Alchemy) that trigger a new sweep:
 *
 * 1. Pending ETH transfer - any transaction *to* the hot wallet.  
 * 2. ERC-20 Transfer event - a `Transfer(address,address,uint256)`
 *    whose recipient equals the hot wallet.
 *
 * When either event fires the function logs a short notice and calls
 * `sweepLoop(ctx)`. It is intentionally idempotent: if multiple events arrive
 * in quick succession, they all invoke the same loop, which builds a fresh
 * batch and decides whether or not there is work to do.
 *
 * @param {object} ctx
 * @param {import("alchemy-sdk").Alchemy} ctx.alch - Alchemy SDK instance (WS).
 * @param {import("web3").Web3} ctx.web3 - Web3 instance (for hashing/padding).
 * @param {string} ctx.hot - Hot-wallet address being monitored.
 * @returns {void}
 */
export default (ctx) => {
  listenTokenLogs(ctx);
  listenPendingTransaction(ctx);
  listenMinedTransactions(ctx);
}

/**
 * Subscribes to pending transactions.
 * 
 * @private
 * @param {object} ctx
 * @returns {void}
 */
function listenPendingTransaction(ctx) {
  const { alch, hot } = ctx;

  alch.ws.on(
    {
      method: AlchemySubscription.PENDING_TRANSACTIONS,
      fromAddress: hot,
      toAddress: hot,
    },
    () => {
      log('💸 Pending transaction detected - initiating sweep');
      sweepLoop(ctx);
    }
  );
}

/**
 * Subscribes to mined transactions.
 * 
 * @private
 * @param {object} ctx
 * @returns {void}
 */
function listenMinedTransactions(ctx) {
  const { alch, hot } = ctx;

  alch.ws.on(
    {
      method: AlchemySubscription.MINED_TRANSACTIONS,
      addresses: [{ from: hot }, { to: hot }],
      includeRemoved: true,
      hashesOnly: false,
    },
    () => {
      log("⛏️ Mined transactions detected - initiating sweep");
      sweepLoop(ctx);
    }
  );
}

/**
 * Subscribes to ERC-20 transfer logs targeting the hot wallet.
 *
 * @private
 * @param {object} ctx
 * @returns {void}
 */
function listenTokenLogs(ctx) {
  const { alch, hot, web3 } = ctx;
  const transferSig = web3.utils.sha3("Transfer(address,address,uint256)");
  const padHot = web3.utils.padLeft(hot, 64);

  alch.ws.on(
    { topics: [transferSig, null, padHot] },
    () => {
      log("🤑 token transfer → sweep");
      sweepLoop(ctx);
    }
  );
}
