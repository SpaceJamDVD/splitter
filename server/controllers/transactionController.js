// server/controllers/transactionController.js
const Transaction = require('../models/Transaction');
const MemberBalance = require('../models/MemberBalance');
const mongoose = require('mongoose');
const User = require('../models/User');
const Group = require('../models/Group');
const Budget = require('../models/Budget');

class TransactionController {
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

      // ========== SOCKET.IO IMPLEMENTATION ==========

      // Populate the transaction with user details for the socket event
      const populatedTransaction = await Transaction.findById(
        transaction._id
      ).populate('paidBy', 'username email');

      // Get the io instance from the app
      const io = req.app.get('io');

      // ========== BUDGET ALERT CHECK ==========
      if (category && io) {
        const budgetController = require('./budgetController');
        await budgetController.checkBudgetImpactForTransaction(
          groupId,
          category,
          amount,
          populatedTransaction,
          io
        );
      }

      if (io) {
        console.log(`Emitting transaction-update to group-${groupId}`);

        // Emit transaction creation event to all users in the group room
        io.to(`group-${groupId}`).emit('transaction-update', {
          type: 'created',
          transaction: populatedTransaction,
          groupId: groupId,
          timestamp: new Date().toISOString(),
        });

        // Get updated balances and emit balance update
        try {
          const updatedBalances = await MemberBalance.find({
            groupId,
          }).populate('memberId', 'username email');

          io.to(`group-${groupId}`).emit('balance-update', {
            groupId: groupId,
            balances: updatedBalances,
            timestamp: new Date().toISOString(),
          });

          console.log(`Emitted balance-update to group-${groupId}`);
        } catch (balanceError) {
          console.error('Failed to emit balance update:', balanceError);
        }
      } else {
        console.warn('Socket.IO instance not found on app');
      }

      // ===============================================

      res.status(201).json(populatedTransaction);
    } catch (err) {
      console.error('Error creating transaction:', err);

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

  async getGroupTransactions(req, res) {
    const { groupId } = req.params;
    const userId = req.user.userId;

    try {
      // Verify user is in the group
      const group = await Group.findById(groupId);
      if (!group) {
        return res.status(404).json({ error: 'Group not found' });
      }

      if (!group.members.includes(userId)) {
        return res
          .status(403)
          .json({ error: 'Not authorized to view this group' });
      }

      // Get all transactions for the group, sorted by date (newest first)
      const transactions = await Transaction.find({ groupId })
        .populate('paidBy', 'username email')
        .sort({ date: -1 });

      res.json(transactions);
    } catch (err) {
      console.error('Error fetching group transactions:', err);
      res.status(500).json({
        error: 'Failed to fetch transactions',
        details: err.message,
      });
    }
  }

  async updateTransaction(req, res) {
    const { id } = req.params;
    const userId = req.user.userId;
    const { amount, description, notes, category } = req.body;

    try {
      const transaction = await Transaction.findById(id);
      if (!transaction) {
        return res.status(404).json({ error: 'Transaction not found' });
      }

      // Check if user has permission to update
      if (transaction.paidBy.toString() !== userId) {
        return res
          .status(403)
          .json({ error: 'Not authorized to update this transaction' });
      }

      // Update the transaction
      const updatedTransaction = await Transaction.findByIdAndUpdate(
        id,
        { amount, description, notes, category },
        { new: true }
      ).populate('paidBy', 'username email');

      // ========== SOCKET.IO IMPLEMENTATION ==========

      const io = req.app.get('io');
      if (io) {
        console.log(
          `Emitting transaction-update (updated) to group-${transaction.groupId}`
        );

        io.to(`group-${transaction.groupId}`).emit('transaction-update', {
          type: 'updated',
          transaction: updatedTransaction,
          groupId: transaction.groupId,
          timestamp: new Date().toISOString(),
        });

        // Emit notification
        io.to(`group-${transaction.groupId}`).emit('notification', {
          id: Date.now(),
          type: 'transaction',
          message: `${updatedTransaction.paidBy.username} updated an expense: ${
            description || 'Transaction'
          }`,
          groupId: transaction.groupId,
          timestamp: new Date().toISOString(),
        });
      }

      // ===============================================

      res.json(updatedTransaction);
    } catch (err) {
      console.error('Error updating transaction:', err);
      res.status(500).json({
        error: 'Failed to update transaction',
        details: err.message,
      });
    }
  }

  async deleteTransaction(req, res) {
    const { id } = req.params;
    const userId = req.user.userId;

    try {
      const transaction = await Transaction.findById(id).populate(
        'paidBy',
        'username email'
      );
      if (!transaction) {
        return res.status(404).json({ error: 'Transaction not found' });
      }

      // Check if user has permission to delete
      if (transaction.paidBy._id.toString() !== userId) {
        return res
          .status(403)
          .json({ error: 'Not authorized to delete this transaction' });
      }

      const groupId = transaction.groupId;

      // Delete the transaction
      await Transaction.findByIdAndDelete(id);

      // Recalculate balances for the group (you might want to implement this)
      // await this.recalculateGroupBalances(groupId);

      // ========== SOCKET.IO IMPLEMENTATION ==========

      const io = req.app.get('io');
      if (io) {
        console.log(
          `Emitting transaction-update (deleted) to group-${groupId}`
        );

        io.to(`group-${groupId}`).emit('transaction-update', {
          type: 'deleted',
          transactionId: id,
          groupId: groupId,
          timestamp: new Date().toISOString(),
        });

        // Get updated balances after deletion
        try {
          const updatedBalances = await MemberBalance.find({
            groupId,
          }).populate('memberId', 'username email');

          io.to(`group-${groupId}`).emit('balance-update', {
            groupId: groupId,
            balances: updatedBalances,
            timestamp: new Date().toISOString(),
          });
        } catch (balanceError) {
          console.error(
            'Failed to emit balance update after deletion:',
            balanceError
          );
        }

        // Emit notification
        io.to(`group-${groupId}`).emit('notification', {
          id: Date.now(),
          type: 'transaction',
          message: `${transaction.paidBy.username} deleted an expense: ${
            transaction.description || 'Transaction'
          }`,
          groupId: groupId,
          timestamp: new Date().toISOString(),
        });
      }

      // ===============================================

      res.json({ message: 'Transaction deleted successfully' });
    } catch (err) {
      console.error('Error deleting transaction:', err);
      res.status(500).json({
        error: 'Failed to delete transaction',
        details: err.message,
      });
    }
  }

  async settleUp(req, res) {
    const { groupId } = req.params;
    const userId = req.user.userId;

    try {
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
          notes: `${payer.username} paid ${recipient.username} back.`,
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

      // Reset all balances to 0
      await MemberBalance.updateMany({ groupId }, { $set: { balance: 0 } });

      // ========== SOCKET.IO IMPLEMENTATION ==========

      const io = req.app.get('io');
      if (io) {
        // Get the user who settled up
        const user = await User.findById(userId).select('username email');

        console.log(`Emitting group-settled to group-${groupId}`);

        // Emit settlement event
        io.to(`group-${groupId}`).emit('group-settled', {
          groupId: groupId,
          settledBy: {
            userId: userId,
            username: user.username,
          },
          timestamp: new Date().toISOString(),
        });

        // Get updated (zero) balances
        const updatedBalances = await MemberBalance.find({ groupId }).populate(
          'memberId',
          'username email'
        );

        io.to(`group-${groupId}`).emit('balance-update', {
          groupId: groupId,
          balances: updatedBalances,
          timestamp: new Date().toISOString(),
        });

        // Emit notification
        io.to(`group-${groupId}`).emit('notification', {
          id: Date.now(),
          type: 'settlement',
          message: `${user.username} settled up the group expenses`,
          groupId: groupId,
          timestamp: new Date().toISOString(),
        });
      }

      // ===============================================

      res.json({ message: 'Group expenses settled successfully' });
    } catch (err) {
      console.error('Error settling up:', err);
      res.status(500).json({
        error: 'Failed to settle up',
        details: err.message,
      });
    }
  }

  // Helper method to recalculate balances
  async recalculateGroupBalances(groupId) {
    try {
      // Reset all balances
      await MemberBalance.updateMany({ groupId }, { $set: { balance: 0 } });

      // Get all transactions for the group
      const transactions = await Transaction.find({ groupId });
      const group = await Group.findById(groupId);

      // Recalculate based on all transactions
      for (const transaction of transactions) {
        const memberIds = group.members.map((id) => id.toString());
        const payerId = transaction.paidBy.toString();
        const amount = transaction.amount;

        if (transaction.owedToPurchaser) {
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
      }
    } catch (err) {
      console.error('Error recalculating balances:', err);
      throw err;
    }
  }

  async getRecentTotal(req, res) {
    const { groupId } = req.params;
    const userId = req.user.userId;

    try {
      // Verify user is in the group
      const group = await Group.findById(groupId);
      if (!group) {
        return res.status(404).json({ error: 'Group not found' });
      }

      if (!group.members.includes(userId)) {
        return res
          .status(403)
          .json({ error: 'Not authorized to view this group' });
      }

      // Get all transactions for the group, sorted by date (newest first)
      const allTransactions = await Transaction.find({ groupId })
        .sort({ date: -1 })
        .populate('paidBy', 'username email');

      if (allTransactions.length === 0) {
        return res.status(404).json({ error: 'No transactions found' });
      }

      let totalSum = 0;
      const transactionsToSum = [];

      // Sum transactions until we hit a settlement
      for (const transaction of allTransactions) {
        if (transaction.isSettlement) {
          // Stop when we hit a settlement, don't include it in the sum
          break;
        }

        totalSum += transaction.amount;
        transactionsToSum.push(transaction);
      }

      res.json({
        totalAmount: totalSum,
        transactionCount: transactionsToSum.length,
      });
    } catch (err) {
      console.error('Error fetching recent total:', err);
      res.status(500).json({
        error: 'Failed to fetch recent total',
        details: err.message,
      });
    }
  }
}

module.exports = new TransactionController();
