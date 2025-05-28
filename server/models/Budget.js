// server/models/Budget.js
const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema(
  {
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    period: {
      type: String,
      enum: ['weekly', 'monthly', 'quarterly', 'yearly'],
      default: 'monthly',
    },
    isCustomCategory: {
      type: Boolean,
      default: false,
    },
    isRepeating: {
      type: Boolean,
      default: true, // Most budgets should repeat by default
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    // For tracking spending against this budget
    currentPeriodStart: {
      type: Date,
      required: true,
    },
    currentPeriodEnd: {
      type: Date,
      required: true,
    },
    // Alert thresholds
    alertAt: {
      type: Number,
      default: 80, // Alert at 80% of budget
      min: 0,
      max: 100,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
budgetSchema.index({ groupId: 1, category: 1, isActive: 1 });

// Method to calculate current period dates based on period type
budgetSchema.methods.calculatePeriodDates = function (baseDate = new Date()) {
  const start = new Date(baseDate);
  const end = new Date(baseDate);

  switch (this.period) {
    case 'weekly':
      // Start of week (Monday)
      const dayOfWeek = start.getDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      start.setDate(start.getDate() - daysToMonday);
      end.setDate(start.getDate() + 6);
      break;

    case 'monthly':
      start.setDate(1);
      end.setMonth(start.getMonth() + 1);
      end.setDate(0); // Last day of current month
      break;

    case 'quarterly':
      const currentMonth = start.getMonth();
      const quarterStartMonth = Math.floor(currentMonth / 3) * 3;
      start.setMonth(quarterStartMonth);
      start.setDate(1);
      end.setMonth(quarterStartMonth + 3);
      end.setDate(0);
      break;

    case 'yearly':
      start.setMonth(0);
      start.setDate(1);
      end.setFullYear(start.getFullYear() + 1);
      end.setMonth(0);
      end.setDate(0);
      break;
  }

  // Set time to start/end of day
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

// NEW: Enhanced method to update period with repeating logic
budgetSchema.methods.updatePeriodIfNeeded = function () {
  const now = new Date();

  // Check if current period has ended
  if (now > this.currentPeriodEnd) {
    if (this.isRepeating) {
      // Calculate new period dates starting from the day after the current period ended
      const nextPeriodStart = new Date(this.currentPeriodEnd);
      nextPeriodStart.setDate(nextPeriodStart.getDate() + 1);
      nextPeriodStart.setHours(0, 0, 0, 0);

      const { start, end } = this.calculatePeriodDates(nextPeriodStart);

      this.currentPeriodStart = start;
      this.currentPeriodEnd = end;

      return { updated: true, action: 'rolled_over' };
    } else {
      // Non-repeating budget - deactivate it
      this.isActive = false;

      return { updated: true, action: 'deactivated' };
    }
  }

  return { updated: false, action: 'none' };
};

// Pre-save middleware to set period dates
budgetSchema.pre('save', function (next) {
  // Always calculate period dates for new documents or when period/startDate changes
  if (this.isNew || this.isModified('period') || this.isModified('startDate')) {
    try {
      const baseDate = this.startDate || new Date();
      const { start, end } = this.calculatePeriodDates(baseDate);

      this.currentPeriodStart = start;
      this.currentPeriodEnd = end;
    } catch (error) {
      return next(error);
    }
  }

  next();
});

// Alternative: Pre-validate middleware as backup
budgetSchema.pre('validate', function (next) {
  // Ensure period dates are set before validation
  if (!this.currentPeriodStart || !this.currentPeriodEnd) {
    try {
      const baseDate = this.startDate || new Date();
      const { start, end } = this.calculatePeriodDates(baseDate);

      this.currentPeriodStart = start;
      this.currentPeriodEnd = end;
    } catch (error) {
      return next(error);
    }
  }

  next();
});

// Replace your calculateBudgetSpending method with this enhanced debug version:

budgetSchema.methods.calculateBudgetSpending = async function () {
  try {
    const Transaction = require('./Transaction');

    // Get dates for comparison
    const budgetCreationDate = this.createdAt || this.startDate;
    const effectiveStartDate =
      this.currentPeriodStart > budgetCreationDate
        ? this.currentPeriodStart
        : budgetCreationDate;

    // First, find ALL transactions for this category to see what we're working with
    const allTransactions = await Transaction.find({
      groupId: this.groupId,
      category: this.category,
      isSettlement: { $ne: true },
    }).sort({ date: 1 });

    // Now find the transactions that should actually count
    const countedTransactions = await Transaction.find({
      groupId: this.groupId,
      category: this.category,
      date: {
        $gte: effectiveStartDate,
        $lte: this.currentPeriodEnd,
      },
      isSettlement: { $ne: true },
    }).sort({ date: 1 });

    const currentSpending = countedTransactions.reduce(
      (total, tx) => total + tx.amount,
      0
    );
    const remainingAmount = this.amount - currentSpending;
    const percentageUsed =
      this.amount > 0 ? (currentSpending / this.amount) * 100 : 0;
    const shouldAlert = percentageUsed >= this.alertAt;
    const isOverBudget = currentSpending > this.amount;

    return {
      currentSpending,
      remainingAmount,
      percentageUsed,
      shouldAlert,
      isOverBudget,
      transactionCount: countedTransactions.length,
      transactions: countedTransactions || [],
    };
  } catch (error) {
    return {
      currentSpending: 0,
      remainingAmount: this.amount,
      percentageUsed: 0,
      shouldAlert: false,
      isOverBudget: false,
      transactionCount: 0,
      transactions: [],
    };
  }
};

// FIXED: Static method moved outside of instance method
budgetSchema.statics.calculateSpendingForBudgets = async function (budgets) {
  try {
    const Transaction = require('./Transaction');

    // First, check and update periods for all budgets that need it
    const budgetsToUpdate = [];
    const updateResults = [];

    for (const budget of budgets) {
      const result = budget.updatePeriodIfNeeded();
      if (result.updated) {
        budgetsToUpdate.push(budget);
        updateResults.push({
          budgetId: budget._id,
          category: budget.category,
          action: result.action,
          newPeriodStart: budget.currentPeriodStart,
          newPeriodEnd: budget.currentPeriodEnd,
          isRepeating: budget.isRepeating,
        });
      }
    }

    // Save any budgets that had their periods updated
    if (budgetsToUpdate.length > 0) {
      await Promise.all(budgetsToUpdate.map((budget) => budget.save()));
    }

    // Filter out deactivated budgets for spending calculation
    const activeBudgets = budgets.filter((budget) => budget.isActive);

    // Get all unique group IDs and categories for active budgets
    const groupIds = [
      ...new Set(activeBudgets.map((b) => b.groupId.toString())),
    ];
    const categories = [...new Set(activeBudgets.map((b) => b.category))];

    // Find all relevant transactions in one query
    const allTransactions = await Transaction.find({
      groupId: { $in: groupIds },
      category: { $in: categories },
      isSettlement: { $ne: true },
    });

    // Calculate spending for each active budget
    const budgetsWithSpending = activeBudgets.map((budget) => {
      // Calculate effective start date for each budget
      const budgetCreationDate = budget.createdAt || budget.startDate;
      const effectiveStartDate =
        budget.currentPeriodStart > budgetCreationDate
          ? budget.currentPeriodStart
          : budgetCreationDate;

      // Filter transactions for this specific budget's effective period and category
      const budgetTransactions = allTransactions.filter(
        (tx) =>
          tx.groupId.toString() === budget.groupId.toString() &&
          tx.category === budget.category &&
          tx.date >= effectiveStartDate && // ← Use effectiveStartDate
          tx.date <= budget.currentPeriodEnd
      );

      const currentSpending = budgetTransactions.reduce(
        (total, tx) => total + tx.amount,
        0
      );
      const remainingAmount = budget.amount - currentSpending;
      const percentageUsed =
        budget.amount > 0 ? (currentSpending / budget.amount) * 100 : 0;
      const shouldAlert = percentageUsed >= budget.alertAt;
      const isOverBudget = currentSpending > budget.amount;

      return {
        ...budget.toObject(),
        currentSpending,
        remainingAmount,
        percentageUsed,
        shouldAlert,
        isOverBudget,
        transactionCount: budgetTransactions.length,
        wasRolledOver: updateResults.some(
          (r) =>
            r.budgetId.toString() === budget._id.toString() &&
            r.action === 'rolled_over'
        ),
      };
    });

    return {
      budgets: budgetsWithSpending,
      updateResults,
    };
  } catch (error) {
    return {
      budgets: budgets.map((budget) => ({
        ...budget.toObject(),
        currentSpending: 0,
        remainingAmount: budget.amount,
        percentageUsed: 0,
        shouldAlert: false,
        isOverBudget: false,
        transactionCount: 0,
        wasRolledOver: false,
      })),
      updateResults: [],
    };
  }
};

//Method to manually toggle repeating status
budgetSchema.methods.setRepeating = function (isRepeating) {
  this.isRepeating = isRepeating;
};

// Static method to get expired non-repeating budgets (for cleanup)
budgetSchema.statics.getExpiredNonRepeatingBudgets = async function () {
  const now = new Date();
  return await this.find({
    isActive: true,
    isRepeating: false,
    currentPeriodEnd: { $lt: now },
  });
};

module.exports = mongoose.model('Budget', budgetSchema);
