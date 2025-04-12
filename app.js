const express = require('express');
const session = require('express-session');
const path = require('path');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const csurf = require('csurf');
const morgan = require('morgan');
const fs = require('fs');
const expressLayouts = require('express-ejs-layouts');

dotenv.config();
const app = express();

// Logging
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'logs/access.log'), { flags: 'a' });
app.use(morgan('combined', { stream: accessLogStream }));

// View Engine Setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layout');

// Secure Session Configuration
app.use(session({
  secret: 'blog-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // true in production (HTTPS)
    sameSite: 'Strict'
  }
}));

// Helmet Security Headers
app.use(helmet());

// Custom CSP Policy (no wildcards)
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://cdnjs.cloudflare.com"],
      styleSrc: ["'self'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'"], 
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'self'"],
      scriptSrcAttr: ["'none'"]
    }
  })
);


// Additional Recommended Headers
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});
app.use(bodyParser.urlencoded({ extended: false }));

// CSRF Protection
app.use(csurf());

// Inject CSRF Token and Session User into Templates
app.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  res.locals.user = req.session.user;
  next();
});

// Routes
const authRoutes = require('./routes/auth');
const blogRoutes = require('./routes/blog');
const xssDemoRoutes = require('./routes/xssDemo');
const adminRoutes = require('./routes/admin');

app.use(authRoutes);
app.use(blogRoutes);
app.use('/', xssDemoRoutes);
app.use('/admin', adminRoutes);
app.use(express.static('public'));

// 404 Handler
app.use((req, res) => {
  res.status(404).send('404 Not Found');
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});
