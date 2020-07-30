const mock = require('mock-require');

describe('loader', () => {

  afterEach(() => {
    mock.stopAll();
  });

  it('should add providers to the /runtime/auth-token.module.ts file', () => {
    const loader = mock.reRequire('./loader');
    const content = '@NgModule({}) export class AppExtrasModule { }';
    const modified = loader.preload(content, '/runtime/auth-token.module.ts');

    expect(modified).toContain('import { SkyPactAuthTokenProvider, SkyPactService } from \'@skyux-sdk/pact\';');
    expect(modified).toContain('import { SkyAppConfig } from \'@skyux/config\';');
    expect(modified).toContain('import { SkyAuthTokenProvider } from \'@skyux/http\';');
    expect(modified).toContain('provide: SkyPactService');
    expect(modified).toContain('provide: SkyAuthTokenProvider');
    expect(modified).toContain('useClass: SkyPactAuthTokenProvider');
  });

  it('should not modify other files', () => {
    const loader = mock.reRequire('./loader');
    const content = '@NgModule({}) export class AppExtrasModule { }';
    const modified = loader.preload(content, 'foo.module.ts');
    expect(modified).toEqual(content);
  });

});