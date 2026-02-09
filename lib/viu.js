const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

class Viu {
    constructor() {
        this.inst = axios.create({
            baseURL: 'https://api-gateway-global.viu.com/api',
            headers: {
                'accept-encoding': 'gzip',
                'content-type': 'application/x-www-form-urlencoded',
                platform: 'android',
                'user-agent': 'okhttp/4.12.0'
            }
        });
        this.token = null;
    }
    
    getToken = async function () {
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
            console.error("Token Error", error.message);
            throw new Error(error.message);
        }
    }
    
    home = async function () {
        try {
            if (!this.token) await this.getToken();
            const { data } = await this.inst.get('/mobile', {
                params: { r: '/home/index', platform_flag_label: 'phone', language_flag_id: '8', ut: '0', area_id: '1000', os_flag_id: '2', countryCode: 'ID' }
            });
            return data.data;
        } catch (error) {
            throw new Error(error.message);
        }
    }
    
    search = async function (query) {
        try {
            if (!this.token) await this.getToken();
            const { data } = await this.inst.get('/mobile', {
                params: { r: '/search/video', limit: '18', page: '1', 'keyword[]': query, platform_flag_label: 'phone', language_flag_id: '8', ut: '0', area_id: '1000', os_flag_id: '2', countryCode: 'ID' }
            });
            return data.data;
        } catch (error) {
            throw new Error(error.message);
        }
    }
    
    detail = async function (productId) {
        try {
            if (!this.token) await this.getToken();
            // Get Metadata
            const { data } = await this.inst.get('/mobile', {
                params: { r: '/vod/detail', product_id: productId, platform_flag_label: 'phone', language_flag_id: '8', ut: '0', area_id: '1000', os_flag_id: '2', countryCode: 'ID' }
            });
            
            // Get Episodes
            const seriesId = data.data.series ? data.data.series.series_id : null;
            let episodes = [];
            
            if (seriesId) {
                const { data: ep } = await this.inst.get('/mobile', {
                    params: { r: '/vod/product-list', product_id: productId, series_id: seriesId, platform_flag_label: 'phone', language_flag_id: '8', ut: '0', area_id: '1000', os_flag_id: '2', countryCode: 'ID' }
                });
                episodes = ep.data.product_list;
            } else {
                // If it's a movie, the product itself is the item
                episodes = [data.data.current_product];
            }
            
            return {
                metadata: data.data,
                product_list: episodes
            };
        } catch (error) {
            throw new Error(error.message);
        }
    }
    
    stream = async function (ccsProductId) {
        try {
            if (!this.token) await this.getToken();
            const { data } = await this.inst.get('/playback/distribute', {
                params: { ccs_product_id: ccsProductId, platform_flag_label: 'phone', language_flag_id: '8', ut: '0', area_id: '1000', os_flag_id: '2', countryCode: 'ID' }
            });
            return data.data;
        } catch (error) {
            throw new Error(error.message);
        }
    }
}

module.exports = Viu;
