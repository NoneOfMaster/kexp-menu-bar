const Application = require('spectron').Application;
const test = require('ava').serial;
const electronPath = require('electron');
const path = require('path');
const wait = require('./helpers/wait').wait;
const { playlistGETResponse, showsGETResponse } = require('./fixtures/kexpApi');

test.before(async t => {
  t.context.app = new Application({
    path: electronPath,
    requireName: 'electronRequire',
    env: 'test',
    args: [path.join(__dirname, '..')],
  });
  await t.context.app.start();
});

test.after.always(async t => await t.context.app.stop());

test('initializes with a hidden window', async t => {
  t.false(await t.context.app.browserWindow.isVisible());
});

test('plays', async t => {
  const { app } = t.context;
  app.browserWindow.send('play');
  await wait(5000);
  t.true(await app.webContents.isCurrentlyAudible());
});

test('pauses', async t => {
  const { app } = t.context;
  app.browserWindow.send('pause');
  await wait(2000);
  t.false(await app.webContents.isCurrentlyAudible());
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

  t.true(!!albumPlaceholderImgSrc.includes('assets/record.png'));

  await browserWindow.send('updatePlaylistInfo', playlistInfo);
  await browserWindow.send('updateShowsInfo', showInfo);

  const [albumImgEl, showInfoEl, songInfoEl] = await app.client.$$(
    '#album-img, #show-info, #song-info'
  );

  const albumImgSrc = await albumImgEl.getAttribute('src');
  const showInfoText = await showInfoEl.getText();
  const songInfoText = await songInfoEl.getText();

  t.true(albumImgSrc === playlistInfo.thumbnail_uri);
  t.true(showInfoText === 'Audioasis with Eva Walker');
  t.true(songInfoText.includes('Alice in Chains – Down in a Hole'));
  t.true(songInfoText.includes('Dirt'));
});
