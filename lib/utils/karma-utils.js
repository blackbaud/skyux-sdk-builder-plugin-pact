const logger = require('@blackbaud/skyux-logger');
const glob = require('glob');
const karma = require('karma');
const karmaLogger = require('karma/lib/logger');
const path = require('path');

function run(command, argv, specsPattern) {

  // Karma calls this when the config class is internally instantiated.
  // We must call it manually before calling parseConfig. If not,
  // the logLevel will default to LOG_DISABLED, meaning no parsing errors are shown.
  // This method interally sets it to LOG_INFO.
  karmaLogger.setupFromConfig({});

  const karmaConfigPath = path.resolve(__dirname, '../config/karma/pact.karma.conf.js');
  const karmaConfig = karma.config.parseConfig(karmaConfigPath);
  const specsPath = path.resolve(process.cwd(), specsPattern);
  const specsGlob = glob.sync(specsPath);

  return new Promise(resolve => {
    if (specsGlob.length === 0) {
      logger.info(`No spec files located. Skipping ${command} command.`);
      return resolve(0);
    }

    const server = new karma.Server(karmaConfig, exitCode => {
      logger.info(`Karma has exited with ${exitCode}.`);
      resolve(exitCode);
    });

    server.start(argv);
  });
}

module.exports = {
  run
};
