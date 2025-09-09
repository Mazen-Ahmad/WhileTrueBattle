import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { useTheme } from '../contexts/ThemeContext';
import Button from '../components/common/Button';
import ThemeToggle from '../components/common/ThemeToggle';
import CreateRoomModal from '../components/room/CreateRoomModal';
import JoinRoomModal from '../components/room/JoinRoomModal';
import PublicRoomsList from '../components/room/PublicRoomsList';
import RoomPage from './RoomPage';
import ContestPage from './ContestPage';
import logo from '../assets/l1.png';
const HomePage = () => {
  const { user, logout } = useAuth();
  const { connected } = useSocket();
  const { theme } = useTheme();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [currentPage, setCurrentPage] = useState('home'); // 'home', 'room', 'contest'
  const [activeRoomCode, setActiveRoomCode] = useState(null);

  const handleRoomCreated = (room) => {
  setCurrentRoom(room);
  setActiveRoomCode(room.roomCode);
  setCurrentPage('room');
};

  const handleRoomJoined = (room) => {
  setCurrentRoom(room);
  setActiveRoomCode(room.roomCode);
  setCurrentPage('room');
};

const handleStartContest = (roomCode) => {
  setActiveRoomCode(roomCode);
  setCurrentPage('contest');
};

const handleBackToHome = () => {
  setCurrentPage('home');
  setActiveRoomCode(null);
  setCurrentRoom(null);
};

const typewriterText = "If you are someone testing my platform, please use 2 different browsers, e.g. Chrome & Edge and sign up with different accounts as 2 users are needed to start a contest. Thank you & I hope you like it ^_^";
function TypewriterNote({ text, speed = 30 }) {
  const [displayed, setDisplayed] = useState('');

  useEffect(() => {
    let currentIndex = 0;
    let cancelled = false;

    function type() {
      if (cancelled) return;
      if (currentIndex <= text.length) {
        setDisplayed(text.slice(0, currentIndex));
        currentIndex++;
        setTimeout(type, speed);
      }
    }
    type();
    return () => { cancelled = true; };
  }, [text, speed]);
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center font-medium text-base text-yellow-800" style={{minHeight: '120px'}}>
      <span>
        {displayed}
        <span className="animate-blink" style={{display: 'inline-block', width: '1em'}}>|</span>
      </span>
      <style>
        {`
          @keyframes blink {
            0%, 50% { opacity: 1; }
            51%, 100% { opacity: 0; }
          }
          .animate-blink {
            animation: blink 1s infinite;
          }
        `}
      </style>
    </div>
  );
}
if (currentPage === 'room') {
  return (
    <RoomPage 
      roomCode={activeRoomCode}
      onBackToHome={handleBackToHome}
      onStartContest={handleStartContest}
    />
  );
}

if (currentPage === 'contest') {
  return (
    <ContestPage 
      roomCode={activeRoomCode}
      onBackToHome={handleBackToHome}
    />
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
                className={`h-10 w-10 mr-3 ${theme === 'neon' ? 'logo-glow' : ''}`}
              />
              <h1 className="text-xl font-bold text-gray-900">
                While(TRUE): battle
              </h1>
              <div className="ml-4 flex items-center">
                <motion.div 
                  className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}
                  animate={{ scale: connected ? [1, 1.2, 1] : 1 }}
                  transition={{ duration: 2, repeat: connected ? Infinity : 0 }}
                ></motion.div>
                <span className="ml-2 text-sm text-gray-600">
                  {connected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </motion.div>
            
            <div className="flex items-center gap-2 mr-7">
              <span className="text-sm text-gray-600">
                Welcome, <span className="font-bold">{user?.username}</span>
              </span>
              <Button variant="outline" size="small" onClick={logout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Quick Actions */}
          <motion.div 
            className="lg:col-span-1"
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-6">Quick Actions</h2>
              
              <div className="space-y-4">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    variant="primary"
                    size="large"
                    className="w-full btn-primary"
                    onClick={() => setShowCreateModal(true)}
                  >
                    Create 1v1 Room
                  </Button>
                </motion.div>
                
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    variant="outline"
                    size="large"
                    className="w-full btn-outline"
                    onClick={() => setShowJoinModal(true)}
                  >
                    Join by Code
                  </Button>
                </motion.div>
              </div>

              {/* Platform Testing Note */}
              <motion.div 
                className="mt-8 pt-6 border-t border-gray-200"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 1 }}
              >
                <TypewriterNote text={typewriterText} speed={45} />
              </motion.div>
            </div>
          </motion.div>
          

          {/* Right Column - Public Rooms */}
          <motion.div 
            className="lg:col-span-2"
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <PublicRoomsList onRoomJoined={handleRoomJoined} />
          </motion.div>
        </div>

        {/* Current Room Info (if any) */}
        {currentRoom && (
          <motion.div 
            className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <h3 className="text-lg font-medium text-blue-900 mb-2">
              Room Created/Joined Successfully!
            </h3>
            <p className="text-blue-700">
              Room Code: <span className="font-mono font-bold">{currentRoom.roomCode}</span>
            </p>
            <p className="text-sm text-blue-600 mt-1">
              Share this code with your friend or wait for someone to join from the public rooms list.
            </p>
          </motion.div>
        )}
      </main>

      {/* Modals */}
      <CreateRoomModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onRoomCreated={handleRoomCreated}
      />

      <JoinRoomModal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        onRoomJoined={handleRoomJoined}
      />
      
      <ThemeToggle position="top-right" />
    </div>
  );
};

export default HomePage;