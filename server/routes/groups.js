// server/routes/groups.js
const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');

router.post('/new', groupController.createGroup);
router.get('/user-group', groupController.getUserGroup);
router.get('/:id', groupController.getGroupById);

module.exports = router;
