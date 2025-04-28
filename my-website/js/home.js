const API_KEY = '7ee3f44e92211fe941b4243a38e99265';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/original';

let currentItem = null;
let currentSeason = 1;
let currentServer = '';

const servers = [
  'vidsrc.me',
  'vidsrc.to',
  'vidsrc.fun',
  'flixhq.to',
  'aniwave.to',
  'gogoanime.pe',
];

async function fetchTrending(type) {
  const res = await fetch(`${BASE_URL}/trending/${type}/week?api_key=${API_KEY}`);
  const data = await res.json();
  return data.results;
}

async function fetchTrendingAnime() {
  let results = [];
  for (let page = 1; page <= 2; page++) {
    const res = await fetch(`${BASE_URL}/trending/tv/week?api_key=${API_KEY}&page=${page}`);
    const data = await res.json();
    const anime = data.results.filter(item => item.original_language === 'ja' && item.genre_ids.includes(16));
    results = results.concat(anime);
  }
  return results;
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
    img.onclick = async () => {
      closeSearchModal();
      await showDetails(item);
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
  document.getElementById('server-picker').innerHTML = '';

  servers.forEach(s => {
    const option = document.createElement('option');
    option.value = s;
    option.textContent = s;
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
  document.getElementById('loading-spinner').style.display = 'block';
  document.getElementById('server-status').textContent = 'Finding best server...';

  const promises = servers.map(server => isUrlAvailable(buildEmbedUrl(server)));
  const results = await Promise.all(promises);

  const workingIndex = results.findIndex(r => r === true);
  if (workingIndex !== -1) {
    currentServer = servers[workingIndex];
    loadVideo(currentServer);
  } else {
    showNoServerFound();
  }

  document.getElementById('loading-spinner').style.display = 'none';
}

function buildEmbedUrl(server, episodeNumber = 1) {
  if (currentItem.media_type === 'movie') {
    return `https://${server}/embed/movie/${currentItem.id}?autoplay=1`;
  } else {
    return `https://${server}/embed/tv/${currentItem.id}/${currentSeason}/${episodeNumber}?autoplay=1`;
  }
}

async function isUrlAvailable(url) {
  try {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 2000); // timeout
    const res = await fetch(url, { method: 'HEAD', signal: controller.signal, mode: 'no-cors' });
    return true;
  } catch {
    return false;
  }
}

async function loadVideo(server, episodeNumber = 1) {
  document.getElementById('modal-video').outerHTML = `<iframe id="modal-video" width="100%" height="400" src="${buildEmbedUrl(server, episodeNumber)}" frameborder="0" allowfullscreen></iframe>`;
  document.getElementById('server-status').textContent = `Loaded from ${server}`;
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
    button.className = 'episode-button';
    button.onclick = () => {
      loadVideo(currentServer, ep.episode_number);
      highlightSelected(button);
    };
    container.appendChild(button);
  });

  if (data.episodes.length > 0) {
    loadVideo(currentServer, 1);
  }
}

function highlightSelected(selectedButton) {
  document.querySelectorAll('.episode-button').forEach(btn => btn.classList.remove('selected'));
  selectedButton.classList.add('selected');
}

function manualServerSelect() {
  const selected = document.getElementById('server-picker').value;
  currentServer = selected;
  loadVideo(currentServer);
}

function closeModal() {
  document.getElementById('modal').style.display = 'none';
  const iframe = document.getElementById('modal-video');
  if (iframe) iframe.src = '';
}

function openSearchModal() {
  document.getElementById('search-modal').style.display = 'block';
}

function closeSearchModal() {
  document.getElementById('search-modal').style.display = 'none';
}

function showNoServerFound() {
  document.getElementById('modal-video').outerHTML = `
    <div id="modal-video" style="width:100%;height:400px;display:flex;align-items:center;justify-content:center;color:red;font-size:20px;">
      ❌ Server Not Found
      <button onclick="autoFindServer()" style="margin-left:10px;padding:5px 10px;">Retry</button>
    </div>`;
}

// Listen for Escape Key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeModal();
    closeSearchModal();
  }
});

// INIT
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
