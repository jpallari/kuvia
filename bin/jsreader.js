const fs = require('node:fs/promises');
const { minify } = require('terser');
const resources = require('./resources');

const mainProgramPath = resources.sourcePath('kuvia.js');

/**
 * Quarantines source code such that top-level bindings are not implicitly
 * made on the window object.
 *
 * @param {string} sourceCode
 * @returns {string} quarantined source code
 */
function quarantineSourceCode(sourceCode) {
  return `(() => { ${sourceCode} })();`;
}

/**
 * Read the JavaScript and bundle it up to a single file.
 *
 * By default, the JavaScript is minified. If the 'no-min' option is found
 * from the given options, the JavaScript is not minified.
 *
 * @returns {Promise<string>}
 */
async function readJs(options) {
  const rawSourceCode = await fs.readFile(mainProgramPath, {
    encoding: 'utf-8',
  });
  const sourceCode = quarantineSourceCode(rawSourceCode);
  if (options['no-min']) {
    return sourceCode;
  }
  const minifiedCode = await minify(sourceCode, { sourceMap: false });
  return minifiedCode.code || '';
}

module.exports = readJs;
