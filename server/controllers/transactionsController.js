// server/controllers/transactionController.js
const Transaction = require('../models/Transaction');
const MemberBalance = require('../models/MemberBalance');
const mongoose = require('mongoose');
const User = require('../models/User');
const Group = require('../models/Group');

class TransactionController {
  // Create new transaction
  async createTransaction(req, res) {
    const userId = req.user.userId;
    const { groupId, amount, description, notes, category, owedToPurchaser } =
      req.body;

    try {
      const group = await Group.findById(groupId);
      if (!group) {
        return res.status(400).json({ error: 'Group not found' });
      }

      if (!group.members.includes(userId)) {
        return res.status(400).json({ error: 'User not in group' });
      }

      if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Valid amount is required' });
      }

      const transaction = new Transaction({
        groupId,
        amount,
        description,
        notes,
        category,
        owedToPurchaser,
        paidBy: userId,
        splitEvenly: !owedToPurchaser,
      });

      await transaction.save();

      const memberIds = group.members.map((id) => id.toString());
      const payerId = userId.toString();

      if (owedToPurchaser) {
        const nonPayers = memberIds.filter((id) => id !== payerId);
        const share = amount / nonPayers.length;

        for (const memberId of nonPayers) {
          await MemberBalance.findOneAndUpdate(
            { groupId, memberId },
            { $inc: { balance: -share } },
            { upsert: true }
          );
        }

        await MemberBalance.findOneAndUpdate(
          { groupId, memberId: payerId },
          { $inc: { balance: amount } },
          { upsert: true }
        );
      } else {
        const share = amount / memberIds.length;

        for (const memberId of memberIds) {
          if (memberId === payerId) {
            await MemberBalance.findOneAndUpdate(
              { groupId, memberId },
              { $inc: { balance: amount - share } },
              { upsert: true }
            );
          } else {
            await MemberBalance.findOneAndUpdate(
              { groupId, memberId },
              { $inc: { balance: -share } },
              { upsert: true }
            );
          }
        }
      }

      res.status(201).json(transaction);
    } catch (err) {
      if (err.name === 'ValidationError') {
        return res.status(400).json({
          error: 'Validation error',
          details: err.message,
        });
      }

      if (err.name === 'CastError') {
        return res.status(400).json({
          error: 'Invalid ID format',
          details: err.message,
        });
      }

      res.status(500).json({
        error: 'Failed to add transaction',
        details: err.message,
      });
    }
  }

  // Get transactions for a group
  async getGroupTransactions(req, res) {
    const { groupId } = req.params;

    try {
      const transactions = await Transaction.find({ groupId })
        .populate('paidBy', 'username')
        .sort({ date: -1 });

      res.json(transactions);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch transactions' });
    }
  }

  // Settle up balances
  async settleUp(req, res) {
    const userId = req.user.userId;
    const { groupId } = req.body;

    if (!groupId) {
      return res.status(400).json({ error: 'Group ID is required.' });
    }

    try {
      const group = await Group.findById(groupId);
      if (!group) {
        return res.status(404).json({ error: 'Group not found' });
      }

      const allGroupMembers = await User.find({
        _id: {
          $in: group.members.map((id) => new mongoose.Types.ObjectId(id)),
        },
      });

      if (allGroupMembers.length !== 2) {
        return res.status(400).json({
          error:
            'This settlement function is currently designed for groups with exactly 2 members.',
        });
      }

      const memberBalances = await MemberBalance.find({ groupId }).populate(
        'memberId',
        'username'
      );

      if (memberBalances.length === 0) {
        return res.status(200).json({
          message: 'No balances found. Nothing to settle.',
        });
      }

      let payerId = null;
      let recipientId = null;
      let settlementAmount = 0;

      const EPSILON = 0.01;

      const allBalancesSettled = memberBalances.every(
        (mb) => Math.abs(mb.balance) < EPSILON
      );
      if (allBalancesSettled) {
        return res
          .status(200)
          .json({ message: 'All balances are already settled.' });
      }

      for (const memberBalance of memberBalances) {
        if (memberBalance.balance < -EPSILON) {
          payerId = memberBalance.memberId._id.toString();
          settlementAmount = Math.abs(memberBalance.balance);
        } else if (memberBalance.balance > EPSILON) {
          recipientId = memberBalance.memberId._id.toString();
        }
      }

      if (!payerId || !recipientId || settlementAmount <= EPSILON) {
        return res.status(200).json({
          message: 'No significant debt to settle.',
        });
      }

      const payer = allGroupMembers.find((u) => u._id.toString() === payerId);
      const recipient = allGroupMembers.find(
        (u) => u._id.toString() === recipientId
      );

      if (!payer || !recipient) {
        return res.status(500).json({
          error: 'Could not identify payer or recipient for settlement.',
        });
      }

      const settlementTransaction = new Transaction({
        groupId: new mongoose.Types.ObjectId(groupId),
        amount: settlementAmount,
        description: `Settlement: ${payer.username} paid ${recipient.username}`,
        isSettlement: true,
        paidBy: new mongoose.Types.ObjectId(payerId),
        owedToPurchaser: true,
        splitEvenly: false,
        customSplit: [],
        category: 'Settlement',
        notes: `Automatic settlement payment from ${payer.username} to ${recipient.username} to balance accounts.`,
        date: new Date(),
      });

      await settlementTransaction.save();

      await MemberBalance.updateMany({ groupId }, { $set: { balance: 0 } });

      res.status(201).json({
        message: 'Balances settled successfully!',
        settlement: settlementTransaction,
        balancesZeroed: true,
      });
    } catch (err) {
      res.status(500).json({
        error: 'Failed to settle balances.',
        details: err.message,
      });
    }
  }
}

module.exports = new TransactionController();
