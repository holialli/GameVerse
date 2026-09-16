# GameVerse Platform
## Enterprise-Grade MERN Infrastructure and Security

![Frontend](https://img.shields.io/badge/Frontend-Vercel-000000)
![Backend](https://img.shields.io/badge/Backend-Render-46E3B7)
![Pipeline](https://img.shields.io/badge/CI-GitHub_Actions_DevSecOps-2088FF)

GameVerse is a gaming platform built on the MERN stack and deployed through a DevSecOps pipeline. The React frontend is hosted on Vercel and the Express API on Render. GitHub Actions gates every backend deploy behind secret, dependency and container scanning (a scripted pipeline, not Terraform/IaC). From March to September 2026 the whole stack ran on a single AWS EC2 instance behind Cloudflare and Nginx.

---

### Major Updates
This section must be updated whenever a major feature, security behavior, or platform workflow changes.

#### 2026-09-17
* **Hosting Migration (AWS → Render + Vercel):** The AWS free plan ended, so the API moved to a free Render web service (Docker, Singapore) and the frontend to Vercel. MongoDB Atlas and Upstash Redis are unchanged.
* **Opt-in AWS Secrets:** The server loads AWS Secrets Manager only when `USE_AWS_SECRETS=true`. Otherwise it reads secrets from the host's environment variables.
* **Cross-Site Auth:** Auth cookies are `Secure; SameSite=None` in production, and `/api/auth/refresh` also accepts the refresh token in the request body for browsers that block third-party cookies. `CLIENT_URL` accepts a comma-separated list of origins for both CORS and Socket.IO.
* **Cold-Start UX:** The free API sleeps after 15 idle minutes. `ServerWakeNotice` pings `/api/health` as soon as a visitor lands and shows a "Starting the server…" notice while the API wakes (~30–60 s).
* **Scan-Gated Deploys:** Render auto-deploy is off. The pipeline triggers Render's deploy hook for the exact scanned commit, then waits until `/api/health` reports that commit before running the ZAP scan.

#### 2026-03-29
* **Auth Secret Fallback:** Authentication and token verification now resolve JWT secrets from `JWT_ACCESS_SECRET`, `JWT_SECRET`, or `JWT_REFRESH_SECRET` to reduce environment mismatch failures.
* **Refresh Token Resilience:** Refresh-token Redis operations now include defensive error handling to prevent unhandled cache outages from causing unstable auth flows.
* **Proxy-Aware Security:** Express now trusts the first reverse proxy hop, improving client IP accuracy behind Cloudflare and strengthening rate-limit behavior.
* **Socket Auth Alignment:** WebSocket authentication now follows the same JWT secret fallback strategy used by HTTP auth middleware.
* **Redis Reliability Improvements:** Redis retry/backoff behavior and connection lifecycle logging were improved for better production observability and transient failure recovery.

---

### System Architecture and DevOps
The platform runs entirely on free-tier managed services.

* **Frontend Hosting:** Vercel builds the React app from `main`. `vercel.json` rewrites client-side routes to `index.html`.
* **Backend Hosting:** A Render web service built from `server/dockerfile`, with TLS at Render's edge. Free instances sleep when idle, and the UI handles the cold start with a wake-up ping and a status notice.
* **Data:** MongoDB Atlas, plus Upstash Redis for refresh tokens, shadowbans and the Socket.IO adapter.
* **Scripted Deployment:** GitHub Actions (`.github/workflows/devsecops.yml`) triggers Render's deploy hook after all security gates pass. There is no Terraform/IaC layer. `render.yaml` documents the service settings.
* **Previous Setup (Mar–Sep 2026):** AWS EC2 behind Cloudflare (WAF, DDoS protection, Full Strict SSL with origin certificates) and Nginx. Deploys ran through AWS SSM, with no static SSH keys, and the security group only accepted Cloudflare IP ranges. `server/config/nginx.conf` is kept for reference.

---

### DevSecOps Pipeline
The CI/CD workflow, powered by GitHub Actions, incorporates rigorous security gates to validate code and container integrity before deployment.

* **Static Analysis (SAST):** Gitleaks integration to identify and block credential leakage within the repository history.
* **Software Composition Analysis (SCA):** Snyk automated scanning to detect and remediate vulnerabilities in NPM dependencies (CVEs).
* **Container Security:** Trivy scans performed on Docker images to identify OS-level vulnerabilities during the build phase.
* **Automated Deployment:** Code reaches production only after passing every security and build stage. The workflow deploys the exact scanned commit to Render, confirms it is live through `/api/health`, then runs an OWASP ZAP baseline scan.

---

### Technical Specification
| Category | Component |
| :--- | :--- |
| **Frontend** | React.js, Context API, CSS Modules |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB Atlas (Distributed Cloud Cluster), Upstash Redis |
| **Realtime** | Socket.IO with Redis adapter |
| **Hosting** | Vercel (frontend), Render (API, Docker) |
| **Provisioning** | GitHub Actions + Render deploy hook (no Terraform/IaC) |
| **Previously** | AWS EC2 + Nginx + Cloudflare, deployed via AWS SSM |

---

### Core Security Implementation
* **JWT Lifecycle Management:** Refresh-token rotation backed by Redis, using HTTP-only cookies (`Secure; SameSite=None` for the cross-site frontend/API setup) with replay rejection.
* **Layer 7 Protection:** Express-based rate limiting and request validation middleware to mitigate automated threats and brute-force attempts.
* **Origin Allow-listing:** A single CORS allowlist shared by the REST API and Socket.IO.
* **Secret Isolation:** Production secrets live in the hosting provider's environment configuration and in GitHub Actions secrets. Nothing is baked into images. AWS Secrets Manager remains available as an opt-in loader.

---

### Deployment and Local Configuration
To initialize the project in a development environment:

1.  **Repository Initialization**
    ```bash
    git clone [https://github.com/holialli/GameVerse](https://github.com/holialli/GameVerse)
    ```
2.  **Dependency Installation**
    ```bash
    npm install && cd server && npm install
    ```
3.  **Security Validation**
    ```bash
    # Requires Snyk CLI installation and authentication
    snyk test
    ```
4.  **Environment Execution**
    ```bash
    # Start Backend Services
    cd server && npm run dev
    # Start Frontend Services
    npm start
    ```

---

### Professional Contact
**Ali Ahmad**  
mail : ali1305123456789@gmail.com

Technical inquiries regarding the infrastructure architecture or DevSecOps implementation may be directed through GitHub Issues.