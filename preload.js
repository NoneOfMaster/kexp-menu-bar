const { contextBridge, ipcRenderer } = require('electron');

// todo: https://github.com/electron-userland/spectron/issues/693#issuecomment-748482545

const api = {
  setSetting: setting => ipcRenderer.send('setSetting', [setting]),
  exitApp: restart => ipcRenderer.send('exitApp', [restart]),
  isPlaying: () => ipcRenderer.send('isPlaying'),
  isPaused: () => ipcRenderer.send('isPaused'),

  onPlay: fn => {
    // strip event for security, it includes 'sender'
    ipcRenderer.on('play', (event, ...args) => fn(...args));
  },
  onPause: fn => {
    ipcRenderer.on('pause', (event, ...args) => fn(...args));
  },
  onUpdatePlaylistInfo: fn => {
    ipcRenderer.on('updatePlaylistInfo', (event, ...args) => fn(...args));
  },
  onUpdateShowsInfo: fn => {
    ipcRenderer.on('updateShowsInfo', (event, ...args) => fn(...args));
  },
  onShowSettings: fn => {
    ipcRenderer.on('showSettings', (event, ...args) => fn(...args));
  },
  onSettings: fn => {
    ipcRenderer.on('settings', (event, ...args) => fn(...args));
  },
};

if (process.env.NODE_ENV === 'test') {
  window.electronRequire = require;
  window.api = api;
} else {
  contextBridge.exposeInMainWorld('api', api);
}
