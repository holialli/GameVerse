const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    gameId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Game',
      required: [true, 'Game ID is required'],
    },
    type: {
      type: String,
      enum: ['buy', 'rent'],
      default: 'buy',
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    expiryDate: {
      type: Date,
      default: null, // null for purchases, set for rentals (7 days from now)
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Matches the actual query shape in purchaseController (buy/rent existence
// checks query userId+gameId+type together; userId-only/isActive queries
// still benefit from this as an index prefix).
purchaseSchema.index({ userId: 1, gameId: 1, type: 1 });

module.exports = mongoose.model('Purchase', purchaseSchema);
