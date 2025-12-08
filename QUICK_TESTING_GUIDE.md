# 🧪 Quick Testing Guide - Step by Step

## 🚀 START HERE

### 1. Start Both Servers
```bash
# Terminal 1 - Backend
cd server
npm run dev
# Should see: "Server running on port 5000" + "MongoDB connected"

# Terminal 2 - Frontend  
cd ..
npm start
# Opens http://localhost:3000
```

---

## ✅ AUTHENTICATION TESTING (15 min)

### 📍 **Code Location:**
- **Backend**: `server/controllers/authController.js` (lines 1-80)
  - `register()` - Creates user, hashes password with bcrypt, generates JWT
  - `login()` - Validates credentials, returns JWT tokens
- **Password Hashing**: `server/models/User.js` (lines 60-66)
  ```javascript
  userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10); // ← BCRYPT HERE
  });
  ```
- **JWT Verification**: `server/middlewares/authMiddleware.js`
  - Checks `Authorization: Bearer <token>` header
  - Verifies token with JWT_ACCESS_SECRET
- **Frontend**: `src/pages/Register/Register.js` & `src/pages/Login/Login.js`

### 🧪 **How to Test:**

#### Test 1: Register New User
1. **Open**: http://localhost:3000/register
2. **Fill form**:
   - Name: `John Doe`
   - Email: `john@test.com`
   - Password: `test123` (min 6 chars)
   - Confirm Password: `test123`
3. **Click**: "Register"
4. **Expected**:
   - ✅ Success message appears
   - ✅ Redirected to `/login`
   - ✅ Check backend terminal: "Welcome email sent" log

#### Test 2: Verify Password is Hashed
```bash
# Open MongoDB
mongosh
use gameverse
db.users.findOne({email: "john@test.com"})
```
**Expected**: Password field starts with `$2b$10$...` (bcrypt hash) ✅

#### Test 3: Login
1. **Open**: http://localhost:3000/login
2. **Enter**:
   - Email: `john@test.com`
   - Password: `test123`
3. **Click**: "Login"
4. **Expected**:
   - ✅ Redirected to `/dashboard`
   - ✅ Header shows your name (top-right)
   - ✅ See game stats

#### Test 4: Check JWT Tokens
1. **Open DevTools**: F12 → Application tab → Local Storage → http://localhost:3000
2. **Expected**:
   - ✅ `accessToken` exists (JWT string)
   - ✅ `refreshToken` exists (JWT string)

#### Test 5: Test Protected Routes
1. **Log out**: Click "Logout" in header
2. **Try accessing**: http://localhost:3000/dashboard
3. **Expected**: ✅ Redirected to `/login` (route protected)

---

## 🔐 ROLE-BASED ACCESS CONTROL (RBAC)

### 📍 **Code Location:**
- **User Role Field**: `server/models/User.js` (lines 28-32)
  ```javascript
  role: {
    type: String,
    enum: ['user', 'admin'], // ← Only these 2 roles
    default: 'user',
  }
  ```
- **Admin Middleware**: `server/middleware/adminMiddleware.js`
  - Checks if `req.user.role === 'admin'`
  - Returns 403 if not admin
- **Admin Routes**: `server/routes/adminRoutes.js`

### 🧪 **How to Test:**

#### Test 1: Check Your Default Role
```bash
mongosh
use gameverse
db.users.findOne({email: "john@test.com"}, {role: 1})
```
**Expected**: `role: "user"` ✅

#### Test 2: Try Accessing Admin Endpoint (Should Fail)
**Using Thunder Client / Postman:**
1. **GET**: `http://localhost:5000/api/admin/users`
2. **Headers**:
   - `Authorization`: `Bearer <copy your accessToken from localStorage>`
3. **Send Request**
4. **Expected**: 
   ```json
   {
     "message": "Not authorized. Admin access required."
   }
   ```
   Status: `403 Forbidden` ✅

#### Test 3: Promote User to Admin
```bash
mongosh
use gameverse
db.users.updateOne(
  {email: "john@test.com"}, 
  {$set: {role: "admin"}}
)
```
**Expected**: `modifiedCount: 1` ✅

#### Test 4: Try Admin Endpoint Again (Should Work)
1. **Logout & Login again** (to get new token with admin role)
2. **GET**: `http://localhost:5000/api/admin/users`
3. **Headers**: `Authorization: Bearer <new_token>`
4. **Expected**: 
   ```json
   {
     "users": [...],
     "total": 1,
     "page": 1
   }
   ```
   Status: `200 OK` ✅

#### Test 5: Admin Endpoints Available
All require `Authorization` header + `role: admin`:
- `GET /api/admin/users` - List all users
- `GET /api/admin/users/:id` - Get user details
- `PATCH /api/admin/users/:id/promote` - Make user admin
- `PATCH /api/admin/users/:id/demote` - Remove admin role
- `DELETE /api/admin/users/:id` - Delete user
- `GET /api/admin/statistics` - System stats

---

## 📦 CRUD TESTING (20 min)

### 📍 **Code Location:**
- **Backend Controller**: `server/controllers/gameController.js`
  - `createGame()` - Creates game with ownership (line 3)
  - `getAllGames()` - Get with filters, pagination (line 29)
  - `updateGame()` - Update with ownership check (line 87)
  - `deleteGame()` - Delete with ownership check (line 117)
- **Ownership Check** (line 94-96):
  ```javascript
  if (game.createdBy.toString() !== req.user.id) {
    return res.status(403).json({ message: 'Not authorized' });
  }
  ```
- **Frontend**: `src/pages/Games/Games.js` (full CRUD UI)

### 🧪 **How to Test:**

#### Test CREATE
1. **Open**: http://localhost:3000/games (must be logged in)
2. **Click**: "Add New Game" button
3. **Fill form**:
   - Title: `The Witcher 3`
   - Description: `Epic RPG adventure`
   - Genre: `RPG` (select from dropdown)
   - Release Date: `2015-05-19`
   - Rating: `9.5`
   - Platform: Check `PC` and `PS4`
   - Developer: `CD Projekt Red`
   - Image URL: (optional)
4. **Click**: "Submit"
5. **Expected**:
   - ✅ Game appears in list immediately
   - ✅ Success message: "Game created successfully"
   - ✅ Modal closes

#### Test READ (with Filters)
1. **Search**: Type `Witcher` in search box
   - **Expected**: Only shows games with "Witcher" in title/description ✅
2. **Filter by Genre**: Select `RPG`
   - **Expected**: Only RPG games shown ✅
3. **Filter by Platform**: Select `PC`
   - **Expected**: Only PC games shown ✅
4. **Sort**: Select `Rating (High to Low)`
   - **Expected**: Games sorted by rating, highest first ✅

#### Test PAGINATION
1. **Create 12 games** (use the form 12 times)
2. **Expected**:
   - ✅ Only 10 games per page shown
   - ✅ "Next" button appears
3. **Click "Next"**
   - **Expected**: Shows games 11-12 ✅

#### Test UPDATE
1. **Find a game YOU created**
2. **Click**: "Edit" button
3. **Change**: Rating to `8.0`
4. **Click**: "Submit"
5. **Expected**:
   - ✅ Game updates in list
   - ✅ Success message appears
   - ✅ Modal closes

#### Test OWNERSHIP VALIDATION
1. **Create 2nd user account**: Register as `jane@test.com`
2. **Log in as Jane**
3. **Go to Games page**
4. **Try to edit John's game** (via API since UI hides buttons):
   ```bash
   # Get game ID from list
   # Copy Jane's accessToken from localStorage
   ```
   **Using Thunder Client:**
   ```
   PATCH http://localhost:5000/api/games/<john_game_id>
   Headers: Authorization: Bearer <jane_token>
   Body: {"rating": 1}
   ```
5. **Expected**: 
   ```json
   {"message": "Not authorized to update this game"}
   ```
   Status: `403 Forbidden` ✅

#### Test DELETE
1. **Log back in as John**
2. **Click**: "Delete" on YOUR game
3. **Expected**:
   - ✅ Game removed from list
   - ✅ Success message appears

---

## 🎛️ DASHBOARD & PROFILE TESTING (10 min)

### 📍 **Code Location:**
- **Backend**: `server/controllers/userController.js`
  - `getDashboard()` - Returns stats, genre breakdown, recent games
  - `updateProfile()` - Updates name, bio, avatar
  - `changePassword()` - Changes password, sends email
- **Frontend**: 
  - `src/pages/Dashboard/Dashboard.js` - Stats display
  - `src/pages/Profile/Profile.js` - Profile management

### 🧪 **How to Test:**

#### Test Dashboard
1. **Open**: http://localhost:3000/dashboard
2. **Expected**:
   - ✅ Shows "Total Games: X"
   - ✅ Shows "Average Rating: X.X"
   - ✅ Shows genre breakdown (e.g., "RPG: 5, Action: 3")
   - ✅ Shows recent 5 games list

#### Test Profile Update
1. **Open**: http://localhost:3000/profile
2. **Click**: "Edit Profile"
3. **Change**:
   - Name: `John Smith`
   - Bio: `Game enthusiast`
   - Avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=John`
4. **Click**: "Save"
5. **Expected**:
   - ✅ Profile updates
   - ✅ Avatar appears in header (top-right, 40x40px circle)
   - ✅ Success message

#### Test Password Change
1. **Click**: "Change Password"
2. **Enter**:
   - Current Password: `test123`
   - New Password: `newpass123`
   - Confirm: `newpass123`
3. **Click**: "Change Password"
4. **Expected**:
   - ✅ Success message
   - ✅ Backend terminal logs: "Password changed email sent"
5. **Logout & Login with new password**
   - **Expected**: Login successful ✅

---

## 📊 ADMIN PANEL - NO UI YET

### ❌ **Is There an Admin Profile Page?**
**NO** - There is no admin UI page yet. Admin features are **API-only**.

### ✅ **What's Implemented:**
- ✅ Admin role in database
- ✅ Admin middleware checks role
- ✅ Admin API endpoints work
- ❌ Admin dashboard UI (not created)

### 🧪 **How to Test Admin Features:**

#### Option 1: Use API Client (Postman/Thunder Client)
1. **Promote yourself to admin** (MongoDB):
   ```bash
   db.users.updateOne({email: "john@test.com"}, {$set: {role: "admin"}})
   ```
2. **Logout & Login** to get new token
3. **Test Admin Endpoints**:

**List All Users:**
```
GET http://localhost:5000/api/admin/users
Headers: Authorization: Bearer <admin_token>
```

**Get User Stats:**
```
GET http://localhost:5000/api/admin/statistics
Headers: Authorization: Bearer <admin_token>
```

**Promote User to Admin:**
```
PATCH http://localhost:5000/api/admin/users/<user_id>/promote
Headers: Authorization: Bearer <admin_token>
```

**Delete User:**
```
DELETE http://localhost:5000/api/admin/users/<user_id>
Headers: Authorization: Bearer <admin_token>
```

#### Option 2: Create Admin UI (Optional)
You can create `src/pages/Admin/Admin.js` to:
- List all users
- Show promote/demote buttons
- Display system statistics
- Delete users

**Would you like me to create an Admin Dashboard UI page?**

---

## 🧪 API TESTING WITH CURL (Fast)

```bash
# 1. Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","password":"test123","confirmPassword":"test123"}'

# 2. Login (copy the accessToken from response)
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# 3. Get All Games
curl http://localhost:5000/api/games

# 4. Create Game (replace <TOKEN>)
curl -X POST http://localhost:5000/api/games \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"title":"Test Game","description":"Test","genre":"Action","releaseDate":"2024-01-01","rating":8,"platform":["PC"],"developer":"Test"}'

# 5. Search Games
curl "http://localhost:5000/api/games?search=Test&genre=Action&sort=-rating"

# 6. Get Dashboard (replace <TOKEN>)
curl http://localhost:5000/api/users/<USER_ID>/dashboard \
  -H "Authorization: Bearer <TOKEN>"
```

---

## ✅ QUICK VERIFICATION CHECKLIST

### Authentication ✅
- [x] Register creates user with hashed password (bcrypt)
- [x] Login returns JWT tokens (access + refresh)
- [x] JWT stored in localStorage
- [x] Protected routes redirect to login
- [x] authMiddleware verifies JWT on protected endpoints

### Role-Based Access ✅
- [x] User role stored in database (user/admin)
- [x] Admin middleware checks role
- [x] Admin endpoints return 403 for non-admins
- [x] Admin can access all admin endpoints

### CRUD Operations ✅
- [x] Create game (with ownership)
- [x] Read all games (with filters, pagination)
- [x] Update game (ownership check)
- [x] Delete game (ownership check)
- [x] Search, filter, sort work correctly

### Dashboard & Profile ✅
- [x] Dashboard shows stats (protected)
- [x] Profile update works
- [x] Password change works with email
- [x] Avatar appears in header

### Admin Features ⚠️
- [x] Admin API endpoints functional
- [x] Role-based access enforced
- [ ] Admin UI not created (API only)

---

## 🎯 SUMMARY

**All features are implemented and functional!** ✅

You can test everything by:
1. **Browser**: Register → Login → Create Games → Edit → Delete
2. **API Client**: Test admin endpoints with Postman/Thunder Client
3. **MongoDB**: Verify data, roles, hashed passwords

**Admin UI is the only missing piece** - but admin API endpoints all work.

Want me to create an Admin Dashboard page? 🚀
