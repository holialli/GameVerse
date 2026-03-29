const sourceWeights = {
  gaming: 1.25,
  games: 1.2,
  pcgaming: 1.15,
  esports: 1.25,
  gamedev: 1.05,
  ps5: 1.08,
  xboxseriesx: 1.08,
  nintendo: 1.08,
  ign: 1.18,
  polygon: 1.12,
  pcgamer: 1.14,
  kotaku: 1.12,
  gamespot: 1.13,
  eurogamer: 1.12,
  rockpapershotgun: 1.11,
  vg247: 1.1,
  destructoid: 1.08,
};

const hotKeywords = ['update', 'launch', 'season', 'major', 'championship', 'leak', 'record', 'esports'];
const controversyKeywords = ['controversy', 'controversial', 'backlash', 'boycott', 'drama', 'debate', 'lawsuit'];

let cachedDayKey = null;
let cachedArticles = null;

const parseRssItems = (xml = '') => {
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/gi;
  const titleRegex = /<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>|<title[^>]*>([\s\S]*?)<\/title>/i;
  const descRegex = /<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>|<description[^>]*>([\s\S]*?)<\/description>|<summary[^>]*>([\s\S]*?)<\/summary>/i;
  const linkRegex = /<link>([\s\S]*?)<\/link>|<link[^>]*href=["']([^"']+)["'][^>]*\/?>(?:<\/link>)?/i;
  const dateRegex = /<pubDate>([\s\S]*?)<\/pubDate>|<updated>([\s\S]*?)<\/updated>|<published>([\s\S]*?)<\/published>/i;
  const categoryRegex = /<category[^>]*>([\s\S]*?)<\/category>/gi;

  const parseChunks = (regex) => {
    const entries = [];
    let match;
    while ((match = regex.exec(xml)) !== null) {
      entries.push(match[1] || '');
    }
    return entries;
  };

  const chunks = [...parseChunks(itemRegex), ...parseChunks(entryRegex)];
  const items = [];

  chunks.forEach((chunk) => {
    const titleMatch = chunk.match(titleRegex);
    const descMatch = chunk.match(descRegex);
    const linkMatch = chunk.match(linkRegex);
    const dateMatch = chunk.match(dateRegex);

    const categories = [];
    let catMatch;
    while ((catMatch = categoryRegex.exec(chunk)) !== null) {
      categories.push(String(catMatch[1] || '').trim());
    }

    const title = String(titleMatch?.[1] || titleMatch?.[2] || '').replace(/<!\[CDATA\[|\]\]>/g, '').trim();
    const descriptionRaw = String(descMatch?.[1] || descMatch?.[2] || descMatch?.[3] || '').trim();
    const description = descriptionRaw.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const link = String(linkMatch?.[1] || linkMatch?.[2] || '').trim();
    const pubDate = String(dateMatch?.[1] || dateMatch?.[2] || dateMatch?.[3] || '').trim();

    if (!title || !link) return;

    items.push({
      title,
      description,
      link,
      pubDate,
      categories,
    });
  });

  return items;
};

const scorePost = (post) => {
  const ups = Number(post.ups || 0);
  const comments = Number(post.num_comments || 0);
  const ageHours = Math.max(1, (Date.now() - Number(post.created_utc || 0) * 1000) / (1000 * 60 * 60));
  const sourceWeight = sourceWeights[post.subreddit?.toLowerCase()] || 1;
  const keywordBoost = hotKeywords.some((k) => String(post.title || '').toLowerCase().includes(k)) ? 1.12 : 1;

  return ((ups * 1.3) + (comments * 3.8)) * sourceWeight * keywordBoost / Math.pow(ageHours + 2, 0.68);
};

exports.getTrendingNews = async (req, res) => {
  try {
    const todayKey = new Date().toISOString().slice(0, 10);
    if (cachedDayKey === todayKey && Array.isArray(cachedArticles) && cachedArticles.length > 0) {
      return res.json({ provider: 'mixed-feeds', refreshedAt: `${todayKey}T00:00:00.000Z`, articles: cachedArticles });
    }

    const redditFeeds = [
      'https://www.reddit.com/r/gaming/top.json?t=day&limit=15',
      'https://www.reddit.com/r/Games/top.json?t=day&limit=15',
      'https://www.reddit.com/r/pcgaming/top.json?t=day&limit=15',
      'https://www.reddit.com/r/esports/top.json?t=day&limit=15',
      'https://www.reddit.com/r/gamedev/top.json?t=day&limit=10',
      'https://www.reddit.com/r/PS5/top.json?t=day&limit=10',
      'https://www.reddit.com/r/XboxSeriesX/top.json?t=day&limit=10',
      'https://www.reddit.com/r/Nintendo/top.json?t=day&limit=10',
    ];

    const rssFeeds = [
      { key: 'ign', url: 'https://feeds.ign.com/ign/games-all', source: 'IGN' },
      { key: 'polygon', url: 'https://www.polygon.com/rss/index.xml', source: 'Polygon' },
      { key: 'pcgamer', url: 'https://www.pcgamer.com/rss/', source: 'PC Gamer' },
      { key: 'kotaku', url: 'https://kotaku.com/rss', source: 'Kotaku' },
      { key: 'gamespot', url: 'https://www.gamespot.com/feeds/mashup/', source: 'GameSpot' },
      { key: 'eurogamer', url: 'https://www.eurogamer.net/feed', source: 'Eurogamer' },
      { key: 'rockpapershotgun', url: 'https://www.rockpapershotgun.com/feed', source: 'Rock Paper Shotgun' },
      { key: 'vg247', url: 'https://www.vg247.com/feed', source: 'VG247' },
      { key: 'destructoid', url: 'https://www.destructoid.com/feed/', source: 'Destructoid' },
    ];

    const redditResults = await Promise.all(
      redditFeeds.map(async (url) => {
        try {
          const response = await fetch(url, {
            headers: { 'User-Agent': 'GameVerse/1.0 (news aggregator)' },
          });
          if (!response.ok) return [];
          const data = await response.json();
          const children = Array.isArray(data?.data?.children) ? data.data.children : [];
          return children.map((c) => c.data).filter(Boolean);
        } catch (err) {
          return [];
        }
      })
    );

    const rssResults = await Promise.all(
      rssFeeds.map(async (feed) => {
        try {
          const response = await fetch(feed.url, {
            headers: { 'User-Agent': 'GameVerse/1.0 (news aggregator)' },
          });

          if (!response.ok) return [];
          const xml = await response.text();
          const items = parseRssItems(xml);
          return items.map((item, index) => {
            const titleLc = item.title.toLowerCase();
            const descLc = item.description.toLowerCase();
            const commentProxy = controversyKeywords.reduce((acc, keyword) => (
              titleLc.includes(keyword) || descLc.includes(keyword) ? acc + 18 : acc
            ), 0);
            const freshnessHours = item.pubDate
              ? Math.max(1, (Date.now() - new Date(item.pubDate).getTime()) / (1000 * 60 * 60))
              : 24;
            const reactions = item.title.length + Math.min(220, item.description.length) + commentProxy;
            // Prefer editorial/blog sources over subreddit chatter.
            const hotScore = (((reactions * sourceWeights[feed.key]) / 6.5) + commentProxy + 70) / Math.pow(freshnessHours + 2, 0.3);
            const tags = [feed.source.toLowerCase(), 'blog'];
            if (commentProxy > 0) tags.push('controversial');

            return {
              id: `rss-${feed.key}-${index}-${item.link}`,
              title: item.title,
              body: item.description || item.title,
              source: feed.source,
              kind: 'blog',
              tags,
              reactions,
              comments: commentProxy,
              hotScore: Number(hotScore.toFixed(2)),
              createdAt: item.pubDate ? new Date(item.pubDate).toISOString() : null,
              url: item.link,
            };
          });
        } catch (err) {
          return [];
        }
      })
    );

    const flat = redditResults.flat();
    const seen = new Set();
    const deduped = flat.filter((post) => {
      const key = String(post?.url || post?.id || '').trim();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const mappedReddit = deduped
      .filter((post) => !post.over_18)
      .map((post, index) => {
        const hotScore = scorePost(post) * 0.78; // Lower weight than editorial sources.
        const reactions = Number(post.ups || 0) + Number(post.num_comments || 0);
        const titleLc = String(post.title || '').toLowerCase();
        const tags = [post.subreddit || 'gaming', 'trending'];
        if (controversyKeywords.some((k) => titleLc.includes(k))) {
          tags.push('controversial');
        }

        return {
          id: post.id || `${post.created_utc || Date.now()}-${index}`,
          title: post.title || 'Untitled',
          body: post.selftext || post.title || 'Trending in gaming communities.',
          source: `r/${post.subreddit || 'gaming'}`,
          kind: 'community',
          tags,
          reactions,
          comments: Number(post.num_comments || 0),
          hotScore: Number(hotScore.toFixed(2)),
          createdAt: post.created_utc ? new Date(post.created_utc * 1000).toISOString() : null,
          url: post.url?.startsWith('http') ? post.url : `https://www.reddit.com${post.permalink || ''}`,
        };
      })
      .slice(0, 30);

    const allBlogs = rssResults.flat().sort((a, b) => Number(b.hotScore || 0) - Number(a.hotScore || 0));
    const allCommunity = mappedReddit.sort((a, b) => Number(b.hotScore || 0) - Number(a.hotScore || 0));

    // Prioritize publication/blog coverage, then blend in top community discourse.
    const merged = [...allBlogs.slice(0, 16), ...allCommunity.slice(0, 8)].slice(0, 24);

    cachedDayKey = todayKey;
    cachedArticles = merged;

    res.json({ provider: 'mixed-feeds', refreshedAt: `${todayKey}T00:00:00.000Z`, articles: merged });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch trending gaming news' });
  }
};
