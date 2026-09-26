// src/middleware/auth.js
import jwt from 'jsonwebtoken';

export const protect = (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Attach minimal user info to request
      req.user = {
        id: decoded.id,
        company: decoded.company || null, // will be 'ADMIN' or null/'USER'/etc.
      };

      return next();
    } catch (err) {
      console.error('Token verification failed:', err.message);
      return res.status(401).json({
        success: false,
        message: 'Not authorized – invalid or expired token',
      });
    }
  }

  return res.status(401).json({
    success: false,
    message: 'Not authorized – no token provided',
  });
};

export const adminOnly = (req, res, next) => {
  if (!req.user || req.user.company !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Forbidden – admin access required',
    });
  }
  next();
};

// Optional: you can add more roles later, e.g.
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.company)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden – required role: ${roles.join(' or ')}`,
      });
    }
    next();
  };
};