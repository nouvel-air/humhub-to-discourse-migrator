const urlJoin = require("url-join");
const HumHubImporterMixin = require('./mixins/humhub');
const SpaceManagerMixin = require('./mixins/space-manager');
const CONFIG = require("../config");
const { getSlugByUrl, replaceEmojisByUnicode } = require("../utils");

module.exports = {
  name: 'post',
  mixins: [SpaceManagerMixin, HumHubImporterMixin],
  settings: {
    source: {
      humhub: {
        baseUrl: CONFIG.HUMHUB_URL,
        jwtToken: CONFIG.HUMHUB_TOKEN,
        type: 'post',
      }
    }
  },
  methods: {
    async migrate(data) {
      console.log(data);
      // const humhubSpace = this.getSpaceByContainerId(data.content.metadata.contentcontainer_id);
      // if (!humhubSpace) return false;

      // // Do not import the post if it is not linked to a circle
      // const circleExist = await this.broker.call('ldp.resource.exist', {
      //   resourceUri: humhubSpace.circleUri,
      //   webId: 'system'
      // });
      // if (!circleExist) return false;

      // const matches = data.message.match(/^## ([^\r]*)\r\n\r\n([\S\s]*)/)
      // if (!matches) {
      //   this.logger.warn(`RegExp failed on string ${data.message}`);
      //   return false;
      // }

      // return({
      //   type: 'pair:Document',
      //   'pair:label': matches[1],
      //   'pair:description': replaceEmojisByUnicode(matches[2]).replace(/(\\\r\n|\r\n|\r|\n)/g, '\r\n'),
      //   'pair:documents': humhubSpace.circleUri,
      //   'pair:webPage': urlJoin(this.settings.source.humhub.baseUrl, data.content.metadata.url),
      //   'dc:creator': urlJoin(CONFIG.HOME_URL, 'users', getSlugByUrl(data.content.metadata.created_by.url))
      // })
    }
  }
};
