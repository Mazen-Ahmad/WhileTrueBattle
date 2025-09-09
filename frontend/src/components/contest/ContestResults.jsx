import React from 'react';
import Button from '../common/Button';
import LoadingSpinner from '../common/LoadingSpinner';

const ContestResults = ({ contest, onBackToHome, currentUser }) => {
  // Handle loading/missing data states
  if (!contest) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // Safe access to participants with fallback
  const participants = contest.participants || [];
  
  if (participants.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-4">No Participants Found</h2>
          <Button onClick={onBackToHome}>Back to Home</Button>
        </div>
      </div>
    );
  }

  // Sort participants by performance (safely)
  const sortedParticipants = [...participants].sort((a, b) => {
    // Handle forfeited participants
    if (a.forfeited && !b.forfeited) return 1;
    if (!a.forfeited && b.forfeited) return -1;
    
    // Sort by questions completed first
    if ((a.questionsCompleted || 0) !== (b.questionsCompleted || 0)) {
      return (b.questionsCompleted || 0) - (a.questionsCompleted || 0);
    }
    
    // Then by final score
    return (b.finalScore || 0) - (a.finalScore || 0);
  });

  // Safe user access
  const currentUserId = currentUser?.id;
  const currentUserIndex = currentUserId ? 
    sortedParticipants.findIndex(p => p.user?._id === currentUserId) : -1;
  
  const winner = sortedParticipants[0];
  const isWinner = winner && currentUserId && winner.user?._id === currentUserId;

  const getScoreColor = (score) => {
    if (!score) return 'text-gray-500';
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getMedalIcon = (position) => {
    switch (position) {
      case 0: return '🥇';
      case 1: return '🥈';
      case 2: return '🥉';
      default: return '🏅';
    }
  };

  const getStatusBadge = (participant) => {
    if (participant.forfeited) {
      return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">Forfeited</span>;
    }
    if (participant.finished) {
      return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Finished</span>;
    }
    return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">In Progress</span>;
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'Not finished';
    try {
      const date = new Date(timeString);
      return date.toLocaleTimeString();
    } catch (error) {
      return 'Invalid time';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Contest Results
          </h1>
          <p className="text-lg text-gray-600">
            Contest completed! Here are the final results.
          </p>
          {contest.endTime && (
            <p className="text-sm text-gray-500 mt-2">
              Completed at {formatTime(contest.endTime)}
            </p>
          )}
        </div>

        {/* Winner Announcement */}
        {winner && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Winner: {winner.user?.username || 'Unknown User'}
            </h2>
            <div className="flex justify-center items-center space-x-4 mb-4">
              <p className="text-lg text-gray-600">
                Problems Solved: <span className="font-bold text-green-600">
                  {winner.questionsCompleted || 0}
                </span>
              </p>
              <p className="text-lg text-gray-600">
                Final Score: <span className={`font-bold ${getScoreColor(winner.finalScore)}`}>
                  {(winner.finalScore || 0).toFixed(1)}
                </span>
              </p>
            </div>
            {isWinner && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800 font-medium">
                  🎊 Congratulations! You won this contest! 🎊
                </p>
              </div>
            )}
            {winner.forfeited && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
                <p className="text-red-800 text-sm">
                  Contest ended due to forfeit
                </p>
              </div>
            )}
          </div>
        )}

        {/* Leaderboard */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Final Leaderboard</h3>
          </div>
          
          <div className="divide-y divide-gray-200">
            {sortedParticipants.map((participant, index) => (
              <div 
                key={participant.user?._id || index}
                className={`px-6 py-4 flex items-center justify-between ${
                  participant.user?._id === currentUserId ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className="text-2xl">
                    {getMedalIcon(index)}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900">
                        {participant.user?.username || 'Unknown User'}
                      </span>
                      {participant.user?._id === currentUserId && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          You
                        </span>
                      )}
                      {getStatusBadge(participant)}
                    </div>
                    <p className="text-sm text-gray-500">
                      Questions: {participant.questionsCompleted || 0} | 
                      Submissions: {(participant.submissions || []).length}
                      {participant.finishTime && (
                        <span> | Finished: {formatTime(participant.finishTime)}</span>
                      )}
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className={`text-xl font-bold ${getScoreColor(participant.finalScore)}`}>
                    {(participant.finalScore || 0).toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-500">
                    #{index + 1}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detailed Performance - Only show if current user found */}
        {currentUserIndex !== -1 && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Performance</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  #{currentUserIndex + 1}
                </div>
                <div className="text-sm text-blue-600">Final Rank</div>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {sortedParticipants[currentUserIndex].questionsCompleted || 0}
                </div>
                <div className="text-sm text-green-600">Questions Solved</div>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {(sortedParticipants[currentUserIndex].submissions || []).length}
                </div>
                <div className="text-sm text-purple-600">Total Submissions</div>
              </div>
              
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className={`text-2xl font-bold ${getScoreColor(sortedParticipants[currentUserIndex].finalScore)}`}>
                  {(sortedParticipants[currentUserIndex].finalScore || 0).toFixed(1)}
                </div>
                <div className="text-sm text-yellow-600">Final Score</div>
              </div>
            </div>
          </div>
        )}

        {/* Contest Statistics */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Contest Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-600">
                {participants.length}
              </div>
              <div className="text-sm text-gray-500">Total Participants</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-600">
                {(contest.problems || []).length}
              </div>
              <div className="text-sm text-gray-500">Total Problems</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-600">
                {contest.duration ? Math.floor(contest.duration / 60) : 0}m
              </div>
              <div className="text-sm text-gray-500">Duration</div>
            </div>
          </div>
        </div>

        {/* Learning Recommendations */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            📚 Recommended Study Topics
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border border-gray-200 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">🔍 Data Structures</h4>
              <p className="text-sm text-gray-600 mb-2">
                Improve your understanding of arrays, trees, and graphs.
              </p>
              <a 
                href="https://usaco.guide/bronze/intro-ds" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Study on USACO Guide →
              </a>
            </div>
            
            <div className="p-4 border border-gray-200 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">⚡ Algorithms</h4>
              <p className="text-sm text-gray-600 mb-2">
                Practice sorting, searching, and dynamic programming.
              </p>
              <a 
                href="https://usaco.guide/bronze/intro-sorting" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Study on USACO Guide →
              </a>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4">
          <Button
            variant="primary"
            size="large"
            onClick={onBackToHome}
          >
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ContestResults;