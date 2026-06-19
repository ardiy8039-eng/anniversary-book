if (!window.db) {
  console.error('window.db is not initialized. Ensure js/supabase-client.js loads before js/supabase.js.');
}

async function fetchCustomers(searchTerm = '') {
  let query = window.db.from(GUEST_TABLE).select('*').order('created_at', { ascending: false });
  if (searchTerm) {
    query = query.or(`name.ilike.%${searchTerm}%,pin.ilike.%${searchTerm}%`);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

async function addCustomer(customer) {
  const { data, error } = await window.db.from(GUEST_TABLE).insert([customer]).select();
  if (error) throw error;
  return data[0];
}

async function updateCustomer(id, updates) {
  const { data, error } = await window.db.from(GUEST_TABLE).update(updates).eq('id', id).select();
  if (error) throw error;
  return data[0];
}

async function deleteCustomer(id) {
  const { error } = await window.db.from(GUEST_TABLE).delete().eq('id', id);
  if (error) throw error;
}

async function fetchGallery() {
  const { data, error } = await window.db.from(MEDIA_TABLE).select('*').order('uploaded_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

async function fetchQuiz() {
  try {
    const { data, error } = await window.db.from('quiz').select('*').limit(1).single();
    if (error) throw error;
    return data || DEFAULT_QUIZ;
  } catch (error) {
    console.warn('Quiz table unavailable, using local fallback.', error.message);
    return JSON.parse(localStorage.getItem('anniversary_quiz')) || DEFAULT_QUIZ;
  }
}

async function upsertQuiz(payload) {
  try {
    const { data, error } = await window.db.from('quiz').upsert(payload, { onConflict: ['id'] }).select();
    if (error) throw error;
    return data[0];
  } catch (error) {
    console.warn('Quiz upsert failed, saving to local fallback.', error.message);
    localStorage.setItem('anniversary_quiz', JSON.stringify(payload));
    return payload;
  }
}

async function fetchMediaUrl(path) {
  const { data, error } = await window.db.storage.from(STORAGE_BUCKET).createSignedUrl(path, 60 * 60);
  if (error) throw error;
  return data.signedURL;
}

async function uploadFileToStorage(file) {
  const extension = file.name.split('.').pop();
  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;
  const { data, error } = await window.db.storage.from(STORAGE_BUCKET).upload(safeName, file, {
    cacheControl: '3600',
    upsert: false
  });
  if (error) throw error;
  return data?.path || data?.Key || safeName;
}

async function saveMediaRecord(record) {
  const { data, error } = await window.db.from(MEDIA_TABLE).insert([record]).select();
  if (error) throw error;
  return data[0];
}
