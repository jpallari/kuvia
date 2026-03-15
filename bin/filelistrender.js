const fs = require('node:fs/promises');
const resources = require('./resources');

const phpImageList = resources.resourcePath('imagelist.php');

/**
 * Renders a string as a JavaScript string literal.
 * @param {string} s - The string to render
 * @returns {string} The rendered JavaScript string literal
 */
function renderString(s) {
  return `"${s}"`;
}

/**
 * Renders an array of strings as a JavaScript array literal.
 * @param {string[]} list - Array of strings to render
 * @returns {string} The rendered JavaScript array literal
 */
function renderList(list) {
  const listContents = list.map(renderString).join(', ');
  return `[${listContents}]`;
}

/**
 * Renders a JavaScript assignment statement for the image list target.
 * @param {string} s - The value to assign
 * @returns {string} The rendered assignment statement
 */
function renderTargetAssign(s) {
  return `window.kuviaimagelist = ${s};`;
}

/**
 * Reads the PHP image list file from the resources directory.
 * @returns {Promise<string>} The contents of the PHP image list file
 */
function readPhpImageList() {
  return fs.readFile(phpImageList, { encoding: 'utf-8' });
}

/**
 * Render image list for the image gallery based on options.
 *
 * - PHP enabled? PHP image list script is read.
 * - JSON source? Use the JSON path as the image list.
 * - Otherwise: Create a list out of the given files.
 *
 * @param {Object} options - Configuration options
 * @param {boolean} [options.php] - Whether to use PHP mode
 * @param {string} [options.json] - Path to JSON file for JSON mode
 * @param {function(): Promise<string[]>} filelistSource - Function that returns a promise of file list
 * @returns {Promise<string>} The rendered file list as JavaScript code
 */
async function renderFileList(options, filelistSource) {
  if (options.php) {
    return readPhpImageList();
  }

  if (options.json) {
    return Promise.resolve(renderTargetAssign(renderString(options.json)));
  }
  const fileList = await filelistSource();
  const renderedList = renderList(fileList);
  return renderTargetAssign(renderedList);
}

module.exports = renderFileList;
