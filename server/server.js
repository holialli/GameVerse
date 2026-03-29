const http = require('http');
const mongoose = require('mongoose');
const dns = require('dns');
const { getProductionSecrets } = require('./config/secrets');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const applyCommonDefaults = () => {
  process.env.PORT = process.env.PORT || '5000';
  process.env.NODE_ENV = process.env.NODE_ENV || 'production';
  process.env.SMTP_HOST = process.env.SMTP_HOST || 'smtp.resend.com';
  process.env.SMTP_PORT = process.env.SMTP_PORT || '465';
  process.env.SMTP_USER = process.env.SMTP_USER || 'resend';
};

const applySecretValues = (secrets) => {
  if (!secrets || typeof secrets !== 'object') return;
  Object.entries(secrets).forEach(([key, value]) => {
    if (typeof key === 'string' && value != null) {
      process.env[key] = String(value);
    }
  });
};

const startServer = async () => {
  applyCommonDefaults();

  const shouldLoadAwsSecrets = process.env.USE_AWS_SECRETS === 'true'
    || process.env.NODE_ENV === 'production';

  if (shouldLoadAwsSecrets) {
    try {
      const secrets = await getProductionSecrets();
      applySecretValues(secrets);
      console.log('✓ Loaded production secrets from AWS Secrets Manager');
      // Log secret presence without exposing values
      if (process.env.GEMINI_API_KEY) console.log('✓ GEMINI_API_KEY loaded successfully');
      if (process.env.RAWG_API_KEY) console.log('✓ RAWG_API_KEY loaded successfully');
      if (process.env.MONGODB_URI) console.log('✓ MONGODB_URI loaded successfully');
    } catch (err) {
      console.error('✗ Failed to load production secrets from AWS Secrets Manager:', err.message);
      process.exit(1);
    }
  } else {
    console.log('⚠ Running in non-production mode. Secrets not loaded from AWS.');
    if (process.env.GEMINI_API_KEY) console.log('✓ GEMINI_API_KEY found in environment');
    if (process.env.RAWG_API_KEY) console.log('✓ RAWG_API_KEY found in environment');
  }

  const app = require('./app');
  const { initSocket } = require('./socket');
  const PORT = Number(process.env.PORT || 5000);
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    console.error('Missing required MONGODB_URI. Provide it through AWS Secrets Manager or environment configuration.');
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGODB_URI, {});
    console.log('MongoDB connected successfully');
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  }

  mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected');
  });

  process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    process.exit(0);
  });

  const server = http.createServer(app);
  initSocket(server);

  server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
};

startServer();
