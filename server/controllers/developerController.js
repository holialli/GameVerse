const crypto = require('crypto');
const ApiClient = require('../models/ApiClient');
const { sendApiKeyEmail } = require('../services/emailService');

exports.signup = async (req, res) => {
  try {
    const { name, contactEmail } = req.validatedBody;

    const rawKey = crypto.randomBytes(32).toString('hex');
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
    const keyPrefix = rawKey.slice(0, 8);

    const apiClient = await ApiClient.create({
      name,
      contactEmail: String(contactEmail).toLowerCase().trim(),
      keyHash,
      keyPrefix,
    });

    // Fire-and-forget - the raw key is also returned in this response, so
    // signup isn't solely dependent on email deliverability.
    sendApiKeyEmail(apiClient.contactEmail, name, rawKey).catch((err) => console.error('Email error:', err));

    res.status(201).json({
      message: 'API key created. Store it now - it will not be shown again.',
      apiKey: rawKey,
      keyPrefix,
      monthlyLimit: apiClient.monthlyLimit,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create API key' });
  }
};
