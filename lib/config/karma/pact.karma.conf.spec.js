/*jshint jasmine: true, node: true */
'use strict';

const mock = require('mock-require');
const path = require('path');
const logger = require('@blackbaud/skyux-logger');

describe('config karma pact', () => {
  const watchPath = '@skyux-sdk/builder/config/karma/watch.karma.conf';
  const testPath = '@skyux-sdk/builder/config/karma/test.karma.conf';

  let watchCalled;

  beforeEach(() => {

    const f = '@skyux-sdk/builder/config/webpack/test.webpack.config';

    watchCalled = false;

    mock(f, {
      getWebpackConfig: () => {
        return {};
      }
    });

    mock(watchPath, () => {
      watchCalled = true;
    });

    mock(testPath, () => {});

    mock('minimist', () => {
      return {
        _: ['pact'],
        watch: true
      };
    });

    mock('@skyux-sdk/builder/config/sky-pages/sky-pages.config', {
      outPath: (path) => path,
      getSkyPagesConfig: () => {
        return {
          skyux: {
            pacts: [
              {
                provider: 'test-provider',
                consumer: 'test-consumer',
                spec: 1
              }
            ]
          },
          runtime: {
            pactConfig: {

            }
          }
        };
      }
    });

    mock('../pact-servers', {
      getPactProxyServer: () => 'http://localhost:1234',
      getAllPactServers: () => ({
        'test-provider': {
          'host': 'localhost',
          'port': '8000',
          'fullUrl': 'http://localhost:8000'
        }
      }),
      getPactServer: () => ({
        'host': 'localhost',
        'port': '8000',
        'fullUrl': 'http://localhost:8000'
      })
    });

  });

  afterEach(() => {
    mock.stopAll();
  });

  it('should load the watch config if watch command is given', (done) => {
    mock.reRequire('./pact.karma.conf')({
      set: (config) => {
        expect(config.pact).toBeDefined();
        expect(watchCalled).toEqual(true);
        done();
      },
      frameworks: ['jasmine'],
      files: [],
      plugins: ['awesome-typescript-loader']
    });
  });

  it('should load the test config if watch command is not given', (done) => {
    mock.stop('minimist');

    mock('minimist', () => {
      return {
        _: ['pact'],
        watch: false
      };
    });

    mock.reRequire('./pact.karma.conf')({
      set: (config) => {
        expect(config.pact).toBeDefined();
        expect(watchCalled).toEqual(false);
        done();
      },
      frameworks: [],
      files: [],
      plugins: []
    });
  });

  it('should add pact to frameworks', (done) => {
    mock.reRequire('./pact.karma.conf')({
      set: (config) => {
        expect(config.frameworks).toEqual(['jasmine', 'pact']);
        expect(watchCalled).toEqual(true);
        done();
      },
      frameworks: ['jasmine'],
      files: [],
      plugins: ['awesome-typescript-loader']
    });
  });

  it('should add karma-pact to plugins', (done) => {
    mock.reRequire('./pact.karma.conf')({
      set: (config) => {
        expect(config.plugins).toEqual(['awesome-typescript-loader', '@pact-foundation/karma-pact']);
        expect(watchCalled).toEqual(true);
        done();
      },
      frameworks: ['jasmine'],
      files: [],
      plugins: ['awesome-typescript-loader']
    });
  });

  it('should add pact-web.js to files', (done) => {
    mock.reRequire('./pact.karma.conf')({
      set: (config) => {
        const pactPath = path.resolve(
          process.cwd(),
          'node_modules/@pact-foundation/pact-web/pact-web.js'
        );
        expect(config.files.indexOf(pactPath)).not.toEqual(-1);
        expect(watchCalled).toEqual(true);
        done();
      },
      frameworks: ['jasmine'],
      files: [],
      plugins: ['awesome-typescript-loader']
    });
  });

  it('should log error in sky pages config does not contain pacts', (done) => {
    mock.stop('@skyux-sdk/builder/config/sky-pages/sky-pages.config');

    mock('@skyux-sdk/builder/config/sky-pages/sky-pages.config', {
      outPath: (path) => path,
      getSkyPagesConfig: () => {
        return {
          skyux: {
          },
          runtime: {
            pactConfig: {
            }
          }
        };
      }
    });

    spyOn(logger, 'error').and.returnValue();

    mock.reRequire('./pact.karma.conf')({
      set: (config) => {
        expect(config.pact).not.toBeDefined();
        expect(logger.error).toHaveBeenCalled();
        expect(watchCalled).toEqual(true);
        done();
      },
      frameworks: ['jasmine'],
      files: [],
      plugins: ['awesome-typescript-loader']
    });
  });

  it('should replace the spec-bundle preprocessor', (done) => {
    mock.stop(watchPath);

    mock(watchPath, (config) => {
      config.preprocessors = {
        'foobar/../../spec-bundle.js': ['my-preprocessor']
      };
      config.files = [
        {
          pattern: 'foobar/../../spec-bundle.js'
        },
        {
          pattern: 'baz/style-bundle.js'
        }
      ];
      return config;
    });

    const applyConfig = mock.reRequire('./pact.karma.conf');

    applyConfig({
      set: (config) => {
        const expectedSpecBundle = path.resolve(__dirname, '../utils/spec-bundle.js');
        expect(config.preprocessors).toEqual({
          [expectedSpecBundle]: ['my-preprocessor']
        });
        expect(config.files[0].pattern).toEqual(expectedSpecBundle);
        expect(config.files[1].pattern).toEqual('baz/style-bundle.js');
        done();
      },
      frameworks: [],
      files: [],
      plugins: []
    });
  });

  it('should ignore other preprocessors', (done) => {
    mock.stop(watchPath);

    mock(watchPath, (config) => {
      config.preprocessors = {
        'path.js': ['foobar']
      };
      return config;
    });

    const applyConfig = mock.reRequire('./pact.karma.conf');

    applyConfig({
      set: (config) => {
        expect(config.preprocessors).toEqual({
          'path.js': ['foobar']
        });
        done();
      },
      frameworks: [],
      files: [],
      plugins: []
    });
  });

  it('should remove coverage reporter', (done) => {
    mock.stop(testPath);

    const applyConfig = mock.reRequire('./pact.karma.conf');

    applyConfig({
      set: (config) => {
        expect(config.coverageIstanbulReporter).toBeUndefined();
        done();
      },
      frameworks: [],
      files: [],
      plugins: []
    });
  });

});
