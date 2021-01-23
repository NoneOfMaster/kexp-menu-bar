const Application = require('spectron').Application;
const test = require('ava').serial;
const electronPath = require('electron');
const fs = require('fs');
const path = require('path');
const wait = require('./helpers/wait').wait;
const { playlistGETResponse, showsGETResponse } = require('./fixtures/kexpApi');

const userDataPath = `${__dirname}/test-temp`;
const settingsPath = `${userDataPath}/settings.json`;
const clearTestSettingsFile = () => fs.writeFileSync(settingsPath, '');
const getTestSettingsFile = () => fs.readFileSync(settingsPath, 'utf8');

test.before(async t => {
  clearTestSettingsFile();

  t.context.app = new Application({
    path: electronPath,
    requireName: 'electronRequire',
    env: 'test',
    args: [path.join(__dirname, '..')],
    chromeDriverArgs: [`--user-data-dir=${userDataPath}`],
  });
  await t.context.app.start();
});

test.after.always(async t => await t.context.app.stop());

test('initializes with a hidden window', async t => {
  t.false(
    await t.context.app.browserWindow.isVisible(),
    'the player window is created in the background'
  );
});

test('plays', async t => {
  const { app } = t.context;
  app.browserWindow.send('play');
  await wait(5000);
  t.true(await app.webContents.isCurrentlyAudible(), 'kexp streams');
});

test('pauses', async t => {
  const { app } = t.context;
  app.browserWindow.send('pause');
  await wait(2000);
  t.false(await app.webContents.isCurrentlyAudible(), 'the stream is stopped');
});

test('it displays stream information', async t => {
  const [playlistInfo] = playlistGETResponse;
  const [showInfo] = showsGETResponse;

  const { app } = t.context;
  const { browserWindow } = app;
  await browserWindow.show();

  app.client.waitUntilWindowLoaded();

  const albumPlaceholderImgEl = await app.client.$('#album-img');
  const albumPlaceholderImgSrc = await albumPlaceholderImgEl.getAttribute(
    'src'
  );

  t.true(
    !!albumPlaceholderImgSrc.includes('assets/record.png'),
    'a placeholder image is displayed when no album cover is provided'
  );

  await browserWindow.send('updatePlaylistInfo', playlistInfo);
  await browserWindow.send('updateShowsInfo', showInfo);

  const [albumImgEl, showInfoEl, songInfoEl] = await app.client.$$(
    '#album-img, #show-info, #song-info'
  );

  const albumImgSrc = await albumImgEl.getAttribute('src');
  const showInfoText = await showInfoEl.getText();
  const songInfoText = await songInfoEl.getText();

  t.true(
    albumImgSrc === playlistInfo.thumbnail_uri,
    'an album cover is displayed'
  );
  t.true(
    showInfoText === 'Audioasis with Eva Walker',
    'show information is displayed'
  );
  t.true(
    songInfoText.includes('Alice in Chains – Down in a Hole'),
    'artist and song information is displayed'
  );
  t.true(songInfoText.includes('Dirt'), 'album information is displayed');
});

test('it saves settings', async t => {
  const { app } = t.context;
  const { browserWindow } = app;
  await browserWindow.show();

  const initialSettingsFile = getTestSettingsFile();
  t.true(initialSettingsFile === '', 'by default, no settings are saved');

  app.client.waitUntilWindowLoaded();

  const settings = await app.client.$('#settings-icon');
  const openAtLogin = await app.client.$('[name="openAtLogin"]');
  const iconAnimation = await app.client.$('[name="iconAnimation"]');

  await settings.click();

  const openAtLoginClicked = await openAtLogin.isSelected();
  const iconAnimationClicked = await iconAnimation.isSelected();

  t.true(
    openAtLoginClicked,
    'default setting is used when not saved: openAtLogin'
  );
  t.true(
    iconAnimationClicked,
    'default setting is used when not saved: iconAnimation'
  );

  // uncheck settings
  await openAtLogin.click();
  await iconAnimation.click();

  const settingsFileAfterUncheck = getTestSettingsFile();
  const settingsJSONAfterUncheck = JSON.parse(settingsFileAfterUncheck);

  t.false(
    settingsJSONAfterUncheck.openAtLogin,
    'settings are unselected: openAtLogin'
  );
  t.false(
    settingsJSONAfterUncheck.iconAnimation,
    'settings are unselected: iconAnimation'
  );

  await openAtLogin.click();
  await iconAnimation.click();

  const settingsFileAfterCheck = getTestSettingsFile();
  const settingsJSONAfterCheck = JSON.parse(settingsFileAfterCheck);

  t.true(
    settingsJSONAfterCheck.openAtLogin,
    'settings are selected: openAtLogin'
  );
  t.true(
    settingsJSONAfterCheck.iconAnimation,
    'settings are selected: iconAnimation'
  );
});
