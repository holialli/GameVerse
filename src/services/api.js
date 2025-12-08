const API_BASE_URL = process.env.REACT_APP_API_URL ? `${process.env.REACT_APP_API_URL}/api` : 'http://localhost:5000/api';

// Helper function to get token
const getToken = () => localStorage.getItem('accessToken');

// Auth API calls
export const authAPI = {
  register: (name, email, password, confirmPassword) =>
    fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, confirmPassword }),
    }).then(res => {
      if (!res.ok) return res.json().then(err => { throw err; });
      return res.json();
    }),

  login: (email, password) =>
    fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    }).then(res => {
      if (!res.ok) return res.json().then(err => { throw err; });
      return res.json();
    }),

  getCurrentUser: (token) =>
    fetch(`${API_BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(res => {
      if (!res.ok) return res.json().then(err => { throw err; });
      return res.json();
    }),

  refreshToken: (refreshToken) =>
    fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    }).then(res => {
      if (!res.ok) return res.json().then(err => { throw err; });
      return res.json();
    }),
};

// Game API calls
export const gameAPI = {
  getGames: ({ search = '', genre = '', platform = '', sort = '-createdAt', page = 1, limit = 10 } = {}) => {
    const params = new URLSearchParams({ page, limit, sort });
    if (search) params.append('search', search);
    if (genre) params.append('genre', genre);
    if (platform) params.append('platform', platform);

    return fetch(`${API_BASE_URL}/games?${params}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    }).then(res => {
      if (!res.ok) return res.json().then(err => { throw err; });
      return res.json();
    });
  },

  getGameById: (id) => 
    fetch(`${API_BASE_URL}/games/${id}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    }).then(res => {
      if (!res.ok) return res.json().then(err => { throw err; });
      return res.json();
    }),

  createGame: (gameData) => {
    const body = new FormData();
    if (gameData.platform && Array.isArray(gameData.platform)) {
      body.append('platform', JSON.stringify(gameData.platform));
    } else {
      body.append('platform', JSON.stringify([]));
    }
    Object.keys(gameData).forEach(key => {
      if (key !== 'platform' && gameData[key] !== '' && gameData[key] !== null && gameData[key] !== undefined) {
        body.append(key, gameData[key]);
      }
    });

    return fetch(`${API_BASE_URL}/games`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${getToken()}` },
      body,
    }).then(res => {
      if (!res.ok) return res.json().then(err => { throw err; });
      return res.json();
    });
  },

  updateGame: (id, gameData) => {
    const body = new FormData();
    if (gameData.platform && Array.isArray(gameData.platform)) {
      body.append('platform', JSON.stringify(gameData.platform));
    } else {
      body.append('platform', JSON.stringify([]));
    }
    Object.keys(gameData).forEach(key => {
      if (key !== 'platform' && gameData[key] !== '' && gameData[key] !== null && gameData[key] !== undefined) {
        body.append(key, gameData[key]);
      }
    });

    return fetch(`${API_BASE_URL}/games/${id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${getToken()}` },
      body,
    }).then(res => {
      if (!res.ok) return res.json().then(err => { throw err; });
      return res.json();
    });
  },

  deleteGame: (id) =>
    fetch(`${API_BASE_URL}/games/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${getToken()}` },
    }).then(res => {
      if (!res.ok) return res.json().then(err => { throw err; });
      return res.json();
    }),

  getUserGames: () =>
    fetch(`${API_BASE_URL}/games/user/my-games`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    }).then(res => {
      if (!res.ok) return res.json().then(err => { throw err; });
      return res.json();
    }),
};

// User API calls
export const userAPI = {
  getUserProfile: (id) => 
    fetch(`${API_BASE_URL}/users/${id}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    }),

  updateProfile: (id, profileData) =>
    fetch(`${API_BASE_URL}/users/${id}/profile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify(profileData),
    }).then(res => {
      if (!res.ok) return res.json().then(err => { throw err; });
      return res.json();
    }),

  changePassword: (id, passwordData) =>
    fetch(`${API_BASE_URL}/users/${id}/change-password`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify(passwordData),
    }).then(res => {
      if (!res.ok) return res.json().then(err => { throw err; });
      return res.json();
    }),

  getDashboard: (id) =>
    fetch(`${API_BASE_URL}/users/${id}/dashboard`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    }).then(res => {
      if (!res.ok) return res.json().then(err => { throw err; });
      return res.json();
    }),
};

// Upload API
export const uploadAPI = {
  uploadImage: (file) => {
    const formData = new FormData();
    formData.append('image', file);

    return fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${getToken()}` },
      body: formData,
    }).then(res => {
      if (!res.ok) return res.json().then(err => { throw err; });
      return res.json();
    });
  },
};

// Purchase API calls
export const purchaseAPI = {
  buyGame: (gameId) =>
    fetch(`${API_BASE_URL}/purchases/buy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ gameId }),
    }).then(res => {
      if (!res.ok) return res.json().then(err => { throw err; });
      return res.json();
    }),

  rentGame: (gameId) =>
    fetch(`${API_BASE_URL}/purchases/rent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ gameId }),
    }).then(res => {
      if (!res.ok) return res.json().then(err => { throw err; });
      return res.json();
    }),

  getUserGames: () =>
    fetch(`${API_BASE_URL}/purchases/my-games`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    }).then(res => {
      if (!res.ok) return res.json().then(err => { throw err; });
      return res.json();
    }),

  returnRental: (purchaseId) =>
    fetch(`${API_BASE_URL}/purchases/${purchaseId}/return`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${getToken()}` },
    }).then(res => {
      if (!res.ok) return res.json().then(err => { throw err; });
      return res.json();
    }),
};


