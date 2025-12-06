# Plan Builder (Standalone)

This repository contains a browser-ready build of the interactive Plan Builder UI. Everything loads from public CDNs, so you do not need Node, npm, or any local build tooling.

## Running the app
1. Make sure you have an internet connection (the page pulls React, Tailwind, Babel, and icons from CDNs).
2. Open `PLAN BUILDER.html` directly in a modern browser (Chrome/Edge/Firefox/Safari). You can double-click the file or drag it into a browser window.
3. If your browser blocks import maps when opened from the filesystem, start a simple local server (for example, run `python -m http.server` in this folder and visit `http://localhost:8000/PLAN%20BUILDER.html`).
4. You may see console warnings about using the Tailwind CDN or in-browser Babel. They are expected for this single-file, browser-only build and do not prevent the app from running.

## Modifying the app
- The entire React application is embedded directly inside `PLAN BUILDER.html`, so the file is fully self-contained and works even when opened from `file://`.
- If you prefer to edit the JSX separately, copy the inline script into a new file (for example `app.jsx`), make your changes there, and then paste it back into the script block before reloading the page.
- `PLAN BUILDER.html` sets up the fonts, styles, CDNs, and root container. Adjust it only if you change external dependencies or page-level metadata.
