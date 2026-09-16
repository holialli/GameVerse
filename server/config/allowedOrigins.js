// Browser origins allowed to call the API and open a Socket.IO connection.
// CLIENT_URL may hold several comma-separated origins (e.g. the Vercel URL
// plus a custom domain). Trailing slashes are stripped because the browser's
// Origin header never has one.
const getAllowedOrigins = () => {
  const fromEnv = (process.env.CLIENT_URL || '')
    .split(',')
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter(Boolean);

  return [...new Set([
    'http://localhost:3000',
    'https://game-verse.tech',
    ...fromEnv,
  ])];
};

module.exports = { getAllowedOrigins };
