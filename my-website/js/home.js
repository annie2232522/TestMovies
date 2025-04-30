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
    try {
        const res = await fetch(`${BASE_URL}/trending/tv/week?api_key=${API_KEY}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.status_message);
        return data.results.filter(item => item.original_language === 'ja' && item.genre_ids.includes(16));
    } catch (error) {
        console.error("Error fetching trending anime:", error);
        return [];
    }
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
}

function closeModal() {
    document.getElementById('modal').style.display = 'none';
}

function toggleMode() {
    isDarkMode = !isDarkMode;
    document.body.classList.toggle('dark-mode', isDarkMode);
    document.getElementById('mode-toggle').textContent = isDarkMode ? '☀️' : '🌙';
}

async function handleSearch(event) {
    const query = document.getElementById('search-input').value.trim();
    const container = document.getElementById('search-results');
    
    if (!query) {
        container.innerHTML = '';
        return;
    }

    try {
        const res = await fetch(`${BASE_URL}/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(query)}`);
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.status_message);
        
        container.innerHTML = ''; // Clear previous results
        if (data.results.length === 0) {
            container.innerHTML = '<p>No results found.</p>';
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
