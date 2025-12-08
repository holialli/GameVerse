# 🔄 System Change: Admin-Only CRUD + User Buy/Rent

## New Architecture

### User Roles:
- **Admin**: Can CREATE, READ, UPDATE, DELETE games
- **Regular User**: Can VIEW games, BUY, RENT games

### New Features:

1. **Admin Dashboard**: View all games, manage inventory
2. **User Dashboard**: View purchased/rented games
3. **Game Store**: Browse & buy/rent games (for regular users)
4. **Ownership Model Change**:
   - Games now owned by admins
   - Users own purchases/rentals (not the games themselves)

---

## Database Changes Needed

### New Collections:
1. **purchases** (new)
   ```javascript
   {
     userId: ObjectId,
     gameId: ObjectId,
     purchaseDate: Date,
     type: "buy" | "rent",
     expiryDate: Date (null for buy, set for rent)
   }
   ```

### Game Model Updates:
Remove `createdBy` field (games belong to admin catalog)

### New Models:
- **Purchase.js** - Track user purchases/rentals

---

## Steps:

1. ✅ Create Purchase model
2. ✅ Update Game model (remove createdBy)
3. ✅ Create purchase/rental endpoints
4. ✅ Update game endpoints (admin-only for CRUD)
5. ✅ Create game store page for users
6. ✅ Update dashboard to show purchases
7. ✅ Set holialli to admin in MongoDB

---

Status: Ready to implement
