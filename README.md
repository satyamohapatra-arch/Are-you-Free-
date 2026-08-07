# Are you free this weekend? 🍺

A small React app for 4 friends with different class schedules to figure out
when everyone's actually free to hang out.

- Each person edits their own weekly timetable (add/remove class blocks).
- Hangouts default to **after 5:00 PM** — everyone's classes end by 4:50 PM.
- Before 5 PM only counts if a class gets cancelled and the whole day clears
  for all four people — cancelling one triggers a little celebration
  animation if it unlocks the day.
- Data saves to the browser's local storage, so it persists on reload.

> Note: local storage is per-browser. If all 4 of you want to see the same
> live state, you'll want to open this on one shared device/browser, or
> swap in a small shared backend later (Firebase, Supabase, etc.) — happy to
> help wire that up if you want it.

## Run it locally

```bash
npm install
npm run dev
```

Then open the local URL it prints (usually `http://localhost:5173`).

## Build for deployment

```bash
npm run build
```

Outputs static files to `dist/` — deployable to Vercel, Netlify, GitHub
Pages, or any static host.

## Project structure

```
are-you-free/
├── index.html
├── package.json
├── vite.config.js
├── src/
│   ├── main.jsx      # React entry point
│   ├── App.jsx        # the whole app
│   └── index.css      # base styles + theme tokens
```
