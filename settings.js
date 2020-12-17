const { app } = require('electron');
const path = require('path');
const fs = require('fs');

const DEFAULT_SETTINGS = {
  openAtLogin: true,
  iconAnimation: true,
};

const settingsPath = path.join(app.getPath('userData'), 'settings.json');

exports.getSettings = setting => {
  const settingsFile = fs.readFileSync(settingsPath, { flag: 'a+' });
  try {
    const settings = {
      ...DEFAULT_SETTINGS,
      ...JSON.parse(settingsFile),
    };
    if (setting) return settings[setting];
    return settings;
  } catch {
    return DEFAULT_SETTINGS;
  }
};

exports.setSettings = updatedSettings => {
  const oldSettings = getSettings();
  const newSettings = {
    ...oldSettings,
    ...updatedSettings,
  };
  fs.writeFileSync(settingsPath, JSON.stringify(newSettings));
  return newSettings;
};
