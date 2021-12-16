const bootstrapModules = require('./bootstrapModules');

let mainScreen;
exports.startup = (bootstrap) => {
  bootstrapModules.init(bootstrap);

  mainScreen = require('./mainScreen');
  mainScreen.makeWindow('https://canary.discord.com/app');

  splashScreen = require('./splashScreen.js');
  splashScreen.pageReady();
};

exports.setMainWindowVisible = (visible) => mainScreen.setVisible(visible);