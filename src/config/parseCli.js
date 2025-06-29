import yargs from "yargs";
import { hideBin } from "yargs/helpers";

import { MAX_GAS_GWEI } from "./gas.js";

/**
 * Parses the command-line arguments for the sweep script.
 *
 * Expected flags:
 *
 * | Flag                 | Type       | Description                                                    |
 * |----------------------|------------|----------------------------------------------------------------|
 * | `--alchemy-api-key`  | string     | Alchemy API key (required)                                     |
 * | `--wallet-sweep`     | string     | Address of the hot wallet to sweep (required)                  |
 * | `--wallet-dest`      | string     | Address of the cold destination wallet                         |
 * | `--private-key`      | string     | Private key (hex) of the hot wallet                            |
 * | `--max-gas-price`    | string     | Upper bound for gas price in gwei (default: `MAX_GAS_GWEI`)    |
 * | `--aggressive-cap`   | boolean    | Whether to raise the user cap automatically                    |
 *
 * @returns {ReturnType<import("yargs").Argv>}  
 *   Parsed argv object whose properties match the flags above.
 * @example
 * ```bash
 * node index.js \
 *   --alchemy-api-key $ALCH_KEY \
 *   --wallet-sweep 0xHot... \
 *   --wallet-dest 0xCold... \
 *   --private-key 0xabc... \
 *   --max-gas-price 70 \
 *   --aggressive-cap
 * ```
 */
export default () => {
  const options = {
    "alchemy-api-key":    { type: "string",  demandOption: true },
    "wallet-sweep":       { type: "string",  demandOption: true },
    "wallet-dest":        { type: "string",  demandOption: true },
    "private-key":        { type: "string",  demandOption: true },
    "max-gas-price":      { type: "string",  default: `${MAX_GAS_GWEI}` },
    "aggressive-cap":     { type: "boolean", default: false }
  };

  return yargs(hideBin(process.argv)).options(options).strict().argv;
}
