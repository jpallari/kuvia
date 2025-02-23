const path = require('path');

const sourceBasePath = path.join(__dirname, '..', 'web');
const resourceBasePath = path.join(__dirname, '..', 'resources');

exports.resourcePath = (filename) => path.join(resourceBasePath, filename);
exports.sourcePath = (filename) => path.join(sourceBasePath, filename);
