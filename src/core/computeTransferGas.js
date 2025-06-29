import { FALLBACK_GAS_UNITS } from "../config/index.js";
import { log } from "../log/index.js";

/**
 * Builds calldata for an ERC-20 `transfer` and estimates its gas;
 * falls back to `FALLBACK_GAS_UNITS` when the estimation fails.
 *
 * @async
 * @param {import("web3").Web3} web3 - Web3 instance.
 * @param {string} token - ERC-20 contract address.
 * @param {string} from - Sender address (hot wallet).
 * @param {string} to - Recipient address (cold wallet).
 * @param {bigint} amount - Amount to transfer (uint256).
 * @returns {Promise<{ gas: bigint, data: string }>}
 *   Gas limit (wei) and encoded calldata.
 */
export default async function computeTransferGas(
  web3,
  token,
  from,
  to,
  amount
) {
  const data = buildTransferData(web3, to, amount);

  const gas  = await estimateGasWithFallback(
    web3,
    { 
      from,
      to: token,
      data,
    },
    token
  );

  return { gas, data };
}

/**
 * Encodes `transfer(address,uint256)` calldata.
 *
 * @private
 * @param {import("web3").Web3} web3 - Web3 instance.
 * @param {string} to - Recipient address.
 * @param {bigint} amount - Amount to transfer.
 * @returns {string} ABI-encoded calldata.
 */
function buildTransferData(web3, to, amount) {
  return web3.eth.abi.encodeFunctionCall(
    {
      name:  "transfer",
      type:  "function",
      inputs: [
        { name: "recipient", type: "address" },
        { name: "amount",    type: "uint256" },
      ],
    },
    [to, amount.toString()]
  );
}

/**
 * Performs `eth_estimateGas`; on failure logs a warning and returns the
 * fallback.
 *
 * @private
 * @async
 * @param {import("web3").Web3} web3 - Web3 instance.
 * @param {{ from: string, to: string, data: string }} tx - Transaction.
 * @param {string} warnLabel - Label to include in the warning log.
 * @returns {Promise<bigint>} A promise that resolves to the estimated gas
 *   limit in wei, or `FALLBACK_GAS_UNITS`.
 */
async function estimateGasWithFallback(web3, tx, warnLabel) {
  try {
    const g = await web3.eth.estimateGas(tx);

    return BigInt(g);
  } catch {
    log(`⚠️ gas estimate failed for ${warnLabel}, using fallback`);

    return FALLBACK_GAS_UNITS;
  }
}
