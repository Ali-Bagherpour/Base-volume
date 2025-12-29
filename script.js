
document.addEventListener('DOMContentLoaded', async () => {
    const API_URL = 'https://groovy-backend.alibagherpour-sadafi.workers.dev';
    const cleanBaseUrl = API_URL.replace(/\/$/, '');
    let musicDatabase = [];
    let artistDatabase = [];
    let currentPlaylist = [];
    let currentSongIndex = 0;
    const audio = document.getElementById('audio-player');
    const topChartsList = document.getElementById('top-charts-list');
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');
    const chartsSubtitle = document.getElementById('charts-subtitle');
    const recentList = document.getElementById('recent-songs-list');
    const sidebar = document.getElementById('main-sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const openSidebarBtn = document.getElementById('open-sidebar');
    const closeSidebarBtn = document.getElementById('close-sidebar');
    const playerBar = document.getElementById('player-bar');
    const playerTitle = document.getElementById('player-title');
    const playerArtist = document.getElementById('player-artist');
    const playerCoverArt = document.getElementById('player-cover-art');
    const progressBar = document.getElementById('progress-bar');
    const mobileProgressBar = document.getElementById('mobile-progress-bar');
    const progressContainer = document.getElementById('progress-container');
    const currentTimeEl = document.getElementById('current-time');
    const totalDurationEl = document.getElementById('total-duration');
    const playPauseBtn = document.getElementById('play-pause-btn');
    const mobilePlayBtn = document.getElementById('mobile-play-pause-btn');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const desktopPlayIcon = document.getElementById('play-icon');
    const desktopPauseIcon = document.getElementById('pause-icon');
    const mobilePlayIcon = document.getElementById('mobile-play-icon');
    const mobilePauseIcon = document.getElementById('mobile-pause-icon');
    const RECENTS_KEY = 'groovyRecentSongs';
    const FAVOURITES_KEY = 'groovyFavouriteSongs';
    const FILTER_ARTIST_KEY = 'groovyFilterArtist';

    function updatePlayerIcons(isPlaying) {
        if (isPlaying) {
            desktopPlayIcon?.classList.add('hidden');
            desktopPauseIcon?.classList.remove('hidden');
            mobilePlayIcon?.classList.add('hidden');
            mobilePauseIcon?.classList.remove('hidden');
        } else {
            desktopPlayIcon?.classList.remove('hidden');
            desktopPauseIcon?.classList.add('hidden');
            mobilePlayIcon?.classList.remove('hidden');
            mobilePauseIcon?.classList.add('hidden');
        }
    }

    function playSong() {
        audio.play().catch(e => console.error('Playback error:', e));
    }

    function pauseSong() {
        audio.pause();
    }

    function togglePlayPause() {
        audio.paused ? playSong() : pauseSong();
    }

    function loadSong(index) {
        if (!currentPlaylist[index]) return;
        const song = currentPlaylist[index];
        audio.src = song.src;
        playerTitle.textContent = song.title;
        playerArtist.textContent = song.artist;
        playerCoverArt.src = song.cover;
        progressBar.style.width = '0%';
        mobileProgressBar.style.width = '0%';
        currentTimeEl.textContent = '0:00';
        const heroTitle = document.getElementById('hero-title');
        if (heroTitle) {
            heroTitle.textContent = song.title;
            document.getElementById('hero-artist').textContent = song.artist;
            const heroImg = document.getElementById('hero-image');
            heroImg.src = song.cover || 'https://placehold.co/320x320/2563eb/FFF?text=Music+Art';
        }
        playerBar.classList.add('active');
        addSongToRecents(song);
    }

    function prevSong() {
        currentSongIndex = (currentSongIndex - 1 + currentPlaylist.length) % currentPlaylist.length;
        loadSong(currentSongIndex);
        playSong();
    }

    function nextSong() {
        currentSongIndex = (currentSongIndex + 1) % currentPlaylist.length;
        loadSong(currentSongIndex);
        playSong();
    }

    playPauseBtn?.addEventListener('click', togglePlayPause);
    mobilePlayBtn?.addEventListener('click', togglePlayPause);
    prevBtn?.addEventListener('click', prevSong);
    nextBtn?.addEventListener('click', nextSong);
    audio.addEventListener('play', () => updatePlayerIcons(true));
    audio.addEventListener('pause', () => updatePlayerIcons(false));
    audio.addEventListener('ended', nextSong);

    audio.addEventListener('timeupdate', () => {
        if (!audio.duration) return;
        const percent = (audio.currentTime / audio.duration) * 100;
        progressBar.style.width = `${percent}%`;
        mobileProgressBar.style.width = `${percent}%`;
        currentTimeEl.textContent = formatTime(audio.currentTime);
        totalDurationEl.textContent = formatTime(audio.duration);
    });

    progressContainer?.addEventListener('click', (e) => {
        const width = progressContainer.clientWidth;
        const clickX = e.offsetX;
        audio.currentTime = (clickX / width) * audio.duration;
    });

    function toggleSidebar() {
        sidebar.classList.toggle('-translate-x-full');
        overlay.classList.toggle('hidden');
    }

    openSidebarBtn?.addEventListener('click', toggleSidebar);
    closeSidebarBtn?.addEventListener('click', toggleSidebar);
    overlay?.addEventListener('click', toggleSidebar);

    function formatTime(secs) {
        if (isNaN(secs)) return '0:00';
        const m = Math.floor(secs / 60);
        const s = Math.floor(secs % 60);
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    }

    function addSongToRecents(song) {
        let recents = JSON.parse(localStorage.getItem(RECENTS_KEY)) || [];
        recents = recents.filter(s => s.src !== song.src);
        recents.unshift(song);
        localStorage.setItem(RECENTS_KEY, JSON.stringify(recents.slice(0, 20)));
        if(recentList) {
            renderRecentList(recents.slice(0, 5));
        }
    }

    function isSongFavourited(src) {
        const favs = JSON.parse(localStorage.getItem(FAVOURITES_KEY)) || [];
        return favs.includes(src);
    }

    function toggleFavourite(src) {
        let favs = JSON.parse(localStorage.getItem(FAVOURITES_KEY)) || [];
        if (favs.includes(src)) {
            favs = favs.filter(f => f !== src);
        } else {
            favs.push(src);
        }
        localStorage.setItem(FAVOURITES_KEY, JSON.stringify(favs));
    }
    
    async function fetchData() {
        try {
            const res = await fetch(`${cleanBaseUrl}/all`);
            const data = await res.json();
            musicDatabase = data.songs || [];
            artistDatabase = data.artists || [];
            initializeUI();
            console.log("Loaded data from API successfully");
        } catch (err) {
            console.error('Fetch error:', err);
            if (topChartsList) {
                topChartsList.innerHTML = '<li class="p-4 text-center text-red-400">Error connecting to server. Please try again later.</li>';
            }
        }
    }

    function renderTopCharts(songs) {
        if (!topChartsList) return;
        topChartsList.innerHTML = '';
        currentPlaylist = [...songs];
        if (songs.length === 0) {
            topChartsList.innerHTML = '<li class="p-4 text-center text-gray-500">No songs found.</li>';
            return;
        }
        songs.forEach((song, idx) => {
            const li = document.createElement('li');
            li.className = 'flex items-center gap-3 p-3 rounded-xl bg-gray-800/40 hover:bg-gray-800 transition-all cursor-pointer group';
            li.innerHTML = `
                <img src="${song.cover}" class="w-12 h-12 rounded-lg object-cover" onerror="this.src='https://placehold.co/48x48'">
                <div class="flex-1 min-w-0">
                    <h4 class="text-sm font-bold text-white truncate">${song.title}</h4>
                    <p class="text-xs text-gray-500 truncate">${song.artist}</p>
                </div>
                <button class="fav-btn text-gray-500 hover:text-red-500 p-2" data-src="${song.src}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="${isSongFavourited(song.src) ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                </button>
            `;
            li.addEventListener('click', (e) => {
                if (e.target.closest('.fav-btn')) {
                    e.stopPropagation();
                    toggleFavourite(song.src);
                    e.target.closest('.fav-btn').querySelector('svg').setAttribute('fill', isSongFavourited(song.src) ? 'currentColor' : 'none');
                    return;
                }
                currentSongIndex = idx;
                loadSong(idx);
                playSong();
            });
            topChartsList.appendChild(li);
        });
    }

    function renderRecentList(songs) {
        if (!recentList) return;
        recentList.innerHTML = '';
        if (songs.length === 0) {
            recentList.innerHTML = '<li class="p-4 text-center text-gray-500 text-xs">No recent songs</li>';
            return;
        }
        songs.forEach((song, idx) => {
            const li = document.createElement('li');
            li.className = 'flex items-center gap-3 p-2 rounded-xl hover:bg-gray-800 transition-all cursor-pointer group';
            li.innerHTML = `
                <img src="${song.cover}" class="w-8 h-8 rounded object-cover" onerror="this.src='https://placehold.co/32x32'">
                <div class="flex-1 min-w-0">
                    <h4 class="text-xs font-bold text-white truncate">${song.title}</h4>
                    <p class="text-[10px] text-gray-500 truncate">${song.artist}</p>
                </div>
            `;
            li.addEventListener('click', () => {
                currentPlaylist = songs;
                currentSongIndex = idx;
                loadSong(idx);
                playSong();
            });
            recentList.appendChild(li);
        });
    }

    let searchTimeout;
    searchInput?.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        const query = e.target.value.trim();
        if (query.length < 2) {
            searchResults?.classList.add('hidden');
            return;
        }
        searchTimeout = setTimeout(async () => {
            try {
                const res = await fetch(`${cleanBaseUrl}/search?q=${encodeURIComponent(query)}`);
                const data = await res.json();
                renderSearchResults(data.songs || [], data.artists || []);
            } catch (err) {
                console.error('Search error:', err);
            }
        }, 300);
    });

    function renderSearchResults(songs, artists) {
        if (!searchResults) return;
        searchResults.innerHTML = '';
        if (songs.length === 0 && artists.length === 0) {
            searchResults.innerHTML = '<div class="p-4 text-sm text-gray-400 text-center">No results found.</div>';
        } else {
            artists.forEach(artist => {
                const div = document.createElement('div');
                div.className = 'flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-700/50 transition-colors';
                div.innerHTML = `
                    <img src="${artist.image}" class="w-10 h-10 rounded-full object-cover" onerror="this.src='https://placehold.co/40x40'">
                    <div>
                        <div class="text-white font-bold">${artist.name}</div>
                        <div class="text-xs text-gray-400">Artist</div>
                    </div>
                `;
                div.addEventListener('click', () => {
                    localStorage.setItem(FILTER_ARTIST_KEY, artist.name);
                    window.location.reload(); 
                });
                searchResults.appendChild(div);
            });

            songs.forEach(song => {
                const div = document.createElement('div');
                div.className = 'flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-700/50 transition-colors';
                div.innerHTML = `
                    <img src="${song.cover}" class="w-10 h-10 rounded object-cover" onerror="this.src='https://placehold.co/40x40'">
                    <div>
                        <div class="text-white font-bold">${song.title}</div>
                        <div class="text-xs text-gray-400">${song.artist}</div>
                    </div>
                `;
                div.addEventListener('click', () => {
                    currentPlaylist = [song];
                    currentSongIndex = 0;
                    loadSong(0);
                    playSong();
                    searchResults.classList.add('hidden');
                    searchInput.value = '';
                });
                searchResults.appendChild(div);
            });
        }
        searchResults.classList.remove('hidden');
    }
    
    document.addEventListener('click', (e) => {
        if (!e.target.closest('#search-container')) {
            searchResults?.classList.add('hidden');
        }
    });
    
    function initializeUI() {
        const filterArtist = localStorage.getItem(FILTER_ARTIST_KEY);
        const recents = JSON.parse(localStorage.getItem(RECENTS_KEY)) || [];
        renderRecentList(recents.slice(0, 5));
        if (filterArtist) {
            const filtered = musicDatabase.filter(s => s.artist === filterArtist);
            renderTopCharts(filtered);
            chartsSubtitle && (chartsSubtitle.textContent = `Songs by ${filterArtist}`);
            localStorage.removeItem(FILTER_ARTIST_KEY);
        } else {
            renderTopCharts(musicDatabase);
        }
        const heroBtn = document.getElementById('hero-play-btn');
        if (heroBtn && musicDatabase.length > 0) {
            heroBtn.addEventListener('click', () => {
                currentPlaylist = [...musicDatabase];
                currentSongIndex = 0;
                loadSong(0);
                playSong();
            });
        }
    }
    
    fetchData();
});