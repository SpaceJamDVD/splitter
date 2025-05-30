const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username must be less than 30 characters'],
      match: [
        /^[a-zA-Z0-9_-]+$/,
        'Username can only contain letters, numbers, underscores, and hyphens',
      ],
      index: true, // For faster lookups
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please enter a valid email',
      ],
      index: true, // For faster lookups
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Don't include password in queries by default
    },

    // Profile Information
    profile: {
      firstName: {
        type: String,
        trim: true,
        maxlength: [50, 'First name must be less than 50 characters'],
      },
      lastName: {
        type: String,
        trim: true,
        maxlength: [50, 'Last name must be less than 50 characters'],
      },
      avatar: {
        type: String, // URL to avatar image
        default: null,
      },
      timezone: {
        type: String,
        default: 'UTC',
      },
      currency: {
        type: String,
        default: 'USD',
        enum: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY'],
      },
    },

    // Account Status & Security
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
      index: true,
    },
    emailVerificationToken: {
      type: String,
      select: false,
    },
    emailVerificationExpires: {
      type: Date,
      select: false,
    },
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
      default: null,
    },

    // App-specific Settings
    preferences: {
      notifications: {
        email: {
          budgetAlerts: { type: Boolean, default: true },
          transactionUpdates: { type: Boolean, default: true },
          weeklyReports: { type: Boolean, default: false },
        },
        push: {
          budgetAlerts: { type: Boolean, default: true },
          transactionUpdates: { type: Boolean, default: false },
        },
      },
      privacy: {
        profileVisibility: {
          type: String,
          enum: ['public', 'friends', 'private'],
          default: 'friends',
        },
      },
    },

    // Subscription/Plan (for future monetization)
    subscription: {
      plan: {
        type: String,
        enum: ['free', 'premium', 'family'],
        default: 'free',
      },
      status: {
        type: String,
        enum: ['active', 'cancelled', 'expired', 'trial'],
        default: 'active',
      },
      expiresAt: {
        type: Date,
        default: null,
      },
      stripeCustomerId: {
        type: String,
        default: null,
        select: false,
      },
    },

    // Soft Delete
    deletedAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
    toJSON: {
      transform: function (doc, ret) {
        delete ret.passwordHash;
        delete ret.emailVerificationToken;
        delete ret.passwordResetToken;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound Indexes for better query performance
userSchema.index({ email: 1, isActive: 1 });
userSchema.index({ username: 1, isActive: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ lastLogin: -1 });
userSchema.index({ 'subscription.plan': 1, 'subscription.status': 1 });

// Virtual for full name
userSchema.virtual('profile.fullName').get(function () {
  if (this.profile.firstName && this.profile.lastName) {
    return `${this.profile.firstName} ${this.profile.lastName}`;
  }
  return this.profile.firstName || this.profile.lastName || this.username;
});

// Virtual for account lock status
userSchema.virtual('isLocked').get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Pre-save middleware to hash password
userSchema.pre('save', async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('passwordHash')) return next();

  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to check password
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.passwordHash) return false;
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Instance method to increment login attempts
userSchema.methods.incLoginAttempts = function () {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 },
    });
  }

  const updates = { $inc: { loginAttempts: 1 } };

  // Lock account after 5 failed attempts for 2 hours
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }

  return this.updateOne(updates);
};

// Instance method to reset login attempts
userSchema.methods.resetLoginAttempts = function () {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 },
  });
};

// Static method to find active users
userSchema.statics.findActive = function () {
  return this.find({ isActive: true, deletedAt: null });
};

// Static method for soft delete
userSchema.methods.softDelete = function () {
  this.deletedAt = new Date();
  this.isActive = false;
  return this.save();
};

// Query middleware to exclude soft-deleted users by default
userSchema.pre(/^find/, function () {
  // Only apply if deletedAt filter is not already specified
  if (!this.getQuery().deletedAt) {
    this.where({ deletedAt: null });
  }
});

module.exports = mongoose.model('User', userSchema);
