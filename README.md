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
---

## 🔌 API(s) Used

* [cite_start]**DummyJSON API** [cite: 23]
    * **Endpoint:** `https://dummyjson.com/posts?limit=6`
    * **Usage:** Used on the **/News** page to fetch mock blog posts and display them dynamically.
    * **Endpoint:** `https://dummyjson.com/posts/search?q=[prompt]`
    * **Usage:** Used by the **"Ask AI"** component on the Home page to simulate an AI API response.

* [cite_start]**Firebase Firestore** [cite: 23]
    * **Usage:** The form on the **/Contact** page sends user messages (name, email, message) to a `messages` collection in Firestore.

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