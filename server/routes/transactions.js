// server/routes/transactions.js
const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');

// All routes are protected (requireAuth middleware applied in index.js)
router.post('/', transactionController.createTransaction);
router.get('/group/:groupId', transactionController.getGroupTransactions);
router.post('/settle', transactionController.settleUp);
router.get('/recent-total/:groupId', transactionController.getRecentTotal);
router.delete('/:transactionId', transactionController.deleteTransaction);

module.exports = router;
