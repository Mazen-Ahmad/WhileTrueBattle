import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { useTheme } from '../contexts/ThemeContext';
import ThemeToggle from '../components/common/ThemeToggle';
import ContestHeader from '../components/contest/ContestHeader';
import ProblemsList from '../components/contest/ProblemsList';
import CodeEditor from '../components/contest/CodeEditor';
import ContestResults from '../components/contest/ContestResults';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Button from '../components/common/Button';
import api from '../services/api';
import logo from '../assets/l1.png';

const ContestPage = ({ roomCode, onBackToHome }) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const { theme } = useTheme();
  const [contest, setContest] = useState(null);
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [contestStatus, setContestStatus] = useState('loading');
  const [userFinished, setUserFinished] = useState(false);
  const [waitingForOthers, setWaitingForOthers] = useState(false);

  // Fetch contest data
  const fetchContest = async () => {
    try {
      const response = await api.get(`/contests/${roomCode}`);
      const contestData = response.data.contest;
      setContest(contestData);

      // Check user status
      const userParticipant = contestData.participants.find(
        p => p.user._id === user.id
      );

      if (userParticipant) {
        setUserFinished(userParticipant.finished || userParticipant.forfeited);

        // Check if waiting for opponents to finish
        const othersFinished = contestData.participants
          .filter(p => p.user._id !== user.id)
          .every(p => p.finished || p.forfeited);

        setWaitingForOthers(userParticipant.finished && !othersFinished);
      }

      if (contestData.problems.length > 0 && !selectedProblem) {
        setSelectedProblem(contestData.problems[0]);
      }

      // Calculate time left
      const endTime = new Date(contestData.endTime).getTime();
      const now = new Date().getTime();
      const remaining = Math.max(0, endTime - now);
      setTimeLeft(Math.floor(remaining / 1000));

      setContestStatus(contestData.status);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load contest');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContest();
    // eslint-disable-next-line
  }, [roomCode]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft > 0 && contestStatus === 'active') {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setContestStatus('completed');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeLeft, contestStatus]);

  // Socket event listeners
  useEffect(() => {
    if (socket && socket.connected) {
      socket.emit('join-contest', roomCode);

      socket.on('contest-updated', setContest);
      socket.on('contest-ended', (data) => {
        console.log('Received contest-ended event:', data);
        setContestStatus('completed');
        if (data.contest) {
          setContest(data.contest);
        }
      });
      socket.on('submission-received', fetchContest);
      socket.on('participant-finished', fetchContest);

      // Re-join contest room on reconnect
      socket.on('connect', () => {
        console.log('Socket reconnected, rejoining contest room');
        socket.emit('join-contest', roomCode);
      });

      return () => {
        socket.off('contest-updated');
        socket.off('contest-ended');
        socket.off('submission-received');
        socket.off('participant-finished');
        socket.off('connect');
      };
    }
  }, [socket, roomCode]);

  // Submit code for a problem
  const handleCodeSubmit = async (code, language) => {
    if (!selectedProblem) return;
    try {
      const response = await api.post(`/contests/submit/${roomCode}`, {
        problemId: selectedProblem.id,
        code,
        language
      });
      // Real-time update
      if (socket) {
        socket.emit('code-submitted', {
          roomCode,
          userId: user.id,
          problemId: selectedProblem.id
        });
      }
      fetchContest();
      return response.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Submission failed');
    }
  };

  // End contest — Only allows forfeit if user finished and waiting
  const handleEndContest = async (forfeit = false) => {
    try {
      const response = await api.post(`/contests/end/${roomCode}`, { forfeit });
      if (socket) {
        socket.emit('participant-finished', {
          roomCode,
          userId: user.id,
          forfeit
        });
      }
      if (response.data.contest.status === 'completed') {
        setContestStatus('completed');
      } else {
        setUserFinished(true);
        setWaitingForOthers(response.data.waitingForOthers);
      }
      fetchContest();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to end contest');
    }
  };

  if (loading) {
    return (
      <motion.div 
        className="min-h-screen flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <LoadingSpinner />
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div 
        className="min-h-screen flex items-center justify-center"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div 
          className="text-center"
          initial={{ y: 20 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <img 
            src={logo} 
            alt="Logo" 
            className={`h-12 w-12 mx-auto mb-4 ${theme === 'neon' ? 'logo-glow' : ''}`}
          />
          <h2 className="text-xl font-bold text-red-600 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={onBackToHome}>Back to Home</Button>
        </motion.div>
      </motion.div>
    );
  }

  // Show results when contest is completed
  if (contestStatus === 'completed') {
    return (
      <motion.div 
        className="min-h-screen bg-gray-100"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <ContestResults 
          contest={contest} 
          onBackToHome={onBackToHome}
        />
      </motion.div>
    );
  }

  // Waiting screen when user finished but others haven't
  if (userFinished && waitingForOthers) {
    return (
      <motion.div 
        className="min-h-screen bg-gray-100"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <ContestHeader
          contest={contest}
          timeLeft={timeLeft}
          onEndContest={handleEndContest}
          userFinished={userFinished}
          waitingForOthers={waitingForOthers}
        />
        <div className="flex items-center justify-center h-screen">
          <motion.div 
            className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <motion.div className="mb-4">
              <motion.div 
                className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4"
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <svg
                  className="w-8 h-8 text-blue-600"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              </motion.div>
            </motion.div>
            <motion.h2 
              className="text-xl font-bold text-gray-900 mb-2"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              Contest Finished!
            </motion.h2>
            <motion.p 
              className="text-gray-600 mb-6"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              You've finished the contest. Waiting for your opponent to complete their submission.
            </motion.p>
            <motion.div 
              className="space-y-2"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  onClick={() => handleEndContest(true)}
                  variant="danger"
                  size="small"
                  className="w-full"
                >
                  Forfeit Contest
                </Button>
              </motion.div>
              <p className="text-xs text-gray-500">
                Or wait for your opponent to finish
              </p>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  // Main contest interface
  return (
    <motion.div 
      className="min-h-screen bg-gray-100"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <ContestHeader
        contest={contest}
        timeLeft={timeLeft}
        onEndContest={handleEndContest}
        userFinished={userFinished}
        waitingForOthers={waitingForOthers}
      />
      <motion.div 
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <div className="grid grid-cols-12 gap-6 min-h-[calc(100vh-10rem)]">
          {/* Problems List */}
          <motion.div 
            className="col-span-3"
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <ProblemsList
              problems={contest?.problems || []}
              selectedProblem={selectedProblem}
              onSelectProblem={setSelectedProblem}
              userSubmissions={contest?.participants
                .find(p => p.user._id === user.id)
                ?.submissions || []}
            />
          </motion.div>
          {/* Code Editor */}
          <motion.div 
            className="col-span-9"
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <CodeEditor
              problem={selectedProblem}
              onSubmit={handleCodeSubmit}
              contestActive={contestStatus === 'active' && !userFinished}
            />
          </motion.div>
        </div>
      </motion.div>
      
      <ThemeToggle position="top-right" />
    </motion.div>
  );
};

export default ContestPage;