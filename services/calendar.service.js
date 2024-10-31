const HumHubImporterMixin = require('./mixins/humhub');
const SpaceManagerMixin = require('./mixins/space-manager');
const DiscourseMixin = require('./mixins/discourse');
const PostFormatterMixin = require('./mixins/post-formatter');
const CONFIG = require('../config');
const { convertToIsoString, displayNameToUserName } = require('../utils');
const { categoriesMapping } = require('../mappings');

module.exports = {
  name: 'calendar',
  mixins: [SpaceManagerMixin, HumHubImporterMixin, DiscourseMixin, PostFormatterMixin],
  settings: {
    source: {
      humhub: {
        baseUrl: CONFIG.HUMHUB_URL,
        jwtToken: CONFIG.HUMHUB_TOKEN,
        type: 'calendar'
      }
    }
  },
  methods: {
    async migrate(data) {
      const space = this.getSpaceByContainerId(data.content.metadata.contentcontainer_id);
      const username = displayNameToUserName(data.content.metadata.created_by.display_name);

      const message = await this.formatMessage(data.description, data.content.files);

      // prettier-ignore
      const eventTag = `[event start="${data.start_datetime.slice(0, -3)}" end="${data.end_datetime.slice(0,-3)}" status="public" name="${data.title}" timezone="Europe/Paris"]\n[/event]`;

      this.logger.info(`Importing event "${data.title}"...`);

      const post = await this.fetchDiscourse(`/posts.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Api-Username': username
        },
        body: JSON.stringify({
          title: data.title,
          raw: eventTag + '\n\n' + message,
          category: categoriesMapping[space.id],
          created_at: convertToIsoString(data.content.metadata.created_at)
          // external_id: data.content.metadata.guid
        })
      });

      if (post) {
        const comments = await this.getComments(data.id, 'humhub%5Cmodules%5Ccalendar%5Cmodels%5CCalendarEntry');

        if (comments) {
          this.logger.info(`Importing ${comments.length} comments...`);

          for (const comment of comments) {
            await this.postComment(post.topic_id, comment);
          }
        } else {
          this.logger.warn(`Could not fetch comments for topic "${matches[1]}"`);
        }
      }
    }
  }
};
