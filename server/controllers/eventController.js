const Event = require('../models/Event');

exports.getEvents = async (req, res, next) => {
  try {
    const now = new Date();
    const events = await Event.find({})
      .sort({ isFeatured: -1, scheduledStartTime: 1, createdAt: -1 })
      .limit(100)
      .populate('winner.userId', 'name avatar')
      .populate('participants', 'name avatar');

    const normalized = events.map((event) => {
      const startTime = event.scheduledStartTime ? new Date(event.scheduledStartTime) : null;
      const endTime = event.scheduledEndTime ? new Date(event.scheduledEndTime) : null;
      const hasWinner = !!event.winner?.userId;
      let status = event.status || 'scheduled';

      if (hasWinner) {
        status = 'completed';
      } else if (endTime && endTime < now) {
        status = 'awaiting-result';
      } else if (startTime && startTime > now) {
        status = 'scheduled';
      }

      return {
        _id: event._id,
        title: event.title || 'Untitled Event',
        description: event.description || '',
        category: event.category || 'Tournament',
        scheduledStartTime: event.scheduledStartTime,
        scheduledEndTime: event.scheduledEndTime,
        prizePool: event.prizePool || '',
        pointsAwarded: Number(event.pointsAwarded || 0),
        status,
        isFeatured: !!event.isFeatured,
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
