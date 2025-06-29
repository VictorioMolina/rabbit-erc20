/**
 * Prints the ASCII-art banner once at start-up. A friendly rabbit plus a
 * short description of what the sweeper does.
 * 
 * @returns {void}
 */
export default () => {
  const banner = `
    (\\(\\
    (-.-)   ── R A B B I T ──
    o_(")(")
  ------------------------------------------------------------------
  Lightning-fast sweeper: sees funds, chews fees, hops to cold safe.
  ------------------------------------------------------------------
  `;

  console.log(banner);
}
