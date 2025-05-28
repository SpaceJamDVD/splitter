// server/controllers/budgetController.js
const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');
const Group = require('../models/Group');

class BudgetController {
  // Create a new budget
  async createBudget(req, res) {
    const userId = req.user.userId;
    const { groupId, category, amount, period, isCustomCategory, alertAt } =
      req.body;

    try {
      // Verify user is in the group
      const group = await Group.findById(groupId);
      if (!group) {
        return res.status(404).json({ error: 'Group not found' });
      }

      if (!group.members.includes(userId)) {
        return res.status(403).json({ error: 'Not authorized for this group' });
      }

      // Check if budget already exists for this category and group
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

      // Create budget with explicit date calculation as fallback
      const budgetData = {
        groupId,
        category,
        amount,
        period: period || 'monthly',
        isCustomCategory: isCustomCategory || false,
        createdBy: userId,
        alertAt: alertAt || 80,
        startDate: new Date(), // Explicitly set startDate
      };

      console.log('Creating budget with data:', budgetData);

      const budget = new Budget(budgetData);

      // Manual fallback if middleware doesn't work (shouldn't be needed with fixed middleware)
      if (!budget.currentPeriodStart || !budget.currentPeriodEnd) {
        console.log('Middleware failed, manually calculating period dates...');
        const { start, end } = budget.calculatePeriodDates(budget.startDate);
        budget.currentPeriodStart = start;
        budget.currentPeriodEnd = end;
        console.log('Manually set period dates:', { start, end });
      }

      console.log('Budget before save:', {
        period: budget.period,
        startDate: budget.startDate,
        currentPeriodStart: budget.currentPeriodStart,
        currentPeriodEnd: budget.currentPeriodEnd,
      });

      await budget.save();
      await budget.populate('createdBy', 'username email');

      console.log('Budget saved successfully:', budget._id);

      // ========== SOCKET.IO IMPLEMENTATION ==========
      const io = req.app.get('io');
      if (io) {
        io.to(`group-${groupId}`).emit('budget-created', {
          budget,
          groupId,
          timestamp: new Date().toISOString(),
        });

        io.to(`group-${groupId}`).emit('notification', {
          id: Date.now(),
          type: 'budget',
          message: `${budget.createdBy.username} created a ${budget.period} budget for ${category}: $${amount}`,
          groupId,
          timestamp: new Date().toISOString(),
        });
      }

      res.status(201).json(budget);
    } catch (err) {
      console.error('Error creating budget:', err);
      console.error('Error details:', err.message);
      console.error('Validation errors:', err.errors);

      res.status(500).json({
        error: 'Failed to create budget',
        details: err.message,
      });
    }
  }

  // Get group budgets
  async getGroupBudgets(req, res) {
    const { groupId } = req.params;
    const userId = req.user.userId;

    try {
      // Verify user is in the group
      const group = await Group.findById(groupId);
      if (!group) {
        return res.status(404).json({ error: 'Group not found' });
      }

      if (!group.members.includes(userId)) {
        return res.status(403).json({ error: 'Not authorized for this group' });
      }

      // Get all active budgets for the group
      const budgets = await Budget.find({
        groupId,
        isActive: true,
      })
        .populate('createdBy', 'username email')
        .sort({ createdAt: -1 });

      // Calculate spending for all budgets efficiently
      const budgetsWithSpending = await Budget.calculateSpendingForBudgets(
        budgets
      );

      res.json(budgetsWithSpending);
    } catch (err) {
      console.error('Error fetching budgets:', err);
      res.status(500).json({
        error: 'Failed to fetch budgets',
        details: err.message,
      });
    }
  }

  // Get budget overview
  async getBudgetOverview(req, res) {
    const { groupId } = req.params;
    const userId = req.user.userId;

    try {
      // Verify user is in the group
      const group = await Group.findById(groupId);
      if (!group) {
        return res.status(404).json({ error: 'Group not found' });
      }

      if (!group.members.includes(userId)) {
        return res.status(403).json({ error: 'Not authorized for this group' });
      }

      // Get all active budgets for the group
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

      // Calculate spending for all budgets
      const budgetsWithSpending = await Budget.calculateSpendingForBudgets(
        budgets
      );

      // Calculate overview statistics
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
          budgetCount: budgets.length,
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

  // Get individual budget by ID
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

      // Check if user has access to this budget's group
      if (!budget.groupId.members.includes(userId)) {
        return res
          .status(403)
          .json({ error: 'Not authorized for this budget' });
      }

      // Calculate spending for this budget
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

  // Update a budget
  async updateBudget(req, res) {
    const { id } = req.params;
    const userId = req.user.userId;
    const { amount, period, alertAt, isActive } = req.body;

    try {
      const budget = await Budget.findById(id).populate(
        'createdBy',
        'username email'
      );
      if (!budget) {
        return res.status(404).json({ error: 'Budget not found' });
      }

      // Verify user is in the group
      const group = await Group.findById(budget.groupId);
      if (!group.members.includes(userId)) {
        return res.status(403).json({ error: 'Not authorized for this group' });
      }

      // Update budget fields
      if (amount !== undefined) budget.amount = amount;
      if (period !== undefined) budget.period = period;
      if (alertAt !== undefined) budget.alertAt = alertAt;
      if (isActive !== undefined) budget.isActive = isActive;

      await budget.save();

      // ========== SOCKET.IO IMPLEMENTATION ==========
      const io = req.app.get('io');
      if (io) {
        io.to(`group-${budget.groupId}`).emit('budget-updated', {
          budget,
          groupId: budget.groupId,
          timestamp: new Date().toISOString(),
        });
      }

      res.json(budget);
    } catch (err) {
      console.error('Error updating budget:', err);
      res.status(500).json({
        error: 'Failed to update budget',
        details: err.message,
      });
    }
  }

  // Delete a budget
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

      // Verify user is in the group
      const group = await Group.findById(budget.groupId);
      if (!group.members.includes(userId)) {
        return res.status(403).json({ error: 'Not authorized for this group' });
      }

      await Budget.findByIdAndDelete(id);

      // ========== SOCKET.IO IMPLEMENTATION ==========
      const io = req.app.get('io');
      if (io) {
        io.to(`group-${budget.groupId}`).emit('budget-deleted', {
          budgetId: id,
          category: budget.category,
          groupId: budget.groupId,
          timestamp: new Date().toISOString(),
        });
      }

      res.json({ message: 'Budget deleted successfully' });
    } catch (err) {
      console.error('Error deleting budget:', err);
      res.status(500).json({
        error: 'Failed to delete budget',
        details: err.message,
      });
    }
  }

  // Get available categories (predefined + custom)
  async getCategories(req, res) {
    const { groupId } = req.params;
    const userId = req.user.userId;

    try {
      // Verify user is in the group
      const group = await Group.findById(groupId);
      if (!group) {
        return res.status(404).json({ error: 'Group not found' });
      }

      if (!group.members.includes(userId)) {
        return res.status(403).json({ error: 'Not authorized for this group' });
      }

      // Predefined categories from Transaction schema
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

      // Get custom categories from existing budgets
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
