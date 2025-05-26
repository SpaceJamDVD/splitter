// server/routes/memberBalance.js
const express = require('express');
const router = express.Router();
const memberBalanceController = require('../controllers/memberBalanceController');

// All routes are protected (requireAuth middleware applied in index.js)
router.get('/:groupId', memberBalanceController.getGroupBalances);
router.patch('/update', memberBalanceController.updateBalance);

module.exports = router;
