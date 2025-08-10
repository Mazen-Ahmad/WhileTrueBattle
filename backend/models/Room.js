const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  roomCode: {
    type: String,
    required: true,
    unique: true,
    length: 6
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  settings: {
    questionsCount: {
      type: Number,
      min: 1,
      max: 10,
      default: 3
    },
    timeLimit: {
      type: Number, // in minutes
      min: 10,
      max: 180,
      default: 60
    },
    difficulty: {
      type: String,
      enum: ['800-1200', '1200-1600', '1600-2000', '2000+'],
      default: '800-1200'
    }
  },
  status: {
    type: String,
    enum: ['waiting', 'active', 'completed'],
    default: 'waiting'
  },
  maxParticipants: {
    type: Number,
    default: 2
  }
}, {
  timestamps: true
});

// Generate unique room code
roomSchema.methods.generateRoomCode = function() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

module.exports = mongoose.model('Room', roomSchema);