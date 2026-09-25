const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { getStore } = require('../db/store');
const { publicUser } = require('../middleware/auth');
const { asyncHandler, badRequest, conflict, forbidden, notFound, paginate, validate } = require('../lib/http');
const { ROLES, EXAM_TYPES, AVATARS } = require('../lib/constants');
const { deleteUserCascade, userCard } = require('../services/users');
const { computeStudentAnalytics } = require('../services/analytics');
const { logAudit } = require('../services/audit');
const ai = require('../ai');

const router = express.Router();

const dayKey = (d) => new Date(d).toISOString().slice(0, 10);
const lastNDays = (n) => Array.from({ length: n }, (_, i) => dayKey(Date.now() - (n - 1 - i) * 86400000));

const activeAdmins = () => getStore().find('users', (u) => u.role === 'admin' && u.status === 'active');

router.get('/overview', (req, res) => {
    const store = getStore();
    const users = store.all('users');
    const attempts = store.find('attempts', (a) => a.status === 'submitted');
    const days = lastNDays(14);

    const signups = days.map((d) => ({ date: d, count: users.filter((u) => dayKey(u.createdAt) === d).length }));
    const activity = days.map((d) => ({ date: d, tests: attempts.filter((a) => dayKey(a.submittedAt) === d).length }));

    const subjectCounts = {};
    attempts.forEach((a) => a.subjects.forEach((s) => { subjectCounts[s] = (subjectCounts[s] || 0) + 1; }));

    const students = users.filter((u) => u.role === 'student');
    const top = students.map((s) => {
        const an = computeStudentAnalytics(s.id);
        return { ...userCard(s), tests: an.totals.tests, avgPercent: an.totals.avgPercent };
    }).filter((s) => s.tests > 0).sort((a, b) => b.avgPercent - a.avgPercent).slice(0, 5);

    const weekAgo = Date.now() - 7 * 86400000;
    res.json({
        counts: {
            users: users.length,
            students: students.length,
            teachers: users.filter((u) => u.role === 'teacher').length,
            admins: users.filter((u) => u.role === 'admin').length,
            suspended: users.filter((u) => u.status === 'suspended').length,
            classes: store.all('classes').length,
            assignments: store.all('assignments').length,
            questions: store.find('questions', (q) => q.status !== 'archived').length,
            customQuestions: store.find('questions', (q) => q.source !== 'bank' && q.status !== 'archived').length,
            testsTotal: attempts.length,
            testsWeek: attempts.filter((a) => new Date(a.submittedAt).getTime() > weekAgo).length,
            activeWeek: new Set(attempts.filter((a) => new Date(a.submittedAt).getTime() > weekAgo).map((a) => a.userId)).size,
            chats: store.all('chats').length
        },
        signups,
        activity,
        subjects: Object.entries(subjectCounts).map(([subject, count]) => ({ subject, count })).sort((a, b) => b.count - a.count),
        exams: EXAM_TYPES.map((e) => ({ exam: e, students: students.filter((s) => s.examType === e).length })),
        topStudents: top,
        recentAudit: store.all('audit').slice(-8).reverse()
    });
});

router.get('/users', (req, res) => {
    const q = req.query;
    const search = typeof q.search === 'string' ? q.search.trim().toLowerCase() : '';
    const items = getStore().find('users', (u) => (!q.role || u.role === q.role)
        && (!q.status || u.status === q.status)
        && (!search || u.name.toLowerCase().includes(search) || u.email.includes(search)))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const page = paginate(items, q);
    res.json({ ...page, items: page.items.map(publicUser) });
});

router.post('/users', asyncHandler(async (req, res) => {
    const store = getStore();
    const email = validate.email(req.body.email);
    if (store.findOne('users', (u) => u.email === email)) throw conflict('An account with this email already exists.');
    const password = validate.password(req.body.password);
    const user = store.insert('users', {
        name: validate.str(req.body.name, { field: 'Name', required: true, min: 2, max: 60 }),
        email,
        passwordHash: await bcrypt.hash(password, 10),
        role: validate.oneOf(req.body.role, ROLES, { field: 'Role' }),
        examType: validate.oneOf(req.body.examType, EXAM_TYPES, { field: 'Exam', fallback: 'jee' }),
        avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)],
        institution: '',
        bio: '',
        targetYear: null,
        dailyGoal: 20,
        status: 'active',
        bookmarks: [],
        tokenVersion: 0,
        lastLoginAt: null
    });
    logAudit(req.user, 'admin.user_created', user.email, { role: user.role });
    res.status(201).json({ user: publicUser(user) });
}));

router.put('/users/:id', asyncHandler(async (req, res) => {
    const store = getStore();
    const user = store.byId('users', req.params.id);
    if (!user) throw notFound('User not found.');
    const changes = {};

    if (req.body.name !== undefined) changes.name = validate.str(req.body.name, { field: 'Name', required: true, min: 2, max: 60 });
    if (req.body.examType !== undefined) changes.examType = validate.oneOf(req.body.examType, EXAM_TYPES, { field: 'Exam' });
    if (req.body.role !== undefined) changes.role = validate.oneOf(req.body.role, ROLES, { field: 'Role' });
    if (req.body.status !== undefined) changes.status = validate.oneOf(req.body.status, ['active', 'suspended'], { field: 'Status' });

    const losingAdmin = user.role === 'admin' && ((changes.role && changes.role !== 'admin') || changes.status === 'suspended');
    if (losingAdmin && user.id === req.user.id) throw forbidden('You cannot demote or suspend your own account.');
    if (losingAdmin && activeAdmins().length <= 1) throw forbidden('At least one active admin is required.');
    if (changes.role && changes.role !== user.role && user.role === 'teacher' && store.find('classes', (c) => c.teacherId === user.id).length) {
        throw badRequest('This teacher still owns classes. Delete or reassign their classes first.');
    }

    // Role or status changes invalidate existing sessions immediately.
    if ((changes.role && changes.role !== user.role) || (changes.status && changes.status !== user.status)) {
        changes.tokenVersion = (user.tokenVersion || 0) + 1;
    }
    if (changes.role && changes.role !== 'student') {
        store.all('classes').forEach((c) => { c.studentIds = c.studentIds.filter((id) => id !== user.id); });
    }
    store.update('users', user.id, changes);
    logAudit(req.user, 'admin.user_updated', user.email, { changes: Object.keys(changes).filter((k) => k !== 'tokenVersion') });
    res.json({ user: publicUser(user) });
}));

router.post('/users/:id/reset-password', asyncHandler(async (req, res) => {
    const store = getStore();
    const user = store.byId('users', req.params.id);
    if (!user) throw notFound('User not found.');
    const temp = `Temp-${crypto.randomBytes(4).toString('hex')}9`;
    user.passwordHash = await bcrypt.hash(temp, 10);
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    store.save();
    logAudit(req.user, 'admin.password_reset', user.email);
    res.json({ temporaryPassword: temp, message: 'Share this temporary password securely. The user should change it after signing in.' });
}));

router.delete('/users/:id', asyncHandler(async (req, res) => {
    const store = getStore();
    const user = store.byId('users', req.params.id);
    if (!user) throw notFound('User not found.');
    if (user.id === req.user.id) throw forbidden('Use account settings to delete your own account.');
    if (user.role === 'admin' && user.status === 'active' && activeAdmins().length <= 1) throw forbidden('At least one active admin is required.');
    deleteUserCascade(user.id);
    logAudit(req.user, 'admin.user_deleted', user.email, { role: user.role });
    res.json({ message: 'User deleted.' });
}));

router.get('/classes', (req, res) => {
    const store = getStore();
    const classes = store.all('classes').map((c) => ({
        id: c.id,
        name: c.name,
        examType: c.examType,
        code: c.code,
        archived: Boolean(c.archived),
        teacher: userCard(store.byId('users', c.teacherId)),
        studentCount: c.studentIds.length,
        assignmentCount: store.find('assignments', (a) => a.classId === c.id).length,
        createdAt: c.createdAt
    })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ classes });
});

router.get('/audit', (req, res) => {
    const q = req.query;
    const items = [...getStore().all('audit')].reverse()
        .filter((e) => (!q.action || e.action.startsWith(q.action)) && (!q.search || `${e.actorName} ${e.target}`.toLowerCase().includes(String(q.search).toLowerCase())));
    res.json(paginate(items, q));
});

router.get('/system', (req, res) => {
    const store = getStore();
    res.json({
        ai: ai.status(),
        storage: store.inMemory ? 'in-memory' : store.file,
        records: Object.fromEntries(['users', 'questions', 'attempts', 'classes', 'assignments', 'announcements', 'chats', 'audit'].map((c) => [c, store.all(c).length])),
        uptimeSec: Math.round(process.uptime()),
        node: process.version,
        env: process.env.NODE_ENV || 'development'
    });
});

module.exports = router;
