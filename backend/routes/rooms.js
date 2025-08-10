const express = require('express');
const Room = require('../models/Room');
const auth = require('../middleware/auth');
const router = express.Router();

// Create room
router.post('/create', auth, async (req, res) => {
  try {
    const { isPublic, settings } = req.body;
    
    const room = new Room({
      createdBy: req.user._id,
      isPublic: isPublic || false,
      settings: settings || {}
    });

    // Generate unique room code
    let roomCode;
    let isUnique = false;
    
    while (!isUnique) {
      roomCode = room.generateRoomCode();
      const existing = await Room.findOne({ roomCode });
      if (!existing) {
        isUnique = true;
      }
    }
    
    room.roomCode = roomCode;
    
    // Add creator as first participant
    room.participants.push({
      user: req.user._id,
      joinedAt: new Date()
    });

    await room.save();
    await room.populate('participants.user', 'username email');
    await room.populate('createdBy', 'username email');

    res.status(201).json({
      message: 'Room created successfully',
      room
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Join room by code
router.post('/join/:roomCode', auth, async (req, res) => {
  try {
    const { roomCode } = req.params;
    
    const room = await Room.findOne({ roomCode, status: 'waiting' })
      .populate('participants.user', 'username email')
      .populate('createdBy', 'username email');

    if (!room) {
      return res.status(404).json({ message: 'Room not found or already started' });
    }

    // Check if room is full
    if (room.participants.length >= room.maxParticipants) {
      return res.status(400).json({ message: 'Room is full' });
    }

    // Check if user is already in room
    const alreadyJoined = room.participants.some(
      p => p.user._id.toString() === req.user._id.toString()
    );

    if (alreadyJoined) {
      return res.status(400).json({ message: 'You are already in this room' });
    }

    // Add user to room
    room.participants.push({
      user: req.user._id,
      joinedAt: new Date()
    });

    await room.save();
    await room.populate('participants.user', 'username email');

    res.json({
      message: 'Joined room successfully',
      room
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get public rooms
router.get('/public', async (req, res) => {
  try {
    const rooms = await Room.find({ 
      isPublic: true, 
      status: 'waiting',
      $expr: { $lt: [{ $size: '$participants' }, '$maxParticipants'] }
    })
    .populate('createdBy', 'username')
    .populate('participants.user', 'username')
    .sort({ createdAt: -1 })
    .limit(20);

    res.json({ rooms });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get room details
router.get('/:roomCode', auth, async (req, res) => {
  try {
    const { roomCode } = req.params;
    
    const room = await Room.findOne({ roomCode })
      .populate('participants.user', 'username email stats')
      .populate('createdBy', 'username email');

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Check if user is in room
    const isParticipant = room.participants.some(
      p => p.user._id.toString() === req.user._id.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({ message: 'You are not a participant in this room' });
    }

    res.json({ room });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;