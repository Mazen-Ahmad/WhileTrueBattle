const express = require('express');
const Contest = require('../models/Contest');
const Room = require('../models/Room');
const Problem = require('../models/Problem');
const auth = require('../middleware/auth');
const judge0Service = require('../services/judge0');

const router = express.Router();

// Helper function to get problems from database
const getProblemsFromDatabase = async (count, difficulty) => {
  try {
    const ranges = {
      '800-1200': { min: 800, max: 1200 },
      '1200-1600': { min: 1200, max: 1600 },
      '1600-2000': { min: 1600, max: 2000 },
      '2000+': { min: 2000, max: 5000 }
    };

    const range = ranges[difficulty] || ranges['800-1200'];

    // Fetch problems from database with rating filter
    const problems = await Problem.aggregate([
      {
        $match: {
          rating: { $gte: range.min, $lte: range.max },
          verified: true,
          qualityScore: { $gte: 3 } // Only get quality problems
        }
      },
      { $sample: { size: count } } // Random sampling
    ]);

    return problems;
  } catch (error) {
    console.error('Error fetching problems from database:', error);
    throw new Error('Failed to fetch problems from database');
  }
};

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

    // Fetch problems from database instead of Codeforces API
    const problems = await getProblemsFromDatabase(
      room.settings.questionsCount,
      room.settings.difficulty
    );

    // Create contest with properly formatted problems
    const contest = new Contest({
      roomId: room._id,
      participants: room.participants.map(p => ({
        user: p.user._id,
        submissions: [],
        finalScore: 0,
        questionsCompleted: 0
      })),
      problems: problems.map((p, index) => ({
        id: p._id.toString(),
        name: p.name,
        difficulty: p.rating?.toString() || 'Unknown',
        tags: [], // You can add tags if available in your schema
        timeLimit: p.timeLimit || 2000,
        memoryLimit: p.memoryLimit || 256,
        statement: p.statement,
        inputFormat: p.inputFormat,
        outputFormat: p.outputFormat,
        sampleTests: p.sampleTests || []
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

// Submit code with Judge0 integration
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

    // Find the problem
    const problem = contest.problems.find(p => p.id === problemId);
    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    // Find participant
    const participantIndex = contest.participants.findIndex(
      p => p.user.toString() === req.user._id.toString()
    );

    if (participantIndex === -1) {
      return res.status(403).json({ message: 'You are not a participant in this contest' });
    }

    try {
      // Execute code with Judge0
      const testResults = await judge0Service.runTestCases(
        code,
        language,
        problem.sampleTests || []
      );

      // Calculate score
      const scoreData = judge0Service.calculateScore(testResults);

      // Create submission
      const submission = {
        problemId,
        code,
        language,
        submittedAt: new Date(),
        testResults: {
          passed: scoreData.testResults.passed,
          total: scoreData.testResults.total,
          details: testResults,
          executionTime: testResults.length > 0 ? 
            Math.max(...testResults.map(r => r.executionTime)) : 0,
          memoryUsed: testResults.length > 0 ? 
            Math.max(...testResults.map(r => r.memory)) : 0
        },
        score: {
          correctness: scoreData.correctness,
          timeEfficiency: scoreData.timeEfficiency,
          memoryEfficiency: scoreData.memoryEfficiency,
          total: scoreData.total
        }
      };

      // Add submission to participant
      contest.participants[participantIndex].submissions.push(submission);

      // Update questions completed count and final score
      const userSubmissions = contest.participants[participantIndex].submissions;
      const solvedProblems = new Set();
      let totalScore = 0;

      userSubmissions.forEach(sub => {
        if (sub.testResults.passed === sub.testResults.total && sub.testResults.total > 0) {
          solvedProblems.add(sub.problemId);
          totalScore += sub.score.total;
        }
      });

      contest.participants[participantIndex].questionsCompleted = solvedProblems.size;
      contest.participants[participantIndex].finalScore = totalScore / Math.max(1, solvedProblems.size);
      
      // Check if user has completed all problems
      if (solvedProblems.size === contest.problems.length) {
        contest.participants[participantIndex].finished = true;
        contest.participants[participantIndex].finishTime = new Date();
        
        // Check if all participants are finished
        const allFinished = contest.participants.every(p => p.finished || p.forfeited);
        if (allFinished) {
          contest.status = 'completed';
          contest.endTime = new Date();
        }
      }

      await contest.save();

      // Emit socket event if user has finished all problems
      if (contest.participants[participantIndex].finished) {
        const io = req.app.get('io');
        if (io) {
          io.to(`contest-${roomCode}`).emit('participant-finished', {
            roomCode,
            userId: req.user._id,
            forfeit: false
          });
        }
      }

      await contest.populate('participants.user', 'username email stats');

      res.json({
        message: 'Code submitted successfully',
        submission: {
          ...submission,
          testResults: {
            ...submission.testResults,
            details: submission.testResults.details.map(detail => ({
              passed: detail.passed,
              input: detail.input,
              expectedOutput: detail.expectedOutput,
              actualOutput: detail.actualOutput,
              executionTime: detail.executionTime,
              memory: detail.memory,
              error: detail.error,
              status: detail.status
            }))
          }
        },
        questionsCompleted: contest.participants[participantIndex].questionsCompleted,
        score: scoreData
      });

    } catch (judgeError) {
      console.error('Judge0 execution error:', judgeError);

      // Create failed submission
      const submission = {
        problemId,
        code,
        language,
        submittedAt: new Date(),
        testResults: {
          passed: 0,
          total: problem.sampleTests?.length || 0,
          details: [],
          executionTime: 0,
          memoryUsed: 0
        },
        score: {
          correctness: 0,
          timeEfficiency: 0,
          memoryEfficiency: 0,
          total: 0
        },
        error: judgeError.message
      };

      contest.participants[participantIndex].submissions.push(submission);
      await contest.save();

      res.json({
        message: 'Code submission failed',
        submission,
        error: judgeError.message,
        questionsCompleted: contest.participants[participantIndex].questionsCompleted
      });
    }
  } catch (error) {
    console.error('Submission error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// End contest route (MISSING - ADDED HERE)
router.post('/end/:roomCode', auth, async (req, res) => {
  try {
    const { roomCode } = req.params;
    const { forfeit = false } = req.body;

    const room = await Room.findOne({ roomCode });
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    const contest = await Contest.findOne({ roomId: room._id })
      .populate('participants.user', 'username email');

    if (!contest) {
      return res.status(404).json({ message: 'Contest not found' });
    }

    // Find participant
    const participantIndex = contest.participants.findIndex(
      p => p.user._id.toString() === req.user._id.toString()
    );

    if (participantIndex === -1) {
      return res.status(403).json({ message: 'You are not a participant' });
    }

    if (forfeit) {
      // Mark as forfeited and end contest
      contest.participants[participantIndex].forfeited = true;
      contest.participants[participantIndex].finishTime = new Date();
      contest.status = 'completed';
      contest.endTime = new Date();
      
      // Other participant wins
      const otherParticipant = contest.participants.find((_, i) => i !== participantIndex);
      if (otherParticipant) {
        contest.winner = otherParticipant.user._id;
      }
      
      await contest.save();
      
      // Emit socket event for forfeit
      const io = req.app.get('io');
      if (io) {
        io.to(`contest-${roomCode}`).emit('participant-finished', {
          roomCode,
          userId: req.user._id,
          forfeit: true
        });
      }
      
      return res.json({ 
        message: 'Contest forfeited', 
        contest,
        waitingForOthers: false 
      });
    }

    // Mark participant as finished
    contest.participants[participantIndex].finished = true;
    contest.participants[participantIndex].finishTime = new Date();

    // Check if both participants are finished
    const allFinished = contest.participants.every(p => p.finished || p.forfeited);
    
    if (allFinished) {
      contest.status = 'completed';
      contest.endTime = new Date();
      
      // Determine winner based on score, questions solved, and time
      const sorted = [...contest.participants].sort((a, b) => {
        if (a.forfeited && !b.forfeited) return 1;
        if (!a.forfeited && b.forfeited) return -1;
        
        if (a.questionsCompleted !== b.questionsCompleted) {
          return b.questionsCompleted - a.questionsCompleted;
        }
        
        if (Math.abs(a.finalScore - b.finalScore) > 0.1) {
          return b.finalScore - a.finalScore;
        }
        
        return new Date(a.finishTime) - new Date(b.finishTime);
      });
      
      contest.winner = sorted[0].user._id;
      
      await contest.save();
      
      return res.json({ 
        message: 'Contest completed', 
        contest,
        waitingForOthers: false 
      });
    } else {
      await contest.save();
      return res.json({ 
        message: 'Waiting for other participant',
        contest,
        waitingForOthers: true
      });
    }

  } catch (error) {
    console.error('End contest error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
