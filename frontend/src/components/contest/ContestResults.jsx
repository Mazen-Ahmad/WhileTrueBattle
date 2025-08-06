import React from 'react';
import Button from '../common/Button';

const ContestResults = ({ contest, onBackToHome, currentUser }) => {
  // Sort participants by final score
  const sortedParticipants = [...contest.participants].sort((a, b) => b.finalScore - a.finalScore);
  
  const currentUserIndex = sortedParticipants.findIndex(p => p.user._id === currentUser.id);
  const winner = sortedParticipants[0];
  const isWinner = winner.user._id === currentUser.id;

  const getScoreColor = (score) => {
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
        </div>

        {/* Winner Announcement */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Winner: {winner.user.username}
          </h2>
          <p className="text-lg text-gray-600 mb-4">
            Final Score: <span className={`font-bold ${getScoreColor(winner.finalScore)}`}>
              {winner.finalScore.toFixed(1)}
            </span>
          </p>
          {isWinner && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800 font-medium">
                🎊 Congratulations! You won this contest! 🎊
              </p>
            </div>
          )}
        </div>

        {/* Leaderboard */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Final Leaderboard</h3>
          </div>
          
          <div className="divide-y divide-gray-200">
            {sortedParticipants.map((participant, index) => (
              <div 
                key={participant.user._id}
                className={`px-6 py-4 flex items-center justify-between ${
                  participant.user._id === currentUser.id ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className="text-2xl">
                    {getMedalIcon(index)}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900">
                        {participant.user.username}
                      </span>
                      {participant.user._id === currentUser.id && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          You
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      Questions: {participant.questionsCompleted} | 
                      Submissions: {participant.submissions.length}
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className={`text-xl font-bold ${getScoreColor(participant.finalScore)}`}>
                    {participant.finalScore.toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-500">
                    #{index + 1}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detailed Performance */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Performance</h3>
          
          {currentUserIndex !== -1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  #{currentUserIndex + 1}
                </div>
                <div className="text-sm text-blue-600">Final Rank</div>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {sortedParticipants[currentUserIndex].questionsCompleted}
                </div>
                <div className="text-sm text-green-600">Questions Solved</div>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {sortedParticipants[currentUserIndex].submissions.length}
                </div>
                <div className="text-sm text-purple-600">Total Submissions</div>
              </div>
              
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className={`text-2xl font-bold ${getScoreColor(sortedParticipants[currentUserIndex].finalScore)}`}>
                  {sortedParticipants[currentUserIndex].finalScore.toFixed(1)}
                </div>
                <div className="text-sm text-yellow-600">Final Score</div>
              </div>
            </div>
          )}
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
          
          <Button
            variant="outline"
            size="large"
            onClick={() => window.location.reload()}
          >
            Start New Contest
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ContestResults;