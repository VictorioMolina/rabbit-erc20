/** @see https://ethereum.org/en/developers/docs/gas/ */
export const FALLBACK_GAS_UNITS = 50_000n;        // Common gas limit for ERC-20 transfers
export const STANDARD_ETH_GAS_UNITS = 21_000n;    // Gas limit for a plain ETH transfer
export const MAX_GAS_GWEI = 800;                  // Covers almost all network peaks
export const FLOOR_GAS_GWEI = 1;                  // Never sign below this
export const GAS_BUF = 1.02;                      // +2% safety on maxFeePerGas
export const GAS_CAP_BUMP = 1.04;                 // +4% gas in aggressive mode
export const TIP_GWEI = (baseFee) =>              // Dynamic tip -> fast inclusion
  Math.max(0.5, Math.min(baseFee * 0.12, 1.1));
