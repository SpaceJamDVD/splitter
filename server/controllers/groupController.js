// server/controllers/groupController.js
const Group = require('../models/Group');
const User = require('../models/User');
const MemberBalance = require('../models/MemberBalance');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

class GroupController {
  // Create new group (protected route)
  async createGroup(req, res) {
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
        balance: 0,
      });

      res.status(201).json(group);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to create group' });
    }
  }

  // Get user's group (protected route)
  async getUserGroup(req, res) {
    const userId = req.user.userId;

    try {
      const group = await Group.findOne({ members: userId })
        .populate('members', 'username')
        .exec();

      res.json(group); // group will be null if not found
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to fetch group' });
    }
  }

  // Get group by ID (protected route)
  async getGroupById(req, res) {
    try {
      const group = await Group.findById(req.params.id)
        .populate('members', 'username')
        .exec();

      if (!group) {
        return res.status(404).json({ error: 'Group not found' });
      }

      res.json(group);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to get group' });
    }
  }

  // Get invite info (PUBLIC route)
  async getInviteInfo(req, res) {
    try {
      const group = await Group.findOne({
        inviteToken: req.params.inviteToken,
      }).populate('members', 'username');

      if (!group) {
        return res
          .status(404)
          .json({ error: 'Invalid or expired invite link' });
      }

      res.json({
        groupName: group.name,
        groupDescription: group.description,
        memberCount: group.members.length,
        inviterName: group.members[0]?.username,
        members: group.members,
      });
    } catch (err) {
      res.status(500).json({ error: 'Failed to get invite info' });
    }
  }

  // Join group (PUBLIC route - handles signup + join)
  async joinGroup(req, res) {
    const { inviteToken } = req.params;

    try {
      const bodyData = req.body || {};
      const { username = null, password = null, email = null } = bodyData;

      const group = await Group.findOne({ inviteToken });

      if (!group) {
        return res
          .status(404)
          .json({ error: 'Invalid or expired invite link' });
      }

      let userId;
      let isNewUser = false;

      const authHeader = req.headers.authorization;

      if (authHeader) {
        try {
          const token = authHeader.split(' ')[1];
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          userId = decoded.userId;
        } catch (err) {}
      }

      if (!userId && password && email) {
        const existingUser = await User.findOne({ email });

        if (existingUser) {
          return res.status(400).json({
            error:
              'Email already registered. Please use another email or login.',
          });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await User.create({
          username,
          email,
          passwordHash: hashedPassword,
        });

        userId = newUser._id;
        isNewUser = true;
      } else if (!userId) {
        const missingFields = [];
        if (!password) missingFields.push('password');
        if (!email) missingFields.push('email');

        return res.status(400).json({
          error:
            missingFields.length > 0
              ? `Missing required fields: ${missingFields.join(', ')}`
              : 'Please provide account details or login first',
          requiresAuth: true,
        });
      }

      if (group.members.includes(userId)) {
        return res
          .status(400)
          .json({ error: 'You are already a member of this group' });
      }

      group.members.push(userId);
      await group.save();

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

      let token = null;
      if (isNewUser) {
        token = jwt.sign({ userId }, process.env.JWT_SECRET);
      }

      res.json({
        message: 'Successfully joined group',
        group,
        token,
        isNewUser,
      });
    } catch (err) {
      res.status(500).json({ error: 'Failed to join group' });
    }
  }
}

module.exports = new GroupController();
