const API_KEY = '7ee3f44e92211fe941b4243a38e99265';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/original';

let currentItem = null;
let currentSeason = 1;
let currentServer = '';

const servers = [
  { name: 'Vidsrc', url: 'vidsrc.me' },
  { name: 'FlixHQ', url: 'embed.smashystream.xyz' }, // fake embed API mirror
  { name: 'Aniwave', url: 'aniwatch.to' } // WARNING: real aniwave uses special backend
];

// ------------------------ FETCH FUNCTIONS ------------------------

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
      closeSearchModal();
      showDetails(item);
    };
    container.appendChild(img);
  });
}

// ------------------------ DISPLAY FUNCTIONS ------------------------

function displayBanner(item) {
  document.getElementById('banner').style.backgroundImage = `url(${IMG_URL}${item.backdrop_path})`;
  document.getElementById('banner-title').textContent = item.title || item.name;
}

function displayList(items, containerId, forceType = null) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  items.forEach(item => {
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

// ------------------------ MODAL FUNCTIONS ------------------------

async function showDetails(item) {
  currentItem = item;
  currentSeason = 1;
  currentServer = '';

  document.getElementById('modal').style.display = 'flex';
  document.getElementById('modal-title').textContent = item.title || item.name;
  document.getElementById('modal-description').textContent = item.overview;
  document.getElementById('modal-image').src = `${IMG_URL}${item.poster_path}`;
  document.getElementById('episode-buttons').innerHTML = '';
  document.getElementById('season-picker').innerHTML = '';
  document.getElementById('server-picker').innerHTML = '';
  document.getElementById('server-status').innerHTML = '';
  document.getElementById('retry-container').style.display = 'none';

  servers.forEach(s => {
    const option = document.createElement('option');
    option.value = s.url;
    option.textContent = s.name;
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
    await findBestServer();
  } else {
    document.getElementById('season-picker-container').style.display = 'none';
    await findBestServer();
  }
}

// Try all servers in parallel
async function findBestServer() {
  const spinner = document.getElementById('loading-spinner');
  spinner.style.display = 'block';
  document.getElementById('server-status').textContent = 'Finding best server...';

  const serverChecks = servers.map(server => checkServerAvailable(server.url));
  const results = await Promise.allSettled(serverChecks);

  for (let i = 0; i < results.length; i++) {
    if (results[i].status === 'fulfilled' && results[i].value) {
      currentServer = servers[i].url;
      loadVideo(currentServer, 1);
      spinner.style.display = 'none';
      document.getElementById('server-status').textContent = `Loaded: ${servers[i].name}`;
      return;
    }
  }

  spinner.style.display = 'none';
  document.getElementById('server-status').innerHTML = '<strong>❗ No working server found.</strong>';
  document.getElementById('retry-container').style.display = 'block';
  document.getElementById('modal-video').src = '';
}

async function checkServerAvailable(server) {
  try {
    const url = buildEmbedUrl(server);
    const res = await fetch(url, { method: 'HEAD', mode: 'no-cors' });
    return true; // Assume success because no-cors hides real response
  } catch {
    return false;
  }
}

function buildEmbedUrl(server, episode = 1) {
  if (server.includes('aniwatch.to')) {
    return `https://${server}/embed/${currentItem.id}/${currentSeason}/${episode}`;
  }
  if (server.includes('smashystream.xyz')) {
    if (currentItem.media_type === 'movie') {
      return `https://${server}/movie/${currentItem.id}`;
    } else {
      return `https://${server}/tv/${currentItem.id}/${currentSeason}/${episode}`;
    }
  }
  return `https://${server}/embed/${currentItem.media_type}/${currentItem.id}?s=${currentSeason}&e=${episode}`;
}

function loadVideo(server, episode = 1) {
  const iframe = document.getElementById('modal-video');
  iframe.src = buildEmbedUrl(server, episode);
}

// Manual Server Change
function manualServerSelect() {
  const selected = document.getElementById('server-picker').value;
  currentServer = selected;
  loadVideo(currentServer);
}

// Load Episodes
async function loadEpisodes() {
  currentSeason = document.getElementById('season-picker').value;
  const res = await fetch(`${BASE_URL}/tv/${currentItem.id}/season/${currentSeason}?api_key=${API_KEY}`);
  const data = await res.json();
  const container = document.getElementById('episode-buttons');
  container.innerHTML = '';

  data.episodes.forEach(ep => {
    const button = document.createElement('button');
    button.className = 'episode-button';
    button.textContent = ep.episode_number;
    button.onclick = () => {
      document.querySelectorAll('.episode-button').forEach(btn => btn.classList.remove('selected'));
      button.classList.add('selected');
      loadVideo(currentServer, ep.episode_number);
    };
    container.appendChild(button);
  });

  if (data.episodes.length > 0) {
    document.querySelector('.episode-button').click();
  }
}

// Retry Finding Servers
function retryFindingServers() {
  findBestServer();
}

// Close modal
function closeModal() {
  document.getElementById('modal').style.display = 'none';
  document.getElementById('modal-video').src = '';
}

// Search modal open/close
function openSearchModal() {
  document.getElementById('search-modal').style.display = 'flex';
}

function closeSearchModal() {
  document.getElementById('search-modal').style.display = 'none';
  document.getElementById('search-bar-modal').value = '';
  document.getElementById('search-results').innerHTML = '';
}

// Dark/Light Mode
function toggleTheme() {
  document.body.classList.toggle('light');
}

// Press Escape key closes modals
window.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    closeModal();
    closeSearchModal();
  }
});

// ------------------------ INIT ------------------------

async function init() {
  const movies = await fetchTrending('movie');
  const tvshows = await fetchTrending('tv');
  const anime = await fetchTrendingAnime();

  displayBanner(movies[Math.floor(Math.random() * movies.length)]);
  displayList(movies, 'movies-list', 'movie');
  displayList(tvshows, 'tvshows-list', 'tv');
  displayList(anime, 'anime-list', 'tv');
}

init();
