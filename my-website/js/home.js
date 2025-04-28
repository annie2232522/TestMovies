// Global State
let activeTab = 'movies';
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
let watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];
let currentItem = null;
let servers = [];

// API Endpoints
const TMDB_API = 'https://api.themoviedb.org/3';
const TMDB_KEY = '7ee3f44e92211fe941b4243a38e99265'; // Replace with your real TMDB key
const JIKAN_API = 'https://api.jikan.moe/v4';

// DOM Elements
const modal = document.getElementById('modal');
const closeModalBtn = document.getElementById('close-modal');
const serverPicker = document.getElementById('server-picker');
const retryButton = document.getElementById('retry-button');
const episodeButtons = document.getElementById('episode-buttons');
const serverStatus = document.getElementById('server-status');

// Tabs Switching
document.querySelectorAll('.tab-button').forEach(btn => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

function switchTab(tabName) {
  activeTab = tabName;
  document.querySelectorAll('.tab-page').forEach(page => page.classList.add('hidden'));
  document.getElementById(tabName).classList.remove('hidden');

  document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
  document.querySelector(`.tab-button[data-tab="${tabName}"]`).classList.add('active');

  if (tabName === 'favorites') loadFavorites();
  if (tabName === 'watchlist') loadWatchlist();
}

// Theme Toggle
document.getElementById('theme-toggle').addEventListener('click', () => {
  document.body.classList.toggle('dark');
});

// Escape Closes Modal
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    modal.classList.add('hidden');
  }
});

// Load Trending Movies, TV, Anime
window.addEventListener('load', () => {
  loadTrending();
});

// Search Functionality
document.getElementById('search-button').addEventListener('click', searchContent);
document.getElementById('search-bar').addEventListener('keydown', e => {
  if (e.key === 'Enter') searchContent();
});

async function searchContent() {
  const query = document.getElementById('search-bar').value.trim();
  if (!query) return;

  const movieRes = await fetch(`${TMDB_API}/search/movie?api_key=${TMDB_KEY}&query=${query}`).then(res => res.json());
  const tvRes = await fetch(`${TMDB_API}/search/tv?api_key=${TMDB_KEY}&query=${query}`).then(res => res.json());
  const animeRes = await fetch(`${JIKAN_API}/anime?q=${query}&sfw=true`).then(res => res.json());

  renderItems('movies', movieRes.results);
  renderItems('tvshows', tvRes.results);
  renderItems('anime', animeRes.data);
}

// Load Trending
async function loadTrending() {
  const movies = await fetch(`${TMDB_API}/trending/movie/week?api_key=${TMDB_KEY}`).then(res => res.json());
  const tvshows = await fetch(`${TMDB_API}/trending/tv/week?api_key=${TMDB_KEY}`).then(res => res.json());
  const anime = await fetch(`${JIKAN_API}/seasons/now?sfw=true`).then(res => res.json());

  renderItems('movies', movies.results);
  renderItems('tvshows', tvshows.results);
  renderItems('anime', anime.data);
}

// Render Items
function renderItems(tab, items) {
  const container = document.getElementById(tab);
  container.innerHTML = '';

  items.forEach(item => {
    const img = document.createElement('img');
    img.src = item.poster_path
      ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
      : item.images?.jpg?.large_image_url || '';

    img.alt = item.title || item.name;
    img.title = item.title || item.name;
    img.addEventListener('click', () => openModal(item, tab));
    container.appendChild(img);
  });
}

// Open Modal
function openModal(item, type) {
  currentItem = { ...item, type };
  servers = [];

  document.getElementById('modal-title').innerText = item.title || item.name;
  document.getElementById('modal-description').innerText = item.overview || item.synopsis || '';
  document.getElementById('modal-image').src = item.poster_path
    ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
    : item.images?.jpg?.large_image_url || '';

  serverStatus.innerText = 'Loading servers...';
  document.getElementById('modal-video').src = '';
  serverPicker.innerHTML = '';

  loadServers(item, type);
  modal.classList.remove('hidden');
}

// Load Servers in Parallel
async function loadServers(item, type) {
  const serverList = [];

  // Preparing known servers
  if (type === 'movies' || type === 'tvshows') {
    if (item.id) {
      serverList.push(`https://vidsrc.to/embed/movie/${item.id}`);
      serverList.push(`https://vidjoy.pro/embed/movie/${item.id}`);
      serverList.push(`https://player.videasy.net/movie/${item.id}`);
    }
  }

  if (type === 'anime') {
    if (item.mal_id) {
      serverList.push(`https://player.videasy.net/anime/${item.mal_id}`);
      serverList.push(`https://player.videasy.net/anime/${item.mal_id}?dub=true`);
    }
  }

  const serverResults = await Promise.allSettled(
    serverList.map(url => fetch(url, { method: 'HEAD', mode: 'no-cors' }))
  );

  serverResults.forEach((result, idx) => {
    if (result.status === 'fulfilled') {
      servers.push(serverList[idx]);
      const opt = document.createElement('option');
      opt.value = serverList[idx];
      opt.innerText = `Server ${idx + 1}`;
      serverPicker.appendChild(opt);
    }
  });

  if (servers.length > 0) {
    document.getElementById('modal-video').src = servers[0];
    serverStatus.innerText = '';
  } else {
    serverStatus.innerText = 'No Server Found 😥';
    document.getElementById('modal-video').src = 'about:blank';
  }
}

// Retry Button
retryButton.addEventListener('click', () => {
  if (currentItem) loadServers(currentItem, currentItem.type);
});

// Server Picker
serverPicker.addEventListener('change', (e) => {
  document.getElementById('modal-video').src = e.target.value;
});

// Close Modal
closeModalBtn.addEventListener('click', () => {
  modal.classList.add('hidden');
});

// Favorites & Watchlist
function loadFavorites() {
  const container = document.getElementById('favorites');
  container.innerHTML = '';

  favorites.forEach(item => {
    const img = document.createElement('img');
    img.src = item.image;
    img.alt = item.title;
    img.title = item.title;
    img.addEventListener('click', () => openModal(item, item.type));
    container.appendChild(img);
  });
}

function loadWatchlist() {
  const container = document.getElementById('watchlist');
  container.innerHTML = '';

  watchlist.forEach(item => {
    const img = document.createElement('img');
    img.src = item.image;
    img.alt = item.title;
    img.title = item.title;
    img.addEventListener('click', () => openModal(item, item.type));
    container.appendChild(img);
  });
}

// Helpers
function saveFavorites() {
  localStorage.setItem('favorites', JSON.stringify(favorites));
}

function saveWatchlist() {
  localStorage.setItem('watchlist', JSON.stringify(watchlist));
}
