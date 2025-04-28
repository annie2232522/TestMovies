const API_KEY = '7ee3f44e92211fe941b4243a38e99265';
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
// edited
function displayList(items, containerId, forceType = null) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';

  items.forEach(item => {
    const img = document.createElement('img');
    img.src = `${IMG_URL}${item.poster_path}`;
    img.alt = item.title || item.name;
    img.onclick = () => {
      if (forceType) item.media_type = forceType; // 💥 Force set media_type if missing
      showDetails(item);
    };
    container.appendChild(img);
  });
}



// edited 2

async function showDetails(item) {
  currentItem = item;

  document.getElementById('modal-title').textContent = item.title || item.name;
  document.getElementById('modal-description').textContent = item.overview;
  document.getElementById('modal-image').src = `${IMG_URL}${item.poster_path}`;
  document.getElementById('modal-rating').innerHTML = '★'.repeat(Math.round(item.vote_average / 2));
  document.getElementById('modal').style.display = 'flex';

  const seasonPickerContainer = document.getElementById('season-picker-container');
  const seasonPicker = document.getElementById('season-picker');
  const episodeButtons = document.getElementById('episode-buttons');

  // ✨ IMPORTANT: Always reset first
  seasonPicker.innerHTML = ''; // Clear previous seasons
  episodeButtons.innerHTML = ''; // Clear previous episodes
  seasonPickerContainer.style.display = 'none'; // Hide season picker by default

  if (item.media_type === 'tv') {
    // Only for TV shows
    seasonPickerContainer.style.display = 'block';

    const details = await fetch(`${BASE_URL}/tv/${item.id}?api_key=${API_KEY}`).then(res => res.json());

    details.seasons.forEach(season => {
      if (season.season_number === 0) return; // Skip specials
      const option = document.createElement('option');
      option.value = season.season_number;
      option.textContent = `Season ${season.season_number}`;
      seasonPicker.appendChild(option);
    });

    currentSeason = seasonPicker.value; // Set the currentSeason

    await loadEpisodes();
  } else {
    // If movie, update the video immediately
    updateVideo();
  }
}

// ------ edit here

// edited 2


async function loadEpisodes() {
  const seasonNumber = document.getElementById('season-picker').value;
  currentSeason = seasonNumber;

  const res = await fetch(`${BASE_URL}/tv/${currentItem.id}/season/${seasonNumber}?api_key=${API_KEY}`);
  const data = await res.json();

  const container = document.getElementById('episode-buttons');
  container.innerHTML = ''; // Clear before adding new

  data.episodes.forEach(ep => {
    const button = document.createElement('button');
    button.textContent = `E${ep.episode_number}: ${ep.name}`;
    button.onclick = () => updateVideo(ep.episode_number);
    container.appendChild(button);
  });
}




// edited 2





function updateVideo(episodeNumber = 1) {
  const server = document.getElementById('server-picker').value;
  let embedUrl = '';

  if (currentItem.media_type === 'movie') {
    // Prefer video link first
    embedUrl = `https://${server}/video/${currentItem.id}`;
    
    // Insert video player
    document.getElementById('modal-video').outerHTML = `
      <video id="modal-video" width="100%" height="400" controls autoplay>
        <source src="${embedUrl}" type="video/mp4">
        Your browser does not support the video tag.
      </video>
    `;

    // Add fallback if error loading video
    const videoElement = document.getElementById('modal-video');
    videoElement.onerror = function() {
      // If error loading video, fallback to embed
      document.getElementById('modal-video').outerHTML = `
        <iframe id="modal-video" width="100%" height="400" src="https://${server}/embed/movie/${currentItem.id}" frameborder="0" allowfullscreen></iframe>
      `;
    };

  } else {
    // TV Shows (always iframe)
    embedUrl = `https://${server}/embed/tv/${currentItem.id}/${currentSeason}/${episodeNumber}`;
    document.getElementById('modal-video').outerHTML = `
      <iframe id="modal-video" width="100%" height="400" src="${embedUrl}" frameborder="0" allowfullscreen></iframe>
    `;
  }
}




// ------ end here

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
  const kdrama = await fetchByGenre(18); // Korean Drama is 18 (Drama)
  const horror = await fetchByGenre(27);
  const action = await fetchByGenre(28);
  const romance = await fetchByGenre(10749);

  displayBanner(movies[Math.floor(Math.random() * movies.length)]);
 displayList(movies, 'movies-list'); // trending movies already have media_type
displayList(tvshows, 'tvshows-list'); // trending tv already have media_type
displayList(anime, 'anime-list', 'tv'); // anime trending is tv shows
displayList(kdrama, 'kdrama-list', 'tv');
displayList(horror, 'horror-list', 'movie');
displayList(action, 'action-list', 'movie');
displayList(romance, 'romance-list', 'movie');
}

init();
