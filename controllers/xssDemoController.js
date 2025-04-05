const escapeHtml = require('escape-html');

exports.getSearch = (req, res) => {
  const keyword = escapeHtml(req.query.keyword || '');
  res.send(`<h1>Results for: ${keyword}</h1>`);
};
