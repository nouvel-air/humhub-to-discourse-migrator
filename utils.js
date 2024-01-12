const sanitizeHtml = require('sanitize-html');
const emoji = require('emoji-dictionary');
const createSlug = require('speakingurl');

const convertToIsoString = str => str && new Date(str).toISOString();

const frenchAddressSearch = async query => {
  const url = new URL('https://api-adresse.data.gouv.fr/search/');
  url.searchParams.set('q', query);
  const response = await fetch(url.toString());

  if (response.ok) {
    const json = await response.json();
    return json.features[0];
  }
  return false;
};

const frenchAddressReverseSearch = async (lat, lon) => {
  const url = new URL('https://api-adresse.data.gouv.fr/reverse/');
  url.searchParams.set('lat', lat);
  url.searchParams.set('lon', lon);
  const response = await fetch(url.toString());

  if (response.ok) {
    const json = await response.json();
    return json.features.length > 0 ? json.features[0] : false;
  }
  return false;
};

const removeHtmlTags = text => sanitizeHtml(text, { allowedTags: [] }).trim();

const capitalize = s => (s && s[0].toUpperCase() + s.slice(1)) || "";

const getSlugByUrl = url => {
  if (url) {
    const splitUrl = url.split('/');
    let slug = splitUrl.pop();
    // If slug is empty, there was an ending slash
    if (!slug) slug = splitUrl.pop();
    return slug;
  }
};

const replaceEmojisByUnicode = text => text.replace(/:\w+:/gi, name => emoji.getUnicode(name));

const slugify = label => createSlug(label.trim(), { lang: 'fr', custom: { '.': '.', 'Ǧ': 'g' } });

module.exports = {
  convertToIsoString,
  frenchAddressSearch,
  frenchAddressReverseSearch,
  removeHtmlTags,
  capitalize,
  getSlugByUrl,
  replaceEmojisByUnicode,
  slugify
};
