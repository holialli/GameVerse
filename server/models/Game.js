const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a game title'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Please provide a game description'],
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    genre: {
      type: String,
      enum: ['Action', 'Adventure', 'RPG', 'Strategy', 'Simulation', 'Puzzle', 'Sports', 'Horror', 'Indie', 'FPS'],
      required: [true, 'Please specify a genre'],
    },
    releaseDate: {
      type: Date,
      required: [true, 'Please provide a release date'],
    },
    rating: {
      type: Number,
      min: [0, 'Rating cannot be less than 0'],
      max: [10, 'Rating cannot exceed 10'],
      default: 0,
    },
    platform: {
      type: [String],
      enum: ['PC', 'PlayStation', 'Xbox', 'Nintendo', 'Mobile'],
      required: [true, 'Please specify at least one platform'],
    },
    imageUrl: {
      type: String,
      default: null,
    },
    developer: {
      type: String,
      required: [true, 'Please specify the developer'],
      trim: true,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
    buyPrice: {
      type: Number,
      required: [true, 'Purchase price is required'],
      min: [0, 'Price cannot be negative'],
      default: 9.99,
    },
    rentPrice: {
      type: Number,
      required: [true, 'Rental price is required'],
      min: [0, 'Price cannot be negative'],
      default: 2.99,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // Admin games have no specific creator
    },
  },
  {
    timestamps: true,
  }
);

// Index for search
gameSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Game', gameSchema);
