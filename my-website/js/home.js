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
  'vidsrc.xyz'
];

// Spinner
function showSpinner(state = true) {
  document.getElementById('toast').textContent = state ? 'Finding best server...' : '';
  document.getElementById('toast').className = state ? 'show' : '';
}

// Server not found UI
function showServerNotFound() {
  document.getElementById('modal-video').outerHTML = `
    <div id="modal-video" style="width:100%;height:400px;display:flex;align-items:center;justify-content:center;color:red;font-size:24px;background:#000;">
      Server Not Found
    </div>
  `;
}

// Build embed URL based on server logic
function buildEmbedUrl(server, episode = 1) {
  if (server === 'embed.vidsrc.pk') {
    if (currentItem.media_type === 'movie') {
      return `https://embed.vidsrc.pk/movie/${currentItem.id}`;
    } else {
      return `https://embed.vidsrc.pk/tv/${currentItem.id}/${currentSeason}-${episode}`;
    }
  }

  if (currentItem.media_type === 'movie') {
    return `https://${server}/embed/movie/${currentItem.id}`;
  } else {
    return `https://${server}/embed/tv/${currentItem.id}/${currentSeason}/${episode}`;
  }
}

// Check if URL loads
async function isUrlAvailable(url) {
  try {
    const res = await fetch(url, { method: 'HEAD', mode: 'no-cors' });
    return true;
  } catch {
    return false;
  }
}

// Load actual video
async function loadVideo(server, episode = 1) {
  const url = buildEmbedUrl(server, episode);
  const iframe = document.getElementById('modal-video');
  iframe.outerHTML = `<iframe id="modal-video" width="100%" height="400" src="${url}" frameborder="0" allowfullscreen></iframe>`;
}

// Automatically test and pick best server
async function autoFindServer() {
  showSpinner(true);
  for (const server of servers) {
    const testUrl = buildEmbedUrl(server, selectedEpisode);
    if (await isUrlAvailable(testUrl)) {
      currentServer = server;
      document.getElementById('server-picker').value = server;
      await loadVideo(server, selectedEpisode);
      showSpinner(false);
      return;
    }
  }
  showSpinner(false);
  showServerNotFound();
}

// Manual server change
function manualServerSelect() {
  const sel = document.getElementById('server-picker').value;
  currentServer = sel;
  loadVideo(sel, selectedEpisode);
}

// Show details
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

  // Server picker
  const serverSelect = document.getElementById('server-picker');
  serverSelect.innerHTML = '';
  servers.forEach(server => {
    const option = document.createElement('option');
    option.value = server;
    option.textContent = server;
    serverSelect.appendChild(option);
  });

  // TV logic
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

    await loadEpisodes();
  } else {
    document.getElementById('season-picker-container').style.display = 'none';
    await autoFindServer();
  }
}

// Load Episodes
async function loadEpisodes() {
  currentSeason = document.getElementById('season-picker').value;
  const data = await fetch(`${BASE_URL}/tv/${currentItem.id}/season/${currentSeason}?api_key=${API_KEY}`).then(res => res.json());
  const container = document.getElementById('episode-buttons');
  container.innerHTML = '';

  data.episodes.forEach(ep => {
    const btn = document.createElement('button');
    btn.textContent = `E${ep.episode_number}: ${ep.name}`;
    btn.onclick = () => {
      selectedEpisode = ep.episode_number;
      loadVideo(currentServer, selectedEpisode);
    };
    container.appendChild(btn);
  });

  await autoFindServer();
}

// Other Functions
function closeModal() {
  document.getElementById('modal').style.display = 'none';
  document.getElementById('modal-video').src = '';
}

document.getElementById('search-input').addEventListener('input', async function () {
  const query = this.value.trim();
  const resultsContainer = document.getElementById('search-results');
  resultsContainer.innerHTML = '';

  if (!query) return;
  const res = await fetch(`${BASE_URL}/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(query)}`);
  const data = await res.json();
  const items = data.results.filter(item => item.poster_path && (item.media_type === 'movie' || item.media_type === 'tv'));

  items.forEach(item => {
    const img = document.createElement('img');
    img.src = `${IMG_URL}${item.poster_path}`;
    img.onclick = () => showDetails(item);
    resultsContainer.appendChild(img);
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
