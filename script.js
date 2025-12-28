/**
 * Groovy Music - نسخه نهایی متصل به Cloudflare Workers
 * بک‌اِند: https://groovy-backend.alibagherpour-sadafi.workers.dev
 */

document.addEventListener('DOMContentLoaded', async () => {
    // آدرس دقیق ورکر شما
    const API_URL = 'https://groovy-backend.alibagherpour-sadafi.workers.dev'; 

    let musicDatabase = [];
    let artistDatabase = [];
    let currentPlaylist = [];
    let currentSongIndex = 0;
    let isPlaying = false;

    // انتخابگرهای DOM
    const audio = document.getElementById('audio-player');
    const topChartsList = document.getElementById('top-charts-list');
    const topArtistsContainer = document.getElementById('top-artists-container');
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');
    const chartsSubtitle = document.getElementById('charts-subtitle');
    
    // انتخابگرهای پلیر
    const playPauseBtn = document.getElementById('play-pause-btn');
    const playIcon = document.getElementById('play-icon');
    const pauseIcon = document.getElementById('pause-icon');
    const playerTitle = document.getElementById('player-title');
    const playerArtist = document.getElementById('player-artist');
    const playerCoverArt = document.getElementById('player-cover-art');
    const progressBar = document.getElementById('progress-bar');
    const currentTimeEl = document.getElementById('current-time');
    const totalDurationEl = document.getElementById('total-duration');

    // کلیدهای حافظه محلی
    const RECENTS_KEY = 'groovyRecentSongs';
    const FAVOURITES_KEY = 'groovyFavouriteSongs';

    /**
     * بخش ۱: دریافت داده‌ها از دیتابیس D1 از طریق ورکر
     */
    async function fetchData() {
        try {
            console.log("در حال فراخوانی داده‌ها از:", API_URL);
            // حذف اسلش انتهایی آدرس برای جلوگیری از //all
            const cleanBaseUrl = API_URL.replace(/\/$/, "");
            const response = await fetch(`${cleanBaseUrl}/all`);
            
            if (!response.ok) throw new Error('پاسخ سرور با خطا مواجه شد');
            
            const data = await response.json();
            musicDatabase = data.songs || [];
            artistDatabase = data.artists || [];
            
            console.log("اتصال موفق! تعداد آهنگ‌ها:", musicDatabase.length);
            initializeUI();
        } catch (error) {
            console.error("خطا در اتصال به بک‌اِند:", error);
            if (topChartsList) {
                topChartsList.innerHTML = `<li class="text-red-500 p-4 text-center">خطا در دریافت لیست آهنگ‌ها. لطفاً وضعیت Worker و CORS را بررسی کنید.</li>`;
            }
        }
    }

    /**
     * بخش ۲: مدیریت پخش و رندر کردن لیست‌ها
     */
    function renderTopCharts(songs) {
        if (!topChartsList) return;
        topChartsList.innerHTML = '';
        currentPlaylist = [...songs];

        if (songs.length === 0) {
            topChartsList.innerHTML = `<li class="text-gray-500 p-4 text-center italic">آهنگی برای نمایش وجود ندارد.</li>`;
            return;
        }

        songs.forEach((song, index) => {
            const li = document.createElement('li');
            li.className = "flex items-center gap-4 p-2 rounded-lg hover:bg-gray-800 cursor-pointer song-item group transition-all";
            li.setAttribute('data-index', index);
            
            const isFav = isSongFavourited(song.src);

            li.innerHTML = `
                <span class="text-gray-500 font-medium w-4">${index + 1}</span>
                <img src="${song.cover}" class="w-10 h-10 rounded object-cover shadow-md" onerror="this.src='https://placehold.co/40x40?text=Music'">
                <div class="flex-1 overflow-hidden">
                    <h4 class="font-semibold text-white text-sm truncate">${song.title}</h4>
                    <p class="text-xs text-gray-400 truncate">${song.artist}</p>
                </div>
                <button class="favourite-btn transition-colors ${isFav ? 'text-blue-600' : 'text-gray-500 group-hover:text-white'}" data-src="${song.src}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                </button>
            `;

            li.addEventListener('click', (e) => {
                if (!e.target.closest('button')) {
                    currentSongIndex = index;
                    loadSong(index);
                    playSong();
                }
            });
            topChartsList.appendChild(li);
        });
    }

    function loadSong(index) {
        const song = currentPlaylist[index];
        if (!song) return;

        if (audio) {
            audio.src = song.src;
            if (playerTitle) playerTitle.textContent = song.title;
            if (playerArtist) playerArtist.textContent = song.artist;
            if (playerCoverArt) playerCoverArt.src = song.cover;
            
            if (progressBar) progressBar.style.width = '0%';
            if (currentTimeEl) currentTimeEl.textContent = '0:00';
        }
    }

    function playSong() {
        if (!audio || !audio.src) return;
        isPlaying = true;
        audio.play().catch(e => console.warn("خطا در پخش خودکار:", e));
        if (playIcon) playIcon.classList.add('hidden');
        if (pauseIcon) pauseIcon.classList.remove('hidden');
        addSongToRecents(currentPlaylist[currentSongIndex]);
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

    function isSongFavourited(src) {
        const favs = JSON.parse(localStorage.getItem(FAVOURITES_KEY)) || [];
        return favs.includes(src);
    }

    function addSongToRecents(song) {
        if (!song) return;
        let recents = JSON.parse(localStorage.getItem(RECENTS_KEY)) || [];
        recents = recents.filter(s => s.src !== song.src);
        recents.unshift(song);
        localStorage.setItem(RECENTS_KEY, JSON.stringify(recents.slice(0, 20)));
    }

    /**
     * بخش ۳: جست‌وجوی زنده از طریق دیتابیس (Worker)
     */
    let searchTimeout;
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            const query = e.target.value.trim();
            
            if (query.length < 2) {
                if (searchResults) searchResults.classList.add('hidden');
                return;
            }

            searchTimeout = setTimeout(async () => {
                try {
                    const cleanBaseUrl = API_URL.replace(/\/$/, "");
                    const res = await fetch(`${cleanBaseUrl}/search?q=${encodeURIComponent(query)}`);
                    const data = await res.json();
                    renderSearchResults(data.songs || []);
                } catch (e) {
                    console.error("خطا در جست‌وجو:", e);
                }
            }, 300);
        });
    }

    function renderSearchResults(songs) {
        if (!searchResults) return;
        searchResults.innerHTML = '';
        if (songs.length === 0) {
            searchResults.innerHTML = '<div class="p-4 text-sm text-gray-400">نتیجه‌ای یافت نشد.</div>';
        } else {
            songs.forEach(song => {
                const div = document.createElement('div');
                div.className = "flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-700 transition-colors border-b border-gray-700/50";
                div.innerHTML = `
                    <img src="${song.cover}" class="w-8 h-8 rounded object-cover shadow-sm">
                    <div class="overflow-hidden">
                        <div class="text-white text-sm font-bold truncate">${song.title}</div>
                        <div class="text-xs text-gray-400 truncate">${song.artist}</div>
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

    /**
     * مقداردهی اولیه رابط کاربری و رویدادها
     */
    function initializeUI() {
        const pageTitle = document.title;
        
        // تشخیص صفحه فعلی برای نمایش محتوا
        if (pageTitle.includes('Recently Played')) {
            const recents = JSON.parse(localStorage.getItem(RECENTS_KEY)) || [];
            renderTopCharts(recents);
        } else if (pageTitle.includes('Favourites')) {
            const favs = JSON.parse(localStorage.getItem(FAVOURITES_KEY)) || [];
            const favSongs = favs.map(src => musicDatabase.find(s => s.src === src)).filter(Boolean);
            renderTopCharts(favSongs);
        } else if (topChartsList) {
            renderTopCharts(musicDatabase);
        }

        // دکمه پخش/توقف
        if (playPauseBtn) playPauseBtn.addEventListener('click', togglePlayPause);
        
        // نوار پیشرفت موسیقی
        if (audio) {
            audio.addEventListener('timeupdate', () => {
                const { duration, currentTime } = audio;
                if (duration) {
                    const percent = (currentTime / duration) * 100;
                    if (progressBar) progressBar.style.width = `${percent}%`;
                    if (currentTimeEl) currentTimeEl.textContent = formatTime(currentTime);
                    if (totalDurationEl) totalDurationEl.textContent = formatTime(duration);
                }
            });
            
            audio.addEventListener('ended', () => {
                // منطق پخش آهنگ بعدی در صورت تمایل
            });
        }

        // بستن نتایج جست‌وجو با کلیک به بیرون
        document.addEventListener('click', (e) => {
            if (searchResults && !e.target.closest('#search-container')) {
                searchResults.classList.add('hidden');
            }
        });
    }

    function formatTime(secs) {
        if (isNaN(secs)) return '0:00';
        const min = Math.floor(secs / 60);
        const s = Math.floor(secs % 60);
        return `${min}:${s < 10 ? '0' : ''}${s}`;
    }

    // شروع فرآیند
    fetchData();
});