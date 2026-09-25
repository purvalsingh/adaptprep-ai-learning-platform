const express = require('express');
const bcrypt = require('bcryptjs');
const { getStore } = require('../db/store');
const { publicUser } = require('../middleware/auth');
const { asyncHandler, badRequest, forbidden, notFound, validate } = require('../lib/http');
const { EXAM_TYPES, AVATARS } = require('../lib/constants');
const { forReview } = require('../services/questions');
const { logAudit } = require('../services/audit');
const { deleteUserCascade } = require('../services/users');

const router = express.Router();

router.put('/', asyncHandler(async (req, res) => {
    const u = req.user;
    const b = req.body;
    if (b.name !== undefined) u.name = validate.str(b.name, { field: 'Name', required: true, min: 2, max: 60 });
    if (b.avatar !== undefined) {
        if (!AVATARS.includes(b.avatar)) throw badRequest('Please choose one of the available avatars.');
        u.avatar = b.avatar;
    }
    if (b.bio !== undefined) u.bio = validate.str(b.bio, { field: 'Bio', max: 280 });
    if (b.institution !== undefined) u.institution = validate.str(b.institution, { field: 'Institution', max: 100 });
    if (b.targetYear !== undefined) u.targetYear = b.targetYear === null || b.targetYear === '' ? null : validate.int(b.targetYear, { field: 'Target year', min: 2024, max: 2040 });
    if (b.dailyGoal !== undefined) u.dailyGoal = validate.int(b.dailyGoal, { field: 'Daily goal', min: 5, max: 200 });
    if (b.examType !== undefined && u.role === 'student') {
        const next = validate.oneOf(b.examType, EXAM_TYPES, { field: 'Exam' });
        if (next !== u.examType) {
            const store = getStore();
            if (store.find('classes', (c) => c.studentIds.includes(u.id) && c.examType !== next).length) {
                throw badRequest('Leave your current classes before switching exams — they are for a different exam.');
            }
            if (store.find('attempts', (a) => a.userId === u.id && a.status === 'in_progress').length) {
                throw badRequest('Finish or submit your in-progress tests before switching exams.');
            }
            u.examType = next;
        }
    }
    u.updatedAt = new Date().toISOString();
    getStore().save();
    res.json({ user: publicUser(u) });
}));

router.delete('/', asyncHandler(async (req, res) => {
    const store = getStore();
    const password = validate.str(req.body.password, { field: 'Password', required: true, trim: false });
    if (!(await bcrypt.compare(password, req.user.passwordHash))) throw badRequest('Password is incorrect.');
    if (req.user.role === 'admin' && store.find('users', (x) => x.role === 'admin' && x.status === 'active').length <= 1) {
        throw forbidden('You are the last active admin. Promote another admin before deleting your account.');
    }
    logAudit(req.user, 'user.self_deleted', req.user.email);
    deleteUserCascade(req.user.id);
    res.json({ message: 'Your account and data have been deleted.' });
}));

// Students can only bookmark questions they have already seen in a submitted
// attempt; otherwise bookmarks could be used to read answers of unseen questions.
const seenQuestionIds = (userId) => {
    const seen = new Set();
    getStore().find('attempts', (a) => a.userId === userId && a.status === 'submitted').forEach((a) => a.questionIds.forEach((id) => seen.add(id)));
    return seen;
};

router.get('/bookmarks', (req, res) => {
    const store = getStore();
    const questions = (req.user.bookmarks || []).map((id) => store.byId('questions', id)).filter(Boolean).map(forReview);
    res.json({ questions });
});

router.post('/bookmarks/:questionId', asyncHandler(async (req, res) => {
    const store = getStore();
    const { questionId } = req.params;
    if (!store.byId('questions', questionId)) throw notFound('Question not found.');
    if (req.user.role === 'student' && !seenQuestionIds(req.user.id).has(questionId)) {
        throw forbidden('You can bookmark a question after you have attempted it.');
    }
    const list = req.user.bookmarks || [];
    const idx = list.indexOf(questionId);
    if (idx === -1) list.unshift(questionId);
    else list.splice(idx, 1);
    req.user.bookmarks = list.slice(0, 500);
    store.save();
    res.json({ bookmarked: idx === -1, count: req.user.bookmarks.length });
}));

module.exports = router;
