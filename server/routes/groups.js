const express = require('express');
const router = express.Router();
const Group = require('../models/Group');
const MemberBalance = require('../models/MemberBalance');
const { v4: uuidv4 } = require('uuid');

router.post('/new', async (req, res) => {
  const { name, description } = req.body;
  const userId = req.user.userId;

  try {
    const group = new Group({
      name,
      description,
      createdBy: userId,
      members: [userId],
      inviteToken: uuidv4(),
    });

    await group.save();

    // Create initial member balance
    await MemberBalance.create({
      groupId: group._id,
      memberId: userId,
      balance: 0, // New group, so balance starts at 0
    });

    res.status(201).json(group);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create group' });
  }
});

// Get groups where user is a member
router.get('/my', async (req, res) => {
  const userId = req.user.userId;

  try {
    const groups = await Group.find({ members: userId }).sort({
      createdAt: -1,
    });
    res.json(groups);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch groups' });
  }
});

// Get group by ID
router.get('/:id', async (req, res) => {
  try {
    const group = await Group.findById(req.params.id).populate(
      'members',
      'username'
    ); // Only return usernames

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    res.json(group);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get group' });
  }
});

// Join a group via invite token
router.post('/join/:inviteToken', async (req, res) => {
  const userId = req.user.userId;

  try {
    const group = await Group.findOne({ inviteToken: req.params.inviteToken });

    if (!group) {
      return res.status(404).json({ error: 'Invalid or expired invite link' });
    }

    if (group.members.includes(userId)) {
      return res
        .status(400)
        .json({ error: 'You are already a member of this group' });
    }

    group.members.push(userId);
    await group.save();

    // Create MemberBalance if not already existing
    const existing = await MemberBalance.findOne({
      groupId: group._id,
      memberId: userId,
    });

    if (!existing) {
      await MemberBalance.create({
        groupId: group._id,
        memberId: userId,
        balance: 0,
      });
    }

    res.json({ message: 'Successfully joined group', group });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to join group' });
  }
});

module.exports = router;
