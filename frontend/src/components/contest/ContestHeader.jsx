import React from 'react';
import Button from '../common/Button';

const ContestHeader = ({ contest, timeLeft, onEndContest, onBackToHome, userFinished, waitingForOthers }) => {
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeColor = () => {
    if (timeLeft > 300) return 'text-green-600';
    if (timeLeft > 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-gray-900">
              Contest Arena
            </h1>
            <span className="text-sm text-gray-500">
              {contest && (
                <>
                  Room: <span className="font-mono font-bold">{contest.roomId}</span>
                </>
              )}
            </span>
          </div>

          <div className="flex items-center space-x-6">
            {/* Timer */}
            <div className="text-center">
              <div className={`text-2xl font-mono font-bold ${getTimeColor()}`}>
                {formatTime(timeLeft)}
              </div>
              <div className="text-xs text-gray-500">Time Left</div>
            </div>

            {/* Participant count */}
            {contest && (
              <div className="text-center">
                <div className="text-lg font-bold text-gray-700">
                  {contest.participants.length}/2
                </div>
                <div className="text-xs text-gray-500">Participants</div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center space-x-2">
              {!userFinished && !waitingForOthers && (
                <>
                  <Button
                    onClick={() => onEndContest(false)}
                    variant="primary"
                    size="small"
                  >
                    Finish Contest
                  </Button>
                  <Button
                    onClick={() => onEndContest(true)}
                    variant="danger"
                    size="small"
                  >
                    Forfeit
                  </Button>
                </>
              )}
              
              <Button
                onClick={onBackToHome}
                variant="secondary"
                size="small"
              >
                Back to Home
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default ContestHeader;
