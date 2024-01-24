// Read all .env* files in the root folder and add them to process.env
// See https://github.com/kerimdzhanov/dotenv-flow for more details
require('dotenv-flow').config();

module.exports = {
  HUMHUB_URL: process.env.HUMHUB_URL,
  HUMHUB_TOKEN: process.env.HUMHUB_TOKEN,
  YESWIKI_URL: process.env.YESWIKI_URL,
  DISCOURSE_URL: process.env.DISCOURSE_URL,
  DISCOURSE_API_KEY: process.env.DISCOURSE_API_KEY
};
