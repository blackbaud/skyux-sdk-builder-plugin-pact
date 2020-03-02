function setupProviders(content) {

  const addModuleProviders = require('../utils/add-module-providers');

  const importsMap = {
    'SkyPactService': `import { SkyPactAuthTokenProvider, SkyPactService } from '@skyux-sdk/pact';`,
    'SkyAppConfig': `import { SkyAppConfig } from '@skyux/config';`,
    'SkyAuthTokenProvider': `import { SkyAuthTokenProvider } from '@skyux/http';`
  };

  const imports = [];
  for (const k in importsMap) {
    if (content.indexOf(k) === -1) {
      imports.push(importsMap[k]);
    }
  }

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

  content = addModuleProviders(content, providerConfigs);
  content = `${imports.join('\n')}\n${content}`;

  return content;
}

module.exports = {
  setupProviders
};
