// Affiliate tag/ID are env-driven so they can rotate without a redeploy.
// If unset, links still work (just untagged/uncredited) rather than breaking.
const AMAZON_TAG = process.env.AMAZON_ASSOCIATE_TAG || '';
const NEWEGG_AFFILIATE_ID = process.env.NEWEGG_AFFILIATE_ID || '';

const buildAmazonSearchUrl = (query) => {
  const params = new URLSearchParams({ k: query });
  if (AMAZON_TAG) params.set('tag', AMAZON_TAG);
  return `https://www.amazon.com/s?${params.toString()}`;
};

const buildNeweggSearchUrl = (query) => {
  const params = new URLSearchParams({ Keyword: query });
  if (NEWEGG_AFFILIATE_ID) params.set('AID', NEWEGG_AFFILIATE_ID);
  return `https://www.newegg.com/p/pl?${params.toString()}`;
};

const COMPONENT_QUERIES = {
  cpu: 'gaming CPU processor',
  gpu: 'gaming graphics card GPU',
  ram: 'DDR4 DDR5 RAM 16GB',
};

// Generic category shopping links (not a specific product) - useful anywhere
// we want to suggest "upgrade your GPU" without a precise part number to link to.
const buildComponentShopLinks = (componentType) => {
  const query = COMPONENT_QUERIES[componentType] || componentType;
  const label = componentType.toUpperCase();
  return [
    { store: 'Amazon', url: buildAmazonSearchUrl(query), label: `Shop ${label} on Amazon` },
    { store: 'Newegg', url: buildNeweggSearchUrl(query), label: `Shop ${label} on Newegg` },
  ];
};

module.exports = { buildComponentShopLinks };
