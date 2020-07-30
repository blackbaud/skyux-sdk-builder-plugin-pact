function preload(content, resourcePath) {
  if (/(\/|\\)runtime(\/|\\)auth-token.module.ts$/.test(resourcePath.toString()) === false) {
    return content;
  }

  return `
import { NgModule } from '@angular/core';
import { SkyPactAuthTokenProvider, SkyPactService } from '@skyux-sdk/pact';
import { SkyAppConfig } from '@skyux/config';
import { SkyAuthTokenProvider } from '@skyux/http';

@NgModule({
  providers: [
    {
      provide: SkyPactService,
      useClass: SkyPactService,
      deps: [SkyAppConfig]
    },
    {
      provide: SkyAuthTokenProvider,
      useClass: SkyPactAuthTokenProvider
    }
  ]
})
export class SkyAppAuthTokenModule { }
`;
}

module.exports = {
  preload
};
