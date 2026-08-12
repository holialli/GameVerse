const API_BASE_URL = process.env.REACT_APP_API_URL ? `${process.env.REACT_APP_API_URL}/api` : 'http://localhost:5000/api';
const getToken = () => localStorage.getItem('accessToken');

export const authAPI = {
  register: (name, username, email, password, confirmPassword) =>
    fetch(`${API_BASE_URL}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, username, email, password, confirmPassword }) }).then(res => res.json()),
  login: (email, password) =>
    fetch(`${API_BASE_URL}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) }).then(res => res.json()),
  getCurrentUser: (token) => fetch(`${API_BASE_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } }).then(res => res.json()),
  refreshToken: (refreshToken) => fetch(`${API_BASE_URL}/auth/refresh`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken }) }).then(res => res.json()),
};

export const gameAPI = {
  getGames: ({ search = '', genre = '', platform = '', sort = '', page = 1 } = {}) => {
    const params = new URLSearchParams({ page });
    if (search) params.append('q', search);
    if (genre) params.append('genre', genre);
    if (platform) params.append('platform', platform);
    if (sort) params.append('sort', sort);
    return fetch(`${API_BASE_URL}/games/search?${params}`, { headers: { Authorization: `Bearer ${getToken()}` } })
      .then(async (res) => {
        const payload = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(payload?.message || payload?.error || 'Failed to load global game radar');
        }
        return payload;
      });
  },
  getGameById: (id) => fetch(`${API_BASE_URL}/games/${id}`, { headers: { Authorization: `Bearer ${getToken()}` } }).then(res => res.json()),
  createGame: (gameData) => { /* FormData parsing removed for simplicity */ return Promise.resolve(); },
  updateGame: (id, gameData) => { return Promise.resolve(); },
  deleteGame: (id) => fetch(`${API_BASE_URL}/games/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${getToken()}` } }).then(res => res.json()),
  getUserGames: () => fetch(`${API_BASE_URL}/games/user/my-games`, { headers: { Authorization: `Bearer ${getToken()}` } }).then(res => res.json()),
  getSponsored: () => fetch(`${API_BASE_URL}/games/sponsored`).then(res => res.json()),
};

export const userAPI = {
  getUserProfile: (id) => fetch(`${API_BASE_URL}/users/${id}`, { headers: { Authorization: `Bearer ${getToken()}` } }).then(res => res.json()),
  updateProfile: (id, profileData) => fetch(`${API_BASE_URL}/users/${id}/profile`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` }, body: JSON.stringify(profileData) }).then(res => res.json()),
  changePassword: (id, passwordData) => fetch(`${API_BASE_URL}/users/${id}/change-password`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` }, body: JSON.stringify(passwordData) }).then(res => res.json()),
  getDashboard: () => fetch(`${API_BASE_URL}/users/stats/dashboard`, { headers: { Authorization: `Bearer ${getToken()}` } }).then(res => res.json()),
  getLibrary: () => fetch(`${API_BASE_URL}/users/games/library`, { headers: { Authorization: `Bearer ${getToken()}` } }).then(res => res.json()),
  addOrUpdateLibraryGame: (payload) => fetch(`${API_BASE_URL}/users/games`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
    body: JSON.stringify(payload),
  }).then(res => res.json()),
  removeLibraryGame: (rawgId) => fetch(`${API_BASE_URL}/users/games/${rawgId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${getToken()}` },
  }).then(res => res.json()),
  getLeaderboardPreview: () => fetch(`${API_BASE_URL}/users/leaderboard/preview`).then(res => res.json()),
};

export const uploadAPI = { uploadImage: (file) => Promise.resolve() };
export const purchaseAPI = { buyGame: () => Promise.resolve(), rentGame: () => Promise.resolve(), getUserGames: () => Promise.resolve(), returnRental: () => Promise.resolve() };
