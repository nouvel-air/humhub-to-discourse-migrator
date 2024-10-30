const urlJoin = require('url-join');
const HumHubImporterMixin = require('./mixins/humhub');
const SpaceManagerMixin = require('./mixins/space-manager');
const DiscourseMixin = require('./mixins/discourse');
const CONFIG = require('../config');
const { formatMessage, displayNameToUserName, convertToIsoString } = require('../utils');

module.exports = {
  name: 'wiki',
  mixins: [SpaceManagerMixin, HumHubImporterMixin, DiscourseMixin],
  settings: {
    source: {
      humhub: {
        baseUrl: CONFIG.HUMHUB_URL,
        jwtToken: CONFIG.HUMHUB_TOKEN,
        type: 'wiki'
      }
    }
  },
  methods: {
    async migrate(data) {
      console.log('data', data.title);

      // Only import wiki resources from "Salle commune" space
      const space = this.getSpaceByContainerId(data.content.metadata.contentcontainer_id);
      if (!space || space.id !== 18) return false;

      const username = displayNameToUserName(data.content.metadata.created_by.display_name);

      await this.fetchDiscourse(`/posts.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Api-Username': username
        },
        body: JSON.stringify({
          title: data.title,
          raw: formatMessage(data.latest_revision?.content),
          category: 20, // Ressources pédagogiques
          created_at: convertToIsoString(data.content.metadata?.created_at),
          wiki: true
        })
      });
    }
  }
};
