// middleware/auth.js
const jwt = require('jsonwebtoken');
const { ResponseCodes } = require('../utils/constant');
const User = require("../models/UserSchema");
const auth = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(ResponseCodes.UNAUTHORIZED).json({ message: 'No authentication token, access denied' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user
    const user = await User.findOne({
      where: { id: decoded.id },
      attributes:['id','username','email','phone','role','client','isActive'],
      raw: true,
    });
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'User not found or inactive' });
    }

    // Attach user to request
    // console.log('Authenticated user:', user);
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is invalid or expired' });
  }
};

module.exports = auth;