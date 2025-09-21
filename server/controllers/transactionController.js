// server/controllers/transactionController.js
const Transaction = require('../models/Transaction');
const MemberBalance = require('../models/MemberBalance');
const mongoose = require('mongoose');
const User = require('../models/User');
const Group = require('../models/Group');
const Budget = require('../models/Budget');

class TransactionController {
  static async recalculateGroupBalances(groupId) {
    // Reset all balances
    await MemberBalance.updateMany({ groupId }, { $set: { balance: 0 } });

    // Get all transactions + group
    const [transactions, group] = await Promise.all([
      Transaction.find({ groupId }),
      Group.findById(groupId),
    ]);

    if (!group) return; // no-op if group deleted

    const memberIds = group.members.map((id) => id.toString());

    for (const tx of transactions) {
      const payerId = tx.paidBy.toString();
      const amount = tx.amount;

      if (tx.owedToPurchaser) {
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
          const inc = memberId === payerId ? amount - share : -share;
          await MemberBalance.findOneAndUpdate(
            { groupId, memberId },
            { $inc: { balance: inc } },
            { upsert: true }
          );
        }
      }
    }
  }

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
        } catch (balanceError) {
          console.error('Failed to emit balance update:', balanceError);
        }
      }

      // ===============================================

      res.status(201).json(populatedTransaction);
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
      res.status(500).json({
        error: 'Failed to update transaction',
        details: err.message,
      });
    }
  }

  async deleteTransaction(req, res) {
    const { transactionId } = req.params;
    const userId = req.user.userId;

    try {
      // Load the transaction (with payer info for notification text)
      const transaction = await Transaction.findById(transactionId).populate(
        'paidBy',
        'username email'
      );

      if (!transaction) {
        return res.status(404).json({ error: 'Transaction not found' });
      }

      // Permission check: only the payer can delete (same policy as update)
      if (transaction.paidBy._id.toString() !== userId) {
        return res
          .status(403)
          .json({ error: 'Not authorized to delete this transaction' });
      }

      // Prevent deletion of settlements (to avoid breaking the settlement boundary)
      if (transaction.isSettlement || transaction.hasBeenSettled) {
        return res.status(400).json({
          error:
            'This transaction cannot be deleted because it is a settlement or has already been settled.',
        });
      }

      const groupId = transaction.groupId.toString();

      // --- Mirror createTransaction balance effects (apply the inverse) ---
      const group = await Group.findById(groupId);
      if (!group) {
        // If the group is gone, delete the tx and return (no balances to fix)
        await Transaction.findByIdAndDelete(transactionId);
        return res.json({ message: 'Transaction deleted (group missing).' });
      }

      const memberIds = group.members.map((id) => id.toString());
      const payerId = transaction.paidBy._id.toString();
      const amount = transaction.amount;
      const owedToPurchaser = !!transaction.owedToPurchaser;

      if (owedToPurchaser) {
        // In createTransaction we did:
        //  - nonPayers: $inc { balance: -share }
        //  - payer:     $inc { balance:  amount }
        // To undo, we do the exact inverse:
        const nonPayers = memberIds.filter((id) => id !== payerId);
        const share = amount / (nonPayers.length || 1); // guard divide-by-zero

        for (const memberId of nonPayers) {
          await MemberBalance.findOneAndUpdate(
            { groupId, memberId },
            { $inc: { balance: +share } }, // inverse of -share
            { upsert: true }
          );
        }
        await MemberBalance.findOneAndUpdate(
          { groupId, memberId: payerId },
          { $inc: { balance: -amount } }, // inverse of +amount
          { upsert: true }
        );
      } else {
        // In createTransaction we did even split:
        //  - payer:  $inc { balance: amount - share }
        //  - others: $inc { balance: -share }
        // Undo that:
        const share = amount / (memberIds.length || 1);

        for (const memberId of memberIds) {
          if (memberId === payerId) {
            await MemberBalance.findOneAndUpdate(
              { groupId, memberId },
              { $inc: { balance: -(amount - share) } }, // inverse
              { upsert: true }
            );
          } else {
            await MemberBalance.findOneAndUpdate(
              { groupId, memberId },
              { $inc: { balance: +share } }, // inverse
              { upsert: true }
            );
          }
        }
      }

      // Now actually delete the transaction record
      await Transaction.findByIdAndDelete(transactionId);

      try {
        const io = req.app.get('io');

        if (transaction.category && io) {
          const budgetController = require('./budgetController');

          if (
            typeof budgetController.checkBudgetImpactForDeletion === 'function'
          ) {
            await budgetController.checkBudgetImpactForDeletion(
              groupId,
              transaction.category,
              transaction.amount,
              transaction, // the deleted tx
              io
            );
          } else if (
            typeof budgetController.checkBudgetImpactForTransaction ===
            'function'
          ) {
            // Pass a negative amount to "undo" the spend from the category
            await budgetController.checkBudgetImpactForTransaction(
              groupId,
              transaction.category,
              -Math.abs(transaction.amount),
              transaction,
              io
            );
          }
        }
      } catch (budgetErr) {
        console.error('Budget hook on delete failed:', budgetErr);
        // non-fatal
      }

      // --- Socket.io mirror of createTransaction ---
      const io = req.app.get('io');
      if (io) {
        try {
          // 1) Transaction change event
          io.to(`group-${groupId}`).emit('transaction-update', {
            type: 'deleted',
            transactionId,
            groupId,
            timestamp: new Date().toISOString(),
          });

          // 2) Emit updated balances (after our inverse updates)
          const updatedBalances = await MemberBalance.find({
            groupId,
          }).populate('memberId', 'username email');

          io.to(`group-${groupId}`).emit('balance-update', {
            groupId,
            balances: updatedBalances,
            timestamp: new Date().toISOString(),
          });

          // 3) Notification (same style as create/update)
          io.to(`group-${groupId}`).emit('notification', {
            id: Date.now(),
            type: 'transaction',
            message: `${transaction.paidBy.username} deleted an expense: ${
              transaction.description || 'Transaction'
            }`,
            groupId,
            timestamp: new Date().toISOString(),
          });
        } catch (socketErr) {
          console.error('Socket emit failed after deletion:', socketErr);
        }
      }

      return res.json({ message: 'Transaction deleted successfully' });
    } catch (err) {
      console.error('deleteTransaction failed:', err);
      return res.status(500).json({
        error: 'Failed to delete transaction',
        details: err.message,
      });
    }
  }

  async settleUp(req, res) {
    // read from body; your client posts { groupId }
    const { groupId } = req.body;
    const userId = req.user.userId;

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
        return res
          .status(200)
          .json({ message: 'No balances found. Nothing to settle.' });
      }

      const EPSILON = 0.01;
      const allSettled = memberBalances.every(
        (mb) => Math.abs(mb.balance) < EPSILON
      );
      if (allSettled) {
        return res
          .status(200)
          .json({ message: 'All balances are already settled.' });
      }

      // determine payer/recipient
      let payerId = null;
      let recipientId = null;
      let settlementAmount = 0;

      for (const mb of memberBalances) {
        if (mb.balance < -EPSILON) {
          payerId = mb.memberId._id.toString();
          settlementAmount = Math.abs(mb.balance);
        } else if (mb.balance > EPSILON) {
          recipientId = mb.memberId._id.toString();
        }
      }

      if (!payerId || !recipientId || settlementAmount <= EPSILON) {
        return res
          .status(200)
          .json({ message: 'No significant debt to settle.' });
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

      // find all transactions in this group, newest first
      const allTx = await Transaction.find({ groupId }).sort({ date: -1 });

      // walk from newest → oldest until we hit a settlement
      for (const tx of allTx) {
        if (tx.isSettlement) {
          break; // stop at the last settlement boundary
        }
        // mark this transaction as settled
        if (!tx.hasBeenSettled) {
          tx.hasBeenSettled = true;
          await tx.save();
        }
      }

      // create settlement transaction
      const settlementTransaction = new Transaction({
        groupId: new mongoose.Types.ObjectId(groupId),
        amount: settlementAmount,
        description: `Settlement: ${payer.username} paid ${recipient.username}`,
        isSettlement: true,
        hasBeenSettled: true,
        paidBy: new mongoose.Types.ObjectId(payerId),
        owedToPurchaser: true,
        splitEvenly: false,
        customSplit: [],
        category: 'Settlement',
        notes: `${payer.username} paid ${recipient.username} back.`,
        date: new Date(),
      });

      await settlementTransaction.save();

      // zero balances once
      await MemberBalance.updateMany({ groupId }, { $set: { balance: 0 } });

      // socket.io emits BEFORE sending the response
      const io = req.app.get('io');
      if (io) {
        const user = await User.findById(userId).select('username email');

        io.to(`group-${groupId}`).emit('group-settled', {
          groupId,
          settledBy: { userId, username: user?.username },
          timestamp: new Date().toISOString(),
        });

        const updatedBalances = await MemberBalance.find({ groupId }).populate(
          'memberId',
          'username email'
        );

        io.to(`group-${groupId}`).emit('balance-update', {
          groupId,
          balances: updatedBalances,
          timestamp: new Date().toISOString(),
        });

        io.to(`group-${groupId}`).emit('notification', {
          id: Date.now(),
          type: 'settlement',
          message: `${
            user?.username || 'Someone'
          } settled up the group expenses`,
          groupId,
          timestamp: new Date().toISOString(),
        });
      }

      // single success response
      return res.status(201).json({
        message: 'Balances settled successfully!',
        settlement: settlementTransaction,
        balancesZeroed: true,
      });
    } catch (err) {
      console.error('settleUp error:', err);
      return res.status(500).json({
        error: 'Failed to settle up',
        details: err.message,
      });
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
      res.status(500).json({
        error: 'Failed to fetch recent total',
        details: err.message,
      });
    }
  }
}

module.exports = new TransactionController();
