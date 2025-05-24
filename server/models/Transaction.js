const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  date: {
    type: Date,
    default: Date.now,
  },
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true,
  },
  paidBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  splitEvenly: {
    type: Boolean,
    default: true,
  },
  owedToPurchaser: {
    type: Boolean,
    default: false,
  },
  isSettlement: {
    type: Boolean,
    default: false,
  },
  customSplit: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      amount: {
        type: Number,
        required: true,
      },
    },
  ],
  category: {
    type: String,
    enum: [
      'Rent/Mortgage',
      'Utilities',
      'Groceries',
      'Household',
      'Date Night',
      'Travel',
      'Transportation',
      'Medical',
      'Gifts',
      'Miscellaneous',
      'Settlement',
    ],
    default: 'Misc',
  },
  notes: {
    type: String,
  },
});

module.exports = mongoose.model('Transaction', transactionSchema);
