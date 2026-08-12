// Curated title lists per hardware tier for the programmatic "best games for
// your PC" landing pages. Titles are resolved against live RAWG search at
// request time (and cached) rather than hardcoding RAWG slugs/ids here, so
// the pages never link to a stale or renamed slug.
module.exports = {
  budget: {
    label: 'Budget PC',
    description: 'Great-looking, great-playing games that run comfortably on entry-level hardware (integrated graphics or an entry GPU, 8GB RAM).',
    specBlurb: 'Roughly: 4-core CPU, GTX 1050 Ti / RX 560 class GPU or better, 8GB RAM.',
    titles: [
      'Valorant',
      'Counter-Strike 2',
      'Rocket League',
      'Stardew Valley',
      'Hades',
      'Among Us',
      'Fall Guys',
      'Minecraft',
    ],
  },
  'mid-range': {
    label: 'Mid-Range PC',
    description: 'The sweet spot for most modern releases at solid 1080p/1440p settings on a balanced build.',
    specBlurb: 'Roughly: 6-core CPU, RTX 3060 / RX 6600 class GPU, 16GB RAM.',
    titles: [
      'Elden Ring',
      'Baldur\'s Gate 3',
      'Hogwarts Legacy',
      'Resident Evil 4',
      'God of War',
      'Cyberpunk 2077',
      'Spider-Man Remastered',
      'Forza Horizon 5',
    ],
  },
  'high-end': {
    label: 'High-End PC',
    description: 'The most demanding titles available today, pushed at high settings, high resolution, and ray tracing.',
    specBlurb: 'Roughly: 8-core CPU, RTX 4070 Super / RX 7900 class GPU or better, 32GB RAM.',
    titles: [
      'Alan Wake 2',
      'Star Wars Jedi: Survivor',
      'Microsoft Flight Simulator',
      'Black Myth: Wukong',
      'Cyberpunk 2077',
      'Dragon\'s Dogma 2',
      'Star Citizen',
      'Horizon Forbidden West Complete Edition',
    ],
  },
};
