const path = require('path');
const { glob } = require('glob');
const url = require('url');

const defaultFiletypes = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

/**
 * Converts file types to a glob pattern for file searching.
 * @param {Array<string>} filetypes - Array of file extensions (e.g., ['jpg', 'png'])
 * @param {string} dir - Directory path to search in
 * @param {boolean} isRecursive - Whether to search recursively
 * @returns {string} Glob pattern string
 */
function filetypesToPattern(filetypes, dir, isRecursive) {
  const star = isRecursive ? '**' : '';
  const combined = filetypes.join('|');
  const pattern = `*.*(${combined})`;
  return path.join(dir || '', star, pattern);
}

/**
 * Extracts file types from options, with fallback to default types.
 * @param {Object} options - Configuration options
 * @param {string|Array<string>} [options.types] - File types as string or array
 * @returns {Array<string>} Array of file type extensions
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
 * Converts options to an array of glob patterns.
 * @param {Object} options - Configuration options
 * @param {Array<string>} [options.pattern] - Custom glob patterns
 * @param {Array<string>} [options.dir] - Directories to scan
 * @param {string|Array<string>} [options.types] - File types as string or array
 * @param {boolean} [options.recursive] - Whether to search recursively
 * @returns {Array<string>} Array of glob patterns
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
 * Determines if globbing can be performed based on options.
 * @param {Object} options - Configuration options
 * @param {Array<string>} [options.pattern] - Custom glob patterns
 * @param {Array<string>} [options.dir] - Directories to scan
 * @returns {boolean} True if globbing is possible
 */
function canGlob(options) {
  return (
    (options.pattern && options.pattern.length > 0) ||
    (options.dir && options.dir.length > 0)
  );
}

/**
 * Performs file globbing based on the provided options.
 * @param {Object} options - Configuration options containing patterns and directories
 * @returns {Promise<Array<string>>} Promise resolving to array of matched file paths
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
 * Converts a file path to an HTTP-compatible path.
 * @param {string} file - The file path to convert
 * @returns {string} The HTTP-compatible path
 */
function httpPath(file) {
  const f = path.sep === '\\' ? file.replace(/\\/g, '/') : file;
  return url.format(f);
}

/**
 * Converts file paths to HTTP-compatible paths with optional prefix.
 * @param {Object} options - Configuration options
 * @param {string} [options.prefix] - Prefix to add to each path
 * @param {Array<string>} files - Array of file paths
 * @returns {Array<string>} Array of HTTP-compatible paths
 */
function httpPaths(options, files) {
  const prefix = options.prefix || '';

  return files.map((file) => prefix + httpPath(file));
}

/**
 * Removes duplicate entries from an array while preserving order.
 * @param {Array<string>} l - Array that may contain duplicates
 * @returns {Array<string>} Array with duplicates removed
 */
function deduplicate(l) {
  return l.filter((v, i, a) => a.indexOf(v) === i);
}

/**
 * Find files based on the given options.
 *
 * Duplicates are automatically removed from the results.
 *
 * @param {Object} options - Configuration options
 * @param {Array<string>} [options.files] - List of files to always include in results
 * @param {Array<string>} [options.pattern] - Patterns for scanning files
 * @param {Array<string>} [options.dir] - Directories to scan for files
 * @param {string|Array<string>} [options.types] - File types to scan for (e.g., 'jpg,png' or ['jpg', 'png'])
 * @param {string} [options.prefix] - Prefix to include in all scanned results
 * @param {boolean} [options.recursive] - Whether to scan files recursively
 * @returns {Promise<Array<string>>} Promise resolving to array of found file paths
 */
async function findFiles(options) {
  const extraFiles = options.files || [];

  const files = await globFiles(options);
  const allFiles = files.concat(extraFiles);
  const fileHttpPaths = httpPaths(options, allFiles);
  return deduplicate(fileHttpPaths);
}

module.exports = findFiles;
