const { ipcMain } = require('electron');

const ipcNamespace = 'DISCORD_';
const getDiscordIPCEvent = (e) => e.startsWith(ipcNamespace) ? e : (ipcNamespace + e);

module.exports = {
  on: (event, callback) => ipcMain.on(getDiscordIPCEvent(event), callback),
  removeListener: (event, callback) => ipcMain.removeListener(getDiscordIPCEvent(event), callback),
  reply: (event, channel, ...args) => event.sender.send(getDiscordIPCEvent(channel), ...args)
};