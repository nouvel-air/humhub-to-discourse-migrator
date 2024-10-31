const HumHubImporterMixin = require('./mixins/humhub');
const SpaceManagerMixin = require('./mixins/space-manager');
const DiscourseMixin = require('./mixins/discourse');
const PostFormatterMixin = require('./mixins/post-formatter');
const CONFIG = require('../config');
const { displayNameToUserName, convertToIsoString } = require('../utils');

module.exports = {
  name: 'wiki',
  mixins: [SpaceManagerMixin, HumHubImporterMixin, DiscourseMixin, PostFormatterMixin],
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
      // Only import wiki resources from "Salle commune" space
      const space = this.getSpaceByContainerId(data.content.metadata.contentcontainer_id);
      if (!space || space.id !== 18) return false;

      const username = displayNameToUserName(data.content.metadata.created_by.display_name);

      const message = await this.formatMessage(data.latest_revision?.content, data.content.files);

      const post = await this.fetchDiscourse(`/posts.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Api-Username': username
        },
        body: JSON.stringify({
          title: data.title,
          raw: message,
          category: 20, // Ressources pédagogiques
          created_at: convertToIsoString(data.content.metadata?.created_at),
          wiki: true
        })
      });

      if (post) {
        const comments = await this.getComments(data.id, `humhub%5Cmodules%5Cwiki%5Cmodels%5CWikiPage`);

        this.logger.info(`Importing ${comments.length} comments...`);

        for (const comment of comments) {
          await this.postComment(post.topic_id, comment);
        }
      }
    }
  }
};
