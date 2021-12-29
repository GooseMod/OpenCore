// Not modified *that* much as not much to change
const { Tray, Menu, nativeImage } = require('electron');

const ipcMain = require('./ipcMain');
const securityUtils = require('./utils/securityUtils');
const Constants = require('./Constants');
const utils = require('./utils');

const TrayIconNames = {
  DEFAULT: 'tray',
  UNREAD: 'tray-unread',
  CONNECTED: 'tray-connected',
  SPEAKING: 'tray-speaking',
  MUTED: 'tray-muted',
  DEAFENED: 'tray-deafened'
};
const MenuItems = {
  SECRET: 'SECRET',
  MUTE: 'MUTE',
  DEAFEN: 'DEAFEN',
  OPEN: 'OPEN',
  VOICE_SETTINGS: 'VOICE_SETTINGS',
  CHECK_UPDATE: 'CHECK_UPDATE',
  QUIT: 'QUIT',
  ACKNOWLEDGEMENTS: 'ACKNOWLEDGEMENTS'
};

let trayIcons = {};
let menuItems = [];
let applications = [];
let contextMenu = [];
let options, atomTray;


exports.init = (_options) => {
  options = _options;

  const resourcePath = `images/systemtray`;
  
  for (const key of Object.keys(TrayIconNames)) {
    trayIcons[key] = utils.exposeModuleResource(resourcePath, `${TrayIconNames[key]}.png`);
  }

  currentIcon = trayIcons.DEFAULT;

  const {
    onToggleMute,
    onToggleDeafen,
    onTrayClicked,
    onOpenVoiceSettings,
    onCheckForUpdates
  } = options;
  const voiceConnected = currentIcon !== trayIcons.DEFAULT && currentIcon !== trayIcons.UNREAD;

  menuItems[MenuItems.SECRET] = {
    label: `Discord`,
    icon: trayIcons.DEFAULT,
    enabled: false
  };
  menuItems[MenuItems.MUTE] = {
    label: `Mute`,
    type: 'checkbox',
    checked: currentIcon === trayIcons.MUTED || currentIcon === trayIcons.DEAFENED,
    visible: voiceConnected,
    click: onToggleMute
  };
  menuItems[MenuItems.DEAFEN] = {
    label: `Deafen`,
    type: 'checkbox',
    checked: currentIcon === trayIcons.DEAFENED,
    visible: voiceConnected,
    click: onToggleDeafen
  };
  menuItems[MenuItems.OPEN] = {
    label: `Open ${Constants.APP_NAME}`,
    type: 'normal',
    visible: process.platform === 'linux',
    click: onTrayClicked
  };
  menuItems[MenuItems.VOICE_SETTINGS] = {
    label: 'Voice / Video Settings',
    type: 'normal',
    visible: voiceConnected,
    click: onOpenVoiceSettings
  };
  menuItems[MenuItems.CHECK_UPDATE] = {
    label: 'Check for Updates...',
    type: 'normal',
    visible: process.platform !== 'darwin',
    click: onCheckForUpdates
  };
  menuItems[MenuItems.QUIT] = {
    label: `Quit ${Constants.APP_NAME}`,
    role: 'quit'
  };
  menuItems[MenuItems.ACKNOWLEDGEMENTS] = {
    label: 'Acknowledgements',
    type: 'normal',
    visible: process.platform !== 'darwin',
    click: () => securityUtils.saferShellOpenExternal('https://discord.com/acknowledgements')
  };

  buildContext();

  ipcMain.on('SYSTEM_TRAY_SET_ICON', (_e, icon) => setTrayIcon(icon));
  ipcMain.on('SYSTEM_TRAY_SET_APPLICATIONS', (_e, newApplications) => setApplications(newApplications));
};

const buildContext = () => {
  const separator = {
    type: 'separator'
  };

  const hasApplications = applications != null && applications.length > 0;
  contextMenu = [menuItems[MenuItems.SECRET], separator, ...(hasApplications ? [...applications, separator] : []), menuItems[MenuItems.OPEN], menuItems[MenuItems.MUTE], menuItems[MenuItems.DEAFEN], menuItems[MenuItems.VOICE_SETTINGS], menuItems[MenuItems.CHECK_UPDATE], menuItems[MenuItems.ACKNOWLEDGEMENTS], separator, menuItems[MenuItems.QUIT]];
};

const launchApplication = (id) => options.onLaunchApplication(id);

function setApplications(newApplications) {
  applications = newApplications.map(application => ({
    type: 'normal',
    label: application.name,
    click: () => launchApplication(application.id)
  }));

  buildContext();
  setContext();
}

const setContext = () => atomTray && atomTray.setContextMenu(Menu.buildFromTemplate(contextMenu));

const show = () => {
  if (atomTray != null) return;
  atomTray = new Tray(nativeImage.createFromPath(currentIcon)); // Initialize with last set icon

  atomTray.setToolTip(Constants.APP_NAME); // Set tray context menu
  setContext(); // Set Tray click behavior

  atomTray.on('click', options.onTrayClicked);
};
exports.show = show;

const hide = () => {
  if (atomTray == null) return;

  atomTray.destroy();
  atomTray = null;
};

const setTrayIcon = (icon) => {
  currentIcon = trayIcons[icon];

  if (icon == null) return hide();
  show();

  const muteIndex = contextMenu.indexOf(menuItems[MenuItems.MUTE]);
  const deafenIndex = contextMenu.indexOf(menuItems[MenuItems.DEAFEN]);
  const voiceConnected = contextMenu[muteIndex].visible;
  let shouldSetContextMenu = false;

  if (currentIcon !== trayIcons.DEFAULT && currentIcon !== trayIcons.UNREAD) {
    // Show mute/deaf controls
    if (!voiceConnected) {
      contextMenu[muteIndex].visible = true;
      contextMenu[deafenIndex].visible = true;
      shouldSetContextMenu = true;
    }

    if (currentIcon === trayIcons.DEAFENED) {
      contextMenu[muteIndex].checked = true;
      contextMenu[deafenIndex].checked = true;
      shouldSetContextMenu = true;
    } else if (currentIcon === trayIcons.MUTED) {
      contextMenu[muteIndex].checked = true;
      contextMenu[deafenIndex].checked = false;
      shouldSetContextMenu = true;
    } else if (contextMenu[muteIndex].checked || contextMenu[deafenIndex].checked) {
      contextMenu[muteIndex].checked = false;
      contextMenu[deafenIndex].checked = false;
      shouldSetContextMenu = true;
    }
  } else if (voiceConnected) {
    contextMenu[muteIndex].visible = false;
    contextMenu[deafenIndex].visible = false;
    shouldSetContextMenu = true;
  }

  shouldSetContextMenu && setContextMenu();
  return atomTray != null && atomTray.setImage(nativeImage.createFromPath(currentIcon));
}