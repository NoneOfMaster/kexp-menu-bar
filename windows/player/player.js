const STREAM_URL = 'http://live-aacplus-64.kexp.org/';

const generateCacheBustingUrl = base => `${base}?cb=${Math.random()}`;
const player = new Audio(generateCacheBustingUrl(STREAM_URL));
player.setAttribute('type', 'audio/aac');

player.onplay = () => api.isPlaying();
player.onpause = () => api.isPaused();

const songInfo = document.getElementById('song-info');
const show = document.getElementById('show');
const artist = document.getElementById('artist');
const song = document.getElementById('song');
const album = document.getElementById('album');
const host = document.getElementById('host');
const albumImg = document.getElementById('album-img');
const settingsIcon = document.getElementById('settings-icon');
const settings = document.getElementById('settings');
const restart = document.getElementById('restart');
const exit = document.getElementById('exit');
const settingsCheckboxes = document.querySelectorAll(
  '#settings input[type=checkbox]'
);

settingsIcon.addEventListener('click', () => toggleSettings());
restart.addEventListener('click', () => exitApp(true));
exit.addEventListener('click', () => exitApp());
settingsCheckboxes.forEach(checkbox =>
  checkbox.addEventListener('change', event => {
    const { name: key, checked: value } = event.target;
    api.setSetting({ [key]: value });
  })
);

const renderPlaylistInfo = info => {
  if (info.play_type !== 'trackplay') {
    songInfo.style.display = 'none';
    return;
  }

  songInfo.style.display = 'flex';

  album.innerHTML = info.album;
  artist.innerHTML = info.artist;
  song.innerHTML = ' – ' + info.song;
  albumImg.src = info.thumbnail_uri || '../../assets/record.png';
};

const renderShowsInfo = info => {
  show.innerHTML = info.program_name;
  host.innerHTML = ' with ' + info.host_names.join(' and ');
};

const toggleSettings = () => {
  settings.style.display = settings.style.display !== 'flex' ? 'flex' : 'none';
};

const showSettings = shouldShow =>
  (settings.style.display = shouldShow ? 'flex' : 'none');

const exitApp = restart => api.exitApp(restart);

api.onPlay(() => {
  player.src = generateCacheBustingUrl(STREAM_URL);
  player.load();

  player.play();
});

api.onPause(() => player.pause());
api.onUpdatePlaylistInfo(renderPlaylistInfo);
api.onUpdateShowsInfo(renderShowsInfo);
api.onShowSettings(showSettings);
api.onSettings(settings => {
  settingsCheckboxes.forEach(c => (c.checked = settings[c.name]));
});
