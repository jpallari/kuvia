const path = require('path');

const sourceBasePath = path.join(__dirname, '..', 'web');
const resourceBasePath = path.join(__dirname, '..', 'resources');

/**
 * Gets the full path to a resource file.
 * @param {string} filename - Name of the resource file
 * @returns {string} Full path to the resource file
 */
exports.resourcePath = (filename) => path.join(resourceBasePath, filename);

/**
 * Gets the full path to a source file.
 * @param {string} filename - Name of the source file
 * @returns {string} Full path to the source file
 */
exports.sourcePath = (filename) => path.join(sourceBasePath, filename);
