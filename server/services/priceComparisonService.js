// CheapShark: free, no API key required, and its /redirect endpoint already
// handles the affiliate redirect to the actual store on its side - no store
// affiliate IDs needed for these specific deal links.
const CHEAPSHARK_BASE = 'https://www.cheapshark.com/api/1.0';
const PRICE_CACHE_TTL_MS = 6 * 60 * 60 * 1000; // prices move; 6h is a reasonable balance
const STORE_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // store list barely changes

const priceCache = new Map();
let storeListCache = { stores: null, expiresAt: 0 };

const getStoreList = async () => {
  if (storeListCache.stores && storeListCache.expiresAt > Date.now()) {
    return storeListCache.stores;
  }

  try {
    const response = await fetch(`${CHEAPSHARK_BASE}/stores`);
    if (!response.ok) return storeListCache.stores || {};

    const data = await response.json();
    const byId = {};
    (Array.isArray(data) ? data : []).forEach((store) => {
      byId[store.storeID] = store.storeName;
    });

    storeListCache = { stores: byId, expiresAt: Date.now() + STORE_CACHE_TTL_MS };
    return byId;
  } catch (err) {
    return storeListCache.stores || {};
  }
};

// Defensive by design: any failure returns an empty array rather than
// throwing, so a slow/down price API never breaks the page that embeds this.
const getPricesForTitle = async (title) => {
  const cacheKey = String(title || '').toLowerCase().trim();
  if (!cacheKey) return [];

  const cached = priceCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.deals;

  try {
    const searchParams = new URLSearchParams({ title: cacheKey, limit: '1' });
    const searchRes = await fetch(`${CHEAPSHARK_BASE}/games?${searchParams.toString()}`);
    if (!searchRes.ok) return [];

    const searchResults = await searchRes.json();
    const topMatch = Array.isArray(searchResults) ? searchResults[0] : null;
    if (!topMatch?.gameID) return [];

    const dealsRes = await fetch(`${CHEAPSHARK_BASE}/games?id=${topMatch.gameID}`);
    if (!dealsRes.ok) return [];

    const dealsData = await dealsRes.json();
    const storeNames = await getStoreList();

    const deals = (Array.isArray(dealsData?.deals) ? dealsData.deals : [])
      .map((deal) => ({
        store: storeNames[deal.storeID] || `Store ${deal.storeID}`,
        price: Number(deal.price),
        retailPrice: Number(deal.retailPrice),
        dealUrl: `https://www.cheapshark.com/redirect?dealID=${deal.dealID}`,
      }))
      .filter((deal) => Number.isFinite(deal.price))
      .sort((a, b) => a.price - b.price)
      .slice(0, 8);

    priceCache.set(cacheKey, { deals, expiresAt: Date.now() + PRICE_CACHE_TTL_MS });
    return deals;
  } catch (err) {
    return [];
  }
};

module.exports = { getPricesForTitle };
