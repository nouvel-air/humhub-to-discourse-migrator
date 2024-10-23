const fetch = require('node-fetch');
const { promises: fsPromises } = require('fs');

module.exports = {
  settings: {
    source: {
      apiUrl: null,
      getAllFull: null,
      getAllCompact: null,
      getOneFull: null,
      headers: {
        Accept: 'application/json',
        'User-Agent': 'SemAppsImporter'
      },
      basicAuth: {
        user: '',
        password: ''
      },
      fetchOptions: {},
      fieldsMapping: {
        slug: null,
        created: null,
        updated: null
      }
    }
  },
  created() {
    if (this.settings.source.basicAuth.user) {
      this.settings.source.headers.Authorization = `Basic ${Buffer.from(
        `${this.settings.source.basicAuth.user}:${this.settings.source.basicAuth.password}`
      ).toString('base64')}`;
    }
  },
  actions: {
    async freshImport(ctx) {
      await this.prepare();

      if (this.settings.source.getAllCompact) {
        this.logger.info('Fetching compact list...');

        const compactResults = await this.list(this.settings.source.getAllCompact);

        if (compactResults) {
          this.logger.info(
            `Importing ${compactResults.length} items from ${
              typeof this.settings.source.getAllCompact === 'string'
                ? this.settings.source.getAllCompact
                : this.settings.source.getAllCompact.url
            }...`
          );

          for (const data of compactResults) {
            const sourceUri = this.settings.source.getOneFull(data);
            await this.actions.importOne({ sourceUri }, { parentCtx: ctx });
          }
        } else {
          throw new Error(
            `Error fetching the endpoint ${
              typeof this.settings.source.getAllCompact === 'string'
                ? this.settings.source.getAllCompact
                : this.settings.source.getAllCompact.url
            }...`
          );
        }
      } else if (this.settings.source.getAllFull) {
        this.logger.info('Fetching full list...');

        const fullResults = await this.list(this.settings.source.getAllFull);

        if (fullResults) {
          this.logger.info(
            `Importing ${fullResults.length} items from ${
              typeof this.settings.source.getAllFull === 'string'
                ? this.settings.source.getAllFull
                : this.settings.source.getAllFull.url
            }...`
          );

          for (const data of fullResults) {
            const sourceUri = this.settings.source.getOneFull && this.settings.source.getOneFull(data);
            await this.actions.importOne({ sourceUri, data }, { parentCtx: ctx });
          }
        } else {
          throw new Error(
            `Error fetching the endpoint ${
              typeof this.settings.source.getAllFull === 'string'
                ? this.settings.source.getAllFull
                : this.settings.source.getAllFull.url
            }...`
          );
        }
      } else {
        throw new Error('You must define the setting source.getAllCompact or source.getAllFull');
      }

      this.logger.info(`Import finished !`);
    },
    async importOne(ctx) {
      let { sourceUri, data } = ctx.params;

      if (!data) {
        data = await this.getOne(sourceUri);

        if (!data) {
          this.logger.warn(`Invalid ${sourceUri}...`);
          return false; // False = delete resource if it exists
        }
      }

      await this.migrate(data);
    },
    async list(ctx) {
      return await this.list(ctx.params.url || this.settings.source.getAllFull);
    },
    async getOne(ctx) {
      return await this.getOne(this.settings.source.getOneFull(ctx.params.data));
    }
  },
  methods: {
    async prepare() {
      // Things to do before processing data
    },
    async list(url) {
      return await this.fetch(url);
    },
    async getOne(url) {
      return await this.fetch(url);
    },
    async fetch(param) {
      if (typeof param === 'object') {
        const { url, ...fetchOptions } = param;
        const headers = {
          ...this.settings.source.headers,
          ...this.settings.source.fetchOptions.headers,
          ...fetchOptions.headers
        };
        const response = await fetch(url, { ...this.settings.source.fetchOptions, ...fetchOptions, headers });
        if (response.ok) {
          return await response.json();
        } else {
          console.log('fetch fail', response);
        }
        return false;
      } else if (param.startsWith('http')) {
        // Parameter is an URL
        const headers = { ...this.settings.source.headers, ...this.settings.source.fetchOptions.headers };
        const response = await fetch(param, { ...this.settings.source.fetchOptions, headers });
        if (response.ok) {
          return await response.json();
        } else {
          console.log('fetch fail', response);
        }
        return false;
      }
      // Parameter is a file
      try {
        const file = await fsPromises.readFile(param);
        return JSON.parse(file.toString());
      } catch (e) {
        this.logger.warn(`Could not read file ${param}`);
        return false;
      }
    },
    getField(fieldKey, data) {
      const fieldMapping = this.settings.source.fieldsMapping[fieldKey];
      if (fieldMapping) {
        return typeof fieldMapping === 'function' ? fieldMapping.bind(this)(data) : data[fieldMapping];
      }
    }
  }
};
