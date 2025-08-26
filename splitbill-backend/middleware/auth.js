const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  console.log('Auth middleware: Token received:', token);

  if (!token) {
    console.log('Auth middleware: No token provided');
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Auth middleware: Token verified, user:', decoded.id);
    req.user = { id: decoded.id };
    next();
  } catch (err) {
    console.error('Auth middleware: Token verification error:', {
      message: err.message,
      stack: err.stack
    });
    res.status(401).json({ msg: `Token verification failed: ${err.message}` });
  }
};