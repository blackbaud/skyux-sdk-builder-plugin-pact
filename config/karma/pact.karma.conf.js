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

  const newPreprocessors = {};
  Object.keys(config.preprocessors).find((fileName) => {
    if (fileName.indexOf('spec-bundle.js') > -1) {

      const oldPreprocessors = config.preprocessors[fileName];
      const newFileName = path.resolve(__dirname, '../../utils/spec-bundle.js');

      newPreprocessors[newFileName] = oldPreprocessors;

      config.files.forEach(file => {
        if (file.pattern === fileName) {
          file.pattern = newFileName;
        }
      });

    } else {
      newPreprocessors[fileName] = config.preprocessors[fileName];
    }
  });

  delete config.preprocessors;

  config.set({
    preprocessors: newPreprocessors,
    coverageIstanbulReporter: undefined,
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
