const API_KEY = '5b8f641a3427e8cbf2ccf7ca592e66f1';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/original';
let currentItem = null;
let currentServer = "vidsrc.me";
let currentSeason = 1;

async function fetchTrending(type) {
  const res = await fetch(`${BASE_URL}/trending/${type}/week?api_key=${API_KEY}`);
  const data = await res.json();
  return data.results;
}

async function fetchTrendingAnime() {
  let allResults = [];
  for (let page = 1; page <= 5; page++) {
    const res = await fetch(`${BASE_URL}/trending/tv/week?api_key=${API_KEY}&page=${page}`);
    const data = await res.json();
    const filtered = data.results.filter(item =>
      item.original_language === 'ja' && item.genre_ids.includes(16)
    );
    allResults = allResults.concat(filtered);
  }
  return allResults;
}

async function fetchByGenre(genreId) {
  const res = await fetch(`${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=${genreId}`);
  const data = await res.json();
  return data.results;
}

function displayBanner(item) {
  document.getElementById('banner').style.backgroundImage = `url(${IMG_URL}${item.backdrop_path})`;
  document.getElementById('banner-title').textContent = item.title || item.name;
}

function displayList(items, containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  items.forEach(item => {
    if (!item.poster_path) return;
    const img = document.createElement('img');
    img.src = `${IMG_URL}${item.poster_path}`;
    img.alt = item.title || item.name;
    img.onclick = () => showDetails(item);
    container.appendChild(img);
  });
}

async function showDetails(item) {
  currentItem = item;
  document.getElementById('modal-title').textContent = item.title || item.name;
  document.getElementById('modal-description').textContent = item.overview;
  document.getElementById('modal-image').src = `${IMG_URL}${item.poster_path}`;
  document.getElementById('modal-rating').innerHTML = '★'.repeat(Math.round(item.vote_average / 2));
  document.getElementById('modal').style.display = 'flex';

  const seasonContainer = document.getElementById('season-picker-container');
  const serverPicker = document.getElementById('server-picker');
  currentServer = serverPicker.value;

  if (item.media_type === 'tv') {
    seasonContainer.style.display = 'block';
    const details = await fetch(`${BASE_URL}/tv/${item.id}?api_key=${API_KEY}`).then(res => res.json());
    const seasonPicker = document.getElementById('season-picker');
    seasonPicker.innerHTML = '';

    details.seasons.forEach(season => {
      if (season.season_number === 0) return;
      const option = document.createElement('option');
      option.value = season.season_number;
      option.textContent = `Season ${season.season_number}`;
      seasonPicker.appendChild(option);
    });

    loadEpisodes();
  } else {
    seasonContainer.style.display = 'none';
    updateVideo();
  }
}

async function loadEpisodes() {
  const seasonNumber = document.getElementById('season-picker').value;
  const res = await fetch(`${BASE_URL}/tv/${currentItem.id}/season/${seasonNumber}?api_key=${API_KEY}`);
  const data = await res.json();

  const container = document.getElementById('episode-buttons');
  container.innerHTML = '';
  data.episodes.forEach(ep => {
    const button = document.createElement('button');
    button.textContent = `E${ep.episode_number}: ${ep.name}`;
    button.onclick = () => {
      currentSeason = seasonNumber;
      updateVideo(ep.episode_number);
    };
    container.appendChild(button);
  });
}

function updateVideo(episodeNumber = 1) {
  const server = document.getElementById('server-picker').value;
  let embedUrl = '';
  if (currentItem.media_type === 'movie') {
    embedUrl = `https://${server}/embed/movie/${currentItem.id}`;
  } else {
    embedUrl = `https://${server}/embed/tv/${currentItem.id}/${currentSeason}/${episodeNumber}`;
  }
  document.getElementById('modal-video').src = embedUrl;
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
  const results = document.getElementById('search-results');
  results.innerHTML = '';
  data.results.forEach(item => {
    if (!item.poster_path) return;
    const img = document.createElement('img');
    img.src = `${IMG_URL}${item.poster_path}`;
    img.alt = item.title || item.name;
    img.onclick = () => {
      closeSearchModal();
      showDetails(item);
    };
    results.appendChild(img);
  });
}

async function init() {
  const movies = await fetchTrending('movie');
  const tvshows = await fetchTrending('tv');
  const anime = await fetchTrendingAnime();
  const horror = await fetchByGenre(27);
  const action = await fetchByGenre(28);
  const romance = await fetchByGenre(10749);

  displayBanner(movies[Math.floor(Math.random() * movies.length)]);
  displayList(movies, 'movies-list');
  displayList(tvshows, 'tvshows-list');
  displayList(anime, 'anime-list');
  displayList(horror, 'horror-list');
  displayList(action, 'action-list');
  displayList(romance, 'romance-list');
}

init();
