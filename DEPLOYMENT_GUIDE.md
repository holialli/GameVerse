# GameVerse Deployment Guide

## Prerequisites
- GitHub account (repository pushed)
- Vercel account (for frontend)
- MongoDB Atlas account (for database)
- Render.com or Railway account (for backend)

---

## Part 1: Setup MongoDB Atlas

### 1. Create a Cluster
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign in or create account
3. Create a new project
4. Click "Create a Deployment" and choose "M0 Free" tier
5. Choose AWS as provider, select closest region
6. Click "Create Deployment"

### 2. Create Database User
1. In the sidebar, go to "Database Access"
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Username: `gameverse_user`
5. Password: Generate secure password (save this!)
6. Built-in role: "Atlas admin"
7. Click "Add User"

### 3. Get Connection String
1. Click "Connect" button on deployment
2. Choose "Drivers" (for Node.js)
3. Copy the connection string
4. Replace `<password>` with your database user password
5. Replace `myFirstDatabase` with `gameverse_prod`
6. Save this URI - you'll need it for deployment

### 4. Whitelist IP Addresses
1. Go to "Network Access"
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (for development) or add specific IP
4. Confirm

Example connection string:
```
mongodb+srv://gameverse_user:YOUR_PASSWORD@cluster0.abc123.mongodb.net/gameverse_prod?retryWrites=true&w=majority
```

---

## Part 2: Deploy Backend to Render

### 1. Connect GitHub Repository
1. Go to [Render.com](https://render.com)
2. Sign in with GitHub account
3. Click "New +" → "Web Service"
4. Select your GameVerse repository
5. Click "Connect"

### 2. Configure Service
- **Name:** `gameverse-api`
- **Environment:** Node
- **Build Command:** `cd server && npm install`
- **Start Command:** `cd server && npm start`
- **Plan:** Free tier

### 3. Set Environment Variables
Click "Advanced" and add:
```
MONGODB_URI=mongodb+srv://gameverse_user:PASSWORD@cluster0.abc123.mongodb.net/gameverse_prod?retryWrites=true&w=majority
JWT_ACCESS_SECRET=your_access_token_secret_min_32_chars
JWT_REFRESH_SECRET=your_refresh_token_secret_min_32_chars
CLIENT_URL=https://your-frontend-url.vercel.app
NODE_ENV=production
EMAIL_USER=your-email@gmail.com (optional)
EMAIL_PASSWORD=your-app-password (optional)
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100
```

### 4. Deploy
- Click "Create Web Service"
- Render will deploy automatically
- Wait for build to complete (5-10 minutes)
- Copy the deployment URL (e.g., `https://gameverse-api.onrender.com`)

---

## Part 3: Deploy Frontend to Vercel

### 1. Connect GitHub Repository
1. Go to [Vercel.com](https://vercel.com)
2. Sign in with GitHub account
3. Click "New Project"
4. Select your GameVerse repository
5. Click "Import"

### 2. Configure Project
- **Framework:** Create React App
- **Root Directory:** `.` (or specify the app folder if it's nested)
- **Build Command:** `npm run build`
- **Output Directory:** `build`

### 3. Set Environment Variables
Before deploying, add:
```
REACT_APP_API_URL=https://gameverse-api.onrender.com/api
```

### 4. Deploy
- Click "Deploy"
- Vercel will build and deploy (2-5 minutes)
- Your frontend is now live!
- You'll get a URL like: `https://gameverse.vercel.app`

### 5. Update Backend CLIENT_URL
Back on Render dashboard:
1. Go to your gameverse-api service
2. Settings → Environment
3. Update `CLIENT_URL` to your Vercel URL
4. Click "Deploy"

---

## Part 4: Test Your Deployment

### 1. Frontend
- Open your Vercel URL
- You should see the GameVerse home page
- Navigation should work

### 2. Backend Health Check
```bash
curl https://gameverse-api.onrender.com/api/health
# Should return: {"status":"OK","message":"Server is running"}
```

### 3. Auth Flow
- Go to /register page
- Create a test account
- Check MongoDB Atlas to see the new user
- Login and verify dashboard loads

### 4. CRUD Operations
- Create a game
- Edit/delete it
- Verify all operations work

---

## Part 5: Production Considerations

### Security
- [ ] Ensure HTTPS is enabled (automatic on Vercel & Render)
- [ ] Use strong JWT secrets (at least 32 characters)
- [ ] Set `NODE_ENV=production` on backend
- [ ] Enable email notifications (optional)
- [ ] Monitor API logs on Render

### Monitoring
- Check Render logs for errors: Dashboard → gameverse-api → Logs
- Check Vercel deployment status: Dashboard → project → Deployments
- Monitor MongoDB usage in Atlas

### Updates & Maintenance
To deploy updates:
1. Push changes to GitHub
2. Render/Vercel auto-deploy on push (if enabled)
3. Or manually trigger deployment from dashboard

### Environment File Reference

**Frontend (.env)**
```
REACT_APP_API_URL=https://gameverse-api.onrender.com/api
```

**Backend (.env)**
```
# Database
MONGODB_URI=mongodb+srv://gameverse_user:PASSWORD@cluster.mongodb.net/gameverse_prod

# JWT
JWT_ACCESS_SECRET=your_super_secret_access_token_key_min_32_chars
JWT_REFRESH_SECRET=your_super_secret_refresh_token_key_min_32_chars
JWT_ACCESS_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d

# Server
PORT=5000
NODE_ENV=production
CLIENT_URL=https://your-vercel-url.vercel.app

# Email (optional)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-gmail-app-password

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100
```

---

## Troubleshooting

### 1. "Cannot find module" errors on Render
- Delete `node_modules` and `package-lock.json`
- Push to GitHub
- Trigger rebuild on Render

### 2. CORS errors in frontend
- Check `CLIENT_URL` in backend matches your Vercel URL
- Check `REACT_APP_API_URL` in frontend matches your Render URL
- Redeploy both services

### 3. MongoDB connection timeout
- Check MongoDB Atlas network whitelist includes your IP
- Verify connection string is correct
- Check `MONGODB_URI` doesn't have `<` or `>` characters

### 4. JWT errors at login
- Ensure `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` are set
- Use different secrets for access and refresh tokens
- Secrets should be at least 32 characters

### 5. Email not sending
- Email is optional - won't block registration
- Gmail requires "App Password" (not regular password)
- Ethereal email is used automatically for testing

---

## Post-Deployment Checklist

- [ ] Frontend loads on Vercel URL
- [ ] API health check returns 200 OK
- [ ] User can register new account
- [ ] User can login with credentials
- [ ] Dashboard shows stats (0 games initially)
- [ ] User can create a game
- [ ] User can edit/delete games
- [ ] User can update profile with avatar
- [ ] Search and filter work
- [ ] Pagination works (create 15+ games)
- [ ] Admin endpoints accessible (if admin user)
- [ ] MongoDB Atlas shows data in collections

---

## Local Development (Still Works)

To continue local development:

```bash
# Terminal 1: Backend
cd server
npm run dev

# Terminal 2: Frontend
npm start
```

Your frontend will use `REACT_APP_API_URL=http://localhost:5000/api` locally.
