const express = require('express');
const Contest = require('../models/Contest');
const Room = require('../models/Room');
const auth = require('../middleware/auth');
const codeforcesService = require('../services/codeforcesService');
const router = express.Router();

// Start contest
router.post('/start/:roomCode', auth, async (req, res) => {
  try {
    const { roomCode } = req.params;
    
    // Find room and verify user is participant
    const room = await Room.findOne({ roomCode })
      .populate('participants.user', 'username email');
    
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Check if user is room creator
    if (room.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only room creator can start contest' });
    }

    // Check if room has enough participants
    if (room.participants.length < 2) {
      return res.status(400).json({ message: 'Need at least 2 participants to start contest' });
    }

    // Check if contest already exists
    const existingContest = await Contest.findOne({ roomId: room._id });
    if (existingContest) {
      return res.status(400).json({ message: 'Contest already started for this room' });
    }

    // Fetch problems from Codeforces
    const problems = await codeforcesService.getContestProblems(
      room.settings.questionsCount,
      room.settings.difficulty
    );

    // Create contest
    const contest = new Contest({
      roomId: room._id,
      participants: room.participants.map(p => ({
        user: p.user._id,
        submissions: [],
        finalScore: 0,
        questionsCompleted: 0
      })),
      problems: problems.map(p => ({
        id: `${p.contestId}${p.index}`,
        name: p.name,
        difficulty: p.rating?.toString() || 'Unknown',
        tags: p.tags || [],
        timeLimit: 2000, // 2 seconds default
        memoryLimit: 256, // 256 MB default
        statement: `Solve problem: ${p.name}`,
        inputFormat: 'Input format will be provided',
        outputFormat: 'Output format will be provided',
        sampleTests: [
          {
            input: '3\n1 2 3',
            output: '6'
          }
        ]
      })),
      startTime: new Date(),
      endTime: new Date(Date.now() + room.settings.timeLimit * 60 * 1000),
      duration: room.settings.timeLimit,
      status: 'active'
    });

    await contest.save();

    // Update room status
    room.status = 'active';
    await room.save();

    // Populate contest data
    await contest.populate('participants.user', 'username email');

    res.json({
      message: 'Contest started successfully',
      contest
    });
  } catch (error) {
    console.error('Error starting contest:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get contest details
router.get('/:roomCode', auth, async (req, res) => {
  try {
    const { roomCode } = req.params;
    
    const room = await Room.findOne({ roomCode });
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    const contest = await Contest.findOne({ roomId: room._id })
      .populate('participants.user', 'username email stats');

    if (!contest) {
      return res.status(404).json({ message: 'Contest not found' });
    }

    // Check if user is participant
    const isParticipant = contest.participants.some(
      p => p.user._id.toString() === req.user._id.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({ message: 'You are not a participant in this contest' });
    }

    res.json({ contest });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Submit code
router.post('/submit/:roomCode', auth, async (req, res) => {
  try {
    const { roomCode } = req.params;
    const { problemId, code, language } = req.body;

    if (!code || !language || !problemId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const room = await Room.findOne({ roomCode });
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    const contest = await Contest.findOne({ roomId: room._id });
    if (!contest || contest.status !== 'active') {
      return res.status(400).json({ message: 'Contest not active' });
    }

    // Find participant
    const participantIndex = contest.participants.findIndex(
      p => p.user.toString() === req.user._id.toString()
    );

    if (participantIndex === -1) {
      return res.status(403).json({ message: 'You are not a participant in this contest' });
    }

    // Create submission
    const submission = {
      problemId,
      code,
      language,
      submittedAt: new Date(),
      testResults: {
        passed: 1, // Mock result for now
        total: 1,
        executionTime: 100,
        memoryUsed: 1024
      },
      score: {
        timeComplexity: 80,
        codeQuality: 75,
        correctness: 100,
        timeEfficiency: 90,
        total: 86.25
      }
    };

    // Add submission to participant
    contest.participants[participantIndex].submissions.push(submission);
    
    // Update questions completed count
    const uniqueProblems = new Set(
      contest.participants[participantIndex].submissions.map(s => s.problemId)
    );
    contest.participants[participantIndex].questionsCompleted = uniqueProblems.size;

    await contest.save();

    res.json({
      message: 'Code submitted successfully',
      submission,
      questionsCompleted: contest.participants[participantIndex].questionsCompleted
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
