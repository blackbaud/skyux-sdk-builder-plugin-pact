const loader = require('./lib/loader');
const plugin = require('./lib/plugin');

function preload(content, resourcePath) {
  return loader.preload(content, resourcePath);
}

async function runCommand(command, argv) {
  if (command !== 'pact') {
    return false;
  }

  await plugin.pact(command, argv);

  return true;
}

module.exports = {
  preload,
  runCommand
};
