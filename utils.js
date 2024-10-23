const sanitizeHtml = require('sanitize-html');
const emoji = require('emoji-dictionary');
const createSlug = require('speakingurl');

const convertToIsoString = str => str && new Date(str).toISOString();

const frenchAddressSearch = async (query, type) => {
  const url = new URL('https://api-adresse.data.gouv.fr/search/');
  url.searchParams.set('q', query);
  if (type) url.searchParams.set('type', type);
  const response = await fetch(url.toString());

  if (response.ok) {
    const json = await response.json();
    return json.features || [];
  }
  return [];
};

const frenchAddressReverseSearch = async (lat, lon) => {
  const url = new URL('https://api-adresse.data.gouv.fr/reverse/');
  url.searchParams.set('lat', lat);
  url.searchParams.set('lon', lon);
  const response = await fetch(url.toString());

  if (response.ok) {
    const json = await response.json();
    return json.features || [];
  }
  return [];
};

const swissAddressSearch = async (query) => {
  const response = await fetch('https://api.positio.ch/v1/addresses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      q: query
    })
  });

  if (response.ok) {
    const json = await response.json();
    return json.addresses?.[0];
  }
  return false;
};

const mapboxAddressSearch = async (query) => {
  const url = new URL(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`);
  url.searchParams.set('access_token', process.env.MAPBOX_ACCESS_TOKEN);
  url.searchParams.set('language', 'fr');
  const response = await fetch(url.toString());

  if (response.ok) {
    const json = await response.json();
    return json.features?.[0] || [];
  }
  return [];
}

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

// https://www.30secondsofcode.org/js/s/remove-accents/
const displayNameToUserName = s => s.replaceAll(' ', '').replace('(adhérent·e)', '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9]/g, '');

const replaceAsync = async (string, regexp, replacerFunction) => {
  const replacements = await Promise.all(
      Array.from(string.matchAll(regexp),
          match => replacerFunction(...match)));
  let i = 0;
  return string.replace(regexp, () => replacements[i++]);
}

module.exports = {
  convertToIsoString,
  frenchAddressSearch,
  frenchAddressReverseSearch,
  swissAddressSearch,
  mapboxAddressSearch,
  removeHtmlTags,
  capitalize,
  getSlugByUrl,
  replaceEmojisByUnicode,
  slugify,
  displayNameToUserName,
  replaceAsync
};
