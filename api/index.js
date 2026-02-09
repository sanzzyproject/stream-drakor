const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const app = express();

// --- CLASS VIU INTEGRATED ---
class Viu {
    constructor() {
        this.inst = axios.create({
            baseURL: 'https://api-gateway-global.viu.com/api',
            headers: {
                'accept-encoding': 'gzip',
                'content-type': 'application/x-www-form-urlencoded',
                'platform': 'android',
                'user-agent': 'okhttp/4.12.0' // Penting agar tidak diblokir
            }
        });
        this.token = null;
    }
    
    getToken = async function () {
        // Jika token sudah ada, return saja (caching sederhana)
        if (this.token) return this.token;

        try {
            const { data } = await this.inst.post('/auth/token', {
                countryCode: 'ID',
                platform: 'android',
                platformFlagLabel: 'phone',
                language: '8',
                deviceId: uuidv4(),
                dataTrackingDeviceId: uuidv4(),
                osVersion: '28',
                appVersion: '2.21.0',
                buildVersion: '770',
                carrierId: '72',
                carrierName: 'Telkomsel',
                appBundleId: 'com.vuclip.viu',
                vuclipUserId: '',
                deviceBrand: 'vivo',
                deviceModel: 'V2242A',
                flavour: 'all'
            });
            
            this.token = data.token;
            this.inst.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
            return data.token;
        } catch (error) {
            console.error("Gagal Get Token:", error.message);
            throw new Error('Auth Failed');
        }
    }
    
    home = async function () {
        if (!this.token) await this.getToken();
        const { data } = await this.inst.get('/mobile', {
            params: { r: '/home/index', platform_flag_label: 'phone', language_flag_id: '8', ut: '0', area_id: '1000', os_flag_id: '2', countryCode: 'ID' }
        });
        return data.data;
    }
    
    search = async function (query) {
        if (!this.token) await this.getToken();
        const { data } = await this.inst.get('/mobile', {
            params: { r: '/search/video', limit: '18', page: '1', 'keyword[]': query, platform_flag_label: 'phone', language_flag_id: '8', ut: '0', area_id: '1000', os_flag_id: '2', countryCode: 'ID' }
        });
        return data.data;
    }
    
    detail = async function (productId) {
        if (!this.token) await this.getToken();
        const { data } = await this.inst.get('/mobile', {
            params: { r: '/vod/detail', product_id: productId, platform_flag_label: 'phone', language_flag_id: '8', ut: '0', area_id: '1000', os_flag_id: '2', countryCode: 'ID' }
        });
        
        const seriesId = data.data.series ? data.data.series.series_id : null;
        let episodes = [];
        
        if (seriesId) {
            const { data: ep } = await this.inst.get('/mobile', {
                params: { r: '/vod/product-list', product_id: productId, series_id: seriesId, platform_flag_label: 'phone', language_flag_id: '8', ut: '0', area_id: '1000', os_flag_id: '2', countryCode: 'ID' }
            });
            episodes = ep.data.product_list;
        } else {
            episodes = [data.data.current_product];
        }
        
        return { metadata: data.data, product_list: episodes };
    }
    
    stream = async function (ccsProductId) {
        if (!this.token) await this.getToken();
        const { data } = await this.inst.get('/playback/distribute', {
            params: { ccs_product_id: ccsProductId, platform_flag_label: 'phone', language_flag_id: '8', ut: '0', area_id: '1000', os_flag_id: '2', countryCode: 'ID' }
        });
        return data.data;
    }
}

// --- EXPRESS SERVER ---
const viu = new Viu();

app.use(cors());
app.use(express.json());

// Root endpoint untuk cek server hidup atau mati
app.get('/api', (req, res) => {
    res.json({ status: "Server SANN404 is Running", message: "Use /api/home to fetch data" });
});

app.get('/api/home', async (req, res) => {
    try {
        const data = await viu.home();
        res.json(data);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/search', async (req, res) => {
    try {
        const { q } = req.query;
        if(!q) return res.status(400).json({error: "Query required"});
        const data = await viu.search(q);
        res.json(data);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/detail', async (req, res) => {
    try {
        const { id } = req.query;
        const data = await viu.detail(id);
        res.json(data);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/stream', async (req, res) => {
    try {
        const { id } = req.query;
        const data = await viu.stream(id);
        res.json(data);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = app;
