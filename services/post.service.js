const urlJoin = require('url-join');
const HumHubImporterMixin = require('./mixins/humhub');
const SpaceManagerMixin = require('./mixins/space-manager');
const DiscourseMixin = require('./mixins/discourse');
const CONFIG = require('../config');
const { convertToIsoString, displayNameToUserName, replaceAsync } = require('../utils');

// Not mapped yet
// 22 Campus 2019 - Espace dédié au Campus 2019 : préparation, partage de compte-rendus, de photos, etc.
// 47 Jardin du Léman - Nous soutenons la pratique de « l’Être et du Faire Ensemble » au service d'une transition sociétale qui prend soin de l’humain, des collectifs et de l’environnement. \r\nNous organisons, entre pair, un Espace d’Apprentissage et de Création permettant de cultiver nos liens et nos expériences de Gouvernance Partagée et d’Intelligence Collective.
// 64 Jardiner le Nous à Nantes - Des espaces pour Jardiner le Nous à Nantes
const categoriesMapping = {
  1: 9, // Outils numériques
  9: 10, // Cercle général
  12: 24, // La Fabrique des Communs
  18: 6, // Salle commune
  19: 25, // Modèle socio-économique
  34: 26, // Créer et animer un jardin
  36: 27, // Education et gouvernance partagée
  37: 28, // Grenoble
  45: 30, // Aide
  48: 31, // Jardin Clown et GP
  53: 11, // Jardin Accompagnement d'organisation
  55: 12, // Jardin Senso
  59: 5, // Jardin des Limaces
  65: 13, // Jardin du Vivre Ensemble
  76: 14, // Jardin des Dominos
  99: 32, // Jardin Animons la transition
  102: 33, // Jardin Recherche & Coopérations
  108: 29, // Chambéry
  121: 22 // Campus 2023
};

const contentContainerMapping = {
  1: 2, // Outils numériques
  9: 24, // Cercle général
  12: 42, // La Fabrique des Communs
  18: 61, // Salle commune
  19: 62, // Modèle socio-économique
  34: 138, // Créer et animer un jardin
  36: 207, // Education et gouvernance partagée
  37: 210, // Grenoble
  45: 318, // Aide
  48: 402, // Jardin Clown et GP
  53: 482, // Jardin Accompagnement d'organisation
  55: 501, // Jardin Senso
  59: 580, // Jardin des Limaces
  65: 773, // Jardin du Vivre Ensemble
  76: 944, // Jardin des Dominos
  99: 2095, // Jardin Animons la transition
  102: 2222, // Jardin Recherche & Coopérations
  108: 2710, // Chambéry
  121: 3176 // Campus 2023
};

module.exports = {
  name: 'post',
  mixins: [SpaceManagerMixin, HumHubImporterMixin, DiscourseMixin],
  settings: {
    source: {
      humhub: {
        baseUrl: CONFIG.HUMHUB_URL,
        jwtToken: CONFIG.HUMHUB_TOKEN,
        type: 'post',
        containerId: 773
      }
    }
  },
  actions: {
    async cleanAllTopics(ctx) {
      const { cat } = ctx.params;

      for (const categoryId of cat ? [cat] : Object.values(categoriesMapping)) {
        const category = await this.fetchDiscourse(`/c/${categoryId}/show.json`, {
          headers: {
            'Content-Type': 'application/json'
          }
        });

        console.log('category', category.category);

        const numPages = Math.floor(category.category.topic_count / 30);

        console.log('numPages', numPages);

        for (let page = numPages; page >= 0; page--) {
          console.log('page', page);

          const topics = await this.fetchDiscourse(`/c/${categoryId}/l/latest.json?page=${page}`, {
            headers: {
              'Content-Type': 'application/json'
            }
          });

          for (const topic of topics.topic_list?.topics) {
            console.log('Deleting topic', topic.id);
            await this.fetchDiscourse(`/t/${topic.id}.json`, {
              method: 'DELETE'
            });
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

      // console.log('data', data.message)

      // return false;

      // Only import mapped categories

      // if (!space || !Object.keys(categoriesMapping).includes(`${space.id}`)) {
      //   this.logger.warn(`Not migrating post because it is part of ${space?.id}`)
      //   return;
      // }

      // console.log('DATA', data);

      // Split title and message
      const matches = data.message.match(/^## ([^\r]*)\r\n\r\n([\S\s]*)/);
      if (!matches) {
        this.logger.warn(`RegExp failed on string ${data.message.substring(0, 20)}`);
        return false;
      }

      const username = displayNameToUserName(data.content.metadata.created_by.display_name);

      // const user = await this.fetchDiscourse(`/u/${username}.json`);

      // if (!user) {
      //   this.logger.warn(`User ${username} not found, ignoring topic...`);
      //   return;
      // }

      const comments = data.content.comments.latest;

      const message = await this.formatMessage(matches[2], data.content.files);

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

      for (const comment of comments) {
        await this.postComment(post.topic_id, comment);
      }
    },
    async postComment(topicId, comment, replyToPostId) {
      if (!topicId) {
        this.logger.warn(`No topicId provided for comment ${JSON.stringify(comment)}`);
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
        const file = files?.find(f => f.guid === guid);
        if (file) {
          const message = await this.postImage(file);
          if (message) return message;
        } else {
          this.logger.warn(`Could not post file with GUID ${guid}. No attached file found.`);
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
