const API_KEY = '7ee3f44e92211fe941b4243a38e99265';
const MOVIE_ENDPOINTS = [
  'https://vidlink.pro/movie/',
  'https://vidsrc.dev/embed/movie/',
  'https://111movies.com/movie/',
  'https://vidjoy.pro/embed/movie/',
  'https://vidsrc.io/embed/movie/',
  'https://vidsrc.cc/v2/embed/movie/',
  'https://vidsrc.xyz/embed/movie/',
  'https://www.2embed.cc/embed/',
  'https://moviesapi.club/movie/'
]; // Additional movie endpoints
const SERIES_ENDPOINTS = [
  'https://vidsrc.vip/embed/tv/',
  'https://111movies.com/tv/',
  'https://vidlink.pro/tv/',
  'https://vidsrc.dev/embed/tv/',
  'https://vidjoy.pro/embed/tv/',
  'https://vidsrc.me/embed/tv/',
  'https://vidsrc.cc/v2/embed/tv/',
  'https://vidsrc.xyz/embed/tv/',
  'https://www.2embed.cc/embedtvfull/'
];

const movieGrid = document.getElementById('movie-grid');
const seriesGrid = document.getElementById('series-grid');
const genreList = document.getElementById('genre-list');
const modal = document.getElementById('modal');
const modalPlayer = document.getElementById('modal-player');
const closeModal = document.getElementById('close-modal');
const searchBar = document.getElementById('searchBar');  
const searchResults = document.getElementById('searchResults');  

async function fetchMovies() {
  const response = await fetch(`https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}`);
  const data = await response.json();
  
  data.results.forEach((movie) => {
    const movieCard = document.createElement('div');
    movieCard.className = 'movie-card';
    
    // Create star rating system based on movie vote_average
    const starRating = getStarRating(movie.vote_average);
    
    movieCard.innerHTML = `
      <div class="movie-poster">
        <img src="https://image.tmdb.org/t/p/w500/${movie.poster_path}" alt="${movie.title}" class="movie-image">
        <div class="rating-container">
          <div class="stars">${starRating}</div> <!-- Stars for rating -->
          <div class="rating-number">${movie.vote_average}</div> <!-- Numeric score -->
        </div>
      </div>
    `;
    
    movieCard.onclick = () => openMovieModal(movie.id);
    movieGrid.appendChild(movieCard);
  });
}

// Create a function to generate star ratings based on the vote_average
function getStarRating(voteAverage) {
  const fullStars = Math.floor(voteAverage / 2); // Max 5 stars (each star represents 2 points)
  const emptyStars = 5 - fullStars;
  
  let stars = '';
  
  // Create full stars
  for (let i = 0; i < fullStars; i++) {
    stars += '<span class="star full">★</span>';
  }
  
  // Create empty stars
  for (let i = 0; i < emptyStars; i++) {
    stars += '<span class="star empty">★</span>';
  }
  
  return stars;
}
  
  // Create a function to generate star ratings based on the vote_average
  function getStarRating(voteAverage) {
    const fullStars = Math.floor(voteAverage / 2); // Max 5 stars (each star represents 2 points)
    const emptyStars = 5 - fullStars;
    
    let stars = '';
    
    // Create full stars
    for (let i = 0; i < fullStars; i++) {
      stars += '<span class="star full">★</span>';
    }
    
    // Create empty stars
    for (let i = 0; i < emptyStars; i++) {
      stars += '<span class="star empty">★</span>';
    }
    
    return stars;
  }
  
  async function fetchTopAiringMovies() {
    const response = await fetch(`https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}`);
    const data = await response.json();
  
    const movieGrid = document.getElementById('top-airing-movie-grid');
    movieGrid.innerHTML = ''; // Clear existing movies (if any)
  
    data.results.forEach((movie) => {
      const movieCard = document.createElement('div');
      movieCard.className = 'movie-card';
      
      // Create star rating system for top airing movies
      const starRating = getStarRating(movie.vote_average);
      
      movieCard.innerHTML = `
        <div class="movie-poster">
          <img src="https://image.tmdb.org/t/p/w500/${movie.poster_path}" alt="${movie.title}" class="movie-image">
          <div class="rating-container">
            <div class="stars">${starRating}</div>
            <div class="rating-number">${movie.vote_average}</div>
          </div>
        </div>
      `;
      
      movieCard.onclick = () => openMovieModal(movie.id);
      movieGrid.appendChild(movieCard);
    });
  }  

// This function can open a modal or display movie details based on its ID
function openMovieModal(movieId) {
  // Logic to show a modal with detailed information about the selected movie
  console.log(`Open details for movie ID: ${movieId}`);
  // Add your modal opening logic here
}

// Call the function to fetch movies when the page loads
fetchTopAiringMovies();

async function fetchSeries() {
    const response = await fetch(`https://api.themoviedb.org/3/tv/top_rated?api_key=${API_KEY}`);
    const data = await response.json();
  
    seriesGrid.innerHTML = ''; // Clear previous content
  
    data.results.forEach((series) => {
      const seriesCard = document.createElement('div');
      seriesCard.className = 'series-card';
      
      // Create star rating system based on series vote_average
      const starRating = getStarRating(series.vote_average);
  
      seriesCard.innerHTML = `
        <div class="series-poster">
          <img src="https://image.tmdb.org/t/p/w500/${series.poster_path}" alt="${series.name}" class="series-image">
          <div class="rating-container">
            <div class="stars">${starRating}</div>
            <div class="rating-number">${series.vote_average}</div>
          </div>
        </div>
      `;
  
      seriesCard.onclick = () => openSeriesModal(series.id);
      seriesGrid.appendChild(seriesCard);
    });
  }
  
  // Function to fetch and display Top Airing TV Shows
  async function fetchTopAiringSeries() {
    try {
      const response = await fetch(`https://api.themoviedb.org/3/tv/on_the_air?api_key=${API_KEY}&language=en-US&page=1`);
  
      if (!response.ok) {
        throw new Error('Error fetching top airing TV shows: ' + response.statusText);
      }
  
      const data = await response.json();
      const airingGrid = document.getElementById('airing-grid');
      airingGrid.innerHTML = ''; // Clear previous results
  
      data.results.forEach((series) => {
        const seriesCard = document.createElement('div');
        seriesCard.className = 'series-card';
  
        // Create star rating system for airing series
        const starRating = getStarRating(series.vote_average);
  
        seriesCard.innerHTML = `
          <div class="series-poster">
            <img src="https://image.tmdb.org/t/p/w500/${series.poster_path}" alt="${series.name}" class="series-image">
            <div class="rating-container">
              <div class="stars">${starRating}</div>
              <div class="rating-number">${series.vote_average}</div>
            </div>
          </div>
        `;
  
        seriesCard.onclick = () => openSeriesModal(series.id);
        airingGrid.appendChild(seriesCard);
      });
    } catch (error) {
      console.error('Error fetching top airing TV shows:', error);
    }
  }
  
  // Function to fetch and display Most Watched TV Shows (Trending TV Shows)
  async function fetchMostWatchedSeries() {
    try {
      const response = await fetch(`https://api.themoviedb.org/3/trending/tv/week?api_key=${API_KEY}&language=en-US`);
  
      if (!response.ok) {
        throw new Error('Error fetching trending TV shows: ' + response.statusText);
      }
  
      const data = await response.json();
      const mostWatchedGrid = document.getElementById('most-watched-grid');
      mostWatchedGrid.innerHTML = ''; // Clear previous results
  
      data.results.forEach((series) => {
        const seriesCard = document.createElement('div');
        seriesCard.className = 'series-card';
  
        // Create star rating system for trending series
        const starRating = getStarRating(series.vote_average);
  
        seriesCard.innerHTML = `
          <div class="series-poster">
            <img src="https://image.tmdb.org/t/p/w500/${series.poster_path}" alt="${series.name}" class="series-image">
            <div class="rating-container">
              <div class="stars">${starRating}</div>
              <div class="rating-number">${series.vote_average}</div>
            </div>
          </div>
        `;
  
        seriesCard.onclick = () => openSeriesModal(series.id);
        mostWatchedGrid.appendChild(seriesCard);
      });
    } catch (error) {
      console.error('Error fetching trending TV shows:', error);
    }
  }
  
  // Helper function to generate star ratings based on the vote_average
  function getStarRating(voteAverage) {
    const fullStars = Math.floor(voteAverage / 2); // Max 5 stars (each star represents 2 points)
    const emptyStars = 5 - fullStars;
    
    let stars = '';
    
    for (let i = 0; i < fullStars; i++) {
      stars += '<span class="star full">★</span>';
    }
    
    for (let i = 0; i < emptyStars; i++) {
      stars += '<span class="star empty">★</span>';
    }
    
    return stars;
  }  

// Function to handle the modal (optional)
// You can implement this to show more details about the series when clicked
function openSeriesModal(seriesId) {
  console.log(`Open details for series ID: ${seriesId}`);
  // Implement the logic to show a modal with series details
}

// Call the functions to load the data when the page loads
fetchTopAiringSeries();
fetchMostWatchedSeries();

async function searchMoviesAndSeries(query) {
  try {
    searchResults.innerHTML = ''; 

    const movieResponse = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}`);
    const movieData = await movieResponse.json();

    const seriesResponse = await fetch(`https://api.themoviedb.org/3/search/tv?api_key=${API_KEY}&query=${encodeURIComponent(query)}`);
    const seriesData = await seriesResponse.json();

    if (movieData.results.length > 0) {
      renderSearchResults(movieData.results, 'movie');
    } else {
      searchResults.innerHTML += `<p>No results found for movies: "${query}".</p>`;
    }

    if (seriesData.results.length > 0) {
      renderSearchResults(seriesData.results, 'series');
    } else {
      searchResults.innerHTML += `<p>No results found for TV series: "${query}".</p>`;
    }

  } catch (error) {
    console.error('Error fetching search results:', error);
    searchResults.innerHTML = `<p>Something went wrong. Please try again.</p>`;
  }
}

function renderSearchResults(results, type) {
  results.forEach((item, index) => {
    const resultCard = document.createElement('div');
    resultCard.className = 'search-result-card';
    resultCard.innerHTML = `
      <img src="https://image.tmdb.org/t/p/w500/${item.poster_path}" alt="${item.title || item.name}">
      <div>
        <h3>${item.title || item.name}</h3>
        <p>${item.release_date || item.first_air_date || 'No release date available'}</p>
        <button class="watch-button" onclick="open${type === 'movie' ? 'Movie' : 'Series'}Modal(${item.id})">Watch Now</button>
      </div>
    `;

    resultCard.style.animationDelay = `${index * 0.1}s`;

    // Remove any click event on the result card itself
    resultCard.onclick = null;
    
    searchResults.appendChild(resultCard);
  });
}

searchBar.addEventListener('input', (e) => {
  const query = e.target.value.trim();
  searchResults.innerHTML = ''; 
  if (query) {
    searchMoviesAndSeries(query); 
  } else {
    searchResults.innerHTML = '';
  }
});

function openMovieModal(movieId) {
  fetch(`https://api.themoviedb.org/3/movie/${movieId}?api_key=${API_KEY}&append_to_response=credits`)
    .then((res) => res.json())
    .then((movie) => {
      const actors = movie.credits.cast.slice(0, 10); // Get first 10 actors

      // Create actor carousel HTML
      const actorCarousel = `
        <div class="actor-carousel">
          ${actors.map((actor) => `
            <div class="actor-card">
              <img src="https://image.tmdb.org/t/p/w200${actor.profile_path}" alt="${actor.name}" class="actor-img">
              <p class="actor-name">${actor.name}</p>
            </div>
          `).join('')}
        </div>
      `;

      // Update modal content
      modalPlayer.innerHTML = `
        <h3>${movie.title}</h3>
        <p>${movie.overview}</p>
        <p><strong>Release Date:</strong> ${movie.release_date}</p>
        <p><strong>IMDb Rating:</strong> ${movie.vote_average}</p>

          <!-- Server Switch Message with Notification Icon -->
    <div id="server-switch-message" class="server-switch-message">
      <i class="fas fa-exclamation-triangle"></i>
      <span>Please switch to other servers if default server doesn't work.</span>
    </div>
        
        <h3>Select Server</h3>
        <select id="server-select" class="server-select">
          ${MOVIE_ENDPOINTS.map((endpoint, index) => `<option value="${endpoint}">Server ${index + 1}</option>`).join('')}
        </select>
        <iframe src="${MOVIE_ENDPOINTS[0]}${movieId}" frameborder="0" allowfullscreen id="movie-player"></iframe>
        
        <!-- Cast Section - Below the movie player -->
        <h3>Cast</h3>
        ${actorCarousel}
      `;

      const serverSelect = document.getElementById('server-select');
      const moviePlayer = document.getElementById('movie-player');

      serverSelect.addEventListener('change', () => {
        const selectedServer = serverSelect.value;
        moviePlayer.src = `${selectedServer}${movieId}`;
      });

      modal.style.display = 'flex';
    })
    .catch((error) => {
      console.error('Error fetching movie details:', error);
    });
}

function openSeriesModal(seriesId) {
  modalPlayer.innerHTML = `
    <h3 id="series-title"></h3>
    <p id="series-description"></p>
    
    <div id="season-dropdown-container" class="season-dropdown-container">
      <label for="season-select">Choose Season:</label>
      <select id="season-select" class="season-select"></select>
    </div>

    <!-- Server Switch Message with Notification Icon -->
    <div id="server-switch-message" class="server-switch-message">
      <i class="fas fa-exclamation-triangle"></i>
      <span>Please switch to other servers if default server doesn't work.</span>
    </div>

    <div id="server-dropdown-container" class="server-dropdown-container">
      <label for="server-select">Change Server:</label>
      <select id="server-select" class="server-select">
        ${SERIES_ENDPOINTS.map((endpoint, index) => `<option value="${endpoint}">Server ${index + 1}</option>`).join('')}
      </select>
    </div>

    <div id="player-container" class="player-container">
      <iframe src="" frameborder="0" allowfullscreen id="episode-player"></iframe>
    </div>

    <!-- Cast Section - Below the episode player -->
    <h3>Cast</h3>
    <div id="actor-carousel" class="actor-carousel"></div>

    <div id="episode-list" class="episode-list"></div>
  `;

  const seasonSelect = document.getElementById('season-select');
  const serverSelect = document.getElementById('server-select');
  const playerContainer = document.getElementById('player-container');
  const actorCarousel = document.getElementById('actor-carousel');

  // Fetch series data
  fetch(`https://api.themoviedb.org/3/tv/${seriesId}?api_key=${API_KEY}&append_to_response=credits`)
    .then((res) => res.json())
    .then((data) => {
      document.getElementById('series-title').textContent = data.name;
      document.getElementById('series-description').textContent = data.overview;

      // Create season options
      data.seasons.forEach((season) => {
        const option = document.createElement('option');
        option.value = season.season_number;
        option.textContent = season.name;
        seasonSelect.appendChild(option);
      });

      // Fetch actors and display the carousel
      const actors = data.credits.cast.slice(0, 10); // Get top 10 actors
      actorCarousel.innerHTML = actors.map((actor) => `
        <div class="actor-card">
          <img src="https://image.tmdb.org/t/p/w200${actor.profile_path}" alt="${actor.name}" class="actor-img">
          <p class="actor-name">${actor.name}</p>
        </div>
      `).join('');

      seasonSelect.addEventListener('change', () => fetchEpisodes(seriesId, seasonSelect.value));
      fetchEpisodes(seriesId, data.seasons[0].season_number);
    });

  serverSelect.addEventListener('change', () => {
    const iframe = document.getElementById('episode-player');
    iframe.src = `${serverSelect.value}${seriesId}/${seasonSelect.value}/1`; // Default episode 1
  });

  modal.style.display = 'flex';
}

function playEpisode(seriesId, seasonNumber, episodeNumber) {
  const serverSelect = document.getElementById('server-select');
  const iframe = document.getElementById('episode-player');
  const playerContainer = document.getElementById('player-container');

  iframe.src = `${serverSelect.value}${seriesId}/${seasonNumber}/${episodeNumber}`;
  playerContainer.classList.remove('hidden');
}

function fetchEpisodes(seriesId, seasonNumber) {
  const episodeList = document.getElementById('episode-list');
  episodeList.innerHTML = ''; 

  fetch(`https://api.themoviedb.org/3/tv/${seriesId}/season/${seasonNumber}?api_key=${API_KEY}`)
    .then((res) => res.json())
    .then((data) => {
      data.episodes.forEach((episode) => {
        const episodeItem = document.createElement('div');
        episodeItem.className = 'episode-item';

        episodeItem.innerHTML = `
          <img src="${episode.still_path ? `https://image.tmdb.org/t/p/w500${episode.still_path}` : 'default-episode.jpg'}" alt="${episode.name}">
          <div class="episode-details">
            <h4>${episode.name}</h4>
            <p>Air Date: ${episode.air_date}</p>
            <button class="watch-button" onclick="playEpisode('${seriesId}', '${seasonNumber}', '${episode.episode_number}')">Watch Now</button>
          </div>
        `;
        
        episodeList.appendChild(episodeItem);
      });
    });
}

closeModal.onclick = () => {
  modal.style.display = 'none';
  

  const iframe = document.getElementById('movie-player') || document.getElementById('episode-player');
  
  if (iframe) {
    iframe.src = '';  
  }
};

let currentIndex = 0;
let spotlightList = [];

async function fetchSpotlightMoviesAndSeries() {
  try {
    // Fetching top-rated series and upcoming movies (or any other criteria you prefer)
    const seriesResponse = await fetch(`https://api.themoviedb.org/3/tv/top_rated?api_key=${API_KEY}`);
    const moviesResponse = await fetch(`https://api.themoviedb.org/3/movie/upcoming?api_key=${API_KEY}`);

    const seriesData = await seriesResponse.json();
    const moviesData = await moviesResponse.json();

    // Combine series and movies into one list
    spotlightList = [...seriesData.results, ...moviesData.results];
    
    // Shuffle the list
    shuffleArray(spotlightList);

    // Call to initially update spotlight content
    updateSpotlightContent();
    
    // Start automatic switching
    setInterval(showNextSpotlight, 10000);
  } catch (error) {
    console.error('Error fetching spotlight content:', error);
  }
}

// Shuffle function to randomize the order of the spotlight list
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]]; // Swap elements
  }
}

function updateSpotlightContent() {
  if (spotlightList.length > 0) {
    const spotlight = document.getElementById('spotlight');
    const spotlightTitle = document.getElementById('spotlight-title');
    const spotlightRating = document.getElementById('spotlight-rating');
    const spotlightReleaseDate = document.getElementById('spotlight-release-date');
    const spotlightDescription = document.getElementById('spotlight-description');
    const spotlightButton = document.getElementById('spotlight-button');

    const currentSpotlight = spotlightList[currentIndex];

    // Set title, release date, and rating
    spotlightTitle.textContent = currentSpotlight.title || currentSpotlight.name;
    spotlightRating.textContent = `IMDb: ${currentSpotlight.vote_average}`;
    spotlightReleaseDate.textContent = `Release Date: ${currentSpotlight.release_date || currentSpotlight.first_air_date}`;

    const fullDescription = currentSpotlight.overview || "No description available.";
    const truncatedDescription = fullDescription.length > 200 ? fullDescription.substring(0, 200) + '...' : fullDescription;

    // Show only the truncated description without the See More/See Less button
    spotlightDescription.textContent = truncatedDescription;

    // Keep the "Watch Now" button visible and functional
    spotlightButton.style.display = 'inline-block';  // Make sure the Watch Now button is visible
    
    spotlightButton.onclick = () => {
      if (currentSpotlight.id) {
        // Open movie or series modal based on type
        if (currentSpotlight.title) {
          openMovieModal(currentSpotlight.id);
        } else {
          openSeriesModal(currentSpotlight.id);
        }
      }
    };

    // Set the background image for spotlight
    const backdropUrl = `https://image.tmdb.org/t/p/w1280/${currentSpotlight.backdrop_path || currentSpotlight.poster_path}`;
    spotlight.style.backgroundImage = `url(${backdropUrl})`;
  }
}

function showNextSpotlight() {
  currentIndex = (currentIndex + 1) % spotlightList.length;
  updateSpotlightContent();
}

window.onload = () => {
  fetchSpotlightMoviesAndSeries(); // Fetch movies and series for spotlight
};

async function fetchUpcomingMovies() {
    const response = await fetch(`https://api.themoviedb.org/3/movie/upcoming?api_key=${API_KEY}`);
    const data = await response.json();
    
    const upcomingGrid = document.getElementById('upcoming-movies-grid');
    upcomingGrid.innerHTML = ''; // Clear previous results
  
    data.results.forEach((movie) => {
      const movieCard = document.createElement('div');
      movieCard.className = 'movie-card';
  
      // Generate star rating based on movie vote_average
      const starRating = getStarRating(movie.vote_average);
  
      movieCard.innerHTML = `
        <div class="movie-poster">
          <img src="https://image.tmdb.org/t/p/w500/${movie.poster_path}" alt="${movie.title}" class="movie-image">
          <div class="rating-container">
            <div class="stars">${starRating}</div>
            <div class="rating-number">${movie.vote_average}</div>
          </div>
        </div>
      `;
  
      movieCard.onclick = () => openMovieModal(movie.id);
      upcomingGrid.appendChild(movieCard);
    });
  }
  
  // Helper function to generate star ratings based on the vote_average
  function getStarRating(voteAverage) {
    const fullStars = Math.floor(voteAverage / 2); // Max 5 stars (each star represents 2 points)
    const emptyStars = 5 - fullStars;
    
    let stars = '';
    
    for (let i = 0; i < fullStars; i++) {
      stars += '<span class="star full">★</span>';
    }
    
    for (let i = 0; i < emptyStars; i++) {
      stars += '<span class="star empty">★</span>';
    }
    
    return stars;
  }  

/// Fetch and display general Animation TV Shows
async function fetchAnimationTVShows() {
    try {
      const response = await fetch(`https://api.themoviedb.org/3/discover/tv?api_key=${API_KEY}&with_genres=16`);
  
      if (!response.ok) {
        throw new Error('Error fetching animation TV shows: ' + response.statusText);
      }
  
      const data = await response.json();
      const animationGrid = document.getElementById('animation-tv-shows-grid');
      animationGrid.innerHTML = ''; // Clear previous results
  
      if (data.results.length > 0) {
        data.results.forEach((series) => {
          const seriesCard = document.createElement('div');
          seriesCard.className = 'movie-card';
  
          // Generate star rating based on series vote_average
          const starRating = getStarRating(series.vote_average);
  
          seriesCard.innerHTML = `
            <div class="movie-poster">
              <img src="https://image.tmdb.org/t/p/w500/${series.poster_path}" alt="${series.name}" class="movie-image">
              <div class="rating-container">
                <div class="stars">${starRating}</div>
                <div class="rating-number">${series.vote_average}</div>
              </div>
            </div>
          `;
  
          seriesCard.onclick = () => openSeriesModal(series.id); // Implement modal for series details
          animationGrid.appendChild(seriesCard);
        });
      } else {
        animationGrid.innerHTML = '<p>No animation TV shows available.</p>';
      }
    } catch (error) {
      console.error('Error fetching Animation TV shows:', error);
    }
  }
  
  // Function to fetch and display Top Rated Sci-Fi Animation TV Shows
  async function fetchTopRatedAnimations() {
    try {
      // Fetching top-rated Sci-Fi Animation TV shows (combining genres 16 for Animation and 10765 for Sci-Fi)
      const response = await fetch(`https://api.themoviedb.org/3/discover/tv?api_key=${API_KEY}&with_genres=16,10765&sort_by=vote_average.desc&language=en-US`);
      
      if (!response.ok) {
        throw new Error('Error fetching Sci-Fi Animation TV shows: ' + response.statusText);
      }
  
      const data = await response.json();
      const animationGrid = document.getElementById('top-rated-grid');
      animationGrid.innerHTML = ''; // Clear previous results
  
      if (data.results.length > 0) {
        data.results.forEach((series) => {
          const seriesCard = document.createElement('div');
          seriesCard.className = 'movie-card';
  
          // Generate star rating based on series vote_average
          const starRating = getStarRating(series.vote_average);
  
          seriesCard.innerHTML = `
            <div class="movie-poster">
              <img src="https://image.tmdb.org/t/p/w500/${series.poster_path}" alt="${series.name}" class="movie-image">
              <div class="rating-container">
                <div class="stars">${starRating}</div>
                <div class="rating-number">${series.vote_average}</div>
              </div>
            </div>
          `;
  
          seriesCard.onclick = () => openSeriesModal(series.id); // Open modal on click
          animationGrid.appendChild(seriesCard);
        });
      } else {
        animationGrid.innerHTML = '<p>No top-rated Sci-Fi Animation TV shows available.</p>';
      }
    } catch (error) {
      console.error('Error fetching Sci-Fi Animation TV shows:', error);
    }
  }
  
  // Function to fetch and display Airing Today Animation TV Shows
  async function fetchTopAiringAnimations() {
    try {
      // Fetching airing today animation TV shows (genre 16 for Animation)
      const response = await fetch(`https://api.themoviedb.org/3/discover/tv?api_key=${API_KEY}&with_genres=16&air_date.gte=${new Date().toISOString().split('T')[0]}&language=en-US`);
  
      if (!response.ok) {
        throw new Error('Error fetching animation TV shows: ' + response.statusText);
      }
  
      const data = await response.json();
      const animationGrid = document.getElementById('top-airing-grid');
      animationGrid.innerHTML = ''; // Clear previous results
  
      if (data.results.length > 0) {
        data.results.forEach((series) => {
          const seriesCard = document.createElement('div');
          seriesCard.className = 'movie-card';
  
          // Generate star rating based on series vote_average
          const starRating = getStarRating(series.vote_average);
  
          seriesCard.innerHTML = `
            <div class="movie-poster">
              <img src="https://image.tmdb.org/t/p/w500/${series.poster_path}" alt="${series.name}" class="movie-image">
              <div class="rating-container">
                <div class="stars">${starRating}</div>
                <div class="rating-number">${series.vote_average}</div>
              </div>
            </div>
          `;
  
          seriesCard.onclick = () => openSeriesModal(series.id); // You can implement this modal logic
          animationGrid.appendChild(seriesCard);
        });
      } else {
        animationGrid.innerHTML = '<p>No animation TV shows available.</p>';
      }
    } catch (error) {
      console.error('Error fetching Animation TV shows:', error);
    }
  }
  
  // Helper function to generate star ratings based on the vote_average
  function getStarRating(voteAverage) {
    const fullStars = Math.floor(voteAverage / 2); // Max 5 stars (each star represents 2 points)
    const emptyStars = 5 - fullStars;
    
    let stars = '';
    
    for (let i = 0; i < fullStars; i++) {
      stars += '<span class="star full">★</span>';
    }
    
    for (let i = 0; i < emptyStars; i++) {
      stars += '<span class="star empty">★</span>';
    }
    
    return stars;
  }

document.addEventListener('contextmenu', function(event) {
  event.preventDefault();
});

document.addEventListener('keydown', function(event) {
  if (event.key === "F12" || (event.ctrlKey && event.shiftKey && event.key === "I")) {
      event.preventDefault();
  }
});

document.getElementById('hamburger-menu').addEventListener('click', function() {
  const navbarLinks = document.getElementById('navbar-links');
  navbarLinks.classList.toggle('active'); // Toggle the active class to show/hide menu
});

function hideLoader() {
  // Immediately hide the loader after 1 second for smoother transition
  setTimeout(() => {
    document.getElementById('loader').style.opacity = '0';
    setTimeout(() => {
      document.getElementById('loader').style.display = 'none';
      document.getElementById('main-content').classList.remove('content-hidden');
    }, 300); // Delay for fade-out effect
  }, 2000); // Loader visible for only 1 second
}

const darkModeToggle = document.getElementById('dark-mode-toggle');
const body = document.body;

// Check if dark mode is already applied (based on localStorage or initial state)
if (localStorage.getItem('dark-mode') === 'true') {
  body.classList.add('dark-mode');
  darkModeToggle.checked = true;
}

// Event listener for the toggle switch
darkModeToggle.addEventListener('change', function() {
  if (this.checked) {
    // Enable dark mode
    body.classList.add('dark-mode');
    localStorage.setItem('dark-mode', 'true');  // Save preference to localStorage
  } else {
    // Disable dark mode
    body.classList.remove('dark-mode');
    localStorage.setItem('dark-mode', 'false');  // Save preference to localStorage
  }
});

window.onload = () => {
  fetchSpotlightMoviesAndSeries();
  fetchTopRatedAnimations();
  fetchTopAiringAnimations();
  fetchMovies(); // Movies section
  fetchSeries(); // TV Series section
  fetchUpcomingMovies(); // Upcoming Movies section
  fetchAnimationTVShows()
  hideLoader()
};
