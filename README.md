# Anniversary Book CMS

A production-ready Anniversary Book CMS built with:

- HTML
- CSS
- Vanilla JavaScript
- Supabase
- Netlify

## Access

- Host and guest authentication is managed through Supabase tables.
- No hardcoded PINs are stored in frontend HTML, CSS, or JavaScript.

## Features

- Host dashboard with guest management
- Login page for host and guests
- Add, edit, delete, search customers
- Auto PIN generation for customers
- Supabase Storage uploads with drag-and-drop
- Parallel uploads via `Promise.all()`
- Upload progress bar
- Gallery preview and flip book animation
- Guest quiz experience
- Mobile-first luxury black and gold UI

## Repo structure

- `index.html`
- `dashboard.html`
- `book.html`
- `css/style.css`
- `css/dashboard.css`
- `css/book.css`
- `js/config.js`
- `js/supabase.js`
- `js/login.js`
- `js/dashboard.js`
- `js/upload.js`
- `js/book.js`
- `js/animation.js`
- `js/quiz.js`
- `netlify.toml`

## Setup

1. Create a Supabase project.
2. Create database tables: `hosts`, `books`, `media`, and `quiz`.
3. Create a storage bucket named `anniversary-media`.
4. Update `js/config.js` with your Supabase project URL and anon key.
5. Deploy to Netlify.

## Notes

This project uses client-side Supabase with storage and database operations. Ensure the Supabase project has the required tables and bucket before use.
