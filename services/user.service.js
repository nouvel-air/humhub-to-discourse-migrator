const urlJoin = require("url-join");
const HumHubImporterMixin = require('./mixins/humhub');
const ProfileManagerMixin = require('./mixins/profile-manager');
const CONFIG = require("../config");

module.exports = {
  name: 'user',
  mixins: [ProfileManagerMixin, HumHubImporterMixin],
  settings: {
    source: {
      humhub: {
        baseUrl: CONFIG.HUMHUB_URL,
        jwtToken: CONFIG.HUMHUB_TOKEN,
        type: 'user',
      }
    }
  },
  methods: {
    async migrate(data) {
      // let image, location;

      // const themes = await this.createOrGetThemes(...data.account.tags);

      // const wikiProfile = this.getProfileByEmail(data.account.email)

      // if (wikiProfile) {
      //   try {
      //     image = wikiProfile.bf_url_photo.replace('_org', '');
      //     const result = await fetch(image);
      //     if (!result.ok) {
      //       image = undefined;
      //     }
      //   } catch(e) {
      //     // Ignore invalid images
      //     image = undefined;
      //   }

      //   if (wikiProfile.bf_latitude && wikiProfile.bf_longitude) {
      //     location = {
      //       type: 'pair:Place',
      //       'pair:label': data.bf_ville || '',
      //       'pair:latitude': data.bf_latitude,
      //       'pair:longitude': data.bf_longitude
      //     }
      //   }
      // }

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
