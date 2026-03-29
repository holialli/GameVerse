const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { sendWelcomeEmail, sendPasswordResetEmail } = require('../services/emailService');
const redis = require('../utils/redisClient');

const isBasicStrongPassword = (value) => {
  const pwd = String(value || '');
  return pwd.length >= 8 && /\d/.test(pwd) && /[^A-Za-z0-9]/.test(pwd);
};

const resolveJwtSecret = () => {
  return process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || process.env.JWT_REFRESH_SECRET || null;
};

const generateTokens = (userId, role = 'user') => {
  const jwtSecret = resolveJwtSecret();
  if (!jwtSecret) {
    throw new Error('JWT secret is required');
  }

  const accessToken = jwt.sign({ id: userId, role }, jwtSecret, {
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

const storeRefreshTokenIfAvailable = async (userId, refreshToken) => {
  if (!redis) {
    return;
  }

  try {
    await redis.set(`refresh_token:${userId}:${refreshToken}`, 'valid', 'EX', 7 * 24 * 60 * 60);
  } catch (err) {
    // Redis is optional for login/register. Do not block auth if cache is unavailable.
    console.error('[AUTH] Redis token store failed:', err.message);
  }
};

// Register user
exports.register = async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.validatedBody;

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    if (!isBasicStrongPassword(password)) {
      return res.status(400).json({ message: 'Password must be at least 8 characters and include a number and symbol' });
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
    
    await storeRefreshTokenIfAvailable(user._id, refreshToken);

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
    console.error('[AUTH] Registration error:', error.message);
    const message = process.env.NODE_ENV === 'production'
      ? 'Registration failed. Please try again later.'
      : error.message;
    res.status(500).json({ message });
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

    await storeRefreshTokenIfAvailable(user._id, refreshToken);

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
    console.error('[AUTH] Login error:', error.message);
    const message = process.env.NODE_ENV === 'production'
      ? 'Login failed. Please try again later.'
      : error.message;
    res.status(500).json({ message });
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

    let tokenStatus;
    try {
      // Check Redis for old token
      tokenStatus = await redis.get(`refresh_token:${userId}:${oldRefreshToken}`);
    } catch (err) {
      console.error('[AUTH] Redis token read failed:', err.message);
      return res.status(503).json({ message: 'Token refresh temporarily unavailable. Please login again.' });
    }
    if (!tokenStatus) {
      // Possible replay attack, invalidate ALL tokens for user
      try {
        const keys = await redis.keys(`refresh_token:${userId}:*`);
        if (keys.length > 0) {
          await redis.del(...keys);
        }
      } catch (err) {
        console.error('[AUTH] Redis replay cleanup failed:', err.message);
      }
      return res.status(403).json({ message: 'Invalid refresh token, please login' });
    }

    // Delete old token
    try {
      await redis.del(`refresh_token:${userId}:${oldRefreshToken}`);
    } catch (err) {
      console.error('[AUTH] Redis token delete failed:', err.message);
      return res.status(503).json({ message: 'Token refresh temporarily unavailable. Please login again.' });
    }

    // Generate new tokens
    const userRole = req.user?.role || 'user';
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(userId, userRole);

    try {
      await redis.set(`refresh_token:${userId}:${newRefreshToken}`, 'valid', 'EX', 7 * 24 * 60 * 60);
    } catch (err) {
      console.error('[AUTH] Redis token rotate store failed:', err.message);
      return res.status(503).json({ message: 'Token refresh temporarily unavailable. Please login again.' });
    }

    setTokenCookies(res, accessToken, newRefreshToken);

    res.json({
      message: 'Token rotated successfully',
      accessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    console.error('[AUTH] Token refresh error:', error.message);
    res.status(500).json({ message: 'Failed to refresh token. Please login again.' });
  }
};

// Get current user
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json(user);
  } catch (error) {
    console.error('[AUTH] Get current user error:', error.message);
    const message = process.env.NODE_ENV === 'production'
      ? 'Failed to retrieve user information. Please try again later.'
      : error.message;
    res.status(500).json({ message });
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

    // Send password reset email - don't block if email fails
    let emailSent = true;
    try {
      const mailInfo = await sendPasswordResetEmail(email, resetToken, user.name);
      const payload = { message: 'Password reset link sent to your email' };
      if (process.env.NODE_ENV !== 'production' && mailInfo?.previewUrl) {
        payload.previewUrl = mailInfo.previewUrl;
      }
      return res.json(payload);
    } catch (emailError) {
      console.error('[AUTH] Password reset email failed, but token saved. User should retry or contact support.');
      emailSent = false;
      // Even if email fails, respond with generic message to avoid exposing implementation details
      return res.status(500).json({ 
        message: 'We encountered an issue sending the password reset email. Please try again later or contact support.' 
      });
    }
  } catch (error) {
    // Generic error message for other unexpected errors
    const message = process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred. Please try again later.'
      : error.message;
    res.status(500).json({ message });
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

    if (!isBasicStrongPassword(newPassword)) {
      return res.status(400).json({ message: 'Password must be at least 8 characters and include a number and symbol' });
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
    console.error('[AUTH] Reset password error:', error.message);
    const message = process.env.NODE_ENV === 'production'
      ? 'Password reset failed. Please try again later.'
      : error.message;
    res.status(500).json({ message });
  }
};
