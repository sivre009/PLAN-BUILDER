# Plan Builder (Standalone)

This repository contains a browser-ready build of the interactive Plan Builder UI. Everything loads from public CDNs, so you do not need Node, npm, or any local build tooling.

## Running the app
1. Make sure you have an internet connection (the page pulls React, Tailwind, Babel, and icons from CDNs).
2. Open `PLAN BUILDER.html` directly in a modern browser (Chrome/Edge/Firefox/Safari). You can double-click the file or drag it into a browser window.
3. If your browser blocks import maps when opened from the filesystem, start a simple local server (for example, run `python -m http.server` in this folder and visit `http://localhost:8000/PLAN%20BUILDER.html`).

## Modifying the app
- The entire React application lives in `app.jsx`. Edit this file to change UI/behavior; the HTML already points to it via a Babel script tag and will re-run when you refresh the page.
- `PLAN BUILDER.html` sets up the fonts, styles, CDNs, and root container. You only need to adjust it if you change external dependencies or page-level metadata.

