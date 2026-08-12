const express = require('express');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');

const app = express();

// Required behind Cloudflare/reverse proxies so req.ip is derived safely.
app.set('trust proxy', 1);

// Lean logging
app.use(morgan('combined'));

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://www.googletagmanager.com", "https://static.cloudflareinsights.com"],
      styleSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      mediaSrc: ["'self'", "https:"],
      connectSrc: ["'self'", "https://game-verse.tech", "https://www.google-analytics.com", "https://region1.google-analytics.com", "https://static.cloudflareinsights.com"],
      frameSrc: ["'self'", "https:"]
    }
  }
}));
app.use(mongoSanitize());

// CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  'https://game-verse.tech',
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser clients and same-origin requests.
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);
app.use(cookieParser());

// Rate limiting
const limiter = rateLimit({
  windowMs: (process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000,
  max: process.env.RATE_LIMIT_MAX_REQUESTS || 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      status: 'error',
      message: 'Too many requests. Please try again later.',
    });
  },
});

app.use('/api/', limiter);

// Body parser middleware - increased limit for image uploads (base64).
// The verify callback stashes the raw body on every request as req.rawBody -
// needed by the Lemon Squeezy webhook's HMAC signature check, which must
// hash the exact bytes received, not a re-serialized version of req.body.
app.use(express.json({ limit: '50mb', verify: (req, res, buf) => { req.rawBody = buf; } }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Static files
app.use('/public', express.static('public'));

// Health check route
app.get('/api/health', (req, res) => {
  const apiKeysLoaded = {
    gemini: !!process.env.GEMINI_API_KEY,
    rawg: !!process.env.RAWG_API_KEY,
    mongodb: !!process.env.MONGODB_URI,
  };
  
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    environment: process.env.NODE_ENV,
    apiKeysLoaded,
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/games', require('./routes/gameRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/videos', require('./routes/videoRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/purchases', require('./routes/purchaseRoutes'));
app.use('/api/contact', require('./routes/contactRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));
app.use('/api/hardware', require('./routes/hardwareRoutes'));
app.use('/api/events', require('./routes/eventRoutes'));
app.use('/api/news', require('./routes/newsRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/webhooks', require('./routes/webhookRoutes'));
app.use('/api/developers', require('./routes/developerRoutes'));
app.use('/api/v1/compatibility', require('./routes/publicApiRoutes'));
app.use('/api/subscriptions', require('./routes/subscriptionRoutes'));
app.use('/', require('./routes/sitemapRoutes'));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  const referenceId = require('crypto').randomUUID();
  console.error(`[ERROR ${referenceId}] {${err.statusCode || 500}]:`, {
    message: err.message,
    code: err.code,
    stack: err.stack,
  });

  const statusCode = err.statusCode || 500;
  
  // In production, return generic message; in development, expose details
  const message = process.env.NODE_ENV === 'production'
    ? (err.message === 'Email service failed: Message failed: 550 API key is invalid' ? 'Email service temporarily unavailable' : 'An unexpected error occurred.')
    : (err.message || 'Internal Server Error');

  res.status(statusCode).json({
    status: 'error',
    referenceId,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

module.exports = app;
