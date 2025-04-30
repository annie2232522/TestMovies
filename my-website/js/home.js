const API_KEY = '7ee3f44e92211fe941b4243a38e99265'; // Replace with your actual API key
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/original';
let currentItem = null;
let isDarkMode = false;

async function fetchTrending(type) {
    try {
        const res = await fetch(`${BASE_URL}/trending/${type}/week?api_key=${API_KEY}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.status_message);
        return data.results;
    } catch (error) {
        console.error("Error fetching trending:", error);
        return [];
    }
}

async function fetchTrendingAnime() {
    let allResults = [];
    for (let page = 1; page <= 5; page++) {
        try {
            const res = await fetch(`${BASE_URL}/trending/tv/week?api_key=${API_KEY}&page=${page}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.status_message);
            const filtered = data.results.filter(item =>
                item.original_language === 'ja' && item.genre_ids.includes(16)
            );
            allResults = allResults.concat(filtered);
        } catch (error) {
            console.error("Error fetching trending anime:", error);
        }
    }
    return allResults;
}

async function fetchTrendingKDrama() {
    try {
        const res = await fetch(`${BASE_URL}/trending/tv/week?api_key=${API_KEY}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.status_message);
        return data.results.filter(item => item.original_language === 'ko');
    } catch (error) {
        console.error("Error fetching K-Drama:", error);
        return [];
    }
}

function displayBanner(item) {
    if (item) {
        document.getElementById('banner').style.backgroundImage = `url(${IMG_URL}${item.backdrop_path})`;
        document.getElementById('banner-title').textContent = item.title || item.name;
    }
}

function displayList(items, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    items.forEach(item => {
        if (!item.poster_path) return;
        const img = document.createElement('img');
        img.src = `${IMG_URL}${item.poster_path}`;
        img.alt = item.title || item.name;
        img.onclick = () => showDetails(item);
        container.appendChild(img);
    });
}

async function showDetails(item) {
    currentItem = item;
    document.getElementById('modal-title').textContent = item.title || item.name;
    document.getElementById('modal-description').textContent = item.overview;
    document.getElementById('modal-image').src = `${IMG_URL}${item.poster_path}`;
    document.getElementById('modal-rating').innerHTML = '★'.repeat(Math.round(item.vote_average / 2));
    document.getElementById('modal').style.display = 'flex';
    changeServer();
    
    // Reset season/episode pickers
    document.getElementById('season-picker').innerHTML = '';
    document.getElementById('episode-picker').innerHTML = '';
    document.getElementById('episode-list').innerHTML = '';

    if (item.media_type === 'tv') {
        const show = await fetchShowDetails(item.id);
        show.seasons.forEach(season => {
            if (season.season_number === 0) return;
            const option = document.createElement('option');
            option.value = season.season_number;
            option.textContent = `Season ${season.season_number}`;
            document.getElementById('season-picker').appendChild(option);
        });
        await loadSeasonEpisodes();
    }
}

async function fetchShowDetails(tvId) {
    try {
        const res = await fetch(`${BASE_URL}/tv/${tvId}?api_key=${API_KEY}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.status_message);
        return data;
    } catch (error) {
        console.error("Error fetching show details:", error);
    }
}

async function fetchEpisodes(tvId, seasonNumber = 1) {
    try {
        const res = await fetch(`${BASE_URL}/tv/${tvId}/season/${seasonNumber}?api_key=${API_KEY}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.status_message);
        return data.episodes;
    } catch (error) {
        console.error("Error fetching episodes:", error);
        return [];
    }
}

async function loadSeasonEpisodes() {
    const seasonNumber = document.getElementById('season-picker').value;
    const episodes = await fetchEpisodes(currentItem.id, seasonNumber);
    const episodeList = document.getElementById('episode-list');
    episodeList.innerHTML = '';

    if (episodes.length > 0) {
        episodes.forEach(ep => {
            const episodeButton = document.createElement('button');
            episodeButton.className = 'episode-button';
            episodeButton.textContent = `Episode ${ep.episode_number}`;
            episodeButton.onclick = () => {
                changeServer(); // Ensure server is set
                const server = document.getElementById('server-selector').value;
                const type = currentItem.media_type === 'movie' ? 'movie' : 'tv';
                window.open(`https://${server}/embed/${type}/${currentItem.id}/episode/${ep.episode_number}`, '_blank');
            };
            episodeList.appendChild(episodeButton);
        });
    }
}

function toggleMode() {
    isDarkMode = !isDarkMode;
    document.body.classList.toggle('dark-mode', isDarkMode);
    document.getElementById('mode-toggle').textContent = isDarkMode ? '☀️' : '🌙'; // Change button icon
}

function changeServer() {
    const server = document.getElementById('server-selector').value; // Changed to get selected server
    const type = currentItem.media_type === 'movie' ? 'movie' : 'tv';
    document.getElementById('modal-video').src = `https://${server}/embed/${type}/${currentItem.id}`;
}

function closeModal() {
    document.getElementById('modal').style.display = 'none';
    document.getElementById('modal-video').src = '';
}

function goBack() {
    document.getElementById('modal').style.display = 'none'; // Close modal
}

function openSearchModal() {
    document.getElementById('search-modal').style.display = 'flex';
    document.getElementById('search-input').focus();
}

function closeSearchModal() {
    document.getElementById('search-modal').style.display = 'none';
    document.getElementById('search-results').innerHTML = '';
}

function handleSearch(event) {
    searchTMDB(); // Trigger search on every input
}

async function searchTMDB() {
    const query = document.getElementById('search-input').value.trim();
    if (!query) {
        document.getElementById('search-results').innerHTML = '';
        return;
    }

    try {
        const res = await fetch(`${BASE_URL}/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(query)}`);
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.status_message); // Handle API errors
        
        const container = document.getElementById('search-results');
        container.innerHTML = '';
        if (data.results.length === 0) {
            container.innerHTML = '<p>No results found.</p>'; // Display message if no results
            return;
        }
        
        data.results.forEach(item => {
            if (!item.poster_path) return;
            const img = document.createElement('img');
            img.src = `${IMG_URL}${item.poster_path}`;
            img.alt = item.title || item.name;
            img.onclick = () => {
                closeSearchModal();
                showDetails(item);
            };
            container.appendChild(img);
        });
    } catch (error) {
        console.error("Error searching TMDB:", error);
    }
}

async function init() {
    const movies = await fetchTrending('movie');
    const tvShows = await fetchTrending('tv');
    const anime = await fetchTrendingAnime();
    const kdrama = await fetchTrendingKDrama();
    
    displayBanner(movies[Math.floor(Math.random() * movies.length)]);
    displayList(movies, 'movies-list');
    displayList(tvShows, 'tvshows-list');
    displayList(anime, 'anime-list');
    displayList(kdrama, 'kdrama-list');
}

init();
