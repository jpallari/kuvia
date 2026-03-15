const fs = require('node:fs/promises');
const { minify } = require('terser');
const resources = require('./resources');

const mainProgramPath = resources.sourcePath('kuvia.js');

/**
 * Quarantines source code such that top-level bindings are not implicitly
 * made on the window object.
 *
 * @param {string} sourceCode - The JavaScript source code to quarantine
 * @returns {string} The quarantined source code wrapped in an IIFE
 */
function quarantineSourceCode(sourceCode) {
  return `(() => { ${sourceCode} })();`;
}

/**
 * Read the JavaScript and bundle it up to a single file.
 *
 * By default, the JavaScript is minified. If the `noMin` option is found
 * from the given options, the JavaScript is not minified.
 *
 * @param {Object} options - Configuration options
 * @param {boolean} [options.noMin] - Whether to skip minification
 * @returns {Promise<string>} The bundled and optionally minified JavaScript code
 */
async function readJs(options) {
  const rawSourceCode = await fs.readFile(mainProgramPath, {
    encoding: 'utf-8',
  });
  const sourceCode = quarantineSourceCode(rawSourceCode);
  if (options.noMin) {
    return sourceCode;
  }
  const minifiedCode = await minify(sourceCode, { sourceMap: false });
  return minifiedCode.code || '';
}

module.exports = readJs;
