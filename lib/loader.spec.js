const mock = require('mock-require');

describe('loader', () => {

  afterEach(() => {
    mock.stopAll();
  });

  it('should add SkyPactModule to /runtime/auth-token.module.ts file', () => {
    const loader = mock.reRequire('./loader');
    const content = '@NgModule({}) export class SkyAppAuthTokenModule { }';
    const modified = loader.preload(content, '/runtime/auth-token.module.ts');

    expect(modified).toContain('import { SkyPactModule } from \'@skyux-sdk/pact\';');
    expect(modified).toContain('imports: [SkyPactModule]');
  });

  it('should not modify other files', () => {
    const loader = mock.reRequire('./loader');
    const content = '@NgModule({}) export class SkyAppAuthTokenModule { }';
    const modified = loader.preload(content, 'foo.module.ts');
    expect(modified).toEqual(content);
  });

});