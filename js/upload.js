document.addEventListener('DOMContentLoaded', () => {
  const dropZone = document.getElementById('uploadDropZone');
  const fileInput = document.getElementById('galleryFileInput');
  const progressElement = document.getElementById('uploadProgress');
  const progressLabel = document.getElementById('progressLabel');
  const galleryGrid = document.getElementById('galleryGrid');
  const uploadLibraryButton = document.getElementById('uploadLibraryButton');

  if (!dropZone || !fileInput) return;

  let isUploading = false;
  const uploadedSignatures = new Set();

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
    if (!files.length || isUploading) return;
    isUploading = true;
    const safeFiles = [];
    const fileSignatures = new Set();
    resetProgress('Preparing files for upload...');
    uploadLibraryButton.disabled = true;
    dropZone.classList.add('uploading');

    for (const file of files) {
      const signature = `${file.name}_${file.size}_${file.lastModified}`;
      if (fileSignatures.has(signature) || uploadedSignatures.has(signature)) {
        console.warn('Skipping duplicate upload:', file.name);
        continue;
      }
      fileSignatures.add(signature);
      let preparedFile = file;

      if (file.type.startsWith('image/')) {
        try {
          preparedFile = await compressImage(file);
        } catch (error) {
          console.warn('Image compression failed, uploading original file:', file.name, error);
          preparedFile = file;
        }
      }

      safeFiles.push({ original: file, file: preparedFile, signature });
    }

    if (!safeFiles.length) {
      updateProgressBar(100, 'No new files to upload.');
      cleanupUpload();
      return;
    }

    const totalFiles = safeFiles.length;
    let uploadedCount = 0;

    const uploadTask = async ({ original, file, signature }) => {
      try {
        const fileType = file.type.startsWith('video/') ? 'video' : 'image';
        const stored = await uploadFileToStorage(file);
        const path = typeof stored === 'string' ? stored : stored?.path || stored?.Key || stored?.name;
        if (!path) throw new Error('Upload returned no path for ' + file.name);
        const saved = await saveMediaRecord({
          title: original.name,
          path,
          type: fileType,
          uploaded_at: new Date().toISOString()
        });
        uploadedSignatures.add(signature);
        uploadedCount += 1;
        updateProgressBar(Math.round((uploadedCount / totalFiles) * 100), `Uploading ${uploadedCount}/${totalFiles} file(s)...`);
        return { status: 'fulfilled', value: saved };
      } catch (reason) {
        uploadedCount += 1;
        updateProgressBar(Math.round((uploadedCount / totalFiles) * 100), `Uploading ${uploadedCount}/${totalFiles} file(s)...`);
        return { status: 'rejected', reason };
      }
    };

    const uploadPromises = safeFiles.map((item) => uploadTask(item));
    const results = await Promise.all(uploadPromises);
    const errors = results.filter(result => result.status === 'rejected');
    if (errors.length) {
      console.error('Upload errors:', errors.map(item => item.reason));
      progressLabel.textContent = `Upload completed with ${errors.length} error(s). See console for details.`;
    } else {
      progressLabel.textContent = 'Upload complete. Refreshing gallery...';
    }

    progressElement.value = 100;
    await refreshGallery();
    setTimeout(() => {
      if (!errors.length) {
        progressLabel.textContent = 'All files uploaded successfully.';
      }
    }, 800);
    cleanupUpload();
  }

  function resetProgress(message) {
    if (progressElement) progressElement.value = 0;
    if (progressLabel) progressLabel.textContent = message;
  }

  function updateProgressBar(value, message) {
    if (progressElement) progressElement.value = value;
    if (progressLabel) progressLabel.textContent = message;
  }

  function cleanupUpload() {
    isUploading = false;
    uploadLibraryButton.disabled = false;
    dropZone.classList.remove('uploading');
  }

  async function compressImage(file) {
    if (!file.type.startsWith('image/')) return file;

    const bitmap = await createImageBitmap(file);
    const maxDimension = 1920;
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(bitmap, 0, 0, width, height);

    const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
    const quality = mimeType === 'image/jpeg' ? 0.8 : 0.92;
    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob((blobResult) => {
        if (blobResult) {
          resolve(blobResult);
        } else {
          reject(new Error('Image compression failed.'));
        }
      }, mimeType, quality);
    });

    return blob.size < file.size ? new File([blob], file.name, { type: blob.type, lastModified: Date.now() }) : file;
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

  async function refreshGallery() {
    try {
      const items = await fetchGallery();
      renderGallery(items);
    } catch (error) {
      galleryGrid.innerHTML = '<p class="empty-state">Unable to load gallery.</p>';
      console.error(error);
    }
  }

  loadGallery();

  async function loadGallery() {
    await refreshGallery();
  }
});

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
