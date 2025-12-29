/**
 * Groovy Music - Corrected & Optimized Logic
 * Fixes: Mobile player controls, icon toggling, state synchronization.
 */

document.addEventListener('DOMContentLoaded', async () => {
    const API_URL = 'https://groovy-backend.alibagherpour-sadafi.workers.dev'; 

    let musicDatabase = [];
    let artistDatabase = [];
    let currentPlaylist = [];
    let currentSongIndex = 0;
    // Detect if we are in a subfolder to fix navigation links
    const isInPagesFolder = window.location.pathname.includes('/pages/');

    // --- DOM Elements Selection ---
    const audio = document.getElementById('audio-player');
    
    // Containers
    const topChartsList = document.getElementById('top-charts-list');
    const topArtistsContainer = document.getElementById('top-artists-container');
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');
    const chartsSubtitle = document.getElementById('charts-subtitle');
    
    // Sidebar Elements
    const sidebar = document.getElementById('main-sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const openSidebarBtn = document.getElementById('open-sidebar');
    const closeSidebarBtn = document.getElementById('close-sidebar');

    // Player Bar Elements
    const playerBar = document.getElementById('player-bar');
    const playerTitle = document.getElementById('player-title');
    const playerArtist = document.getElementById('player-artist');
    const playerCoverArt = document.getElementById('player-cover-art');
    const progressBar = document.getElementById('progress-bar');
    const mobileProgressBar = document.getElementById('mobile-progress-bar');
    const progressContainer = document.getElementById('progress-container');
    const currentTimeEl = document.getElementById('current-time');
    const totalDurationEl = document.getElementById('total-duration');

    // Buttons & Icons (Desktop & Mobile)
    const playPauseBtn = document.getElementById('play-pause-btn');
    const mobilePlayBtn = document.getElementById('mobile-play-pause-btn');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    
    // Icons
    const desktopPlayIcon = document.getElementById('play-icon');
    const desktopPauseIcon = document.getElementById('pause-icon');
    const mobilePlayIcon = document.getElementById('mobile-play-icon');
    const mobilePauseIcon = document.getElementById('mobile-pause-icon');

    // LocalStorage Keys
    const RECENTS_KEY = 'groovyRecentSongs';
    const FAVOURITES_KEY = 'groovyFavouriteSongs';
    const FILTER_ARTIST_KEY = 'groovyFilterArtist';

    // =================================================================
    // 1. Core Player Logic & State Management
    // =================================================================

    /**
     * Updates all Play/Pause icons (Desktop & Mobile) based on state.
     * @param {boolean} isPlaying 
     */
    function updatePlayerIcons(isPlaying) {
        if (isPlaying) {
            // Show Pause, Hide Play
            if(desktopPlayIcon) desktopPlayIcon.classList.add('hidden');
            if(desktopPauseIcon) desktopPauseIcon.classList.remove('hidden');
            if(mobilePlayIcon) mobilePlayIcon.classList.add('hidden');
            if(mobilePauseIcon) mobilePauseIcon.classList.remove('hidden');
        } else {
            // Show Play, Hide Pause
            if(desktopPlayIcon) desktopPlayIcon.classList.remove('hidden');
            if(desktopPauseIcon) desktopPauseIcon.classList.add('hidden');
            if(mobilePlayIcon) mobilePlayIcon.classList.remove('hidden');
            if(mobilePauseIcon) mobilePauseIcon.classList.add('hidden');
        }
    }

    function playSong() {
        if (!audio.src) return;
        audio.play().catch(e => console.error("Playback error:", e));
        // The 'play' event listener will handle the UI update
    }

    function pauseSong() {
        audio.pause();
        // The 'pause' event listener will handle the UI update
    }

    function togglePlayPause() {
        if (audio.paused) {
            playSong();
        } else {
            pauseSong();
        }
    }

    function loadSong(index) {
        if (!currentPlaylist[index]) return;
        const song = currentPlaylist[index];
        
        // Update Audio Source
        audio.src = song.src;
        
        // Update Text Info
        if (playerTitle) playerTitle.textContent = song.title;
        if (playerArtist) playerArtist.textContent = song.artist;
        if (playerCoverArt) playerCoverArt.src = song.cover;

        // Reset Progress
        if (progressBar) progressBar.style.width = '0%';
        if (mobileProgressBar) mobileProgressBar.style.width = '0%';
        if (currentTimeEl) currentTimeEl.textContent = '0:00';

        // Update Hero Section if exists
        const heroTitle = document.getElementById('hero-title');
        if(heroTitle) {
            heroTitle.textContent = song.title;
            document.getElementById('hero-artist').textContent = song.artist;
            document.getElementById('hero-image').src = song.cover;
        }

        // Show Player Bar (Animation)
        if (playerBar) {
            playerBar.classList.add('active');
            // Force visibility styles just in case css class isn't enough
            playerBar.style.opacity = '1';
            playerBar.style.pointerEvents = 'auto';
        }

        // Save to History
        addSongToRecents(song);
    }

    function prevSong() {
        currentSongIndex--;
        if (currentSongIndex < 0) currentSongIndex = currentPlaylist.length - 1;
        loadSong(currentSongIndex);
        playSong();
    }

    function nextSong() {
        currentSongIndex++;
        if (currentSongIndex >= currentPlaylist.length) currentSongIndex = 0;
        loadSong(currentSongIndex);
        playSong();
    }

    // =================================================================
    // 2. Event Listeners (Audio & Controls)
    // =================================================================

    // Bind Controls
    if(playPauseBtn) playPauseBtn.addEventListener('click', togglePlayPause);
    if(mobilePlayBtn) mobilePlayBtn.addEventListener('click', togglePlayPause);
    if(prevBtn) prevBtn.addEventListener('click', prevSong);
    if(nextBtn) nextBtn.addEventListener('click', nextSong);

    // Audio Events - Central Source of Truth for UI
    audio.addEventListener('play', () => updatePlayerIcons(true));
    audio.addEventListener('pause', () => updatePlayerIcons(false));
    audio.addEventListener('ended', nextSong);
    
    // Progress Update
    audio.addEventListener('timeupdate', () => {
        const { duration, currentTime } = audio;
        if (duration) {
            const percent = (currentTime / duration) * 100;
            // Update Desktop Bar
            if(progressBar) progressBar.style.width = `${percent}%`;
            // Update Mobile Bar
            if(mobileProgressBar) mobileProgressBar.style.width = `${percent}%`;
            
            // Update Text
            if(currentTimeEl) currentTimeEl.textContent = formatTime(currentTime);
            if(totalDurationEl) totalDurationEl.textContent = formatTime(duration);
        }
    });

    // Seek Functionality
    if (progressContainer) {
        progressContainer.addEventListener('click', (e) => {
            const width = progressContainer.clientWidth;
            const clickX = e.offsetX;
            const duration = audio.duration;
            if (duration) {
                audio.currentTime = (clickX / width) * duration;
            }
        });
    }

    // =================================================================
    // 3. UI Helper Functions
    // =================================================================

    function toggleSidebar() {
        if(sidebar) sidebar.classList.toggle('translate-x-full'); // For RTL: might need -translate-x-full based on dir
        // Tailwind RTL check: standard 'translate-x-full' works if configured, 
        // but for safety in generic HTML structures:
        if (document.dir === 'rtl') {
             // Logic handles CSS classes, assuming CSS handles direction
        }
        if(overlay) overlay.classList.toggle('hidden');
    }

    if(openSidebarBtn) openSidebarBtn.addEventListener('click', toggleSidebar);
    if(closeSidebarBtn) closeSidebarBtn.addEventListener('click', toggleSidebar);
    if(overlay) overlay.addEventListener('click', toggleSidebar);

    function formatTime(secs) {
        if (isNaN(secs)) return '0:00';
        const min = Math.floor(secs / 60);
        const s = Math.floor(secs % 60);
        return `${min}:${s < 10 ? '0' : ''}${s}`;
    }

    function addSongToRecents(song) {
        if (!song) return;
        let recents = JSON.parse(localStorage.getItem(RECENTS_KEY)) || [];
        recents = recents.filter(s => s.src !== song.src);
        recents.unshift(song);
        localStorage.setItem(RECENTS_KEY, JSON.stringify(recents.slice(0, 20)));
    }

    function isSongFavourited(src) {
        const favs = JSON.parse(localStorage.getItem(FAVOURITES_KEY)) || [];
        return favs.includes(src);
    }

    // =================================================================
    // 4. Data Fetching & Rendering
    // =================================================================

    async function fetchData() {
        try {
            // Remove trailing slash if present to avoid //all
            const cleanBaseUrl = API_URL.replace(/\/$/, "");
            const response = await fetch(`${cleanBaseUrl}/all`);
            const data = await response.json();
            musicDatabase = data.songs || [];
            artistDatabase = data.artists || [];
            initializeUI();
        } catch (error) {
            console.error("Connection Error:", error);
            // Fallback UI or retry logic could go here
        }
    }

    function renderTopCharts(songs) {
        if (!topChartsList) return;
        topChartsList.innerHTML = '';
        currentPlaylist = [...songs];

        if (songs.length === 0) {
            topChartsList.innerHTML = '<li class="text-gray-500 p-4 text-center">No songs found.</li>';
            return;
        }

        songs.forEach((song, index) => {
            const li = document.createElement('li');
            li.className = "flex items-center gap-3 p-3 rounded-xl bg-gray-800/40 hover:bg-gray-800 transition-all cursor-pointer group";
            li.innerHTML = `
                <img src="${song.cover}" class="w-12 h-12 rounded-lg object-cover shadow-sm" onerror="this.src='https://placehold.co/40x40'">
                <div class="flex-1 min-w-0">
                    <h4 class="text-sm font-bold text-white truncate">${song.title}</h4>
                    <p class="text-xs text-gray-500 truncate">${song.artist}</p>
                </div>
                <button class="text-gray-500 hover:text-blue-500 p-2 fav-btn" data-src="${song.src}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="${isSongFavourited(song.src) ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                </button>
            `;
            
            li.addEventListener('click', (e) => {
                // Prevent playing if favourite button is clicked
                if(e.target.closest('.fav-btn')) return;
                
                currentSongIndex = index;
                loadSong(index);
                playSong();
            });

            topChartsList.appendChild(li);
        });
    }

    function renderTopArtists() {
        if (!topArtistsContainer) return;
        topArtistsContainer.innerHTML = '';
        artistDatabase.slice(0, 6).forEach(artist => {
            const div = document.createElement('div');
            div.className = "flex-shrink-0 lg:flex items-center gap-3 bg-gray-800/40 p-2 lg:p-3 rounded-2xl cursor-pointer hover:bg-gray-800 transition-all min-w-[120px]";
            div.innerHTML = `
                <img src="${artist.image}" class="w-16 h-16 lg:w-12 lg:h-12 rounded-full object-cover mx-auto lg:mx-0 shadow-md">
                <div class="text-center lg:text-right mt-2 lg:mt-0 overflow-hidden">
                    <div class="text-white text-xs lg:text-sm font-bold truncate">${artist.name}</div>
                    <div class="text-[10px] text-gray-500">${artist.followers || 'Fans'}</div>
                </div>
            `;
            
            div.addEventListener('click', () => {
                localStorage.setItem('groovyFilterArtist', artist.name);
                window.location.href = isInPagesFolder ? '../index.html' : 'index.html';
            });

            topArtistsContainer.appendChild(div);
        });
    }

    function renderArtistsPage() {
        const artistGrid = document.getElementById('artist-grid');
        if (!artistGrid) return;
        artistGrid.innerHTML = '';
        artistDatabase.forEach(artist => {
            const div = document.createElement('div');
            div.className = "bg-gray-800 rounded-lg p-4 group cursor-pointer hover:bg-gray-700 artist-page-card";
            div.innerHTML = `
                <img src="${artist.image}" class="w-full h-auto rounded-full mb-3 shadow-lg aspect-square object-cover">
                <h3 class="font-semibold text-white truncate text-center">${artist.name}</h3>
                <p class="text-sm text-gray-400 text-center">${artist.followers} Followers</p>
            `;
            div.addEventListener('click', () => {
                localStorage.setItem('groovyFilterArtist', artist.name);
                window.location.href = '../index.html';
            });
            artistGrid.appendChild(div);
        });
    }

    // =================================================================
    // 5. Search Logic (Live & Debounced)
    // =================================================================
    let searchTimeout;
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            const query = e.target.value.trim();
            
            if (query.length < 2) {
                if(searchResults) searchResults.classList.add('hidden');
                return;
            }

            searchTimeout = setTimeout(async () => {
                try {
                    const cleanBaseUrl = API_URL.replace(/\/$/, "");
                    const res = await fetch(`${cleanBaseUrl}/search?q=${encodeURIComponent(query)}`);
                    const data = await res.json();
                    renderSearchResults(data.songs || [], data.artists || []);
                } catch (e) { console.error("Search Error:", e); }
            }, 300);
        });
    }

    function renderSearchResults(songs, artists) {
        if (!searchResults) return;
        searchResults.innerHTML = '';
        
        if (songs.length === 0 && (!artists || artists.length === 0)) {
            searchResults.innerHTML = '<div class="p-4 text-sm text-gray-400 text-center">No results found.</div>';
        } else {
            // Render Artists
            if(artists && artists.length > 0) {
                artists.forEach(artist => {
                    const div = document.createElement('div');
                    div.className = "flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-700 transition-colors border-b border-gray-700/50";
                    div.innerHTML = `
                        <img src="${artist.image}" class="w-8 h-8 rounded-full object-cover">
                        <div>
                            <div class="text-white text-sm font-bold">${artist.name}</div>
                            <div class="text-xs text-gray-400">Artist</div>
                        </div>
                    `;
                    div.addEventListener('click', () => {
                        localStorage.setItem('groovyFilterArtist', artist.name);
                        window.location.href = isInPagesFolder ? '../index.html' : 'index.html';
                    });
                    searchResults.appendChild(div);
                });
            }

            // Render Songs
            songs.forEach(song => {
                const div = document.createElement('div');
                div.className = "flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-700 transition-colors border-b border-gray-700/50";
                div.innerHTML = `
                    <img src="${song.cover}" class="w-8 h-8 rounded object-cover">
                    <div>
                        <div class="text-white text-sm font-bold">${song.title}</div>
                        <div class="text-xs text-gray-400">${song.artist}</div>
                    </div>
                `;
                div.addEventListener('click', () => {
                    currentPlaylist = [song];
                    currentSongIndex = 0;
                    loadSong(0);
                    playSong();
                    searchResults.classList.add('hidden');
                    if (searchInput) searchInput.value = '';
                });
                searchResults.appendChild(div);
            });
        }
        searchResults.classList.remove('hidden');
    }

    // Close search on outside click
    document.addEventListener('click', (e) => {
        if (searchResults && !e.target.closest('#search-container')) {
            searchResults.classList.add('hidden');
        }
    });

    // =================================================================
    // 6. Initialization
    // =================================================================
    function initializeUI() {
        const pageTitle = document.title;
        const filterArtist = localStorage.getItem(FILTER_ARTIST_KEY);

        // Page Routing Logic
        if (filterArtist && !isInPagesFolder) {
            const filtered = musicDatabase.filter(s => s.artist === filterArtist);
            renderTopCharts(filtered);
            if(chartsSubtitle) chartsSubtitle.textContent = `Songs by ${filterArtist}`;
            localStorage.removeItem(FILTER_ARTIST_KEY);
        } else if (pageTitle.includes('Recently Played')) {
            const recents = JSON.parse(localStorage.getItem(RECENTS_KEY)) || [];
            renderTopCharts(recents);
            // Clear button
            const clearBtn = document.getElementById('clear-recent');
            if(clearBtn) {
                clearBtn.addEventListener('click', () => {
                    localStorage.removeItem(RECENTS_KEY);
                    renderTopCharts([]);
                });
            }
        } else if (pageTitle.includes('Favourites')) {
            const favs = JSON.parse(localStorage.getItem(FAVOURITES_KEY)) || [];
            const favSongs = favs.map(src => musicDatabase.find(s => s.src === src)).filter(Boolean);
            renderTopCharts(favSongs);
        } else if (pageTitle.includes('Artists')) {
            renderArtistsPage();
        } else if (topChartsList) {
            renderTopCharts(musicDatabase);
        }

        renderTopArtists();

        // Listen Now Button (Hero)
        const heroPlayBtn = document.getElementById('hero-play-btn');
        if (heroPlayBtn && musicDatabase.length > 0) {
            heroPlayBtn.addEventListener('click', () => {
                currentPlaylist = [...musicDatabase];
                currentSongIndex = 0;
                loadSong(0);
                playSong();
            });
        }
   }
    fetchData();
});