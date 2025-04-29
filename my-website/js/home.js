const API_KEY = '7ee3f44e92211fe941b4243a38e99265';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/original';

let currentItem = null;
let currentSeason = 1;
let currentServer = '';
let currentEpisode = 1; // Initialize current episode
let episodeServers = {}; // Track servers for each episode

const servers = [
  'vidsrc.me', 'Player.Videasy.net', 'vidsrc.dev', 'vidsrc.cc', 'vidsrc.io',
  'vidsrc.xyz', 'vidjoy.pro', '2embed.cc', 'moviesapi.club', 'cdn.lbryplayer.xyz',
  'vidsrc.icu/embed/anime/', 'vidsrc.icu/embed/tv/', 'vidsrc.icu/embed/movie/'
];

// Fetching and displaying the episodes
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

    // Store server availability for each episode
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

// Testing servers for the selected episode
async function testServersForEpisode(episodeNumber) {
  // Check each server for the episode
  for (const server of episodeServers[episodeNumber]) {
    const testUrl = buildEmbedUrl(server.server, episodeNumber);
    const isAvailable = await isUrlAvailable(testUrl);
    server.available = isAvailable; // Mark the server as available or unavailable
  }

  // Find the first working server and load video
  const availableServer = episodeServers[episodeNumber].find(s => s.available);
  if (availableServer) {
    currentServer = availableServer.server;
    loadVideo(currentServer, episodeNumber);
  } else {
    alert('No working server found for this episode.');
  }
}

// Build the embed URL for the server
function buildEmbedUrl(server, episodeNumber = 1) {
  if (server.includes('cdn.lbryplayer.xyz')) {
    return `https://${server}/api/v3/streams/free/${currentItem.id}`; // special for lbry
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

// Check if the URL is available (no CORS issue)
async function isUrlAvailable(url) {
  try {
    const res = await fetch(url, { method: 'HEAD', mode: 'no-cors' });
    return true;
  } catch {
    return false;
  }
}

// Load the video for the episode
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
