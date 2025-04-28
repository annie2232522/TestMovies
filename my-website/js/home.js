const API_KEY = '7ee3f44e92211fe941b4243a38e99265';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/original';
let currentItem = null;
let currentSeason = 1;

async function fetchTrending(type) {
  const res = await fetch(`${BASE_URL}/trending/${type}/week?api_key=${API_KEY}`);
  const data = await res.json();
  return data.results;
}

async function fetchTrendingAnime() {
  let allResults = [];
  for (let page = 1; page <= 3; page++) {
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

function displayList(items, containerId, forceType = null) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';

  items.forEach(item => {
    const img = document.createElement('img');
    img.loading = 'lazy';
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

  document.getElementById('modal-title').textContent = item.title || item.name;
  document.getElementById('modal-description').textContent = item.overview;
  document.getElementById('modal-image').src = `${IMG_URL}${item.poster_path}`;
  document.getElementById('modal').style.display = 'flex';

  const seasonPicker = document.getElementById('season-picker');
  const episodeButtons = document.getElementById('episode-buttons');

  seasonPicker.innerHTML = '';
  episodeButtons.innerHTML = '';

  if (item.media_type === 'tv') {
    const details = await fetch(`${BASE_URL}/tv/${item.id}?api_key=${API_KEY}`).then(res => res.json());
    details.seasons.forEach(season => {
      if (season.season_number === 0) return;
      const option = document.createElement('option');
      option.value = season.season_number;
      option.textContent = `Season ${season.season_number}`;
      seasonPicker.appendChild(option);
    });

    await loadEpisodes();
  } else {
    updateVideo();
  }
}

async function loadEpisodes() {
  const seasonNumber = document.getElementById('season-picker').value;
  currentSeason = seasonNumber;

  const res = await fetch(`${BASE_URL}/tv/${currentItem.id}/season/${seasonNumber}?api_key=${API_KEY}`);
  const data = await res.json();

  const container = document.getElementById('episode-buttons');
  container.innerHTML = '';

  data.episodes.forEach(ep => {
    const button = document.createElement('button');
    button.textContent = `E${ep.episode_number}: ${ep.name}`;
    button.onclick = () => updateVideo(ep.episode_number);
    container.appendChild(button);
  });
}

function updateVideo(episodeNumber = 1) {
  const server = document.getElementById('server-picker').value;
  let embedUrl = '';

  if (currentItem.media_type === 'movie') {
    embedUrl = `https://${server}/video/${currentItem.id}`;
    document.getElementById('modal-video').src = embedUrl;
  } else {
    embedUrl = `https://${server}/embed/tv/${currentItem.id}/${currentSeason}/${episodeNumber}`;
    document.getElementById('modal-video').src = embedUrl;
  }
}

function closeModal() {
  document.getElementById('modal').style.display = 'none';
  document.getElementById('modal-video').src = '';
}

async function init() {
  const movies = await fetchTrending('movie');
  const tvshows = await fetchTrending('tv');
  const anime = await fetchTrendingAnime();
  const kdrama = await fetchByGenre(18);
  const horror = await fetchByGenre(27);
  const action = await fetchByGenre(28);
  const romance = await fetchByGenre(10749);

  displayBanner(movies[Math.floor(Math.random() * movies.length)]);
  displayList(movies, 'movies-list', 'movie');
  displayList(tvshows, 'tvshows-list', 'tv');
  displayList(anime, 'anime-list', 'tv');
  displayList(kdrama, 'kdrama-list', 'tv');
  displayList(horror, 'horror-list', 'movie');
  displayList(action, 'action-list', 'movie');
  displayList(romance, 'romance-list', 'movie');
}

init();
