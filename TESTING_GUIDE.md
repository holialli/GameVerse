# Testing & Troubleshooting Guide

## Quick Start

### 1. Start the Application
```bash
# Terminal 1: Frontend
cd my-app
npm start

# Terminal 2: Backend
cd my-app/server
npm run dev
```

### 2. Backend Runs On
```
http://localhost:5000
API Base: http://localhost:5000/api
```

### 3. Frontend Runs On
```
http://localhost:3000
```

---

## Testing Each Feature

### Test 1: Registration & Login

#### 1. Register
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "test123456",
    "confirmPassword": "test123456"
  }'
```

**Expected Response:**
- Status: 201
- Contains: accessToken, refreshToken, user object with role

#### 2. Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123456"
  }'
```

---

### Test 2: Protected Routes (Access Token)

#### Get Current User
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected Response:**
- Status: 200
- Contains: User data

**Failure Test (No Token):**
```bash
curl -X GET http://localhost:5000/api/auth/me
```

**Expected Response:**
- Status: 401
- Message: "No token provided"

---

### Test 3: Rate Limiting

#### Send 101 Requests in a Row
```bash
for i in {1..101}; do
  curl -X GET http://localhost:5000/api/health
done
```

**Expected Response:**
- Requests 1-100: Status 200
- Request 101: Status 429 (Too Many Requests)
- Message: "Too many requests from this IP, please try again later."

---

### Test 4: Pagination

#### Get Games with Pagination
```bash
# Page 1, 10 items
curl -X GET "http://localhost:5000/api/games?page=1&limit=10"

# Page 2, 5 items per page
curl -X GET "http://localhost:5000/api/games?page=2&limit=5"
```

**Expected Response:**
- Status: 200
- Contains: games array, total count, page, limit, totalPages

---

### Test 5: Search & Filtering

#### Search
```bash
curl -X GET "http://localhost:5000/api/games?search=cyber"
```

#### Filter by Genre
```bash
curl -X GET "http://localhost:5000/api/games?genre=Action"
```

#### Filter by Platform
```bash
curl -X GET "http://localhost:5000/api/games?platform=PC"
```

#### Combine Filters + Sort
```bash
curl -X GET "http://localhost:5000/api/games?search=cyber&genre=Action&platform=PC&sort=-rating&page=1&limit=10"
```

#### Sort Options
```bash
# Ascending by creation date
?sort=createdAt

# Descending by creation date (newest first)
?sort=-createdAt

# By rating (ascending)
?sort=rating

# By rating (descending, highest first)
?sort=-rating

# Alphabetically by title
?sort=title

# Reverse alphabetically
?sort=-title
```

---

### Test 6: JWT Protected Dashboard

#### Admin Dashboard
```bash
curl -X GET "http://localhost:5000/api/users/USER_ID/dashboard" \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN"
```

**Expected Response (Admin):**
```json
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
```

#### User Dashboard
```bash
curl -X GET "http://localhost:5000/api/users/USER_ID/dashboard" \
  -H "Authorization: Bearer USER_ACCESS_TOKEN"
```

**Expected Response (User):**
```json
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

### Test 7: Password Reset Flow

#### 1. Request Password Reset
```bash
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com"
  }'
```

**Expected Response:**
- Status: 200
- Message: "Password reset link sent to your email"

**Check Email:**
- Go to Gmail inbox (gameverse.noreply@gmail.com account)
- Look for password reset email
- Extract token from reset link

#### 2. Reset Password
```bash
curl -X POST http://localhost:5000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "RESET_TOKEN_FROM_EMAIL",
    "newPassword": "newpass123456",
    "confirmPassword": "newpass123456"
  }'
```

**Expected Response:**
- Status: 200
- Message: "Password reset successfully"

#### 3. Login with New Password
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "newpass123456"
  }'
```

**Expected Response:**
- Status: 200
- Contains: New accessToken

---

### Test 8: Change Password

```bash
curl -X PATCH http://localhost:5000/api/users/USER_ID/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -d '{
    "oldPassword": "test123456",
    "newPassword": "newpass789",
    "confirmPassword": "newpass789"
  }'
```

**Expected Response:**
- Status: 200
- Message: "Password changed successfully"

**Verify with Email:**
- Check for "Password Changed" email notification

---

### Test 9: Image Upload

```bash
# Create a test image or use an existing one
curl -X POST http://localhost:5000/api/upload \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -F "image=@/path/to/image.jpg"
```

**Expected Response:**
- Status: 200
- Contains: imageUrl (e.g., "/public/uploads/abc123.jpg")

---

### Test 10: Create Game (Admin Only)

```bash
curl -X POST http://localhost:5000/api/games \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN" \
  -F "title=New Game" \
  -F "description=Game description" \
  -F "genre=Action" \
  -F "releaseDate=2024-03-15" \
  -F "rating=8" \
  -F "platform=[\"PC\",\"PlayStation\"]" \
  -F "developer=Dev Studio" \
  -F "buyPrice=59.99" \
  -F "rentPrice=4.99" \
  -F "image=@/path/to/image.jpg"
```

**Expected Response:**
- Status: 201
- Contains: Created game object

**Test Non-Admin (Should Fail):**
```bash
curl -X POST http://localhost:5000/api/games \
  -H "Authorization: Bearer USER_ACCESS_TOKEN" \
  -F "title=New Game" ...
```

**Expected Response:**
- Status: 403
- Message: "Only admins can create games"

---

### Test 11: Update Game (Admin Only)

```bash
curl -X PATCH http://localhost:5000/api/games/GAME_ID \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN" \
  -F "rating=8.5" \
  -F "buyPrice=49.99"
```

**Expected Response:**
- Status: 200
- Contains: Updated game object

---

### Test 12: Delete Game (Admin Only)

```bash
curl -X DELETE http://localhost:5000/api/games/GAME_ID \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN"
```

**Expected Response:**
- Status: 200
- Message: "Game deleted successfully"

---

### Test 13: Buy/Rent Game

#### Buy
```bash
curl -X POST http://localhost:5000/api/purchases/buy \
  -H "Authorization: Bearer USER_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "gameId": "GAME_ID"
  }'
```

**Expected Response:**
- Status: 201
- Contains: Purchase object with type: "buy"

#### Rent
```bash
curl -X POST http://localhost:5000/api/purchases/rent \
  -H "Authorization: Bearer USER_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "gameId": "GAME_ID"
  }'
```

**Expected Response:**
- Status: 201
- Contains: Purchase object with type: "rent", expiryDate

---

### Test 14: Get My Games

```bash
curl -X GET http://localhost:5000/api/purchases/my-games \
  -H "Authorization: Bearer USER_ACCESS_TOKEN"
```

**Expected Response:**
- Status: 200
- Contains: Array of purchases

---

### Test 15: CORS Configuration

#### Test from Different Origin
```bash
# From browser console at http://localhost:3000
fetch('http://localhost:5000/api/games')
  .then(r => r.json())
  .then(d => console.log(d))
```

**Expected:**
- Request succeeds (CORS allowed)
- Data returns without errors

#### Check CORS Headers
```bash
curl -X OPTIONS http://localhost:5000/api/games \
  -H "Origin: http://localhost:3000" \
  -v
```

**Expected Headers:**
- `Access-Control-Allow-Origin: http://localhost:3000`
- `Access-Control-Allow-Credentials: true`

---

## Common Issues & Troubleshooting

### Issue 1: "Cannot GET /api/games"

**Cause:** Backend not running
**Solution:**
```bash
cd my-app/server
npm run dev
```

**Verify:** 
```bash
curl http://localhost:5000/api/health
# Should return: {"status":"OK","message":"Server is running"}
```

---

### Issue 2: CORS Error in Browser

**Error:** "Access to XMLHttpRequest at 'http://localhost:5000' from origin 'http://localhost:3000' has been blocked by CORS policy"

**Causes:**
1. Backend not running
2. CLIENT_URL not set in `.env`
3. Origin mismatch

**Solution:**
```bash
# Check .env has:
CLIENT_URL=http://localhost:3000

# Restart backend after changing .env
```

---

### Issue 3: "Only admins can create games"

**Cause:** User logged in as regular user, not admin

**Solution:**
1. Login as admin (created by setup-admin.js)
   - Email: ali1305123456789@gmail.com
   - Password: holialli
2. Or check token includes role:
   ```bash
   # Decode JWT to verify role
   echo "YOUR_TOKEN" | jq
   ```

---

### Issue 4: "No token provided"

**Cause:** Missing Authorization header

**Solution:**
```bash
# Correct format
curl -H "Authorization: Bearer TOKEN" ...

# Wrong formats
curl -H "Authorization: TOKEN" ...         # Missing "Bearer"
curl -H "Bearer: TOKEN" ...                # Wrong header name
curl ...                                   # No header at all
```

---

### Issue 5: "Token expired"

**Cause:** Access token older than 15 minutes

**Solution:**
```bash
# Use refresh token to get new access token
curl -X POST http://localhost:5000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "YOUR_REFRESH_TOKEN"}'
```

---

### Issue 6: Validation Error on Game Creation

**Cause:** Missing required fields or invalid values

**Solution:**
Check all required fields are provided:
- title (required)
- description (required)
- genre (must be valid: Action, Adventure, RPG, etc.)
- releaseDate (required)
- platform (required, must be array)
- rating (required, 0-10)

---

### Issue 7: Rate Limit (429)

**Cause:** Too many requests from same IP

**Solution:**
- Wait 15 minutes for rate limit to reset
- Or change IP/use different network

**Temporary Fix (Development):**
Edit `.env`:
```
RATE_LIMIT_MAX_REQUESTS=10000
```
Restart backend.

---

### Issue 8: "Password reset link expired"

**Cause:** Token older than 24 hours

**Solution:**
1. Request new password reset link
2. Use link within 24 hours

---

### Issue 9: Image Upload Fails

**Cause:** 
1. File too large (>5MB)
2. Wrong file type
3. Wrong form field name

**Solution:**
```bash
# Ensure:
# 1. File is < 5MB
# 2. File is .jpg, .png, .gif, .webp
# 3. Form field is named 'image'
curl -F "image=@file.jpg" ...
```

---

### Issue 10: MongoDB Connection Error

**Cause:** MongoDB not running or URI wrong

**Solution:**
```bash
# Check MongoDB is running (on Windows)
# Or check .env has correct MONGODB_URI:
MONGODB_URI=mongodb://localhost:27017/gameverse
```

---

## Performance Testing

### Check Response Time
```bash
# Measure API response time
time curl -X GET http://localhost:5000/api/games

# Should be < 100ms for healthy endpoint
```

### Load Testing (Optional)
```bash
# Using Apache Bench (ab)
ab -n 100 -c 10 http://localhost:5000/api/health

# -n: number of requests
# -c: concurrent requests
```

---

## Database Inspection

### Check MongoDB Data
```bash
# Connect to MongoDB
mongosh

# Use database
use gameverse

# Check collections
show collections

# Check games
db.games.find().pretty()

# Count documents
db.games.countDocuments()

# Check users
db.users.find().pretty()
```

---

## Email Testing

### Check Password Reset Email

1. Go to Gmail: https://mail.google.com
2. Login with: gameverse.noreply@gmail.com
3. Password: hcpiamvopjuozbti
4. Check inbox for test emails
5. Extract reset token from email links

---

## Security Checklist

- ✅ Never commit `.env` file with real secrets
- ✅ Use strong JWT secrets in production
- ✅ Always use HTTPS in production
- ✅ Rate limit all public endpoints
- ✅ Validate all user input
- ✅ Use CORS whitelist in production
- ✅ Implement request size limits
- ✅ Use helmet.js for security headers
- ✅ Sanitize MongoDB queries
- ✅ Hash passwords with bcrypt
- ✅ Use secure token expiration

---

## Useful Commands

### Reset Database
```bash
# Connect to MongoDB
mongosh use gameverse

# Drop all collections
db.games.deleteMany({})
db.users.deleteMany({})
db.purchases.deleteMany({})

# Re-seed games
node server/seed-games.js
```

### Create Test Admin
```bash
node server/setup-admin.js
```

### View API Health
```bash
curl http://localhost:5000/api/health
```

### Check Environment
```bash
cat .env
```

---

## Next Steps

1. Test all endpoints using this guide
2. Check error responses match documentation
3. Verify role-based access control
4. Test pagination with different page/limit values
5. Test search/filter combinations
6. Monitor rate limiting
7. Test password reset email delivery
8. Verify image uploads work
9. Test dashboard analytics
10. Check CORS headers in browser DevTools
