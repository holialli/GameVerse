const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { sendWelcomeEmail, sendPasswordResetEmail } = require('../services/emailService');
const redis = require('../utils/redisClient');

const generateTokens = (userId, role = 'user') => {
  const accessToken = jwt.sign({ id: userId, role }, process.env.JWT_ACCESS_SECRET || 'secret1', {
    expiresIn: process.env.JWT_ACCESS_EXPIRE || '15m',
  });

  const refreshToken = crypto.randomBytes(40).toString('hex');
  return { accessToken, refreshToken };
};

const setTokenCookies = (res, accessToken, refreshToken) => {
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict',
    maxAge: 15 * 60 * 1000, 
  });
  
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, 
  });
};

// Register user
exports.register = async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.validatedBody;

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    // Check if user exists by email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Create new user
    const user = await User.create({ name, email, password });

    // Send welcome email (async, don't wait)
    sendWelcomeEmail(email, name).catch(err => console.error('Email error:', err));

    const { accessToken, refreshToken } = generateTokens(user._id, user.role);
    
    // Store refresh token when Redis is configured.
    if (redis) {
      await redis.set(`refresh_token:${user._id}:${refreshToken}`, 'valid', 'EX', 7 * 24 * 60 * 60);
    }

    setTokenCookies(res, accessToken, refreshToken);

    res.status(201).json({
      message: 'User registered successfully',
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Login user by email
exports.login = async (req, res) => {
  try {
    const { email, password } = req.validatedBody;

    // Find user by email
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check password
    const isPasswordMatch = await user.matchPassword(password);
    if (!isPasswordMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const { accessToken, refreshToken } = generateTokens(user._id, user.role);

    // Store refresh token when Redis is configured.
    if (redis) {
      await redis.set(`refresh_token:${user._id}:${refreshToken}`, 'valid', 'EX', 7 * 24 * 60 * 60);
    }

    setTokenCookies(res, accessToken, refreshToken);

    res.json({
      message: 'Login successful',
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Refresh token & Rotation logic
exports.refreshToken = async (req, res) => {
  try {
    const oldRefreshToken = req.cookies.refreshToken;
    const userId = req.user?.id || req.body.userId; // Based on your auth middleware setup

    if (!oldRefreshToken || !userId) {
      return res.status(401).json({ message: 'No valid rotation context' });
    }

    if (!redis) {
      return res.status(503).json({ message: 'Token refresh unavailable. Please login again.' });
    }

    // Check Redis for old token
    const tokenStatus = await redis.get(`refresh_token:${userId}:${oldRefreshToken}`);
    if (!tokenStatus) {
      // Possible replay attack, invalidate ALL tokens for user
      const keys = await redis.keys(`refresh_token:${userId}:*`);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
      return res.status(403).json({ message: 'Invalid refresh token, please login' });
    }

    // Delete old token
    await redis.del(`refresh_token:${userId}:${oldRefreshToken}`);

    // Generate new tokens
    const userRole = req.user?.role || 'user';
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(userId, userRole);

    await redis.set(`refresh_token:${userId}:${newRefreshToken}`, 'valid', 'EX', 7 * 24 * 60 * 60);

    setTokenCookies(res, accessToken, newRefreshToken);

    res.json({
      message: 'Token rotated successfully',
      accessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Get current user
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Forgot password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'No user found with that email' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Set token and expiry (24 hours)
    user.resetToken = resetTokenHash;
    user.resetTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    // Send password reset email
    await sendPasswordResetEmail(email, resetToken, user.name);

    res.json({ message: 'Password reset link sent to your email' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Reset password
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    if (!token) {
      return res.status(400).json({ message: 'Reset token is required' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    // Hash the provided token
    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid reset token
    const user = await User.findOne({
      resetToken: resetTokenHash,
      resetTokenExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Update password
    user.password = newPassword;
    user.resetToken = null;
    user.resetTokenExpiry = null;
    await user.save();

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
