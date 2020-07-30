function preload(content, resourcePath) {
  if (/(\/|\\)runtime(\/|\\)auth-token.module.ts$/.test(resourcePath.toString()) === false) {
    return content;
  }

  return `
import { NgModule } from '@angular/core';
import { SkyPactModule } from '@skyux-sdk/pact';

@NgModule({
  imports: [SkyPactModule]
})
export class SkyAppAuthTokenModule { }
`;
}

module.exports = {
  preload
};
