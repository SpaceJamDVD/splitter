const mongoose = require('mongoose');

const memberBalanceSchema = new mongoose.Schema(
  {
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
    },
    memberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    balance: {
      type: Number,
      default: 0, // Positive means owed money; negative means owes
    },
  },
  {
    timestamps: true,
  }
);

// Enforce uniqueness so only one record exists per group + user
memberBalanceSchema.index({ groupId: 1, memberId: 1 }, { unique: true });

module.exports = mongoose.model('MemberBalance', memberBalanceSchema);
