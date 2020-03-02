function preload(content, resourcePath) {
  console.log('Resource path:', resourcePath);
  return content;
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
