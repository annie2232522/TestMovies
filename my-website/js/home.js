const API_KEY = '7ee3f44e92211fe941b4243a38e99265';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/original';

let currentItem = null;
let currentSeason = 1;
let currentServer = '';

const servers = [
  'vidsrc.me',
  'flixhq.to',
  'pinoymovies.cfd',
  'pinoymoviepedia.co',
  'mixdrop.sb'
];

async function fetchTrending(type) {
  const res = await fetch(`${BASE_URL}/trending/${type}/week?api_key=${API_KEY}`);
  const data = await res.json();
  return data.results;
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
      if (item.media_type !== 'movie' && item.media_type !== 'tv') return;
      showDetails(item);
    };
    container.appendChild(img);
  });
}

async function showDetails(item) {
  currentItem = item;
  currentSeason = 1;
  currentServer = '';

  document.getElementById('modal').style.display = 'block';
  document.getElementById('modal-title').textContent = item.title || item.name;
  document.getElementById('modal-description').textContent = item.overview;
  document.getElementById('modal-image').src = `${IMG_URL}${item.poster_path}`;

  document.getElementById('episode-buttons').innerHTML = '';
  document.getElementById('season-picker').innerHTML = '';
  document.getElementById('server-picker').innerHTML = '';
  document.getElementById('server-status').textContent = '';
  document.getElementById('retry-container').style.display = 'none';

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
    await findBestServer();
  }
}

async function findBestServer() {
  document.getElementById('loading-spinner').style.display = 'block';

  for (let server of servers) {
    const url = buildEmbedUrl(server);
    const result = await testIframe(url);
    if (result) {
      currentServer = server;
      loadVideo(server);
      document.getElementById('loading-spinner').style.display = 'none';
      return;
    }
  }

  document.getElementById('loading-spinner').style.display = 'none';
  document.getElementById('server-status').textContent = '⚠️ No working server found.';
  document.getElementById('retry-container').style.display = 'block';
}

function testIframe(url) {
  return new Promise(resolve => {
    const iframe = document.createElement('iframe');
    iframe.src = url;
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    iframe.onload = () => {
      document.body.removeChild(iframe);
      resolve(true);
    };
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
        resolve(false);
      }
    }, 3000);
  });
}

function buildEmbedUrl(server, episode = 1) {
  const id = currentItem.id;
  if (server.includes('vidsrc')) {
    return `https://${server}/embed/${currentItem.media_type}/${id}`;
  }
  if (server.includes('flixhq')) {
    return `https://${server}/embed/${id}`;
  }
  if (server.includes('pinoymovies') || server.includes('pinoymoviepedia')) {
    return `https://${server}/embed/${id}`;
  }
  if (server.includes('mixdrop')) {
    return `https://${server}/f/${id}`;
  }
  return '';
}

async function loadVideo(server, episode = 1) {
  const iframe = document.getElementById('modal-video');
  iframe.src = buildEmbedUrl(server, episode);
}

async function loadEpisodes() {
  currentSeason = document.getElementById('season-picker').value;
  const res = await fetch(`${BASE_URL}/tv/${currentItem.id}/season/${currentSeason}?api_key=${API_KEY}`);
  const data = await res.json();
  const container = document.getElementById('episode-buttons');
  container.innerHTML = '';

  data.episodes.forEach(ep => {
    const button = document.createElement('button');
    button.className = 'episode-button';
    button.textContent = `${ep.episode_number}`;
    button.onclick = () => {
      document.querySelectorAll('.episode-button').forEach(btn => btn.classList.remove('selected'));
      button.classList.add('selected');
      loadVideo(currentServer, ep.episode_number);
    };
    container.appendChild(button);
  });

  if (data.episodes.length > 0) {
    container.querySelector('button').click(); // auto-load first
  }
}

function manualServerSelect() {
  const selected = document.getElementById('server-picker').value;
  currentServer = selected;
  loadVideo(currentServer);
}

function retryFindingServers() {
  findBestServer();
}

function closeModal() {
  document.getElementById('modal').style.display = 'none';
  document.getElementById('modal-video').src = '';
}

function openSearchModal() {
  document.getElementById('search-modal').style.display = 'block';
}

function closeSearchModal() {
  document.getElementById('search-modal').style.display = 'none';
}

function toggleTheme() {
  document.body.classList.toggle('light');
}

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    closeModal();
    closeSearchModal();
  }
});

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
