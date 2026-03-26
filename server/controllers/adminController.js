const User = require('../models/User');
const Contact = require('../models/Contact');
const AuditLog = require('../models/AuditLog');
const Video = require('../models/Video');
const SiteConfig = require('../models/SiteConfig');
const Event = require('../models/Event');

const sanitizeNote = (value) => String(value || '')
    .replace(/[<>]/g, '')
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .trim()
    .slice(0, 2000);

const ensureBadge = (user, badge) => {
    if (!Array.isArray(user.badges)) user.badges = [];
    const exists = user.badges.some((b) => b.key === badge.key || b.name === badge.name);
    if (!exists) {
        user.badges.push({
            key: badge.key,
            name: badge.name,
            tier: badge.tier || 'minor',
            description: badge.description || '',
            awardedAt: new Date(),
        });
        return true;
    }
    return false;
};

const logAdminAction = async (adminId, action, targetId, targetModel, reason = '') => {
  await AuditLog.create({ adminId, action, targetId, targetModel, reason });
};

exports.getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
        const activeUsers = await User.countDocuments({ role: 'user', isActive: { $ne: false } });
        const bannedUsers = await User.countDocuments({ role: 'user', isActive: false });
        const shadowBannedUsers = await User.countDocuments({ role: 'user', isShadowBanned: true });
        const pendingFeedbackCount = await Contact.countDocuments({ status: 'pending' });
        const resolvedFeedbackCount = await Contact.countDocuments({ status: 'resolved' });
        const pendingVideosCount = await Video.countDocuments({ status: { $in: ['pending', 'review'] } });
        const awaitingEventResultCount = await Event.countDocuments({ status: 'awaiting-result' });
        const completedEventCount = await Event.countDocuments({ status: 'completed' });
        const recentAuditCount = await AuditLog.countDocuments({ createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } });

        const topUsers = await User.find({ role: 'user' })
            .sort({ xp: -1 })
            .limit(5)
            .select('username name xp level badges')
            .lean();

        res.json({
            stats: {
                totalUsers,
                activeUsers,
                bannedUsers,
                shadowBannedUsers,
                pendingFeedbackCount,
                resolvedFeedbackCount,
                pendingVideosCount,
                awaitingEventResultCount,
                completedEventCount,
                recentAuditCount,
            },
            topUsers: topUsers.map((u) => ({
                userId: u._id,
                username: u.username || u.name || 'player',
                xp: u.xp || 0,
                level: u.level || 1,
                badgesCount: Array.isArray(u.badges) ? u.badges.length : 0,
            })),
        });
  } catch (error) {
      res.status(500).json({ error: 'Failed to fetch admin stats' });
  }
};

exports.getUsers = async (req, res) => {
  try {
            const users = await User.find({ role: 'user' }).select('name username email isShadowBanned violationCount createdAt isActive xp level badges isPrivate');
      res.json({ users });
  } catch (err) {
      res.status(500).json({ error: 'Failed to fetch users' });
  }
};

exports.moderateUser = async (req, res) => {
  try {
      const { id } = req.params;
      const { action, reason } = req.body;

      const user = await User.findById(id);
      if (!user) return res.status(404).json({ error: 'User not found' });

    if (typeof user.violationCount !== 'number') user.violationCount = 0;
    if (!Array.isArray(user.violations)) user.violations = [];

      let auditAction = '';
      switch (action) {
          case 'ban': user.isActive = false; auditAction = 'USER_BANNED'; break;
          case 'unban': user.isActive = true; auditAction = 'USER_UNBANNED'; break;
          case 'shadowban': user.isShadowBanned = true; auditAction = 'USER_SHADOWBANNED'; break;
          case 'unshadowban': user.isShadowBanned = false; auditAction = 'USER_UNBANNED'; break;
          case 'warn': 
              user.violationCount += 1; 
              user.violations.push({ reason, date: new Date(), issuedBy: req.user.id }); 
              auditAction = 'USER_WARNED'; 
              break;
          default: return res.status(400).json({ error: 'Invalid action' });
      }

      await user.save();
      await logAdminAction(req.user.id, auditAction, user._id, 'User', reason);

      res.json({ message: `User ${action} successful` });
  } catch (err) {
      res.status(500).json({ error: 'Failed to moderate user' });
  }
};

exports.getPendingVideos = async (req, res) => {
    res.json({ videos: [] });
};

exports.reviewVideo = async (req, res) => {
   try {
       const { id } = req.params;
       const { status, reason } = req.body;

       const auditAction = status === 'approved' ? 'VIDEO_APPROVED' : 'VIDEO_REJECTED';
       await logAdminAction(req.user.id, auditAction, id, 'Video', reason);

       res.json({ message: `Video ${status}` });
   } catch (err) {
       res.status(500).json({ error: 'Failed to review video' });
   }
};

exports.getPendingFeedback = async (req, res) => {
    try {
        const statusFilter = req.query.status || 'pending';
        const feedback = await Contact.find({ status: statusFilter }).sort({ createdAt: -1 });
        res.json({ feedback });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch feedback' });
    }
};

exports.resolveFeedback = async (req, res) => {
    try {
        const { id } = req.params;
        const resolution = sanitizeNote(req.body?.resolution || 'Handled by admin');

        const ticket = await Contact.findById(id);
        if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

        ticket.status = 'resolved';
        ticket.resolution = resolution;
        await ticket.save();

        await logAdminAction(req.user.id, 'FEEDBACK_RESOLVED', id, 'Contact', resolution);

        res.json({ message: 'Ticket resolved' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to resolve feedback' });
    }
};

exports.getAuditLogs = async (req, res) => {
    try {
        const limit = Math.min(100, Math.max(5, Number(req.query.limit || 30)));
        const logs = await AuditLog.find({})
            .sort({ createdAt: -1 })
            .limit(limit)
            .populate('adminId', 'name username')
            .lean();

        res.json({ logs });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch audit logs' });
    }
};

exports.grantUserBadge = async (req, res) => {
    try {
        const { id } = req.params;
        const { key, name, tier = 'minor', description = '', xpBonus = 0, reason = '' } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Badge name is required' });
        }

        const user = await User.findById(id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const badge = {
            key: key || String(name).toLowerCase().replace(/\s+/g, '-'),
            name,
            tier: ['minor', 'major', 'super'].includes(tier) ? tier : 'minor',
            description,
        };

        const added = ensureBadge(user, badge);
        const bonus = Number(xpBonus || 0);
        if (bonus > 0) {
            user.xp = (user.xp || 0) + bonus;
            user.level = Math.max(user.level || 1, Math.floor(Math.sqrt((user.xp || 0) / 100)) + 1);
        }

        await user.save();
        await logAdminAction(req.user.id, 'USER_BADGE_GRANTED', user._id, 'User', reason || badge.name);

        res.json({ message: added ? 'Badge granted' : 'Badge already present', user });
    } catch (err) {
        res.status(500).json({ error: 'Failed to grant badge' });
    }
};

exports.grantUserXp = async (req, res) => {
    try {
        const { id } = req.params;
        const { xpDelta, reason = '' } = req.body;
        const delta = Number(xpDelta || 0);

        if (!Number.isFinite(delta) || delta === 0) {
            return res.status(400).json({ error: 'xpDelta must be a non-zero number' });
        }

        const user = await User.findById(id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        user.xp = Math.max(0, (user.xp || 0) + delta);
        user.level = Math.max(user.level || 1, Math.floor(Math.sqrt((user.xp || 0) / 100)) + 1);
        await user.save();

        await logAdminAction(req.user.id, 'USER_XP_GRANTED', user._id, 'User', reason || `xpDelta=${delta}`);

        res.json({ message: 'XP updated', user });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update XP' });
    }
};

exports.updateUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role, reason = '' } = req.body;

        if (!['user', 'admin'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role' });
        }

        const user = await User.findById(id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        user.role = role;
        await user.save();
        await logAdminAction(req.user.id, 'USER_ROLE_UPDATED', user._id, 'User', reason || `role=${role}`);

        res.json({ message: 'Role updated', user });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update role' });
    }
};

exports.approveVideo = async (req, res) => {
    try {
        const { id } = req.params;

        const video = await Video.findById(id);
        if (!video) return res.status(404).json({ error: 'Video not found' });

        video.status = 'approved';
        await video.save();

        await logAdminAction(req.user.id, 'VIDEO_APPROVED', id, 'Video');

        res.json({ message: 'Video approved', video });
    } catch (err) {
        res.status(500).json({ error: 'Failed to approve video' });
    }
};

exports.deleteVideo = async (req, res) => {
    try {
        const { id } = req.params;

        const deleted = await Video.findByIdAndDelete(id);
        if (!deleted) return res.status(404).json({ error: 'Video not found' });

        await logAdminAction(req.user.id, 'VIDEO_DELETED', id, 'Video');

        res.json({ message: 'Video deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete video' });
    }
};

exports.getSiteConfig = async (req, res) => {
    try {
        const { key } = req.params;
        const config = (await SiteConfig.findOne()) || (await SiteConfig.create({}));

        if (!(key in config.toObject())) {
            return res.status(404).json({ error: 'Config key not found' });
        }

        res.json({ key, value: config[key] });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch config' });
    }
};

exports.updateSiteConfig = async (req, res) => {
    try {
        const { key } = req.params;
        const { value } = req.body;

        const allowedKeys = ['maintenanceMode', 'announcement'];
        if (!allowedKeys.includes(key)) {
            return res.status(400).json({ error: 'Invalid config key' });
        }

        const config = (await SiteConfig.findOne()) || (await SiteConfig.create({}));
        config[key] = value;
        await config.save();

        await logAdminAction(req.user.id, 'SITE_CONFIG_UPDATED', config._id, 'SiteConfig', key);

        res.json({ message: 'Config updated', key, value: config[key] });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update config' });
    }
};

exports.setEventWinner = async (req, res) => {
    try {
        const { eventId } = req.params;
        const { userId, username } = req.body;

        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }

        const winnerUser = await User.findById(userId);
        if (!winnerUser) return res.status(404).json({ error: 'Winner user not found' });

        const event = await Event.findByIdAndUpdate(
            eventId,
            {
                $set: {
                    winner: {
                        userId,
                        username: username || winnerUser.username || winnerUser.name || 'Winner',
                    },
                    status: 'completed',
                },
            },
            { new: true }
        );

        if (!event) return res.status(404).json({ error: 'Event not found' });

        const bonus = Number(event.pointsAwarded || 0);
        winnerUser.xp = (winnerUser.xp || 0) + (bonus > 0 ? bonus : 250);
        winnerUser.level = Math.max(winnerUser.level || 1, Math.floor(Math.sqrt((winnerUser.xp || 0) / 100)) + 1);
        ensureBadge(winnerUser, {
          key: 'event-victor',
          name: 'Event Victor',
          tier: 'major',
          description: 'Won a featured GameVerse event.',
        });
        await winnerUser.save();

        await logAdminAction(req.user.id, 'EVENT_WINNER_SET', eventId, 'Event', userId);

        res.json({ message: 'Event winner updated', event });
    } catch (err) {
        res.status(500).json({ error: 'Failed to set event winner' });
    }
};
