const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middlewares/authMiddleware');

const resolveJwtSecret = () => {
    return process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || process.env.JWT_REFRESH_SECRET || null;
};

const sanitizeText = (value, maxLen) => {
    const text = String(value || '')
        .replace(/[<>]/g, '')
        .replace(/[\u0000-\u001F\u007F]/g, ' ')
        .trim();

    return text.slice(0, maxLen);
};

router.get('/my', authMiddleware, async (req, res) => {
    try {
        const tickets = await Contact.find({ userId: req.user.id })
            .sort({ createdAt: -1 })
            .select('subject message status resolution createdAt');

        res.json({ tickets });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch tickets' });
    }
});

router.post('/', async (req, res) => {
    try {
        const name = sanitizeText(req.body?.name, 80);
        const email = sanitizeText(req.body?.email, 120).toLowerCase();
        const subject = sanitizeText(req.body?.subject || 'Other', 50);
        const message = sanitizeText(req.body?.message, 2000);

        if (!name || !email || !message) {
            return res.status(400).json({ error: 'name, email and message are required' });
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ error: 'Valid email is required' });
        }

        let userId = null;
        const authHeader = req.headers.authorization;
        const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

        if (token) {
            try {
                const jwtSecret = resolveJwtSecret();
                if (!jwtSecret) {
                    throw new Error('JWT secret missing');
                }
                const decoded = jwt.verify(token, jwtSecret);
                userId = decoded.id;
            } catch (e) {
                // Keep request valid for guests even if token is stale.
            }
        }

        const newContact = await Contact.create({
            userId,
            name, email, subject, message, status: 'pending'
        });
        res.status(201).json({ success: true, message: 'Message received', ticketId: newContact._id });
    } catch (error) {
        console.error('Contact form error:', error);
        res.status(500).json({ error: 'Failed to submit form' });
    }
});

module.exports = router;
