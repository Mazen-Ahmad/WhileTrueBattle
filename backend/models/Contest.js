const mongoose = require('mongoose');

const contestSchema = new mongoose.Schema({
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    submissions: [{
      problemId: String,
      code: String,
      language: String,
      submittedAt: Date,
      testResults: {
        passed: Number,
        total: Number,
        executionTime: Number,
        memoryUsed: Number,
        verdict: String
      },
      score: {
        correctness: Number,
        timeEfficiency: Number,
        memoryEfficiency: Number,
        codeQuality: Number,
        total: Number
      }
    }],
    finalScore: {
      type: Number,
      default: 0
    },
    questionsCompleted: {
      type: Number,
      default: 0
    },
    finished: {
      type: Boolean,
      default: false
    },
    finishTime: Date,
    forfeited: {
      type: Boolean,
      default: false
    }
  }],
  problems: [{
    id: String,
    name: String,
    difficulty: String,
    tags: [String],
    timeLimit: Number,
    memoryLimit: Number,
    statement: String,
    inputFormat: String,
    outputFormat: String,
    sampleTests: [{
      input: String,
      output: String
    }]
  }],
  startTime: Date,
  endTime: Date,
  duration: Number,
  status: {
    type: String,
    enum: ['scheduled', 'active', 'completed'],
    default: 'scheduled'
  },
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Contest', contestSchema);
