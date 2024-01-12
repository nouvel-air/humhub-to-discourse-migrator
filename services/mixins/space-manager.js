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
      for (const key of this.humhubSpaces.keys()) {
        if (this.humhubSpaces[key].id === 18) {
          // Link "Salle commune" to main circle
          this.humhubSpaces[key].circleUri = urlJoin(CONFIG.HOME_URL, 'circles', 'jardiniers-du-nous');
        } else {
          this.humhubSpaces[key].circleUri = urlJoin(CONFIG.HOME_URL, 'circles', getSlugByUrl(this.humhubSpaces[key].url));
        }
      }
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
