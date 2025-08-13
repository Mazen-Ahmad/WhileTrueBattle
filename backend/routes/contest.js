const express = require('express');
const Contest = require('../models/Contest');
const Room = require('../models/Room');
const User = require('../models/User');
const Problem = require('../models/Problem');
const auth = require('../middleware/auth');
const judge0 = require('../services/judge0');
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

    // Check if contest has expired
    if (new Date() > contest.endTime) {
      await cleanupContest(contest._id);
      return res.status(400).json({ message: 'Contest has ended' });
    }

    // Find participant
    const participantIndex = contest.participants.findIndex(
      p => p.user.toString() === req.user._id.toString()
    );

    if (participantIndex === -1) {
      return res.status(403).json({ message: 'You are not a participant in this contest' });
    }

    // Find the problem
    const problem = contest.problems.find(p => p.id === problemId);
    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    // Run code against test cases using Judge0
    const testResults = await judge0.runTestCases(code, language, problem.sampleTests);
    
    // Calculate score based on performance
    const score = calculateScore(testResults, code, language);

    // Create submission
    const submission = {
      problemId,
      code,
      language,
      submittedAt: new Date(),
      testResults: {
        passed: testResults.summary.passed,
        total: testResults.summary.total,
        executionTime: testResults.summary.totalTime,
        memoryUsed: testResults.summary.maxMemory,
        verdict: testResults.summary.verdict
      },
      score: score
    };

    // Add submission to participant
    contest.participants[participantIndex].submissions.push(submission);
    
    // Update questions completed count
    const uniqueProblems = new Set(
      contest.participants[participantIndex].submissions
        .filter(s => s.testResults.verdict === 'ACCEPTED')
        .map(s => s.problemId)
    );
    contest.participants[participantIndex].questionsCompleted = uniqueProblems.size;

    // Calculate final score
    contest.participants[participantIndex].finalScore = calculateFinalScore(
      contest.participants[participantIndex].submissions
    );

    await contest.save();

    res.json({
      message: 'Code submitted successfully',
      submission,
      questionsCompleted: contest.participants[participantIndex].questionsCompleted,
      testResults: testResults.summary
    });
  } catch (error) {
    console.error('Submit error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// End contest early
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
      contest.status = 'completed';
      contest.endTime = new Date();
      
      // Other participant wins
      const otherParticipant = contest.participants.find((_, i) => i !== participantIndex);
      if (otherParticipant) {
        contest.winner = otherParticipant.user._id;
      }
      
      await contest.save();
      await updateUserStats(contest);
      
      // Cleanup after delay
      setTimeout(() => cleanupContest(contest._id), 30000);
      
      return res.json({ message: 'Contest forfeited', contest });
    }

    // Mark participant as finished
    contest.participants[participantIndex].finished = true;
    contest.participants[participantIndex].finishTime = new Date();

    // Check if both participants are finished
    const allFinished = contest.participants.every(p => p.finished || p.forfeited);
    
    if (allFinished) {
      contest.status = 'completed';
      contest.endTime = new Date();
      contest.winner = determineWinner(contest.participants);
      
      await contest.save();
      await updateUserStats(contest);
      
      // Cleanup after delay
      setTimeout(() => cleanupContest(contest._id), 30000);
    } else {
      await contest.save();
    }

    res.json({ 
      message: allFinished ? 'Contest completed' : 'Waiting for other participant',
      contest,
      waitingForOthers: !allFinished
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Helper functions
function calculateScore(testResults, code, language) {
  const baseScore = (testResults.summary.passed / testResults.summary.total) * 100;
  const timeBonus = Math.max(0, 50 - testResults.summary.totalTime * 10);
  const memoryBonus = Math.max(0, 30 - testResults.summary.maxMemory / 1000);
  const codeQuality = calculateCodeQuality(code, language);

  return {
    correctness: baseScore,
    timeEfficiency: timeBonus,
    memoryEfficiency: memoryBonus,
    codeQuality: codeQuality,
    total: (baseScore + timeBonus + memoryBonus + codeQuality) / 4
  };
}

function calculateCodeQuality(code, language) {
  let score = 70; // Base score
  
  // Check for comments
  if (code.includes('//') || code.includes('/*')) score += 10;
  
  // Check code length (reasonable)
  if (code.length < 200) score += 10;
  else if (code.length > 1000) score -= 10;
  
  // Language specific checks
  if (language === 'python' && code.includes('def ')) score += 5;
  if (language === 'cpp' && code.includes('using namespace std')) score += 5;
  
  return Math.min(100, Math.max(0, score));
}

function calculateFinalScore(submissions) {
  if (submissions.length === 0) return 0;
  
  const acceptedSubmissions = submissions.filter(s => s.testResults.verdict === 'ACCEPTED');
  const totalScore = acceptedSubmissions.reduce((sum, s) => sum + s.score.total, 0);
  
  return acceptedSubmissions.length > 0 ? totalScore / acceptedSubmissions.length : 0;
}

function determineWinner(participants) {
  // Sort by: questions solved (desc), final score (desc), finish time (asc)
  const sorted = [...participants].sort((a, b) => {
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
  
  return sorted[0].user._id || sorted[0].user;
}

async function updateUserStats(contest) {
  try {
    for (const participant of contest.participants) {
      const isWinner = participant.user._id?.toString() === contest.winner?.toString() || 
                      participant.user.toString() === contest.winner?.toString();
      
      await User.findByIdAndUpdate(participant.user._id || participant.user, {
        $inc: {
          'stats.totalContests': 1,
          'stats.wins': isWinner ? 1 : 0,
          'stats.losses': isWinner ? 0 : 1
        },
        $set: {
          'stats.averageScore': participant.finalScore
        }
      });
    }
  } catch (error) {
    console.error('Error updating user stats:', error);
  }
}

async function cleanupContest(contestId) {
  try {
    const contest = await Contest.findById(contestId);
    if (contest) {
      await Room.findByIdAndDelete(contest.roomId);
      await Contest.findByIdAndDelete(contestId);
      console.log(`Cleaned up contest ${contestId} and associated room`);
    }
  } catch (error) {
    console.error('Error cleaning up contest:', error);
  }
}

// Auto-cleanup expired contests (run periodically)
setInterval(async () => {
  try {
    const expiredContests = await Contest.find({
      status: 'active',
      endTime: { $lt: new Date() }
    });

    for (const contest of expiredContests) {
      contest.status = 'completed';
      contest.winner = determineWinner(contest.participants);
      await contest.save();
      await updateUserStats(contest);
      
      // Cleanup after 30 seconds
      setTimeout(() => cleanupContest(contest._id), 30000);
    }
  } catch (error) {
    console.error('Error in auto-cleanup:', error);
  }
}, 60000); // Check every minute

module.exports = router;