const API_KEY = '7ee3f44e92211fe941b4243a38e99265';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/original';

let currentItem = null;
let currentSeason = 1;
let currentServer = '';

const serverPriority = [
  'vidsrc.me',
  'Player.Videasy.net',
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
  return await res.json().then(data => data.results);
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

async function fetchByGenre(genreId) {
  const res = await fetch(`${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=${genreId}`);
  return await res.json().then(data => data.results);
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

async function autoSelectBestServer() {
  for (const server of serverPriority) {
    let testUrl = '';
    if (currentItem.media_type === 'movie') {
      testUrl = `https://${server}/embed/movie/${currentItem.id}`;
    } else {
      testUrl = `https://${server}/embed/tv/${currentItem.id}/${currentSeason}/1`;
    }

    try {
      // Try lightweight request (will not error even if no-cors)
      await fetch(testUrl, { mode: 'no-cors' });
      currentServer = server;
      document.getElementById('server-picker').value = server;
      updateVideo();
      return;
    } catch (error) {
      console.log(`Server failed: ${server}`);
    }
  }
  console.error('No working server found!');
}

async function showDetails(item) {
  currentItem = item;
  currentSeason = 1;

  document.getElementById('modal-title').textContent = item.title || item.name;
  document.getElementById('modal-description').textContent = item.overview;
  document.getElementById('modal-image').src = `${IMG_URL}${item.poster_path}`;
  document.getElementById('modal').style.display = 'flex';

  const serverPicker = document.getElementById('server-picker');
  serverPicker.innerHTML = '';

  serverPriority.forEach(server => {
    const option = document.createElement('option');
    option.value = server;
    option.textContent = server;
    serverPicker.appendChild(option);
  });

  document.getElementById('episode-buttons').innerHTML = '';
  document.getElementById('season-picker').innerHTML = '';

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
  }

  await autoSelectBestServer();
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
    button.onclick = () => updateVideo(ep.episode_number);
    container.appendChild(button);
  });
}

function updateVideo(episodeNumber = 1) {
  const selectedServer = document.getElementById('server-picker').value || currentServer;
  let embedUrl = '';

  if (currentItem.media_type === 'movie') {
    if (selectedServer.includes('2embed.cc')) {
      embedUrl = `https://${selectedServer}/embed/${currentItem.id}`;
    } else if (selectedServer.includes('vidsrc.cc')) {
      embedUrl = `https://${selectedServer}/v2/embed/movie/${currentItem.id}`;
    } else if (selectedServer.includes('moviesapi.club')) {
      embedUrl = `https://${selectedServer}/movie/${currentItem.id}`;
    } else {
      embedUrl = `https://${selectedServer}/embed/movie/${currentItem.id}`;
    }
  } else {
    embedUrl = `https://${selectedServer}/embed/tv/${currentItem.id}/${currentSeason}/${episodeNumber}`;
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
