// middleware/roleMiddleware.js

// Check for specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status:401,
        error:'Unauthorized user',
         message: 'Unauthorized user' 
        });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        status:403,
        error:'Access denied. Insufficient permissions.',
        message: 'Access denied. Insufficient permissions.' 
      });
    }

    next();
  };
};

// Check for specific permissions
const checkPermission = (...permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const hasPermission = permissions.some(permission => 
      req.user.permissions.includes(permission)
    );

    if (!hasPermission) {
      return res.status(403).json({ 
        message: 'Access denied. You do not have the required permission.' 
      });
    }

    next();
  };
};

module.exports = { authorize, checkPermission };