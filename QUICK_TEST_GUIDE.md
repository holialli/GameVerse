# 🧪 QUICK TEST GUIDE - New Features

## ✅ Admin Account Ready

```
Username: Holialli
Email: ali1305123456789@gmail.com
Password: holialli
```

---

## 🚀 Quick Test Flow (5 minutes)

### Step 1: Start Servers
```bash
# Terminal 1: Backend
cd server
npm run dev
# Should see: ✅ MongoDB connected, 🚀 Server running on port 5000

# Terminal 2: Frontend  
npm start
# Opens http://localhost:3000
```

### Step 2: Register New User
1. http://localhost:3000/register
2. Fill:
   - Name: `Test User`
   - **Username**: `testuser` ← NEW!
   - Email: `test@example.com`
   - Password: `test123`
3. Register
4. Check backend logs: `Welcome email sent`

### Step 3: Login as Regular User
1. http://localhost:3000/login
2. **Username**: `testuser`
3. Password: `test123`
4. Login
5. See dashboard: **"Total Purchased: 0"** (not admin dashboard)

### Step 4: Logout & Login as Admin
1. Logout
2. http://localhost:3000/login
3. **Username**: `Holialli` (case-sensitive!)
4. Password: `holialli`
5. See admin dashboard: **"Total Games: 0"** (admin dashboard)
6. See "Add New Game" button (admin only)

### Step 5: Admin Creates Game
1. Still logged in as Holialli
2. Go to http://localhost:3000/games
3. Click "Add New Game"
4. Fill form:
   - Title: `Test Game`
   - Description: `A test game`
   - Genre: `Action`
   - Release Date: `2024-01-01`
   - Rating: `8.0`
   - Platform: `PC`
   - Developer: `Test Dev`
5. Submit
6. See game in list
7. Check backend logs (should be silent - no error)

### Step 6: Regular User Buys Game
1. Logout
2. Login as `testuser`
3. Go to http://localhost:3000/games
4. Find the game you created
5. Click **Buy** button (if UI supports - may need to add manually)
6. Check backend logs: `Purchase confirmation email sent`
7. Go to dashboard: **"Total Purchased: 1"**

### Step 7: Check Email Logs
Open backend terminal. You should see:
```
✅ Welcome email sent: <messageId>
Purchase confirmation email sent: <messageId>
Rental confirmation email sent: <messageId>
```

---

## 🔄 What's Different From Before:

| Feature | Before | After |
|---------|--------|-------|
| Login | Email | **Username** |
| Game Create | Any user | **Admin only** |
| Game Edit | User owns it | **Admin only** |
| Game Delete | User owns it | **Admin only** |
| Buy/Rent | Not available | **Available now** |
| Purchase Email | Not sent | **Sent** |
| Rental Email | Not sent | **Sent** |
| Dashboard | Shows created games | **Shows purchased/rented** |

---

## ⚠️ Known Issues to Fix:

1. **Games UI might not show Buy/Rent buttons yet**
   - Frontend Games.js still shows Edit/Delete for all users
   - Need to update to show Buy/Rent for regular users

2. **Games page might show all CRUD buttons**
   - Only admin should see Edit/Delete
   - All users should see Buy/Rent

### Quick Fix:
Update `src/pages/Games/Games.js` to check user role:
```javascript
const { user } = useAuth();

// In render:
{user?.role === 'admin' ? (
  <>
    <button onClick={() => editGame(game)}>Edit</button>
    <button onClick={() => deleteGame(game)}>Delete</button>
  </>
) : (
  <>
    <button onClick={() => buyGame(game)}>Buy ${game.buyPrice}</button>
    <button onClick={() => rentGame(game)}>Rent ${game.rentPrice}/7d</button>
  </>
)}
```

---

## 📊 Email Service

### Development (Current):
- Emails logged to backend terminal
- No actual email sent
- Shows: `Welcome email sent: <id>`

### Production:
- Add `.env`:
  ```
  EMAIL_USER=your-gmail@gmail.com
  EMAIL_PASSWORD=your-app-password
  ```
- Real emails sent via Gmail

---

## ✅ Verification Checklist

- [ ] Can register with username
- [ ] Welcome email logged on register
- [ ] Can login with username (not email)
- [ ] Admin account works (Holialli)
- [ ] Admin sees "Add New Game" button
- [ ] Regular user doesn't see "Add New Game"
- [ ] Admin can create game with prices
- [ ] Purchase email logged on buy
- [ ] Rental email logged on rent
- [ ] Dashboard shows purchases for regular users
- [ ] Dashboard shows games for admin

---

## 🎯 Current State

✅ **Backend**: All features implemented
✅ **Admin Account**: Created and verified
✅ **Email Service**: Ready (logs to console)
⚠️ **Frontend UI**: Needs update to hide/show buttons based on role

**Overall**: System is 95% complete. Just need to update frontend UI buttons!
