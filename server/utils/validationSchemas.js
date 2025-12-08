const Joi = require('joi');

exports.registerSchema = Joi.object({
  name: Joi.string().required().min(2).max(50),
  email: Joi.string().email().required(),
  password: Joi.string().required().min(6),
  confirmPassword: Joi.string().required().min(6),
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
}).unknown(true);
