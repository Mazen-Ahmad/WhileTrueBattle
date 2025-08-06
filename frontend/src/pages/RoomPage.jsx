import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';
import api from '../services/api';

const RoomPage = ({ roomCode, onBackToHome, onStartContest }) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [startingContest, setStartingContest] = useState(false);

  const fetchRoom = async () => {
    try {
      const response = await api.get(`/rooms/${roomCode}`);
      setRoom(response.data.room);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load room');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoom();
  }, [roomCode]);

  useEffect(() => {
    if (socket && roomCode) {
      socket.emit('join-room', roomCode, user.id);

      socket.on('user-joined', (data) => {
        fetchRoom(); // Refresh room data
      });

      socket.on('user-left', (data) => {
        fetchRoom(); // Refresh room data
      });

      socket.on('contest-started', (contestData) => {
        onStartContest(roomCode);
      });

      return () => {
        socket.off('user-joined');
        socket.off('user-left');
        socket.off('contest-started');
      };
    }
  }, [socket, roomCode, user.id]);

  const handleStartContest = async () => {
    setStartingContest(true);
    try {
      const response = await api.post(`/contests/start/${roomCode}`);
      
      // Emit socket event to notify all participants
      if (socket) {
        socket.emit('start-contest', roomCode);
      }
      
      onStartContest(roomCode);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start contest');
      setStartingContest(false);
    }
  };

  const isCreator = room?.createdBy?._id === user?.id;
  const canStartContest = isCreator && room?.participants?.length >= 2;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (error && !room) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">{error}</div>
          <Button onClick={onBackToHome}>Back to Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold text-gray-900">
              Room: <span className="font-mono">{roomCode}</span>
            </h1>
            <Button variant="outline" size="small" onClick={onBackToHome}>
              Leave Room
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Room Settings */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">Contest Settings</h2>
            
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Questions:</span>
                <span className="font-medium">{room?.settings?.questionsCount}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Time Limit:</span>
                <span className="font-medium">{room?.settings?.timeLimit} minutes</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Difficulty:</span>
                <span className="font-medium">{room?.settings?.difficulty}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Room Type:</span>
                <span className="font-medium">
                  {room?.isPublic ? 'Public' : 'Private'}
                </span>
              </div>
            </div>

            {/* Room Code for Sharing */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-sm font-medium text-blue-900 mb-2">
                Share Room Code
              </h3>
              <div className="flex items-center space-x-2">
                <code className="text-lg font-mono font-bold text-blue-600 bg-white px-3 py-1 rounded border">
                  {roomCode}
                </code>
                <Button
                  size="small"
                  onClick={() => navigator.clipboard.writeText(roomCode)}
                >
                  Copy
                </Button>
              </div>
            </div>
          </div>

          {/* Participants */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                Participants ({room?.participants?.length || 0}/2)
              </h2>
              
              {room?.participants?.length < 2 && (
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                  Waiting for players
                </span>
              )}
            </div>

            <div className="space-y-3">
              {room?.participants?.map((participant, index) => (
                <div 
                  key={participant.user._id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">
                        {participant.user.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {participant.user.username}
                        {participant.user._id === user.id && (
                          <span className="ml-2 text-xs text-blue-600">(You)</span>
                        )}
                        {participant.user._id === room.createdBy._id && (
                          <span className="ml-2 text-xs text-green-600">(Creator)</span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        Wins: {participant.user.stats?.wins || 0} | 
                        Losses: {participant.user.stats?.losses || 0}
                      </div>
                    </div>
                  </div>
                  
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                </div>
              ))}
              
              {/* Empty slots */}
              {Array.from({ length: 2 - (room?.participants?.length || 0) }).map((_, index) => (
                <div 
                  key={`empty-${index}`}
                  className="flex items-center p-3 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-sm text-gray-400">?</span>
                    </div>
                    <span className="text-gray-500">Waiting for player...</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-6 bg-red-50 border border-red-400 text-red-700 p-4 rounded">
            {error}
          </div>
        )}

        {/* Start Contest Button */}
        <div className="mt-8 text-center">
          {canStartContest ? (
            <Button
              variant="primary"
              size="large"
              onClick={handleStartContest}
              loading={startingContest}
            >
              Start Contest
            </Button>
          ) : (
            <div className="text-gray-500">
              {!isCreator 
                ? "Waiting for room creator to start the contest..."
                : room?.participants?.length < 2
                ? "Need at least 2 participants to start contest"
                : "You can start the contest now!"
              }
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default RoomPage;