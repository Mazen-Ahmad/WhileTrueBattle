const mongoose = require('mongoose');

const problemSchema = new mongoose.Schema({
  contestId: {
    type: Number,
    required: true
  },
  index: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  rating: {
    type: Number,
    required: true
  },
  statement: {
    type: String,
    required: true
  },
  inputFormat: {
    type: String,
    required: true
  },
  outputFormat: {
    type: String,
    required: true
  },
  sampleTests: [{
    input: String,
    output: String,
    _id: false
  }],
  timeLimit: {
    type: Number,
    default: 2000
  },
  memoryLimit: {
    type: Number,
    default: 256
  },
  source: {
    type: String,
    default: 'codeforces-scraped'
  },
  sourceUrl: String,
  verified: {
    type: Boolean,
    default: true
  },
  qualityScore: {
    type: Number,
    default: 4
  },
  addedAt: {
    type: Date,
    default: Date.now
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: false
});

// Compound index for efficient filtering
problemSchema.index({ rating: 1, verified: 1 });
problemSchema.index({ contestId: 1, index: 1 });

module.exports = mongoose.model('Problem', problemSchema);