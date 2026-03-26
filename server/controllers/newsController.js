const sourceWeights = {
  gaming: 1.25,
  games: 1.2,
  pcgaming: 1.15,
  esports: 1.25,
};

const hotKeywords = ['update', 'launch', 'season', 'major', 'championship', 'leak', 'record', 'esports'];

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
    const feeds = [
      'https://www.reddit.com/r/gaming/hot.json?limit=20',
      'https://www.reddit.com/r/Games/hot.json?limit=20',
      'https://www.reddit.com/r/pcgaming/hot.json?limit=20',
      'https://www.reddit.com/r/esports/hot.json?limit=20',
    ];

    const results = await Promise.all(
      feeds.map(async (url) => {
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

    const flat = results.flat();
    const seen = new Set();
    const deduped = flat.filter((post) => {
      const key = String(post?.url || post?.id || '').trim();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const mapped = deduped
      .filter((post) => !post.over_18)
      .map((post, index) => {
        const hotScore = scorePost(post);
        const reactions = Number(post.ups || 0) + Number(post.num_comments || 0);
        return {
          id: post.id || `${post.created_utc || Date.now()}-${index}`,
          title: post.title || 'Untitled',
          body: post.selftext || post.title || 'Trending in gaming communities.',
          source: `r/${post.subreddit || 'gaming'}`,
          tags: [post.subreddit || 'gaming', 'trending'],
          reactions,
          comments: Number(post.num_comments || 0),
          hotScore: Number(hotScore.toFixed(2)),
          createdAt: post.created_utc ? new Date(post.created_utc * 1000).toISOString() : null,
          url: post.url?.startsWith('http') ? post.url : `https://www.reddit.com${post.permalink || ''}`,
        };
      })
      .sort((a, b) => b.hotScore - a.hotScore)
      .slice(0, 16);

    res.json({ provider: 'reddit-hot', articles: mapped });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch trending gaming news' });
  }
};
