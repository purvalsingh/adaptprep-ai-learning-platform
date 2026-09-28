const express = require('express');
const { getStore } = require('../db/store');
const { requireRole } = require('../middleware/auth');
const { asyncHandler, badRequest, forbidden, notFound, validate } = require('../lib/http');
const { loadClass, assertClassOwner } = require('../services/access');
const { userCard } = require('../services/users');
const { logAudit } = require('../services/audit');

const router = express.Router();

// Feed: platform-wide posts plus posts from the viewer's classes.
router.get('/', (req, res) => {
    const store = getStore();
    const u = req.user;
    const classIds = new Set(store.find('classes', (c) => (u.role === 'admin' ? true : c.teacherId === u.id || c.studentIds.includes(u.id))).map((c) => c.id));
    const items = store.find('announcements', (a) => a.scope === 'global' || classIds.has(a.classId))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 50)
        .map((a) => ({
            ...a,
            author: userCard(store.byId('users', a.authorId)),
            className: a.classId ? store.byId('classes', a.classId)?.name : null
        }));
    res.json({ announcements: items });
});

router.post('/', requireRole('teacher', 'admin'), asyncHandler(async (req, res) => {
    const title = validate.str(req.body.title, { field: 'Title', required: true, min: 3, max: 120 });
    const body = validate.str(req.body.body, { field: 'Message', required: true, min: 3, max: 2000 });
    let scope = 'class';
    let classId = null;
    if (req.body.classId) {
        const klass = loadClass(req.body.classId);
        assertClassOwner(req.user, klass);
        classId = klass.id;
    } else if (req.user.role === 'admin') {
        scope = 'global';
    } else {
        throw badRequest('Choose a class for this announcement.');
    }
    const a = getStore().insert('announcements', { scope, classId, authorId: req.user.id, title, body });
    logAudit(req.user, 'announcement.created', title, { scope });
    res.status(201).json({ announcement: { ...a, author: userCard(req.user) } });
}));

router.delete('/:id', requireRole('teacher', 'admin'), asyncHandler(async (req, res) => {
    const store = getStore();
    const a = store.byId('announcements', req.params.id);
    if (!a) throw notFound('Announcement not found.');
    if (req.user.role !== 'admin' && a.authorId !== req.user.id) throw forbidden('You can only delete your own announcements.');
    store.remove('announcements', a.id);
    res.json({ message: 'Announcement deleted.' });
}));

module.exports = router;
