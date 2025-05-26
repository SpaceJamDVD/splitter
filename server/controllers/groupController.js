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
        members: group.members, // ADD THIS LINE!!!
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to get invite info' });
    }
  }

  // Join group (PUBLIC route - handles signup + join)
  async joinGroup(req, res) {
    console.log('=== JOIN GROUP REQUEST ===');
    console.log('URL params:', req.params);
    console.log('Request body:', req.body);
    console.log('Request headers:', req.headers);
    console.log('========================');

    const { inviteToken } = req.params;

    try {
      // Test if we can destructure safely
      const bodyData = req.body || {};
      console.log('Body data:', bodyData);

      // FIXED: Extract email along with username and password
      const { username = null, password = null, email = null } = bodyData;
      console.log('Extracted data:', { username, password, email });

      // Test database connection
      console.log('Looking for group with token:', inviteToken);
      const group = await Group.findOne({ inviteToken });
      console.log('Found group:', group ? 'YES' : 'NO');

      if (!group) {
        console.log('Group not found, returning 404');
        return res
          .status(404)
          .json({ error: 'Invalid or expired invite link' });
      }

      let userId;
      let isNewUser = false;

      // Check authentication
      const authHeader = req.headers.authorization;
      console.log('Auth header present:', !!authHeader);

      if (authHeader) {
        try {
          const token = authHeader.split(' ')[1];
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          userId = decoded.userId;
          console.log('Authenticated user ID:', userId);
        } catch (err) {
          console.log('Auth token invalid:', err.message);
        }
      }

      // FIXED: Check for all required fields including email
      if (!userId && username && password && email) {
        console.log(
          'Creating new user with username:',
          username,
          'and email:',
          email
        );

        // Check for existing user by username OR email
        const existingUser = await User.findOne({
          $or: [{ username: username }, { email: email }],
        });

        if (existingUser) {
          if (existingUser.username === username) {
            console.log('Username already exists');
            return res
              .status(400)
              .json({
                error: 'Username already exists. Please choose another.',
              });
          } else {
            console.log('Email already exists');
            return res
              .status(400)
              .json({
                error:
                  'Email already registered. Please use another email or login.',
              });
          }
        }

        console.log('Hashing password...');
        const hashedPassword = await bcrypt.hash(password, 10);

        console.log('Creating user in database...');
        const newUser = await User.create({
          username,
          email, // FIXED: Include email in user creation
          passwordHash: hashedPassword,
        });

        userId = newUser._id;
        isNewUser = true;
        console.log('New user created with ID:', userId);
      } else if (!userId) {
        console.log('No auth and missing user data');
        // FIXED: More specific error message
        const missingFields = [];
        if (!username) missingFields.push('username');
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

      // Check if already a member
      console.log('Checking if user is already a member...');
      if (group.members.includes(userId)) {
        console.log('User is already a member');
        return res
          .status(400)
          .json({ error: 'You are already a member of this group' });
      }

      // Add user to group
      console.log('Adding user to group...');
      group.members.push(userId);
      await group.save();
      console.log('User added to group successfully');

      // Create MemberBalance
      console.log('Creating member balance...');
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
        console.log('Member balance created');
      } else {
        console.log('Member balance already exists');
      }

      // Generate token for new users
      let token = null;
      if (isNewUser) {
        console.log('Generating JWT for new user...');
        token = jwt.sign({ userId }, process.env.JWT_SECRET);
      }

      console.log('Success! Sending response...');
      res.json({
        message: 'Successfully joined group',
        group,
        token,
        isNewUser,
      });
    } catch (err) {
      console.error('=== JOIN GROUP ERROR ===');
      console.error('Error message:', err.message);
      console.error('Error stack:', err.stack);
      console.error('========================');
      res.status(500).json({ error: 'Failed to join group' });
    }
  }
}

module.exports = new GroupController();
