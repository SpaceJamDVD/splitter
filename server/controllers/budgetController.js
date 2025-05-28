// server/controllers/budgetController.js
const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');
const Group = require('../models/Group');

class BudgetController {
  async createBudget(req, res) {
    const userId = req.user.userId;
    const {
      groupId,
      category,
      amount,
      period,
      isCustomCategory,
      alertAt,
      isRepeating,
    } = req.body;

    try {
      const group = await Group.findById(groupId);
      if (!group) {
        return res.status(404).json({ error: 'Group not found' });
      }

      if (!group.members.includes(userId)) {
        return res.status(403).json({ error: 'Not authorized for this group' });
      }

      const existingBudget = await Budget.findOne({
        groupId,
        category,
        isActive: true,
      });

      if (existingBudget) {
        return res.status(400).json({
          error:
            'Budget already exists for this category. Update the existing budget instead.',
        });
      }

      const budgetData = {
        groupId,
        category,
        amount,
        period: period || 'monthly',
        isCustomCategory: isCustomCategory || false,
        createdBy: userId,
        alertAt: alertAt || 80,
        isRepeating: isRepeating !== undefined ? isRepeating : true,
        startDate: new Date(),
      };

      const budget = new Budget(budgetData);

      if (!budget.currentPeriodStart || !budget.currentPeriodEnd) {
        const { start, end } = budget.calculatePeriodDates(budget.startDate);
        budget.currentPeriodStart = start;
        budget.currentPeriodEnd = end;
      }
      await budget.save();
      await budget.populate('createdBy', 'username email');

      res.status(201).json(budget);
    } catch (err) {
      console.error('Error creating budget:', err);
      res.status(500).json({
        error: 'Failed to create budget',
        details: err.message,
      });
    }
  }

  async getGroupBudgets(req, res) {
    const { groupId } = req.params;
    const userId = req.user.userId;

    try {
      const group = await Group.findById(groupId);
      if (!group) {
        return res.status(404).json({ error: 'Group not found' });
      }

      if (!group.members.includes(userId)) {
        return res.status(403).json({ error: 'Not authorized for this group' });
      }

      const budgets = await Budget.find({
        groupId,
        isActive: true,
      })
        .populate('createdBy', 'username email')
        .sort({ createdAt: -1 });

      const result = await Budget.calculateSpendingForBudgets(budgets);

      res.json(result.budgets || result);
    } catch (err) {
      console.error('Error fetching budgets:', err);
      res.status(500).json({
        error: 'Failed to fetch budgets',
        details: err.message,
      });
    }
  }

  async getBudgetOverview(req, res) {
    const { groupId } = req.params;
    const userId = req.user.userId;

    try {
      const group = await Group.findById(groupId);
      if (!group) {
        return res.status(404).json({ error: 'Group not found' });
      }

      if (!group.members.includes(userId)) {
        return res.status(403).json({ error: 'Not authorized for this group' });
      }

      const budgets = await Budget.find({
        groupId,
        isActive: true,
      });

      if (budgets.length === 0) {
        return res.json({
          totalBudgeted: 0,
          totalSpent: 0,
          totalRemaining: 0,
          alertCount: 0,
          budgetCount: 0,
        });
      }

      const result = await Budget.calculateSpendingForBudgets(budgets);
      const budgetsWithSpending = result.budgets || result;

      const overview = budgetsWithSpending.reduce(
        (acc, budget) => {
          acc.totalBudgeted += budget.amount;
          acc.totalSpent += budget.currentSpending;
          acc.totalRemaining += budget.remainingAmount;

          if (budget.shouldAlert || budget.isOverBudget) {
            acc.alertCount++;
          }

          return acc;
        },
        {
          totalBudgeted: 0,
          totalSpent: 0,
          totalRemaining: 0,
          alertCount: 0,
          budgetCount: budgetsWithSpending.length,
        }
      );

      res.json(overview);
    } catch (err) {
      console.error('Error fetching budget overview:', err);
      res.status(500).json({
        error: 'Failed to fetch budget overview',
        details: err.message,
      });
    }
  }

  async getBudgetById(req, res) {
    const { budgetId } = req.params;
    const userId = req.user.userId;

    try {
      const budget = await Budget.findById(budgetId)
        .populate('createdBy', 'username email')
        .populate('groupId', 'name members');

      if (!budget) {
        return res.status(404).json({ error: 'Budget not found' });
      }

      if (!budget.groupId.members.includes(userId)) {
        return res
          .status(403)
          .json({ error: 'Not authorized for this budget' });
      }

      const updateResult = budget.updatePeriodIfNeeded();
      if (updateResult.updated) {
        await budget.save();
      }

      const spending = await budget.calculateBudgetSpending();

      const budgetWithSpending = {
        ...budget.toObject(),
        ...spending,
      };

      res.json(budgetWithSpending);
    } catch (err) {
      console.error('Error fetching budget:', err);
      res.status(500).json({
        error: 'Failed to fetch budget',
        details: err.message,
      });
    }
  }

  async updateBudget(req, res) {
    const { id } = req.params;
    const userId = req.user.userId;
    const { amount, period, alertAt, isActive, isRepeating } = req.body;

    try {
      const budget = await Budget.findById(id).populate(
        'createdBy',
        'username email'
      );
      if (!budget) {
        return res.status(404).json({ error: 'Budget not found' });
      }

      const group = await Group.findById(budget.groupId);
      if (!group.members.includes(userId)) {
        return res.status(403).json({ error: 'Not authorized for this group' });
      }

      if (amount !== undefined) budget.amount = amount;
      if (period !== undefined) budget.period = period;
      if (alertAt !== undefined) budget.alertAt = alertAt;
      if (isActive !== undefined) budget.isActive = isActive;
      if (isRepeating !== undefined) budget.isRepeating = isRepeating;

      await budget.save();

      res.json(budget);
    } catch (err) {
      console.error('Error updating budget:', err);
      res.status(500).json({
        error: 'Failed to update budget',
        details: err.message,
      });
    }
  }

  async deleteBudget(req, res) {
    const { id } = req.params;
    const userId = req.user.userId;

    try {
      const budget = await Budget.findById(id).populate(
        'createdBy',
        'username email'
      );
      if (!budget) {
        return res.status(404).json({ error: 'Budget not found' });
      }

      const group = await Group.findById(budget.groupId);
      if (!group.members.includes(userId)) {
        return res.status(403).json({ error: 'Not authorized for this group' });
      }

      await Budget.findByIdAndDelete(id);

      res.json({ message: 'Budget deleted successfully' });
    } catch (err) {
      console.error('Error deleting budget:', err);
      res.status(500).json({
        error: 'Failed to delete budget',
        details: err.message,
      });
    }
  }

  async toggleRepeating(req, res) {
    const { id } = req.params;
    const userId = req.user.userId;
    const { isRepeating } = req.body;

    try {
      const budget = await Budget.findById(id).populate(
        'createdBy',
        'username email'
      );
      if (!budget) {
        return res.status(404).json({ error: 'Budget not found' });
      }

      const group = await Group.findById(budget.groupId);
      if (!group.members.includes(userId)) {
        return res.status(403).json({ error: 'Not authorized for this group' });
      }

      budget.setRepeating(isRepeating);
      await budget.save();

      res.json({
        message: `Budget repeating status updated to: ${
          isRepeating ? 'enabled' : 'disabled'
        }`,
        budget: budget,
      });
    } catch (err) {
      console.error('Error toggling budget repeating:', err);
      res.status(500).json({
        error: 'Failed to toggle budget repeating',
        details: err.message,
      });
    }
  }

  async manualRollover(req, res) {
    const userId = req.user.userId;

    try {
      const updatedCount =
        await require('../services/budgetResetService').resetExpiredBudgets();

      res.json({
        message: `Manually updated ${updatedCount} budget periods`,
        updatedCount,
      });
    } catch (err) {
      console.error('Error in manual rollover:', err);
      res.status(500).json({
        error: 'Failed to perform manual rollover',
        details: err.message,
      });
    }
  }

  async getCategories(req, res) {
    const { groupId } = req.params;
    const userId = req.user.userId;

    try {
      const group = await Group.findById(groupId);
      if (!group) {
        return res.status(404).json({ error: 'Group not found' });
      }

      if (!group.members.includes(userId)) {
        return res.status(403).json({ error: 'Not authorized for this group' });
      }

      const predefinedCategories = [
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
      ];

      const customBudgets = await Budget.find({
        groupId,
        isCustomCategory: true,
        isActive: true,
      }).distinct('category');

      res.json({
        predefined: predefinedCategories,
        custom: customBudgets,
        all: [...predefinedCategories, ...customBudgets],
      });
    } catch (err) {
      console.error('Error fetching categories:', err);
      res.status(500).json({
        error: 'Failed to fetch categories',
        details: err.message,
      });
    }
  }
}

module.exports = new BudgetController();
