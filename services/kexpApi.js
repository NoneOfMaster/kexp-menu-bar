const fetch = require('node-fetch');

const KEXP_URLS = {
  baseV2: 'https://api.kexp.org/v2',
  playlist: 'plays',
  shows: 'shows',
};

const fetchKexp = (endpoint, limit) =>
  fetch(`${KEXP_URLS.baseV2}/${KEXP_URLS[endpoint]}/?limit=${limit}`)
    .then(response => response.json())
    .then(data => data.results);

exports.getPlaylistInfo = limit => fetchKexp('playlist', limit);
exports.getShowsInfo = limit => fetchKexp('shows', limit);
