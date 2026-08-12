const Notification = require('../models/Notification');

exports.getNotifications = async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 30, 100);
    const notifications = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    const unreadCount = await Notification.countDocuments({ userId: req.user.id, read: false });

    res.json({ notifications, unreadCount });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load notifications' });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const unreadCount = await Notification.countDocuments({ userId: req.user.id, read: false });
    res.json({ unreadCount });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load unread count' });
  }
};

exports.markRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { $set: { read: true } },
      { new: true }
    );
    if (!notification) return res.status(404).json({ message: 'Notification not found' });
    res.json({ notification });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update notification' });
  }
};

exports.markAllRead = async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.user.id, read: false }, { $set: { read: true } });
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update notifications' });
  }
};
