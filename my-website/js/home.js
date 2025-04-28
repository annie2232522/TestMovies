const BASE_URL = 'https://api.themoviedb.org/3';
const API_KEY = 'YOUR_API_KEY'; // Replace with your TMDB API Key
const IMG_URL = 'https://image.tmdb.org/t/p/w500';

let currentItem = null;
let currentSeason = 1;
let currentEpisode = 1;
const servers = ['server1', 'server2', 'server3']; // Dummy servers list

function openModal(item) {
  currentItem = item;
  currentSeason = 1;
  currentEpisode = 1;

  document.getElementById('modal').style.display = 'flex';
  document.getElementById('modal-title').textContent = item.title || item.name;
  document.getElementById('modal-description').textContent = item.overview || 'No description.';
  document.getElementById('modal-image').src = IMG_URL + item.poster_path;
  document.getElementById('banner-title').textContent = item.title || item.name;

  if (item.media_type === 'tv' || item.first_air_date) {
    document.getElementById('season-picker-container').style.display = 'block';
    loadSeasons();
  } else {
    document.getElementById('season-picker-container').style.display = 'none';
    loadVideo(servers[0]);
  }
}

function closeModal() {
  document.getElementById('modal').style.display = 'none';
  document.getElementById('modal-video').src = '';
}

async function loadSeasons() {
  const res = await fetch(`${BASE_URL}/tv/${currentItem.id}?api_key=${API_KEY}`);
  const data = await res.json();

  const seasonPicker = document.getElementById('season-picker');
  seasonPicker.innerHTML = '';

  data.seasons.forEach(season => {
    const option = document.createElement('option');
    option.value = season.season_number;
    option.textContent = season.name;
    seasonPicker.appendChild(option);
  });

  loadEpisodes();
}

async function loadEpisodes() {
  const seasonPicker = document.getElementById('season-picker');
  currentSeason = parseInt(seasonPicker.value);

  const res = await fetch(`${BASE_URL}/tv/${currentItem.id}/season/${currentSeason}?api_key=${API_KEY}`);
  const data = await res.json();

  const episodeButtons = document.getElementById('episode-buttons');
  episodeButtons.innerHTML = '';

  data.episodes.forEach(ep => {
    const button = document.createElement('button');
    button.textContent = ep.episode_number;
    button.classList.add('episode-button');
    button.onclick = () => selectEpisode(ep.episode_number);
    episodeButtons.appendChild(button);
  });
}

function selectEpisode(episodeNumber) {
  currentEpisode = episodeNumber;

  document.querySelectorAll('.episode-button').forEach(btn => btn.classList.remove('selected'));
  const selectedButton = [...document.querySelectorAll('.episode-button')]
    .find(btn => parseInt(btn.textContent) === episodeNumber);

  if (selectedButton) selectedButton.classList.add('selected');

  testServers();
}

function testServers() {
  document.getElementById('server-status').textContent = 'Testing servers...';
  document.getElementById('loading-spinner').style.display = 'block';

  // Simulating server testing delay
  setTimeout(() => {
    const workingServer = servers[Math.floor(Math.random() * servers.length)];
    loadVideo(workingServer);
  }, 1000);
}

function loadVideo(server) {
  document.getElementById('loading-spinner').style.display = 'none';
  document.getElementById('server-status').textContent = `Loaded from ${server}`;
  
  // Just simulate URL here
  document.getElementById('modal-video').src = `https://${server}.com/watch?season=${currentSeason}&episode=${currentEpisode}`;
}

// Dummy Search Modal
function openSearchModal() {
  document.getElementById('search-modal').style.display = 'block';
}

function closeSearchModal() {
  document.getElementById('search-modal').style.display = 'none';
}

// You must replace servers, API Key and complete searchTMDB function yourself
