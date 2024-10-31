const urlJoin = require('url-join');
const CONFIG = require('../../config');

const delay = async t => new Promise(resolve => setTimeout(resolve, t));

module.exports = {
  settings: {
    discourse: {
      url: CONFIG.DISCOURSE_URL,
      apiKey: CONFIG.DISCOURSE_API_KEY
    }
  },
  methods: {
    async fetchDiscourse(path, options = {}) {
      try {
        let headers = {
          'Api-Key': this.settings.discourse.apiKey,
          'Api-Username': 'system'
        };
        if (options.headers) headers = { ...headers, ...options.headers };
        const response = await fetch(urlJoin(this.settings.discourse.url, path), { ...options, headers });
        if (response.ok) {
          try {
            return await response.json();
          } catch (e) {
            return true;
          }
        } else {
          if (response.status === 429) {
            const body = await response.text();
            this.logger.warn(`Rate limit hit for ${path}. Error: ${body}. Waiting 5s before retry...`);
            await delay(5000);
            return await this.fetchDiscourse(path, options);
          } else if (response.status === 422) {
            const json = await response.json();
            this.logger.warn(
              `Could not ${options.method || 'GET'} ${path} with body ${options.body}. Errors: ${json.errors.join(
                ' / '
              )}`
            );
          } else {
            this.logger.warn(
              `Could not ${options.method || 'GET'} ${path} with body ${options.body}. Response status: ${
                response.status
              } ${response.statusText}`
            );
          }
        }
        return false;
      } catch (e) {
        this.logger.warn(
          `Could not ${options.method || 'GET'} ${path} with body ${options.body}. Error message: ${e.message}`
        );
        return false;
      }
    }
  }
};
