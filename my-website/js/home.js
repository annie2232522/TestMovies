const API_KEY = '7ee3f44e92211fe941b4243a38e99265';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/original';

let currentItem = null;
let currentSeason = 1;
let currentEpisode = 1;
let currentServer = '';
const episodeServers = {};

// List of available servers
const servers = [
  'vidsrc.me', 'Player.Videasy.net', 'vidsrc.dev', 'vidsrc.cc',
  'vidsrc.io', 'vidsrc.xyz', 'vidjoy.pro', '2embed.cc',
  'moviesapi.club', 'cdn.lbryplayer.xyz', 'vidsrc.icu/embed/anime/',
  'vidsrc.icu/embed/tv/', 'vidsrc.icu/embed/movie/'
];

// Fetch functions
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
      showDetails(item);
    };
    container.appendChild(img);
  });
}

// Display functions
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

// Show item details in modal
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
  for (const server of servers) {
    const testUrl = buildEmbedUrl(server);
    if (await isUrlAvailable(testUrl)) {
      currentServer = server;
      loadVideo(server);
      return;
    }
  }
  document.getElementById('modal-video').src = '';
  alert('No working server found.');
}

function buildEmbedUrl(server, episodeNumber = 1) {
  if (server.includes('cdn.lbryplayer.xyz')) {
    return `https://${server}/api/v3/streams/free/${currentItem.id}`;
  }
  if (server.includes('vidsrc.icu')) {
    if (currentItem.media_type === 'movie') {
      return `https://${server}${currentItem.id}`;
    } else {
      return `https://${server}${currentItem.id}/${currentSeason}/${episodeNumber}`;
    }
  }
  if (currentItem.media_type === 'movie') {
    return `https://${server}/embed/movie/${currentItem.id}?autoplay=1`;
  } else {
    return `https://${server}/embed/tv/${currentItem.id}/${currentSeason}/${episodeNumber}?autoplay=1`;
  }
}

async function isUrlAvailable(url) {
  try {
    const res = await fetch(url, { method: 'HEAD', mode: 'no-cors' });
    return true;
  } catch {
    return false;
  }
}

async function loadVideo(server, episodeNumber = 1) {
  const iframe = document.getElementById('modal-video');
  if (server.includes('cdn.lbryplayer.xyz')) {
    const res = await fetch(`https://${server}/api/v3/streams/free/${currentItem.id}`);
    const data = await res.json();
    const videoUrl = data.streaming_url;
    iframe.outerHTML = `
      <video id="modal-video" width="100%" height="400" controls autoplay>
        <source src="${videoUrl}" type="video/mp4">
        Your browser does not support HTML5 video.
      </video>
    `;
  } else {
    iframe.outerHTML = `<iframe id="modal-video" width="100%" height="400" src="${buildEmbedUrl(server, episodeNumber)}" frameborder="0" allowfullscreen></iframe>`;
  }
}

async function loadEpisodes() {
  currentSeason = document.getElementById('season-picker').value;
  const res = await fetch(`${BASE_URL}/tv/${currentItem.id}/season/${currentSeason}?api_key=${API_KEY}`);
  const data = await res.json();
  const container = document.getElementById('episode-buttons');
  container.innerHTML = '';

  episodeServers = {}; // Reset the episodeServers map

  data.episodes.forEach(ep => {
    const button = document.createElement('button');
    button.textContent = `Episode ${ep.episode_number}`;
    button.onclick = () => {
      currentEpisode = ep.episode_number;
      testServersForEpisode(ep.episode_number);

      // Add 'selected' class to the clicked episode button
      document.querySelectorAll('#episode-buttons button').forEach(btn => {
        btn.classList.remove('selected'); // Remove selected class from all buttons
      });
      button.classList.add('selected'); // Add 'selected' class to the clicked button
    };
    container.appendChild(button);

    episodeServers[ep.episode_number] = [];
    servers.forEach(server => {
      episodeServers[ep.episode_number].push({ server, available: false });
    });
  });

  if (data.episodes.length > 0) {
    testServersForEpisode(1); // Test for the first episode
    document.querySelector('#episode-buttons button').classList.add('selected'); // Select the first episode by default
  }
}

async function testServersForEpisode(episodeNumber) {
  const testResults = episodeServers[episodeNumber];

  for (const server of testResults) {
    const testUrl = buildEmbedUrl(server.server, episodeNumber);
    server.available = await isUrlAvailable(testUrl);
  }

  // Try to load video from the first available server
  const availableServer = testResults.find(server => server.available);
  if (availableServer) {
    currentServer = availableServer.server;
    loadVideo(currentServer, episodeNumber);
  } else {
    alert('No working servers found for this episode.');
  }
}
