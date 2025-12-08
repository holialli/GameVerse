# GameVerse

A modern web application for discovering and managing video games. Built with React, Express, and MongoDB, GameVerse provides a comprehensive platform for browsing games, reading gaming news, and managing user accounts.

---

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas account)
- npm or yarn package manager

### Installation

1. Clone the repository:
    bash
   git clone [repository-url]
   cd my-app
    

2. Install frontend dependencies:
    bash
   npm install
    

3. Install backend dependencies:
    bash
   cd server
   npm install
   cd ..
    

4. Create environment files:
   - In the root directory, create .env for frontend variables
   - In the server directory, create .env for backend variables

### Configuration

Frontend (.env):
 
REACT_APP_NEWSAPI_KEY=your_newsapi_key
REACT_APP_GOOGLE_API_KEY=your_google_api_key
 

Backend (server/.env):
 
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/gameverse
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
CLIENT_URL=http://localhost:3000
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100
 

### Running the Application

Start the backend server:
 bash
cd server
npm run dev
 

In a new terminal, start the frontend:
 bash
npm start
 

The application will open at http://localhost:3000

---

## Project Structure

Frontend (React):
- src/pages - Page components (Home, Dashboard, Games, News, Gallery, Events, Contact, Profile)
- src/components - Reusable UI components
- src/contexts - Authentication and app context
- src/services - API calls and Firebase configuration
- src/assets - CSS and images

Backend (Express):
- server/routes - API routes for auth, games, users, uploads
- server/models - MongoDB schemas
- server/middleware - Authentication and validation middleware
- server/config - Database and configuration setup

---

## Features

User Features:
- Browse and search for games by genre, platform, and ratings
- Create an account and manage profile
- Purchase and rent games
- Upload and manage avatar
- View personalized dashboard with purchase history
- Read gaming news and updates
- Chat with AI assistant for gaming questions

Admin Features:
- Manage game catalog (add, edit, delete games)
- View platform analytics
- Monitor user activity
- Manage system settings
- Dashboard with comprehensive statistics

---

## API Integration

The application uses several external APIs:

NewsAPI - Gaming news articles
- Sign up at https://newsapi.org
- Add your API key to the .env file as REACT_APP_NEWSAPI_KEY

Google Generative API - AI chat functionality
- Get your API key from Google Cloud Console
- Add to .env as REACT_APP_GOOGLE_API_KEY

DummyJSON - Fallback mock data
- Used when external APIs are unavailable

---

## Deployment

Frontend Deployment (Vercel/Netlify):
1. Push code to GitHub
2. Connect repository to Vercel or Netlify
3. Set environment variables in platform settings
4. Deploy

Backend Deployment (Render/Railway/Heroku):
1. Create account on your chosen platform
2. Connect repository
3. Set environment variables
4. Configure start command: npm run start
5. Deploy

Database:
- Use MongoDB Atlas for production
- Create cluster and database user
- Use connection string in MONGODB_URI

---

## Development

Install additional dev dependencies if needed:
 bash
npm install --save-dev [package-name]
 

Build for production:
 bash
npm run build
 

Run tests:
 bash
npm test
 

---

## Troubleshooting

Port already in use:
- Change PORT in server/.env or use: lsof -i :5000 to find and kill process

MongoDB connection error:
- Verify connection string in .env
- Check if MongoDB Atlas IP whitelist includes your IP
- Ensure database user credentials are correct

API key errors:
- Verify keys are correctly set in .env
- Restart dev server after changing .env
- Check API documentation for rate limits

---

## Contact and Support

For issues or questions, please open an issue on the GitHub repository.
