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
  genre: Joi.string().required().valid('RPG', 'FPS', 'Strategy', 'Sports', 'Adventure', 'Puzzle', 'Other'),
  releaseDate: Joi.date().required(),
  rating: Joi.number().min(0).max(10),
  platform: Joi.array()
    .items(Joi.string().valid('PC', 'PlayStation', 'Xbox', 'Nintendo', 'Mobile'))
    .required()
    .min(1),
  developer: Joi.string().required(),
});

exports.updateGameSchema = Joi.object({
  title: Joi.string().max(100),
  description: Joi.string().max(1000),
  genre: Joi.string().valid('RPG', 'FPS', 'Strategy', 'Sports', 'Adventure', 'Puzzle', 'Other'),
  releaseDate: Joi.date(),
  rating: Joi.number().min(0).max(10),
  platform: Joi.array().items(Joi.string().valid('PC', 'PlayStation', 'Xbox', 'Nintendo', 'Mobile')).min(1),
  developer: Joi.string(),
}).min(1);
