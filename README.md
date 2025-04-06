# 🛡️ Blog-Manager

**Blog-Manager** is a secure programming project developed for the _Secure Application Programming_ module at National College of Ireland. This project demonstrates how common web vulnerabilities can be introduced and how they can be mitigated using industry best practices.

---

## 📌 Project Overview

This is a simple blog application where users can:

- Register and log in
- Create blog posts
- Comment on posts

The project includes two versions:

- `insecure` branch: Contains intentionally vulnerable code
- `secure` branch: Implements secure coding practices and mitigations

---

## 🧱 Tech Stack

| Layer             | Technology        |
|------------------|-------------------|
| Backend           | Node.js + Express |
| Database          | MySQL             |
| Templating        | EJS               |
| Session Handling  | express-session   |
| CSRF Protection   | csurf             |
| Security Headers  | helmet            |
| Password Hashing  | bcryptjs          |

---

## ⚠️ Vulnerabilities in Insecure Version

- SQL Injection  
- Stored XSS  
- Reflected XSS  
- DOM-Based XSS  
- Sensitive Data Exposure (plaintext password, exposed error stack)

---

## ✅ Security Features in Secure Version

- Parameterized SQL queries to prevent injection
- Input sanitization and output encoding to prevent XSS
- bcrypt password hashing
- Error handling without revealing stack traces
- CSRF protection using `csurf`
- Helmet middleware for security headers
- Secure session management
- Server-side logging of errors

---

## 🚀 How to Run the Project (Step-by-Step)

Follow the steps below to run either version of the project locally:

### 1. 📦 Install Node.js Dependencies

```bash
npm install
```

### 2. 🗄️ Set Up the MySQL Database

1. Log into your MySQL server and create the database:

```sql
CREATE DATABASE blog_manager;
```

2. Create the required tables:

```sql
USE blog_manager;

CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL
);

CREATE TABLE posts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  user_id INT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE comments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  content TEXT NOT NULL,
  post_id INT,
  user_id INT,
  FOREIGN KEY (post_id) REFERENCES posts(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### 3. ⚙️ Configure Database Connection

Open `models/db.js` and update your MySQL credentials:

```js
const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'your_mysql_username',
  password: 'your_mysql_password',
  database: 'blog_manager'
});

module.exports = db;
```

> ⚠️ If you use `.env` for config, ensure to `require('dotenv').config()` and update accordingly.

### 4. ▶️ Start the Application

```bash
node app.js
```

Visit the app in your browser:

```
http://localhost:3000
```

You can now register a user, create blog posts, and test both insecure and secure behaviors.

---

## 🌿 Git Branches

Switch branches using:

```bash
git checkout secure
# or
git checkout insecure
```

---

## 👨‍💻 Author

**Project**: Blog-Manager  
**Module**: Secure Application Programming  
**Student ID**: x23361123  
**Student Name**: Xiangze Xue 
**University**: National College of Ireland
