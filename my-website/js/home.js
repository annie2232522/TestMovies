const TMDB_API = 'https://api.themoviedb.org/3';
const TMDB_KEY = '7ee3f44e92211fe941b4243a38e99265'; // replace!
const JIKAN_API = 'https://api.jikan.moe/v4';
const IMG_BASE = 'https://image.tmdb.org/t/p/w500';

const movieList = document.getElementById('movies-list');
const tvList = document.getElementById('tvshows-list');
const animeList = document.getElementById('anime-list');
const searchBar = document.getElementById('search-bar');
const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modal-title');
const modalDescription = document.getElementById('modal-description');
const modalImage = document.getElementById('modal-image');
const modalVideo = document.getElementById('modal-video');
const spinner = document.getElementById('spinner');
const serverPicker = document.getElementById('server-picker');
const retryButton = document.getElementById('retry-button');
const episodeButtons = document.getElementById('episode-buttons');
const serverFail = document.getElementById('server-fail');
const themeToggle = document.getElementById('theme-toggle');
const modalClose = document.getElementById('modal-close');

const movieServers = [
  id => `https://vidsrc.me/embed/${id}`,
  id => `https://player.vidsrc.co/embed/movie/${id}`,
  id => `https://player.videasy.net/movie/${id}`,
  id => `https://vidjoy.pro/embed/movie/${id}`,
  id => `https://godriveplayer.com/player.php?imdb=${id}`
];

const tvServers = (id, season, episode) => [
  `https://godriveplayer.com/player.php?type=series&tmdb=${id}&season=${season}&episode=${episode}`,
  `https://player.videasy.net/tv/${id}/${season}/${episode}`
];

const animeServers = (id, dub=false) => [
  `https://player.videasy.net/anime/${id}${dub ? '?dub=true' : ''}`
];

let currentData = {};
let activeEpisode = 1;

async function fetchTrendingMovies() {
  const res = await fetch(`${TMDB_API}/trending/movie/week?api_key=${TMDB_KEY}`);
  const data = await res.json();
  renderPosters(data.results, movieList, 'movie');
}

async function fetchTrendingTV() {
  const res = await fetch(`${TMDB_API}/trending/tv/week?api_key=${TMDB_KEY}`);
  const data = await res.json();
  renderPosters(data.results, tvList, 'tv');
}

async function fetchTrendingAnime() {
  const res = await fetch(`${JIKAN_API}/seasons/now?sfw`);
  const data = await res.json();
  renderPosters(data.data, animeList, 'anime');
}

function renderPosters(items, container, type) {
  container.innerHTML = '';
  items.forEach(item => {
    const img = document.createElement('img');
    img.src = type === 'anime' ? item.images.jpg.image_url : `${IMG_BASE}${item.poster_path}`;
    img.alt = item.title || item.title_english || item.name;
    img.addEventListener('click', () => openModal(item, type));
    container.appendChild(img);
  });
}

function openModal(item, type) {
  modal.classList.remove('hidden');
  modalTitle.textContent = item.title || item.title_english || item.name;
  modalDescription.textContent = item.overview || item.synopsis || 'No description available.';
  modalImage.src = type === 'anime' ? item.images.jpg.large_image_url : `${IMG_BASE}${item.backdrop_path}`;
  activeEpisode = 1;
  currentData = { item, type };
  episodeButtons.innerHTML = '';

  if (type === 'anime') generateEpisodes(item.episodes || 12);
  else if (type === 'tv') generateEpisodes(10);
  else findWorkingServer(item.id || item.mal_id);
}

function generateEpisodes(total) {
  episodeButtons.innerHTML = '';
  for (let i = 1; i <= total; i++) {
    const btn = document.createElement('button');
    btn.textContent = i;
    btn.addEventListener('click', () => {
      activeEpisode = i;
      document.querySelectorAll('.episode-buttons button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      findWorkingServer(currentData.item.id || currentData.item.mal_id, i);
    });
    if (i === 1) btn.classList.add('active');
    episodeButtons.appendChild(btn);
  }
  findWorkingServer(currentData.item.id || currentData.item.mal_id, 1);
}

async function findWorkingServer(id, episode=1) {
  spinner.classList.remove('hidden');
  serverFail.classList.add('hidden');
  modalVideo.src = '';

  let urls = [];
  if (currentData.type === 'anime') urls = animeServers(id);
  else if (currentData.type === 'tv') urls = tvServers(id, 1, episode);
  else urls = movieServers.map(fn => fn(id));

  try {
    const results = await Promise.allSettled(
      urls.map(url => fetch(url, { method: 'HEAD', mode: 'no-cors' }))
    );

    const firstOk = urls.find((_, i) => results[i].status === 'fulfilled');
    if (firstOk) {
      modalVideo.src = firstOk;
      serverPicker.innerHTML = urls.map((url, idx) => `<option value="${url}">Server ${idx+1}</option>`).join('');
    } else {
      serverFail.classList.remove('hidden');
    }
  } catch (err) {
    serverFail.classList.remove('hidden');
  } finally {
    spinner.classList.add('hidden');
  }
}

retryButton.addEventListener('click', () => {
  findWorkingServer(currentData.item.id || currentData.item.mal_id, activeEpisode);
});

searchBar.addEventListener('keypress', async (e) => {
  if (e.key === 'Enter') {
    const query = searchBar.value.trim();
    if (!query) return;
    const movieRes = await fetch(`${TMDB_API}/search/movie?query=${query}&api_key=${TMDB_KEY}`);
    const movieData = await movieRes.json();
    renderPosters(movieData.results, movieList, 'movie');

    const tvRes = await fetch(`${TMDB_API}/search/tv?query=${query}&api_key=${TMDB_KEY}`);
    const tvData = await tvRes.json();
    renderPosters(tvData.results, tvList, 'tv');

    const animeRes = await fetch(`${JIKAN_API}/anime?q=${query}`);
    const animeData = await animeRes.json();
    renderPosters(animeData.data, animeList, 'anime');
  }
});

modalClose.addEventListener('click', () => {
  modal.classList.add('hidden');
  modalVideo.src = '';
});

serverPicker.addEventListener('change', (e) => {
  modalVideo.src = e.target.value;
});

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    modal.classList.add('hidden');
    modalVideo.src = '';
  }
});

themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('light');
});

// On load
fetchTrendingMovies();
fetchTrendingTV();
fetchTrendingAnime();
