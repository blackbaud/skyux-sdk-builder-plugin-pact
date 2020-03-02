const logger = require('@blackbaud/skyux-logger');
const minimist = require('minimist');
const path = require('path');

/**
 * Requires the shared karma config and sets any local properties.
 * @name getConfig
 * @param {Object} config
 */
function getConfig(config) {

  const argv = minimist(process.argv.slice(2));

  require(`@skyux-sdk/builder/config/karma/${ argv.watch ? 'watch' : 'test' }.karma.conf`)(config);

  const skyPagesConfigUtil = require('@skyux-sdk/builder/config/sky-pages/sky-pages.config');
  const webpackConfig = require('@skyux-sdk/builder/config/webpack/test.webpack.config');
  const pactServers = require('../../src/pact-servers');

  const skyPagesConfig = skyPagesConfigUtil.getSkyPagesConfig(argv._[0]);

  skyPagesConfig.runtime.pactConfig = {
    providers: pactServers.getAllPactServers(),
    pactProxyServer: pactServers.getPactProxyServer()
  };

  const pacts = skyPagesConfig.skyux.pacts;
  if (pacts) {
    pacts.forEach(pact => {
      // set pact settings not specified in config file
      pact.log = pact.log || path.resolve(process.cwd(), 'logs', `pact-${pact.provider}.log`);
      pact.dir = pact.dir || path.resolve(process.cwd(), 'pacts');
      pact.host = pactServers.getPactServer(pact.provider).host;
      pact.port = pactServers.getPactServer(pact.provider).port;
      pact.pactFileWriteMode = pact.pactFileWriteMode || 'overwrite';
    });
  } else {
    logger.error('No pact entry in configuration!');
  }

  // Replace the spec-bundle so that it picks up `*.pact-spec.ts` files.
  const pactPattern = path.resolve(__dirname, '../../utils/spec-bundle.js');

  for (const pattern in config.preprocessors) {
    if (pattern.indexOf('spec-bundle.js') > -1) {
      config.preprocessors[pactPattern] = config.preprocessors[pattern];
      delete config.preprocessors[pattern];

      config.files.forEach(file => {
        if (file.pattern === pattern) {
          file.pattern = pactPattern;
        }
      });
    }
  }

  // Pact tests don't require code coverage.
  delete config.coverageIstanbulReporter;

  config.set({
    reporters: ['mocha'],
    frameworks: config.frameworks.concat('pact'),
    files: config.files.concat(path.resolve(
      process.cwd(),
      'node_modules/@pact-foundation/pact-web/pact-web.js'
    )),
    pact: pacts,
    plugins: config.plugins.concat('@pact-foundation/karma-pact'),
    webpack: webpackConfig.getWebpackConfig(skyPagesConfig, argv)
  });

}

module.exports = getConfig;
