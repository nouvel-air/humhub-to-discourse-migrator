const YesWikiImporterMixin = require('./mixins/yeswiki');
const CONFIG = require('../config');

module.exports = {
  name: 'wiki-profiles',
  mixins: [YesWikiImporterMixin],
  settings: {
    source: {
      yeswiki: {
        baseUrl: CONFIG.YESWIKI_URL,
        oldApi: true,
        formId: 1000
      }
    }
  }
};
