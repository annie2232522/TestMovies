const API_KEY = '7ee3f44e92211fe941b4243a38e99265';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/original';

let currentItem = null;
let currentSeason = 1;
let currentServer = '';

const servers = [
  'vidsrc.me',
  'api.consumet.org/movies/flixhq',
  'api.consumet.org/anime/gogoanime',
];

async function fetchTrending(type) {
  const res = await fetch(`${BASE_URL}/trending/${type}/week?api_key=${API_KEY}`);
  return res.json().then(data => data.results);
}

async function fetchTrendingAnime() {
  let allResults = [];
  for (let page = 1; page <= 2; page++) {
    const res = await fetch(`${BASE_URL}/trending/tv/week?api_key=${API_KEY}&page=${page}`);
    const data = await res.json();
    const filtered = data.results.filter(item => item.original_language === 'ja' && item.genre_ids.includes(16));
    allResults = allResults.concat(filtered);
  }
  return allResults;
}

function displayBanner(item) {
  document.getElementById('banner').style.backgroundImage = `url(${IMG_URL}${item.backdrop_path})`;
  document.getElementById('banner-title').textContent = item.title || item.name;
}

function displayList(items, containerId, forceType = null) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  items.forEach(item => {
    if (!item.poster_path) return;
    const img = document.createElement('img');
    img.src = `${IMG_URL}${item.poster_path}`;
    img.alt = item.title || item.name;
    img.onclick = () => {
      if (forceType) item.media_type = forceType;
      showDetails(item);
    };
    container.appendChild(img);
  });
}

async function showDetails(item) {
  currentItem = item;
  currentSeason = 1;
  document.getElementById('modal').style.display = 'flex';

  document.getElementById('modal-title').textContent = item.title || item.name;
  document.getElementById('modal-description').textContent = item.overview || 'No description available.';
  document.getElementById('modal-image').src = `${IMG_URL}${item.poster_path}`;

  document.getElementById('server-picker').innerHTML = '';
  document.getElementById('season-picker').innerHTML = '';
  document.getElementById('episode-buttons').innerHTML = '';

  servers.forEach(server => {
    const option = document.createElement('option');
    option.value = server;
    option.textContent = server.includes('api.') ? server.split('/')[2] : server;
    document.getElementById('server-picker').appendChild(option);
  });

  if (item.media_type === 'tv') {
    document.getElementById('season-picker-container').style.display = 'block';
    const details = await fetch(`${BASE_URL}/tv/${item.id}?api_key=${API_KEY}`).then(res => res.json());
    details.seasons.forEach(season => {
      if (season.season_number !== 0) {
        const option = document.createElement('option');
        option.value = season.season_number;
        option.textContent = `Season ${season.season_number}`;
        document.getElementById('season-picker').appendChild(option);
      }
    });
    await loadEpisodes();
  } else {
    document.getElementById('season-picker-container').style.display = 'none';
    await autoFindServer();
  }
}

async function autoFindServer() {
  showSpinner(true);
  for (const server of servers) {
    const testUrl = buildEmbedUrl(server);
    if (await isUrlAvailable(testUrl)) {
      currentServer = server;
      loadVideo(server);
      showSpinner(false);
      return;
    }
  }
  showSpinner(false);
  showNotFound();
}

function buildEmbedUrl(server, episodeNumber = 1) {
  const query = encodeURIComponent((currentItem.title || currentItem.name));
  if (server.includes('vidsrc.me')) {
    return currentItem.media_type === 'movie' ?
      `https://${server}/embed/movie/${currentItem.id}` :
      `https://${server}/embed/tv/${currentItem.id}/${currentSeason}/${episodeNumber}`;
  }
  if (server.includes('flixhq')) {
    return `https://${server}/watch?title=${query}`;
  }
  if (server.includes('gogoanime')) {
    return `https://${server}/watch/${query.replace(/\s/g, "-").toLowerCase()}`;
  }
}

async function isUrlAvailable(url) {
  try {
    await fetch(url, { method: 'HEAD', mode: 'no-cors' });
    return true;
  } catch {
    return false;
  }
}

async function loadVideo(server, episodeNumber = 1) {
  const iframe = document.getElementById('modal-video');
  iframe.src = buildEmbedUrl(server, episodeNumber);
}

async function loadEpisodes() {
  currentSeason = document.getElementById('season-picker').value;
  const res = await fetch(`${BASE_URL}/tv/${currentItem.id}/season/${currentSeason}?api_key=${API_KEY}`);
  const data = await res.json();
  const container = document.getElementById('episode-buttons');
  container.innerHTML = '';

  data.episodes.forEach(ep => {
    const button = document.createElement('button');
    button.textContent = ep.episode_number;
    button.onclick = async () => {
      document.querySelectorAll('#episode-buttons button').forEach(btn => btn.classList.remove('selected'));
      button.classList.add('selected');
      await tryFindEpisode(ep.episode_number);
    };
    container.appendChild(button);
  });

  if (data.episodes.length > 0) {
    document.getElementById('episode-buttons').firstChild.click(); // auto click first
  }
}

async function tryFindEpisode(episodeNumber) {
  showSpinner(true);
  for (const server of servers) {
    const testUrl = buildEmbedUrl(server, episodeNumber);
    if (await isUrlAvailable(testUrl)) {
      currentServer = server;
      loadVideo(server, episodeNumber);
      showSpinner(false);
      return;
    }
  }
  showSpinner(false);
  showNotFound();
}

function manualServerSelect() {
  const selected = document.getElementById('server-picker').value;
  currentServer = selected;
  loadVideo(currentServer);
}

function closeModal() {
  document.getElementById('modal').style.display = 'none';
  document.getElementById('modal-video').src = '';
}

function showSpinner(show) {
  document.getElementById('loading-spinner').style.display = show ? 'block' : 'none';
}

function showNotFound() {
  const iframe = document.getElementById('modal-video');
  iframe.srcdoc = `<div style="color: white; background: black; height: 100%; display: flex; justify-content: center; align-items: center; font-size: 24px;">
    ⚠️ Server Not Found
    <br><button onclick="retryFinding()" style="margin-top:10px;padding:10px 20px;">Retry</button>
  </div>`;
}

function retryFinding() {
  autoFindServer();
}

// Search Modal functions
function openSearchModal() {
  document.getElementById('search-modal').style.display = 'flex';
}

function closeSearchModal() {
  document.getElementById('search-modal').style.display = 'none';
}

async function searchTMDB() {
  const query = document.getElementById('search-bar-modal').value.trim();
  if (!query) return;
  const res = await fetch(`${BASE_URL}/search/multi?api_key=${API_KEY}&query=${query}`);
  const data = await res.json();
  const container = document.getElementById('search-results');
  container.innerHTML = '';

  data.results.forEach(item => {
    if (!item.poster_path) return;
    const img = document.createElement('img');
    img.src = `${IMG_URL}${item.poster_path}`;
    img.alt = item.title || item.name;
    img.onclick = () => {
      showDetails(item);
      closeSearchModal();
    };
    container.appendChild(img);
  });
}

// Init
async function init() {
  const movies = await fetchTrending('movie');
  const tvshows = await fetchTrending('tv');
  const anime = await fetchTrendingAnime();

  displayBanner(movies[Math.floor(Math.random() * movies.length)]);
  displayList(movies, 'movies-list', 'movie');
  displayList(tvshows, 'tvshows-list', 'tv');
  displayList(anime, 'anime-list', 'tv');

  document.querySelector('.close').addEventListener('click', closeModal);
}

init();
