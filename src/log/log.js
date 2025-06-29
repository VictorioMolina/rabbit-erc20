/**
 * Timestamped logger. Prefixed with ISO-8601 date.
 *
 * @param {string} msg  Message to write to stdout.
 * @returns {void}
 */
export default (msg) => {
  const timestamp = new Date().toISOString();

  console.log(`[${timestamp}] ${msg}`);
}
