// services/exchangeRateService.js

import axios from 'axios';

interface TonApiResponse {
    rates: {
        [token: string]: {
            prices: {
                [currency: string]: number;
            };
            diff_24h?: {
                [token: string]: string;
            };
            diff_7d?: {
                [token: string]: string;
            };
            diff_30d?: {
                [token: string]: string;
            };
        };
    };
}

let cachedRates = {}; // Global variable to store cached rates

export const fetchInitialExchangeRate = async (): Promise<number> => {
    try {
        const response = await axios.get<TonApiResponse>(`https://tonapi.io/v2/rates?tokens=USD&currencies=TON`);
        const priceInUsd = response.data.rates['USD']?.prices['TON'];
        console.log('Initial exchange rate:', priceInUsd);
        return priceInUsd;
    } catch (error) {
        console.error('Failed to fetch initial exchange rate:', error);
        return 0;
    }
};

export const convertToTon = async (amount: number, currency: string): Promise<number> => {
    try {
        if (currency == "USDT") {
            return amount;
        } else {
            const response = await axios.get<TonApiResponse>(`https://tonapi.io/v2/rates?tokens=USD&currencies=TON`);
            const priceInUsd = response.data.rates['USD']?.prices[currency] || 0;
            return amount * priceInUsd;
        }
    } catch (error) {
        console.error('Failed to perform currency conversion:', error);
        return 0;
    }
};


