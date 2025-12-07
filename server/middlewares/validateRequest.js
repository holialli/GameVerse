const Joi = require('joi');

const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
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
