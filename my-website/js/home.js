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
  'vidsrc.wtf/api/1'
];

function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = 'show';
  setTimeout(() => toast.className = toast.className.replace('show', ''), 3000);
}

function buildEmbedUrl(server, episode = 1) {
  const id = currentItem.id;
  const season = currentSeason;
  const color = 'ff0000';
  if (server.includes('vidsrc.wtf/api/')) {
    const version = server.split('/')[2];
    const base = `https://vidsrc.wtf/api/${version}`;
    if (currentItem.media_type === 'movie') {
      return version < 3 ? `${base}/movie/?id=${id}&color=${color}` : `${base}/movie/?id=${id}`;
    } else {
      return version < 3 ? `${base}/tv/?id=${id}&s=${season}&e=${episode}&color=${color}` : `${base}/tv/?id=${id}&s=${season}&e=${episode}`;
    }
  }
  if (server === 'embed.vidsrc.pk') {
    return currentItem.media_type === 'movie'
      ? `https://embed.vidsrc.pk/movie/${id}`
      : `https://embed.vidsrc.pk/tv/${id}/${season}-${episode}`;
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
  document.getElementById('modal-video').outerHTML = `<iframe id="modal-video" src="${url}" width="100%" height="400" allowfullscreen></iframe>`;
}

async function autoFindServer() {
  showToast('Finding best server...');
  for (let server of servers) {
    const url = buildEmbedUrl(server, selectedEpisode);
    if (await isUrlAvailable(url)) {
      currentServer = server;
      document.getElementById('server-picker').value = server;
      loadVideo(server, selectedEpisode);
      return;
    }
  }
  document.getElementById('modal-video').outerHTML = `<div id="modal-video" style="text-align:center;padding:20px;color:red;">Server not found</div>`;
}

function manualServerSelect() {
  currentServer = document.getElementById('server-picker').value;
  loadVideo(currentServer, selectedEpisode);
}

async function showDetails(item) {
  currentItem = item;
  selectedEpisode = 1;
  currentSeason = 1;
  document.getElementById('modal').style.display = 'flex';
  document.getElementById('modal-title').textContent = item.title || item.name;
  document.getElementById('modal-description').textContent = item.overview;
  document.getElementById('modal-image').src = `${IMG_URL}${item.poster_path}`;
  document.getElementById('episode-buttons').innerHTML = '';
  document.getElementById('season-picker').innerHTML = '';

  const sel = document.getElementById('server-picker');
  sel.innerHTML = '';
  servers.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s;
    opt.textContent = s;
    sel.appendChild(opt);
  });

  if (item.media_type === 'tv') {
    document.getElementById('season-picker-container').style.display = 'block';
    const data = await fetch(`${BASE_URL}/tv/${item.id}?api_key=${API_KEY}`).then(r => r.json());
    data.seasons.forEach(s => {
      if (s.season_number > 0) {
        const o = document.createElement('option');
        o.value = s.season_number;
        o.textContent = `Season ${s.season_number}`;
        document.getElementById('season-picker').appendChild(o);
      }
    });
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
    btn.onclick = async () => {
      selectedEpisode = ep.episode_number;
      await autoFindServer(); // re-check for that episode
    };
    container.appendChild(btn);
  });

  await autoFindServer(); // Load first episode initially
}

function closeModal() {
  document.getElementById('modal').style.display = 'none';
  document.getElementById('modal-video').src = '';
}

document.getElementById('search-input').addEventListener('input', async e => {
  const query = e.target.value.trim();
  if (!query) return;
  const res = await fetch(`${BASE_URL}/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(query)}`);
  const data = await res.json();
  const results = data.results.filter(r => r.poster_path && ['movie', 'tv'].includes(r.media_type));
  const container = document.getElementById('movies-list');
  container.innerHTML = '';
  results.forEach(item => {
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
