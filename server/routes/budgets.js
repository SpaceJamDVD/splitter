// server/routes/budgets.js
const express = require('express');
const router = express.Router();
const budgetController = require('../controllers/budgetController');

// All routes are protected (requireAuth middleware applied in index.js)

// Create a new budget
router.post('/', budgetController.createBudget);

// Get all budgets for a group
router.get('/group/:groupId', budgetController.getGroupBudgets);

// Get budget overview/summary for a group
router.get('/group/:groupId/overview', budgetController.getBudgetOverview);

// Get available categories for a group
router.get('/group/:groupId/categories', budgetController.getCategories);

// Update a budget
router.put('/:id', budgetController.updateBudget);

// Delete a budget
router.delete('/:id', budgetController.deleteBudget);

// Toggle repeating status
router.patch('/:id/repeating', budgetController.toggleRepeating);

// Manual rollover (admin only)
router.post('/rollover', budgetController.manualRollover);

module.exports = router;
