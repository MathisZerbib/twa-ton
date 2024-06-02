import axios from 'axios';

const API_KEY = 'FD3DCB80-D05F-4E79-A156-2C6BFB7A7981';
const API_URL = `https://rest.coinapi.io/v1/exchangerate/`;
const WS_URL = 'wss://ws.coinapi.io/v1/';

interface ExchangeRateResponse {
    time: string;
    asset_id_base: string;
    asset_id_quote: string;
    rate: number;
}

export const fetchInitialExchangeRate = async (): Promise<number> => {
    try {
        const response = await axios.get<ExchangeRateResponse>(`${API_URL}TON/USDT?apikey=${API_KEY}`);
        return response.data.rate;
    } catch (error) {
        console.error('Failed to fetch initial exchange rate:', error);
        throw error;
    }
};

export const connectWebSocket = (onRateUpdate: (rate: number) => void): WebSocket => {
    const ws = new WebSocket(WS_URL);

    ws.onopen = () => {
        const msg = {
            type: 'hello',
            apikey: API_KEY,
            heartbeat: false,
            subscribe_data_type: ['exrate'],
            subscribe_filter_asset_id: ['TON/USDT'],
        };
        ws.send(JSON.stringify(msg));
    };

    ws.onmessage = (event) => {
        const data: any = JSON.parse(event.data);
        if (data.rate && data.asset_id_base === 'TON' && data.asset_id_quote === 'USDT') {
            onRateUpdate(data.rate);
        }
    };

    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
        console.log('WebSocket connection closed, reconnecting...');
        setTimeout(() => connectWebSocket(onRateUpdate), 1000);
    };

    return ws;
};

const performCurrencyConversion = async (price: number, currency: string | null) => {
    try {
        if (currency === 'TON') {
            return price;
        } else {
            const response = await axios.get<ExchangeRateResponse>(`${API_URL}TON/${currency}?apikey=${API_KEY}`);
            return price * response.data.rate;
        }
    } catch (error) {
        console.error('Failed to perform currency conversion:', error);
        throw error;
    }
};

export default performCurrencyConversion;
