const API_BASE = '/api'; 

document.addEventListener('DOMContentLoaded', () => {
    loadHome();
});

async function loadHome() {
    const grid = document.getElementById('contentGrid');
    grid.innerHTML = '<div class="loading">Mengambil data terbaru...</div>';

    try {
        const res = await fetch(`${API_BASE}/home`);
        const data = await res.json();
        
        // Parsing data from Viu's specific structure is tricky because it varies.
        // We will try to find the "Editors' Choice" or similar sections.
        // This parser assumes structure based on generic Viu responses.
        
        let movies = [];
        
        // Simple heuristic to extract items from the complex home response
        if(data && data.container) {
            data.container.forEach(section => {
                if(section.item) {
                    section.item.forEach(item => {
                        movies.push(item);
                    });
                }
            });
        }

        renderGrid(movies);
    } catch (err) {
        grid.innerHTML = `<div class="error">Gagal memuat: ${err.message}</div>`;
    }
}

async function doSearch() {
    const query = document.getElementById('searchInput').value;
    if(!query) return;
    
    const grid = document.getElementById('contentGrid');
    grid.innerHTML = '<div class="loading">Mencari...</div>';
    
    try {
        const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        renderGrid(data.item || []); // Search usually returns { item: [...] }
    } catch (err) {
        grid.innerHTML = `<div class="error">Error: ${err.message}</div>`;
    }
}

function renderGrid(items) {
    const grid = document.getElementById('contentGrid');
    grid.innerHTML = '';
    
    // Filter duplicates based on ID
    const uniqueItems = Array.from(new Map(items.map(item => [item.product_id, item])).values());

    uniqueItems.forEach(item => {
        if(!item.image_url) return;
        
        const card = document.createElement('div');
        card.className = 'card';
        card.onclick = () => openDetail(item.product_id);
        
        const img = item.image_url ? item.image_url : 'https://via.placeholder.com/200x300?text=No+Image';
        
        card.innerHTML = `
            <img src="${img}" alt="${item.description}" loading="lazy">
            <div class="card-info">
                <div class="card-title">${item.description || 'No Title'}</div>
                <div class="card-ep">${item.synopsis ? item.synopsis.substring(0, 30)+'...' : ''}</div>
            </div>
        `;
        grid.appendChild(card);
    });
}

// --- Player & Details ---

async function openDetail(id) {
    try {
        // Show loading state if wanted
        const res = await fetch(`${API_BASE}/detail?id=${id}`);
        const data = await res.json();
        
        // Metadata
        const meta = data.metadata.current_product;
        const episodes = data.product_list || [];
        
        // Setup Player UI
        document.getElementById('playerTitle').innerText = meta.description;
        
        // Render Episode List
        const epContainer = document.getElementById('playerEpisodes');
        epContainer.innerHTML = '';
        
        // Reverse to show Ep 1 first if needed, usually Viu sends desc
        episodes.forEach((ep, index) => {
            const btn = document.createElement('button');
            btn.className = 'ep-btn';
            btn.innerText = `Ep ${ep.number || (index+1)}`;
            // CCS Product ID is needed for streaming
            const ccsId = ep.ccs_product_id; 
            btn.onclick = () => playVideo(ccsId, btn);
            epContainer.appendChild(btn);
        });

        // Open Modal and Play first available
        document.getElementById('playerModal').classList.add('active');
        if(episodes.length > 0) {
            playVideo(episodes[0].ccs_product_id, epContainer.children[0]);
        }

    } catch (err) {
        alert('Gagal membuka detail: ' + err.message);
    }
}

async function playVideo(ccsId, btnElement) {
    // Highlight active button
    document.querySelectorAll('.ep-btn').forEach(b => b.classList.remove('active'));
    if(btnElement) btnElement.classList.add('active');
    
    const video = document.getElementById('video');
    
    try {
        const res = await fetch(`${API_BASE}/stream?id=${ccsId}`);
        const data = await res.json();
        
        // Get URL (Prefer HLS)
        let streamUrl = '';
        if(data.url) streamUrl = data.url; // Direct
        else if(data.stream_url) streamUrl = data.stream_url;
        
        if(!streamUrl) throw new Error("Stream URL not found");

        if (Hls.isSupported()) {
            const hls = new Hls();
            hls.loadSource(streamUrl);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, function() {
                video.play();
            });
        }
        else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = streamUrl;
            video.addEventListener('loadedmetadata', function() {
                video.play();
            });
        }
    } catch (err) {
        console.error(err);
        alert("Gagal memutar video. Mungkin dilindungi DRM.");
    }
}

function closePlayer() {
    const video = document.getElementById('video');
    video.pause();
    video.src = "";
    document.getElementById('playerModal').classList.remove('active');
}
