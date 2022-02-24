// @ts-check
const prefix = require('./prefix');

const fileMap = {
  'package.json': 'node',
};

/**
 * @param {string} fileName
 * @returns {string}
 */
function mapFile(fileName) {
  const exactMatch = fileMap[fileName];

  if (exactMatch) {
    return exactMatch;
  }

  if (fileName.endsWith('.json')) {
    return 'json';
  }

  return 'default';
}

const dirMap = {

};

/**
 * @param {string} dirName
 * @returns {string}
 */
function mapDirectory(dirName) {
  const exactMatch = dirMap[dirName];

  if (exactMatch) {
    return exactMatch;
  }

  return 'directory';
}

/**
 * @type {Record<string, (name: string) => string>}
 */
module.exports = {
  mapFile: (name) => `${prefix}-${mapFile(name)}`,
  mapDirectory: (name) => `${prefix}-${mapDirectory(name)}`,
};
