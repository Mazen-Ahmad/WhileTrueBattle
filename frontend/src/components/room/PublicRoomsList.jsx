import React, { useState, useEffect } from 'react';
import Button from '../common/Button';
import LoadingSpinner from '../common/LoadingSpinner';
import { roomAPI } from '../../services/api';

const PublicRoomsList = ({ onRoomJoined }) => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [joiningRoom, setJoiningRoom] = useState(null);

  const fetchRooms = async () => {
    try {
      const response = await roomAPI.getPublicRooms();
      setRooms(response.data.rooms);
    } catch (err) {
      setError('Failed to load rooms');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
    const interval = setInterval(fetchRooms, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const handleJoinRoom = async (roomCode) => {
    setJoiningRoom(roomCode);
    try {
      const response = await roomAPI.joinRoom(roomCode);
      onRoomJoined(response.data.room);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to join room');
    } finally {
      setJoiningRoom(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold mb-4">Public Rooms</h3>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold">Public Rooms</h3>
        <Button size="small" onClick={fetchRooms}>
          Refresh
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {rooms.length === 0 ? (
        <p className="text-gray-500 text-center py-8">
          No public rooms available. Create one to get started!
        </p>
      ) : (
        <div className="space-y-3">
          {rooms.map((room) => (
            <div
              key={room._id}
              className="border border-gray-100 rounded-lg p-4 hover:bg-neutral-900 transition-colors duration-200"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-mono text-lg font-bold text-blue-600">
                      {room.roomCode}
                    </span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      {room.participants.length}/{room.maxParticipants} players
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-1">
                    Created by: <span className="font-medium">{room.createdBy.username}</span>
                  </p>
                  
                  <div className="flex gap-4 text-xs text-gray-500">
                    <span>{room.settings.questionsCount} questions</span>
                    <span>{room.settings.timeLimit} minutes</span>
                    <span>Difficulty: {room.settings.difficulty}</span>
                  </div>
                </div>
                
                <Button
                  size="small"
                  onClick={() => handleJoinRoom(room.roomCode)}
                  loading={joiningRoom === room.roomCode}
                  disabled={room.participants.length >= room.maxParticipants}
                >
                  {room.participants.length >= room.maxParticipants ? 'Full' : 'Join'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PublicRoomsList;