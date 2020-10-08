const { app, BrowserWindow, ipcMain, Tray } = require('electron');
const path = require('path');
const fs = require('fs');

const ICON_VARIANT_COUNT = 5;
const WINDOW_WIDTH = 600;
const WINDOW_HEIGHT = 200;
const DEFAULT_SETTINGS = { openAtLogin: true, iconAnimation: true };
const DEV_MODE = false;

const settingsPath = path.join(app.getPath('userData'), 'settings.json');
const getSettings = setting => {
  const settingsFile = fs.readFileSync(settingsPath, { flag: 'a+' });
  try {
    const settings = JSON.parse(settingsFile);
    if (setting) return settings[setting];
    return settings;
  } catch {
    return DEFAULT_SETTINGS;
  }
};
const writeSetting = updatedSettings => {
  const oldSettings = getSettings();
  const newSettings = {
    ...oldSettings,
    ...updatedSettings,
  };
  fs.writeFileSync(settingsPath, JSON.stringify(newSettings));
  return newSettings;
};

let tray;
let playerWindow;
let updateInfoInterval;
let settings = getSettings();

const generateIconPath = idx =>
  path.join(__dirname, 'assets', `kexpTemplate${idx}.png`);

const setIconLeftClick = tray => {
  tray.setImage(generateIconPath(0));

  tray.once('click', () => {
    const { iconAnimation } = settings;
    const interval = iconAnimation ? startIconAnimation(tray) : null;

    play();

    tray.once('click', () => {
      clearInterval(interval);
      setIconLeftClick(tray);
      pause();
    });
  });
};

const setIconRightClick = tray => {
  updateInfoInterval = setInterval(() => updateInfo(), 120000);
  updateInfo();

  tray.on('right-click', (event, bounds) => {
    if (playerWindow.isVisible()) {
      clearInterval(updateInfoInterval);
      updateInfoInterval = setInterval(() => updateInfo(), 120000);
      hidePlayerWindow();
    } else {
      updateInfo();
      clearInterval(updateInfoInterval);
      updateInfoInterval = setInterval(() => updateInfo(), 2000);

      const { x, y } = bounds;
      playerWindow.setPosition(x - WINDOW_WIDTH / 2, y);
      showPlayerWindow();
    }
  });
};

const play = () => playerWindow.send('play');
const pause = () => playerWindow.send('pause');
const updateInfo = () => playerWindow.send('updateInfo');
const sendSettings = () => playerWindow.send('settings', getSettings());

const showPlayerWindow = () => playerWindow.show();
const hidePlayerWindow = () => {
  playerWindow.send('showSettings', false);
  playerWindow.hide();
};

const createPlayerWindow = () => {
  playerWindow = new BrowserWindow({
    height: WINDOW_HEIGHT,
    width: WINDOW_WIDTH,
    titleBarStyle: 'hidden',
    backgroundColor: '#191919',
    alwaysOnTop: true,
    resizable: false,
    movable: false,
    show: DEV_MODE ? true : false,
    webPreferences: {
      enableRemoteModule: false,
      contextIsolation: true,
      worldSafeExecuteJavaScript: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });
  playerWindow.setWindowButtonVisibility(false);
  playerWindow.loadFile('player/player.html');
  playerWindow.webContents.on('did-finish-load', () => sendSettings());

  if (DEV_MODE) {
    playerWindow.webContents.openDevTools();
    return;
  }

  playerWindow.on('blur', () => hidePlayerWindow());
};

const startIconAnimation = tray => {
  let lastIconIdx = 0;

  return setInterval(() => {
    let iconIdx = Math.floor(Math.random() * ICON_VARIANT_COUNT);

    // if random idx is a dupe, get the next one
    if (iconIdx === lastIconIdx) iconIdx = (iconIdx + 1) % ICON_VARIANT_COUNT;

    lastIconIdx = iconIdx;

    tray.setImage(generateIconPath(iconIdx));
  }, 600);
};

app.whenReady().then(() => {
  tray = new Tray(generateIconPath(0));
  tray.setIgnoreDoubleClickEvents(true);
  createPlayerWindow();
  setIconLeftClick(tray);
  setIconRightClick(tray);
});

app.setLoginItemSettings({ openAtLogin: settings.openAtLogin });

ipcMain.on('exitApp', (event, [restart]) => {
  clearInterval(updateInfoInterval);
  if (restart) app.relaunch();
  app.exit(0);
});

ipcMain.on('setSetting', (event, [settingHash]) => {
  settings = writeSetting(settingHash);
});
