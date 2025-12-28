/**
 * Groovy Music - نسخه متصل به بک‌اند Cloudflare Workers
 * این اسکریپت داده‌ها را از API دریافت می‌کند.
 */

document.addEventListener('DOMContentLoaded', async () => {
    // آدرس Worker شما (باید بعد از دیپلوی اینجا قرار بگیرد)
    // اگر فرانت و ورکر روی یک دامنه باشند، از آدرس نسبی استفاده می‌کنیم
    const API_URL = '/api'; 

    let musicDatabase = [];
    let artistDatabase = [];

    // =================================================================
    // دریافت داده‌ها از سرور
    // =================================================================
    async function fetchData() {
        try {
            const response = await fetch(`${API_URL}/all`);
            const data = await response.json();
            musicDatabase = data.songs || [];
            artistDatabase = data.artists || [];
            
            // مقداردهی اولیه بعد از دریافت داده‌ها
            initializePlayer();
        } catch (error) {
            console.error("خطا در دریافت داده‌ها از سرور:", error);
        }
    }

    // =================================================================
    // تنظیمات کش و دیتابیس محلی (LocalStorage)
    // =================================================================
    const RECENTS_KEY = 'groovyRecentSongs';
    const FAVOURITES_KEY = 'groovyFavouriteSongs';
    const FILTER_ARTIST_KEY = 'groovyFilterArtist';

    function addSongToRecents(song) {
        if (!song || !song.src) return;
        let recents = JSON.parse(localStorage.getItem(RECENTS_KEY)) || [];
        recents = recents.filter(src => src !== song.src);
        recents.unshift(song.src);
        recents = recents.slice(0, 20);
        localStorage.setItem(RECENTS_KEY, JSON.stringify(recents));
    }

    function isSongFavourited(songSrc) {
        const favourites = JSON.parse(localStorage.getItem(FAVOURITES_KEY)) || [];
        return favourites.includes(songSrc);
    }

    function toggleFavourite(songSrc) {
        let favourites = JSON.parse(localStorage.getItem(FAVOURITES_KEY)) || [];
        if (favourites.includes(songSrc)) {
            favourites = favourites.filter(src => src !== songSrc);
        } else {
            favourites.unshift(songSrc);
        }
        localStorage.setItem(FAVOURITES_KEY, JSON.stringify(favourites));
    }

    // =================================================================
    // متغیرهای پخش‌کننده و انتخابگرها
    // =================================================================
    let currentSongIndex = 0;
    let isPlaying = false;
    let currentPlaylist = [];

    const audio = document.getElementById('audio-player');
    const playPauseBtn = document.getElementById('play-pause-btn');
    const topChartsList = document.getElementById('top-charts-list');
    // ... سایر انتخابگرها (مشابه نسخه قبل)

    // =================================================================
    // توابع رندرینگ (Rendering)
    // =================================================================
    function renderTopCharts(songsToDisplay) {
        if (!topChartsList) return;
        topChartsList.innerHTML = '';
        currentPlaylist = [...songsToDisplay];

        if (songsToDisplay.length === 0) {
            topChartsList.innerHTML = `<li class="text-gray-400 p-4">آهنگی پیدا نشد.</li>`;
            return;
        }
        
        songsToDisplay.forEach((song, index) => {
            const songItem = document.createElement('li');
            songItem.className = "flex items-center gap-4 p-2 rounded-lg hover:bg-gray-800 cursor-pointer song-item";
            songItem.setAttribute('data-index', index);
            
            const isFavourited = isSongFavourited(song.src);
            
            songItem.innerHTML = `
                <span class="text-gray-400 font-medium">${(index + 1).toString().padStart(2, '0')}</span>
                <img src="${song.cover}" alt="${song.title}" class="w-10 h-10 rounded-md object-cover">
                <div class="flex-1">
                    <h4 class="font-semibold text-white text-sm">${song.title}</h4>
                    <p class="text-xs text-gray-400">${song.artist}</p>
                </div>
                <button class="text-gray-400 hover:text-white favourite-btn ${isFavourited ? 'text-blue-600' : ''}" data-song-src="${song.src}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="${isFavourited ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                </button>
            `;
            topChartsList.appendChild(songItem);
        });
    }

    // تابع اصلی برای راه‌اندازی منطق پخش‌کننده (بخش‌های تکراری از نسخه قبل حذف شده تا حجم کم شود)
    function initializePlayer() {
        renderTopArtists();
        
        const pageTitle = document.querySelector('title').textContent;
        const artistToFilter = localStorage.getItem(FILTER_ARTIST_KEY);

        if (artistToFilter) {
            filterSongsByArtist(artistToFilter);
            localStorage.removeItem(FILTER_ARTIST_KEY);
        } else if (pageTitle.includes('Recently Played')) {
            renderRecentlyPlayed();
        } else if (pageTitle.includes('Favourites')) {
            renderFavourites();
        } else {
            renderTopCharts(musicDatabase);
        }

        // بارگذاری اولین آهنگ در پلیر
        if (musicDatabase.length > 0) {
            currentPlaylist = [...musicDatabase];
            loadSong(0);
        }
    }

    // شروع فرآیند دریافت داده
    fetchData();
});