// Largely copied as nothing to do
exports.init = (bootstrap) => {
  const { APP_NAME, API_ENDPOINT, NEW_UPDATE_ENDPOINT, UPDATE_ENDPOINT, APP_ID } = bootstrap; // From bootstrap consts

  const DEFAULT_MAIN_WINDOW_ID = 0;
  const MAIN_APP_DIRNAME = __dirname;

  const UpdaterEvents = {
    UPDATE_NOT_AVAILABLE: 'UPDATE_NOT_AVAILABLE',
    CHECKING_FOR_UPDATES: 'CHECKING_FOR_UPDATES',
    UPDATE_ERROR: 'UPDATE_ERROR',
    UPDATE_MANUALLY: 'UPDATE_MANUALLY',
    UPDATE_AVAILABLE: 'UPDATE_AVAILABLE',
    MODULE_INSTALL_PROGRESS: 'MODULE_INSTALL_PROGRESS',
    UPDATE_DOWNLOADED: 'UPDATE_DOWNLOADED',
    MODULE_INSTALLED: 'MODULE_INSTALLED',
    CHECK_FOR_UPDATES: 'CHECK_FOR_UPDATES',
    QUIT_AND_INSTALL: 'QUIT_AND_INSTALL',
    MODULE_INSTALL: 'MODULE_INSTALL',
    MODULE_QUERY: 'MODULE_QUERY',
    UPDATER_HISTORY_QUERY_AND_TRUNCATE: 'UPDATER_HISTORY_QUERY_AND_TRUNCATE',
    UPDATER_HISTORY_RESPONSE: 'UPDATER_HISTORY_RESPONSE'
  };
  const MenuEvents = {
    OPEN_HELP: 'menu:open-help',
    OPEN_SETTINGS: 'menu:open-settings',
    CHECK_FOR_UPDATES: 'menu:check-for-updates'
  };

  module.exports = {
    APP_NAME,
    DEFAULT_MAIN_WINDOW_ID,
    MAIN_APP_DIRNAME,
    APP_ID,
    API_ENDPOINT,
    NEW_UPDATE_ENDPOINT,
    UPDATE_ENDPOINT,
    UpdaterEvents,
    MenuEvents
  };
};