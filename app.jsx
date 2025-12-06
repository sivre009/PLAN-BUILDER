import React, { useState, useEffect, useRef } from 'react';
        import { createRoot } from 'react-dom/client';
        import { 
            Upload, Download, Save, FolderOpen, Undo, Redo, 
            Plus, Trash2, Image as ImageIcon, Type, MapPin, 
            Circle, Square, Eye, RefreshCw, Layout, Copy, X,
            Layers, ChevronLeft, ChevronRight, AlignLeft, AlignCenter, 
            AlignRight, ChevronsUp, AlignJustify, ChevronsDown, 
            Menu, Move, Search, ZoomIn, ZoomOut, MousePointer2, Stamp, MoreHorizontal, 
            BringToFront, SendToBack, CopyPlus, Maximize, Link as LinkIcon, FileCode, Play, Folder,
            Hash, CaseUpper, Loader2, Package, FileDown
        } from 'lucide-react';

        // --- CONSTANTS ---

        const VERSION = "v2025.1.4-dual-export"; 

        const AVAILABLE_FONTS = [
            { name: 'Inter', value: "'Inter', sans-serif", type: 'Sans Serif' },
            { name: 'Roboto', value: "'Roboto', sans-serif", type: 'Sans Serif' },
            { name: 'Open Sans', value: "'Open Sans', sans-serif", type: 'Sans Serif' },
            { name: 'Montserrat', value: "'Montserrat', sans-serif", type: 'Sans Serif' },
            { name: 'Playfair Display', value: "'Playfair Display', serif", type: 'Serif' },
            { name: 'Merriweather', value: "'Merriweather', serif", type: 'Serif' },
            { name: 'Oswald', value: "'Oswald', sans-serif", type: 'Display' },
            { name: 'Courier Prime', value: "'Courier Prime', monospace", type: 'Monospace' },
        ];

        // --- UTILITIES ---

        const hexToRgb = (hex) => {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '0, 0, 0';
        };

        const getFileNameWithoutExtension = (filename) => {
            return filename.replace(/\.[^/.]+$/, "");
        };

        const getMarkerLabel = (index, type) => {
            if (type === 'letter') {
                let label = '';
                let i = index;
                if (i < 0) return '';
                do {
                    label = String.fromCharCode((i % 26) + 65) + label;
                    i = Math.floor(i / 26) - 1;
                } while (i >= 0);
                return label;
            }
            return index + 1;
        };

        const compressImage = (file) => {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = (e) => {
                    const img = new Image();
                    img.src = e.target.result;
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        const MAX_SIZE = 1920;
                        let width = img.width;
                        let height = img.height;
                        
                        if (width > height) {
                            if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; }
                        } else {
                            if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; }
                        }
                        
                        canvas.width = width;
                        canvas.height = height;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, width, height);
                        resolve(canvas.toDataURL('image/jpeg', 0.8));
                    };
                };
            });
        };

        const readTextFile = (file) => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.onerror = (e) => reject(e);
                reader.readAsText(file);
            });
        };

        // --- TEMPLATE GENERATOR ---

        const getViewerTemplate = (data) => {
            // Escape forward slashes to prevent closing script tags in data from breaking the viewer script
            const injectedData = JSON.stringify(data).replace(/\//g, '\\/');
            
            const rgbColor = hexToRgb(data.color);
            const textColor = data.numberColor || '#000000';
            const markerTextColor = data.showNumber ? textColor : 'transparent'; 
            const borderStyle = data.showOutline ? '2px solid white' : 'none';
            const sidebarInitialStateClass = data.showSidebar ? '' : 'collapsed';
            const enableZoom = data.enableImageZoom;
            const previewScale = data.previewScale || 85;
            const showSplash = data.showSplash;
            const splashText = data.splashText || "BEGIN"; 
            
            const fontFamilies = AVAILABLE_FONTS.map(f => f.name.replace(/ /g, '+') + ':wght@400;700').join('&family=');
            const fontUrl = `https://fonts.googleapis.com/css2?family=${fontFamilies}&display=swap`;

            // SVG Icons defined as strings for the template
            const menuIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>`;
            const closeIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
            const leftArrowSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>`;
            const rightArrowSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>`;

            return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Interactive Plan Viewer</title>
<link href="${fontUrl}" rel="stylesheet">
<style>
    *, *::before, *::after { box-sizing: border-box; }
    :root {
        --bg-color: #09090b; --text-color: #e5e5e5; --accent-color: ${data.color}; --accent-rgb: ${rgbColor};
        --marker-size: ${data.markerSize}px; 
        --marker-font-size: ${data.fontSize}px;
        --marker-text-color: ${markerTextColor}; --marker-opacity: ${data.opacity};
        --marker-bg: var(--accent-color);
        --glass-bg: rgba(20, 20, 20, 0.85); --glass-border: rgba(var(--accent-rgb), 0.3);
    }
    body { margin: 0; padding: 0; font-family: 'Inter', sans-serif; background: var(--bg-color); color: var(--text-color); height: 100vh; overflow: hidden; user-select: none; -webkit-font-smoothing: antialiased; }
    #app { display: flex; flex-direction: column; height: 100%; position: relative; }
    #main-view { flex: 1; position: relative; overflow: hidden; background: var(--bg-color); cursor: grab; touch-action: none; }
    #main-view:active { cursor: grabbing; }
    
    #plan-container { position: absolute; top: 0; left: 0; transform-origin: 0 0; box-shadow: 0 0 50px rgba(0,0,0,0.5); backface-visibility: hidden; }
    #plan-img { display: block; max-width: none; pointer-events: none; }
    
    .marker-wrapper { position: absolute; width: var(--marker-size); height: var(--marker-size); transform: translate(-50%, -50%); z-index: 100; cursor: pointer; display: flex; align-items: center; justify-content: center; pointer-events: auto; }
    .marker-visual { width: 100%; height: 100%; background: var(--marker-bg); opacity: var(--marker-opacity); border: ${borderStyle}; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: var(--marker-font-size); color: var(--marker-text-color); box-shadow: 0 4px 15px rgba(0,0,0,0.5); transition: transform 0.2s; }
    .marker-wrapper:hover { z-index: 110; }
    .marker-wrapper:hover .marker-visual { transform: scale(1.15); }
    
    .marker-preview { position: absolute; bottom: 130%; left: 50%; transform: translateX(-50%); width: max-content; max-width: 300px; height: auto; padding: 4px; background: #fff; border: 2px solid var(--accent-color); border-radius: 8px; opacity: 0; pointer-events: none; transition: opacity 0.2s ease; overflow: hidden; box-shadow: 0 5px 25px rgba(0,0,0,0.5); z-index: 90; display: none; }
    .marker-wrapper:hover .marker-preview { opacity: 1; display: block; pointer-events: auto; }
    .marker-preview.flip-down { bottom: auto; top: 130%; }
    .marker-preview.shift-left { left: auto; right: 0; transform: translateX(0); }
    .marker-preview.shift-right { left: 0; right: auto; transform: translateX(0); }
    .marker-preview img { display: block; width: 100%; height: auto; max-height: 300px; border-radius: 4px; }
    
    .shape-circle { border-radius: 50%; } .shape-square { border-radius: 20%; }
    .shape-pin { border-radius: 50% 50% 50% 0; transform: rotate(-45deg); margin-top: -15%; } .shape-pin span { transform: rotate(45deg); display:block; }
    .shape-eye { border-radius: 0 100% 0 100%; transform: rotate(-45deg); } .shape-eye span { transform: rotate(45deg); display:block; }
    
    .text-label-wrapper { position: absolute; transform: translate(-50%, -50%); z-index: 100; cursor: pointer; padding: 2px; transition: z-index 0.2s; white-space: nowrap; pointer-events: auto; }
    .text-label-content { padding: 2px 4px; border-radius: 2px; transition: transform 0.2s ease; }
    .text-label-wrapper:hover { z-index: 110; }
    .text-label-wrapper:hover .text-label-content { transform: scale(1.1); } 
    
    #image-modal { position: fixed; inset: 0; z-index: 200; display: flex; flex-direction: column; align-items: center; justify-content: center; background: rgba(0, 0, 0, 0); backdrop-filter: blur(0px); visibility: hidden; transition: background 0.4s ease, backdrop-filter 0.4s ease, visibility 0s linear 0.4s; }
    #image-modal.active { visibility: visible; background: rgba(0, 0, 0, 0.9); backdrop-filter: blur(8px); transition: background 0.4s ease, backdrop-filter 0.4s ease, visibility 0s linear 0s; }
    #modal-content { position: relative; max-width: 100vw; max-height: 100vh; display: flex; align-items: center; justify-content: center; opacity: 0; transform: scale(0.95); transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); overflow: hidden; border-radius: 12px; }
    #image-modal.active #modal-content { opacity: 1; transform: scale(1); }
    
    .zoom-wrapper { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; overflow: hidden; ${enableZoom ? 'cursor: grab;' : ''} }
    .zoom-wrapper:active { ${enableZoom ? 'cursor: grabbing;' : ''} }
    
    .viewer-image { max-width: ${previewScale}vw; max-height: ${previewScale}vh; object-fit: contain; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); transform-origin: center; transition: transform 0.1s linear; border-radius: 12px; }
    .viewer-iframe { width: 90vw; height: 90vh; border: none; border-radius: 12px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); background: black; }

    .close-btn { position: absolute; top: 20px; right: 20px; color: white; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.1); padding: 10px; border-radius: 50%; cursor: pointer; z-index: 220; transition: all 0.2s; display: flex; align-items: center; justify-content: center; }
    .close-btn:hover { background: rgba(255,255,255,0.2); transform: scale(1.1); }

    .nav-btn { position: absolute; top: 50%; transform: translateY(-50%); background: rgba(0,0,0,0.5); color: white; border: none; padding: 15px; cursor: pointer; z-index: 210; border-radius: 50%; opacity: 0; transition: all 0.2s; backdrop-filter: blur(4px); }
    .nav-btn:hover { background: rgba(255,255,255,0.2); transform: translateY(-50%) scale(1.1); }
    #image-modal:hover .nav-btn { opacity: 1; }
    .prev-btn { left: 40px; }
    .next-btn { right: 40px; }
    .counter { position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%); background: rgba(0,0,0,0.5); color: white; padding: 5px 15px; border-radius: 20px; font-size: 14px; font-weight: bold; pointer-events: none; backdrop-filter: blur(4px); }

    .slide-enter-right { animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
    .slide-enter-left { animation: slideInLeft 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
    @keyframes slideInRight { from { opacity: 0; transform: translateX(20px) scale(0.98); } to { opacity: 1; transform: translateX(0) scale(1); } }
    @keyframes slideInLeft { from { opacity: 0; transform: translateX(-20px) scale(0.98); } to { opacity: 1; transform: translateX(0) scale(1); } }

    #nav-bar { position: absolute; left: 20px; top: 50%; transform: translateY(-50%); width: 70px; max-height: 80vh; overflow-y: auto; background: var(--glass-bg); border-radius: 16px; padding: 10px 0; display: flex; flex-direction: column; align-items: center; gap: 10px; z-index: 150; transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease; box-shadow: 0 10px 30px rgba(0,0,0,0.3); }
    #nav-bar::-webkit-scrollbar { display: none; }
    #nav-bar { -ms-overflow-style: none; scrollbar-width: none; }
    #nav-bar.collapsed { transform: translate(-200%, -50%); opacity: 0; pointer-events: none; }
    
    .nav-item { width: 50px; height: 50px; border-radius: 8px; overflow: hidden; cursor: pointer; opacity: 0.6; position: relative; flex-shrink: 0; transition: opacity 0.2s, transform 0.2s; }
    .nav-item img { width: 100%; height: 100%; object-fit: cover; }
    .nav-item:hover, .nav-item.active { opacity: 1; border: 2px solid var(--accent-color); transform: scale(1.05); }
    .nav-badge { position: absolute; bottom: 0; right: 0; background: var(--accent-color); color: #000; font-size: 9px; padding: 1px 3px; font-weight: bold; border-top-left-radius: 4px; }
    
    #nav-toggle { position: absolute; top: 20px; left: 20px; z-index: 160; background: var(--glass-bg); border: 1px solid var(--glass-border); color: var(--text-color); width: 40px; height: 40px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background 0.2s; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    #nav-toggle:hover { background: rgba(255,255,255,0.1); }

    #splash-screen { position: fixed; inset: 0; z-index: 9999; background: #000; display: flex; flex-direction: column; align-items: center; justify-content: center; transition: opacity 0.8s ease; }
    .splash-btn { background: transparent; color: #fff; border: 1px solid rgba(255,255,255,0.3); padding: 15px 40px; font-size: 18px; font-family: 'Inter', sans-serif; letter-spacing: 4px; text-transform: uppercase; cursor: pointer; transition: all 0.3s ease; border-radius: 4px; }
    .splash-btn:hover { border-color: #fff; background: rgba(255,255,255,0.1); letter-spacing: 6px; }
    .splash-hidden { opacity: 0; pointer-events: none; }
</style>
</head>
<body>
${showSplash ? `<div id="splash-screen"><button class="splash-btn" onclick="enterExperience()">${splashText}</button></div>` : ''}
<div id="app">
    <div id="main-view"><div id="plan-container"><img id="plan-img" src="" alt="Plan"><div id="markers-layer"></div></div></div>
    <button id="nav-toggle" title="Toggle Sidebar">${menuIconSvg}</button>
    <div id="nav-bar" class="${sidebarInitialStateClass}"></div>
</div>
<div id="image-modal"><button class="close-btn" onclick="closeModal()">${closeIconSvg}</button><button class="nav-btn prev-btn" onclick="changeSlide(-1)">${leftArrowSvg}</button><div id="modal-content"><div id="media-container" class="zoom-wrapper"></div></div><button class="nav-btn next-btn" onclick="changeSlide(1)">${rightArrowSvg}</button><div class="counter" id="img-counter">1 / 1</div></div>
<script>
    const appData = ${injectedData};
    let currentImages = []; let currentLink = null; let currentEmbed = null; 
    let currentIndex = 0; let zoomLevel = 1; let isDragging = false; let startX = 0, startY = 0; let translateX = 0, translateY = 0; const enableZoom = ${enableZoom};

    function enterExperience() {
        const splash = document.getElementById('splash-screen');
        splash.classList.add('splash-hidden');
        setTimeout(() => splash.remove(), 800);
    }

    function openGallery(images, index = 0) { 
        if(!images || images.length === 0) return; 
        currentImages = images; currentLink = null; currentEmbed = null; 
        currentIndex = index; 
        renderModalContent('image'); updateModalImage(false); 
        document.getElementById('image-modal').classList.add('active'); updateNavButtons(); 
    }
    
    function openLink(url) {
        if(!url) return;
        currentLink = url; currentImages = []; currentEmbed = null;
        renderModalContent('iframe'); 
        document.getElementById('image-modal').classList.add('active'); updateNavButtons();
    }

    function openEmbed(html) {
        if(!html) return;
        currentEmbed = html; currentImages = []; currentLink = null;
        renderModalContent('embed');
        document.getElementById('image-modal').classList.add('active'); updateNavButtons();
    }
    
    function renderModalContent(type) {
        const container = document.getElementById('media-container');
        container.innerHTML = '';
        if(type === 'image') {
            const img = document.createElement('img'); img.id = 'modal-img'; img.className = 'viewer-image'; container.className = 'zoom-wrapper'; container.appendChild(img);
        } else {
            const iframe = document.createElement('iframe'); iframe.className = 'viewer-iframe'; 
            container.className = ''; 
            if(type === 'iframe') iframe.src = currentLink;
            if(type === 'embed') iframe.srcdoc = currentEmbed;
            container.appendChild(iframe);
        }
    }

    function updateModalImage(animate = true, direction = 'right') { 
        const img = document.getElementById('modal-img'); const counter = document.getElementById('img-counter'); if(!img) return; resetZoom(); 
        if (animate) { img.classList.remove('slide-enter-right', 'slide-enter-left'); void img.offsetWidth; img.classList.add(direction === 'right' ? 'slide-enter-right' : 'slide-enter-left'); } 
        img.src = currentImages[currentIndex].src; 
        counter.textContent = \`\${currentIndex + 1} / \${currentImages.length}\`; updateNavButtons(); 
    }

    function changeSlide(dir) { if(currentLink || currentEmbed) return; const newIndex = currentIndex + dir; if (newIndex >= 0 && newIndex < currentImages.length) { currentIndex = newIndex; updateModalImage(true, dir > 0 ? 'right' : 'left'); } }
    
    function updateNavButtons() { 
        if(currentLink || currentEmbed) {
            document.querySelector('.prev-btn').style.display = 'none'; document.querySelector('.next-btn').style.display = 'none'; document.getElementById('img-counter').style.display = 'none'; return;
        }
        document.querySelector('.prev-btn').style.display = currentIndex > 0 ? 'block' : 'none'; document.querySelector('.next-btn').style.display = currentIndex < currentImages.length - 1 ? 'block' : 'none'; document.getElementById('img-counter').style.display = currentImages.length > 1 ? 'block' : 'none'; 
    }
    
    function resetZoom() { zoomLevel = 1; translateX = 0; translateY = 0; updateTransform(); }
    function updateTransform() { const img = document.getElementById('modal-img'); if(img) img.style.transform = \`translate(\${translateX}px, \${translateY}px) scale(\${zoomLevel})\`; }
    
    if (enableZoom) { const wrapper = document.getElementById('modal-content'); wrapper.addEventListener('wheel', (e) => { if(currentLink || currentEmbed) return; e.preventDefault(); const scaleAmount = -e.deltaY * 0.001; zoomLevel = Math.min(Math.max(1, zoomLevel + scaleAmount), 5); if (zoomLevel === 1) { translateX = 0; translateY = 0; } updateTransform(); }); wrapper.addEventListener('mousedown', (e) => { if(currentLink || currentEmbed) return; if (zoomLevel > 1) { isDragging = true; startX = e.clientX - translateX; startY = e.clientY - translateY; } }); window.addEventListener('mousemove', (e) => { if (isDragging && zoomLevel > 1) { e.preventDefault(); translateX = e.clientX - startX; translateY = e.clientY - startY; updateTransform(); } }); window.addEventListener('mouseup', () => { isDragging = false; }); }
    
    window.closeModal = function() { document.getElementById('image-modal').classList.remove('active'); setTimeout(() => { document.getElementById('media-container').innerHTML = ''; resetZoom(); }, 400); };
    document.addEventListener('keydown', function(e) { if(!document.getElementById('image-modal').classList.contains('active')) return; if(e.key === 'Escape') window.closeModal(); if(e.key === 'ArrowLeft') changeSlide(-1); if(e.key === 'ArrowRight') changeSlide(1); });
    document.getElementById('image-modal').addEventListener('click', function(e) { if(e.target === this || e.target.classList.contains('zoom-wrapper')) { window.closeModal(); } });
    
    const navBar = document.getElementById('nav-bar'); document.getElementById('nav-toggle').addEventListener('click', () => navBar.classList.toggle('collapsed')); const markersLayer = document.getElementById('markers-layer');
    
    function init() {
        const img = document.getElementById('plan-img'); 
        img.src = appData.plan; 
        img.onload = () => { 
             const baseBuilderHeight = 800;
             const naturalScaleRatio = img.naturalHeight / baseBuilderHeight;
             document.documentElement.style.setProperty('--marker-size', (appData.markerSize * naturalScaleRatio) + 'px');
             document.documentElement.style.setProperty('--marker-font-size', (appData.fontSize * naturalScaleRatio) + 'px');
             const labels = document.querySelectorAll('.text-label-content');
             labels.forEach(l => { const baseSize = parseFloat(l.getAttribute('data-base-size')); if(baseSize) l.style.fontSize = (baseSize * naturalScaleRatio) + 'px'; });
             const view = document.getElementById('main-view'); const cont = document.getElementById('plan-container'); 
             const fitToScreen = () => { const vw = view.offsetWidth, vh = view.offsetHeight; if(!img.naturalWidth) return; const sc = Math.min((vw-40)/img.naturalWidth, (vh-40)/img.naturalHeight); const scale = sc || 1; const pX = (vw - img.naturalWidth*scale)/2; const pY = (vh - img.naturalHeight*scale)/2; cont.style.transform = \`translate(\${pX}px, \${pY}px) scale(\${scale})\`; window.currentView = { scale, pX, pY }; };
             fitToScreen(); window.addEventListener('resize', fitToScreen);
             
             let { scale, pX, pY } = window.currentView || { scale:1, pX:0, pY:0 }; 
             let isDown = false, sX, sY;

             // ZOOM & PAN LOGIC (Pointer Events for Touch & Mouse)
             const updateView = () => cont.style.transform = \`translate(\${pX}px, \${pY}px) scale(\${scale})\`;
             
             view.addEventListener('wheel', (e) => { 
                 e.preventDefault(); 
                 const rect = view.getBoundingClientRect(); 
                 const mouseX = e.clientX - rect.left; 
                 const mouseY = e.clientY - rect.top; 
                 const xs = (mouseX - pX) / scale; 
                 const ys = (mouseY - pY) / scale; 
                 const delta = -e.deltaY; 
                 scale *= (delta > 0) ? 1.1 : 0.9; 
                 scale = Math.min(Math.max(0.1, scale), 10);
                 pX = mouseX - xs * scale; 
                 pY = mouseY - ys * scale; 
                 updateView();
             }, { passive: false });

             // Unified Pointer Events for Pan
             const handleStart = (clientX, clientY) => {
                 isDown = true;
                 sX = clientX - pX;
                 sY = clientY - pY;
                 view.style.cursor = 'grabbing';
             };

             const handleMove = (clientX, clientY) => {
                 if (!isDown) return;
                 pX = clientX - sX;
                 pY = clientY - sY;
                 updateView();
             };

             const handleEnd = () => {
                 isDown = false;
                 view.style.cursor = 'grab';
             };

             view.addEventListener('mousedown', e => { 
                 if(e.target.closest('.marker-wrapper') || e.target.closest('.text-label-wrapper')) return; 
                 handleStart(e.clientX, e.clientY);
             });
             
             window.addEventListener('mousemove', e => { e.preventDefault(); handleMove(e.clientX, e.clientY); });
             window.addEventListener('mouseup', handleEnd);

             // Touch Support
             view.addEventListener('touchstart', e => {
                if(e.target.closest('.marker-wrapper') || e.target.closest('.text-label-wrapper')) return;
                if(e.touches.length === 1) {
                    handleStart(e.touches[0].clientX, e.touches[0].clientY);
                }
             }, { passive: false });

             window.addEventListener('touchmove', e => {
                 if(e.touches.length === 1 && isDown) {
                    e.preventDefault(); // Prevent scrolling
                    handleMove(e.touches[0].clientX, e.touches[0].clientY);
                 }
             }, { passive: false });

             window.addEventListener('touchend', handleEnd);
        };
        appData.markers.forEach((m, i) => { 
            const el = document.createElement('div'); el.className = 'marker-wrapper'; el.style.left = m.x + '%'; el.style.top = m.y + '%'; 
            let rotateStyle = (appData.shape === 'pin' || appData.shape === 'eye') ? 'style="display:block; transform: rotate(45deg);"' : '';
            const getLabel = (idx, type) => {
                if(type === 'letter') {
                    let label = ''; let n = idx;
                    if(n < 0) return '';
                    do { label = String.fromCharCode((n % 26) + 65) + label; n = Math.floor(n / 26) - 1; } while (n >= 0);
                    return label;
                }
                return idx + 1;
            };
            let labelText = getLabel(i, appData.indexingType || 'number');
            let content = appData.showNumber ? '<span ' + rotateStyle + '>' + labelText + '</span>' : ''; 
            let preview = ''; if(m.images && m.images.length > 0) { preview = \`<div class="marker-preview"><img src="\${m.images[0].src}"></div>\`; } 
            el.innerHTML = \`\${preview}<div class="marker-visual shape-\${appData.shape || 'circle'}">\${content}</div>\`; 
            el.addEventListener('mouseenter', () => { const previewEl = el.querySelector('.marker-preview'); if(previewEl) { const r = el.getBoundingClientRect(); const w = window.innerWidth; previewEl.classList.remove('flip-down', 'shift-left', 'shift-right'); if(r.top < 180) previewEl.classList.add('flip-down'); if(r.left < 150) previewEl.classList.add('shift-right'); else if(r.right > w - 150) previewEl.classList.add('shift-left'); } }); 
            el.addEventListener('click', function(e) { 
                e.stopPropagation(); 
                if(m.isEmbed && m.embeddedHtml) { openEmbed(m.embeddedHtml); }
                else if(m.link) { openLink(m.link); }
                else if(m.images && m.images.length > 0) { openGallery(m.images); } 
            }); 
            // Touch click support
            el.addEventListener('touchend', function(e) { 
                e.preventDefault(); e.stopPropagation();
                if(m.isEmbed && m.embeddedHtml) { openEmbed(m.embeddedHtml); }
                else if(m.link) { openLink(m.link); }
                else if(m.images && m.images.length > 0) { openGallery(m.images); } 
            });
            markersLayer.appendChild(el); 
            if((m.images && m.images.length > 0) || m.link || (m.isEmbed && m.embeddedHtml)) { 
                const nav = document.createElement('div'); nav.className = 'nav-item'; 
                const thumb = (m.images && m.images.length > 0) ? m.images[0].src : ''; 
                const icon = (m.isEmbed || m.link) ? (m.isEmbed ? '📄' : '🔗') : '';
                const thumbHtml = thumb ? \`<img src="\${thumb}">\` : \`<div style="width:100%;height:100%;background:#333;display:flex;align-items:center;justify-content:center;color:white;">\${icon}</div>\`;
                nav.innerHTML = \`\${thumbHtml}\${m.images && m.images.length > 1 ? '<div class="nav-badge">+'+(m.images.length-1)+'</div>' : ''}\`; 
                nav.addEventListener('click', function() { 
                    if(m.isEmbed && m.embeddedHtml) openEmbed(m.embeddedHtml);
                    else if(m.link) openLink(m.link);
                    else openGallery(m.images); 
                }); 
                navBar.appendChild(nav); 
            } 
        });
        appData.textLabels.forEach(l => { const el = document.createElement('div'); el.className = 'text-label-wrapper'; el.style.left = l.x + '%'; el.style.top = l.y + '%'; if(l.image || (l.images && l.images.length > 0) || l.link || (l.isEmbed && l.embeddedHtml)) { el.addEventListener('click', function(e) { e.stopPropagation(); if(l.isEmbed && l.embeddedHtml) openEmbed(l.embeddedHtml); else if(l.link) openLink(l.link); else { const imgs = l.images && l.images.length > 0 ? l.images : (l.image ? [l.image] : []); openGallery(imgs); } }); el.addEventListener('touchend', function(e) { e.preventDefault(); e.stopPropagation(); if(l.isEmbed && l.embeddedHtml) openEmbed(l.embeddedHtml); else if(l.link) openLink(l.link); else { const imgs = l.images && l.images.length > 0 ? l.images : (l.image ? [l.image] : []); openGallery(imgs); } }); } const fontWeight = l.bold ? 'bold' : 'normal'; const fontStyle = l.italic ? 'italic' : 'normal'; const shadow = l.shadow ? '0 2px 4px rgba(0,0,0,0.8)' : 'none'; const getRgb = (hex) => { const result = /^#?([a-f\\d]{2})([a-f\\d]{2})([a-f\\d]{2})$/i.exec(hex); return result ? \`\${parseInt(result[1], 16)}, \${parseInt(result[2], 16)}, \${parseInt(result[3], 16)}\` : '0, 0, 0'; }; const bg = \`rgba(\${getRgb(l.bgColor || '#000000')}, \${l.bgOpacity || 0})\`; el.innerHTML = \`<div class="text-label-content" data-base-size="\${l.fontSize}" style="color:\${l.color}; font-size:\${l.fontSize}px; font-weight:\${fontWeight}; font-style:\${fontStyle}; text-shadow:\${shadow}; background-color:\${bg}; padding:\${(l.padding||2)+'px'}; font-family:\${l.fontFamily}">\${l.text}</div>\`; markersLayer.appendChild(el); });
    }
    init();
` + '<' + '/script>' + `
</body>
</html>`;
        };

        const DEFAULT_STATE = {
            plan: null,
            planName: null,
            markers: [],
            textLabels: [],
            selectedIds: [], 
            color: '#ffffff',
            numberColor: '#000000',
            markerSize: 36,
            fontSize: 14,
            opacity: 1,
            showNumber: true,
            shape: 'circle',
            showOutline: true,
            showSidebar: true, 
            enableImageZoom: false, 
            previewScale: 85, 
            showSplash: false, 
            splashText: 'BEGIN',
            indexingType: 'number'
        };

        function App() {
            const [state, setState] = useState(DEFAULT_STATE);
            const [history, setHistory] = useState([JSON.stringify(DEFAULT_STATE)]);
            const [historyIndex, setHistoryIndex] = useState(0);
            const [activeTab, setActiveTab] = useState(1);
            const [isPreview, setIsPreview] = useState(false);
            const [editingLabelId, setEditingLabelId] = useState(null);
            const [tool, setTool] = useState('select'); 
            const [isLoading, setIsLoading] = useState(false);
            
            // Preview Modal State
            const [previewData, setPreviewData] = useState(null); 
            
            const [isDragging, setIsDragging] = useState(false); 
            const [isSidebarOpen, setIsSidebarOpen] = useState(true); 
            const [contextMenu, setContextMenu] = useState(null); 
            const [viewTransform, setViewTransform] = useState({ scale: 1, x: 0, y: 0 }); 
            
            const fileInputRef = useRef(null);
            const imageInputRef = useRef(null);
            const labelImageInputRef = useRef(null);
            const replaceImageRef = useRef(null);
            const replaceTarget = useRef(null);
            const labelReplaceInputRef = useRef(null);
            const addMarkerImageRef = useRef(null);
            const embedInputRef = useRef(null); 
            const linkFileInputRef = useRef(null);

            const stateRef = useRef(state);
            useEffect(() => { stateRef.current = state; }, [state]);

            useEffect(() => {
                const handleKeyDown = (e) => {
                    if (e.key === 'Escape') {
                        if (previewData) {
                            setPreviewData(null);
                        } else if (contextMenu) {
                            setContextMenu(null);
                        } else if (tool !== 'select') {
                            setTool('select');
                        } else if (isPreview) {
                             setIsPreview(false);
                        } else if (state.selectedIds.length > 0) {
                            pushHistory({ ...state, selectedIds: [] });
                        }
                    }
                    if (previewData && previewData.type === 'image') {
                        if (e.key === 'ArrowLeft') navigatePreview(-1);
                        if (e.key === 'ArrowRight') navigatePreview(1);
                    }
                };
                
                const handleGlobalClick = () => {
                    if (contextMenu) setContextMenu(null);
                };

                window.addEventListener('keydown', handleKeyDown);
                window.addEventListener('click', handleGlobalClick);
                return () => {
                    window.removeEventListener('keydown', handleKeyDown);
                    window.removeEventListener('click', handleGlobalClick);
                };
            }, [previewData, isPreview, contextMenu, tool, state.selectedIds]); 

            const navigatePreview = (dir) => {
                setPreviewData(prev => {
                    if (!prev || prev.type !== 'image') return null;
                    const newIndex = prev.index + dir;
                    if (newIndex >= 0 && newIndex < prev.images.length) {
                        return { ...prev, index: newIndex };
                    }
                    return prev;
                });
            };

            const pushHistory = (newState) => {
                const newStateStr = JSON.stringify(newState);
                if (newStateStr === history[historyIndex]) return;

                const prevPlan = JSON.parse(history[historyIndex]).plan;
                if (newState.plan && newState.plan === prevPlan) {
                   // This is just a memory optimization for browser runtime, 
                   // in a real app we'd use id references. For now, we trust the browser GC.
                }

                const newHistory = history.slice(0, historyIndex + 1);
                newHistory.push(newStateStr);
                if (newHistory.length > 20) newHistory.shift();
                setHistory(newHistory);
                setHistoryIndex(newHistory.length - 1);
                setState(newState);
            };

            const undo = () => {
                if (historyIndex > 0) {
                    const newIndex = historyIndex - 1;
                    setHistoryIndex(newIndex);
                    setState(JSON.parse(history[newIndex]));
                }
            };

            const redo = () => {
                if (historyIndex < history.length - 1) {
                    const newIndex = historyIndex + 1;
                    setHistoryIndex(newIndex);
                    setState(JSON.parse(history[newIndex]));
                }
            };

            // Keyboard Shortcuts
            useEffect(() => {
                const handleKeyDown = (e) => {
                    if (isPreview || previewData) return;
                    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
                    if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); undo(); return; }
                    if ((e.ctrlKey || e.metaKey) && e.key === 'y') { e.preventDefault(); redo(); return; }
                    if (e.key === 'Delete' || e.key === 'Backspace') {
                        if (state.selectedIds.length > 0) {
                            pushHistory({
                                ...state, 
                                markers: state.markers.filter(m => !state.selectedIds.includes(m.id)),
                                textLabels: state.textLabels.filter(l => !state.selectedIds.includes(l.id)),
                                selectedIds: []
                            });
                        }
                        return;
                    }
                    
                    const step = 0.5; let moveX = 0; let moveY = 0;
                    if (e.key === 'ArrowUp') moveY = -step; if (e.key === 'ArrowDown') moveY = step;
                    if (e.key === 'ArrowLeft') moveX = -step; if (e.key === 'ArrowRight') moveX = step;
                    if (moveX !== 0 || moveY !== 0) {
                        e.preventDefault();
                        if (state.selectedIds.length > 0) {
                            const updatedMarkers = state.markers.map(m => state.selectedIds.includes(m.id) ? { ...m, x: Math.max(0, Math.min(100, m.x + moveX)), y: Math.max(0, Math.min(100, m.y + moveY)) } : m);
                            const updatedLabels = state.textLabels.map(l => state.selectedIds.includes(l.id) ? { ...l, x: Math.max(0, Math.min(100, l.x + moveX)), y: Math.max(0, Math.min(100, l.y + moveY)) } : l);
                            pushHistory({ ...state, markers: updatedMarkers, textLabels: updatedLabels });
                        }
                    }
                };
                window.addEventListener('keydown', handleKeyDown);
                return () => window.removeEventListener('keydown', handleKeyDown);
            }, [state, historyIndex, isPreview, previewData]); 

            const resetView = () => setViewTransform({ scale: 1, x: 0, y: 0 });
            
            const handleCanvasClick = (e, rect) => {
                if (tool === 'select') return;

                const x = ((e.clientX - rect.left) / rect.width) * 100;
                const y = ((e.clientY - rect.top) / rect.height) * 100;

                const clampedX = Math.max(0, Math.min(100, x));
                const clampedY = Math.max(0, Math.min(100, y));

                const idBase = Date.now() + Math.random().toString(36).substr(2, 5);
                
                if (tool === 'stamp-marker') {
                    const newMarker = { id: 'm-' + idBase, name: 'New Marker', images: [], x: clampedX, y: clampedY };
                    pushHistory({ ...state, markers: [...state.markers, newMarker] });
                } else if (tool === 'stamp-label') {
                    const newLabel = { id: 't-' + idBase, x: clampedX, y: clampedY, text: 'New Label', fontSize: 16, color: '#ffffff', bold: false, italic: false, shadow: false, padding: 2, fontFamily: 'Inter, sans-serif', images: [], image: null, bgColor: '#000000', bgOpacity: 0 };
                    pushHistory({ ...state, textLabels: [...state.textLabels, newLabel] });
                }
                if (!e.shiftKey && !e.altKey) setTool('select');
            };

            const handleSelection = (id, multi) => {
                let newSelected = [...state.selectedIds];
                if (multi) {
                    if (newSelected.includes(id)) newSelected = newSelected.filter(sid => sid !== id);
                    else newSelected.push(id);
                } else {
                    if (!newSelected.includes(id)) newSelected = [id];
                }
                pushHistory({ ...state, selectedIds: newSelected });
            };

            const handleAlignment = (type) => {
                if (state.selectedIds.length < 2) return;
                const selectedMarkers = state.markers.filter(m => state.selectedIds.includes(m.id));
                const selectedLabels = state.textLabels.filter(l => state.selectedIds.includes(l.id));
                const allSelected = [...selectedMarkers, ...selectedLabels];
                if(allSelected.length === 0) return;

                const minX = Math.min(...allSelected.map(i => i.x)); const maxX = Math.max(...allSelected.map(i => i.x));
                const minY = Math.min(...allSelected.map(i => i.y)); const maxY = Math.max(...allSelected.map(i => i.y));
                const centerX = minX + (maxX - minX) / 2; const centerY = minY + (maxY - minY) / 2;

                const updateItem = (item) => {
                    let newX = item.x, newY = item.y;
                    switch(type) {
                        case 'left': newX = minX; break; case 'center-x': newX = centerX; break; case 'right': newX = maxX; break;
                        case 'top': newY = minY; break; case 'center-y': newY = centerY; break; case 'bottom': newY = maxY; break;
                    }
                    return { ...item, x: newX, y: newY };
                };
                const updatedMarkers = state.markers.map(m => state.selectedIds.includes(m.id) ? updateItem(m) : m);
                const updatedLabels = state.textLabels.map(l => state.selectedIds.includes(l.id) ? updateItem(l) : l);
                pushHistory({ ...state, markers: updatedMarkers, textLabels: updatedLabels });
            };

            const handleContextMenu = (e, id) => {
                e.preventDefault();
                if (isPreview) return;
                let idsToActOn = state.selectedIds;
                if (!idsToActOn.includes(id)) {
                    idsToActOn = [id];
                    pushHistory({ ...state, selectedIds: idsToActOn }); 
                }
                setContextMenu({ x: e.clientX, y: e.clientY, ids: idsToActOn });
            };

            const handleContextAction = (action) => {
                if (!contextMenu) return;
                const { ids } = contextMenu;
                let newMarkers = [...state.markers];
                let newLabels = [...state.textLabels];
                let newSelectedIds = [...ids];

                if (action === 'delete') {
                    newMarkers = newMarkers.filter(m => !ids.includes(m.id));
                    newLabels = newLabels.filter(l => !ids.includes(l.id));
                    newSelectedIds = [];
                } else if (action === 'duplicate') {
                    const markersToDup = newMarkers.filter(m => ids.includes(m.id));
                    const labelsToDup = newLabels.filter(l => ids.includes(l.id));
                    const duplicatedMarkers = markersToDup.map(m => ({ ...m, id: 'm-' + Date.now() + Math.random().toString(36).substr(2, 5), x: m.x + 2, y: m.y + 2 }));
                    const duplicatedLabels = labelsToDup.map(l => ({ ...l, id: 't-' + Date.now() + Math.random().toString(36).substr(2, 5), x: l.x + 2, y: l.y + 2 }));
                    newMarkers = [...newMarkers, ...duplicatedMarkers];
                    newLabels = [...newLabels, ...duplicatedLabels];
                    newSelectedIds = [...duplicatedMarkers.map(m => m.id), ...duplicatedLabels.map(l => l.id)];
                } else if (action === 'front') {
                    const markersToMove = newMarkers.filter(m => ids.includes(m.id));
                    const labelsToMove = newLabels.filter(l => ids.includes(l.id));
                    newMarkers = newMarkers.filter(m => !ids.includes(m.id)).concat(markersToMove);
                    newLabels = newLabels.filter(l => !ids.includes(l.id)).concat(labelsToMove);
                } else if (action === 'back') {
                    const markersToMove = newMarkers.filter(m => ids.includes(m.id));
                    const labelsToMove = newLabels.filter(l => ids.includes(l.id));
                    newMarkers = markersToMove.concat(newMarkers.filter(m => !ids.includes(m.id)));
                    newLabels = labelsToMove.concat(newLabels.filter(l => !ids.includes(l.id)));
                }
                pushHistory({ ...state, markers: newMarkers, textLabels: newLabels, selectedIds: newSelectedIds });
                setContextMenu(null);
            };

            const processFiles = async (files, processor) => {
                setIsLoading(true);
                try {
                    await processor(files);
                } catch(e) {
                    console.error(e);
                } finally {
                    setIsLoading(false);
                }
            };

            const handlePlanUpload = (file) => processFiles([file], async () => { if (!file) return; const compressed = await compressImage(file); pushHistory({ ...state, plan: compressed, planName: file.name }); });
            const handleImageUpload = (files, startX = 50, startY = 50) => processFiles(files, async () => { if (files.length === 0) return; const newItems = await Promise.all(Array.from(files).map(async f => ({ src: await compressImage(f), name: f.name }))); const newMarkers = newItems.map(item => ({ id: 'm-' + Date.now() + Math.random().toString(36).substr(2, 5), name: item.name, images: [item], x: startX, y: startY })); pushHistory({ ...state, markers: [...state.markers, ...newMarkers] }); });
            const handleLabelImageUpload = (files, startX = 50, startY = 50) => processFiles(files, async () => { if (files.length === 0) return; const newItems = await Promise.all(Array.from(files).map(async f => ({ src: await compressImage(f), name: f.name }))); const newLabels = newItems.map(item => ({ id: 't-' + Date.now() + Math.random().toString(36).substr(2, 5), x: startX, y: startY, text: getFileNameWithoutExtension(item.name).substring(0, 20) || 'New Label', fontSize: 16, color: '#ffffff', bold: false, italic: false, shadow: false, padding: 2, fontFamily: 'Inter, sans-serif', images: [item], image: item, bgColor: '#000000', bgOpacity: 0 })); pushHistory({ ...state, textLabels: [...state.textLabels, ...newLabels] }); });
            
            const handleCanvasDrop = async (files, x, y) => { 
                // Check for HTML files first
                const htmlFile = Array.from(files).find(f => f.name.endsWith('.html') || f.type === 'text/html');
                if (htmlFile && (activeTab === 2 || activeTab === 3)) {
                     const fileContent = await readTextFile(htmlFile);
                     const blob = new Blob([fileContent], { type: 'text/html' });
                     const previewUrl = URL.createObjectURL(blob);
                     const fileName = htmlFile.name;
                     const baseName = getFileNameWithoutExtension(fileName).substring(0, 20);
                     const id = (activeTab === 2 ? 'm-' : 't-') + Date.now();
                     
                     if (activeTab === 2) {
                        const newMarker = { 
                            id, name: baseName, images: [], x, y,
                            link: fileName, linkedFileContent: fileContent, previewUrl, isEmbed: false
                        };
                        pushHistory({ ...state, markers: [...state.markers, newMarker], selectedIds: [id] });
                     } else {
                        const newLabel = {
                            id, x, y, text: baseName,
                            fontSize: 16, color: '#ffffff', bold: false, italic: false, shadow: false, 
                            padding: 2, fontFamily: 'Inter, sans-serif', 
                            images: [], image: null, 
                            link: fileName, linkedFileContent: fileContent, previewUrl, bgColor: '#000000', bgOpacity: 0
                        };
                        pushHistory({ ...state, textLabels: [...state.textLabels, newLabel], selectedIds: [id] });
                     }
                     return;
                }

                if (activeTab === 2) handleImageUpload(files, x, y); 
                else if (activeTab === 3) handleLabelImageUpload(files, x, y); 
                else if (activeTab === 1) handlePlanUpload(files[0]); 
            };
            
            const addMarker = () => { const id = 'm-' + Date.now(); const newMarker = { id, name: 'New Marker', images: [], x: 50, y: 50 }; pushHistory({ ...state, markers: [...state.markers, newMarker], selectedIds: [id] }); };

            const handleAddToMarker = (e) => { const files = Array.from(e.target.files); if (!files.length || !replaceTarget.current) return; processFiles(files, async () => { const { markerId } = replaceTarget.current; const newImages = await Promise.all(files.map(async f => ({ src: await compressImage(f), name: f.name }))); const updatedMarkers = state.markers.map(m => { if (m.id !== markerId) return m; return { ...m, images: [...m.images, ...newImages] }; }); pushHistory({ ...state, markers: updatedMarkers }); e.target.value = ''; replaceTarget.current = null; }); };
            const handleReplaceImage = (e) => { const file = e.target.files[0]; if (!file || !replaceTarget.current) return; processFiles([file], async () => { const { markerId, imageIndex } = replaceTarget.current; const compressed = await compressImage(file); const updatedMarkers = state.markers.map(m => { if (m.id !== markerId) return m; const newImages = [...m.images]; newImages[imageIndex] = { src: compressed, name: file.name }; return { ...m, images: newImages }; }); pushHistory({ ...state, markers: updatedMarkers }); e.target.value = ''; replaceTarget.current = null; }); };
            const handleLabelImageReplace = (e) => { const file = e.target.files[0]; if(!file || !replaceTarget.current) return; processFiles([file], async () => { const { labelId } = replaceTarget.current; const compressed = await compressImage(file); const updatedLabels = state.textLabels.map(l => { if(l.id !== labelId) return l; return { ...l, image: { src: compressed, name: file.name }, images: [{ src: compressed, name: file.name }] }; }); pushHistory({ ...state, textLabels: updatedLabels }); e.target.value = ''; replaceTarget.current = null; }); };
            
            const handleEmbedUpload = async (e) => {
                const file = e.target.files[0];
                if (!file || !replaceTarget.current) return;
                const { markerId, labelId } = replaceTarget.current; 
                const text = await readTextFile(file);
                
                if (markerId) {
                    const updatedMarkers = state.markers.map(m => m.id === markerId ? { ...m, isEmbed: true, embeddedHtml: text } : m);
                    pushHistory({ ...state, markers: updatedMarkers });
                } else if (labelId) {
                    const updatedLabels = state.textLabels.map(l => l.id === labelId ? { ...l, isEmbed: true, embeddedHtml: text } : l);
                    pushHistory({ ...state, textLabels: updatedLabels });
                }
                e.target.value = '';
                replaceTarget.current = null;
            };

            const handleLinkFileUpload = async (e) => {
                const file = e.target.files[0];
                if (!file || !replaceTarget.current) return;
                const { markerId, labelId } = replaceTarget.current;
                
                const fileName = file.name; 
                const fileContent = await readTextFile(file);
                
                const blob = new Blob([fileContent], { type: 'text/html' });
                const previewUrl = URL.createObjectURL(blob);
                
                if (markerId) {
                    const updatedMarkers = state.markers.map(m => m.id === markerId ? { ...m, link: fileName, linkedFileContent: fileContent, previewUrl: previewUrl, isEmbed: false } : m);
                    pushHistory({ ...state, markers: updatedMarkers });
                } else if (labelId) {
                    const updatedLabels = state.textLabels.map(l => l.id === labelId ? { ...l, link: fileName, linkedFileContent: fileContent, previewUrl: previewUrl, isEmbed: false } : l);
                    pushHistory({ ...state, textLabels: updatedLabels });
                }
                e.target.value = '';
                replaceTarget.current = null;
            };

            const triggerReplaceImage = (markerId, imageIndex) => { replaceTarget.current = { markerId, imageIndex }; replaceImageRef.current.click(); };
            const triggerAddToMarker = (markerId) => { replaceTarget.current = { markerId }; addMarkerImageRef.current.click(); };
            const triggerLabelImageReplace = (labelId) => { replaceTarget.current = { labelId }; labelReplaceInputRef.current.click(); }
            const triggerEmbedUpload = (id, type) => { replaceTarget.current = type === 'marker' ? { markerId: id } : { labelId: id }; embedInputRef.current.click(); }; 
            const triggerLinkFileUpload = (id, type) => { replaceTarget.current = type === 'marker' ? { markerId: id } : { labelId: id }; linkFileInputRef.current.click(); };

            const updateMarker = (id, updates) => { const updatedMarkers = state.markers.map(m => m.id === id ? { ...m, ...updates } : m); pushHistory({ ...state, markers: updatedMarkers }); };
            const deleteMarker = (id) => { pushHistory({ ...state, markers: state.markers.filter(m => m.id !== id), selectedIds: state.selectedIds.filter(sid => sid !== id) }); };
            const addTextLabel = () => { const id = 't-' + Date.now(); const newLabel = { id, x: 50, y: 50, text: 'New Label', fontSize: 16, color: '#ffffff', bold: false, italic: false, shadow: false, padding: 2, fontFamily: 'Inter, sans-serif', image: null, images: [], bgColor: '#000000', bgOpacity: 0 }; pushHistory({ ...state, textLabels: [...state.textLabels, newLabel], selectedIds: [id] }); };
            const updateLabel = (id, updates) => { const updatedLabels = state.textLabels.map(l => l.id === id ? { ...l, ...updates } : l); pushHistory({ ...state, textLabels: updatedLabels }); };
            const updateSelectedLabels = (updates) => { const updatedLabels = state.textLabels.map(l => state.selectedIds.includes(l.id) ? { ...l, ...updates } : l); pushHistory({ ...state, textLabels: updatedLabels }); };
            const deleteLabel = (id) => { pushHistory({ ...state, textLabels: state.textLabels.filter(l => l.id !== id), selectedIds: state.selectedIds.filter(sid => sid !== id) }); };
            const copyLabelStyles = (sourceId) => { const source = state.textLabels.find(l => l.id === sourceId); if (!source) return; const updatedLabels = state.textLabels.map(l => l.id === sourceId ? l : { ...l, fontSize: source.fontSize, fontFamily: source.fontFamily, color: source.color, bgColor: source.bgColor, bgOpacity: source.bgOpacity, bold: source.bold, italic: source.italic, shadow: source.shadow, padding: source.padding }); pushHistory({ ...state, textLabels: updatedLabels }); };
            const saveProject = () => { const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state)); const a = document.createElement('a'); a.href = dataStr; a.download = "plan_project.json"; document.body.appendChild(a); a.click(); a.remove(); };
            const loadProject = (e) => { const file = e.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = (e) => { try { const loaded = JSON.parse(e.target.result); pushHistory(loaded); } catch (err) { console.error(err); } }; reader.readAsText(file); e.target.value = ''; };
            
            // --- EXPORT FUNCTIONALITY ---
            const exportSingleHtml = () => {
                 const html = getViewerTemplate(state); 
                 const blob = new Blob([html], { type: 'text/html' }); 
                 const url = URL.createObjectURL(blob); 
                 const a = document.createElement('a'); 
                 a.href = url; 
                 a.download = 'interactive_plan_pro.html'; 
                 document.body.appendChild(a); 
                 a.click(); 
                 document.body.removeChild(a);
            };

            const exportZipPackage = async () => {
                setIsLoading(true);
                try {
                    const zip = new JSZip();
                    const projectName = state.planName ? getFileNameWithoutExtension(state.planName) : "interactive-plan";
                    const rootFolder = zip.folder(projectName);
                    const pagesFolder = rootFolder.folder("pages");
                    
                    const exportState = JSON.parse(JSON.stringify(state));
                    
                    exportState.markers.forEach(m => {
                        if (m.linkedFileContent && m.link) {
                            pagesFolder.file(m.link, m.linkedFileContent);
                            m.link = `pages/${m.link}`;
                            delete m.linkedFileContent; 
                            delete m.previewUrl;
                        }
                    });
                    
                    exportState.textLabels.forEach(l => {
                        if (l.linkedFileContent && l.link) {
                            pagesFolder.file(l.link, l.linkedFileContent);
                            l.link = `pages/${l.link}`;
                            delete l.linkedFileContent;
                            delete l.previewUrl;
                        }
                    });
                    
                    const html = getViewerTemplate(exportState);
                    rootFolder.file("index.html", html);
                    
                    const content = await zip.generateAsync({type:"blob"});
                    saveAs(content, `${projectName}-package.zip`);
                    
                } catch (err) {
                    console.error("ZIP Generation Error:", err);
                    alert("Failed to generate ZIP file. See console for details.");
                } finally {
                    setIsLoading(false);
                }
            };

            const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
            const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
            
            const handleDrop = async (e) => { 
                e.preventDefault(); setIsDragging(false); 
                const files = Array.from(e.dataTransfer.files);
                if (files.length === 0) return; 
                
                const htmlFile = files.find(f => f.name.endsWith('.html') || f.type === 'text/html');
                
                if (htmlFile) {
                    const rect = document.getElementById('main-view').getBoundingClientRect();
                    const dropX = ((e.clientX - rect.left) / rect.width) * 100;
                    const dropY = ((e.clientY - rect.top) / rect.height) * 100;
                    const safeX = Math.max(0, Math.min(100, dropX));
                    const safeY = Math.max(0, Math.min(100, dropY));

                    const fileContent = await readTextFile(htmlFile);
                    const blob = new Blob([fileContent], { type: 'text/html' });
                    const previewUrl = URL.createObjectURL(blob);
                    const fileName = htmlFile.name;
                    const baseName = getFileNameWithoutExtension(fileName).substring(0, 20);

                    if (activeTab === 2) {
                        const id = 'm-' + Date.now();
                        const newMarker = { 
                            id, name: baseName, images: [], x: safeX, y: safeY,
                            link: fileName, linkedFileContent: fileContent, previewUrl: previewUrl, isEmbed: false
                        };
                        pushHistory({ ...state, markers: [...state.markers, newMarker], selectedIds: [id] });
                        return;
                    } 
                    else if (activeTab === 3) {
                        const id = 't-' + Date.now();
                        const newLabel = {
                            id, x: safeX, y: safeY, text: baseName,
                            fontSize: 16, color: '#ffffff', bold: false, italic: false, shadow: false, 
                            padding: 2, fontFamily: 'Inter, sans-serif', 
                            images: [], image: null, 
                            link: fileName, linkedFileContent: fileContent, previewUrl: previewUrl, bgColor: '#000000', bgOpacity: 0
                        };
                        pushHistory({ ...state, textLabels: [...state.textLabels, newLabel], selectedIds: [id] });
                        return;
                    }
                }

                if (activeTab === 1 && files[0].type.startsWith('image/')) handlePlanUpload(files[0]); 
                else if (activeTab === 2 && files.every(f => f.type.startsWith('image/'))) handleImageUpload(files); 
                else if (activeTab === 3) handleLabelImageUpload(files); 
            };

            const handleWheel = (e) => {
                if (isPreview) return;
                e.preventDefault();

                const rect = e.currentTarget.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;

                const worldX = (mouseX - viewTransform.x) / viewTransform.scale;
                const worldY = (mouseY - viewTransform.y) / viewTransform.scale;

                const scaleAmount = -e.deltaY * 0.001;
                const newScale = Math.min(Math.max(0.1, viewTransform.scale + scaleAmount), 5);

                const newX = mouseX - worldX * newScale;
                const newY = mouseY - worldY * newScale;

                setViewTransform({ scale: newScale, x: newX, y: newY });
            };

            const handlePreviewRequest = (data) => {
                if (!data) return;
                setPreviewData(data);
            };

            return (
                <div className="flex flex-col h-screen bg-zinc-950 text-gray-300 font-sans overflow-hidden">
                {(isPreview || previewData) && previewData && (
                    <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 animate-in fade-in duration-300 backdrop-blur-sm" onClick={() => setPreviewData(null)}>
                        <div className="relative w-full h-full max-w-[90vw] max-h-[90vh] flex items-center justify-center" onClick={e => e.stopPropagation()}>
                            <button className="absolute -top-12 right-0 text-white bg-white/10 hover:bg-white/20 p-2 rounded-full" onClick={() => setPreviewData(null)}><X size={24} /></button>
                            
                            {previewData.type === 'image' && previewData.index > 0 && (
                                <button className="absolute left-4 bg-black/50 p-3 rounded-full text-white hover:bg-white/20 backdrop-blur-sm transition-all" onClick={() => navigatePreview(-1)}>
                                    <ChevronLeft size={24} />
                                </button>
                            )}
                            
                            {previewData.type === 'image' ? (
                                <img 
                                    key={previewData.index} 
                                    src={previewData.images[previewData.index].src} 
                                    className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl animate-in slide-in-from-right-8 duration-300"
                                    style={{
                                        maxWidth: `${state.previewScale}vw`,
                                        maxHeight: `${state.previewScale}vh`,
                                    }}
                                />
                            ) : (
                                <iframe 
                                    src={previewData.link} 
                                    srcDoc={previewData.embed}
                                    className="w-[90vw] h-[90vh] rounded-xl shadow-2xl border-none bg-black animate-in zoom-in-95 duration-300"
                                />
                            )}
                            
                            {previewData.type === 'image' && previewData.index < previewData.images.length - 1 && (<button className="absolute right-4 bg-black/50 p-3 rounded-full text-white hover:bg-white/20 backdrop-blur-sm transition-all" onClick={() => navigatePreview(1)}><ChevronRight size={24} /></button>)}
                            {previewData.type === 'image' && previewData.images.length > 1 && (<div className="absolute bottom-4 bg-black/50 px-4 py-1 rounded-full text-white font-bold backdrop-blur-sm pointer-events-none">{previewData.index + 1} / {previewData.images.length}</div>)}
                        </div>
                    </div>
                )}
                
                {contextMenu && (
                    <div className="fixed bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl z-50 py-1 min-w-[160px] animate-in fade-in zoom-in-95 duration-100" style={{ top: contextMenu.y, left: contextMenu.x }}>
                        <button onClick={() => handleContextAction('duplicate')} className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-zinc-700 flex items-center gap-2"><CopyPlus size={14}/> Duplicate</button>
                        <button onClick={() => handleContextAction('front')} className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-zinc-700 flex items-center gap-2"><BringToFront size={14}/> Bring to Front</button>
                        <button onClick={() => handleContextAction('back')} className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-zinc-700 flex items-center gap-2"><SendToBack size={14}/> Send to Back</button>
                        <div className="h-px bg-zinc-700 my-1"></div>
                        <button onClick={() => handleContextAction('delete')} className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-zinc-700 flex items-center gap-2"><Trash2 size={14}/> Delete</button>
                    </div>
                )}

                {isLoading && (
                    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-indigo-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                        <Loader2 className="animate-spin" size={16}/> Processing...
                    </div>
                )}

                {!isPreview && (
                <header className="bg-black border-b border-zinc-800 p-4 shadow-lg flex justify-between items-center z-20 shrink-0">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-gray-400 hover:text-white transition-colors"><div className="flex items-center">{isSidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}</div></button>
                    </div>
                    
                    {state.selectedIds.length > 1 && (
                        <div className="flex gap-1 bg-zinc-800 p-1 rounded-lg border border-zinc-700 animate-in fade-in slide-in-from-top-2">
                            <button onClick={(e) => { e.stopPropagation(); handleAlignment('left'); }} className="p-1.5 hover:bg-zinc-700 rounded text-gray-400 hover:text-white"><AlignLeft size={16}/></button>
                            <button onClick={(e) => { e.stopPropagation(); handleAlignment('center-x'); }} className="p-1.5 hover:bg-zinc-700 rounded text-gray-400 hover:text-white"><AlignCenter size={16}/></button>
                            <button onClick={(e) => { e.stopPropagation(); handleAlignment('right'); }} className="p-1.5 hover:bg-zinc-700 rounded text-gray-400 hover:text-white"><AlignRight size={16}/></button>
                            <div className="w-px bg-zinc-700 mx-1"></div>
                            <button onClick={(e) => { e.stopPropagation(); handleAlignment('top'); }} className="p-1.5 hover:bg-zinc-700 rounded text-gray-400 hover:text-white"><ChevronsUp size={16}/></button>
                            <button onClick={(e) => { e.stopPropagation(); handleAlignment('center-y'); }} className="p-1.5 hover:bg-zinc-700 rounded text-gray-400 hover:text-white"><AlignJustify size={16} className="rotate-90"/></button>
                            <button onClick={(e) => { e.stopPropagation(); handleAlignment('bottom'); }} className="p-1.5 hover:bg-zinc-700 rounded text-gray-400 hover:text-white"><ChevronsDown size={16}/></button>
                        </div>
                    )}

                    <div className="flex items-center gap-3">
                        <div className="flex items-center bg-zinc-900 rounded-lg p-1 border border-zinc-700 mr-2">
                        <button onClick={() => setIsPreview(false)} className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${!isPreview ? 'bg-zinc-700 text-white' : 'text-gray-400 hover:text-white'}`}>Edit</button>
                        <button onClick={() => setIsPreview(true)} className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${isPreview ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}>Preview</button>
                        </div>
                        <div className="flex bg-zinc-900 rounded-lg p-1 border border-zinc-700">
                        <button onClick={undo} disabled={historyIndex === 0} className="p-2 hover:bg-zinc-700 rounded text-gray-400 disabled:opacity-30"><Undo size={18} /></button>
                        <button onClick={redo} disabled={historyIndex === history.length - 1} className="p-2 hover:bg-zinc-700 rounded text-gray-400 disabled:opacity-30"><Redo size={18} /></button>
                        </div>
                        <button onClick={saveProject} className="p-2 hover:bg-zinc-800 rounded text-gray-400 hover:text-white" title="Save JSON"><Save size={18}/></button>
                        <label className="p-2 hover:bg-zinc-800 rounded text-gray-400 hover:text-white cursor-pointer" title="Load JSON"><FolderOpen size={18}/><input type="file" className="hidden" accept=".json" onChange={loadProject}/></label>
                        
                        <div className="flex bg-zinc-800 rounded-lg p-1 border border-zinc-700 gap-1">
                            <button onClick={exportSingleHtml} disabled={!state.plan} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-1.5 px-3 rounded shadow transition-all disabled:opacity-30 disabled:cursor-not-allowed text-xs flex items-center gap-1.5" title="Export Single HTML File (Preserves Links)">
                                <FileDown size={14}/> Export HTML
                            </button>
                            <div className="w-px bg-zinc-600 my-1"></div>
                            <button onClick={exportZipPackage} disabled={!state.plan} className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-1.5 px-3 rounded shadow transition-all disabled:opacity-30 disabled:cursor-not-allowed text-xs flex items-center gap-1.5" title="Export ZIP Package (Bundles Linked Files)">
                                <Package size={14}/> Export ZIP
                            </button>
                        </div>
                    </div>
                </header>
                )}
                
                {isPreview && !previewData && (
                    <button 
                        className="absolute top-4 right-4 z-50 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 backdrop-blur-sm transition-all"
                        onClick={() => setIsPreview(false)}
                    >
                        <X size={24} />
                    </button>
                )}

                <div className="flex flex-1 overflow-hidden relative">
                    {!isPreview && (
                    <aside className={`${isSidebarOpen ? 'w-80' : 'w-0 opacity-0 overflow-hidden'} bg-zinc-900 border-r border-zinc-800 flex flex-col h-full z-10 shadow-xl transition-all duration-300 ease-in-out ${isDragging ? 'bg-zinc-800 ring-2 ring-indigo-500' : ''}`} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
                        <div className="flex border-b border-zinc-800 min-w-80">
                        {[{ id: 1, label: 'Plan', icon: Layout }, { id: 2, label: 'Markers & Style', icon: MapPin }, { id: 3, label: 'Labels', icon: Type }].map(tab => (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 py-3 flex flex-col items-center gap-1 text-[10px] uppercase font-bold tracking-wider transition-colors ${activeTab === tab.id ? 'text-indigo-500 border-b-2 border-indigo-500 bg-zinc-800/50' : 'text-gray-500 hover:text-gray-300 hover:bg-zinc-800'}`}><tab.icon size={18} />{tab.label}</button>
                        ))}
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar min-w-80">
                        
                        {/* HIDDEN INPUTS */}
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => handlePlanUpload(e.target.files[0])} />
                        <input type="file" ref={imageInputRef} className="hidden" multiple accept="image/*" onChange={(e) => handleImageUpload(e.target.files)} />
                        <input type="file" ref={replaceImageRef} className="hidden" accept="image/*" onChange={handleReplaceImage} />
                        <input type="file" ref={addMarkerImageRef} className="hidden" multiple accept="image/*" onChange={handleAddToMarker} />
                        <input type="file" ref={embedInputRef} className="hidden" accept=".html" onChange={handleEmbedUpload} />
                        <input type="file" ref={linkFileInputRef} className="hidden" accept=".html" onChange={handleLinkFileUpload} />
                        <input type="file" ref={labelReplaceInputRef} className="hidden" accept="image/*" onChange={handleLabelImageReplace} />

                        {activeTab === 1 && (
                            <div className="space-y-4">
                            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Main Floor Plan</h2>
                            {!state.plan ? (
                                <div onClick={() => fileInputRef.current.click()} className="border-2 border-dashed border-zinc-700 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 hover:bg-zinc-800/50 transition-all group">
                                <Upload className="mx-auto text-gray-500 group-hover:text-indigo-400 mb-2" />
                                <p className="text-xs text-gray-400 group-hover:text-white">Click or Drag to upload plan image</p>
                                </div>
                            ) : (
                                <div className="bg-zinc-800 rounded-lg p-2 border border-zinc-700">
                                    <img src={state.plan} alt="Plan" className="w-full h-40 object-contain bg-black rounded mb-2 border border-zinc-900" />
                                    <div className="flex justify-between items-center px-1">
                                    <span className="text-xs truncate max-w-[150px]" title={state.planName}>{state.planName}</span>
                                    <div className="flex gap-1">
                                        <button onClick={() => fileInputRef.current.click()} className="text-indigo-400 hover:text-white p-1" title="Replace Plan"><RefreshCw size={14}/></button>
                                        <button onClick={() => pushHistory({...state, plan: null, planName: null})} className="text-red-500 hover:text-red-400 p-1"><Trash2 size={14}/></button>
                                    </div>
                                    </div>
                                </div>
                            )}
                            
                            <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-zinc-800">
                                <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Export Settings</h3>
                                <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer"><input type="checkbox" checked={state.showSidebar} onChange={(e) => pushHistory({...state, showSidebar: e.target.checked})} className="accent-indigo-500 rounded"/>Show Sidebar Initially</label>
                                <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer"><input type="checkbox" checked={state.enableImageZoom} onChange={(e) => pushHistory({...state, enableImageZoom: e.target.checked})} className="accent-indigo-500 rounded"/>Enable Zoom/Pan in Preview</label>
                                <div className="pt-2"><label className="text-[10px] text-gray-500 block mb-1">Preview Scale: {state.previewScale}%</label><input type="range" min="10" max="100" value={state.previewScale} onChange={(e) => pushHistory({...state, previewScale: parseInt(e.target.value)})} className="w-full accent-indigo-500 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer"/></div>
                                
                                <div className="pt-2 border-t border-zinc-800 mt-2">
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer"><input type="checkbox" checked={state.showSplash} onChange={(e) => pushHistory({...state, showSplash: e.target.checked})} className="accent-indigo-500 rounded"/>Show Splash Screen</label>
                                    </div>
                                    {state.showSplash && (
                                        <input 
                                            value={state.splashText} 
                                            onChange={(e) => pushHistory({...state, splashText: e.target.value})} 
                                            className="w-full bg-zinc-800 border border-zinc-700 rounded p-1.5 text-xs text-white outline-none font-mono uppercase"
                                            placeholder="BEGIN"
                                        />
                                    )}
                                </div>
                            </div>
                            </div>
                        )}
                        {activeTab === 2 && (
                            <div className="space-y-6">
                            <div className="bg-zinc-800/50 p-3 rounded-lg border border-zinc-700/50">
                                <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Global Marker Styles</h2>
                                {/* Styles UI */}
                                <div className="space-y-3">
                                    <div className="grid grid-cols-4 gap-2">
                                        {['circle', 'square', 'pin', 'eye'].map(shape => (
                                            <button key={shape} onClick={() => pushHistory({...state, shape})} className={`p-1.5 rounded border flex justify-center transition-all ${state.shape === shape ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-zinc-800 border-zinc-700 text-gray-400 hover:bg-zinc-700'}`}>
                                                {shape === 'circle' && <Circle size={14}/>} {shape === 'square' && <Square size={14}/>} {shape === 'pin' && <MapPin size={14}/>} {shape === 'eye' && <Eye size={14}/>}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div><label className="text-[10px] text-gray-500 block mb-1">Color</label><div className="flex gap-2 items-center"><input type="color" value={state.color} onChange={(e) => pushHistory({...state, color: e.target.value})} className="w-6 h-6 bg-transparent rounded cursor-pointer border-none p-0"/><span className="text-xs font-mono text-gray-400">{state.color}</span></div></div>
                                        <div><label className="text-[10px] text-gray-500 block mb-1">Opacity</label><input type="range" min="0.1" max="1" step="0.1" value={state.opacity} onChange={(e) => pushHistory({...state, opacity: parseFloat(e.target.value)})} className="w-full accent-indigo-500 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer"/></div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div><label className="text-[10px] text-gray-500 block mb-1">Size: {state.markerSize}px</label><input type="range" min="20" max="80" value={state.markerSize} onChange={(e) => pushHistory({...state, markerSize: parseInt(e.target.value)})} className="w-full accent-indigo-500 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer"/></div>
                                        <div><label className="text-[10px] text-gray-500 block mb-1">Font: {state.fontSize}px</label><input type="range" min="8" max="32" value={state.fontSize} onChange={(e) => pushHistory({...state, fontSize: parseInt(e.target.value)})} className="w-full accent-indigo-500 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer"/></div>
                                    </div>
                                    <div className="flex gap-4 pt-1 justify-between">
                                        <label className="flex items-center gap-2 text-[10px] text-gray-300 cursor-pointer"><input type="checkbox" checked={state.showOutline} onChange={(e) => pushHistory({...state, showOutline: e.target.checked})} className="accent-indigo-500 rounded"/> Outline</label>
                                        <div className="flex items-center gap-2"><label className="flex items-center gap-2 text-[10px] text-gray-300 cursor-pointer"><input type="checkbox" checked={state.showNumber} onChange={(e) => pushHistory({...state, showNumber: e.target.checked})} className="accent-indigo-500 rounded"/> Index</label><input type="color" value={state.numberColor} onChange={(e) => pushHistory({...state, numberColor: e.target.value})} className="w-4 h-4 bg-transparent rounded cursor-pointer border-none p-0" title="Index Color"/></div>
                                    </div>
                                    <div className="flex gap-1 pt-1 justify-between bg-zinc-900/50 p-1.5 rounded-lg border border-zinc-800">
                                        <span className="text-[10px] text-gray-500 uppercase font-bold self-center pl-1">Style</span>
                                        <div className="flex gap-1">
                                            <button onClick={() => pushHistory({...state, indexingType: 'number'})} className={`px-2 py-1 rounded text-[10px] flex items-center gap-1 transition-colors ${state.indexingType !== 'letter' ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-gray-400 hover:text-white'}`}><Hash size={10}/> 123</button>
                                            <button onClick={() => pushHistory({...state, indexingType: 'letter'})} className={`px-2 py-1 rounded text-[10px] flex items-center gap-1 transition-colors ${state.indexingType === 'letter' ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-gray-400 hover:text-white'}`}><CaseUpper size={10}/> ABC</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="border-t border-zinc-800 pt-4">
                                <div className="flex justify-between items-center mb-3">
                                    <h2 className="text-sm font-bold text-white uppercase tracking-wider">Markers List</h2>
                                    <button onClick={addMarker} className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded flex items-center gap-1 shadow-md transition-all"><Plus size={12}/> Add Marker</button>
                                </div>

                                {state.markers.length === 0 && <div className="text-center py-8 text-gray-600 text-xs italic">Click 'Add Marker' to place a new marker on the workspace.</div>}

                                <div className="space-y-2">
                                    {state.markers.map((m, i) => (
                                    <div key={m.id} onClick={(e) => handleSelection(m.id, e.ctrlKey || e.metaKey)} className={`p-2 rounded border group transition-colors flex items-center gap-2 cursor-pointer ${state.selectedIds.includes(m.id) ? 'bg-indigo-900/40 border-indigo-500' : 'bg-zinc-800 border-zinc-700 hover:border-indigo-500'}`} onContextMenu={(e) => handleContextMenu(e, m.id)}>
                                        <div className="relative w-10 h-10 shrink-0 bg-black rounded border border-zinc-600 overflow-hidden cursor-pointer group/img" onClick={(e) => { e.stopPropagation(); triggerReplaceImage(m.id, 0); }} title="Click to replace first image">
                                            {m.images && m.images.length > 0 ? (<><img src={m.images[0].src} className="w-full h-full object-cover opacity-80 group-hover/img:opacity-100 transition-opacity" />{m.images.length > 1 && (<div className="absolute bottom-0 right-0 bg-indigo-600 text-white text-[8px] px-1 font-bold">+{m.images.length - 1}</div>)}<div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity"><RefreshCw size={12} className="text-white"/></div></>) : (<div className="w-full h-full flex items-center justify-center text-gray-600 bg-zinc-800"><ImageIcon size={14}/></div>)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="bg-zinc-900 text-gray-500 text-[10px] min-w-[20px] h-5 flex items-center justify-center rounded font-mono border border-zinc-700 shrink-0 px-1">{getMarkerLabel(i, state.indexingType || 'number')}</span>
                                                <input value={m.name} onClick={(e) => e.stopPropagation()} onChange={(e) => updateMarker(m.id, { name: e.target.value })} className="bg-transparent border-none text-xs text-gray-200 focus:outline-none w-full font-medium" placeholder="Marker Name"/>
                                            </div>
                                            <div className="flex flex-col gap-1 px-1">
                                                {!m.isEmbed && (
                                                    <div className="flex items-center gap-2">
                                                        <LinkIcon size={10} className="text-gray-500 shrink-0"/>
                                                        {m.link ? (
                                                            <div className="flex-1 flex items-center gap-1 min-w-0">
                                                                <span className="text-[9px] text-indigo-400 truncate" title={m.link}>{m.link}</span>
                                                                <button onClick={(e) => { e.stopPropagation(); updateMarker(m.id, { link: null, linkedFileContent: null, previewUrl: null }); }} className="text-red-400 hover:text-white"><X size={10}/></button>
                                                            </div>
                                                        ) : (
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); triggerLinkFileUpload(m.id, 'marker'); }}
                                                                className="text-[9px] bg-zinc-700 hover:bg-zinc-600 text-gray-300 px-2 py-0.5 rounded flex-1 text-left"
                                                            >
                                                                Select HTML File...
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                                
                                                <div className="flex items-center gap-2">
                                                    <label className="flex items-center gap-1 text-[9px] text-gray-500 cursor-pointer">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={m.isEmbed || false} 
                                                            onChange={(e) => updateMarker(m.id, { isEmbed: e.target.checked, link: null })} 
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="accent-indigo-500 rounded w-3 h-3"
                                                        />
                                                        Embed HTML
                                                    </label>
                                                    {m.isEmbed && (
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); triggerEmbedUpload(m.id, 'marker'); }}
                                                            className="text-[9px] bg-zinc-700 hover:bg-zinc-600 text-gray-300 px-2 py-0.5 rounded flex items-center gap-1"
                                                        >
                                                            <FileCode size={8} />
                                                            {m.embeddedHtml ? 'Update HTML' : 'Upload HTML'}
                                                        </button>
                                                    )}
                                                    
                                                    {((m.images && m.images.length > 0) || m.embeddedHtml) && (
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); updateMarker(m.id, { embeddedHtml: null, isEmbed: false, images: [], link: null, linkedFileContent: null, previewUrl: null }); }}
                                                            className="text-[9px] text-red-400 hover:text-red-300 ml-auto"
                                                            title="Clear Images/Embeds"
                                                        >
                                                            Clear
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <button onClick={(e) => { e.stopPropagation(); triggerAddToMarker(m.id); }} className="text-gray-500 hover:text-green-400 p-1" title="Add Image"><Plus size={12}/></button>
                                        <button onClick={(e) => { e.stopPropagation(); deleteMarker(m.id); }} className="text-gray-500 hover:text-red-500 p-1"><Trash2 size={12}/></button>
                                    </div>
                                    ))}
                                </div>
                            </div>
                            </div>
                        )}
                        {activeTab === 3 && (
                            <div className="space-y-3">
                            <div className="flex justify-between items-center mb-2">
                                <h2 className="text-sm font-bold text-white uppercase tracking-wider">Text Labels</h2>
                                <button onClick={addTextLabel} className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded flex items-center gap-1 shadow-md"><Plus size={12}/> Add Label</button>
                            </div>
                            <div className="space-y-1 max-h-[50vh] overflow-y-auto mb-4 border-b border-zinc-800 pb-4 custom-scrollbar">
                                {state.textLabels.map(l => (
                                    <div key={l.id} onClick={(e) => handleSelection(l.id, e.ctrlKey || e.metaKey)} className={`flex items-center gap-2 p-2 rounded cursor-pointer text-xs transition-colors ${state.selectedIds.includes(l.id) ? 'bg-indigo-900/30 border border-indigo-500/50 text-white' : 'hover:bg-zinc-800 text-gray-400 border border-transparent'}`} onContextMenu={(e) => handleContextMenu(e, l.id)}>
                                    <div className="relative w-8 h-8 shrink-0 rounded overflow-hidden border border-zinc-700 cursor-pointer group/thumb" onClick={(e) => { e.stopPropagation(); triggerLabelImageReplace(l.id); }} title="Click to change image">
                                        {l.images && l.images.length > 0 ? (<><img src={l.images[0].src} className="w-full h-full object-cover" alt="" />{l.images.length > 1 && <div className="absolute bottom-0 right-0 bg-indigo-600 w-2 h-2 rounded-full"></div>}</>) : (<div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: l.color }}><Plus size={10} className="text-white opacity-50"/></div>)}
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                        <input value={l.text} onChange={(e) => updateLabel(l.id, { text: e.target.value })} onClick={(e) => e.stopPropagation()} className="bg-transparent border-none text-xs text-gray-300 focus:text-white focus:outline-none w-full mb-1"/>
                                        
                                        <div className="flex flex-col gap-1">
                                            {!l.isEmbed && (
                                                <div className="flex items-center gap-2">
                                                    <LinkIcon size={10} className="text-gray-500 shrink-0"/>
                                                    {l.link ? (
                                                        <div className="flex-1 flex items-center gap-1 min-w-0">
                                                            <span className="text-[9px] text-indigo-400 truncate" title={l.link}>{l.link}</span>
                                                            <button onClick={(e) => { e.stopPropagation(); updateLabel(l.id, { link: null, linkedFileContent: null, previewUrl: null }); }} className="text-red-400 hover:text-white"><X size={10}/></button>
                                                        </div>
                                                    ) : (
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); triggerLinkFileUpload(l.id, 'label'); }}
                                                            className="text-[9px] bg-zinc-700 hover:bg-zinc-600 text-gray-300 px-2 py-0.5 rounded flex-1 text-left"
                                                        >
                                                            Select HTML File...
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                            
                                            <div className="flex items-center gap-2">
                                                <label className="flex items-center gap-1 text-[9px] text-gray-500 cursor-pointer">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={l.isEmbed || false} 
                                                        onChange={(e) => updateLabel(l.id, { isEmbed: e.target.checked, link: null })} 
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="accent-indigo-500 rounded w-3 h-3"
                                                    />
                                                    Embed
                                                </label>
                                                {l.isEmbed && (
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); triggerEmbedUpload(l.id, 'label'); }}
                                                        className="text-[9px] bg-zinc-700 hover:bg-zinc-600 text-gray-300 px-2 py-0.5 rounded flex items-center gap-1"
                                                    >
                                                        <FileCode size={8} />
                                                        {l.embeddedHtml ? 'Update' : 'Upload'}
                                                    </button>
                                                )}
                                                {(l.embeddedHtml || (l.images && l.images.length > 0)) && (
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); updateLabel(l.id, { embeddedHtml: null, isEmbed: false, images: [], image: null, linkedFileContent: null, previewUrl: null }); }}
                                                        className="text-[9px] text-red-400 hover:text-red-300 ml-auto"
                                                        title="Clear Images/Embeds"
                                                    >
                                                        Clear
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <button onClick={(e) => { e.stopPropagation(); copyLabelStyles(l.id); }} className="hover:text-white text-gray-500" title="Copy Style to All"><Copy size={12}/></button>
                                    <button onClick={(e) => { e.stopPropagation(); deleteLabel(l.id); }} className="hover:text-red-400 text-gray-500"><Trash2 size={12}/></button>
                                    </div>
                                ))}
                            </div>
                            {/* Bulk Label Editor */}
                            {state.selectedIds.filter(id => id.startsWith('t-')).length > 0 && (() => {
                                const selectedLabels = state.textLabels.filter(l => state.selectedIds.includes(l.id));
                                if (selectedLabels.length === 0) return null;
                                const representative = selectedLabels[0];
                                const count = selectedLabels.length;
                                return (
                                <div className="space-y-3 animate-in fade-in slide-in-from-right-4 duration-200">
                                    <div className="text-[10px] uppercase font-bold text-indigo-400 mb-2">Editing {count} Label{count > 1 ? 's' : ''}</div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div><label className="text-[10px] text-gray-500 uppercase font-bold">Font</label><select value={representative.fontFamily} onChange={(e) => updateSelectedLabels({ fontFamily: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded p-1.5 text-xs text-white outline-none mt-1">{AVAILABLE_FONTS.map(f => <option key={f.name} value={f.value}>{f.name}</option>)}</select></div>
                                        <div><label className="text-[10px] text-gray-500 uppercase font-bold">Size</label><input type="number" value={representative.fontSize} onChange={(e) => updateSelectedLabels({ fontSize: parseInt(e.target.value) })} className="w-full bg-zinc-800 border border-zinc-700 rounded p-1.5 text-xs text-white outline-none mt-1"/></div>
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="flex-1"><label className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Color</label><div className="flex gap-2"><input type="color" value={representative.color} onChange={(e) => updateSelectedLabels({ color: e.target.value })} className="bg-transparent w-8 h-8 rounded cursor-pointer"/><input type="color" value={representative.bgColor} onChange={(e) => updateSelectedLabels({ bgColor: e.target.value })} className="bg-transparent w-8 h-8 rounded cursor-pointer" title="Background"/></div></div>
                                        <div className="flex items-end pb-1 gap-1">
                                            <button onClick={() => updateSelectedLabels({ bold: !representative.bold })} className={`p-1.5 rounded border transition-colors ${representative.bold ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-zinc-700 text-gray-400 hover:text-white'}`}><span className="font-bold text-xs">B</span></button>
                                            <button onClick={() => updateSelectedLabels({ italic: !representative.italic })} className={`p-1.5 rounded border transition-colors ${representative.italic ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-zinc-700 text-gray-400 hover:text-white'}`}><span className="italic text-xs">I</span></button>
                                            <button onClick={() => updateSelectedLabels({ shadow: !representative.shadow })} className={`p-1.5 rounded border transition-colors ${representative.shadow ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-zinc-700 text-gray-400 hover:text-white'}`}><span className="text-xs">S</span></button>
                                        </div>
                                    </div>
                                    <div><label className="text-[10px] text-gray-500 uppercase font-bold block mb-1">BG Opacity</label><input type="range" min="0" max="1" step="0.1" value={representative.bgOpacity} onChange={(e) => updateSelectedLabels({ bgOpacity: parseFloat(e.target.value) })} className="w-full accent-indigo-500 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer"/></div>
                                </div>
                                );
                            })()}
                            </div>
                        )}
                        </div>
                        <div className="p-3 border-t border-zinc-800 min-w-80 text-center"><span className="text-[10px] text-gray-600 font-mono uppercase tracking-widest opacity-50">by JT • {VERSION}</span></div>
                    </aside>
                    )}

                    <main className="flex-1 relative bg-zinc-950 overflow-hidden p-0">
                        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                        
                        {!isPreview && (
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 bg-zinc-800 p-1.5 rounded-xl border border-zinc-700 shadow-xl z-40">
                                <button onClick={() => setTool('select')} className={`p-2 rounded-lg transition-all ${tool === 'select' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white hover:bg-zinc-700'}`} title="Select & Move (V)"><MousePointer2 size={20}/></button>
                                <div className="h-px bg-zinc-700 my-1"></div>
                                <button onClick={() => setTool('stamp-marker')} className={`p-2 rounded-lg transition-all ${tool === 'stamp-marker' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white hover:bg-zinc-700'}`} title="Stamp Markers"><MapPin size={20}/></button>
                                <button onClick={() => setTool('stamp-label')} className={`p-2 rounded-lg transition-all ${tool === 'stamp-label' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white hover:bg-zinc-700'}`} title="Stamp Labels"><Stamp size={20}/></button>
                            </div>
                        )}

                        {!isPreview && (
                            <div className="absolute bottom-4 left-4 flex gap-2 bg-zinc-800 p-1.5 rounded-xl border border-zinc-700 shadow-xl z-40">
                                <button onClick={() => setViewTransform(prev => ({ ...prev, scale: Math.min(prev.scale + 0.1, 5) }))} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-zinc-700"><ZoomIn size={20}/></button>
                                <span className="text-xs text-gray-500 self-center font-mono w-12 text-center">{Math.round(viewTransform.scale * 100)}%</span>
                                <button onClick={() => setViewTransform(prev => ({ ...prev, scale: Math.max(prev.scale - 0.1, 0.1) }))} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-zinc-700"><ZoomOut size={20}/></button>
                                <button onClick={() => setViewTransform({ scale: 1, x: 0, y: 0 })} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-zinc-700" title="Reset View"><Maximize size={20}/></button>
                            </div>
                        )}

                        {!state.plan ? (
                            <div className="flex h-full items-center justify-center">
                                <div className="text-center p-12 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl max-w-md animate-in fade-in zoom-in duration-300" onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
                                    <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-500 ring-4 ring-zinc-800 shadow-inner"><MapPin size={32}/></div>
                                    <h2 className="text-xl font-bold text-white mb-2">No Plan Uploaded</h2>
                                    <p className="text-gray-400 mb-6">Drag and drop a floor plan image here or click below.</p>
                                    <button onClick={() => { setActiveTab(1); fileInputRef.current.click(); }} className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-full font-medium transition-colors shadow-lg shadow-indigo-500/20">Upload Plan</button>
                                </div>
                            </div>
                        ) : (
                            <WorkspaceCanvas 
                                state={state} stateRef={stateRef} 
                                pushHistory={pushHistory} 
                                isPreview={isPreview} 
                                editingLabelId={editingLabelId} 
                                setEditingLabelId={setEditingLabelId} 
                                updateLabel={updateLabel}
                                onPreviewRequest={handlePreviewRequest}
                                onCanvasDrop={handleCanvasDrop} 
                                setActiveTab={setActiveTab} 
                                handleContextMenu={handleContextMenu} 
                                handleCanvasClick={(e, rect) => handleCanvasClick(e, rect)}
                                tool={tool}
                                viewTransform={viewTransform} 
                                setViewTransform={setViewTransform} 
                            />
                        )}
                        {isPreview && <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur px-6 py-3 rounded-full text-white text-sm font-bold border border-white/10 flex items-center gap-2 shadow-2xl animate-in slide-in-from-bottom-4"><Eye size={16} className="text-green-400"/> Preview Mode Active</div>}
                    </main>
                </div>
                </div>
            );
        }

        function WorkspaceCanvas({ state, stateRef, pushHistory, isPreview, editingLabelId, setEditingLabelId, updateLabel, onPreviewRequest, onCanvasDrop, setActiveTab, handleContextMenu, handleCanvasClick, tool, viewTransform, setViewTransform }) {
            const containerRef = useRef(null);
            const draggingItem = useRef(null);
            const isPanning = useRef(false);
            const panStart = useRef({ x: 0, y: 0 });

            const markerStyle = {
                backgroundColor: state.color, opacity: state.opacity, border: state.showOutline ? '2px solid white' : 'none', color: state.showNumber ? state.numberColor : 'transparent', fontSize: `${state.fontSize}px`, width: `${state.markerSize}px`, height: `${state.markerSize}px`
            };

            const handleMouseDown = (e, type, id) => {
                if (isPreview || editingLabelId === id) return;
                if (e.button === 1 || (e.button === 0 && e.code === 'Space')) return; 
                
                if (!isPreview) {
                    if (type === 'marker') setActiveTab(2);
                    if (type === 'label') setActiveTab(3);
                }

                e.stopPropagation(); e.preventDefault();
                const rect = containerRef.current.getBoundingClientRect();
                
                const currentState = stateRef.current;
                let newSelectedIds = [...currentState.selectedIds];
                const isMulti = e.ctrlKey || e.metaKey;
                
                if (!isMulti) {
                    if (!newSelectedIds.includes(id)) newSelectedIds = [id];
                } else {
                    if (newSelectedIds.includes(id)) newSelectedIds = newSelectedIds.filter(sid => sid !== id);
                    else newSelectedIds.push(id);
                }
                
                if (!isMulti && newSelectedIds.includes(id)) { } 
                else { pushHistory({ ...currentState, selectedIds: newSelectedIds }); }
                
                if (e.altKey) {
                        const idsToClone = newSelectedIds;
                        const clonedMarkers = [];
                        const clonedLabels = [];
                        const newIdsMap = {}; 
                        
                        currentState.markers.forEach(m => {
                            if(idsToClone.includes(m.id)) {
                                const newId = 'm-' + Date.now() + Math.random().toString(36).substr(2, 5);
                                clonedMarkers.push({ ...m, id: newId });
                                newIdsMap[m.id] = newId;
                            }
                        });
                        
                        currentState.textLabels.forEach(l => {
                            if(idsToClone.includes(l.id)) {
                                const newId = 't-' + Date.now() + Math.random().toString(36).substr(2, 5);
                                clonedLabels.push({ ...l, id: newId });
                                newIdsMap[l.id] = newId;
                            }
                        });
                        
                        const nextMarkers = [...currentState.markers, ...clonedMarkers];
                        const nextLabels = [...currentState.textLabels, ...clonedLabels];
                        const nextSelectedIds = idsToClone.map(oldId => newIdsMap[oldId]).filter(Boolean);
                        const newClickedId = newIdsMap[id];
                        
                        pushHistory({ ...currentState, markers: nextMarkers, textLabels: nextLabels, selectedIds: nextSelectedIds });
                        
                        draggingItem.current = { 
                            type, id: newClickedId, startX: e.clientX, startY: e.clientY, 
                            rectWidth: rect.width, rectHeight: rect.height, 
                            initialPositions: {
                                markers: nextMarkers.reduce((acc, m) => ({ ...acc, [m.id]: { x: m.x, y: m.y } }), {}),
                                labels: nextLabels.reduce((acc, l) => ({ ...acc, [l.id]: { x: l.x, y: l.y } }), {})
                            }
                        };
                    
                } else {
                    draggingItem.current = { 
                        type, id, startX: e.clientX, startY: e.clientY, 
                        rectWidth: rect.width, rectHeight: rect.height, 
                        initialPositions: {
                            markers: currentState.markers.reduce((acc, m) => ({ ...acc, [m.id]: { x: m.x, y: m.y } }), {}),
                            labels: currentState.textLabels.reduce((acc, l) => ({ ...acc, [l.id]: { x: l.x, y: l.y } }), {})
                        }
                    };
                }
                
                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', handleMouseUp);
            };

            const handleMouseMove = (e) => {
                if (!draggingItem.current) return;
                const { startX, startY, rectWidth, rectHeight, initialPositions } = draggingItem.current;
                
                const deltaXPixels = e.clientX - startX;
                const deltaYPixels = e.clientY - startY;
                
                const deltaXPercent = (deltaXPixels / rectWidth) * 100;
                const deltaYPercent = (deltaYPixels / rectHeight) * 100;
                
                const currentState = stateRef.current;
                const idsToMove = currentState.selectedIds.includes(draggingItem.current.id) ? currentState.selectedIds : [draggingItem.current.id];

                idsToMove.forEach(id => {
                    const el = document.getElementById(id.startsWith('m') ? `marker-${id}` : `label-${id}`);
                    if(el) {
                        const init = id.startsWith('m') ? initialPositions.markers[id] : initialPositions.labels[id];
                        if(init) {
                            const newX = Math.max(0, Math.min(100, init.x + deltaXPercent));
                            const newY = Math.max(0, Math.min(100, init.y + deltaYPercent));
                            el.style.left = `${newX}%`;
                            el.style.top = `${newY}%`;
                        }
                    }
                });
            };

            const handleMouseUp = (e) => {
                if (!draggingItem.current) return;
                const { startX, startY, rectWidth, rectHeight, initialPositions, id } = draggingItem.current;
                
                const deltaXPixels = e.clientX - startX;
                const deltaYPixels = e.clientY - startY;
                
                const currentState = stateRef.current;

                if (Math.abs(deltaXPixels) > 2 || Math.abs(deltaYPixels) > 2) {
                        const deltaXPercent = (deltaXPixels / rectWidth) * 100;
                        const deltaYPercent = (deltaYPixels / rectHeight) * 100;
                        
                        const idsToMove = currentState.selectedIds.includes(id) ? currentState.selectedIds : [id];
                        if(!idsToMove.includes(id)) idsToMove.push(id);

                        const updatedMarkers = currentState.markers.map(m => {
                            if (idsToMove.includes(m.id)) {
                                const init = initialPositions.markers[m.id];
                                if(!init) return m;
                                return { ...m, x: Math.max(0, Math.min(100, init.x + deltaXPercent)), y: Math.max(0, Math.min(100, init.y + deltaYPercent)) };
                            }
                            return m;
                        });
                        
                        const updatedLabels = currentState.textLabels.map(l => {
                            if (idsToMove.includes(l.id)) {
                                const init = initialPositions.labels[l.id];
                                if(!init) return l;
                                return { ...l, x: Math.max(0, Math.min(100, init.x + deltaXPercent)), y: Math.max(0, Math.min(100, init.y + deltaYPercent)) };
                            }
                            return l;
                        });
                        
                        pushHistory({ ...currentState, markers: updatedMarkers, textLabels: updatedLabels, selectedIds: idsToMove });
                } else {
                    if (!(e.ctrlKey || e.metaKey) && !e.altKey) { 
                        pushHistory({ ...currentState, selectedIds: [id] });
                    }
                }

                draggingItem.current = null;
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
            
            const handleDrop = (e) => {
                e.preventDefault();
                if (isPreview) return;
                const rect = containerRef.current.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 100;
                const y = ((e.clientY - rect.top) / rect.height) * 100;
                
                // FIXED: Accept any file type, App will filter
                const files = Array.from(e.dataTransfer.files);
                if (files.length > 0) onCanvasDrop(files, x, y);
            };
            
            const getPreviewClasses = (x, y) => {
                const classes = ['absolute', 'w-max', 'max-w-[300px]', 'bg-white', 'border-2', 'border-indigo-500', 'rounded-lg', 'opacity-0', 'group-hover:opacity-100', 'transition-opacity', 'pointer-events-none', 'z-30', 'shadow-xl', 'overflow-hidden'];
                if (y < 15) classes.push('top-[130%]'); else classes.push('bottom-[130%]');
                if (x < 10) classes.push('left-0', 'translate-x-0'); else if (x > 90) classes.push('right-0', 'translate-x-0'); else classes.push('left-1/2', '-translate-x-1/2');
                return classes.join(' ');
            };

            const handleWorkspaceMouseDown = (e) => {
                if (isPreview) return;
                if (e.button === 1 || e.button === 0) { 
                    if (e.button === 1 || (e.button === 0 && (e.code === 'Space' || tool === 'pan'))) {
                        e.preventDefault();
                        isPanning.current = true;
                        panStart.current = { x: e.clientX - viewTransform.x, y: e.clientY - viewTransform.y };
                        document.addEventListener('mousemove', handleWorkspaceMouseMove);
                        document.addEventListener('mouseup', handleWorkspaceMouseUp);
                        return;
                    }
                }
                if (tool !== 'select') {
                        const rect = containerRef.current.getBoundingClientRect();
                        handleCanvasClick(e, rect);
                } else {
                        if (stateRef.current.selectedIds.length > 0) {
                            pushHistory({...stateRef.current, selectedIds: []});
                        }
                }
            };

            const handleWorkspaceMouseMove = (e) => {
                if (isPanning.current) {
                    setViewTransform(prev => ({ ...prev, x: e.clientX - panStart.current.x, y: e.clientY - panStart.current.y }));
                }
            };

            const handleWorkspaceMouseUp = () => {
                isPanning.current = false;
                document.removeEventListener('mousemove', handleWorkspaceMouseMove);
                document.removeEventListener('mouseup', handleWorkspaceMouseUp);
            };
            
            const handleWheel = (e) => {
                e.preventDefault();
                const rect = e.currentTarget.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;
                const worldX = (mouseX - viewTransform.x) / viewTransform.scale;
                const worldY = (mouseY - viewTransform.y) / viewTransform.scale;
                const scaleAmount = -e.deltaY * 0.001;
                const newScale = Math.min(Math.max(0.1, viewTransform.scale + scaleAmount), 5);
                const newX = mouseX - worldX * newScale;
                const newY = mouseY - worldY * newScale;
                setViewTransform({ scale: newScale, x: newX, y: newY });
            };

            return (
                <div 
                    className={`relative shadow-2xl bg-black inline-block ring-1 ring-white/10 select-none overflow-hidden ${tool !== 'select' ? 'cursor-crosshair' : ''}`} 
                    style={{ width: '100%', height: '100%', cursor: isPanning.current ? 'grabbing' : 'default' }}
                    onMouseDown={handleWorkspaceMouseDown}
                    onWheel={handleWheel}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                >
                    <div 
                        className="w-full h-full flex items-center justify-center"
                        style={{ transform: `translate(${viewTransform.x}px, ${viewTransform.y}px) scale(${viewTransform.scale})`, transformOrigin: '0 0' }}
                    >
                        <div ref={containerRef} className="relative inline-block">
                            <img src={state.plan} className="max-w-none pointer-events-none block" draggable={false} style={{ height: '80vh', width: 'auto' }}/>
                            <div className="absolute inset-0">
                                {state.markers.map((m, i) => {
                                    const isSelected = state.selectedIds.includes(m.id);
                                    return (
                                    <div 
                                        id={`marker-${m.id}`} 
                                        key={m.id} 
                                        className={`marker-wrapper absolute transform -translate-x-1/2 -translate-y-1/2 z-10 hover:z-20 cursor-grab active:cursor-grabbing group ${isPreview ? 'cursor-pointer' : ''}`} 
                                        style={{ left: `${m.x}%`, top: `${m.y}%` }}
                                        onMouseDown={(e) => handleMouseDown(e, 'marker', m.id)} 
                                        onContextMenu={(e) => handleContextMenu(e, m.id)}
                                        onClick={(e) => { 
                                            if (isPreview) { 
                                                e.stopPropagation(); 
                                                if(m.isEmbed && m.embeddedHtml) { onPreviewRequest({ type: 'embed', embed: m.embeddedHtml }); }
                                                else if(m.link && m.previewUrl) { onPreviewRequest({ type: 'iframe', link: m.previewUrl }); }
                                                else if(m.link) { onPreviewRequest({ type: 'iframe', link: m.link }); }
                                                else if(m.images && m.images.length > 0) { onPreviewRequest({ type: 'image', images: m.images, index: 0 }); } 
                                            } else {
                                                e.stopPropagation();
                                            }
                                        }}
                                    >
                                        {m.images && m.images.length > 0 && (
                                            <div className={getPreviewClasses(m.x, m.y)}>
                                                <img src={m.images[0].src} className="w-auto h-auto max-w-full max-h-[300px] block" />
                                            </div>
                                        )}
                                        <div className={`flex items-center justify-center shadow-lg font-bold transition-transform group-hover:scale-110 ${state.shape === 'circle' ? 'rounded-full' : ''} ${state.shape === 'square' ? 'rounded-md' : ''} ${state.shape === 'pin' ? 'rounded-[50%_50%_50%_0] -rotate-45 -mt-[15%]' : ''} ${state.shape === 'eye' ? 'rounded-[0_100%_0_100%] -rotate-45' : ''} ${isSelected && !isPreview ? 'ring-2 ring-yellow-400 ring-offset-2 ring-offset-black' : ''}`} style={markerStyle}>
                                            {state.showNumber && <span className={`${state.shape === 'pin' || state.shape === 'eye' ? 'rotate-45 block' : ''}`}>{getMarkerLabel(i, state.indexingType || 'number')}</span>}
                                        </div>
                                    </div>
                                )})}
                                {state.textLabels.map(l => {
                                    const isSelected = state.selectedIds.includes(l.id);
                                    const isEditing = editingLabelId === l.id;
                                    const rgb = hexToRgb(l.bgColor || '#000000');
                                    return (
                                        <div id={`label-${l.id}`} key={l.id} 
                                            className={`text-label-wrapper absolute transform -translate-x-1/2 -translate-y-1/2 z-20 hover:z-30 cursor-grab active:cursor-grabbing p-0.5 rounded ${isSelected && !isPreview && !isEditing ? 'ring-2 ring-yellow-400 ring-offset-1 ring-offset-black' : ''} ${isPreview && (l.image || (l.images && l.images.length > 0) || l.link || (l.isEmbed && l.embeddedHtml)) ? 'cursor-pointer' : ''}`}
                                            style={{ left: `${l.x}%`, top: `${l.y}%` }}
                                            onMouseDown={(e) => { if(isEditing) { e.stopPropagation(); return; } handleMouseDown(e, 'label', l.id); }}
                                            onContextMenu={(e) => handleContextMenu(e, l.id)}
                                            onClick={(e) => { 
                                                if (isPreview) {
                                                    if (l.isEmbed && l.embeddedHtml) { e.stopPropagation(); onPreviewRequest({ type: 'embed', embed: l.embeddedHtml }); }
                                                    else if (l.link && l.previewUrl) { e.stopPropagation(); onPreviewRequest({ type: 'iframe', link: l.previewUrl }); }
                                                    else if (l.link) { e.stopPropagation(); onPreviewRequest({ type: 'iframe', link: l.link }); }
                                                    else if (l.images && l.images.length > 0) { e.stopPropagation(); onPreviewRequest({ type: 'image', images: l.images, index: 0 }); }
                                                    else if (l.image) { e.stopPropagation(); onPreviewRequest({ type: 'image', images: [l.image], index: 0 }); }
                                                } else {
                                                    e.stopPropagation();
                                                }
                                            }}
                                            onDoubleClick={(e) => { if(!isPreview) { e.stopPropagation(); setEditingLabelId(l.id); }}}
                                        >
                                            {isEditing ? (
                                                <input autoFocus value={l.text} onChange={(e) => updateLabel(l.id, { text: e.target.value })} onBlur={() => setEditingLabelId(null)} onKeyDown={(e) => { if(e.key === 'Enter') setEditingLabelId(null); e.stopPropagation(); }} onMouseDown={(e) => e.stopPropagation()} className="bg-zinc-900 text-white border border-indigo-500 rounded px-2 py-1 text-sm outline-none shadow-xl min-w-[100px] text-center"/>
                                            ) : (
                                                <div className="px-2 py-0.5 rounded transition-transform hover:scale-105 flex items-center justify-center whitespace-nowrap" style={{ color: l.color, fontSize: `${l.fontSize}px`, fontWeight: l.bold ? 'bold' : 'normal', fontStyle: l.italic ? 'italic' : 'normal', textShadow: l.shadow ? '0 2px 4px rgba(0,0,0,0.8)' : 'none', backgroundColor: `rgba(${rgb}, ${l.bgOpacity})`, fontFamily: l.fontFamily, padding: `${l.padding}px` }}>{l.text}</div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        const root = createRoot(document.getElementById('root'));
        root.render(<App />);
