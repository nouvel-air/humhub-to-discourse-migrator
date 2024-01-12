const ProfileManagerMixin = {
  created() {
    this.wikiProfiles = [];
  },
  methods: {
    async prepare() {
      this.logger.info('Getting list of all YesWiki profiles...');
      this.wikiProfiles = await this.broker.call('wiki-profiles.list');
    },
    getProfileByEmail(email) {
      return email && this.wikiProfiles.find(p => p.bf_email === email);
    }
  }
};

module.exports = ProfileManagerMixin;
