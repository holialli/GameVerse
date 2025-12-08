const Joi = require('joi');

const validateRequest = (schema) => {
  return (req, res, next) => {
    let body = { ...req.body };

    // Parse numbers from FormData (which converts everything to strings)
    if (body.rating && typeof body.rating === 'string') {
      body.rating = parseFloat(body.rating);
    }
    if (body.buyPrice && typeof body.buyPrice === 'string') {
      body.buyPrice = parseFloat(body.buyPrice);
    }
    if (body.rentPrice && typeof body.rentPrice === 'string') {
      body.rentPrice = parseFloat(body.rentPrice);
    }
    if (body.platform && typeof body.platform === 'string') {
      try {
        body.platform = JSON.parse(body.platform);
      } catch (e) {
        // If parsing fails, leave as is
      }
    }
    if (body.releaseDate && typeof body.releaseDate === 'string') {
      // Ensure it's a valid date
      const date = new Date(body.releaseDate);
      if (!isNaN(date.getTime())) {
        body.releaseDate = date;
      }
    }

    const { error, value } = schema.validate(body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const messages = error.details.map((detail) => detail.message);
      return res.status(400).json({
        message: 'Validation error',
        errors: messages,
      });
    }

    req.validatedBody = value;
    next();
  };
};

module.exports = validateRequest;
