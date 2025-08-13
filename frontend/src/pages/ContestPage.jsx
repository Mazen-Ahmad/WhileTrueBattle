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
        
        // Check if waiting for others
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

      socket.on('contest-updated', (updatedContest) => {
        setContest(updatedContest);
      });

      socket.on('contest-ended', () => {
        setContestStatus('completed');
      });

      socket.on('submission-received', (data) => {
        fetchContest();
      });

      socket.on('participant-finished', () => {
        fetchContest();
      });

      return () => {
        socket.off('contest-updated');
        socket.off('contest-ended');
        socket.off('submission-received');
        socket.off('participant-finished');
      };
    }
  }, [socket, roomCode]);

  const handleCodeSubmit = async (code, language) => {
    if (!selectedProblem) return;

    try {
      const response = await api.post(`/contests/submit/${roomCode}`, {
        problemId: selectedProblem.id,
        code,
        language
      });

      // Emit socket event for real-time updates
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">{error}</div>
          <Button onClick={onBackToHome}>Back to Home</Button>
        </div>
      </div>
    );
  }

  if (contestStatus === 'completed') {
    return (
      <ContestResults 
        contest={contest} 
        onBackToHome={onBackToHome}
        currentUser={user}
      />
    );
  }

  // Waiting screen
  if (userFinished && waitingForOthers) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ContestHeader 
          contest={contest}
          timeLeft={timeLeft}
          onEndContest={handleEndContest}
          onBackToHome={onBackToHome}
          userFinished={userFinished}
          waitingForOthers={waitingForOthers}
        />
        
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <div className="text-center bg-white rounded-lg shadow-lg p-8 max-w-md">
            <div className="text-6xl mb-4">⏳</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Contest Submitted!
            </h2>
            <p className="text-gray-600 mb-6">
              You've finished the contest. Waiting for your opponent to complete their submission.
            </p>
            <div className="space-y-3">
              <Button
                variant="danger"
                onClick={() => handleEndContest(true)}
                className="w-full"
              >
                Forfeit Contest (Opponent Wins)
              </Button>
              <p className="text-sm text-gray-500">
                Or wait for them to finish naturally
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ContestHeader 
        contest={contest}
        timeLeft={timeLeft}
        onEndContest={handleEndContest}
        onBackToHome={onBackToHome}
        userFinished={userFinished}
        waitingForOthers={waitingForOthers}
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
          {/* Problems List */}
          <div className="lg:col-span-1">
            <ProblemsList
              problems={contest.problems}
              selectedProblem={selectedProblem}
              onSelectProblem={setSelectedProblem}
              userSubmissions={contest.participants.find(p => p.user._id === user.id)?.submissions || []}
            />
          </div>

          {/* Code Editor */}
          <div className="lg:col-span-3">
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
