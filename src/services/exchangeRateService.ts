import axios from 'axios';

const API_KEY = import.meta.env.VITE_COINAPI_API_KEY!;
const API_URL = `https://rest.coinapi.io/v1/exchangerate/`;

interface ExchangeRateResponse {
    time: string;
    asset_id_base: string;
    asset_id_quote: string;
    rate: number;
}

export const fetchInitialExchangeRate = async (baseCurrency: string, quoteCurrency: string): Promise<number> => {
    try {
        const response = await axios.get<ExchangeRateResponse>(`${API_URL}${baseCurrency}/${quoteCurrency}`, {
            params: {
                apikey: API_KEY,
            },
        });
        return response.data.rate;
    } catch (error) {
        return 0;
    }
};


export const performCurrencyConversion = async (price: number, currency: string | null) => {
    try {
        if (currency === 'USDT') {
            return price;
        } else {
            const response = await axios.get<ExchangeRateResponse>(`${API_URL}USDT/${currency}?apikey=${API_KEY}`);
            return price * response.data.rate;
        }
    } catch (error) {
        // console.error('Failed to perform currency conversion:', error);
        // throw error;
        return 0;
    }
};

export default performCurrencyConversion;
