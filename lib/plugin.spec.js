const logger = require('@blackbaud/skyux-logger');
const mock = require('mock-require');

describe('plugin', () => {

  const specPattern = 'src/app/**/*.pact-spec.ts';
  const testPath = '@skyux-sdk/builder/config/karma/test.karma.conf';
  const watchPath = '@skyux-sdk/builder/config/karma/watch.karma.conf';

  let getSkyPagesConfigSpy;
  let httpProxySpy;
  let httpSpy;
  let portfinderSpy;
  let karmaUtilsSpy;
  let tsLinterSpy;
  let pactServers;

  beforeEach(() => {
    pactServers = mock.reRequire('./utils/pact-servers');

    spyOn(logger, 'info');
    spyOn(logger, 'error');
    spyOn(process, 'exit');

    mock(testPath, () => {});
    mock(watchPath, () => {});

    mock('./config/karma/pact.karma.conf', () => {});

    getSkyPagesConfigSpy = jasmine.createSpy('getSkyPagesConfig');
    getSkyPagesConfigSpy.and.returnValue({
      skyux: {
        pacts: [
          {
            provider: 'test-provider1',
            consumer: 'test-consumer1',
            spec: 1
          }
        ]
      }
    });
    mock('@skyux-sdk/builder/config/sky-pages/sky-pages.config', {
      outPath: (path) => path,
      getSkyPagesConfig: getSkyPagesConfigSpy
    });

    tsLinterSpy = jasmine.createSpyObj('tslinter', ['lintSync']);
    tsLinterSpy.lintSync.and.returnValue({
      exitCode: 0
    });
    mock('@skyux-sdk/builder/cli/utils/ts-linter', tsLinterSpy);

    portfinderSpy = jasmine.createSpyObj('portfinder', ['getPorts']);
    portfinderSpy.getPorts.and.callFake((count, options, cb) => {
      cb(undefined, [0]);
    });
    mock('portfinder', portfinderSpy);

    karmaUtilsSpy = jasmine.createSpyObj('karmaUtils', ['run']);
    karmaUtilsSpy.run.and.returnValue(Promise.resolve());
    mock('./utils/karma-utils', karmaUtilsSpy);

    httpProxySpy = jasmine.createSpyObj('http-proxy', ['createProxyServer']);
    httpProxySpy.createProxyServer.and.returnValue({
      on: () => {},
      web: () => {}
    });
    mock('http-proxy', httpProxySpy);

    httpSpy = jasmine.createSpyObj('http', ['createServer']);
    httpSpy.createServer.and.returnValue({
      on: () => {},
      listen: () => {}
    });
    mock('http', httpSpy);
  });

  afterEach(() => {
    mock.stopAll();
  });

  it('should log an error if no pacts in config', async () => {
    getSkyPagesConfigSpy.and.returnValue({
      skyux: {}
    });

    const plugin = mock.reRequire('./plugin');

    await plugin.pact('', {});

    expect(logger.error).toHaveBeenCalledWith(
      'skyux pact failed! pacts does not exist on configuration file.'
    );
  });

  it('exit if portfinder returns error', async (done) => {
    const error = 'custom-portfinder-error';

    portfinderSpy.getPorts.and.callFake((count, options, cb) => {
      cb(error);
      expect(logger.error).toHaveBeenCalledWith(error);
      expect(process.exit).toHaveBeenCalled();
      done();
    });

    const plugin = mock.reRequire('./plugin');

    await plugin.pact('', {});
  });

  it('should support a custom host and custom port', async (done) => {
    const pacts = [
      {
        provider: 'test-provider1',
        consumer: 'test-consumer1',
        host: 'custom-host',
        spec: 1
      },
      {
        provider: 'test-provider2',
        consumer: 'test-consumer2',
        port: 'custom-port',
        spec: 2
      }
    ];

    getSkyPagesConfigSpy.and.returnValue({
      skyux: {
        pacts
      }
    });

    spyOn(pactServers, 'savePactServer');

    portfinderSpy.getPorts.and.callFake((count, options, cb) => {
      const ports = pacts.map((pact, index) => 8000 + index );
      cb(undefined, ports);

      expect(count).toBe(pacts.length + 1);
      expect(pactServers.savePactServer).toHaveBeenCalledWith(
        pacts[0].provider,
        'custom-host',
        ports[0]
      );
      expect(pactServers.savePactServer).toHaveBeenCalledWith(
        pacts[1].provider,
        'localhost',
        pacts[1].port
      );
      done();
    });

    const plugin = mock.reRequire('./plugin');

    await plugin.pact('', {});
  });

  async function testOriginHeader(expectedOrigin, done) {
    const ports = [8000, 8001];
    const origin = 'custom-origin';
    const httpProxyOn = {};
    const httpOn = {};
    const headers = {};
    const setHeaderSpy = jasmine.createSpy('setHeader');

    httpProxySpy.createProxyServer.and.returnValue({
      on: (evt, cb) => httpProxyOn[evt] = cb
    });

    httpSpy.createServer.and.returnValue({
      on: (evt, cb) => httpOn[evt] = cb,
      listen: (port) => {
        httpProxyOn['proxyReq']({
          setHeader: setHeaderSpy
        });

        httpProxyOn['proxyRes'](
          {
            headers
          },
          {
            headers: {
              origin
            }
          }
        );

        expect(port).toBe(ports[1]);
        expect(headers['Access-Control-Allow-Origin']).toBe(origin);
        expect(setHeaderSpy).toHaveBeenCalledWith('Origin', expectedOrigin);
        done();
      }
    });

    portfinderSpy.getPorts.and.callFake((count, options, cb) => {
      cb(undefined, ports);
    });

    const plugin = mock.reRequire('./plugin');

    await plugin.pact('', {});
  }

  it('sets headers upon request and response on proxy server', async (done) => {
    await testOriginHeader('https://host.nxt.blackbaud.com', done);
  });

  it('sets custom headers upon request and response on proxy server', async (done) => {
    const url = 'custom-url';

    getSkyPagesConfigSpy.and.returnValue({
      skyux: {
        pacts: [
          {
            provider: 'test-provider1',
            consumer: 'test-consumer1',
            spec: 1
          }
        ],
        host: {
          url
        }
      }
    });

    await testOriginHeader(url, done);
  });

  it('gets correct pact server before call to proxy server', async (done) => {
    const providerFullUrl = 'full-url';
    const req = {
      url: 'base/provider-that-does-exist/endpoint'
    };
    const res = {
      custom: true
    };

    spyOn(pactServers, 'getAllPactServers').and.returnValue({
      'provider-that-does-exist': true
    });
    spyOn(pactServers, 'getPactServer').and.returnValue({
      fullUrl: providerFullUrl
    });

    httpProxySpy.createProxyServer.and.returnValue({
      on: () => {},
      web: (webReq, webRes, options) => {
        expect(webReq).toEqual(req);
        expect(webRes).toEqual(res);
        expect(options).toEqual({
          target: providerFullUrl
        });
        done();
      }
    });

    httpSpy.createServer.and.callFake(cb => {
      cb(req, res);
      return {
        on: () => {},
        listen: () => {}
      };
    });

    const plugin = mock.reRequire('./plugin');

    await plugin.pact('', {});
  });

  it('logs error when malformed proxy url is requested', async (done) => {
    spyOn(pactServers, 'getAllPactServers').and.returnValue({
      'provider-that-does-not-exist': false
    });

    httpSpy.createServer.and.callFake(cb => {
      const req = {
        url: 'bad-url'
      };

      cb(req, {});
      return {
        on: () => {},
        listen: () => {
          expect(logger.error).toHaveBeenCalledWith(
            'Pact proxy path is invalid. Expected format is base/provider-name/api-path.'
          );
          done();
        }
      };
    });

    const plugin = mock.reRequire('./plugin');

    await plugin.pact('', {});
  });

  it('logs when proxy server is successfully started', async () => {
    const ports = [8000];
    const httpOn = {};

    httpSpy.createServer.and.returnValue({
      on: (evt, cb) => httpOn[evt] = cb,
      listen: () => {}
    });

    portfinderSpy.getPorts.and.callFake((count, options, cb) => {
      cb(undefined, ports);
    });

    const plugin = mock.reRequire('./plugin');

    await plugin.pact('', {});

    httpOn['connect']();

    expect(logger.info).toHaveBeenCalledWith(
      `Pact proxy server successfully started on http://localhost:${ports[ports.length - 1]}`
    );
  });

  it('should pass command, argv, and specPattern to karmaUtils.run', async (done) => {
    const argv = { custom: true };
    const command = 'custom-command1';
    const tsLinterExitCode = 3;

    tsLinterSpy.lintSync.and.returnValue({
      exitCode: tsLinterExitCode
    });

    process.exit.and.callFake(exitCode => {
      expect(exitCode).toBe(0 || tsLinterExitCode);
      expect(karmaUtilsSpy.run.calls.argsFor(0)[1].command).toBe(command);
      expect(karmaUtilsSpy.run).toHaveBeenCalledWith(
        command,
        argv,
        specPattern
      );
      done();
    });

    const plugin = mock.reRequire('./plugin');

    await plugin.pact(command, argv);
  });

  it('should use process.argv if no arguments passed in', async () => {
    const argvClean = process.argv;
    const argv = { process: true };
    const command = 'custom-command2';

    process.argv = argv;

    const plugin = mock.reRequire('./plugin');

    await plugin.pact(command);

    expect(karmaUtilsSpy.run).toHaveBeenCalledWith(
      command,
      argv,
      specPattern
    );

    process.argv = argvClean;
  });

});
