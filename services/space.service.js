const HumHubImporterMixin = require('./mixins/humhub');
const CONFIG = require('../config');

module.exports = {
  name: 'space',
  mixins: [HumHubImporterMixin],
  settings: {
    source: {
      humhub: {
        baseUrl: CONFIG.HUMHUB_URL,
        jwtToken: CONFIG.HUMHUB_TOKEN,
        type: 'space'
      }
    }
  },
  methods: {
    async migrate(data) {
      console.log('space', data);
    }
  }
};
