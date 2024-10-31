const urlJoin = require('url-join');
const ImporterMixin = require('./importer');
const { convertToIsoString } = require('../../utils');

const allowedTypes = ['user', 'space', 'calendar', 'post', 'wiki'];

const getSlugByUrl = url => {
  if (url) {
    const splitUrl = url.split('/');
    let slug = splitUrl.pop();
    // If slug is empty, there was an ending slash
    if (!slug) slug = splitUrl.pop();
    return slug;
  }
};

module.exports = {
  mixins: [ImporterMixin],
  settings: {
    source: {
      humhub: {
        baseUrl: null,
        jwtToken: null,
        type: null, // 'user', 'space', 'calendar', 'post', 'wiki'
        containerId: null
      },
      fieldsMapping: {
        // We don't use arrow function as we need to have access to this.settings
        slug: function (data) {
          switch (this.settings.source.humhub.type) {
            case 'user':
            case 'space':
              return getSlugByUrl(data.url);
            case 'calendar':
            case 'post':
              return data.content.metadata.guid;
          }
        },
        created: function (data) {
          switch (this.settings.source.humhub.type) {
            case 'calendar':
            case 'post':
              return convertToIsoString(data.content.metadata.created_at);
          }
        },
        updated: function (data) {
          switch (this.settings.source.humhub.type) {
            case 'calendar':
            case 'post':
              return convertToIsoString(data.content.metadata.updated_at);
          }
        }
      }
    }
  },
  created() {
    const { baseUrl, jwtToken, type, containerId } = this.settings.source.humhub;

    if (!jwtToken) throw new Error('The source.humhub.jwtSettings setting is missing');
    if (!allowedTypes.includes(type))
      throw new Error(`Only the following types are allowed: ${allowedTypes.join(', ')}`);

    this.settings.source.headers.Authorization = `Bearer ${jwtToken}`;

    let apiPath;
    if (type === 'post' && containerId) {
      apiPath = `/api/v1/post/container/${containerId}`;
    } else {
      apiPath = `/api/v1/${type}`;
    }

    this.settings.source.apiUrl = urlJoin(baseUrl, apiPath);
    this.settings.source.getAllFull = this.settings.source.apiUrl;

    if (type === 'calendar') {
      this.settings.source.getOneFull = data => `${this.settings.source.apiUrl}/entry/${data.id}`;
    } else {
      this.settings.source.getOneFull = data => `${this.settings.source.apiUrl}/${data.id}`;
    }
  },
  methods: {
    async list(url) {
      let results;
      const data = [];
      let page = 0;

      do {
        page++;
        results = await this.fetch(`${url}?per-page=100&page=${page}`);
        data.push(...results.results);
      } while (results.links.next);

      // Append the members to the result
      // if (this.settings.source.humhub.type === 'space') {
      //   for (const key of data.keys()) {
      //     let page = 0,
      //       members;
      //     data[key].members = [];
      //     do {
      //       page = page + 1;
      //       this.logger.info('Fetching page ' + page, urlJoin(url, `${data[key].id}`, 'membership') + `?page=${page}`);
      //       // TODO use the list method but avoid a loop ? Maybe set another importer for memberships
      //       // Currently if there is more than 100 members, it will fail to get them all
      //       members = await this.fetch(urlJoin(url, `${data[key].id}`, 'membership') + `?page=${page}`);
      //       data[key].members = [...data[key].members, ...members.results];
      //     } while (members.pages > page);
      //   }
      // }

      return data;
    },
    async getOne(url) {
      const results = await this.fetch(url);

      // Append the members to the result
      // if (this.settings.source.humhub.type === 'space' && results) {
      //   let page = 0,
      //     members;
      //   results.members = [];
      //   do {
      //     page = page + 1;
      //     this.logger.info('Fetching page ' + page, urlJoin(url, 'membership') + `?page=${page}`);
      //     // TODO use the list method but avoid a loop ? Maybe set another importer for memberships
      //     // Currently if there is more than 100 members, it will fail to get them all
      //     members = await this.fetch(urlJoin(url, 'membership') + `?page=${page}`);
      //     results.members = [...results.members, ...members.results];
      //   } while (members.pages > page);
      // }

      return results;
    },
    async getComments(objectId, objectModel) {
      const comments = await this.fetch(
        urlJoin(this.settings.source.humhub.baseUrl, 'api/v1/comment/find-by-object') +
          `?objectModel=${objectModel}&objectId=${objectId}`
      );
      return comments.results;
    }
  }
};
