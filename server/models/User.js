const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    username: {
      type: String,
      lowercase: true,
      trim: true,
      sparse: true,
      default: null,
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email',
      ],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Don't return password by default
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    avatar: {
      type: String,
      default: null,
    },
    bio: {
      type: String,
      maxlength: [500, 'Bio cannot exceed 500 characters'],
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isPrivate: {
      type: Boolean,
      default: false,
    },
    isShadowBanned: {
      type: Boolean,
      default: false,
    },
    violationCount: {
      type: Number,
      default: 0,
    },
    violations: {
      type: [
        {
          reason: { type: String, default: '' },
          date: { type: Date, default: Date.now },
          issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
          type: { type: String, default: 'manual' },
          message: { type: String, default: '' },
          timestamp: { type: Date },
        },
      ],
      default: [],
    },
    xp: {
      type: Number,
      default: 0,
    },
    level: {
      type: Number,
      default: 1,
    },
    badges: {
      type: [
        {
          key: { type: String, default: '' },
          name: { type: String, required: true },
          tier: { type: String, enum: ['minor', 'major', 'super'], default: 'minor' },
          description: { type: String, default: '' },
          awardedAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
    favoriteGenres: {
      type: [String],
      default: [],
    },
    wishlist: {
      type: [String],
      default: [],
    },
    hardwareProfile: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    resetToken: {
      type: String,
      default: null,
    },
    resetTokenExpiry: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare passwords
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
