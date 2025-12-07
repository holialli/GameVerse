# Project: GameVerse (React Conversion)

This project is a React conversion of a static HTML/CSS website for Assignment 2. It rebuilds the "GameVerse" site as a dynamic, data-driven application using modern React principles.

---

## 🛠️ Setup and Run Instructions

1.  **Clone the repository:**
    ```bash
    git clone [your-repo-link]
    ```
2.  **Navigate to the project directory:**
    ```bash
    cd gameverse-react
    ```
3.  **Install dependencies:**
    ```bash
    npm install
    ```
4.  **Set up Firebase:**
    * Create a project on [Firebase](https://firebase.google.com/).
    * Create a new **Firestore Database**.
    * Go to Project Settings and get your web app configuration.
    * Copy your config object into `src/services/firebaseConfig.js`.
5.  **Run the application:**
    ```bash
    npm run dev
    ```

## 🚀 Deployment (frontend + backend)

- **Frontend (Vercel or Netlify):** Deploy the React build; set `REACT_APP_NEWSAPI_KEY` (optional) in project env vars. Point `CLIENT_URL` on the backend to the deployed frontend origin.
- **Backend (Render/Railway/Fly/Heroku-like):** Deploy the Node/Express server from the `server` folder. Set env vars: `PORT`, `MONGODB_URI` (use MongoDB Atlas), `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `CLIENT_URL` (frontend origin), `RATE_LIMIT_WINDOW`, `RATE_LIMIT_MAX_REQUESTS`. Enable persistent storage only if you self-host Mongo; otherwise prefer Atlas.
- **Database (MongoDB Atlas recommended):** Create a cluster, add a database user (e.g., `gameverse_app`), and use the SRV URI in `MONGODB_URI`, for example `mongodb+srv://gameverse_app:<password>@<cluster>/gameverse?retryWrites=true&w=majority`.
- **Build commands:** Frontend: `npm run build`. Backend: `npm install` then `npm run start` (or `npm run dev` for previews). Ensure CORS `CLIENT_URL` matches the deployed frontend.
- **Secrets handling:** Do not commit `.env`. Configure env vars in your hosting provider’s dashboard. Rotate JWT secrets if leaked.

## 🔌 API(s) Used

* [cite_start]**DummyJSON API** [cite: 23]
    * **Endpoint:** `https://dummyjson.com/posts?limit=6`
    * **Usage:** Used on the **/News** page to fetch mock blog posts and display them dynamically.
    * **Endpoint:** `https://dummyjson.com/posts/search?q=[prompt]`
    * **Usage:** Used by the **"Ask AI"** component on the Home page to simulate an AI API response.

* [cite_start]**Firebase Firestore** [cite: 23]
    * **Usage:** The form on the **/Contact** page sends user messages (name, email, message) to a `messages` collection in Firestore.

* **NewsAPI (optional — recommended for real gaming articles)**
        * **Usage:** When configured, the **/News** page will query NewsAPI.org for recent gaming and esports articles.
        * **How to enable:**
            1. Sign up at https://newsapi.org/ and get your API key.
            2. Create a `.env` file in the project root (DO NOT commit this file). Add this line to it:
                 ```powershell
                 REACT_APP_NEWSAPI_KEY=your_newsapi_key_here
                 ```
            3. Restart the dev server (`npm start`) so Create React App picks up the environment variable.
        * **Notes:**
            - The key must stay secret. Do not commit `.env` to GitHub — this repo's `.gitignore` already excludes `.env.*` and related files.
            - If NewsAPI is not configured or fails, the app will try Reddit's `r/Games` JSON endpoint and then fall back to mock data from DummyJSON.
            - For production, set the `NEWSAPI_KEY` (or equivalent) in your hosting platform's environment/secret settings (Vercel, Netlify, etc.) and use a server-side proxy if you want to avoid exposing requests from the client.
      
* **Google Generative API (optional — for Ask AI responses)**
        * **Usage:** If you want the Ask AI widget to use Google Generative models (Gemini/Bison), you can set a local `.env` variable for development. For production, keep keys server-side.
        * **Local dev setup (not for production):**
            1. Create or edit `.env` in the project root (this repo's `.gitignore` excludes `.env.*`).
                 ```powershell
                 REACT_APP_GOOGLE_API_KEY=YOUR_GOOGLE_API_KEY_HERE
                 ```
            2. Restart the dev server (`npm start`). The Ask AI widget will use the key from `process.env.REACT_APP_GOOGLE_API_KEY` and call Google Generative API directly for responses.
        * **Security note:** Embedding this key in a client-side build is insecure and only acceptable for local testing. Do not commit the key to source control. For production, use a server-side endpoint that holds the key and call that endpoint from the client.

---

## 👥 Member Contributions

* **[Your Name]:** (Describe your contributions, e.g., "Set up React project, implemented routing, converted all static pages to components, integrated DummyJSON API for News page.")
* **[Partner Name]:** (Describe partner's contributions, e.g., "Set up Firebase, wired the Contact form to Firestore, implemented Theme Toggle with Local Storage, styled new components.")

---

## 📸 Screenshots

[cite_start]*(You are required to add full-screen screenshots of all your website pages here)* 

### Home Page
![Home Page](...)

### Genres Page
![Genres Page](...)

### Popular Page
![Popular Page](...)

### News Page (with API data)
![News Page](...)

### Events Page
![Events Page](...)

### Gallery Page (with Video)
![Gallery Page](...)

### Contact Page (with Firebase Form)
![Contact Page](...)