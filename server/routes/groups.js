// server/routes/groups.js
const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');
const requireAuth = require('../middleware/requireAuth');

// PUBLIC routes (no auth middleware)
router.get('/invite/:inviteToken', groupController.getInviteInfo);
router.post('/join/:inviteToken', groupController.joinGroup);

// PROTECTED routes (with auth middleware)
router.post('/new', requireAuth, groupController.createGroup);
router.get('/user-group', requireAuth, groupController.getUserGroup);
router.get('/:id', requireAuth, groupController.getGroupById);

module.exports = router;
