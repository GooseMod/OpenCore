const { readFileSync, writeFileSync } = require('fs');
const { resolve, join } = require('path');

const paths = require('./utils/paths');

exports.exposeModuleResource = (asar, file) => {
  const asarPath = join(__dirname, asar, file);

  const nativePath = join(paths.getUserData(), file);
  writeFileSync(nativePath, readFileSync(asarPath));

  return nativePath;
};

const platform = process.platform;
exports.platform = platform;

exports.isWindows = platform.startsWith('win');
exports.isOSX = platform === 'darwin';
exports.isLinux = platform === 'linux';