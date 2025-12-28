/**
 * Groovy Music - نسخه بهینه‌سازی شده برای موبایل و دیتابیس D1
 * ساختار جدید: صفحات فرعی در پوشه pages قرار دارند
 */

document.addEventListener('DOMContentLoaded', async () => {
    const API_URL = 'https://groovy-backend.alibagherpour-sadafi.workers.dev'; 

    let musicDatabase = [];
    let artistDatabase = [];
    let currentPlaylist = [];
    let currentSongIndex = 0;
    let isPlaying = false;

    // تشخیص اینکه آیا در پوشه pages هستیم یا روت اصلی
    const isInPagesFolder = window.location.pathname.includes('/pages/');

    // انتخابگرهای DOM
    const audio = document.getElementById('audio-player');
    const topChartsList = document.getElementById('top-charts-list');
    const topArtistsContainer = document.getElementById('top-artists-container');
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');
    
    // المان‌های موبایل و Sidebar
    const sidebar = document.getElementById('main-sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const openSidebarBtn = document.getElementById('open-sidebar');
    const closeSidebarBtn = document.getElementById('close-sidebar');

    // پلیر
    const playPauseBtn = document.getElementById('play-pause-btn');
    const mobilePlayBtn = document.getElementById('mobile-play-pause-btn');
    const playIcon = document.getElementById('play-icon');
    const pauseIcon = document.getElementById('pause-icon');
    const progressBar = document.getElementById('progress-bar');
    const mobileProgressBar = document.getElementById('mobile-progress-bar');

    // =================================================================
    // ۱. مدیریت رابط کاربری (Mobile Sidebar)
    // =================================================================
    function toggleSidebar() {
        sidebar.classList.toggle('translate-x-full');
        overlay.classList.toggle('hidden');
    }

    if(openSidebarBtn) openSidebarBtn.addEventListener('click', toggleSidebar);
    if(closeSidebarBtn) closeSidebarBtn.addEventListener('click', toggleSidebar);
    if(overlay) overlay.addEventListener('click', toggleSidebar);

    // =================================================================
    // ۲. دریافت داده‌ها
    // =================================================================
    async function fetchData() {
        try {
            const response = await fetch(`${API_URL}/all`);
            const data = await response.json();
            musicDatabase = data.songs || [];
            artistDatabase = data.artists || [];
            initializeUI();
        } catch (error) {
            console.error("خطا در اتصال:", error);
        }
    }

    function renderTopCharts(songs) {
        if (!topChartsList) return;
        topChartsList.innerHTML = '';
        currentPlaylist = [...songs];

        songs.forEach((song, index) => {
            const li = document.createElement('li');
            li.className = "flex items-center gap-3 p-3 rounded-xl bg-gray-800/40 hover:bg-gray-800 transition-all cursor-pointer";
            li.innerHTML = `
                <img src="${song.cover}" class="w-12 h-12 rounded-lg object-cover">
                <div class="flex-1 min-w-0">
                    <h4 class="text-sm font-bold text-white truncate">${song.title}</h4>
                    <p class="text-xs text-gray-500 truncate">${song.artist}</p>
                </div>
                <button class="text-gray-400 p-2"><svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg></button>
            `;
            li.addEventListener('click', (e) => {
                if(!e.target.closest('button')) {
                    currentSongIndex = index;
                    loadSong(index);
                    playSong();
                }
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
                <img src="${artist.image}" class="w-16 h-16 lg:w-12 lg:h-12 rounded-full object-cover mx-auto lg:mx-0">
                <div class="text-center lg:text-right mt-2 lg:mt-0 overflow-hidden">
                    <div class="text-white text-xs lg:text-sm font-bold truncate">${artist.name}</div>
                    <div class="text-[10px] text-gray-500">${artist.followers || '1.2M'} پخش</div>
                </div>
            `;
            
            // کلیک روی هنرمند در صفحه اصلی
            div.addEventListener('click', () => {
                localStorage.setItem('groovyFilterArtist', artist.name);
                const targetUrl = isInPagesFolder ? 'index.html' : 'index.html'; // در اینجا هر دو به ریشه یا صفحه اصلی اشاره دارند اما در ساختار پوشه‌بندی مدیریت می‌شود
                window.location.href = isInPagesFolder ? '../index.html' : 'index.html';
            });

            topArtistsContainer.appendChild(div);
        });
    }

    // =================================================================
    // ۳. مدیریت پلیر
    // =================================================================
    function loadSong(index) {
        const song = currentPlaylist[index];
        if (!song) return;
        audio.src = song.src;
        document.getElementById('player-title').textContent = song.title;
        document.getElementById('player-artist').textContent = song.artist;
        document.getElementById('player-cover-art').src = song.cover;
        
        // بروزرسانی Hero در صفحه اصلی
        const heroTitle = document.getElementById('hero-title');
        if(heroTitle) {
            heroTitle.textContent = song.title;
            document.getElementById('hero-artist').textContent = song.artist;
            document.getElementById('hero-image').src = song.cover;
        }
    }

    function playSong() {
        isPlaying = true;
        audio.play();
        if (playIcon) playIcon.classList.add('hidden');
        if (pauseIcon) pauseIcon.classList.remove('hidden');
    }

    function togglePlayPause() {
        if (isPlaying) {
            isPlaying = false;
            audio.pause();
            if (playIcon) playIcon.classList.remove('hidden');
            if (pauseIcon) pauseIcon.classList.add('hidden');
        } else {
            playSong();
        }
    }

    // =================================================================
    // ۴. نهایی‌سازی
    // =================================================================
    function initializeUI() {
        // مدیریت فیلتر هنرمند در بدو ورود به صفحه اصلی
        const filterArtist = localStorage.getItem('groovyFilterArtist');
        if (!isInPagesFolder && filterArtist) {
            const filteredSongs = musicDatabase.filter(s => s.artist === filterArtist);
            renderTopCharts(filteredSongs);
            const chartsSubtitle = document.getElementById('charts-subtitle');
            if(chartsSubtitle) chartsSubtitle.textContent = `نمایش آهنگ‌های ${filterArtist}`;
            localStorage.removeItem('groovyFilterArtist');
        } else {
            renderTopCharts(musicDatabase);
        }

        renderTopArtists();
        if(musicDatabase.length > 0) loadSong(0);

        if(playPauseBtn) playPauseBtn.addEventListener('click', togglePlayPause);
        if(mobilePlayBtn) mobilePlayBtn.addEventListener('click', togglePlayPause);

        audio.addEventListener('timeupdate', () => {
            const { duration, currentTime } = audio;
            if (duration) {
                const percent = (currentTime / duration) * 100;
                if(progressBar) progressBar.style.width = `${percent}%`;
                if(mobileProgressBar) mobileProgressBar.style.width = `${percent}%`;
                const curTimeEl = document.getElementById('current-time');
                if(curTimeEl) curTimeEl.textContent = formatTime(currentTime);
            }
        });
    }

    function formatTime(secs) {
        const min = Math.floor(secs / 60);
        const s = Math.floor(secs % 60);
        return `${min}:${s < 10 ? '0' : ''}${s}`;
    }

    fetchData();
});