const axios = require('axios');
const crypto = require('crypto');
const Video = require('../models/Video');

// Strict URL Validators
const YT_REGEX = /^(https?:\/\/)?((www\.)?(youtube\.com|youtu\.be))\/.+$/;
const TWITCH_REGEX = /^(https?\:\/\/)?(www\.twitch\.tv)\/videos\/.+$/;

const extractYouTubeVideoId = (rawUrl) => {
  const parsed = new URL(rawUrl);
  const hostname = parsed.hostname.toLowerCase();

  if (hostname.includes('youtu.be')) {
    return parsed.pathname.split('/').filter(Boolean).pop() || '';
  }

  const directParam = parsed.searchParams.get('v');
  if (directParam) return directParam;

  const parts = parsed.pathname.split('/').filter(Boolean);
  const shortsIndex = parts.indexOf('shorts');
  if (shortsIndex >= 0 && parts[shortsIndex + 1]) return parts[shortsIndex + 1];

  const embedIndex = parts.indexOf('embed');
  if (embedIndex >= 0 && parts[embedIndex + 1]) return parts[embedIndex + 1];

  return parts.pop() || '';
};

exports.submitVideo = async (req, res, next) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required', ref: crypto.randomUUID() });

    let platform = '';
    let videoId = '';
    let oEmbedUrl = '';

    if (YT_REGEX.test(url)) {
      platform = 'youtube';
      videoId = extractYouTubeVideoId(url);
      if (!videoId) {
        return res.status(400).json({ error: 'Could not parse YouTube video id.', ref: crypto.randomUUID() });
      }
      oEmbedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    } else if (TWITCH_REGEX.test(url)) {
      platform = 'twitch';
      videoId = url.split('/').pop();
      // Twitch oEmbed URL formatting
      oEmbedUrl = `https://api.twitch.tv/v5/oembed?url=${encodeURIComponent(url)}`;
    } else {
      return res.status(400).json({ error: 'Invalid URL. Only youtube.com/watch and twitch.tv/videos supported.', ref: require('crypto').randomUUID() });
    }

    // Fetch Metadata without storing files
    const oEmbedRes = await axios.get(oEmbedUrl);
    const { title, thumbnail_url, author_name } = oEmbedRes.data;

    const video = await Video.create({
      url,
      platform,
      videoId,
      title,
      thumbnailUrl: thumbnail_url,
      channelName: author_name,
      uploadedBy: req.user.id,
      status: 'pending'
    });

    res.status(201).json({ message: 'Video submitted and awaiting approval', id: video._id });
  } catch (error) {
    console.error('oEmbed/Submit Error:', error.message);
    res.status(400).json({ error: 'Failed to fetch video metadata or duplicate URL.', ref: require('crypto').randomUUID() });
  }
};

exports.getVideos = async (req, res, next) => {
  try {
    // Phase 3 requirement: Cursor-based pagination (no offset counting)
    const { cursor, limit = 10 } = req.query;
    const now = new Date();

    await Video.updateMany(
      { status: 'approved', activeUntil: { $ne: null, $lte: now } },
      { $set: { status: 'expired' } }
    );
    
    let query = {
      status: 'approved',
      $or: [
        { activeUntil: null },
        { activeUntil: { $gt: now } },
      ],
    }; 
    
    if (cursor) {
       // Filter documents older than the cursor (_id is monotonic)
       query._id = { $lt: cursor }; 
    }

    const videos = await Video.find(query)
      .sort({ _id: -1 })
      .limit(Number(limit))
      .populate('uploadedBy', 'name username');

    const nextCursor = videos.length > 0 ? videos[videos.length - 1]._id : null;

    res.json({ videos, nextCursor });
  } catch (error) {
    next(error);
  }
};
