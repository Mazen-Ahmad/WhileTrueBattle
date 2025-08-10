import React, { useState } from 'react';
import Button from '../common/Button';
import Input from '../common/Input';
import { roomAPI } from '../../services/api';

const JoinRoomModal = ({ isOpen, onClose, onRoomJoined }) => {
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!roomCode.trim()) {
      setError('Please enter a room code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await roomAPI.joinRoom(roomCode.toUpperCase());
      onRoomJoined(response.data.room);
      onClose();
      setRoomCode('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to join room');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value.toUpperCase().slice(0, 6);
    setRoomCode(value);
    if (error) setError('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-2xl font-bold mb-4">Join Room</h2>
        
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <Input
            label="Room Code"
            type="text"
            value={roomCode}
            onChange={handleInputChange}
            placeholder="Enter 6-character room code"
            className="text-center text-lg font-mono tracking-widest"
            maxLength={6}
            error={error}
          />

          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={loading}
              className="flex-1"
            >
              Join Room
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JoinRoomModal;