const jwt = require('jsonwebtoken');

   module.exports = function(req, res, next) {
     const token = req.header('Authorization')?.replace('Bearer ', '');
     console.log('Auth middleware: Token received:', token);

     if (!token) {
       console.log('Auth middleware: No token provided');
       return res.status(401).json({ msg: 'No token, authorization denied' });
     }

     try {
       const decoded = jwt.verify(token, 'your_jwt_secret');
       console.log('Auth middleware: Token decoded:', decoded);
       req.user = decoded;
       next();
     } catch (err) {
       console.error('Auth middleware: Token verification error:', {
         message: err.message,
         stack: err.stack
       });
       res.status(401).json({ msg: 'Token is not valid' });
     }
   };