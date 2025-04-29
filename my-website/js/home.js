// TMDB API Key
const tmdbApiKey = '7ee3f44e92211fe941b4243a38e99265'; // Replace with your actual TMDB API key

// Toggle Dark/Light Mode
document.getElementById('theme-toggle').addEventListener('click', () => {
    document.body.classList.toggle('dark');
});

// Switch Tabs
document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', () => {
        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        const tabName = button.getAttribute('data-tab');
        document.querySelectorAll('.tab-page').forEach(tab => tab.classList.add('hidden'));
        document.getElementById(tabName).classList.remove('hidden');
    });
});

// Movie, TV Show, and Anime Search Functionality
document.getElementById('search-bar').addEventListener('input', async () => {
    const query = document.getElementById('search-bar').value.trim();
    if (query) {
        await searchItems(query);
    }
});

async function searchItems(query) {
    const movieRes = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${tmdbApiKey}&query=${query}`);
    const movieData = await movieRes.json();
    const tvRes = await fetch(`https://api.themoviedb.org/3/search/tv?api_key=${tmdbApiKey}&query=${query}`);
    const tvData = await tvRes.json();
    const animeRes = await fetch(`https://api.jikan.moe/v4/anime?search=${query}`);
    const animeData = await animeRes.json();
    
    displayItems(movieData.results, 'movies');
    displayItems(tvData.results, 'tvshows');
    displayItems(animeData.data, 'anime');
}

// Display Items (Movies, TV Shows, or Anime)
function displayItems(items, tab) {
    const container = document.getElementById(tab);
    container.innerHTML = ''; // Clear existing content

    // Check if there are items
    if (!items || items.length === 0) {
        container.innerHTML = '<p>No results found</p>';
        return;
    }

    items.forEach(item => {
        const img = document.createElement('img');
        img.src = item.poster_path ? `https://image.tmdb.org/t/p/w200${item.poster_path}` : 'https://via.placeholder.com/200x300?text=No+Image';
        img.alt = item.title || item.name || item.title_english;
        img.classList.add(`${tab}-poster`);
        img.onclick = () => showDetails(item, tab);
        container.appendChild(img);
    });
}

// Open Modal with Item Details
async function showDetails(item, tab) {
    const modal = document.getElementById('modal');
    modal.classList.remove('hidden');
    document.getElementById('modal-title').textContent = item.title || item.name;
    document.getElementById('modal-image').src = item.poster_path ? `https://image.tmdb.org/t/p/original${item.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Image';
    document.getElementById('modal-description').textContent = item.overview || 'No description available';

    // Servers and Player URLs (Dummy Servers for example)
    const servers = [
        { name: 'vidsrc.me', url: `https://player.vidsrc.me/embed/${item.id}` },
        { name: 'vidjoy.pro', url: `https://vidjoy.pro/embed/movie/${item.id}` },
        { name: 'mixdrop.sb', url: `https://mixdrop.sb/embed/${item.id}` }
    ];

    const serverPicker = document.getElementById('server-picker');
    serverPicker.innerHTML = ''; // Clear existing options
    servers.forEach(server => {
        const option = document.createElement('option');
        option.value = server.url;
        option.textContent = server.name;
        serverPicker.appendChild(option);
    });

    // Auto-select the first server and load video
    loadVideo(servers[0].url);

    // Retry button logic
    document.getElementById('retry-button').addEventListener('click', () => {
        loadVideo(servers[0].url);
    });

    // Close modal when pressing close button
    document.getElementById('close-modal').addEventListener('click', () => {
        modal.classList.add('hidden');
    });

    // Load selected video from dropdown
    serverPicker.addEventListener('change', (e) => {
        loadVideo(e.target.value);
    });
}

// Load Video on Selected Server
function loadVideo(url) {
    const iframe = document.getElementById('modal-video');
    iframe.src = url; // Set the iframe source to the selected server's URL
    document.getElementById('server-status').textContent = `Now playing from: ${url}`;
}

// Initialize the app
function init() {
    fetchMovies();
    fetchTVShows();
    fetchAnime();
}

async function fetchMovies() {
    const res = await fetch(`https://api.themoviedb.org/3/trending/movie/week?api_key=${tmdbApiKey}`);
    const data = await res.json();
    displayItems(data.results, 'movies');
}

async function fetchTVShows() {
    const res = await fetch(`https://api.themoviedb.org/3/trending/tv/week?api_key=${tmdbApiKey}`);
    const data = await res.json();
    displayItems(data.results, 'tvshows');
}

async function fetchAnime() {
    const res = await fetch('https://api.jikan.moe/v4/anime');
    const data = await res.json();
    displayItems(data.data, 'anime');
}

init();
