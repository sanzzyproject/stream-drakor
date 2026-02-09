const express = require('express');
const cors = require('cors');
const Viu = require('../lib/viu');

const app = express();
const viu = new Viu();

app.use(cors());
app.use(express.json());

// Helper untuk memastikan token ada sebelum request
const ensureToken = async (req, res, next) => {
    try {
        if (!viu.token) await viu.getToken();
        next();
    } catch (error) {
        res.status(500).json({ error: 'Failed to authenticate' });
    }
};

app.get('/api/home', ensureToken, async (req, res) => {
    try {
        const data = await viu.home();
        res.json(data);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/search', ensureToken, async (req, res) => {
    try {
        const { q } = req.query;
        const data = await viu.search(q);
        res.json(data);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/detail', ensureToken, async (req, res) => {
    try {
        const { id } = req.query;
        const data = await viu.detail(id);
        res.json(data);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/stream', ensureToken, async (req, res) => {
    try {
        const { id } = req.query; // This is CCS Product ID
        const data = await viu.stream(id);
        res.json(data);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Jalankan server jika local
const PORT = process.env.PORT || 3000;
if (require.main === module) {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
