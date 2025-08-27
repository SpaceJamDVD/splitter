// server/controllers/groupController.js
const Group = require('../models/Group');
const User = require('../models/User');
const MemberBalance = require('../models/MemberBalance');
const { v4: uuidv4 } = require('uuid');
const {
  generateTokens,
  COOKIE_OPTIONS,
  REFRESH_COOKIE_OPTIONS,
} = require('./authController');

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

  async joinGroup(req, res) {
    const { inviteToken } = req.params;

    try {
      const { username, password, email, firstName, lastName } = req.body || {};

      let user = null;
      const accessToken = req.cookies?.accessToken;

      if (accessToken) {
        try {
          const decoded = jwt.verify(
            accessToken,
            process.env.JWT_ACCESS_SECRET
          );
          if (decoded.type === 'access') {
            user = await User.findById(decoded.userId);
          }
        } catch (_) {
          /* ignore bad/expired token – we’ll ask for signup/login instead */
        }
      }

      const group = await Group.findOne({ inviteToken });
      if (!group) {
        return res
          .status(404)
          .json({ error: 'Invalid or expired invite link' });
      }

      let isNewUser = false;

      if (req.user?.userId) {
        user = await User.findById(req.user.userId);
      }

      if (!user) {
        if (!username || !password || !email) {
          return res.status(400).json({
            error: 'Username, email and password are required',
            requiresAuth: true,
          });
        }

        if (await User.findOne({ email: email.trim().toLowerCase() })) {
          return res.status(400).json({
            error:
              'Email already registered. Please use another email or login.',
          });
        }

        user = new User({
          username: username.trim(),
          email: email.trim().toLowerCase(),
          passwordHash: password,
          profile: { firstName, lastName },
          isActive: true,
        });

        await user.save();
        isNewUser = true;
      }

      if (group.members.includes(user._id)) {
        return res.status(400).json({ error: 'You are already a member' });
      }

      group.members.push(user._id);
      await group.save();

      await MemberBalance.findOneAndUpdate(
        { groupId: group._id, memberId: user._id },
        { $setOnInsert: { balance: 0 } },
        { upsert: true, new: true }
      );

      if (isNewUser) {
        const payload = {
          userId: user._id,
          username: user.username,
          email: user.email,
          groupId: group._id,
          isEmailVerified: user.isEmailVerified,
          plan: user.subscription.plan,
        };

        const { accessToken, refreshToken } = generateTokens(payload);
        res.cookie('accessToken', accessToken, COOKIE_OPTIONS);
        res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);
      }

      res.json({
        message: 'Successfully joined group',
        group,
        isNewUser,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          fullName: user.profile.fullName,
          isEmailVerified: user.isEmailVerified,
          plan: user.subscription.plan,
        },
      });
    } catch (err) {
      console.error('Join group error:', err);
      res.status(500).json({ error: 'Failed to join group' });
    }
  }
}

module.exports = new GroupController();
