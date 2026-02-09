async function loadHome() {
    const grid = document.getElementById('contentGrid');
    grid.innerHTML = '<div class="loading">SANN404 sedang memuat data...</div>';

    try {
        const res = await fetch(`${API_BASE}/home`);
        
        // Cek jika response BUKAN OK (misal 404 atau 500)
        if (!res.ok) {
            throw new Error(`Server Error: ${res.status}`);
        }

        const text = await res.text(); // Ambil sebagai text dulu
        try {
            const data = JSON.parse(text); // Baru coba parse ke JSON
            
            // LOGIC PARSING DATA
            let movies = [];
            if(data && data.container) {
                data.container.forEach(section => {
                    if(section.item) {
                        section.item.forEach(item => movies.push(item));
                    }
                });
            }
            renderGrid(movies);

        } catch (e) {
            // Jika gagal parse JSON, tampilkan isi text error-nya
            console.error("Respon bukan JSON:", text); 
            throw new Error("Respon server tidak valid (Bukan JSON).");
        }

    } catch (err) {
        grid.innerHTML = `<div class="error" style="color:red; text-align:center;">
            <h3>Gagal Memuat</h3>
            <p>${err.message}</p>
            <p>Coba refresh beberapa saat lagi.</p>
        </div>`;
    }
}
