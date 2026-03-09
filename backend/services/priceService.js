/**
 * services/priceService.js
 *
 * Responsible for fetching and caching the live TON/USD exchange rate.
 * Uses CoinGecko. Rate is cached for 1 hour to avoid API rate limits.
 */

let cachedPrice = 6.0; // Sensible fallback
let lastFetch = 0;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

async function getTonUsdPrice() {
  const now = Date.now();
  if (now - lastFetch < CACHE_TTL_MS) {
    return cachedPrice;
  }

  try {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=the-open-network&vs_currencies=usd'
    );
    if (!res.ok) throw new Error(`CoinGecko HTTP ${res.status}`);
    const data = await res.json();
    const price = data?.['the-open-network']?.usd;
    if (price && typeof price === 'number') {
      cachedPrice = price;
      lastFetch = now;
      console.log(`[PriceService] TON/USD refreshed → $${cachedPrice}`);
    }
  } catch (err) {
    console.warn('[PriceService] Failed to refresh price, using cached value:', err.message);
  }

  return cachedPrice;
}

module.exports = { getTonUsdPrice };
