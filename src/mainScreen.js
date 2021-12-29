const { BrowserWindow, screen, app } = require('electron');

const appSettings = require('./appSettings');
const buildInfo = require('./utils/buildInfo');
const splashScreen = require('./splashScreen');
const securityUtils = require('./utils/securityUtils');
const systemTray = require('./systemTray');
const appBadge = require('./appBadge');

const settings = appSettings.getSettings();

let mainWindow, mainWindowId;


const MIN_WIDTH = settings.get('MIN_WIDTH', 940);
const MIN_HEIGHT = settings.get('MIN_HEIGHT', 500);
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

const genEndpoint = () => {
  const fromConfig = process.env.DISCORD_WEBAPP_ENDPOINT || settings.get('WEBAPP_ENDPOINT');
  if (fromConfig) return fromConfig;

  switch (buildInfo.releaseChannel) {
    case 'stable':
      return 'https://discord.com';

    case 'development':
      return 'https://canary.discord.com';

    default:
      return 'https://' + buildInfo.releaseChannel + '.discord.com';
  }
};

const WEBAPP_ENDPOINT = genEndpoint();
const WEBAPP_PATH = settings.get('WEBAPP_PATH', `/app?_=${Date.now()}`);
const URL_TO_LOAD = `${WEBAPP_ENDPOINT}${WEBAPP_PATH}`;

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

  systemTray.init({
    onCheckForUpdates: () => {
      const updater = _updater.default === null || _updater.default === void 0 ? void 0 : _updater.default.getUpdater();

      if (updater != null) {
        checkForUpdatesWithUpdater(updater);
      } else {
        legacyModuleUpdater.checkForUpdates();
      }
    },

    onTrayClicked: () => setWindowVisible(true, true),

    onOpenVoiceSettings: () => {}, // Stubs because no DiscordNative
    onToggleMute: () => {},
    onToggleDeafen: () => {},
    onLaunchApplication: () => {}
  });

  appBadge.init();

  if (process.platform === 'linux' || process.platform === 'win32') {
    systemTray.show();

    mainWindow.on('close', e => {
      if (mainWindow === null) { // Killed
        popoutWindows.closePopouts();
        return;
      }

      // saveWindowConfig(mainWindow); // Quit app if that's the setting

      if (!settings.get('MINIMIZE_TO_TRAY', true)) return app.quit(); // Quit if disabled to minimize to tray, else minimize

      setWindowVisible(false);
      e.preventDefault();
    });
  }

  mainWindow.loadURL(URL_TO_LOAD);
};

const setWindowVisible = (visible, unmin = false) => {
  if (!mainWindow) return;

  if (visible) {
    if (unmin || !mainWindow.isMinimized()) {
      mainWindow.show();
    }
  } else {
    mainWindow.hide();
  }

  mainWindow.setSkipTaskbar(!visible);
};

exports.setVisible = (visible) => setWindowVisible(visible);