const express = require('express');
const crypto = require('crypto');
const { getStore } = require('../db/store');
const { requireRole } = require('../middleware/auth');
const { asyncHandler, badRequest, conflict, notFound, validate } = require('../lib/http');
const { EXAM_TYPES } = require('../lib/constants');
const { loadClass, assertClassOwner, assertClassMember } = require('../services/access');
const { computeClassAnalytics, computeStudentAnalytics } = require('../services/analytics');
const { userCard } = require('../services/users');
const { logAudit } = require('../services/audit');
const ai = require('../ai');

const router = express.Router();

// Unambiguous characters only (no 0/O, 1/I) so codes are easy to share aloud.
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const newCode = () => {
    const store = getStore();
    for (;;) {
        const code = Array.from(crypto.randomBytes(6), (b) => CODE_CHARS[b % CODE_CHARS.length]).join('');
        if (!store.findOne('classes', (c) => c.code === code)) return code;
    }
};

const classSummary = (c, viewer) => {
    const store = getStore();
    const assignments = store.find('assignments', (a) => a.classId === c.id);
    const now = Date.now();
    const summary = {
        id: c.id,
        name: c.name,
        description: c.description,
        examType: c.examType,
        archived: Boolean(c.archived),
        teacher: userCard(store.byId('users', c.teacherId)),
        studentCount: c.studentIds.length,
        assignmentCount: assignments.length,
        createdAt: c.createdAt
    };
    if (viewer.role !== 'student') summary.code = c.code;
    if (viewer.role === 'student') {
        summary.pendingAssignments = assignments.filter((a) => (!a.dueAt || new Date(a.dueAt).getTime() > now)
            && !store.findOne('attempts', (x) => x.assignmentId === a.id && x.userId === viewer.id && x.status === 'submitted')).length;
    }
    return summary;
};

router.get('/', (req, res) => {
    const store = getStore();
    const u = req.user;
    const classes = store.find('classes', (c) => (u.role === 'admin' ? true : u.role === 'teacher' ? c.teacherId === u.id : c.studentIds.includes(u.id)))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .map((c) => classSummary(c, u));
    res.json({ classes });
});

router.post('/', requireRole('teacher', 'admin'), asyncHandler(async (req, res) => {
    const klass = getStore().insert('classes', {
        name: validate.str(req.body.name, { field: 'Class name', required: true, min: 3, max: 80 }),
        description: validate.str(req.body.description, { field: 'Description', max: 300 }),
        examType: validate.oneOf(req.body.examType, EXAM_TYPES, { field: 'Exam' }),
        teacherId: req.user.id,
        studentIds: [],
        code: newCode(),
        archived: false
    });
    logAudit(req.user, 'class.created', klass.name);
    res.status(201).json({ class: classSummary(klass, req.user) });
}));

router.post('/join', requireRole('student'), asyncHandler(async (req, res) => {
    const store = getStore();
    const code = validate.str(req.body.code, { field: 'Class code', required: true, max: 12 }).toUpperCase();
    const klass = store.findOne('classes', (c) => c.code === code && !c.archived);
    if (!klass) throw notFound('No active class found with that code. Check it with your teacher.');
    if (klass.examType !== req.user.examType) throw badRequest(`This class is for ${klass.examType.toUpperCase()} students, but your profile is set to ${req.user.examType.toUpperCase()}.`);
    if (klass.studentIds.includes(req.user.id)) throw conflict('You are already in this class.');
    if (klass.studentIds.length >= 500) throw badRequest('This class is full.');
    klass.studentIds.push(req.user.id);
    store.save();
    res.json({ class: classSummary(klass, req.user) });
}));

router.get('/:id', asyncHandler(async (req, res) => {
    const store = getStore();
    const klass = loadClass(req.params.id);
    assertClassMember(req.user, klass);
    const isStaff = req.user.role !== 'student';
    const now = Date.now();

    const assignments = store.find('assignments', (a) => a.classId === klass.id)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .map((a) => {
            const attempts = store.find('attempts', (x) => x.assignmentId === a.id && x.status === 'submitted');
            const base = {
                id: a.id, title: a.title, instructions: a.instructions, dueAt: a.dueAt, durationMin: a.durationMin,
                questionCount: a.questionIds.length, allowRetake: a.allowRetake, createdAt: a.createdAt,
                closed: Boolean(a.dueAt && new Date(a.dueAt).getTime() < now)
            };
            if (isStaff) {
                return { ...base, submitted: new Set(attempts.map((x) => x.userId)).size };
            }
            const mine = attempts.filter((x) => x.userId === req.user.id).sort((x, y) => new Date(y.submittedAt) - new Date(x.submittedAt));
            const open = store.findOne('attempts', (x) => x.assignmentId === a.id && x.userId === req.user.id && x.status === 'in_progress');
            return { ...base, myAttemptId: mine[0]?.id || null, myScore: mine[0]?.score || null, inProgressId: open?.id || null };
        });

    const announcements = store.find('announcements', (a) => a.classId === klass.id)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .map((a) => ({ ...a, author: userCard(store.byId('users', a.authorId)) }));

    const students = isStaff
        ? klass.studentIds.map((id) => store.byId('users', id)).filter(Boolean).map((s) => {
            const an = computeStudentAnalytics(s.id);
            return { ...userCard(s), tests: an.totals.tests, accuracy: an.totals.accuracy, avgPercent: an.totals.avgPercent, lastActive: an.recent[0]?.submittedAt || null };
        })
        : undefined;

    res.json({ class: { ...classSummary(klass, req.user), students }, assignments, announcements });
}));

router.put('/:id', requireRole('teacher', 'admin'), asyncHandler(async (req, res) => {
    const klass = loadClass(req.params.id);
    assertClassOwner(req.user, klass);
    if (req.body.name !== undefined) klass.name = validate.str(req.body.name, { field: 'Class name', required: true, min: 3, max: 80 });
    if (req.body.description !== undefined) klass.description = validate.str(req.body.description, { field: 'Description', max: 300 });
    if (req.body.archived !== undefined) klass.archived = Boolean(req.body.archived);
    klass.updatedAt = new Date().toISOString();
    getStore().save();
    res.json({ class: classSummary(klass, req.user) });
}));

router.delete('/:id', requireRole('teacher', 'admin'), asyncHandler(async (req, res) => {
    const store = getStore();
    const klass = loadClass(req.params.id);
    assertClassOwner(req.user, klass);
    store.removeWhere('assignments', (a) => a.classId === klass.id);
    store.removeWhere('announcements', (a) => a.classId === klass.id);
    store.remove('classes', klass.id);
    logAudit(req.user, 'class.deleted', klass.name);
    res.json({ message: 'Class deleted.' });
}));

router.post('/:id/code', requireRole('teacher', 'admin'), asyncHandler(async (req, res) => {
    const klass = loadClass(req.params.id);
    assertClassOwner(req.user, klass);
    klass.code = newCode();
    getStore().save();
    res.json({ code: klass.code });
}));

router.post('/:id/leave', requireRole('student'), asyncHandler(async (req, res) => {
    const klass = loadClass(req.params.id);
    if (!klass.studentIds.includes(req.user.id)) throw badRequest('You are not in this class.');
    klass.studentIds = klass.studentIds.filter((id) => id !== req.user.id);
    getStore().save();
    res.json({ message: 'You left the class.' });
}));

router.delete('/:id/students/:studentId', requireRole('teacher', 'admin'), asyncHandler(async (req, res) => {
    const klass = loadClass(req.params.id);
    assertClassOwner(req.user, klass);
    if (!klass.studentIds.includes(req.params.studentId)) throw notFound('Student is not in this class.');
    klass.studentIds = klass.studentIds.filter((id) => id !== req.params.studentId);
    getStore().save();
    logAudit(req.user, 'class.student_removed', klass.name, { studentId: req.params.studentId });
    res.json({ message: 'Student removed.' });
}));

router.get('/:id/analytics', requireRole('teacher', 'admin'), asyncHandler(async (req, res) => {
    const klass = loadClass(req.params.id);
    assertClassOwner(req.user, klass);
    const analytics = computeClassAnalytics(klass);
    res.json({ analytics, insights: ai.classInsights(klass, analytics) });
}));

// Class leaderboard is visible to members; it shows only names and scores.
router.get('/:id/leaderboard', asyncHandler(async (req, res) => {
    const store = getStore();
    const klass = loadClass(req.params.id);
    assertClassMember(req.user, klass);
    const rows = klass.studentIds.map((id) => store.byId('users', id)).filter(Boolean).map((s) => {
        const a = computeStudentAnalytics(s.id);
        return { id: s.id, name: s.name, avatar: s.avatar, tests: a.totals.tests, avgPercent: a.totals.avgPercent, streak: a.streak.current, isMe: s.id === req.user.id };
    }).filter((r) => r.tests > 0).sort((a, b) => b.avgPercent - a.avgPercent || b.tests - a.tests);
    res.json({ leaderboard: rows.map((r, i) => ({ ...r, rank: i + 1 })) });
}));

module.exports = router;
