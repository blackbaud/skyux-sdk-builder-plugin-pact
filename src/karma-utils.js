// const logger = require('@blackbaud/skyux-logger');
// const Server = require('karma').Server;
// const karmaConfigUtil = require('karma').config;
// const karmaLogger = require('karma/lib/logger');
// const path = require('path');
// const glob = require('glob');
// const tsLinter = require('./ts-linter');
// const configResolver = require('./config-resolver');
// const localeAssetsProcessor = require('../../lib/locale-assets-processor');

// function run(command, argv, specsPattern) {

//   // Karma calls this when the config class is internally instantiated.
//   // We must call it manually before calling parseConfig.  If not,
//   // the logLevel will default to LOG_DISABLED, meaning no parsing errors are shown.
//   // This method interally sets it to LOG_INFO.
//   karmaLogger.setupFromConfig({});

//   const karmaConfigPath = configResolver.resolve(command, argv);
//   const karmaConfig = karmaConfigUtil.parseConfig(karmaConfigPath);
//   const specsPath = path.resolve(process.cwd(), specsPattern);
//   const specsGlob = glob.sync(specsPath);

//   let tsLinterLastExitCode = 0;
//   let tsLinterQueue = [];

//   return new Promise(resolve => {

//     // Short-circuit running Karma if there are no spec files
//     if (specsGlob.length === 0) {
//       logger.info(`No spec files located. Skipping ${command} command.`);
//       return resolve(0);
//     }

//     const server = new Server(karmaConfig, exitCode => {
//       if (exitCode === 0 && tsLinterLastExitCode !== 0) {
//         exitCode = tsLinterLastExitCode;
//       }

//       logger.info(`Karma has exited with ${exitCode}.`);
//       resolve(exitCode);
//     });

//     server.on('run_start', () => {
//       localeAssetsProcessor.prepareLocaleFiles();
//     });

//     server.on('browser_error', () => {
//       logger.warn('Experienced a browser disconnect error.  Karma will retry up to 3 times.');
//     });

//     server.start(argv);
//   });
// }

// module.exports = {
//   run
// };

const logger = require('@blackbaud/skyux-logger');
const configResolver = require('@skyux-sdk/builder/cli/utils/config-resolver');

const glob = require('glob');

const Server = require('karma').Server;
const karmaConfigUtil = require('karma').config;
const karmaLogger = require('karma/lib/logger');

const path = require('path');


function run(command, argv, specsPattern) {
  // Karma calls this when the config class is internally instantiated.
  // We must call it manually before calling parseConfig.  If not,
  // the logLevel will default to LOG_DISABLED, meaning no parsing errors are shown.
  // This method interally sets it to LOG_INFO.
  karmaLogger.setupFromConfig({});

  const karmaConfigPath = path.resolve(__dirname, '../config/karma/pact.karma.conf.js');
  const karmaConfig = karmaConfigUtil.parseConfig(karmaConfigPath);
  const specsPath = path.resolve(process.cwd(), specsPattern);
  const specsGlob = glob.sync(specsPath);

  let tsLinterLastExitCode = 0;

  return new Promise(resolve => {

    // Short-circuit running Karma if there are no spec files
    if (specsGlob.length === 0) {
      logger.info(`No spec files located. Skipping ${command} command.`);
      return resolve(0);
    }

    const server = new Server(karmaConfig, exitCode => {
      if (exitCode === 0 && tsLinterLastExitCode !== 0) {
        exitCode = tsLinterLastExitCode;
      }

      logger.info(`Karma has exited with ${exitCode}.`);
      resolve(exitCode);
    });

    server.on('run_start', () => {
      // localeAssetsProcessor.prepareLocaleFiles();
    });

    server.on('browser_error', () => {
      logger.warn('Experienced a browser disconnect error.  Karma will retry up to 3 times.');
    });

    server.start(argv);
  });
}

module.exports = {
  run
};
