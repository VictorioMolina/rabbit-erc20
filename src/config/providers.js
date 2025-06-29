import Web3 from "web3";
import { Alchemy, Network } from "alchemy-sdk";

/**
 * Creates ready-to-use Web3 and Alchemy instances wired to Ethereum main-net.
 *
 * @param {string} key - Alchemy's API key.
 * @returns {{ web3: Web3, alch: import("alchemy-sdk").Alchemy }}
 *   An object containing:
 *   - `web3`: Web3.js instance connected over WSS.  
 *   - `alch`: Alchemy-SDK instance for high-level queries & subscriptions.
 * @example
 * ```js
 * const { web3, alch } = providers(process.env.ALCH_KEY);
 *
 * const latestBlock = await web3.eth.getBlock("latest");
 * const balance = await alch.core.getBalance("0x...");
 * ```
 */
export default (key) => {
  const url = `wss://eth-mainnet.g.alchemy.com/v2/${key}`;

  return {
    web3: new Web3(url),
    alch: new Alchemy({ apiKey: key, network: Network.ETH_MAINNET })
  };
}
