/* ═══════════════════════════════════════════════════
   SoundWave — Application JavaScript
   ═══════════════════════════════════════════════════ */

// ── Song data ──
const songs = [
  { title: 'ทั้งไป',               artist: 'Only Monday',    album: 'ทั้งไป',               duration: '3:45', img: 'https://picsum.photos/200?random=1'  },
  { title: 'Rain Zone',            artist: 'Maiyarap, Z9',   album: 'Rain Zone',             duration: '4:12', img: 'https://picsum.photos/200?random=2'  },
  { title: 'Risk It All',          artist: 'Bruno Mars',     album: 'Bruno Mars',            duration: '3:58', img: 'https://picsum.photos/200?random=3'  },
  { title: 'เหนื่อยเกินไป',        artist: 'LITTLE JOHN',    album: 'เหนื่อยเกินไป',         duration: '4:02', img: 'https://picsum.photos/200?random=4'  },
  { title: 'ขอให้เราทั้งคู่โชคดี', artist: 'Tattoo Colour',  album: 'ขอให้เราทั้งคู่โชคดี',  duration: '5:10', img: 'https://picsum.photos/200?random=5'  },
  { title: 'GO',                   artist: 'BLACKPINK',      album: 'THE ALBUM',             duration: '3:12', img: 'https://picsum.photos/200?random=6'  },
  { title: 'Blinding Lights',      artist: 'The Weeknd',     album: 'After Hours',           duration: '3:20', img: 'https://picsum.photos/200?random=13' },
  { title: 'Shape of You',         artist: 'Ed Sheeran',     album: '÷ (Divide)',            duration: '3:54', img: 'https://picsum.photos/200?random=14' },
  { title: 'Levitating',           artist: 'Dua Lipa',       album: 'Future Nostalgia',      duration: '3:23', img: 'https://picsum.photos/200?random=15' },
  { title: 'Stay',                 artist: 'The Kid LAROI',  album: 'F*CK LOVE 3',          duration: '2:22', img: 'https://picsum.photos/200?random=16' },
];

let currentTrack = 0;
let isPlaying = false;
let isLiked = false;
let progressInterval = null;
let progressValue = 0;

/* ═══════════════════════════════════════════════════
   SPA Router — switch between views
   ═══════════════════════════════════════════════════ */
function navigateTo(viewId) {
  // Hide all views
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  // Show requested view
  const target = document.getElementById(viewId);
  if (target) target.classList.add('active');

  // Show/hide main-page elements (sidebar, player, navbar extras)
  const isMain = viewId === 'view-main';
  const sidebar = document.getElementById('sidebar');
  const player = document.getElementById('player-bar');
  if (sidebar) sidebar.style.display = isMain ? '' : 'none';
  if (player) player.style.display = isMain ? '' : 'none';

  // Update document title
  const titles = {
    'view-main': 'SoundWave – Music for Everyone',
    'view-login': 'Log in – SoundWave',
    'view-signup': 'Sign up – SoundWave',
  };
  document.title = titles[viewId] || 'SoundWave';

  // Update URL hash
  const hashes = { 'view-main': '#/', 'view-login': '#/login', 'view-signup': '#/signup' };
  if (hashes[viewId]) window.location.hash = hashes[viewId];

  // Scroll to top
  window.scrollTo(0, 0);
}

function handleHashRoute() {
  const hash = window.location.hash;
  if (hash === '#/login') navigateTo('view-login');
  else if (hash === '#/signup') navigateTo('view-signup');
  else navigateTo('view-main');
}

/* ═══════════════════════════════════════════════════
   Theme
   ═══════════════════════════════════════════════════ */
function initTheme() {
  const saved = localStorage.getItem('sw-theme');
  const html = document.documentElement;
  if (saved === 'light') {
    html.classList.remove('dark');
  } else {
    html.classList.add('dark');
  }
  updateThemeIcons();
}

function toggleTheme() {
  const html = document.documentElement;
  if (html.classList.contains('dark')) {
    html.classList.remove('dark');
    localStorage.setItem('sw-theme', 'light');
  } else {
    html.classList.add('dark');
    localStorage.setItem('sw-theme', 'dark');
  }
  updateThemeIcons();
}

function updateThemeIcons() {
  const isDark = document.documentElement.classList.contains('dark');
  const icon = isDark ? '☀️' : '🌙';
  document.querySelectorAll('.theme-icon').forEach(el => el.textContent = icon);
}

/* ═══════════════════════════════════════════════════
   Mobile Menu
   ═══════════════════════════════════════════════════ */
function toggleMobileMenu() {
  document.getElementById('mobile-menu').classList.toggle('open');
}

/* ═══════════════════════════════════════════════════
   Song Table (Main Page)
   ═══════════════════════════════════════════════════ */
function renderSongTable(filter) {
  filter = filter || '';
  const tbody = document.getElementById('song-table-body');
  if (!tbody) return;
  const lower = filter.toLowerCase();
  const filtered = songs.map(function(s, i) { return Object.assign({}, s, { originalIndex: i }); })
    .filter(function(s) {
      return s.title.toLowerCase().includes(lower) ||
             s.artist.toLowerCase().includes(lower) ||
             s.album.toLowerCase().includes(lower);
    });

  if (filtered.length === 0) {
    tbody.innerHTML = '<div class="px-4 py-8 text-center dark:text-gray-500 text-gray-400">No songs found</div>';
    return;
  }

  tbody.innerHTML = filtered.map(function(s, visIdx) {
    return '<div id="row-' + s.originalIndex + '"' +
      ' class="song-row grid grid-cols-[40px_1fr_1fr_80px] md:grid-cols-[40px_1fr_1fr_1fr_80px] gap-3 px-4 py-2 items-center cursor-pointer' +
      ' hover:dark:bg-[#282828] hover:bg-gray-100 group ' + (currentTrack === s.originalIndex ? 'bg-brand/10 dark:bg-brand/10' : '') + '"' +
      ' onclick="playTrack(' + s.originalIndex + ')">' +
      '<span class="text-center text-sm dark:text-gray-400 text-gray-500 group-hover:hidden ' + (currentTrack === s.originalIndex ? 'text-brand' : '') + '">' + (visIdx + 1) + '</span>' +
      '<span class="text-center hidden group-hover:flex justify-center">' +
        '<svg class="w-4 h-4 text-brand" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>' +
      '</span>' +
      '<div class="flex items-center gap-3 min-w-0">' +
        '<img src="' + s.img + '" alt="' + s.title + '" class="w-9 h-9 rounded object-cover shrink-0"/>' +
        '<div class="min-w-0">' +
          '<p class="font-semibold text-sm truncate ' + (currentTrack === s.originalIndex ? 'text-brand' : '') + '">' + s.title + '</p>' +
          '<p class="text-xs dark:text-gray-400 text-gray-500 truncate">' + s.artist + '</p>' +
        '</div>' +
      '</div>' +
      '<span class="hidden md:block text-sm dark:text-gray-400 text-gray-500 truncate">' + s.album + '</span>' +
      '<span class="hidden md:block"></span>' +
      '<span class="text-sm dark:text-gray-400 text-gray-500 text-right">' + s.duration + '</span>' +
    '</div>';
  }).join('');
}

/* ═══════════════════════════════════════════════════
   Music Player Controls
   ═══════════════════════════════════════════════════ */
function playTrack(index) {
  currentTrack = index;
  var s = songs[index];

  // Update player UI
  document.getElementById('player-thumb').src = s.img;
  document.getElementById('player-title').textContent = s.title;
  document.getElementById('player-artist').textContent = s.artist;
  document.getElementById('total-time').textContent = s.duration;

  // Reset progress
  progressValue = 0;
  document.getElementById('progress-bar').value = 0;
  document.getElementById('current-time').textContent = '0:00';

  isPlaying = true;
  updatePlayIcon();
  startProgress(s.duration);
  var searchInput = document.getElementById('search-input');
  renderSongTable(searchInput ? searchInput.value : '');
}

function togglePlay() {
  isPlaying = !isPlaying;
  updatePlayIcon();
  if (isPlaying) {
    startProgress(songs[currentTrack].duration);
  } else {
    clearInterval(progressInterval);
  }
}

function updatePlayIcon() {
  var icon = document.getElementById('play-icon');
  icon.innerHTML = isPlaying
    ? '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>'
    : '<path d="M8 5v14l11-7z"/>';
}

function startProgress(durationStr) {
  clearInterval(progressInterval);
  var parts = durationStr.split(':').map(Number);
  var totalSec = parts[0] * 60 + parts[1];
  var step = 100 / totalSec;

  progressInterval = setInterval(function() {
    if (!isPlaying) return;
    progressValue = Math.min(progressValue + step, 100);
    document.getElementById('progress-bar').value = progressValue;
    updateProgressBar(progressValue);

    var elapsed = Math.round((progressValue / 100) * totalSec);
    document.getElementById('current-time').textContent =
      Math.floor(elapsed / 60) + ':' + String(elapsed % 60).padStart(2, '0');

    if (progressValue >= 100) {
      clearInterval(progressInterval);
      nextTrack();
    }
  }, 1000);
}

function updateProgressBar(val) {
  var bar = document.getElementById('progress-bar');
  bar.style.background = 'linear-gradient(to right, #1DB954 ' + val + '%, #535353 ' + val + '%)';
}

function seekTrack(val) {
  progressValue = parseFloat(val);
  updateProgressBar(progressValue);
  var s = songs[currentTrack];
  var parts = s.duration.split(':').map(Number);
  var totalSec = parts[0] * 60 + parts[1];
  var elapsed = Math.round((progressValue / 100) * totalSec);
  document.getElementById('current-time').textContent =
    Math.floor(elapsed / 60) + ':' + String(elapsed % 60).padStart(2, '0');
}

function prevTrack() {
  currentTrack = (currentTrack - 1 + songs.length) % songs.length;
  playTrack(currentTrack);
}

function nextTrack() {
  currentTrack = (currentTrack + 1) % songs.length;
  playTrack(currentTrack);
}

function setVolume(val) { /* UI only */ }

function toggleHeart() {
  isLiked = !isLiked;
  var icon = document.getElementById('heart-icon');
  if (isLiked) {
    icon.setAttribute('fill', '#1DB954');
    icon.setAttribute('stroke', '#1DB954');
  } else {
    icon.setAttribute('fill', 'none');
    icon.setAttribute('stroke', 'currentColor');
  }
}

/* ═══════════════════════════════════════════════════
   Password Visibility Toggle (Login & Signup)
   ═══════════════════════════════════════════════════ */
function togglePasswordVisibility(inputId, iconId) {
  var input = document.getElementById(inputId);
  var icon = document.getElementById(iconId);
  var isHidden = input.type === 'password';
  input.type = isHidden ? 'text' : 'password';
  icon.innerHTML = isHidden
    ? '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>' +
      '<path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>' +
      '<line x1="1" y1="1" x2="23" y2="23"/>'
    : '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>' +
      '<circle cx="12" cy="12" r="3"/>';
}

/* ═══════════════════════════════════════════════════
   Login Form
   ═══════════════════════════════════════════════════ */
function handleLogin(e) {
  e.preventDefault();
  var valid = true;

  var email = document.getElementById('login-email').value.trim();
  var password = document.getElementById('login-password').value;
  var emailErr = document.getElementById('login-email-error');
  var passErr = document.getElementById('login-password-error');

  emailErr.classList.add('hidden');
  passErr.classList.add('hidden');

  if (!email) {
    emailErr.classList.remove('hidden');
    valid = false;
  }
  if (!password) {
    passErr.classList.remove('hidden');
    valid = false;
  }

  if (valid) {
    navigateTo('view-main');
  }
}

/* ═══════════════════════════════════════════════════
   Signup Form
   ═══════════════════════════════════════════════════ */
function populateDOB() {
  var daySelect = document.getElementById('dob-day');
  if (!daySelect) return;
  for (var d = 1; d <= 31; d++) {
    var opt = document.createElement('option');
    opt.value = d;
    opt.textContent = String(d).padStart(2, '0');
    daySelect.appendChild(opt);
  }

  var yearSelect = document.getElementById('dob-year');
  var currentYear = new Date().getFullYear();
  for (var y = currentYear - 13; y >= 1900; y--) {
    var opt = document.createElement('option');
    opt.value = y;
    opt.textContent = y;
    yearSelect.appendChild(opt);
  }
}

function checkPasswordStrength(pw) {
  var seg1 = document.getElementById('seg-1');
  var seg2 = document.getElementById('seg-2');
  var seg3 = document.getElementById('seg-3');
  var label = document.getElementById('strength-label');

  [seg1, seg2, seg3].forEach(function(s) { s.className = 'strength-seg'; });

  if (!pw) {
    label.textContent = 'Enter a password';
    label.className = 'text-xs dark:text-gray-500 text-gray-400';
    return;
  }

  var score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 1) {
    seg1.classList.add('weak');
    label.textContent = '🔴 Weak — add numbers, symbols, or uppercase letters';
    label.className = 'text-xs text-red-400';
  } else if (score <= 2) {
    seg1.classList.add('fair');
    seg2.classList.add('fair');
    label.textContent = '🟡 Fair — getting better!';
    label.className = 'text-xs text-yellow-400';
  } else {
    seg1.classList.add('strong');
    seg2.classList.add('strong');
    seg3.classList.add('strong');
    label.textContent = '🟢 Strong — great password!';
    label.className = 'text-xs text-brand';
  }
}

function clearError(id) {
  document.getElementById(id).classList.add('hidden');
}

function handleSignup(e) {
  e.preventDefault();
  var valid = true;

  var email = document.getElementById('signup-email').value.trim();
  var confirmEmail = document.getElementById('signup-confirm-email').value.trim();
  var password = document.getElementById('signup-password').value;
  var username = document.getElementById('signup-username').value.trim();
  var dobDay = document.getElementById('dob-day').value;
  var dobMonth = document.getElementById('dob-month').value;
  var dobYear = document.getElementById('dob-year').value;
  var gender = document.querySelector('input[name="gender"]:checked');
  var terms = document.getElementById('terms-check').checked;

  // Email
  var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRe.test(email)) {
    document.getElementById('signup-email-error').classList.remove('hidden');
    valid = false;
  }

  // Confirm email
  if (email !== confirmEmail) {
    document.getElementById('confirm-email-error').classList.remove('hidden');
    valid = false;
  }

  // Password
  if (password.length < 8) {
    document.getElementById('signup-password-error').classList.remove('hidden');
    valid = false;
  }

  // Username
  if (!username) {
    document.getElementById('username-error').classList.remove('hidden');
    valid = false;
  }

  // DOB
  if (!dobDay || !dobMonth || !dobYear) {
    document.getElementById('dob-error').classList.remove('hidden');
    valid = false;
  }

  // Gender
  if (!gender) {
    document.getElementById('gender-error').classList.remove('hidden');
    valid = false;
  }

  // Terms
  if (!terms) {
    document.getElementById('terms-error').classList.remove('hidden');
    valid = false;
  }

  if (valid) {
    navigateTo('view-login');
  }
}

/* ═══════════════════════════════════════════════════
   Initialization
   ═══════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', function() {
  initTheme();
  renderSongTable();
  populateDOB();

  // Search filter
  var searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', function(e) {
      renderSongTable(e.target.value);
    });
  }

  // Horizontal scroll with mousewheel
  ['trending-scroll', 'artists-scroll'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) {
      el.addEventListener('wheel', function(e) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
      }, { passive: false });
    }
  });

  // Handle hash-based routing
  handleHashRoute();
  window.addEventListener('hashchange', handleHashRoute);
});
