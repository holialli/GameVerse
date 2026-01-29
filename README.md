# GameVerse 🎮

![Security Pipeline](https://github.com/holialli/GameVerse/actions/workflows/devsecops.yml/badge.svg)

*A high-performance, security-hardened MERN application for modern gamers.*

---

### **🛡️ DevSecOps & Security Automation**
This project is guarded by a **Security-First CI/CD Pipeline**. Instead of traditional manual deployment, GameVerse uses automated "Security Gates" to ensure 100% code integrity before it ever touches the server.

* **Secret Analysis (Gitleaks):** Scans the entire repository history to block leaked API keys or credentials.
* **Dependency Audit (Snyk):** Automatically detects and blocks vulnerable NPM libraries (CVEs).
* **Container Hardening (Trivy):** Scans Docker images for OS-level vulnerabilities.
* **Automated CD:** Triggers production deployment via Render hooks only after passing the security gauntlet.



---

### **🚀 Technical Stack**
| Category | Technologies |
| :--- | :--- |
| **Frontend** | React.js, Context API, Tailwind CSS, Vercel Analytics |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB Atlas (Cloud) |
| **AI** | Google Generative AI (Gemini Integration) |
| **DevOps** | Docker, GitHub Actions, Snyk, Gitleaks, Trivy |

---

### **🔐 Core Security Features**
* **JWT Rotation:** Implementation of secure access/refresh token logic for session management.
* **Rate Limiting:** Protects endpoints from Brute Force and DDoS attacks.
* **Environment Isolation:** Strict `.env` management to separate development and production secrets.
* **Validated Middleware:** Custom Express middleware for strict request validation and error handling.

---

### **📂 Project Architecture**

**Frontend (Client)**
* `src/pages` - Dynamic UI (Dashboard, News, Gallery, Profile)
* `src/contexts` - Secure Auth & Global State
* `src/services` - External API & Firebase Integration

**Backend (Server)**
* `server/routes` - RESTful API Endpoints
* `server/middleware` - Security & Auth Filters
* `server/models` - Optimized MongoDB Data Schemas

---

### **🧪 Local Development**
To set up this project locally for testing or contribution:

1.  **Clone the Repo:**
    ```bash
    git clone [https://github.com/ali13/GameVerse](https://github.com/ali13/GameVerse)
    ```
2.  **Install Ingredients:**
    ```bash
    npm install && cd server && npm install
    ```
3.  **Run Security Scan:**
    ```bash
    # Ensure you have your SNYK_TOKEN set
    snyk test
    ```
4.  **Start Dev Server:**
    ```bash
    # Terminal 1
    cd server && npm run dev
    # Terminal 2
    npm start
    ```

---

### **✉️ Contact & Support**
Developed by **Ali Ahmad**. As a **Cybersecurity student**, I prioritize data safety and automated reliability. For technical inquiries regarding the DevSecOps architecture, feel free to open an issue or reach out.