exports.getSearch = (req, res) => {
    const keyword = req.query.keyword;
    // ❌ No escape is intentionally done, 
    // resulting in Reflected XSS vulnerabilities
    res.send(`<h1>Results for: ${keyword}</h1>`);
  };
  