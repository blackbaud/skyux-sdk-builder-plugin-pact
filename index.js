function preload(content, resourcePath) {
  if (resourcePath.indexOf('app-extras.module.ts') === -1) {
    return content;
  }

  const pactProviders = require('./src/pact-providers');
  return pactProviders.setupProviders(content.toString());
}

async function runCommand(command, argv) {
  if (command !== 'pact') {
    return false;
  }

  const pact = require('./src/pact');
  await pact(command, argv);

  return true;
}

module.exports = {
  preload,
  runCommand
};
