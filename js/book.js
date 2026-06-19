document.addEventListener('DOMContentLoaded', async () => {
  const guestPinInput = document.getElementById('guestPinInput');
  const openBookButton = document.getElementById('openBookButton');
  const guestMessage = document.getElementById('guestMessage');
  const flipBookSection = document.getElementById('flipBookSection');
  const prevPage = document.getElementById('prevPage');
  const nextPage = document.getElementById('nextPage');
  const guestMessages = document.getElementById('guestMessages');
  const bookGallery = document.getElementById('bookGallery');
  const quizPrompt = document.getElementById('quizPrompt');
  const openGalleryButton = document.getElementById('openGalleryButton');
  const playMusicButton = document.getElementById('playMusicButton');
  const mediaModal = document.getElementById('mediaModal');
  const closeMediaModal = document.getElementById('closeMediaModal');
  const mediaList = document.getElementById('mediaList');

  const mode = sessionStorage.getItem(APP_MODE_KEY);
  const sessionData = sessionStorage.getItem(SUPABASE_SESSION_KEY);
  const guestSession = sessionData ? JSON.parse(sessionData) : null;

  if (!window.db) {
    console.error('Supabase client is not initialized on guest book.');
    window.location.href = 'index.html';
    return;
  }

  if (mode !== 'guest' || !guestSession?.guestId) {
    window.location.href = 'index.html';
    return;
  }

  try {
    const { data: guestRecord, error: guestError } = await window.db.from(GUEST_TABLE).select('id').eq('id', guestSession.guestId).maybeSingle();
    if (guestError || !guestRecord) {
      window.location.href = 'index.html';
      return;
    }
  } catch (error) {
    console.error(error);
    window.location.href = 'index.html';
    return;
  }

  if (!guestPinInput || !openBookButton) return;

  let currentPage = 1;
  const pages = document.querySelectorAll('.page');

  openBookButton.addEventListener('click', async () => {
    guestMessage.textContent = '';
    const pin = guestPinInput.value.trim();
    if (!pin && !guestSession?.guestId) {
      guestMessage.textContent = 'Enter a valid 4-digit PIN.';
      return;
    }

    try {
      let guestData = null;
      if (pin) {
        const { data, error } = await window.db.from(GUEST_TABLE).select('*').eq('pin', pin).maybeSingle();
        if (error || !data) {
          guestMessage.textContent = 'PIN not recognized. Please try again.';
          return;
        }
        guestData = data;
      } else {
        const { data, error } = await window.db.from(GUEST_TABLE).select('*').eq('id', guestSession.guestId).maybeSingle();
        if (error || !data) {
          guestMessage.textContent = 'Session expired. Please log in again.';
          window.location.href = 'index.html';
          return;
        }
        guestData = data;
      }

      await initializeBook();
      guestPinInput.value = '';
      flipBookSection.classList.remove('hidden');
    } catch (error) {
      guestMessage.textContent = 'Unable to open the book right now.';
      console.error(error);
    }
  });

  prevPage.addEventListener('click', () => showPage(currentPage - 1));
  nextPage.addEventListener('click', () => showPage(currentPage + 1));
  openGalleryButton.addEventListener('click', () => mediaModal.classList.remove('hidden'));
  closeMediaModal.addEventListener('click', () => mediaModal.classList.add('hidden'));

  playMusicButton.addEventListener('click', () => {
    toggleMusic();
  });

  let audioContext = null;
  let oscillator = null;
  let gainNode = null;
  let musicInterval = null;
  const melodyNotes = [220, 246.94, 196, 261.63, 293.66, 329.63];

  function initializeMusic() {
    if (audioContext) return;
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    oscillator = audioContext.createOscillator();
    gainNode = audioContext.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(220, audioContext.currentTime);
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    gainNode.gain.value = 0;
    oscillator.start();
  }

  function toggleMusic() {
    initializeMusic();
    if (musicInterval) {
      stopMusic();
    } else {
      startMusic();
    }
  }

  function startMusic() {
    if (!audioContext) initializeMusic();
    gainNode.gain.setTargetAtTime(0.14, audioContext.currentTime, 0.05);
    musicInterval = setInterval(() => {
      const note = melodyNotes[Math.floor(Math.random() * melodyNotes.length)];
      oscillator.frequency.setTargetAtTime(note, audioContext.currentTime, 0.08);
    }, 720);
    playMusicButton.textContent = 'Pause Music';
  }

  function stopMusic() {
    if (!audioContext) return;
    gainNode.gain.setTargetAtTime(0, audioContext.currentTime, 0.05);
    clearInterval(musicInterval);
    musicInterval = null;
    playMusicButton.textContent = 'Play Music';
  }

  async function initializeBook() {
    const guests = await fetchCustomers();
    const media = await fetchGallery();
    const quiz = await fetchQuiz();

    renderGuestMessages(guests);
    renderBookGallery(media);
    renderQuiz(quiz);
    showPage(1);
    renderMediaModal(media);
  }

  function renderGuestMessages(items = []) {
    if (!items.length) {
      guestMessages.innerHTML = '<p class="empty-state">No messages yet.</p>';
      return;
    }
    guestMessages.innerHTML = items.map(item => `
      <div class="message-card">
        <h4>${escapeHtml(item.name)}</h4>
        <p>${escapeHtml(item.message)}</p>
      </div>
    `).join('');
  }

  async function renderBookGallery(items = []) {
    if (!items.length) {
      bookGallery.innerHTML = '<p class="empty-state">No media available.</p>';
      return;
    }

    const itemsWithUrls = await Promise.all(items.map(async (item) => {
      try {
        const url = await fetchMediaUrl(item.path);
        return { ...item, url };
      } catch (error) {
        return { ...item, url: null };
      }
    }));

    bookGallery.innerHTML = itemsWithUrls.map(item => {
      if (!item.url) {
        return `<div class="gallery-card"><div class="gallery-meta"><p>${escapeHtml(item.title)} — media unavailable</p></div></div>`;
      }
      const mediaUrl = escapeHtml(item.url);
      return item.type === 'video'
        ? `<div class="gallery-card"><video controls src="${mediaUrl}"></video></div>`
        : `<div class="gallery-card"><img src="${mediaUrl}" alt="${escapeHtml(item.title)}"></div>`;
    }).join('');
  }

  async function renderMediaModal(items = []) {
    if (!items.length) {
      mediaList.innerHTML = '<p class="empty-state">No media yet.</p>';
      return;
    }

    const itemsWithUrls = await Promise.all(items.map(async (item) => {
      try {
        const url = await fetchMediaUrl(item.path);
        return { ...item, url };
      } catch (error) {
        return { ...item, url: null };
      }
    }));

    mediaList.innerHTML = itemsWithUrls.map(item => {
      if (!item.url) {
        return `
          <div class="media-card">
            <div class="gallery-meta"><p>${escapeHtml(item.title)} — media unavailable</p></div>
          </div>
        `;
      }
      const mediaUrl = escapeHtml(item.url);
      return `
        <div class="media-card">
          ${item.type === 'video' ? `<video controls src="${mediaUrl}"></video>` : `<img src="${mediaUrl}" alt="${escapeHtml(item.title)}">`}
          <div class="gallery-meta"><p>${escapeHtml(item.title)}</p></div>
        </div>
      `;
    }).join('');
  }

  function showPage(pageIndex) {
    if (pageIndex < 1 || pageIndex > pages.length) return;
    currentPage = pageIndex;
    pages.forEach((page, index) => {
      page.style.transform = index + 1 === pageIndex ? 'translateX(0)' : 'translateX(150%)';
      page.style.opacity = index + 1 === pageIndex ? '1' : '0.3';
      page.style.pointerEvents = index + 1 === pageIndex ? 'auto' : 'none';
    });
  }

  function renderQuiz(quiz) {
    const answers = (quiz.answers || DEFAULT_QUIZ.answers).map(answer => `
      <button class="quiz-option" type="button">${escapeHtml(answer)}</button>
    `).join('');
    quizPrompt.innerHTML = `
      <p>${escapeHtml(quiz.question || DEFAULT_QUIZ.question)}</p>
      <div class="quiz-button-group">${answers}</div>
    `;
    quizPrompt.querySelectorAll('.quiz-option').forEach(button => {
      button.addEventListener('click', () => {
        button.classList.add('selected');
      });
    });
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
});
