const express = require('express');
const session = require('express-session');
const path = require('path');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const csurf = require('csurf');
const morgan = require('morgan');
const fs = require('fs');
const winston = require('winston');
const expressLayouts = require('express-ejs-layouts'); // ✅ 加入 layout 插件

dotenv.config();
const app = express();

// 日志记录
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'logs/access.log'), { flags: 'a' });
app.use(morgan('combined', { stream: accessLogStream }));

// 设置 EJS 模板引擎和 layout 插件
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);                // ✅ 启用 layout 支持
app.set('layout', 'layout');           // ✅ 指定默认 layout 文件为 layout.ejs（在 views 文件夹下）

// 中间件
app.use(helmet());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// session 管理
app.use(session({
  secret: 'blog-secret',
  resave: false,
  saveUninitialized: false,
}));

// CSRF 防护
app.use(csurf());

// 自定义变量传入模板
app.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  res.locals.user = req.session.user;
  next();
});

// 路由
const authRoutes = require('./routes/auth');
const blogRoutes = require('./routes/blog');

app.use(authRoutes);
app.use(blogRoutes);

// 404 页面
app.use((req, res) => {
  res.status(404).send('404 Not Found');
});

// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});
