const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String,
        default: ''
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    settledAt: {
        type: Date,
        default: null
    },
    inviteToken: {
        type: String,
        required: true,
        unique: true
    },
});

module.exports = mongoose.model('Group', groupSchema);