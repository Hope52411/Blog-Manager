exports.isAdmin = (req, res, next) => {
    if (!req.session || !req.session.user) {
      return res.status(401).send('Unauthorized. Please log in.');
    }
  
    if (req.session.user.role === 'admin') {
      return next();
    }
  
    res.status(403).send('Access denied. Admins only.');
  };
  