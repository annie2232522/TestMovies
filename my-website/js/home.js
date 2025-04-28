// Example function when clicking an item (movie or tv show card)
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
    loadVideo(servers[0]); // Load the movie immediately
  }
}

function closeModal() {
  document.getElementById('modal').style.display = 'none';
  document.getElementById('modal-video').src = '';
}

// You also need a function like this for closing search modal if you're using it
function closeSearchModal() {
  document.getElementById('search-modal').style.display = 'none';
}

// Load seasons into picker
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

  loadEpisodes(); // After loading seasons, load episodes of the first season
}
