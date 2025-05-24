const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const MemberBalance = require('../models/MemberBalance');
const mongoose = require('mongoose');
const User = require('../models/User');
const Group = require('../models/Group');

router.post('/', async (req, res) => {
  const userId = req.user.userId;
  const { groupId, amount, description, notes, category, owedToPurchaser } =
    req.body;

  try {
    // VALIDATE FIRST - before creating anything
    console.log(
      'Creating transaction - User ID:',
      userId,
      'Group ID:',
      groupId
    );

    const group = await Group.findById(groupId);
    if (!group) {
      console.log('Group not found:', groupId);
      return res.status(400).json({ error: 'Group not found' });
    }

    if (!group.members.includes(userId)) {
      console.log(
        'User not in group. Group members:',
        group.members,
        'User:',
        userId
      );
      return res.status(400).json({ error: 'User not in group' });
    }

    // Validate required fields
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }

    // NOW create the transaction
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
    console.log('Transaction saved:', transaction._id);

    // Update member balances
    const memberIds = group.members.map((id) => id.toString());
    const payerId = userId.toString();

    if (owedToPurchaser) {
      // Entire amount owed to purchaser
      const nonPayers = memberIds.filter((id) => id !== payerId);
      const share = amount / nonPayers.length;

      console.log('Owed to purchaser - share per person:', share);

      // Update non-payers (they owe money)
      for (const memberId of nonPayers) {
        await MemberBalance.findOneAndUpdate(
          { groupId, memberId },
          { $inc: { balance: -share } },
          { upsert: true }
        );
      }

      // Update payer (they are owed money)
      await MemberBalance.findOneAndUpdate(
        { groupId, memberId: payerId },
        { $inc: { balance: amount } },
        { upsert: true }
      );
    } else {
      // Split evenly among all members
      const share = amount / memberIds.length;
      console.log('Split evenly - share per person:', share);

      for (const memberId of memberIds) {
        if (memberId === payerId) {
          // Payer gets: amount paid - their share
          await MemberBalance.findOneAndUpdate(
            { groupId, memberId },
            { $inc: { balance: amount - share } },
            { upsert: true }
          );
        } else {
          // Others owe their share
          await MemberBalance.findOneAndUpdate(
            { groupId, memberId },
            { $inc: { balance: -share } },
            { upsert: true }
          );
        }
      }
    }

    console.log('Balance updates completed');
    res.status(201).json(transaction);
  } catch (err) {
    console.error('Transaction creation error:', err);

    // More specific error messages
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
});

router.get('/group/:groupId', async (req, res) => {
  const { groupId } = req.params;

  try {
    const transactions = await Transaction.find({ groupId })
      .populate('paidBy', 'username') // for nice display
      .sort({ date: -1 }); // newest first

    res.json(transactions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

router.post('/settle', async (req, res) => {
  const userId = req.user.userId;
  const { groupId } = req.body;

  if (!groupId) {
    return res.status(400).json({ error: 'Group ID is required.' });
  }

  try {
    // Fetch group details to get member list
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Fetch actual user objects for the group members
    const allGroupMembers = await User.find({
      _id: { $in: group.members.map((id) => new mongoose.Types.ObjectId(id)) },
    });

    if (allGroupMembers.length !== 2) {
      return res.status(400).json({
        error:
          'This settlement function is currently designed for groups with exactly 2 members.',
      });
    }

    // Fetch current balances from MemberBalance collection
    const memberBalances = await MemberBalance.find({ groupId }).populate(
      'memberId',
      'username'
    );

    if (memberBalances.length === 0) {
      return res.status(200).json({
        message: 'No balances found. Nothing to settle.',
      });
    }

    // Determine who owes whom from current balances
    let payerId = null; // Person who owes money
    let recipientId = null; // Person who is owed money
    let settlementAmount = 0;

    const EPSILON = 0.01;

    // Check if already settled
    const allBalancesSettled = memberBalances.every(
      (mb) => Math.abs(mb.balance) < EPSILON
    );
    if (allBalancesSettled) {
      return res
        .status(200)
        .json({ message: 'All balances are already settled.' });
    }

    // Find who owes and who is owed
    for (const memberBalance of memberBalances) {
      if (memberBalance.balance < -EPSILON) {
        // This person owes money
        payerId = memberBalance.memberId._id.toString();
        settlementAmount = Math.abs(memberBalance.balance);
      } else if (memberBalance.balance > EPSILON) {
        // This person is owed money
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

    // Create the settlement transaction
    const settlementTransaction = new Transaction({
      groupId: new mongoose.Types.ObjectId(groupId),
      amount: settlementAmount,
      description: `Settlement: ${payer.username} paid ${recipient.username}`,
      isSettlement: true,
      paidBy: new mongoose.Types.ObjectId(payerId), // Person who owed money
      owedToPurchaser: true, // Recipient gets the full amount
      splitEvenly: false,
      customSplit: [],
      category: 'Settlement',
      notes: `Automatic settlement payment from ${payer.username} to ${recipient.username} to balance accounts.`,
      date: new Date(),
    });

    await settlementTransaction.save();

    // ZERO OUT ALL BALANCES
    await MemberBalance.updateMany(
      { groupId },
      { $set: { balance: 0 } } // Set all balances to 0
    );

    res.status(201).json({
      message: 'Balances settled successfully!',
      settlement: settlementTransaction,
      balancesZeroed: true,
    });
  } catch (err) {
    console.error('Settlement Error:', err);
    res.status(500).json({
      error: 'Failed to settle balances.',
      details: err.message,
    });
  }
});

module.exports = router;
