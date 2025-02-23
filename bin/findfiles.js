const path = require('path');
const { glob } = require('glob');
const url = require('url');

const defaultFiletypes = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

/**
 * @param {string[]} filetypes
 * @param {string} dir
 * @param {boolean} isRecursive
 */
function filetypesToPattern(filetypes, dir, isRecursive) {
  const star = isRecursive ? '**' : '';
  const combined = filetypes.join('|');
  const pattern = `*.*(${combined})`;
  return path.join(dir || '', star, pattern);
}

/**
 * @returns {string[]}
 */
function getFiletypes(options) {
  if (!options.types) {
    return defaultFiletypes;
  }
  if (typeof options.types === 'string') {
    return options.types.split(',');
  }
  return options.types;
}

/**
 * @returns {string[]}
 */
function optionsToPatterns(options) {
  const optionPatterns = options.pattern || [];
  const filetypes = getFiletypes(options);
  const dirPatterns = (options.dir || []).map((dir) =>
    filetypesToPattern(filetypes, dir, options.recursive),
  );
  return optionPatterns.concat(dirPatterns);
}

/**
 * @returns {boolean}
 */
function canGlob(options) {
  return (
    (options.pattern && options.pattern.length > 0) ||
    (options.dir && options.dir.length > 0)
  );
}

/**
 * @returns {Promise<string[]>}
 */
async function globFiles(options) {
  if (!canGlob(options)) {
    return Promise.resolve([]);
  }

  const patterns = optionsToPatterns(options);
  const filesPerPattern = patterns.map((pattern) =>
    glob(pattern, { nocase: true }),
  );
  const files = await Promise.all(filesPerPattern);
  return files.flat();
}

/**
 * @param {string} file
 * @returns {string}
 */
function httpPath(file) {
  const f = path.sep === '\\' ? file.replace(/\\/g, '/') : file;
  return url.format(f);
}

/**
 * @param {string[]} files
 * @returns {string[]}
 */
function httpPaths(options, files) {
  const prefix = options.prefix || '';

  return files.map((file) => prefix + httpPath(file));
}

/**
 * @param {string[]} l
 * @returns {string[]}
 */
function deduplicate(l) {
  return l.filter((v, i, a) => a.indexOf(v) === i);
}

/**
 * Find files based on the given options.
 *
 * Duplicates are automatically removed from the results.
 *
 * The given options is a map that can contain these fields:
 * - files: list of files to always include in the results
 * - pattern: patterns for scanning files
 * - dir: directories to scan for files
 * - types: the types of files to scan for (e.g. jpg, png)
 * - prefix: prefix to include in all the scanned results
 * - recursive: whether to scan files recursively or not
 *
 * @returns {Promise<string[]>} found files
 */
async function findFiles(options) {
  const extraFiles = options.files || [];

  const files = await globFiles(options);
  const allFiles = files.concat(extraFiles);
  const fileHttpPaths = httpPaths(options, allFiles);
  return deduplicate(fileHttpPaths);
}

module.exports = findFiles;
