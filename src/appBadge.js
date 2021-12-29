const { BrowserWindow } = require('electron');

const utils = require('./utils');
const ipcMain = require('./ipcMain');

let hasInit = false;
let lastIndex = null;
let appIcons = [];

exports.init = () => {
  if (process.platform !== 'win32') { // Electron only supports win.setOverlayIcon on Windows
    log('AppBadge', 'Refusing to init due to non-Windows');
    return;
  }

  if (hasInit) {
    log('AppBadge', 'Already init, ignoring');
    return;
  }

  exports.hasInit = hasInit = true;

  for (let i = 1; i <= 11; i++) {
    appIcons.push(utils.exposeModuleResource('images/badges', `badge-${i}.ico`));
  }

  ipcMain.on('APP_BADGE_SET', (_e, num) => {
    const win = BrowserWindow.fromId(global.mainWindowId);

    let index, desc;

    switch (num) {
      case -1:
        index = 10;
        desc = 'Unread messages';
        break;
      
      case 0:
        index = null; // Clear icon
        desc = 'No notifications';
        break;
      
      default:
        index = Math.max(1, Math.min(num, 10)) - 1; // Clamp num between 1-10, -1 to make into 
        desc = num + ' notifications';
        break;
    }

    if (lastIndex !== index) {
      lastIndex = index;

      if (index === null) return win.setOverlayIcon(null, desc);

      win.setOverlayIcon(appIcons[index], desc);
    }
  });
};