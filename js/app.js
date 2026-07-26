(function () {
  'use strict';

  var GRID_COLUMNS = 5;
  var OVERLAY_AUTOHIDE_MS = 3000;

  var channels = window.CANLI_TV_CHANNELS || [];
  var focusedIndex = 0;
  var isPlayerOpen = false;
  var overlayTimer = null;

  var gridView = document.getElementById('grid-view');
  var channelGridEl = document.getElementById('channel-grid');
  var playerView = document.getElementById('player-view');
  var playerFrameHolder = document.getElementById('player-frame-holder');
  var playerOverlay = document.getElementById('player-overlay');
  var playerOverlayName = document.getElementById('player-overlay-name');
  var playerLoading = document.getElementById('player-loading');
  var playerError = document.getElementById('player-error');
  var playerErrorText = document.getElementById('player-error-text');
  var refreshBtn = document.getElementById('refresh-btn');
  var refreshStatus = document.getElementById('refresh-status');

  var videoEl = null;
  var hlsInstance = null;
  var isRefreshing = false;

  function initials(name) {
    return name.trim().charAt(0).toUpperCase();
  }

  function renderGrid() {
    var html = channels.map(function (ch, i) {
      return (
        '<li class="channel-tile" data-index="' + i + '" role="listitem" tabindex="-1">' +
          '<span class="channel-tile__logo" style="background:' + ch.color + '">' + initials(ch.name) + '</span>' +
          '<span class="channel-tile__name">' + ch.name + '</span>' +
        '</li>'
      );
    }).join('');
    channelGridEl.innerHTML = html;

    // Fare/uzaktan kumanda imleci (Magic Remote) ile tıklamayı da destekle.
    var tiles = channelGridEl.querySelectorAll('.channel-tile');
    tiles.forEach(function (tile) {
      tile.addEventListener('click', function () {
        focusedIndex = parseInt(tile.getAttribute('data-index'), 10);
        updateFocusVisual();
        openChannel(focusedIndex);
      });
    });

    updateFocusVisual();
  }

  function updateFocusVisual() {
    var tiles = channelGridEl.querySelectorAll('.channel-tile');
    tiles.forEach(function (tile, i) {
      if (i === focusedIndex) {
        tile.classList.add('is-focused');
      } else {
        tile.classList.remove('is-focused');
      }
    });

    var focusedTile = tiles[focusedIndex];
    if (focusedTile && focusedTile.scrollIntoView) {
      focusedTile.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }

  // overrides.json, GitHub'da barınan ve bir GitHub Actions görevinin her birkaç
  // saatte bir otomatik güncellediği küçük bir dosya — { "kanalId": "yeni url" }
  // şeklinde. TV, uygulamayı yeniden kurmaya gerek kalmadan "Yenile" ile bu
  // dosyayı çekip kanal linklerini tazeliyor.
  var OVERRIDES_URL = 'https://raw.githubusercontent.com/corumyusuf153/webOS_canliTV/main/overrides.json';

  function refreshChannelUrls() {
    if (isRefreshing) {
      return;
    }
    isRefreshing = true;
    refreshBtn.disabled = true;
    refreshStatus.textContent = 'Yenileniyor…';

    fetch(OVERRIDES_URL + '?t=' + Date.now(), { cache: 'no-store' })
      .then(function (res) {
        if (!res.ok) {
          throw new Error('http ' + res.status);
        }
        return res.json();
      })
      .then(function (overrides) {
        var updated = 0;
        channels.forEach(function (ch) {
          if (overrides[ch.id] && overrides[ch.id] !== ch.url) {
            ch.url = overrides[ch.id];
            updated += 1;
          }
        });
        var now = new Date();
        var hh = ('0' + now.getHours()).slice(-2);
        var mm = ('0' + now.getMinutes()).slice(-2);
        refreshStatus.textContent = updated > 0
          ? updated + ' link güncellendi (' + hh + ':' + mm + ')'
          : 'Güncel (' + hh + ':' + mm + ')';
      })
      .catch(function () {
        refreshStatus.textContent = 'Yenileme başarısız';
      })
      .then(function () {
        isRefreshing = false;
        refreshBtn.disabled = false;
      });
  }

  function moveFocus(dx, dy) {
    var total = channels.length;
    if (total === 0) {
      return;
    }

    var row = Math.floor(focusedIndex / GRID_COLUMNS);
    var col = focusedIndex % GRID_COLUMNS;
    var newRow = row + dy;
    var newCol = col + dx;

    if (newCol < 0 || newCol >= GRID_COLUMNS) {
      return;
    }

    var newIndex = newRow * GRID_COLUMNS + newCol;
    if (newIndex < 0 || newIndex >= total || newRow < 0) {
      return;
    }

    focusedIndex = newIndex;
    updateFocusVisual();
  }

  function destroyPlayer() {
    if (hlsInstance) {
      hlsInstance.destroy();
      hlsInstance = null;
    }
    if (videoEl) {
      videoEl.removeAttribute('src');
      videoEl.load();
      videoEl = null;
    }
    playerFrameHolder.innerHTML = '';
  }

  function showError(message) {
    playerLoading.classList.add('is-hidden');
    playerErrorText.textContent = message;
    playerError.classList.remove('is-hidden');
  }

  function openChannel(index) {
    var channel = channels[index];
    if (!channel) {
      return;
    }

    isPlayerOpen = true;
    playerOverlayName.textContent = channel.name;
    playerError.classList.add('is-hidden');
    playerLoading.classList.remove('is-hidden');
    playerOverlay.classList.remove('is-dismissed');

    // video elemanı her seferinde sıfırdan oluşturuluyor — arka planda eski
    // yayını canlı tutmuyoruz, TV belleği/CPU'su için önemli.
    destroyPlayer();

    videoEl = document.createElement('video');
    videoEl.autoplay = true;
    videoEl.muted = false;
    videoEl.setAttribute('playsinline', '');
    playerFrameHolder.appendChild(videoEl);

    videoEl.addEventListener('playing', function () {
      playerLoading.classList.add('is-hidden');
    });
    videoEl.addEventListener('error', function () {
      showError('Yayın açılamadı. Link geçersiz olmuş olabilir.');
    });

    // webOS'un dahili medya motoru (Safari gibi) HLS'i <video> üzerinde
    // doğrudan oynatabiliyor; masaüstü Chrome gibi desteklemeyen tarayıcılarda
    // (yalnızca bilgisayarda test ederken) hls.js'e düşüyoruz.
    if (videoEl.canPlayType('application/vnd.apple.mpegurl')) {
      videoEl.src = channel.url;
    } else if (window.Hls && window.Hls.isSupported()) {
      hlsInstance = new window.Hls();
      hlsInstance.loadSource(channel.url);
      hlsInstance.attachMedia(videoEl);
      hlsInstance.on(window.Hls.Events.ERROR, function (event, data) {
        if (data.fatal) {
          showError('Yayın açılamadı. Link geçersiz olmuş olabilir.');
        }
      });
    } else {
      showError('Bu cihaz canlı yayın formatını desteklemiyor.');
      return;
    }

    gridView.style.display = 'none';
    playerView.classList.remove('player-view--hidden');

    clearTimeout(overlayTimer);
    overlayTimer = setTimeout(function () {
      playerOverlay.classList.add('is-dismissed');
    }, OVERLAY_AUTOHIDE_MS);
  }

  function closeChannel() {
    isPlayerOpen = false;
    clearTimeout(overlayTimer);

    destroyPlayer();
    playerView.classList.add('player-view--hidden');
    gridView.style.display = '';

    updateFocusVisual();
  }

  var BACK_KEYS = [27, 8, 461]; // Escape, Backspace, webOS uzaktan kumanda "Geri" tuşu
  var GREEN_KEYS = [404, 71]; // webOS Magic Remote yeşil tuş, klavyede 'G' (test için)

  document.addEventListener('keydown', function (e) {
    if (isPlayerOpen) {
      if (BACK_KEYS.indexOf(e.keyCode) !== -1) {
        e.preventDefault();
        closeChannel();
      }
      return;
    }

    if (GREEN_KEYS.indexOf(e.keyCode) !== -1) {
      e.preventDefault();
      refreshChannelUrls();
      return;
    }

    switch (e.keyCode) {
      case 37: // sol
        moveFocus(-1, 0);
        break;
      case 39: // sağ
        moveFocus(1, 0);
        break;
      case 38: // yukarı
        moveFocus(0, -1);
        break;
      case 40: // aşağı
        moveFocus(0, 1);
        break;
      case 13: // OK / Enter
        openChannel(focusedIndex);
        break;
      default:
        return;
    }
    e.preventDefault();
  });

  refreshBtn.addEventListener('click', refreshChannelUrls);

  renderGrid();
  refreshChannelUrls();
})();
