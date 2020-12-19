const Application = require('spectron').Application;
const test = require('ava').serial;
const electronPath = require('electron');
const path = require('path');
const wait = require('./helpers/wait').wait;

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
  await wait(4000);
  t.true(await app.webContents.isCurrentlyAudible());
});

test('pauses', async t => {
  const { app } = t.context;
  app.browserWindow.send('pause');
  await wait(2000);
  t.false(await app.webContents.isCurrentlyAudible());
});
