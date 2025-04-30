const API_KEY = '7ee3f44e92211fe941b4243a38e99265'; // Replace with your actual API key
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/original';

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
    document.getElementById('modal-title').textContent = item.title || item.name;
    document.getElementById('modal-description').textContent = item.overview;
    document.getElementById('modal-image').src = `${IMG_URL}${item.poster_path}`;
    document.getElementById('modal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('modal').style.display = 'none';
}

function toggleMode() {
    document.body.classList.toggle('dark-mode');
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
    const anime = await fetchTrending('tv'); // Adjust for anime if needed
    const kdrama = await fetchTrending('tv'); // Adjust for Kdrama if needed

    displayList(movies, 'movies-list');
    displayList(tvShows, 'tvshows-list');
    displayList(anime, 'anime-list');
    displayList(kdrama, 'kdrama-list');
}

function showTab(tabName) {
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => {
        section.style.display = 'none'; // Hide all sections
    });
    document.getElementById(tabName).style.display = 'block'; // Show the selected section
}

// Initialize default tab
showTab('movies');
init();
