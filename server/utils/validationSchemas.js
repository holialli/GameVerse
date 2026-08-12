const Joi = require('joi');

exports.registerSchema = Joi.object({
  name: Joi.string().required().min(2).max(50),
  username: Joi.string().required().min(3).max(30).pattern(/^[a-zA-Z0-9_-]+$/),
  email: Joi.string().email().required(),
  password: Joi.string()
    .required()
    .min(8)
    .pattern(/^(?=.*\d)(?=.*[^A-Za-z0-9]).+$/)
    .messages({
      'string.pattern.base': 'Password must include at least one number and one symbol',
      'string.min': 'Password must be at least 8 characters long',
    }),
  confirmPassword: Joi.string().required().min(8),
});

exports.loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

exports.createGameSchema = Joi.object({
  title: Joi.string().required().max(100),
  description: Joi.string().required().max(1000),
  genre: Joi.string().required().valid('Action', 'Adventure', 'RPG', 'Strategy', 'Simulation', 'Puzzle', 'Sports', 'Horror', 'Indie', 'FPS'),
  releaseDate: Joi.date().required(),
  rating: Joi.number().min(0).max(10),
  platform: Joi.array()
    .items(Joi.string().valid('PC', 'PlayStation', 'Xbox', 'Nintendo', 'Mobile'))
    .required()
    .min(1),
  developer: Joi.string().allow(''),
  imageUrl: Joi.string().allow(''),
  buyPrice: Joi.number().min(0.99).optional(),
  rentPrice: Joi.number().min(0.99).optional(),
});

exports.publicCompatibilitySchema = Joi.object({
  rawgId: Joi.number().optional(),
  cpu: Joi.string().required().max(200),
  gpu: Joi.string().required().max(200),
  ramGb: Joi.number().min(1).max(256).optional(),
  platform: Joi.string().valid('pc', 'steamdeck', 'ps5', 'xboxseriesx', 'nintendoswitch').optional(),
});

exports.developerSignupSchema = Joi.object({
  name: Joi.string().required().max(100),
  contactEmail: Joi.string().email().required(),
});

exports.reviewSchema = Joi.object({
  rating: Joi.number().min(1).max(5).required(),
  text: Joi.string().max(1000).allow('').optional(),
  rawgSlug: Joi.string().allow('').optional(),
  gameTitle: Joi.string().allow('').optional(),
});

exports.updateGameSchema = Joi.object({
  title: Joi.string().max(100).optional().allow(''),
  description: Joi.string().max(1000).optional().allow(''),
  genre: Joi.string().valid('Action', 'Adventure', 'RPG', 'Strategy', 'Simulation', 'Puzzle', 'Sports', 'Horror', 'Indie', 'FPS').optional(),
  releaseDate: Joi.date().optional(),
  rating: Joi.number().min(0).max(10).optional(),
  platform: Joi.array().items(Joi.string().valid('PC', 'PlayStation', 'Xbox', 'Nintendo', 'Mobile')).optional(),
  developer: Joi.string().allow('').optional(),
  imageUrl: Joi.string().allow('').optional(),
  buyPrice: Joi.number().min(0.99).optional(),
  rentPrice: Joi.number().min(0.99).optional(),
  isSponsored: Joi.boolean().optional(),
  sponsoredUntil: Joi.date().allow(null).optional(),
  sponsoredUrl: Joi.string().uri().allow('', null).optional(),
}).unknown(true);
