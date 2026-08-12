# GameVerse Platform
## Enterprise-Grade MERN Infrastructure and Security

![Infrastructure](https://img.shields.io/badge/Infrastructure-AWS_SSM_Deploy-623CE4)
![Cloud](https://img.shields.io/badge/Cloud-AWS-232F3E)
![Security](https://img.shields.io/badge/Security-Cloudflare_Strict_SSL-F38020)

GameVerse is a high-performance gaming platform built on the MERN stack and deployed using modern DevSecOps methodologies. This repository focuses on a scripted, GitHub Actions-driven deployment pipeline (AWS SSM shell deploy, not Terraform/IaC), network hardening, and automated security orchestration to maintain a production-ready environment.

---

### Major Updates
This section must be updated whenever a major feature, security behavior, or platform workflow changes.

#### 2026-03-29
* **Auth Secret Fallback:** Authentication and token verification now resolve JWT secrets from `JWT_ACCESS_SECRET`, `JWT_SECRET`, or `JWT_REFRESH_SECRET` to reduce environment mismatch failures.
* **Refresh Token Resilience:** Refresh-token Redis operations now include defensive error handling to prevent unhandled cache outages from causing unstable auth flows.
* **Proxy-Aware Security:** Express now trusts the first reverse proxy hop, improving client IP accuracy behind Cloudflare and strengthening rate-limit behavior.
* **Socket Auth Alignment:** WebSocket authentication now follows the same JWT secret fallback strategy used by HTTP auth middleware.
* **Redis Reliability Improvements:** Redis retry/backoff behavior and connection lifecycle logging were improved for better production observability and transient failure recovery.

---

### System Architecture and DevOps
The deployment architecture utilizes a multi-layered defense strategy to ensure high availability and data integrity.

* **Scripted Deployment:** GitHub Actions (`.github/workflows/devsecops.yml`) deploys via an AWS SSM shell script to EC2 - there is no Terraform/IaC layer in this repository today.
* **Edge Security:** Integration with Cloudflare provides Web Application Firewall (WAF) capabilities and global DDoS mitigation.
* **Encryption:** Implementation of Full (Strict) End-to-End SSL encryption utilizing Cloudflare Origin Certificates and Nginx SSL termination.
* **Network Hardening:** AWS Security Groups follow a Zero-Trust model, restricting all inbound traffic exclusively to verified Cloudflare IPv4 ranges.
* **Zero-Key Management:** Administrative access is conducted through AWS Systems Manager (SSM) Session Manager, eliminating the need for static SSH keys and reducing the identity attack surface.

---

### DevSecOps Pipeline
The CI/CD workflow, powered by GitHub Actions, incorporates rigorous security gates to validate code and container integrity before deployment.

* **Static Analysis (SAST):** Gitleaks integration to identify and block credential leakage within the repository history.
* **Software Composition Analysis (SCA):** Snyk automated scanning to detect and remediate vulnerabilities in NPM dependencies (CVEs).
* **Container Security:** Trivy scans performed on Docker images to identify OS-level vulnerabilities during the build phase.
* **Automated Deployment:** Verified code is deployed to the production environment only after successfully passing all security and build stages.

---

### Technical Specification
| Category | Component |
| :--- | :--- |
| **Frontend** | React.js, Context API, CSS Modules |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB Atlas (Distributed Cloud Cluster) |
| **Proxy / Web Server** | Nginx (Reverse Proxy with SSL Termination) |
| **Infrastructure** | AWS (EC2, EIP, IAM, SSM, Security Groups) |
| **Provisioning** | Scripted GitHub Actions deploy via AWS SSM (no Terraform/IaC) |

---

### Core Security Implementation
* **JWT Lifecycle Management:** Secure, HTTP-only cookie-based token rotation for robust session persistence.
* **Layer 7 Protection:** Express-based rate limiting and request validation middleware to mitigate automated threats and brute-force attempts.
* **Identity and Access Management (IAM):** Utilization of IAM Instance Profiles following the Principle of Least Privilege (PoLP).
* **Secret Isolation:** Separation of production secrets using GitHub Actions Secrets and encrypted server-side environment configurations.

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