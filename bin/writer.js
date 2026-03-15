const process = require('node:process');
const fs = require('node:fs/promises');

/**
 * Writes content to a file or stdout based on options.
 * @param {Object} options - Configuration options
 * @param {string} [options.output] - Output file path (uses stdout if not specified)
 * @param {string} contents - Content to write
 * @returns {Promise<void>} Promise that resolves when writing is complete
 */
async function writeContents(options, contents) {
  if (options.output) {
    return fs.writeFile(options.output, contents, { encoding: 'utf-8' });
  }
  await process.stdout.write(contents, 'utf-8');
}

module.exports = writeContents;
