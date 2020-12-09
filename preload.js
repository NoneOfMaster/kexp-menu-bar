const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  setSetting: setting => ipcRenderer.send('setSetting', [setting]),
  exitApp: restart => ipcRenderer.send('exitApp', [restart]),

  onPlay: fn => {
    // strip event for security, it includes 'sender'
    ipcRenderer.on('play', (event, ...args) => fn(...args));
  },
  onPause: fn => {
    ipcRenderer.on('pause', (event, ...args) => fn(...args));
  },
  onUpdateInfo: fn => {
    ipcRenderer.on('updateInfo', (event, ...args) => fn(...args));
  },
  onShowSettings: fn => {
    ipcRenderer.on('showSettings', (event, ...args) => fn(...args));
  },
  onSettings: fn => {
    ipcRenderer.on('settings', (event, ...args) => fn(...args));
  },
});
