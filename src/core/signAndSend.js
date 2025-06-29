import { log } from "../log/index.js";

/**
 * Signs every transaction in the batch and broadcast them sequentially.
 *
 * @async
 * @param {object} ctx
 * @param {import("web3").Web3} ctx.web3 - Web3 instance.
 * @param {string} ctx.pk - Private key (with or without 0x).
 * @param {object} batch - Batch spec.
 * @param {object[]} batch.txs - Transactions to sign & send.
 * @param {number} batch.nonce0 - First nonce to use.
 * @param {{ maxWei: bigint, tipWei: bigint }} batch.gas - Gas params for all txs.
 * @returns {Promise<void>}
 */
export default async (ctx, batch) => {
  const { web3, pk } = ctx;
  const { txs, nonce0, gas } = batch;
  const key = pk.startsWith("0x") ? pk : `0x${pk}`;

  // Sign everything in parallel
  const signedTxs = await Promise.all(
    txs.map((tx, i) =>
      signTx({ web3, key, gas, nonce: nonce0 + i, tx }))
  );

  // Fire all TXs in parallel
  return Promise.all(
    signedTxs.map((signedTx, idx) =>
      sendSignedTx({ web3, signedTx, sym: txs[idx].sym }))
  );
}

/**
 * Signs a single EIP-1559 transaction.
 *
 * @private
 * @async
 * @param {object} params
 * @param {import("web3").Web3} params.web3 - Web3 instance.
 * @param {string} params.key - Private key (0x-prefixed).
 * @param {{ maxWei: bigint, tipWei: bigint }} params.gas - Gas limits for this tx.
 * @param {number} params.nonce - Nonce to assign.
 * @param {{ to: string, val: string, data: string, gas: bigint }} params.tx
 *   Tx template produced by the batch builder.
 * @returns {Promise<object>} A promise that resolves to the
 *   signed-transaction.
 */
async function signTx({ web3, key, gas, nonce, tx }) {
  return web3.eth.accounts.signTransaction(
    {
      to: tx.to,
      value: tx.val,
      data: tx.data,
      gas: tx.gas.toString(),
      maxFeePerGas: gas.maxWei.toString(),
      maxPriorityFeePerGas: gas.tipWei.toString(),
      nonce,
      chainId: 1,
      type: 2,
    },
    key
  );
}

/**
 * Broadcasts a signed transaction and logs the outcome.
 *
 * @private
 * @async
 * @param {object} params
 * @param {import("web3").Web3} params.web3 - Web3 instance.
 * @param {object} params.signedTx - The signed tx.
 * @param {string} params.sym - Ticker symbol used for logs.
 * @returns {Promise<void>}
 */
async function sendSignedTx({ web3, signedTx, sym }) {
  try {
    const { transactionHash } =
      await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

    log(`✅ ${sym} transferred - tx: ${transactionHash}`);
  } catch (e) {
    if (e.message?.includes("insufficient funds")) {
      return log(`💨 skipped ${sym}: insufficient ETH for gas`);
    }

    log(`❌ error sending ${sym} tx: ${e.message}`);

    throw e;
  }
}
