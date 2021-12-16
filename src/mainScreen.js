const { BrowserWindow } = require('electron');
const appSettings = require('./appSettings');
const settings = appSettings.getSettings();

let mainWindow, mainWindowId;

const MIN_WIDTH = 940;
const MIN_HEIGHT = 500;
const DEFAULT_WIDTH = 1280;
const DEFAULT_HEIGHT = 720;

exports.makeWindow = (url, isVisible = false) => {
  const mainWindowOptions = {
    title: 'Discord',
    backgroundColor: settings.get('BACKGROUND_COLOR', '#2f3136'),
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
    minWidth: MIN_WIDTH,
    minHeight: MIN_HEIGHT,
    transparent: false,
    frame: false,
    resizable: true,
    show: isVisible,
    webPreferences: {
      blinkFeatures: 'EnumerateDevices,AudioOutputDevices',
      nodeIntegration: false,
      // preload: _path.default.join(__dirname, 'mainScreenPreload.js'),
      nativeWindowOpen: true,
      enableRemoteModule: false,
      spellcheck: true,
      contextIsolation: true,
      // NB: this is required in order to give popouts (or any child window opened via window.open w/ nativeWindowOpen)
      // a chance at a node environment (i.e. they run the preload, have an isolated context, etc.) when
      // `app.allowRendererProcessReuse === false` (default in Electron 7).
      additionalArguments: ['--enable-node-leakage-in-renderers']
    }
  };

  mainWindow = new BrowserWindow(mainWindowOptions);

  mainWindowId = mainWindow.id;
  global.mainWindowId = mainWindowId;

  mainWindow.setMenuBarVisibility(false);

  mainWindow.loadURL(url);
};

exports.setVisible = (visible) => {
  if (!mainWindow) return;

  if (visible) {
    if (!mainWindow.isMinimized()) {
      mainWindow.show();
    }
  } else {
    mainWindow.hide();
  }

  mainWindow.setSkipTaskbar(!isVisible);
};