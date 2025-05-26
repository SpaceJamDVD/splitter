// server/controllers/memberBalanceController.js
const MemberBalance = require('../models/MemberBalance');

class MemberBalanceController {
  // Get balances for a group
  async getGroupBalances(req, res) {
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
  }

  // Update member balance
  async updateBalance(req, res) {
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
  }
}

module.exports = new MemberBalanceController();
