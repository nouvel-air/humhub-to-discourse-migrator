const urlJoin = require('url-join');
const HumHubImporterMixin = require('./mixins/humhub');
const SpaceManagerMixin = require('./mixins/space-manager');
const CONFIG = require('../config');
const { getSlugByUrl, replaceEmojisByUnicode, convertToIsoString } = require('../utils');

module.exports = {
  name: 'calendar',
  mixins: [SpaceManagerMixin, HumHubImporterMixin],
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
      // const humhubSpace = this.getSpaceByContainerId(data.content.metadata.contentcontainer_id);
      // if (!humhubSpace) return false;
      // const circleExist = await this.broker.call('ldp.resource.exist', {
      //   resourceUri: humhubSpace.circleUri,
      //   webId: 'system'
      // });
      // return({
      //   type: 'pair:Event',
      //   'pair:label': data.title,
      //   'pair:description': replaceEmojisByUnicode(data.description),
      //   'pair:startDate': convertToIsoString(data.start_datetime),
      //   'pair:endDate': convertToIsoString(data.end_datetime),
      //   'pair:concerns': circleExist ? humhubSpace.circleUri : urlJoin(CONFIG.HOME_URL, 'circles', 'jardiniers-du-nous'),
      //   'pair:involves': data.participants.attending.map(user => urlJoin(CONFIG.HOME_URL, 'users', getSlugByUrl(user.url))),
      //   'pair:webPage': urlJoin(this.settings.source.humhub.baseUrl, data.content.metadata.url),
      //   'dc:creator': urlJoin(CONFIG.HOME_URL, 'users', getSlugByUrl(data.content.metadata.created_by.url))
      // })
    }
  }
};
