// Read all .env* files in the root folder and add them to process.env
// See https://github.com/kerimdzhanov/dotenv-flow for more details
require('dotenv-flow').config();

module.exports = {
  HUMHUB_URL: process.env.HUMHUB_URL,
  HUMHUB_TOKEN: process.env.HUMHUB_TOKEN,
  DISCOURSE_URL: process.env.DISCOURSE_URL,
  DISCOURSE_API_KEY: process.env.DISCOURSE_API_KEY,
  MAPBOX_ACCESS_TOKEN: process.env.MAPBOX_ACCESS_TOKEN
};
