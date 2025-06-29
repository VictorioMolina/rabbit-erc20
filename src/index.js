import { parseCli, providers } from "./config/index.js";
import { subscribe } from "./core/index.js";
import { log, logBanner } from "./log/index.js";

// CLI flags
const cli = parseCli();

// Providers
const { web3, alch } = providers(cli["alchemy-api-key"]);

// Runtime context
const ctx = {
  web3,
  alch,
  hot: cli["wallet-sweep"],
  cold: cli["wallet-dest"],
  pk: cli["private-key"],
  cap: cli["max-gas-price"],
  aggressive: cli["aggressive-cap"],
};

// Startup banner and initial status
logBanner();
log(`⚡ aggressive-cap : ${ctx.aggressive ? "ON" : "OFF"}`);
log("⏳ waiting for first trigger...");

// Kick off live listeners
subscribe(ctx);
