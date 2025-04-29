// Add your TMDB API key here
const tmdbApiKey = '7ee3f44e92211fe941b4243a38e99265'; // Replace with your actual TMDB API key

// Toggle Search Bar visibility
document.getElementById('search-toggle').addEventListener('click', () => {
    const searchBar = document.getElementById('search-bar');
    searchBar.classList.toggle('hidden');
    if (!searchBar.classList.contains('hidden')) {
        searchBar.focus();
    }
});

// Close modal on Escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.getElementById('search-bar').classList.add('hidden');
        document.getElementById('modal').classList.add('hidden');
    }
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

// Toggle Dark/Light Mode
document.getElementById('theme-toggle').addEventListener('click', () => {
    document.body.classList.toggle('dark');
});

// Open Modal with Item Details
async function showDetails(item) {
    const modal = document.getElementById('modal');
    modal.classList.remove('hidden');
    document.getElementById('modal-title').textContent = item.title || item.name;
    document.getElementById('modal-image').src = `https://image.tmdb.org/t/p/original${item.poster_path}`;
    document.getElementById('modal-description').textContent = item.overview;

    // Fetch and show servers for video
    // Replace the following with actual server-fetch logic for your case

    // Example server list:
    const servers = ['vidsrc.me', 'vidjoy.pro', 'flixhq.to'];

    const serverPicker = document.getElementById('server-picker');
    serverPicker.innerHTML = '';
    servers.forEach(server => {
        const option = document.createElement('option');
        option.value = server;
        option.textContent = server;
        serverPicker.appendChild(option);
    });

    // Video iframe loading (simple server example)
    loadVideo(servers[0]);

    document.getElementById('retry-button').addEventListener('click', () => {
        loadVideo(servers[0]); // Retry with the first server
    });

    // Close modal when pressing close button
    document.getElementById('close-modal').addEventListener('click', () => {
        modal.classList.add('hidden');
    });
}

// Load Video on Selected Server
function loadVideo(server) {
    const iframe = document.getElementById('modal-video');
    iframe.src = `https://${server}/embed/movie/${currentItem.id}`;
}

// Example data fetch for Movies, TV Shows, and Anime (simplified)
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
    const res = await fetch('https://api.jikan.moe/v4/top/anime?type=movie');
    const data = await res.json();
    displayItems(data.data, 'anime');
}

// Display Items (Movies, TV Shows, or Anime) on the respective tab
function displayItems(items, tab) {
    const container = document.getElementById(tab);
    container.innerHTML = '';
    items.forEach(item => {
        const img = document.createElement('img');
        img.src = `https://image.tmdb.org/t/p/original${item.poster_path}`;
        img.alt = item.title || item.name;
        img.onclick = () => showDetails(item);
        container.appendChild(img);
    });
}

// Initialize the app
function init() {
    fetchMovies();
    fetchTVShows();
    fetchAnime();
}

init();
