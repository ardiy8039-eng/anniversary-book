const SUPABASE_URL = '';
const SUPABASE_ANON_KEY = '';
const HOST_TABLE = 'hosts';
const GUEST_TABLE = 'books';
const MEDIA_TABLE = 'media';
const STORAGE_BUCKET = 'anniversary-media';
const APP_ORIGIN = window.location.origin;

const DEFAULT_QUIZ = {
  question: 'Which memory should we revisit next?',
  answers: ['Dinner under the stars', 'Beach walk at sunset', 'Surprise gift moment', 'One more dance']
};

const SUPABASE_SESSION_KEY = 'anniversary_session';
const APP_MODE_KEY = 'anniversary_mode';
