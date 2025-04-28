const API_KEY = '7ee3f44e92211fe941b4243a38e99265';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/original';

let currentItem = null;
let currentSeason = 1;
let currentServer = '';

const servers = [
  'vidsrc.dev',
  'vidsrc.cc',
  'vidsrc.io',
  '2embed.cc',
  'vidsrc.xyz',
  'vidjoy.pro',
  '111movies.com',
  'vidlink.pro',
  'moviesapi.club'
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
  document.getElementById('modal-description').textContent = item.overview;
  document.getElementById('modal-image').src = `${IMG_URL}${item.poster_path}`;

  document.getElementById('episode-buttons').innerHTML = '';
  document.getElementById('season-picker').innerHTML = '';

  if (item.media_type === 'tv') {
    document.getElementById('season-picker-container').style.display = 'block';
    await autoFindServerAndLoadSeasons();
  } else {
    document.getElementById('season-picker-container').style.display = 'none';
    await autoFindServerAndPlayMovie();
  }
}

async function autoFindServerAndPlayMovie() {
  for (const server of servers) {
    const url = `https://${server}/embed/movie/${currentItem.id}?autoplay=1`;
    if (await isUrlAvailable(url)) {
      document.getElementById('modal-video').src = url;
      currentServer = server;
      return;
    }
  }
  document.getElementById('modal-video').src = '';
  alert("No server found for this movie.");
}

async function autoFindServerAndLoadSeasons() {
  for (const server of servers) {
    const testUrl = `https://${server}/embed/tv/${currentItem.id}/1/1?autoplay=1`; // test season 1 episode 1
    if (await isUrlAvailable(testUrl)) {
      currentServer = server;
      await loadSeasons();
      return;
    }
  }
  document.getElementById('modal-video').src = '';
  alert("No server found for this TV show.");
}

async function loadSeasons() {
  const details = await fetch(`${BASE_URL}/tv/${currentItem.id}?api_key=${API_KEY}`).then(res => res.json());
  const seasonPicker = document.getElementById('season-picker');
  seasonPicker.innerHTML = '';

  details.seasons.forEach(season => {
    if (season.season_number !== 0) {
      const option = document.createElement('option');
      option.value = season.season_number;
      option.textContent = `Season ${season.season_number}`;
      seasonPicker.appendChild(option);
    }
  });

  await loadEpisodes();
}

async function loadEpisodes() {
  currentSeason = document.getElementById('season-picker').value;
  const res = await fetch(`${BASE_URL}/tv/${currentItem.id}/season/${currentSeason}?api_key=${API_KEY}`);
  const data = await res.json();
  const container = document.getElementById('episode-buttons');
  container.innerHTML = '';

  data.episodes.forEach(ep => {
    const button = document.createElement('button');
    button.textContent = `E${ep.episode_number}: ${ep.name}`;
    button.onclick = () => playEpisode(ep.episode_number);
    container.appendChild(button);
  });

  // Auto play first episode
  if (data.episodes.length > 0) {
    playEpisode(1);
  }
}

function playEpisode(episodeNumber = 1) {
  const url = `https://${currentServer}/embed/tv/${currentItem.id}/${currentSeason}/${episodeNumber}?autoplay=1`;
  document.getElementById('modal-video').src = url;
}

async function isUrlAvailable(url) {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}

function closeModal() {
  document.getElementById('modal').style.display = 'none';
  document.getElementById('modal-video').src = '';
}

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
    };
    container.appendChild(img);
  });
}

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
