# Secure Blog Web Application 🛡️

This is a simple blog system built using **Node.js + Express + MySQL** for the **Secure Application Programming** course project. It includes two branches:

- `secure`: Uses secure coding practices (recommended)
- `insecure`: Deliberately includes vulnerabilities (for demonstration)

---

## ✅ Features

- User registration and login
- Create, view, and comment on blog posts
- Session management
- Security features (in secure branch):
  - SQL injection protection (prepared statements)
  - XSS prevention (template escaping)
  - Password hashing with bcrypt
  - CSRF protection
  - Security headers via Helmet
  - Logging with Morgan and Winston

---

## 🔧 Tech Stack

- Node.js
- Express
- MySQL
- EJS templating engine
- CSURF, Helmet, Bcrypt
- Morgan + Winston logging

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/secure-blog.git
cd secure-blog
