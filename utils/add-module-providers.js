/**
 * Modify the `providers` array for AppExtrasModule.
 */
module.exports = function (content, providerConfigs) {

  const ngModuleMatches = content.match(/@NgModule\s*\([\s\S]+\)/g);

  let ngModuleSource = ngModuleMatches[0];

  const providersMatches = ngModuleSource.match(/(providers\s*:\s*\[[\s\S]*\])/g);

  let providersSource;
  if (providersMatches) {
    providersSource = providersMatches[0];
  } else {
    const ngModuleSourceStart = ngModuleSource.substr(0, ngModuleSource.indexOf('{') + 1);
    const ngModuleSourceEnd = ngModuleSource.substr(ngModuleSourceStart.length);
    const hasOtherModuleProps = ngModuleSourceEnd.replace(/\s/g, '') !== '})';

    providersSource = `\n  providers: []${hasOtherModuleProps ? ',' : '\n'}`;
    ngModuleSource = ngModuleSource.replace(ngModuleSourceStart, ngModuleSourceStart + providersSource);
  }

  // Apply any changes.
  const providersSourceStart = providersSource.substr(0, providersSource.indexOf('[') + 1);
  const providersSourceEnd = providersSource.substring(providersSourceStart.length, providersSource.indexOf(']') + 1);

  ngModuleSource = ngModuleSource.replace(
    providersSourceStart,
    providersSourceStart + `\n${providerConfigs.join(',\n')}${providersSourceEnd === ']' ? '\n  ' : ','}`
  );

  content = content.replace(ngModuleMatches[0], ngModuleSource);

};
