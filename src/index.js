const bootstrapModules = require('./bootstrapModules');

let mainScreen;
exports.startup = (bootstrap) => {
  if (!bootstrap.securityUtils) { // Not using OpenAsar, additional isn't passed
    // Some warning here in future
    return;
  }

  Constants = require('./Constants');
  Constants.init(bootstrap.Constants);

  bootstrapModules.init(bootstrap);

  mainScreen = require('./mainScreen');
  mainScreen.makeWindow();
};

exports.setMainWindowVisible = (visible) => mainScreen.setVisible(visible);