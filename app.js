const express = require('express');
const session = require('express-session');
const path = require('path');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const helmet = require('helmet');
// const csurf = require('csurf');
const morgan = require('morgan');
const fs = require('fs');
const winston = require('winston');
const expressLayouts = require('express-ejs-layouts'); 

dotenv.config();
const app = express();

// Log recording
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'logs/access.log'), { flags: 'a' });
app.use(morgan('combined', { stream: accessLogStream }));

// Set up the EJS template engine and layout plug-in
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);              
app.set('layout', 'layout');          

// middleware
// app.use(helmet());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// session management
app.use(session({
  secret: 'blog-secret',
  resave: false,
  saveUninitialized: false,
}));

// CSRF Defense
// app.use(csurf());

// Custom variables are passed into the template
app.use((req, res, next) => {
  // res.locals.csrfToken = req.csrfToken();
  res.locals.user = req.session.user;
  next();
});

// routes
const authRoutes = require('./routes/auth');
const blogRoutes = require('./routes/blog');
const xssDemoRoutes = require('./routes/xssDemo');

app.use(authRoutes);
app.use(blogRoutes);
app.use('/', xssDemoRoutes);

// 404 page
app.use((req, res) => {
  res.status(404).send('404 Not Found');
});

// start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});
