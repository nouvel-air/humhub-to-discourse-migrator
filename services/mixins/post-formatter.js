const { convertToIsoString, displayNameToUserName, replaceAsync } = require('../../utils');

const PostFormatterMixin = {
  methods: {
    async postComment(topicId, comment, replyToPostId) {
      if (!topicId) {
        this.logger.warn(`No topicId provided for ${comment?.id}, skipping...`);
        return false;
      }

      const username = displayNameToUserName(comment.createdBy.display_name);

      const user = await this.fetchDiscourse(`/u/${username}.json`);

      if (!user) {
        this.logger.warn(`User ${username} not found, ignoring comment...`);
        return;
      }

      const message = await this.formatMessage(comment.message, comment.files);

      const post = await this.fetchDiscourse(`/posts.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Api-Username': displayNameToUserName(comment.createdBy.display_name)
        },
        body: JSON.stringify({
          topic_id: topicId,
          raw: message,
          created_at: convertToIsoString(comment.createdAt),
          reply_to_post_number: replyToPostId
        })
      });

      if (comment.comments) {
        for (const subComment of comment.comments) {
          await this.postComment(topicId, subComment, post.id);
        }
      }
    },
    async formatMessage(message, files) {
      // Remove extra lines (?)
      message = message.replace(/(\\\r\n|\r\n|\r|\n)/g, '\r\n');

      // Mentions
      const mentionsRegex = /\[([^\]]+)\]\(mention:.*\"[^"]+\"\)/gm;
      message = message.replaceAll(mentionsRegex, (match, p1) => {
        return '@' + displayNameToUserName(p1);
      });

      // Images
      const imagesRegex = /!\[[^\]]*\]\((?<filename>.*?)(?=\"|\))(?<optionalpart>\".*\")?\)/g;
      message = replaceAsync(message, imagesRegex, async (match, p1) => {
        const guid = p1.replace('file-guid:', '').trim();

        if (guid.startsWith('https://static.xx.fbcdn.net/images/emoji.php')) {
          return match.charAt(2);
        } else {
          const file = files?.find(f => f.guid === guid);
          if (file) {
            const message = await this.postImage(file);
            if (message) return message;
          } else {
            this.logger.warn(`Could not post file with GUID ${guid}. No attached file found.`);
          }
        }

        return match;
      });

      return message;
    },
    async postImage(file) {
      const imageUrl = `https://jardiniersdunous.org/api/v1/file/download/${file.id}`;

      this.logger.info(`Downloading image ${imageUrl}...`);

      const response = await fetch(imageUrl, {
        headers: {
          Authorization: `Bearer ${this.settings.source.humhub.jwtToken}`
        }
      });

      const blob = await response.blob();

      if (response.status === 200) {
        const formData = new FormData();
        formData.append('type', 'composer');
        formData.append('file', blob);
        formData.append('name', file.file_name);
        formData.append('synchronous', true);

        const upload = await this.fetchDiscourse('/uploads.json', {
          method: 'POST',
          headers: {},
          body: formData
        });

        return `![${upload.original_filename}|${upload.width}x${upload.height}](${upload.short_url})`;
      }
    }
  }
};

module.exports = PostFormatterMixin;
