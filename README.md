# ERC‑20 Sweeper Bot

    (\ (\
    (-.-)   ── R A B B I T ──
    o_(")(")

A fast, low-fee sweeper bot that transfers assets (ETH and custom ERC-20 tokens) from a hot wallet to a secure cold wallet as soon as an inbound transfer is detected, minimizing exposure to risks.

---

## Key Features

1. **Dynamic EIP‑1559 pricing**: `maxFeePerGas = 3 × baseFee + tip` with a smart, congestion‑aware tip `0.5 → 1.1 gwei`.
2. **Parallel pipeline**: gas estimation, signing and broadcast are all executed concurrently; the whole batch generally hits the mempool in **≃ 1 s**.
3. **Automatic cap bump** (`--aggressive-cap`): if the current network fee already exceeds your user cap, the bot raises the cap by **+4 %** once so your sweep is not blocked.
4. **Full sweep (ERC‑20 + ETH)**: priority‑ordered token list followed by an ETH drain, leaving just dust behind.
5. **Event‑driven trigger**: three WebSocket feeds (pending TX, mined TX, ERC‑20 `Transfer`) guarantee instant reaction (< 250 ms) the moment money arrives.
6. **Self‑terminating**: when nothing remains except negligible dust (<= `EXIT_DUST`, 0.0001 ETH) the process exits on its own.

---

## Quick Start

```bash
node index.js \
  --alchemy-api-key  "YOUR_ALCHEMY_API_KEY" \
  --wallet-sweep     "INFECTED_WALLET_ADDRESS" \
  --wallet-dest      "DESTINATION_WALLET_ADDRESS" \
  --private-key      "INFECTED_WALLET_PRIVATE_KEY" \
  --max-gas-price    70      # gwei               \
  --aggressive-cap           # flag (true/false)
```

> **Security note:** Supplying a private key on the command line exposes it in your shell history and in `ps` output. Prefer setting it via an environment variable (**recommended**) or a secrets vault.

---

## Gas‑Constant Cheat‑Sheet

| Constant                 | Default                           | Purpose                                                         | Effect on the fee you actually pay                              | CLI‑tunable                   |
| ------------------------ | --------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------- | ----------------------------- |
| `FALLBACK_GAS_UNITS`     | `50 000n`                         | Gas limit when `eth_estimateGas` fails (ERC‑20).                | Only when estimation fails: adds **≈ \$0.13 - 0.14** at 1 gwei. | ✗                             |
| `STANDARD_ETH_GAS_UNITS` | `21 000n`                         | Gas for a plain ETH transfer.                                   | Baseline for all examples.                                      | ✗                             |
| `MAX_GAS_GWEI`           | `800`                             | Hard user cap before buffer/bump.                               | Relevant only if `baseFee > 800 gwei`.                          | **✓** `--max-gas-price`       |
| `FLOOR_GAS_GWEI`         | `1`                               | Absolute floor; bot never signs below 1 gwei.                    | Sets the *minimum* fee (≈ \$0.05 - 0.06).                       | ✗                             |
| `GAS_BUF`                | `1.02`                            | Adds **+2 %** head‑room to `maxFeePerGas`.                      | Raises only the signed ceiling, not the actual spend.           | ✗                             |
| `GAS_CAP_BUMP`           | `1.04`                            | Multiplies the cap once if `--aggressive-cap` and `need > cap`. | Again, ceiling only.                                            | Enabled by `--aggressive-cap` |
| `TIP_GWEI(baseFee)`      | `max(0.5, min(base × 0.12, 1.1))` | Dynamic priority fee, 0.5 → 1.1 gwei.                           | Direct component of what you pay (`baseFee + tip`).             | ✗                             |

### How the bot signs `maxFeePerGas`

```js
need = 3 × baseFee + tip          // EIP‑1559 rule of thumb
cap  = userCap gwei               // --max-gas-price (default 800)
cap  = cap × 1.04 (≈)             // optional bump in aggressive mode
maxFeePerGas = min(need, cap) × 1.02
maxFeePerGas = max(maxFeePerGas, 1 gwei)
```

The paid price on‑chain will be `baseFee + tip <= maxFeePerGas`; the buffer and bump only increase the ceiling so miners accept your TX even if the base fee jumps in the next block.

---

## Estimated Fees (default config)

Assumptions - ETH/USD **2 500 - 2 750**

| Network load  |  baseFee | tip (formula) |  paidPrice | **ETH sweep**<br>21 000 gas | **ERC‑20 transfer**<br>50 000 gas | Notes                                     |
| ------------- | :------: | :-----------: | :--------: | :-------------------------: | :-------------------------------: | ----------------------------------------- |
| Low / Night   | 0.5 gwei |      0.5      | **1 gwei** |       \$0.053 - 0.058       |           \$0.13 - 0.14           | Floor at 1 gwei                           |
| Typical       |     7    |      0.84     |  **7.84**  |        \$0.41 - 0.45        |           \$0.98 - 1.08           | Meets < \$0.50 target for ETH sweep       |
| Heavy         |    40    |      1.1      |  **41.1**  |        \$2.15 - 2.37        |           \$5.12 - 5.65           | Still far below user cap 800              |
| Peak          |    200   |      1.1      |  **201.1** |        \$10.5 - 11.6        |           \$25.0 - 27.6           | Rare spikes                               |
| Extreme       |    300   |      1.1      |  **301.1** |        \$15.8 - 17.2        |           \$37.6 - 40.8           | Cap bumped to 832 gwei in aggressive mode |

The `--aggressive-cap` option **never increases what you pay**: it only raises the ceiling so transactions are not rejected when `baseFee > userCap`.

---

## Dust Strategy

| Symbol             | Constant    | Amount (wei)          | Amount (ETH) | ≃ USD           |
| ------------------ | ----------- | --------------------- | ------------ | --------------- |
| **Leave‑behind**   | `DUST_MIN`  | `10 000 000 000 000`  | 0.00001      | \$0.025 - 0.028 |
| **Exit threshold** | `EXIT_DUST` | `100 000 000 000 000` | 0.0001       | \$0.25 - 0.28   |

*USD range assumes ETH = \$2 500 - 2 750.*

1. **Reasoning**: a tiny residual balance avoids dust‑spam warnings from some wallets and guarantees at least one future TX can still be mined if more tokens arrive.
2. The bot terminates once balance <= `EXIT_DUST` **and** no tokens remain, freeing your server resources.

---

## Performance Details

| Stage                                  | Parallel?      | Typical latency             |
| -------------------------------------- | -------------- | --------------------------- |
| **Event -> Sweep loop start**          | N/A            | 50 - 250 ms (WS round‑trip) |
| Fetch ETH balance + nonce + gas params | Promise.all    | 300 ms                      |
| Fetch ERC‑20 balances                  | parallel       | 300 ms                      |
| Gas estimation for each token          | parallel       | 150 ms                      |
| Local signing of N TXs                 | parallel       | 80 ms                       |
| `eth_sendRawTransaction` broadcast     | parallel       | 300 ms (RPC dependent)      |
| **Total wall time**                    | —              | \~1.2 s                     |

Numbers measured against Alchemy premium WSS endpoint, `LOOP_MS = 250 ms`.

---

## What Runs in Parallel?

1. **Gas estimation**: `parallelGasCraft` fires a `computeTransferGas` promise per token.
2. **Signing**: `web3.eth.accounts.signTransaction` for every TX concurrently.
3. **Broadcast**: raw TXs are pushed to the RPC in parallel; failures are handled individually.

This parallelism slashes the sweep wall‑time roughly by the number of tokens in your list.

---

## Log Flavour

| Emoji | Meaning                                    |
| ----- | ------------------------------------------ |
| `📊`  | Balance & status snapshot                  |
| `💸`  | Pending inbound TX detected                |
| `🤑`  | ERC‑20 `Transfer` log targeting hot wallet |
| `⛏️`  | New mined TX to/from the hot wallet        |
| `⚡`   | Sweep or transfer queued                   |
| `✅`  | TX hash broadcast                          |
| `💨`  | Skip (insufficient gas)                     |
| `❌`  | Error                                      |

---

## Caveats & Hard Edges

1. **Duplicate loops**: multiple triggers in quick succession can start concurrent loops; add a mutex if you expect > 1 trigger per second.
2. **Deflationary tokens**: tokens that burn or levy fees on transfer may leave a non‑zero remainder; the bot will keep retrying.
3. **Reorg safety**: the current build reacts to *pending* TXs; if that TX never confirms you may pay gas without receiving ETH. Consider waiting N confirmations.
4. **Precision limits**: `toGwei` casts to Number; safe for any realistic gas price (< 9e15 gwei). If we ever breach that, switch to a BigInt division.

---

## Extending

1. Add more tokens: edit `config/tokens.js` - the order defines sweep priority.
2. Change dust policy: tweak `DUST_MIN` & `EXIT_DUST` in `config/dust.js`.
3. Tweak gas knobs: all constants live under `config/gas.js`.
4. Pull requests are welcome!

---

## License

MIT
