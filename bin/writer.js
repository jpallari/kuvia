const process = require('node:process');
const fs = require('node:fs/promises');

/**
 * @params {string} contents
 */
async function writeContents(options, contents) {
  if (options.output) {
    return fs.writeFile(options.output, contents, { encoding: 'utf-8' });
  }
  return process.stdout.write(contents, 'utf-8');
}

module.exports = writeContents;
