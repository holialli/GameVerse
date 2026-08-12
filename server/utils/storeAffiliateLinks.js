// Env-driven affiliate/tracking IDs - not Steam or Epic, neither runs a
// public affiliate program. These four are the real candidates:
//   - GOG: typically via Awin (note: Awin charges a refundable $5 publisher
//     deposit to join - confirm that's acceptable before applying)
//   - Green Man Gaming, Fanatical, Instant Gaming: each run their own direct
//     affiliate programs (no deposit confirmed at time of writing)
//
// IMPORTANT: the URLs below are plain store search links. Once actually
// approved for a program, swap these for that network's real deep-link/
// tracking-redirect format (each dashboard has a link generator) - a bare
// query-string tag on the merchant's own domain does NOT track affiliate
// commission on most of these networks (Awin in particular requires going
// through an awin1.com click-through URL, not a tagged merchant URL).
const GOG_AFFILIATE_ID = process.env.GOG_AFFILIATE_ID || '';
const GMG_AFFILIATE_ID = process.env.GMG_AFFILIATE_ID || '';
const FANATICAL_AFFILIATE_ID = process.env.FANATICAL_AFFILIATE_ID || '';
const INSTANT_GAMING_AFFILIATE_ID = process.env.INSTANT_GAMING_AFFILIATE_ID || '';

// No product-ID mapping to these stores exists, so v1 is search-redirect
// links (search for the title on each store) rather than exact-product deep
// links.
const buildStoreLinks = ({ title }) => {
  const query = encodeURIComponent(title || '');

  return [
    {
      store: 'GOG',
      label: 'Search on GOG',
      url: GOG_AFFILIATE_ID
        ? `https://www.gog.com/games?search=${query}&aid=${GOG_AFFILIATE_ID}`
        : `https://www.gog.com/games?search=${query}`,
    },
    {
      store: 'Green Man Gaming',
      label: 'Search on Green Man Gaming',
      url: GMG_AFFILIATE_ID
        ? `https://www.greenmangaming.com/search/?q=${query}&tap_a=${GMG_AFFILIATE_ID}`
        : `https://www.greenmangaming.com/search/?q=${query}`,
    },
    {
      store: 'Fanatical',
      label: 'Search on Fanatical',
      url: FANATICAL_AFFILIATE_ID
        ? `https://www.fanatical.com/en/search?search=${query}&ref=${FANATICAL_AFFILIATE_ID}`
        : `https://www.fanatical.com/en/search?search=${query}`,
    },
    {
      store: 'Instant Gaming',
      label: 'Search on Instant Gaming',
      url: INSTANT_GAMING_AFFILIATE_ID
        ? `https://www.instant-gaming.com/en/search/?q=${query}&igr=${INSTANT_GAMING_AFFILIATE_ID}`
        : `https://www.instant-gaming.com/en/search/?q=${query}`,
    },
  ];
};

module.exports = { buildStoreLinks };
