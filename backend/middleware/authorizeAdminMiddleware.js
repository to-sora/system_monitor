// middleware/authorizeAdminMiddleware.js
const authorizeAdmin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    return next();
  } else {
    return res.status(403).json({ message: 'Admin access required.' });
  }
};

module.exports = authorizeAdmin;
