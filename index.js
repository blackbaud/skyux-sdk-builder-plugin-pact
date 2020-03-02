function preload(content, resourcePath) {
  if (resourcePath.indexOf('app-extras.module.ts') === -1) {
    return content;
  }

  let modified = content.toString();

  const imports = `import { SkyPactAuthTokenProvider, SkyPactService } from '@skyux-sdk/pact';`;

  const providerConfigs = [
    `{
      provide: SkyPactService,
      useClass: SkyPactService,
      deps: [SkyAppConfig]
    }`,
    `{
      provide: SkyAuthTokenProvider,
      useClass: SkyPactAuthTokenProvider
    }`
  ];

  // Modify the `providers` array for AppExtrasModule.
  const ngModuleMatches = modified.match(/@NgModule\s*\([\s\S]+\)/g);
  let ngModuleSource = ngModuleMatches[0];
  const providersMatches = ngModuleSource.match(/(providers\s*:\s*\[[\s\S]*\])/g);
  let providersSource;
  if (providersMatches) {
    providersSource = providersMatches[0];
  } else {
    const ngModuleSourceStart = ngModuleSource.substr(0, ngModuleSource.indexOf('{') + 1);
    const ngModuleSourceEnd = ngModuleSource.substr(ngModuleSourceStart.length);
    const hasOtherModuleProps = ngModuleSourceEnd.replace(/\s/g, '') !== '})';
    providersSource = `
  providers: []${hasOtherModuleProps ? ',' : '\n'}`;
    ngModuleSource = ngModuleSource.replace(ngModuleSourceStart, ngModuleSourceStart + providersSource);
  }

  // Apply any changes.
  const providersSourceStart = providersSource.substr(0, providersSource.indexOf('[') + 1);
  const providersSourceEnd = providersSource.substring(providersSourceStart.length, providersSource.indexOf(']') + 1);
  ngModuleSource = ngModuleSource.replace(
    providersSourceStart,
    providersSourceStart + `
${providerConfigs.join(',\n')}${providersSourceEnd === ']' ? '\n  ' : ','}`
  );
  modified = modified.replace(ngModuleMatches[0], ngModuleSource);

  modified = `${imports}\n` + modified;

  return modified;
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
