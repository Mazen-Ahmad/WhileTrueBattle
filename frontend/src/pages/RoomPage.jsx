import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { useTheme } from '../contexts/ThemeContext';
import Button from '../components/common/Button';
import ThemeToggle from '../components/common/ThemeToggle';
import LoadingSpinner from '../components/common/LoadingSpinner';
import api from '../services/api';
import logo from '../assets/l1.png';

const RoomPage = ({ roomCode, onBackToHome, onStartContest }) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const { theme } = useTheme();
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
      <motion.header 
        className="bg-white shadow-sm border-b"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <motion.div 
              className="flex items-center"
              whileHover={{ scale: 1.02 }}
            >
              <img 
                src={logo} 
                alt="Logo" 
                className={`h-8 w-8 mr-3 ${theme === 'neon' ? 'logo-glow' : ''}`}
              />
              <h1 className="text-xl font-bold text-gray-900">
                Room: <span className="font-mono">{roomCode}</span>
              </h1>
            </motion.div>
            <Button variant="outline" size="small" onClick={onBackToHome}>
              Leave Room
            </Button>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Room Settings */}
          <motion.div 
            className="bg-white rounded-lg shadow-md p-6"
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
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
            <motion.div 
              className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg"
              whileHover={{ scale: 1.02 }}
            >
              <h3 className="text-sm font-medium text-blue-900 mb-2">
                Share Room Code
              </h3>
              <div className="flex items-center space-x-2">
                <code className="text-lg font-mono font-bold text-blue-600 bg-white px-3 py-1 rounded border">
                  {roomCode}
                </code>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    size="small"
                    onClick={() => navigator.clipboard.writeText(roomCode)}
                  >
                    Copy
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>

          {/* Participants */}
          <motion.div 
            className="bg-white rounded-lg shadow-md p-6"
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
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
              <AnimatePresence>
                {room?.participants?.map((participant, index) => (
                  <motion.div 
                    key={participant.user._id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
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
                      </div>
                      <div className="text-sm text-gray-500">
                        {participant.user._id === user.id && (
                          <span className="text-blue-600">(You) </span>
                        )}
                        {participant.user._id === room.createdBy._id && (
                          <span className="text-green-600 ml-1">(Creator)</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <motion.div 
                    className="w-3 h-3 bg-green-400 rounded-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  ></motion.div>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {/* Empty slots */}
              {Array.from({ length: 2 - (room?.participants?.length || 0) }).map((_, index) => (
                <motion.div 
                  key={`empty-${index}`}
                  className="flex items-center p-3 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300"
                  initial={{ opacity: 0.5 }}
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-sm text-gray-400">?</span>
                    </div>
                    <span className="text-gray-500">Waiting for player...</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div 
              className="mt-6 bg-red-50 border border-red-400 text-red-700 p-4 rounded"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Start Contest Button */}
        <motion.div 
          className="mt-8 text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          {canStartContest ? (
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                variant="primary"
                size="large"
                onClick={handleStartContest}
                loading={startingContest}
                className="btn-primary"
              >
                Start Contest
              </Button>
            </motion.div>
          ) : (
            <motion.div 
              className="text-gray-500"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {!isCreator 
                ? "Waiting for room creator to start the contest..."
                : room?.participants?.length < 2
                ? "Need at least 2 participants to start contest"
                : "You can start the contest now!"
              }
            </motion.div>
          )}
        </motion.div>
      </main>
      
      <ThemeToggle position="bottom-right" />
    </div>
  );
};

export default RoomPage;