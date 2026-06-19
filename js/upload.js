document.addEventListener('DOMContentLoaded', () => {
  const dropZone = document.getElementById('uploadDropZone');
  const fileInput = document.getElementById('galleryFileInput');
  const progressElement = document.getElementById('uploadProgress');
  const progressLabel = document.getElementById('progressLabel');
  const galleryGrid = document.getElementById('galleryGrid');

  if (!dropZone || !fileInput) return;

  dropZone.addEventListener('click', () => fileInput.click());
  dropZone.addEventListener('dragover', (event) => {
    event.preventDefault();
    dropZone.classList.add('dragover');
  });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
  dropZone.addEventListener('drop', async (event) => {
    event.preventDefault();
    dropZone.classList.remove('dragover');
    const files = Array.from(event.dataTransfer.files || []);
    await uploadFiles(files);
  });

  fileInput.addEventListener('change', async (event) => {
    const files = Array.from(event.target.files || []);
    await uploadFiles(files);
    fileInput.value = '';
  });

  async function uploadFiles(files) {
    if (!files.length) return;
    progressElement.value = 0;
    progressLabel.textContent = `Uploading ${files.length} file(s)...`;

    const tasks = files.map(async (file) => {
      const stored = await uploadFileToStorage(file);
      const fileType = file.type.startsWith('video/') ? 'video' : 'image';
      return saveMediaRecord({
        title: file.name,
        path: stored.Key || stored.path || stored.name,
        type: fileType,
        uploaded_at: new Date().toISOString()
      });
    });

    try {
      const results = await Promise.all(tasks);
      progressElement.value = 100;
      progressLabel.textContent = 'Upload complete. Refreshing gallery...';
      renderGallery(await fetchGallery());
      setTimeout(() => {
        progressLabel.textContent = 'All files uploaded successfully.';
      }, 1200);
    } catch (error) {
      progressLabel.textContent = 'Upload failed. Please try again.';
      console.error(error);
    }
  }

  async function renderGallery(items = []) {
    if (!galleryGrid) return;
    if (!items.length) {
      galleryGrid.innerHTML = '<p class="empty-state">No media uploaded yet.</p>';
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

    galleryGrid.innerHTML = itemsWithUrls.map(item => {
      if (!item.url) {
        return `<div class="gallery-card"><div class="gallery-meta"><p>${escapeHtml(item.title)} — media unavailable</p></div></div>`;
      }
      const url = escapeHtml(item.url);
      if (item.type === 'video') {
        return `<div class="gallery-card"><video controls src="${url}"></video><div class="gallery-meta"><p>${escapeHtml(item.title)}</p></div></div>`;
      }
      return `<div class="gallery-card"><img src="${url}" alt="${escapeHtml(item.title)}"><div class="gallery-meta"><p>${escapeHtml(item.title)}</p></div></div>`;
    }).join('');
  }

  async function loadGallery() {
    try {
      const items = await fetchGallery();
      renderGallery(items);
    } catch (error) {
      galleryGrid.innerHTML = '<p class="empty-state">Unable to load gallery.</p>';
      console.error(error);
    }
  }

  loadGallery();
});

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
