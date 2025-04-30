const API_KEY = '7ee3f44e92211fe941b4243a38e99265';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/original';

let currentItem = null;
let currentSeason = 1;
let currentServer = '';
let selectedEpisode = 1;

const servers = [
  'vidsrc.me',
  'embed.vidsrc.pk',
  'moviesapi.club',
  '2embed.cc',
  'superembed.stream',
  'vidsrc.xyz',
  'vidsrc.wtf/api/4',
  'vidsrc.wtf/api/3',
  'vidsrc.wtf/api/2',
  'vidsrc.wtf/api/1',
  'embed.fmovies0.cc',
  'player.fmovies0.cc'
];

// Helper
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = 'show';
  setTimeout(() => toast.className = '', 3000);
}

// Main logic
function buildEmbedUrl(server, episode = 1) {
  const id = currentItem.id;
  const season = currentSeason;
  const color = 'ff0000';

  if (server.startsWith('vidsrc.wtf')) {
    const version = server.split('/')[2];
    const url = `https://${server}/` + (currentItem.media_type === 'movie'
      ? `movie/?id=${id}${['1', '2'].includes(version) ? `&color=${color}` : ''}`
      : `tv/?id=${id}&s=${season}&e=${episode}${['1', '2'].includes(version) ? `&color=${color}` : ''}`);
    return url;
  }

  if (server === 'embed.vidsrc.pk') {
    return currentItem.media_type === 'movie'
      ? `https://embed.vidsrc.pk/movie/${id}`
      : `https://embed.vidsrc.pk/tv/${id}/${season}-${episode}`;
  }

  if (server === 'embed.fmovies0.cc') {
    return `https://embed.fmovies0.cc/embed/movie/${id}`;
  }

  if (server === 'player.fmovies0.cc') {
    return `https://player.fmovies0.cc/embed/tv/${id}/${season}/${episode}`;
  }

  return currentItem.media_type === 'movie'
    ? `https://${server}/embed/movie/${id}`
    : `https://${server}/embed/tv/${id}/${season}/${episode}`;
}

async function isUrlAvailable(url) {
  try {
    await fetch(url, { method: 'HEAD', mode: 'no-cors' });
    return true;
  } catch {
    return false;
  }
}

async function loadVideo(server, episode = 1) {
  const url = buildEmbedUrl(server, episode);
  document.getElementById('modal-video').outerHTML =
    `<iframe id="modal-video" width="100%" height="400" src="${url}" frameborder="0" allowfullscreen></iframe>`;
}

async function autoFindServer() {
  for (const server of servers) {
    const testUrl = buildEmbedUrl(server, selectedEpisode);
    if (await isUrlAvailable(testUrl)) {
      currentServer = server;
      document.getElementById('server-picker').value = server;
      await loadVideo(server, selectedEpisode);
      return;
    }
  }
  showServerNotFound();
}

function showServerNotFound() {
  document.getElementById('modal-video').outerHTML = `
    <div id="modal-video" style="width:100%;height:400px;display:flex;align-items:center;justify-content:center;color:red;font-size:20px;background:#000;">
      Server Not Found
    </div>`;
}

function manualServerSelect() {
  currentServer = document.getElementById('server-picker').value;
  loadVideo(currentServer, selectedEpisode);
}

async function showDetails(item) {
  currentItem = item;
  selectedEpisode = 1;
  currentSeason = 1;

  // Show modal
  document.getElementById('modal').style.display = 'flex';

  // Populate modal
  document.getElementById('modal-title').textContent = item.title || item.name;
  document.getElementById('modal-description').textContent = item.overview;
  document.getElementById('modal-image').src = `${IMG_URL}${item.poster_path}`;
  document.getElementById('episode-buttons').innerHTML = '';
  document.getElementById('season-picker').innerHTML = '';

  // Setup servers
  const serverPicker = document.getElementById('server-picker');
  serverPicker.innerHTML = '';
  servers.forEach(server => {
    const opt = document.createElement('option');
    opt.value = server;
    opt.textContent = server;
    serverPicker.appendChild(opt);
  });

  if (item.media_type === 'tv') {
    document.getElementById('season-picker-container').style.display = 'block';
    const data = await fetch(`${BASE_URL}/tv/${item.id}?api_key=${API_KEY}`).then(r => r.json());

    data.seasons.forEach(season => {
      if (season.season_number === 0) return;
      const opt = document.createElement('option');
      opt.value = season.season_number;
      opt.textContent = `Season ${season.season_number}`;
      document.getElementById('season-picker').appendChild(opt);
    });

    currentSeason = document.getElementById('season-picker').value;
    await loadEpisodes();
  } else {
    document.getElementById('season-picker-container').style.display = 'none';
    await autoFindServer();
  }
}

async function loadEpisodes() {
  currentSeason = document.getElementById('season-picker').value;
  const res = await fetch(`${BASE_URL}/tv/${currentItem.id}/season/${currentSeason}?api_key=${API_KEY}`);
  const data = await res.json();
  const container = document.getElementById('episode-buttons');
  container.innerHTML = '';

  data.episodes.forEach(ep => {
    const btn = document.createElement('button');
    btn.textContent = ep.episode_number;
    btn.onclick = () => {
      selectedEpisode = ep.episode_number;
      loadVideo(currentServer, selectedEpisode);
    };
    container.appendChild(btn);
  });

  await autoFindServer();
}

function closeModal() {
  document.getElementById('modal').style.display = 'none';
  document.getElementById('modal-video').src = '';
}

document.getElementById('search-input').addEventListener('input', async function () {
  const query = this.value.trim();
  const container = document.getElementById('search-results');
  container.innerHTML = '';
  if (!query) return;
  const res = await fetch(`${BASE_URL}/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(query)}`);
  const data = await res.json();
  const items = data.results.filter(item => item.poster_path && (item.media_type === 'movie' || item.media_type === 'tv'));
  items.forEach(item => {
    const img = document.createElement('img');
    img.src = `${IMG_URL}${item.poster_path}`;
    img.onclick = () => showDetails(item);
    container.appendChild(img);
  });
});

async function init() {
  const movies = await fetch(`${BASE_URL}/trending/movie/week?api_key=${API_KEY}`).then(res => res.json());
  const tv = await fetch(`${BASE_URL}/trending/tv/week?api_key=${API_KEY}`).then(res => res.json());
  const animeRaw = await fetch(`${BASE_URL}/trending/tv/week?api_key=${API_KEY}`).then(res => res.json());
  const anime = animeRaw.results.filter(i => i.original_language === 'ja' && i.genre_ids.includes(16));

  displayList(movies.results, 'movies-list', 'movie');
  displayList(tv.results, 'tvshows-list', 'tv');
  displayList(anime, 'anime-list', 'tv');
  displayBanner(movies.results[0]);
}

function displayList(items, containerId, type) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  items.forEach(item => {
    item.media_type = type;
    const img = document.createElement('img');
    img.src = `${IMG_URL}${item.poster_path}`;
    img.onclick = () => showDetails(item);
    container.appendChild(img);
  });
}

function displayBanner(item) {
  document.getElementById('banner').style.backgroundImage = `url(${IMG_URL}${item.backdrop_path})`;
  document.getElementById('banner-title').textContent = item.title || item.name;
}

init();
