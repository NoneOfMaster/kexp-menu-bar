const {
  app,
  BrowserWindow,
  ipcMain,
  globalShortcut,
  Menu,
  Tray,
} = require('electron');
const { getSettings, setSettings } = require('./settings.js');
const path = require('path');

app.dock.hide();
Menu.setApplicationMenu(null);

const ICON_VARIANT_COUNT = 5;
const WINDOW_WIDTH = 600;
const WINDOW_HEIGHT = 200;
const DEV_MODE = process.argv.includes('--development');
const TESTING = process.env.NODE_ENV === 'test';

const envBasedWebPreferences = {
  enableRemoteModule: TESTING,
  contextIsolation: !TESTING,
};

let settings = getSettings();
let playing = false;
let updateInfoInterval;

const generateIconPath = idx =>
  path.join(__dirname, 'assets', `kexpTemplate${idx}.png`);

const setIconLeftClick = (tray, playerWindow) => {
  tray.once('click', () => {
    play(playerWindow);
    tray.once('click', () => {
      pause(playerWindow);
      setIconLeftClick(tray, playerWindow);
    });
  });
};

const setIconRightClick = (tray, playerWindow) => {
  tray.on('right-click', () => showHidePlayerWindow(tray, playerWindow));
};

const showHidePlayerWindow = (tray, playerWindow) => {
  if (playerWindow.isVisible()) {
    hidePlayerWindow(playerWindow);
  } else {
    showPlayerWindow(tray, playerWindow);
  }
};

const play = playerWindow => playerWindow.send('play');
const pause = playerWindow => playerWindow.send('pause');
const updateInfo = playerWindow => playerWindow.send('updateInfo');
const sendSettings = playerWindow =>
  playerWindow.send('settings', getSettings());

const showPlayerWindow = (tray, playerWindow) => {
  updateInfo(playerWindow);

  const { x, y } = tray.getBounds();
  playerWindow.setPosition(x - WINDOW_WIDTH / 2, y);

  playerWindow.show();
};

const hidePlayerWindow = playerWindow => {
  playerWindow.send('showSettings', false);
  playerWindow.hide();
};

const createPlayerWindow = () => {
  const playerWindow = new BrowserWindow({
    height: WINDOW_HEIGHT,
    width: WINDOW_WIDTH,
    titleBarStyle: 'hidden',
    backgroundColor: '#191919',
    alwaysOnTop: true,
    resizable: false,
    movable: false,
    show: false,
    webPreferences: {
      ...envBasedWebPreferences,
      worldSafeExecuteJavaScript: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  playerWindow.setWindowButtonVisibility(false);
  // visibleOnFullScreen required or menu and dock will show
  // https://github.com/electron/electron/issues/25368
  playerWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  playerWindow.loadFile('player/player.html');
  playerWindow.webContents.on('did-finish-load', () =>
    sendSettings(playerWindow)
  );

  if (DEV_MODE) playerWindow.webContents.openDevTools();

  playerWindow.on('blur', () => hidePlayerWindow(playerWindow));
  playerWindow.on(
    'show',
    () =>
      (updateInfoInterval = setInterval(() => updateInfo(playerWindow), 120000))
  );
  playerWindow.on('hide', () => {
    clearInterval(updateInfoInterval);
  });

  return playerWindow;
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

const setKeyBindings = (tray, playerWindow) => {
  globalShortcut.register('Cmd+F7', () =>
    showHidePlayerWindow(tray, playerWindow)
  );
  globalShortcut.register('Cmd+F8', () =>
    playing ? pause(playerWindow) : play(playerWindow)
  );
  globalShortcut.register('Cmd+F9', () => restartApp());
};

const restartApp = () => {
  app.relaunch();
  app.exit(0);
};

const setIsPlayingListeners = tray => {
  ipcMain.once('isPlaying', () => {
    playing = true;

    const { iconAnimation } = settings;
    const interval = iconAnimation ? startIconAnimation(tray) : null;

    ipcMain.once('isPaused', () => {
      playing = false;
      clearInterval(interval);
      tray.setImage(generateIconPath(0));
      setIsPlayingListeners(tray);
    });
  });
};

app.on('will-quit', () => {
  globalShortcut.unregister('Cmd+F7');
  globalShortcut.unregister('Cmd+F8');
  globalShortcut.unregister('Cmd+F9');
});

app.whenReady().then(() => {
  const tray = new Tray(generateIconPath(0));
  const playerWindow = createPlayerWindow();

  tray.setIgnoreDoubleClickEvents(true);

  if (getSettings('keyBindings')) setKeyBindings(tray, playerWindow);
  setIsPlayingListeners(tray);

  setIconLeftClick(tray, playerWindow);
  setIconRightClick(tray, playerWindow);
});

app.setLoginItemSettings({ openAtLogin: settings.openAtLogin });

ipcMain.on('exitApp', (event, [restart]) => {
  if (restart) return restartApp();
  app.exit(0);
});

ipcMain.on('setSetting', (event, [settingHash]) => {
  settings = setSettings(settingHash);
  app.setLoginItemSettings({ openAtLogin: settings.openAtLogin });
});
