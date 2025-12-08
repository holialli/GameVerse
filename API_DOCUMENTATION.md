# GameVerse API Documentation

## Base URL
```
http://localhost:5000/api
```

---

## Authentication Endpoints

### 1. Register User
```
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "confirmPassword": "password123"
}

Response (201):
{
  "message": "User registered successfully",
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": {
    "id": "65abc123...",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

### 2. Login User
```
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}

Response (200):
{
  "message": "Login successful",
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": {
    "id": "65abc123...",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

### 3. Refresh Access Token
```
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGc..."
}

Response (200):
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

### 4. Get Current User
```
GET /auth/me
Authorization: Bearer <accessToken>

Response (200):
{
  "id": "65abc123...",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "user",
  "avatar": null,
  "bio": "..."
}
```

### 5. Forgot Password
```
POST /auth/forgot-password
Content-Type: application/json

{
  "email": "john@example.com"
}

Response (200):
{
  "message": "Password reset link sent to your email"
}
```

### 6. Reset Password
```
POST /auth/reset-password
Content-Type: application/json

{
  "token": "abc123def456...",
  "newPassword": "newpass123",
  "confirmPassword": "newpass123"
}

Response (200):
{
  "message": "Password reset successfully"
}
```

---

## User Endpoints

### 1. Get User Profile
```
GET /users/:userId
Authorization: Bearer <accessToken>

Response (200):
{
  "id": "65abc123...",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "user",
  "avatar": null,
  "bio": "Gaming enthusiast",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

### 2. Update User Profile
```
PATCH /users/:userId/profile
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "name": "John Smith",
  "bio": "Pro gamer",
  "avatar": "https://..."
}

Response (200):
{
  "message": "Profile updated successfully",
  "user": { ... }
}
```

### 3. Change Password
```
PATCH /users/:userId/change-password
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "oldPassword": "currentpass123",
  "newPassword": "newpass123",
  "confirmPassword": "newpass123"
}

Response (200):
{
  "message": "Password changed successfully"
}
```

### 4. Get Dashboard (Analytics)
```
GET /users/:userId/dashboard
Authorization: Bearer <accessToken>

Response (200) - Admin:
{
  "user": { ... },
  "stats": {
    "totalGames": 15,
    "averageRating": 8.5,
    "genreBreakdown": {
      "Action": 5,
      "RPG": 4,
      "Strategy": 6
    }
  },
  "recentGames": [ ... ]
}

Response (200) - Regular User:
{
  "user": { ... },
  "stats": {
    "totalPurchased": 5,
    "totalRenting": 2,
    "totalSpent": 49.99
  },
  "recentPurchases": [ ... ],
  "activeRentals": [ ... ]
}
```

---

## Game Endpoints

### 1. Get All Games (Paginated + Filtered)
```
GET /games?page=1&limit=10&search=cyber&genre=Action&platform=PC&sort=-rating
Authorization: Not required

Query Parameters:
- page (number): Page number (default: 1)
- limit (number): Items per page (default: 10)
- search (string): Search by title/description
- genre (string): Filter by genre
- platform (string): Filter by platform
- sort (string): Sort field (default: -createdAt)
  Available: createdAt, -createdAt, rating, -rating, title, -title

Response (200):
{
  "games": [
    {
      "_id": "65abc123...",
      "title": "Cyber Warriors 2077",
      "description": "...",
      "genre": "Action",
      "rating": 8.5,
      "platform": ["PC", "PlayStation"],
      "buyPrice": 59.99,
      "rentPrice": 4.99,
      "developer": "...",
      "imageUrl": "...",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 150,
  "page": 1,
  "limit": 10,
  "totalPages": 15
}
```

### 2. Get Single Game
```
GET /games/:gameId
Authorization: Not required

Response (200):
{
  "_id": "65abc123...",
  "title": "Cyber Warriors 2077",
  "description": "...",
  "genre": "Action",
  "rating": 8.5,
  "platform": ["PC", "PlayStation"],
  "buyPrice": 59.99,
  "rentPrice": 4.99,
  "developer": "...",
  "imageUrl": "...",
  "createdBy": {
    "_id": "admin123...",
    "name": "Admin User",
    "email": "admin@example.com"
  },
  "createdAt": "2024-01-15T10:30:00Z"
}
```

### 3. Create Game (Admin Only)
```
POST /games
Authorization: Bearer <accessToken> (Admin required)
Content-Type: multipart/form-data

{
  "title": "New Game",
  "description": "Game description",
  "genre": "Action",
  "releaseDate": "2024-03-15",
  "rating": 8,
  "platform": ["PC", "PlayStation"],
  "developer": "Dev Studio",
  "buyPrice": 59.99,
  "rentPrice": 4.99,
  "image": <file>
}

Response (201):
{
  "message": "Game created successfully",
  "game": { ... }
}
```

### 4. Update Game (Admin Only)
```
PATCH /games/:gameId
Authorization: Bearer <accessToken> (Admin required)
Content-Type: multipart/form-data

{
  "title": "Updated Title",
  "rating": 8.5,
  "buyPrice": 49.99
}

Response (200):
{
  "message": "Game updated successfully",
  "game": { ... }
}
```

### 5. Delete Game (Admin Only)
```
DELETE /games/:gameId
Authorization: Bearer <accessToken> (Admin required)

Response (200):
{
  "message": "Game deleted successfully"
}
```

---

## Purchase Endpoints

### 1. Buy Game
```
POST /purchases/buy
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "gameId": "65abc123..."
}

Response (201):
{
  "message": "Game purchased successfully",
  "purchase": {
    "_id": "purchase123...",
    "userId": "user123...",
    "gameId": "game123...",
    "type": "buy",
    "price": 59.99,
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

### 2. Rent Game
```
POST /purchases/rent
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "gameId": "65abc123..."
}

Response (201):
{
  "message": "Game rented successfully",
  "purchase": {
    "_id": "purchase123...",
    "userId": "user123...",
    "gameId": "game123...",
    "type": "rent",
    "price": 4.99,
    "expiryDate": "2024-01-22T10:30:00Z",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

### 3. Get My Games
```
GET /purchases/my-games
Authorization: Bearer <accessToken>

Response (200):
{
  "purchases": [
    {
      "_id": "purchase123...",
      "gameId": { ... },
      "type": "buy",
      "price": 59.99,
      "isActive": true
    }
  ]
}
```

### 4. Return Rental
```
PATCH /purchases/:purchaseId/return
Authorization: Bearer <accessToken>

Response (200):
{
  "message": "Rental returned successfully"
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "message": "Validation error",
  "errors": ["Field is required", "Invalid format"]
}
```

### 401 Unauthorized
```json
{
  "message": "No token provided" | "Token expired" | "Invalid token"
}
```

### 403 Forbidden
```json
{
  "message": "Only admins can create games"
}
```

### 404 Not Found
```json
{
  "message": "Game not found"
}
```

### 429 Too Many Requests
```json
{
  "message": "Too many requests from this IP, please try again later."
}
```

### 500 Server Error
```json
{
  "message": "Internal server error"
}
```

---

## Authentication Headers

All protected endpoints require:
```
Authorization: Bearer <accessToken>
```

---

## Rate Limiting

- **Limit**: 100 requests per 15 minutes per IP
- **Applied to**: All `/api/*` routes
- **Headers returned**:
  - `RateLimit-Limit`: 100
  - `RateLimit-Remaining`: Remaining requests
  - `RateLimit-Reset`: Reset time in seconds

---

## Search & Filtering Examples

### Search for games
```
GET /games?search=cyber
```

### Filter by genre
```
GET /games?genre=Action
```

### Filter by platform
```
GET /games?platform=PC
```

### Sort by rating (descending)
```
GET /games?sort=-rating
```

### Combine multiple filters
```
GET /games?search=cyber&genre=Action&platform=PC&sort=-rating&page=1&limit=5
```

---

## Genre Options
- Action
- Adventure
- RPG
- Strategy
- Simulation
- Puzzle
- Sports
- Horror
- Indie
- FPS

## Platform Options
- PC
- PlayStation
- Xbox
- Nintendo
- Mobile
