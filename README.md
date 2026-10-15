# @Create Global Mobile Studio — Phase 1 (React + TypeScript PWA)

Edit • Convert • Compress • Create. Installable, offline-capable web app. All image processing runs on-device; nothing is uploaded.

## Run
    npm install
    npm run dev                      # development
    npm run build && npm run preview # production build at http://localhost:4173
    npm test                         # unit tests (vitest)
    python3 e2e/e2e.py               # browser tests (needs: pip install playwright pillow; playwright install chromium; run after build)

## Install on Android
Chrome installs PWAs only from HTTPS (or localhost). Deploy the `dist/` folder to any static HTTPS host (Netlify, Cloudflare Pages, GitHub Pages at the domain root), open it in Chrome, then use menu -> Install app. The service worker needs one online visit first; after that the app works offline.
Note: `start_url` is `/`, so host at a domain root, or set `base` in `vite.config.ts` and `start_url` accordingly.

## Placeholders to replace
- `public/owner.png` — your photograph (home hero). Currently a generic placeholder.
- `public/icon-192.png`, `public/icon-512.png` — app icons. Currently placeholders, not the final logo.
- Remove BG reference screenshot — not received; Remove BG is not built yet.

## Feature status
Implemented and tested (automated; unit + Chromium e2e):
- App shell: Home / Tools / Settings navigation, dark + light theme (persisted), responsive layout
- Image Converter: JPG, PNG, WEBP; quality; resize %; batch; real output sizes and real savings; per-file failure reporting; PNG/WEBP transparency preserved; JPG flattened on white
- Image Compressor: quality slider; target size in KB (quality search, then downscale); honest message when a target is unreachable
- Installability and offline: valid manifest and icons, service worker, converter works offline (tested in Chromium)

Implemented but NOT tested:
- Real-device behaviour on Android Chrome (tested only in desktop Chromium)
- Install prompt on a real phone (needs HTTPS hosting)
- Browser support for WEBP encoding outside Chromium (the app reports an error if unsupported)

Not implemented yet:
- Global AI (Gemini chat) and its secure backend
- Remove BG, photo editor, passport studio, image info/EXIF, tool search
- Hindi language
- PDF tools, data utilities, QR, hashes, text tools, audio/video, file manager, scanner/OCR
- Processing queue, history, favorites
