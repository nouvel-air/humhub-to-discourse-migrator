const urlJoin = require('url-join');
const CONFIG = require('../../config');
const { getSlugByUrl } = require('../../utils');

const SpaceManagerMixin = {
  created() {
    this.humhubSpaces = [];
  },
  methods: {
    async prepare() {
      this.logger.info('Getting list of all HumHub spaces...');
      this.humhubSpaces = await this.broker.call('space.list');
    },
    getSpaceByUrl(url) {
      return url && this.humhubSpaces.find(s => s.url === url);
    },
    getSpaceByContainerId(id) {
      return id && this.humhubSpaces.find(s => s.contentcontainer_id === id);
    }
  }
};

module.exports = SpaceManagerMixin;
