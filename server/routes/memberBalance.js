const express = require('express');
const router = express.Router();
const MemberBalance = require('../models/MemberBalance');

router.get('/:groupId', async (req, res) => {
  try {
    const { groupId } = req.params;

    const balances = await MemberBalance.find({ groupId }).populate(
      'memberId',
      'username'
    );

    res.status(200).json(balances);
  } catch (err) {
    console.error('Failed to get balances:', err);
    res.status(500).json({ error: 'Failed to fetch member balances' });
  }
});

router.patch('/update', async (req, res) => {
  const { groupId, memberId, amount } = req.body;

  try {
    const balance = await MemberBalance.findOneAndUpdate(
      { groupId, memberId },
      { $inc: { balance: amount } },
      { new: true, upsert: true }
    );

    res.status(200).json(balance);
  } catch (err) {
    console.error('Failed to update balance:', err);
    res.status(500).json({ error: 'Failed to update member balance' });
  }
});

module.exports = router;
