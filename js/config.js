const SUPABASE_URL = 'https://ciulubaaypbfclbgpyja.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpdWx1YmFheXBiZmNsYmdweWphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MDA0ODEsImV4cCI6MjA5NzM3NjQ4MX0.2LWTSpDIawtRh9KN-O0VNK_e_yVFB3LTU00QxgFlRrA';
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
