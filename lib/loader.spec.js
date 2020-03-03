const mock = require('mock-require');

describe('loader', () => {

  afterEach(() => {
    mock.stopAll();
  });

  it('should add providers to the app-extras.module.ts file', () => {
    const loader = mock.reRequire('./loader');
    const content = '@NgModule({}) export class AppExtrasModule { }';
    const modified = loader.preload(content, 'app-extras.module.ts');

    expect(modified).toContain('import { SkyPactAuthTokenProvider, SkyPactService } from \'@skyux-sdk/pact\';');
    expect(modified).toContain('import { SkyAppConfig } from \'@skyux/config\';');
    expect(modified).toContain('import { SkyAuthTokenProvider } from \'@skyux/http\';');
    expect(modified).toContain('provide: SkyPactService');
    expect(modified).toContain('provide: SkyAuthTokenProvider');
    expect(modified).toContain('useClass: SkyPactAuthTokenProvider');
  });

  it('should create a providers property if none exists', () => {
    const loader = mock.reRequire('./loader');
    const content = '@NgModule({ imports: [] }) export class AppExtrasModule { }';
    const modified = loader.preload(content, 'app-extras.module.ts');

    expect(modified).toContain('providers: [');
  });

  it('should not overwrite existing providers', () => {
    const loader = mock.reRequire('./loader');
    const content = '@NgModule({ providers: [MyProvider] }) export class AppExtrasModule { }';
    const modified = loader.preload(content, 'app-extras.module.ts');

    expect(modified).toContain('MyProvider');
  });

  it('should add duplicate imports', () => {
    const loader = mock.reRequire('./loader');
    const content = `import { SkyAppConfig } from '@skyux/config';
@NgModule({})
export class AppExtrasModule { }`;
    const modified = loader.preload(content, 'app-extras.module.ts');

    expect(modified.match(/import { SkyAppConfig }/g).length).toEqual(1);
  });

  it('should not modify other files', () => {
    const loader = mock.reRequire('./loader');
    const content = '@NgModule({}) export class AppExtrasModule { }';
    const modified = loader.preload(content, 'foo.module.ts');
    expect(modified).toEqual(content);
  });

});