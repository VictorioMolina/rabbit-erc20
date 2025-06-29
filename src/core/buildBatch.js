import gasParams from "./gasParams.js";
import fetchTokenBalances from "./fetchTokenBalances.js";
import buildTokenTxs from "./buildTokenTxs.js";
import sweepEth from "./sweepEth.js";
import { toEther } from "../converters/index.js";
import { log } from "../log/index.js";

/**
 * Assembles a complete batch of transactions for the next sweep cycle.
 *
 * Steps performed:
 *
 * 1. Fetch the hot-wallet ETH balance, current nonce and fresh gas parameters
 *    in parallel.  
 * 2. Retrieve all ERC-20 balances (`fetchTokenBalances`).  
 * 3. Build the token-transfer TXs and compute their cumulative gas
 *    (`buildTokenTxs`).  
 * 4. Optionally append an ETH-sweep TX (`sweepEth`).  
 * 5. Return the batch list, the starting nonce (`nonce0`) and the gas params.
 *
 * @async
 * @param {object} ctx
 * @param {import("web3").Web3} ctx.web3  - Web3 instance.
 * @param {string} ctx.hot - Hot-wallet address.
 * @param {string} ctx.cold - Cold-wallet address.
 * @param {string} ctx.cap - Max gas price cap (gwei, string).
 * @param {boolean} ctx.aggressive - Whether to auto-bump the cap.
 * @returns {Promise<{
 *   txs: object[],
 *   nonce0: number,
 *   gas: { maxWei: bigint, tipWei: bigint, baseWei: bigint, capGwei: string }
 * }>} A promise that resolves to the batch spec.
 */
export default async function buildBatch({ web3, hot, cold, cap, aggressive }) {
  const [balanceWei, txCount, gas] = await Promise.all([
    web3.eth.getBalance(hot),
    web3.eth.getTransactionCount(hot, "pending"),
    gasParams(web3, cap, aggressive),
  ]);

  const ethBal = BigInt(balanceWei);

  log(`📊 hot balance: ${toEther(web3, ethBal)} ETH`);

  const bals = await fetchTokenBalances(web3, hot);

  const {
    txs,
    totalGasWei: tokenGasWei,
    tokensPending,
  } = await buildTokenTxs({ web3, hot, cold, gas, ethBal, bals });

  sweepEth({ web3, txs, hotBal: ethBal, tokenGasWei, gas, cold, tokensPending });

  return { txs, nonce0: Number(txCount), gas };
}
