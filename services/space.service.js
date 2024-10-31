const HumHubImporterMixin = require('./mixins/humhub');
const DiscourseMixin = require('./mixins/discourse');
const CONFIG = require('../config');
const { displayNameToUserName } = require('../utils');
const { groupsMapping, groupsNameMapping } = require('../mappings');

module.exports = {
  name: 'space',
  mixins: [HumHubImporterMixin, DiscourseMixin],
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
      const discourseGroupId = groupsMapping[data.id];
      const discourseGroupName = groupsNameMapping[data.id];

      // If a group exist for this space...
      if (discourseGroupId) {
        this.logger.info(`Importing users of ${data.name} into group ${discourseGroupName}...`);

        const results = await this.fetchDiscourse(`/groups/${discourseGroupName}/members.json`);

        for (const member of data.members) {
          const discourseUsername = displayNameToUserName(member.user.display_name);

          if (member.role === 'admin') {
            this.logger.warn(`User ${discourseUsername} should be added as admin of the group ${data.name}`);
          }

          if (results && results.members.find(m => m.username === discourseUsername)) {
            this.logger.info(`User ${discourseUsername} is already member, skipping...`);
          } else {
            this.logger.info(`Adding user ${discourseUsername}...`);
            await this.fetchDiscourse(`/groups/${discourseGroupId}/members.json`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ usernames: discourseUsername })
            });
          }
        }
      } else {
        this.logger.warn(`No group exist for space ${data.id}. Skipping...`);
      }
    }
  }
};
