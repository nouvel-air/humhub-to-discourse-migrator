const HumHubImporterMixin = require('./mixins/humhub');
const SpaceManagerMixin = require('./mixins/space-manager');
const DiscourseMixin = require('./mixins/discourse');
const PostFormatterMixin = require('./mixins/post-formatter');
const CONFIG = require('../config');
const { convertToIsoString, displayNameToUserName } = require('../utils');
const { categoriesMapping } = require('../mappings');

module.exports = {
  name: 'post',
  mixins: [SpaceManagerMixin, HumHubImporterMixin, DiscourseMixin, PostFormatterMixin],
  settings: {
    source: {
      humhub: {
        baseUrl: CONFIG.HUMHUB_URL,
        jwtToken: CONFIG.HUMHUB_TOKEN,
        type: 'post'
        // containerId: 773
      }
    }
  },
  actions: {
    async cleanAllTopics(ctx) {
      const { cat } = ctx.params;

      for (const categoryId of cat ? [cat] : Object.values(categoriesMapping)) {
        this.logger.info(`Cleaning topics in category ${categoryId}...`);

        const category = await this.fetchDiscourse(`/c/${categoryId}/show.json`, {
          headers: {
            'Content-Type': 'application/json'
          }
        });

        const numPages = Math.floor(category.category.topic_count / 30);

        for (let page = numPages; page >= 0; page--) {
          const topics = await this.fetchDiscourse(`/c/${categoryId}/l/latest.json?page=${page}`, {
            headers: {
              'Content-Type': 'application/json'
            }
          });

          if (topics) {
            for (const topic of topics.topic_list?.topics) {
              this.logger.info(`Deleting topic ${topic.id}...`);

              await this.fetchDiscourse(`/t/${topic.id}.json`, {
                method: 'DELETE'
              });
            }
          }
        }
      }
    },
    async testUpload(ctx) {
      const message = `Quand tu notifies, tu as un récapitulatif qui t’es envoyé par mail. Là on voit qu’il y a 2 personnes dont le mail a été rejeté, c’est en général quand ça tombe dans les spams de la personne.![2024-03-14 11-21 - Capture d'écran.png](file-guid:f758e626-6c8e-4e38-9c7c-5b48db35035b "2024-03-14 11-21 - Capture d'écran.png")`;

      const formattedMessage = await this.formatMessage(message, [
        {
          id: 4468,
          guid: 'f758e626-6c8e-4e38-9c7c-5b48db35035b',
          mime_type: 'image/png',
          size: '111835',
          file_name: "2024-03-14 11-21 - Capture d'écran.png",
          url: 'https://jardiniersdunous.org/file/file/download?guid=f758e626-6c8e-4e38-9c7c-5b48db35035b&hash_sha1=973a4fd2'
        }
      ]);

      console.log('formattedMessage', formattedMessage);
    }
  },
  methods: {
    async migrate(data) {
      const space = this.getSpaceByContainerId(data.content.metadata.contentcontainer_id);

      // Only import space "Outils numériques"
      // if (!space || space.id !== 1) return false;

      // Only import mapped categories
      if (!space || !Object.keys(categoriesMapping).includes(`${space.id}`)) {
        this.logger.warn(`Not migrating post because it is part of ${space?.id}`);
        return;
      }

      // Split title and message
      const matches = data.message.match(/^## ([^\r]*)\r\n\r\n([\S\s]*)/);
      if (!matches) {
        this.logger.warn(`RegExp failed on string ${data.message.substring(0, 20)}`);
        return false;
      }

      const username = displayNameToUserName(data.content.metadata.created_by.display_name);

      const user = await this.fetchDiscourse(`/u/${username}.json`);
      if (!user) {
        this.logger.warn(`User ${username} not found, ignoring topic...`);
        return;
      }

      const message = await this.formatMessage(matches[2], data.content.files);

      this.logger.info(`Importing topic "${matches[1]}"...`);

      const post = await this.fetchDiscourse(`/posts.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Api-Username': username
        },
        body: JSON.stringify({
          title: matches[1],
          raw: message,
          category: categoriesMapping[space.id],
          created_at: convertToIsoString(data.content.metadata.created_at)
          // external_id: data.content.metadata.guid
        })
      });

      if (post) {
        const comments = await this.getComments(data.id, 'humhub%5Cmodules%5Cpost%5Cmodels%5CPost');

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
