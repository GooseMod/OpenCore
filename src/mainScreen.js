const { BrowserWindow, screen } = require('electron');

const appSettings = require('./appSettings');
const splashScreen = require('./splashScreen');
const securityUtils = require('./utils/securityUtils');

const settings = appSettings.getSettings();

let mainWindow, mainWindowId;


const MIN_WIDTH = 940;
const MIN_HEIGHT = 500;
const MIN_VISIBLE_ON_SCREEN = 32;
const DEFAULT_WIDTH = 1280;
const DEFAULT_HEIGHT = 720;
const DISCORD_NAMESPACE = 'DISCORD_';

function doAABBsOverlap(a, b) { // Copied from Discord because a
  const ax1 = a.x + a.width;
  const bx1 = b.x + b.width;
  const ay1 = a.y + a.height;
  const by1 = b.y + b.height; // clamp a to b, see if it is non-empty

  const cx0 = a.x < b.x ? b.x : a.x;
  const cx1 = ax1 < bx1 ? ax1 : bx1;

  if (cx1 - cx0 > 0) {
    const cy0 = a.y < b.y ? b.y : a.y;
    const cy1 = ay1 < by1 ? ay1 : by1;

    if (cy1 - cy0 > 0) {
      return true;
    }
  }

  return false;
}


const WEBAPP_ENDPOINT = 'https://canary.discord.com/app';
exports.makeWindow = (isVisible = false) => {
  const windowOptions = {
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

  const savedBounds = settings.get('WINDOW_BOUNDS');
  if (savedBounds) {
    savedBounds.width = Math.max(MIN_WIDTH, savedBounds.width);
    savedBounds.height = Math.max(MIN_HEIGHT, savedBounds.height);

    const displays = screen.getAllDisplays();

    const display = displays.find(display => {
      const displayBound = display.workArea;

      displayBound.x += MIN_VISIBLE_ON_SCREEN;
      displayBound.y += MIN_VISIBLE_ON_SCREEN;
      displayBound.width -= 2 * MIN_VISIBLE_ON_SCREEN;
      displayBound.height -= 2 * MIN_VISIBLE_ON_SCREEN;

      return doAABBsOverlap(savedBounds, displayBound);
    });

    if (display) {
      windowOptions.width = savedBounds.width;
      windowOptions.height = savedBounds.height;
      windowOptions.x = savedBounds.x;
      windowOptions.y = savedBounds.y;
    } else {
      windowOptions.center = true;
    }
  } else {
    windowOptions.center = true;
  }

  mainWindow = new BrowserWindow(windowOptions);

  mainWindowId = mainWindow.id;
  global.mainWindowId = mainWindowId;

  mainWindow.setMenuBarVisibility(false);

  // Event listeners oh no
  mainWindow.webContents.on('did-finish-load', () => {
    splashScreen.pageReady();
  });

  mainWindow.webContents.on('will-navigate', (e, url) => {
    if (securityUtils.checkUrlOriginMatches(url, WEBAPP_ENDPOINT)) e.preventDefault();
  });

  mainWindow.webContents.on('new-window', (e, url, name, _disposition, options) => {
    e.preventDefault();

    if (name.startsWith(DISCORD_NAMESPACE) && securityUtils.checkUrlOriginMatches(url, WEBAPP_ENDPOINT) && (new URL(url)).pathname === '/popout') {
      popoutWindows.openOrFocusWindow(e, url, name, options, WEBAPP_ENDPOINT);
      return;
    }

    securityUtils.saferShellOpenExternal(url).catch(err => {
      log('MainScreen', 'Error opening external url', url, err);
    });
  });

  mainWindow.loadURL(WEBAPP_ENDPOINT);
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

  mainWindow.setSkipTaskbar(!visible);
};