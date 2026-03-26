const Event = require('../models/Event');

exports.getEvents = async (req, res, next) => {
  try {
    const now = new Date();
    const events = await Event.find({})
      .sort({ scheduledEndTime: 1, createdAt: -1 })
      .limit(100)
      .populate('winner.userId', 'name avatar')
      .populate('participants', 'name avatar');

    const normalized = events.map((event) => {
      const endTime = event.scheduledEndTime ? new Date(event.scheduledEndTime) : null;
      const hasWinner = !!event.winner?.userId;
      let status = 'scheduled';

      if (hasWinner) {
        status = 'completed';
      } else if (endTime && endTime < now) {
        status = 'awaiting-result';
      }

      return {
        _id: event._id,
        title: event.title || 'Untitled Event',
        scheduledEndTime: event.scheduledEndTime,
        status,
        participantCount: Array.isArray(event.participants) ? event.participants.length : 0,
        winner: event.winner?.userId
          ? {
              userId: event.winner.userId._id || event.winner.userId,
              username: event.winner.username || event.winner.userId.name || 'Unknown',
              avatar: event.winner.userId.avatar || null,
            }
          : null,
      };
    });

    res.json({ events: normalized });
  } catch (err) {
    next(err);
  }
};
