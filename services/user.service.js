const urlJoin = require("url-join");
const getMetaData = require('metadata-scraper');
const HumHubImporterMixin = require('./mixins/humhub');
const ProfileManagerMixin = require('./mixins/profile-manager');
const DiscourseMixin = require('./mixins/discourse');
const CONFIG = require("../config");

const delay = async t => new Promise(resolve => setTimeout(resolve, t));

module.exports = {
  name: 'user',
  mixins: [ProfileManagerMixin, HumHubImporterMixin, DiscourseMixin],
  settings: {
    source: {
      humhub: {
        baseUrl: CONFIG.HUMHUB_URL,
        jwtToken: CONFIG.HUMHUB_TOKEN,
        type: 'user',
      }
    }
  },
  actions: {
    async cleanAllUsers() {
      const users = await this.fetchDiscourse(`/admin/users/list/new.json`);

      const usersToKeep = ['system', 'discobot', 'srosset81'];

      for(const user of users) {
        if (!usersToKeep.includes(user.username)) {
          console.log('Deleting user ' + user.username)
          const result = await this.fetchDiscourse(`/admin/users/${user.id}.json`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              "delete_posts": true,
              "block_email": false,
              "block_urls": false,
              "block_ip": false
            })
          });
          console.log(result.deleted);
        }
      }

    },
  },
  methods: {
    async migrate(data) {
      if (data.account.username.startsWith('deleted')) {
        this.logger.info(`Ignoring deleted user (${data.account.username})`);
        return
      }

      const user = await this.fetchDiscourse(`/u/${data.account.username}.json`);

      if (user) {
        this.logger.info(`User (${data.account.username}) already exist, skipping...`);
        return
      }

      await delay(5000);

      this.logger.info(`Importing (${data.account.username})...`);

      let result = await this.fetchDiscourse('/users.json', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.display_name,
          email: data.account.email,
          password: 'UNUSED986!!UNUSED986',
          username: data.account.username,
          active: true,
          approved: true,
          // See https://meta.discourse.org/t/how-to-change-user-fields-with-api/147999
          // 'user_fields[1]': data.profile.competences,
          // external_ids
        })
      });

      if (result.success) {
        const user = await this.fetchDiscourse(`/admin/users/${result.user_id}.json`);

        const imageUrl = `https://www.jardiniersdunous.org/uploads/profile_image/${data.guid}.jpg`;
  
        const response = await fetch(imageUrl);
        const blob = await response.blob();
  
        if (response.status === 200) {
          const formData = new FormData();
          formData.append('type', 'avatar');
          formData.append('user_id', user.id);
          formData.append('file', blob, 'image.jpg');
          formData.append('synchronous', true);
    
          const upload = await this.fetchDiscourse('/uploads.json', {
            method: 'POST',
            headers: {},
            body: formData
          });

          const resultAvatar = await this.fetchDiscourse(`/u/${user.username}/preferences/avatar/pick.json`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              type: 'uploaded',
              upload_id: upload.id
            })
          });
  
          if (!resultAvatar) {
            this.logger.warn(`Could not set avatar for ${user.username}`)
          }
        } 
        this.logger.info(`Successfully created user ${data.account.username}`)

      } else {
        this.logger.warn(`Could not post user ${data.account.username}`)
        console.log(result)
      }

      // const location = {
      //   street: data.profile.street,
      //   city: data.profile.city,
      //   zip: data.profile.zip,
      //   country: data.profile.country
      // };


      // return({
      //   type: 'pair:Person',
      //   'pair:label': `${data.profile.firstname} ${data.profile.lastname}`,
      //   'pair:description': data.profile.about,
      //   'pair:firstName': data.profile.firstname,
      //   'pair:lastName': data.profile.lastname,
      //   'pair:phone': data.profile.mobile || data.profile.phone_work || data.profile.phone_private || undefined,
      //   'pair:webPage': data.url,
      //   'pair:homePage': [data.profile.url, data.profile.url_facebook, data.profile.url_linkedin].filter(x => x),
      //   'pair:e-mail': data.account.email,
      //   'pair:depictedBy': image,
      //   'pair:hasLocation': location,
      //   'pair:affiliatedBy': urlJoin(CONFIG.HOME_URL, 'circles', 'jardiniers-du-nous'),
      //   'pair:hasInterest': themes,
      //   // 'semapps:humhubId': data.account.contentcontainer_id,
      // })
    }
  }
};
