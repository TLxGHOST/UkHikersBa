// middleware/admin.js
const User = require('../models/User');

/**
 * Admin middleware to restrict access to admin-only routes
 */
const admin = async (req, res, next) => {
  try {
    // Get user from auth middleware
    const user = await User.findById(req.user.id);

    // Check if user is admin
    if (!user || !user.isAdmin) {
      return res.status(403).json({ message: 'Access denied: Admin privileges required' });
    }

    next();
  } catch (err) {
    console.error('Admin middleware error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = admin;