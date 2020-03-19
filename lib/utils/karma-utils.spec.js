const logger = require('@blackbaud/skyux-logger');
const mock = require('mock-require');

describe('karma utils', () => {

  let serverSpy;
  let serverStartSpy;
  let globSpy;
  let karmaHooks;
  let karmaParseConfigSpy;

  beforeEach(() => {
    spyOn(logger, 'info');
    spyOn(logger, 'warn');
    spyOn(logger, 'error');
    spyOn(logger, 'verbose');

    globSpy = jasmine.createSpyObj('glob', ['sync']);
    globSpy.sync.and.returnValue(['example.spec.js']);
    mock('glob', globSpy);

    serverSpy = jasmine.createSpy('server');
    serverStartSpy = jasmine.createSpy('server-start');
    serverSpy.prototype.on = (evt, cb) => {
      karmaHooks[evt] = karmaHooks[evt] || [];
      karmaHooks[evt].push(cb);
    };
    serverSpy.prototype.start = serverStartSpy;
    karmaHooks = {};

    karmaParseConfigSpy = jasmine.createSpy('parseConfig');
    mock('karma', {
      config: {
        parseConfig: karmaParseConfigSpy
      },
      Server: serverSpy
    });
  });

  afterEach(() => {
    mock.stopAll();
  });

  it('should start a karma server', (done) => {
    const command = 'custom';

    globSpy.sync.and.returnValue([
      'sample.pact-spec.ts'
    ]);

    mock.reRequire('./karma-utils')
      .run(command, {}, '')
      .then(exitCode => {
        expect(exitCode).toBe(0);
        expect(logger.info).toHaveBeenCalledWith(
          'Karma has exited with 0.'
        );
        done();
      });

    serverSpy.calls.allArgs()[0][1](0);
  });

  it('should exit if no specs found', (done) => {
    const command = 'custom';

    globSpy.sync.and.returnValue([]);

    mock.reRequire('./karma-utils')
      .run(command, {}, '')
      .then(exitCode => {
        expect(exitCode).toBe(0);
        expect(logger.info).toHaveBeenCalledWith(
          `No spec files located. Skipping ${command} command.`
        );
        done();
      });
  });

  it('should call setupFromConfig before parseConfig', (done) => {
    const karmaSetupFromConfigSpy = jasmine.createSpy('setupFromConfig');

    mock('karma/lib/logger', {
      setupFromConfig: karmaSetupFromConfigSpy
    });

    globSpy.sync.and.returnValue([]);

    mock.reRequire('./karma-utils')
      .run('test', {}, '')
      .then(() => {
        expect(karmaSetupFromConfigSpy).toHaveBeenCalledBefore(karmaParseConfigSpy);
        done();
      });
  });
});
