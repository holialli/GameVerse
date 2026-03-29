const Event = require('../models/Event');

const allowedCategories = ['Tournament', 'Showmatch', 'Community', 'Qualifier', 'Seasonal'];

const isValidDate = (value) => value instanceof Date && !Number.isNaN(value.getTime());

const validateEventPayload = (body) => {
  const title = String(body?.title || '').trim();
  const description = String(body?.description || '').trim();
  const category = String(body?.category || '').trim();
  const prizePool = String(body?.prizePool || '').trim();

  const hasPoints = !(body?.pointsAwarded === undefined || body?.pointsAwarded === null || String(body.pointsAwarded).trim() === '');
  const pointsAwarded = hasPoints ? Number(body.pointsAwarded) : NaN;

  const startRaw = body?.scheduledStartTime;
  const endRaw = body?.scheduledEndTime;
  const scheduledStartTime = startRaw ? new Date(startRaw) : null;
  const scheduledEndTime = endRaw ? new Date(endRaw) : null;

  const missingFields = [];
  if (!title) missingFields.push('title');
  if (!description) missingFields.push('description');
  if (!category) missingFields.push('category');
  if (!startRaw) missingFields.push('scheduledStartTime');
  if (!endRaw) missingFields.push('scheduledEndTime');
  if (!prizePool) missingFields.push('prizePool');
  if (!hasPoints) missingFields.push('pointsAwarded');

  if (missingFields.length > 0) {
    return {
      ok: false,
      status: 400,
      message: `Missing required fields: ${missingFields.join(', ')}`,
    };
  }

  if (!allowedCategories.includes(category)) {
    return {
      ok: false,
      status: 400,
      message: 'Invalid category provided',
    };
  }

  if (!isValidDate(scheduledStartTime) || !isValidDate(scheduledEndTime)) {
    return {
      ok: false,
      status: 400,
      message: 'Start and end dates must be valid date values',
    };
  }

  const startYear = scheduledStartTime.getUTCFullYear();
  const endYear = scheduledEndTime.getUTCFullYear();
  if (startYear < 2000 || endYear < 2000 || startYear > 2100 || endYear > 2100) {
    return {
      ok: false,
      status: 400,
      message: 'Please provide realistic dates (year must be between 2000 and 2100)',
    };
  }

  if (scheduledEndTime <= scheduledStartTime) {
    return {
      ok: false,
      status: 400,
      message: 'End time must be after start time',
    };
  }

  if (!Number.isFinite(pointsAwarded) || pointsAwarded < 0) {
    return {
      ok: false,
      status: 400,
      message: 'Points awarded must be a valid number greater than or equal to 0',
    };
  }

  return {
    ok: true,
    payload: {
      title,
      description,
      category,
      scheduledStartTime,
      scheduledEndTime,
      prizePool,
      pointsAwarded: Math.max(0, pointsAwarded),
    },
  };
};

exports.getEvents = async (req, res, next) => {
  try {
    const now = new Date();
    const events = await Event.find({
      $or: [
        { approvalStatus: 'approved' },
        { approvalStatus: { $exists: false } },
      ],
    })
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
        participantIds: Array.isArray(event.participants)
          ? event.participants.map((p) => String(p?._id || p))
          : [],
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

exports.createEventRequest = async (req, res) => {
  try {
    const validation = validateEventPayload(req.body);
    if (!validation.ok) {
      return res.status(validation.status).json({ message: validation.message });
    }

    const {
      title,
      description,
      category,
      scheduledStartTime,
      scheduledEndTime,
      prizePool,
      pointsAwarded,
    } = validation.payload;

    const event = await Event.create({
      title,
      description,
      category,
      scheduledStartTime,
      scheduledEndTime,
      prizePool,
      pointsAwarded,
      status: 'scheduled',
      approvalStatus: 'pending',
      requestedBy: req.user.id,
    });

    return res.status(201).json({ message: 'Tournament request submitted for admin approval', eventId: event._id });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to submit tournament request' });
  }
};

exports.joinEventRequest = async (req, res) => {
  try {
    const { eventId } = req.params;
    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.approvalStatus && event.approvalStatus !== 'approved') {
      return res.status(400).json({ message: 'Event is not approved yet' });
    }

    if (event.status === 'completed') {
      return res.status(400).json({ message: 'This event is already completed' });
    }

    const alreadyParticipant = Array.isArray(event.participants)
      && event.participants.some((id) => String(id) === String(req.user.id));
    if (alreadyParticipant) {
      return res.status(200).json({ message: 'Already participating in this event', alreadyJoined: true });
    }

    const existingRequest = Array.isArray(event.joinRequests)
      ? event.joinRequests.find((reqItem) => String(reqItem.userId) === String(req.user.id))
      : null;

    if (existingRequest && existingRequest.status === 'pending') {
      return res.status(200).json({ message: 'Join request already pending', alreadyRequested: true });
    }

    if (existingRequest && existingRequest.status === 'rejected') {
      existingRequest.status = 'pending';
      existingRequest.requestedAt = new Date();
      existingRequest.reviewedAt = null;
      existingRequest.reviewedBy = null;
    } else if (!existingRequest) {
      event.joinRequests.push({
        userId: req.user.id,
        status: 'pending',
        requestedAt: new Date(),
      });
    }

    await event.save();
    return res.json({ message: 'Join request sent to admin for approval' });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to submit join request' });
  }
};

exports.createEvent = async (req, res) => {
  try {
    const validation = validateEventPayload(req.body);
    if (!validation.ok) {
      return res.status(validation.status).json({ message: validation.message });
    }

    const {
      title,
      description,
      category,
      scheduledStartTime,
      scheduledEndTime,
      prizePool,
      pointsAwarded,
    } = validation.payload;

    const event = await Event.create({
      title,
      description,
      category,
      scheduledStartTime,
      scheduledEndTime,
      prizePool,
      pointsAwarded,
      status: 'scheduled',
      participants: [req.user.id],
    });

    return res.status(201).json({ message: 'Event created', event });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to create event' });
  }
};

exports.joinEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.status === 'completed') {
      return res.status(400).json({ message: 'This event is already completed' });
    }

    const alreadyJoined = Array.isArray(event.participants)
      && event.participants.some((id) => String(id) === String(req.user.id));

    if (alreadyJoined) {
      return res.status(200).json({ message: 'Already participating in this event', alreadyJoined: true });
    }

    event.participants.push(req.user.id);
    await event.save();

    return res.json({ message: 'Joined event successfully', eventId: event._id });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to join event' });
  }
};
