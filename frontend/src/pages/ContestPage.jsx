import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import ContestHeader from '../components/contest/ContestHeader';
import ProblemsList from '../components/contest/ProblemsList';
import CodeEditor from '../components/contest/CodeEditor';
import ContestResults from '../components/contest/ContestResults';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Button from '../components/common/Button';
import api from '../services/api';

const ContestPage = ({ roomCode, onBackToHome }) => {
  const { user } = useAuth();
  const { socket } = useSocket();
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
    if (socket) {
      socket.emit('join-contest', roomCode);

      socket.on('contest-updated', setContest);
      socket.on('contest-ended', () => setContestStatus('completed'));
      socket.on('submission-received', fetchContest);
      socket.on('participant-finished', fetchContest);

      return () => {
        socket.off('contest-updated');
        socket.off('contest-ended');
        socket.off('submission-received');
        socket.off('participant-finished');
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
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-600 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={onBackToHome}>Back to Home</Button>
        </div>
      </div>
    );
  }

  // Show results when contest is completed
  if (contestStatus === 'completed') {
    return (
      <div className="min-h-screen bg-gray-100">
        <ContestResults 
          contest={contest} 
          onBackToHome={onBackToHome}
        />
      </div>
    );
  }

  // Waiting screen when user finished but others haven't
  if (userFinished && waitingForOthers) {
    return (
      <div className="min-h-screen bg-gray-100">
        <ContestHeader
          contest={contest}
          timeLeft={timeLeft}
          onEndContest={handleEndContest}
          userFinished={userFinished}
          waitingForOthers={waitingForOthers}
        />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md">
            <div className="mb-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <svg
                  className="w-8 h-8 text-blue-600 animate-spin"
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
              </div>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Contest Finished!</h2>
            <p className="text-gray-600 mb-6">
              You've finished the contest. Waiting for your opponent to complete their submission.
            </p>
            <div className="space-y-2">
              <Button
                onClick={() => handleEndContest(true)}
                variant="danger"
                size="small"
                className="w-full"
              >
                Force End Contest
              </Button>
              <p className="text-xs text-gray-500">
                Or wait for them to finish naturally
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main contest interface
  return (
    <div className="min-h-screen bg-gray-100">
      <ContestHeader
        contest={contest}
        timeLeft={timeLeft}
        onEndContest={handleEndContest}
        userFinished={userFinished}
        waitingForOthers={waitingForOthers}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-10rem)]">
          {/* Problems List */}
          <div className="col-span-3">
            <ProblemsList
              problems={contest?.problems || []}
              selectedProblem={selectedProblem}
              onSelectProblem={setSelectedProblem}
              userSubmissions={contest?.participants
                .find(p => p.user._id === user.id)
                ?.submissions || []}
            />
          </div>
          {/* Code Editor */}
          <div className="col-span-9">
            <CodeEditor
              problem={selectedProblem}
              onSubmit={handleCodeSubmit}
              contestActive={contestStatus === 'active' && !userFinished}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContestPage;
