const express = require('express');
const router = express.Router();
const Group = require('../models/Group');
const { v4: uuidv4 } = require('uuid');

// Create group
router.post('/new', async (req, res) => {
  const { name, description } = req.body;
  const userId = req.user.userId; 

  // console.log('req.user:', req.user);

  try {
    const group = new Group({
      name,
      description,
      createdBy: userId,
      members: [userId], // include creator by default
      inviteToken: uuidv4()
    });

    await group.save();
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
      const groups = await Group.find({ members: userId }).sort({ createdAt: -1 });
      res.json(groups);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to fetch groups' });
    }
  });

module.exports = router;
