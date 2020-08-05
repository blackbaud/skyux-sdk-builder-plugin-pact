const pactServers = {};
let pactProxyServer = '';

/**
 * Utility to carry pact information determined in pact.js over into the pact.karma.conf.js
 */
module.exports = {

  /**
   * Saves the pact server object temporarily
   *
   * @param {} options
   */
  savePactServer: (options) => {
    pactServers[options.provider] = {
      host: options.host,
      port: options.port,
      fullUrl: `http://${options.host}:${options.port}`,
      pactOptions: options
    };
  },

  /**
   * Saves the url to the proxy server that manages requests to the pact servers
   *
   * @param {string} url - The url of the proxy server
   */
  savePactProxyServer: (url) => {
    pactProxyServer = url;
  },

  /**
   * Returns the url to the pact proxy server
   *
   * @returns {string} the url
   */
  getPactProxyServer: () => pactProxyServer,

  /**
   * Returns the pact object for the desired provider
   *
   * @param {string} providerName - The name of the provider
   */
  getPactServer: (providerName) => pactServers[providerName],

  /**
   * Returns all recorded pact objects
   *
   * @returns {Object} All recorded pact servers for test run
   */
  getAllPactServers: () => pactServers

};
