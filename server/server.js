const dotenv = require('dotenv');
dotenv.config();

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
    || (process.env.NODE_ENV === 'production' && Boolean(process.env.AWS_ACCESS_KEY_ID));

  if (shouldLoadAwsSecrets) {
    try {
      const secrets = await getProductionSecrets();
      applySecretValues(secrets);
      console.log('Loaded production secrets from AWS Secrets Manager');
    } catch (err) {
      console.warn('AWS secrets unavailable. Falling back to existing environment values.');
    }
  }

  const app = require('./app');
  const PORT = Number(process.env.PORT || 5000);
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gameverse';

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

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
};

startServer();
