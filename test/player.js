const Application = require('spectron').Application;
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const electronPath = require('electron');
const path = require('path');

// set 'should' to const for helpers like .not.exist which don't
// make sense with the prototype extension, or use 'expect'
chai.should();
chai.use(chaiAsPromised);

describe('Application launch', function () {
  this.timeout(10000);

  beforeEach(function () {
    this.app = new Application({
      path: electronPath,
      requireName: 'electronRequire',
      env: 'test',
      args: [path.join(__dirname, '..')],
    });
    return this.app.start();
  });

  // might be cool but doesn't seem to work
  // since Spectron 11.0.0 (Electron ^9.0.0)
  // beforeEach(function () {
  //   chaiAsPromised.transferPromiseness = this.app.transferPromiseness;
  // });

  afterEach(function () {
    if (this.app && this.app.isRunning()) {
      return this.app.stop();
    }
  });

  it('has one initially hidden window', function () {
    return this.app.browserWindow.isVisible().should.eventually.be.false;
  });
});
