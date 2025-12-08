# Frontend Implementation Guide

## How to Use GameVerse Features in React

### 1. Authentication Flow

#### Register User
```javascript
// src/services/api.js already has this
const response = await fetch(`${API_BASE_URL}/auth/register`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'John Doe',
    email: 'john@example.com',
    password: 'password123',
    confirmPassword: 'password123'
  })
});
const data = await response.json();
// data contains: accessToken, refreshToken, user
localStorage.setItem('accessToken', data.accessToken);
localStorage.setItem('refreshToken', data.refreshToken);
```

#### Login User
```javascript
const response = await fetch(`${API_BASE_URL}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'john@example.com',
    password: 'password123'
  })
});
const data = await response.json();
localStorage.setItem('accessToken', data.accessToken);
localStorage.setItem('refreshToken', data.refreshToken);
```

#### Refresh Token
```javascript
const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    refreshToken: localStorage.getItem('refreshToken')
  })
});
const data = await response.json();
localStorage.setItem('accessToken', data.accessToken);
localStorage.setItem('refreshToken', data.refreshToken);
```

---

### 2. Protected Routes

#### Get Current User
```javascript
const response = await fetch(`${API_BASE_URL}/auth/me`, {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
  }
});
const user = await response.json();
```

---

### 3. Password Management

#### Forgot Password
```javascript
const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'john@example.com' })
});
// Check email for reset link
```

#### Reset Password (from email link)
```javascript
// User clicks link from email with token
const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    token: urlParams.get('token'),
    newPassword: 'newpass123',
    confirmPassword: 'newpass123'
  })
});
```

#### Change Password (Logged In User)
```javascript
const response = await fetch(`${API_BASE_URL}/users/${userId}/change-password`, {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
  },
  body: JSON.stringify({
    oldPassword: 'currentpass123',
    newPassword: 'newpass123',
    confirmPassword: 'newpass123'
  })
});
```

---

### 4. Pagination Example

```javascript
// Get page 2, 20 items per page
const response = await fetch(
  `${API_BASE_URL}/games?page=2&limit=20`,
  { headers: { 'Authorization': `Bearer ${getToken()}` } }
);
const data = await response.json();
// data: { games: [...], total: 150, page: 2, limit: 20, totalPages: 8 }

// Render pagination
const handlePageChange = (newPage) => {
  fetchGames(newPage, 20);
};
```

---

### 5. Search & Filtering

```javascript
// Search + Filter example
const searchTerm = 'cyber';
const selectedGenre = 'Action';
const selectedPlatform = 'PC';
const sortBy = '-rating'; // descending by rating

const queryParams = new URLSearchParams({
  search: searchTerm,
  genre: selectedGenre,
  platform: selectedPlatform,
  sort: sortBy,
  page: 1,
  limit: 10
});

const response = await fetch(
  `${API_BASE_URL}/games?${queryParams}`,
  { headers: { 'Authorization': `Bearer ${getToken()}` } }
);
const data = await response.json();
// Only returns matching games
```

---

### 6. Dashboard & Analytics

```javascript
// Get Dashboard Data (JWT Protected)
const response = await fetch(
  `${API_BASE_URL}/users/${userId}/dashboard`,
  {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
    }
  }
);
const dashboard = await response.json();

// For admin user:
// dashboard.stats = {
//   totalGames: 15,
//   averageRating: 8.5,
//   genreBreakdown: { Action: 5, RPG: 4, ... }
// }
// dashboard.recentGames = [...]

// For regular user:
// dashboard.stats = {
//   totalPurchased: 5,
//   totalRenting: 2,
//   totalSpent: 49.99
// }
// dashboard.recentPurchases = [...]
// dashboard.activeRentals = [...]
```

---

### 7. Image Upload

```javascript
// Upload game image
const formData = new FormData();
formData.append('image', fileInput.files[0]); // File object

const response = await fetch(`${API_BASE_URL}/upload`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
  },
  body: formData // Don't set Content-Type, browser will set multipart/form-data
});
const data = await response.json();
// data.imageUrl = '/public/uploads/filename.jpg'
```

---

### 8. Admin: Create Game with Image

```javascript
// Create new game
const formData = new FormData();
formData.append('title', 'New Game');
formData.append('description', 'Desc');
formData.append('genre', 'Action');
formData.append('releaseDate', '2024-03-15');
formData.append('rating', 8);
formData.append('platform', JSON.stringify(['PC', 'PlayStation']));
formData.append('developer', 'Studio Name');
formData.append('buyPrice', 59.99);
formData.append('rentPrice', 4.99);
formData.append('image', fileInput.files[0]); // Optional

const response = await fetch(`${API_BASE_URL}/games`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
  },
  body: formData
});
const data = await response.json();
// data.game contains created game with imageUrl
```

---

### 9. Admin: Update Game

```javascript
// Update existing game
const formData = new FormData();
formData.append('title', 'Updated Title');
formData.append('rating', 8.5);
formData.append('buyPrice', 49.99);
// Optional: formData.append('image', newImageFile);

const response = await fetch(`${API_BASE_URL}/games/${gameId}`, {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
  },
  body: formData
});
const data = await response.json();
// data.game = updated game
```

---

### 10. User: Purchase & Rental

```javascript
// Buy a game
const buyResponse = await fetch(`${API_BASE_URL}/purchases/buy`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
  },
  body: JSON.stringify({ gameId: 'game123' })
});

// Rent a game (7-day rental)
const rentResponse = await fetch(`${API_BASE_URL}/purchases/rent`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
  },
  body: JSON.stringify({ gameId: 'game123' })
});

// Get my purchases
const myGamesResponse = await fetch(`${API_BASE_URL}/purchases/my-games`, {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
  }
});
const myGames = await myGamesResponse.json();

// Return a rental
const returnResponse = await fetch(
  `${API_BASE_URL}/purchases/${purchaseId}/return`,
  {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
    }
  }
);
```

---

### 11. Error Handling

```javascript
async function apiCall(url, options = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      }
    });

    if (response.status === 401) {
      // Token expired, try refresh
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        // Retry original request
        return apiCall(url, options);
      } else {
        // Logout user
        localStorage.clear();
        window.location.href = '/login';
      }
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'API Error');
    }

    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}
```

---

### 12. Rate Limiting Handling

```javascript
// Server returns 429 (Too Many Requests)
async function handleRateLimitError() {
  console.warn('Rate limited! Please wait before making more requests.');
  // Could show user-friendly message
  // Implement exponential backoff
  await new Promise(resolve => setTimeout(resolve, 5000));
  // Retry request
}
```

---

## Complete Example Component: Games List with Pagination & Search

```javascript
import React, { useState, useEffect } from 'react';
import { gameAPI } from '../../services/api';

const GamesList = () => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [genre, setGenre] = useState('');
  const [platform, setPlatform] = useState('');
  const [sort, setSort] = useState('-createdAt');

  useEffect(() => {
    fetchGames();
  }, [page, search, genre, platform, sort]);

  const fetchGames = async () => {
    setLoading(true);
    try {
      const response = await gameAPI.getGames({
        page,
        limit: 10,
        search,
        genre,
        platform,
        sort
      });
      setGames(response.games);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error('Failed to fetch games:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleGenreChange = (e) => {
    setGenre(e.target.value);
    setPage(1);
  };

  const handlePlatformChange = (e) => {
    setPlatform(e.target.value);
    setPage(1);
  };

  const handleSort = (e) => {
    setSort(e.target.value);
    setPage(1);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div className="filters">
        <input
          type="text"
          placeholder="Search games..."
          value={search}
          onChange={handleSearch}
        />
        
        <select value={genre} onChange={handleGenreChange}>
          <option value="">All Genres</option>
          <option value="Action">Action</option>
          <option value="RPG">RPG</option>
          <option value="Strategy">Strategy</option>
        </select>

        <select value={platform} onChange={handlePlatformChange}>
          <option value="">All Platforms</option>
          <option value="PC">PC</option>
          <option value="PlayStation">PlayStation</option>
          <option value="Xbox">Xbox</option>
        </select>

        <select value={sort} onChange={handleSort}>
          <option value="-createdAt">Newest First</option>
          <option value="-rating">Highest Rated</option>
          <option value="title">Title (A-Z)</option>
        </select>
      </div>

      <div className="games-grid">
        {games.map(game => (
          <div key={game._id} className="game-card">
            <h3>{game.title}</h3>
            <p>Genre: {game.genre}</p>
            <p>Rating: {game.rating}/10</p>
            <p>${game.buyPrice}</p>
          </div>
        ))}
      </div>

      <div className="pagination">
        <button
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
        >
          Previous
        </button>
        <span>Page {page} of {totalPages}</span>
        <button
          disabled={page === totalPages}
          onClick={() => setPage(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default GamesList;
```

---

## Complete Example Component: User Dashboard with Analytics

```javascript
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { userAPI } from '../../services/api';

const Dashboard = () => {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchDashboard();
    }
  }, [user]);

  const fetchDashboard = async () => {
    try {
      const data = await userAPI.getDashboard(user.id);
      setDashboard(data);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading dashboard...</div>;
  if (!dashboard) return <div>Failed to load dashboard</div>;

  const isAdmin = user?.role === 'admin';

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>
      
      {isAdmin ? (
        <div className="admin-stats">
          <div className="stat-card">
            <h3>Total Games</h3>
            <p className="stat-value">{dashboard.stats.totalGames}</p>
          </div>
          
          <div className="stat-card">
            <h3>Average Rating</h3>
            <p className="stat-value">{dashboard.stats.averageRating?.toFixed(1)}/10</p>
          </div>

          <div className="stat-card">
            <h3>Genre Breakdown</h3>
            <ul>
              {Object.entries(dashboard.stats.genreBreakdown || {}).map(([genre, count]) => (
                <li key={genre}>{genre}: {count}</li>
              ))}
            </ul>
          </div>

          <div className="recent-games">
            <h3>Recent Games</h3>
            {dashboard.recentGames?.map(game => (
              <div key={game._id} className="game-item">
                <h4>{game.title}</h4>
                <p>{game.genre} • Rating: {game.rating}/10</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="user-stats">
          <div className="stat-card">
            <h3>Games Purchased</h3>
            <p className="stat-value">{dashboard.stats.totalPurchased}</p>
          </div>
          
          <div className="stat-card">
            <h3>Active Rentals</h3>
            <p className="stat-value">{dashboard.stats.totalRenting}</p>
          </div>

          <div className="stat-card">
            <h3>Total Spent</h3>
            <p className="stat-value">${dashboard.stats.totalSpent?.toFixed(2)}</p>
          </div>

          <div className="recent-purchases">
            <h3>Recent Purchases</h3>
            {dashboard.recentPurchases?.map(purchase => (
              <div key={purchase._id} className="purchase-item">
                <h4>{purchase.gameId?.title}</h4>
                <p>${purchase.price} • {purchase.type === 'buy' ? 'Purchased' : 'Rented'}</p>
              </div>
            ))}
          </div>

          <div className="active-rentals">
            <h3>Active Rentals</h3>
            {dashboard.activeRentals?.map(rental => (
              <div key={rental._id} className="rental-item">
                <h4>{rental.gameId?.title}</h4>
                <p>Expires: {new Date(rental.expiryDate).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
```

---

## Key Takeaways

1. **Always include Authorization header** for protected routes
2. **Handle token refresh** when 401 errors occur
3. **Use URLSearchParams** for query parameters
4. **Use FormData** for file uploads (multipart/form-data)
5. **Implement error handling** for rate limiting (429)
6. **Cache dashboard data** to reduce API calls
7. **Validate form data** before sending to API
8. **Clear tokens** on logout
