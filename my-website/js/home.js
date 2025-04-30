const API_KEY = '7ee3f44e92211fe941b4243a38e99265';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/original';

let currentItem = null;
let currentServer = localStorage.getItem('server') || 'vidsrc.me';
let currentSeason = 1;
let selectedEpisode = 1;

const servers = ['vidsrc.me', 'embed.vidsrc.pk', '2embed.cc', 'vidsrc.wtf/api/4'];

function switchTab(tab) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.add('hidden'));
  document.getElementById(tab).classList.remove('hidden');
}

function toggleTheme() {
  document.body.classList.toggle('light-mode');
}

document.getElementById('search-input').addEventListener('input', async function () {
  const query = this.value.trim();
  const container = document.getElementById('search-results');
  container.innerHTML = '';
  if (!query) return;
  const res = await fetch(`${BASE_URL}/search/multi?api_key=${API_KEY}&query=${query}`);
  const data = await res.json();
  data.results.filter(i => i.poster_path).forEach(item => {
    const img = document.createElement('img');
    img.src = `${IMG_URL}${item.poster_path}`;
    img.onclick = () => showDetails(item);
    container.appendChild(img);
  });
});

async function fetchTrending(type) {
  const res = await fetch(`${BASE_URL}/trending/${type}/week?api_key=${API_KEY}`);
  const data = await res.json();
  return data.results;
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

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.style.display = 'block';
  setTimeout(() => t.style.display = 'none', 3000);
}

async function showDetails(item) {
  currentItem = item;
  selectedEpisode = 1;
  document.getElementById('modal').style.display = 'flex';
  document.getElementById('modal-title').textContent = item.title || item.name;
  document.getElementById('modal-description').textContent = item.overview;
  document.getElementById('modal-image').src = `${IMG_URL}${item.poster_path}`;

  const picker = document.getElementById('server-picker');
  picker.innerHTML = '';
  servers.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s;
    opt.textContent = s;
    if (s === currentServer) opt.selected = true;
    picker.appendChild(opt);
  });

  if (item.media_type === 'tv') {
    document.getElementById('season-picker-container').classList.remove('hidden');
    const info = await fetch(`${BASE_URL}/tv/${item.id}?api_key=${API_KEY}`).then(r => r.json());
    const seasonSel = document.getElementById('season-picker');
    seasonSel.innerHTML = '';
    info.seasons.forEach(s => {
      if (s.season_number === 0) return;
      const opt = document.createElement('option');
      opt.value = s.season_number;
      opt.textContent = `Season ${s.season_number}`;
      seasonSel.appendChild(opt);
    });
    currentSeason = seasonSel.value;
    await loadEpisodes();
  } else {
    document.getElementById('season-picker-container').classList.add('hidden');
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

function manualServerSelect() {
  currentServer = document.getElementById('server-picker').value;
  localStorage.setItem('server', currentServer);
  loadVideo(currentServer, selectedEpisode);
}

async function autoFindServer() {
  for (const server of servers) {
    const url = buildUrl(server, selectedEpisode);
    try {
      await fetch(url, { method: 'HEAD', mode: 'no-cors' });
      currentServer = server;
      localStorage.setItem('server', server);
      document.getElementById('server-picker').value = server;
      loadVideo(server, selectedEpisode);
      return;
    } catch {}
  }
  showToast("No working server found.");
}

function buildUrl(server, episode = 1) {
  const id = currentItem.id;
  if (server.includes('vidsrc.wtf')) {
    return currentItem.media_type === 'movie'
      ? `https://${server}/movie/?id=${id}`
      : `https://${server}/tv/?id=${id}&s=${currentSeason}&e=${episode}`;
  }
  return currentItem.media_type === 'movie'
    ? `https://${server}/embed/movie/${id}`
    : `https://${server}/embed/tv/${id}/${currentSeason}/${episode}`;
}

function loadVideo(server, episode = 1) {
  const url = buildUrl(server, episode);
  document.getElementById('modal-video').src = url;
}

function closeModal() {
  document.getElementById('modal').style.display = 'none';
  document.getElementById('modal-video').src = '';
}

async function init() {
  const movies = await fetchTrending('movie');
  const tvshows = await fetchTrending('tv');
  displayList(movies, 'movies-list', 'movie');
  displayList(tvshows, 'tvshows-list', 'tv');
}
init();
