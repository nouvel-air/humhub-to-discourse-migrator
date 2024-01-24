const urlJoin = require("url-join");
// const fetch = require('node-fetch');
const CONFIG = require('../../config');

module.exports = {
  settings: {
    discourse: {
      url: CONFIG.DISCOURSE_URL,
      apiKey: CONFIG.DISCOURSE_API_KEY
    }
  },
  methods: {
    async fetchDiscourse(path, options = {}) {
      let headers = {
        'Api-Key': this.settings.discourse.apiKey,
        'Api-Username': 'system'
      };
      if (options.headers) headers = { ...headers, ...options.headers }
      const response = await fetch(urlJoin(this.settings.discourse.url, path), { ...options, headers });
      if (response.ok) {
        return await response.json();
      } else {
        this.logger.warn(`Could not fetch ${path}`);
      }
      return false;
    }
  }
}