const fs = require('node:fs/promises');
const resources = require('./resources');

const phpImageList = resources.resourcePath('imagelist.php');

/**
 * @param {string} s
 * @returns {string}
 */
function renderString(s) {
  return `"${s}"`;
}

/**
 * @param {string[]} list
 * @returns {string}
 */
function renderList(list) {
  const listContents = list.map(renderString).join(', ');
  return `[${listContents}]`;
}

/**
 * @param {string} s
 * @returns {string}
 */
function renderTargetAssign(s) {
  return `window.kuviaimagelist = ${s};`;
}

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
 * @param {() => Promise<string[]>} filelistSource
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
