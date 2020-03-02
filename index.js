function preload(content, resourcePath) {
  console.log('Resource path:', resourcePath);
  return content;
}

async function runCommand(command) {
  if (command === 'pact') {
    console.log('Running Pact command.');
    await setTimeout(() => {}, 1000);
    return true;
  }

  return false;
}

module.exports = {
  preload,
  runCommand
};
