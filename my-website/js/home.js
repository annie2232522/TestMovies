const API_KEY = '7ee3f44e92211fe941b4243a38e99265';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/original';
let currentItem = null;

// Fetch trending items by type
async function fetchTrending(type) {
  const res = await fetch(`${BASE_URL}/trending/${type}/week?api_key=${API_KEY}`);
  const data = await res.json();
  return data.results;
}

// Fetch trending anime (Japanese TV animation)
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

// Fetch trending K-Drama (Korean TV shows)
async function fetchTrendingKDrama() {
  const res = await fetch(`${BASE_URL}/trending/tv/week?api_key=${API_KEY}`);
  const data = await res.json();
  return data.results.filter(item => item.original_language === 'ko');
}

// Fetch trending by genre
async function fetchByGenre(genreId) {
  const res = await fetch(`${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=${genreId}`);
  const data = await res.json();
  return data.results;
}

// Display banner at the top
function displayBanner(item) {
  document.getElementById('banner').style.backgroundImage = `url(${IMG_URL}${item.backdrop_path})`;
  document.getElementById('banner-title').textContent = item.title || item.name;
}

// Display lists
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

// Show detailed modal
async function showDetails(item) {
  currentItem = item;

  document.getElementById('modal-title').textContent = item.title || item.name;
  document.getElementById('modal-description').textContent = item.overview;
  document.getElementById('modal-image').src = `${IMG_URL}${item.poster_path}`;
  document.getElementById('modal-rating').innerHTML = '★'.repeat(Math.round(item.vote_average / 2));
  document.getElementById('modal').style.display = 'flex';
  changeServer();

  // Reset season/episode pickers
  document.getElementById('season-picker').innerHTML = '';
  document.getElementById('episode-picker').innerHTML = '';
  document.getElementById('episode-list').innerHTML = '';

  if (item.media_type === 'tv') {
    document.getElementById('season-picker-container').style.display = 'block';
    document.getElementById('episode-picker-container').style.display = 'block';
    const show = await fetchShowDetails(item.id);

    // Populate Season Picker
    show.seasons.forEach(season => {
      if (season.season_number === 0) return;
      const option = document.createElement('option');
      option.value = season.season_number;
      option.textContent = `Season ${season.season_number}`;
      document.getElementById('season-picker').appendChild(option);
    });

    await loadSeasonEpisodes();
  } else {
    document.getElementById('season-picker-container').style.display = 'none';
    document.getElementById('episode-picker-container').style.display = 'none';
  }
}

// Fetch full show details
async function fetchShowDetails(tvId) {
  const res = await fetch(`${BASE_URL}/tv/${tvId}?api_key=${API_KEY}`);
  return await res.json();
}

// Fetch episodes by season
async function fetchEpisodes(tvId, seasonNumber = 1) {
  const res = await fetch(`${BASE_URL}/tv/${tvId}/season/${seasonNumber}?api_key=${API_KEY}`);
  const data = await res.json();
  return data.episodes;
}

// Load Season episodes into Episode picker
async function loadSeasonEpisodes() {
  const seasonNumber = document.getElementById('season-picker').value;
  const episodes = await fetchEpisodes(currentItem.id, seasonNumber);

  const episodePicker = document.getElementById('episode-picker');
  episodePicker.innerHTML = '';
  const episodeList = document.getElementById('episode-list');
  episodeList.innerHTML = '';

  if (episodes.length > 0) {
    episodes.forEach(ep => {
      const option = document.createElement('option');
      option.value = ep.episode_number;
      option.textContent = `Episode ${ep.episode_number}: ${ep.name}`;
      episodePicker.appendChild(option);

      const epDiv = document.createElement('div');
      epDiv.className = 'episode';
      epDiv.innerHTML = `
        <div class="episode-header" onclick="toggleEpisode(this)">
          <strong>Episode ${ep.episode_number}: ${ep.name}</strong>
          <span class="toggle-icon">+</span>
        </div>
        <div class="episode-body">
          <p>${ep.overview || "No description available."}</p>
        </div>
      `;
      episodeList.appendChild(epDiv);
    });
  }
}

// Toggle episode description open/close
function toggleEpisode(header) {
  const body = header.nextElementSibling;
  body.style.display = body.style.display === 'block' ? 'none' : 'block';
  const icon = header.querySelector('.toggle-icon');
  icon.textContent = body.style.display === 'block' ? '-' : '+';
}

// Change server (embed player)
let currentServerIndex = 0;
const servers = [
  "vidsrc.me",
  "Player.Videasy.net",
  "vidsrc.xyz",
  // Add more servers here
];

function changeServer() {
  const server = servers[currentServerIndex];
  const type = currentItem.media_type === 'movie' ? 'movie' : 'tv';
  document.getElementById('modal-video').src = https://${server}/embed/${type}/${currentItem.id};
  currentServerIndex = (currentServerIndex + 1) % servers.length;
}

// Close modal
function closeModal() {
  document.getElementById('modal').style.display = 'none';
  document.getElementById('modal-video').src = '';
}

// Open search modal
function openSearchModal() {
  document.getElementById('search-modal').style.display = 'flex';
  document.getElementById('search-input').focus();
}

// Close search modal
function closeSearchModal() {
  document.getElementById('search-modal').style.display = 'none';
  document.getElementById('search-results').innerHTML = '';
}

// Search movies/shows/anime
async function searchTMDB() {
  const query = document.getElementById('search-input').value.trim();
  if (!query) {
    document.getElementById('search-results').innerHTML = '';
    return;
  }
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

// Initialize the page
async function init() {
  const movies = await fetchTrending('movie');
  const tvShows = await fetchTrending('tv');
  const anime = await fetchTrendingAnime();
  const kdrama = await fetchTrendingKDrama();
  const horror = await fetchByGenre(27); // Horror Genre
  const action = await fetchByGenre(28); // Action Genre
  const romance = await fetchByGenre(10749); // Romance Genre

  displayBanner(movies[Math.floor(Math.random() * movies.length)]);
  displayList(movies, 'movies-list');
  displayList(tvShows, 'tvshows-list');
  displayList(anime, 'anime-list');
  displayList(kdrama, 'kdrama-list');
  displayList(horror, 'horror-list');
  displayList(action, 'action-list');
  displayList(romance, 'romance-list');
}

init();
