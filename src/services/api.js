const API_BASE_URL = 'http://localhost:5000/api';

// Auth API calls
export const authAPI = {
  register: (name, email, password, confirmPassword) =>
    fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, confirmPassword }),
    }),

  login: (email, password) =>
    fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    }),

  getCurrentUser: (token) =>
    fetch(`${API_BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
};

// Game API calls
export const gameAPI = {
  getAllGames: (page = 1, limit = 10, search = '', genre = '', sort = '') => {
    const params = new URLSearchParams({ page, limit });
    if (search) params.append('search', search);
    if (genre) params.append('genre', genre);
    if (sort) params.append('sort', sort);

    return fetch(`${API_BASE_URL}/games?${params}`);
  },

  getGameById: (id) => fetch(`${API_BASE_URL}/games/${id}`),

  createGame: (gameData, token) => {
    const formData = new FormData();
    Object.keys(gameData).forEach((key) => {
      if (key === 'platform') {
        formData.append(key, JSON.stringify(gameData[key]));
      } else {
        formData.append(key, gameData[key]);
      }
    });

    return fetch(`${API_BASE_URL}/games`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
  },

  updateGame: (id, gameData, token) => {
    const formData = new FormData();
    Object.keys(gameData).forEach((key) => {
      if (key === 'platform') {
        formData.append(key, JSON.stringify(gameData[key]));
      } else {
        formData.append(key, gameData[key]);
      }
    });

    return fetch(`${API_BASE_URL}/games/${id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
  },

  deleteGame: (id, token) =>
    fetch(`${API_BASE_URL}/games/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }),

  getUserGames: (token) =>
    fetch(`${API_BASE_URL}/games/user/my-games`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
};

// User API calls
export const userAPI = {
  getUserProfile: (id) => fetch(`${API_BASE_URL}/users/${id}`),

  updateProfile: (id, profileData, token) =>
    fetch(`${API_BASE_URL}/users/${id}/profile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(profileData),
    }),

  changePassword: (id, passwordData, token) =>
    fetch(`${API_BASE_URL}/users/${id}/change-password`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(passwordData),
    }),

  getDashboard: (id, token) =>
    fetch(`${API_BASE_URL}/users/${id}/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
};

// Upload API
export const uploadAPI = {
  uploadImage: (file, token) => {
    const formData = new FormData();
    formData.append('image', file);

    return fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
  },
};
