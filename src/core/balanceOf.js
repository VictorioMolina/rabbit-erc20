/**
 * Reads the ERC-20 `balanceOf` for a specific wallet.
 *
 * @param {import("web3").Web3} web3 - A Web3 instance.
 * @param {string} token - ERC-20 contract address.
 * @param {string} owner - Wallet address whose balance is requested.
 * @returns {Promise<bigint>} A promise that resolves to the balance
 *   expressed in wei.
 * @example
 * ```js
 * const usdc = "0xA0b8...";
 * const wallet = "0xHot...";
 * const bal = await balanceOf(web3, usdc, wallet);
 * ```
 */
export default (web3, token, owner) => {
  const data = web3.eth.abi.encodeFunctionCall(
    { name: "balanceOf", type: "function", inputs: [{ type: "address" }] },
    [owner]
  );

  return web3.eth.call({ to: token, data }).then(BigInt);
}
