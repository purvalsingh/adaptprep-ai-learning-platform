const express = require('express');
const bcrypt = require('bcryptjs');
const { getStore } = require('../db/store');
const { auth, signToken, publicUser } = require('../middleware/auth');
const { rateLimit } = require('../middleware/security');
const { asyncHandler, badRequest, conflict, unauthorized, forbidden, validate } = require('../lib/http');
const { EXAM_TYPES, AVATARS } = require('../lib/constants');
const { logAudit } = require('../services/audit');

const router = express.Router();
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30, message: 'Too many sign-in attempts. Please wait a few minutes and try again.' });

// Used to keep login timing constant when the email does not exist.
const DUMMY_HASH = bcrypt.hashSync('adaptprep-timing-guard', 10);

router.post('/signup', authLimiter, asyncHandler(async (req, res) => {
    const store = getStore();
    const name = validate.str(req.body.name, { field: 'Name', required: true, min: 2, max: 60 });
    const email = validate.email(req.body.email);
    const password = validate.password(req.body.password);
    // Admin accounts can only be created by another admin.
    const role = validate.oneOf(req.body.role, ['student', 'teacher'], { field: 'Role', fallback: 'student' });
    const examType = validate.oneOf(req.body.examType, EXAM_TYPES, { field: 'Exam', fallback: 'jee' });
    const avatar = AVATARS.includes(req.body.avatar) ? req.body.avatar : AVATARS[0];
    const institution = validate.str(req.body.institution, { field: 'Institution', max: 100 });

    if (store.findOne('users', (u) => u.email === email)) throw conflict('An account with this email already exists.');

    // Optional class code lets students join their teacher's class during sign-up.
    let klass = null;
    if (role === 'student' && req.body.classCode) {
        const code = String(req.body.classCode).trim().toUpperCase();
        klass = store.findOne('classes', (c) => c.code === code && !c.archived);
        if (!klass) throw badRequest('That class code is not valid. You can also join a class later.');
        if (klass.examType !== examType) throw badRequest(`That class is for ${klass.examType.toUpperCase()} students.`);
    }

    const user = store.insert('users', {
        name,
        email,
        passwordHash: await bcrypt.hash(password, 10),
        role,
        examType,
        avatar,
        institution,
        bio: '',
        targetYear: null,
        dailyGoal: 20,
        status: 'active',
        bookmarks: [],
        tokenVersion: 0,
        lastLoginAt: new Date().toISOString()
    });
    if (klass) klass.studentIds.push(user.id);
    store.save();
    logAudit(user, 'user.signup', user.email, { role });

    res.status(201).json({ token: signToken(user), user: publicUser(user) });
}));

router.post('/login', authLimiter, asyncHandler(async (req, res) => {
    const store = getStore();
    const email = validate.email(req.body.email);
    const password = validate.str(req.body.password, { field: 'Password', required: true, max: 128, trim: false });

    const user = store.findOne('users', (u) => u.email === email);
    const ok = await bcrypt.compare(password, user ? user.passwordHash : DUMMY_HASH);
    if (!user || !ok) throw unauthorized('Incorrect email or password.');
    if (user.status === 'suspended') throw forbidden('This account has been suspended. Contact your administrator.');

    user.lastLoginAt = new Date().toISOString();
    store.save();
    res.json({ token: signToken(user), user: publicUser(user) });
}));

router.get('/me', auth, (req, res) => {
    res.json({ user: publicUser(req.user) });
});

router.post('/change-password', auth, authLimiter, asyncHandler(async (req, res) => {
    const current = validate.str(req.body.currentPassword, { field: 'Current password', required: true, trim: false });
    const next = validate.password(req.body.newPassword, 'New password');
    if (!(await bcrypt.compare(current, req.user.passwordHash))) throw badRequest('Your current password is incorrect.');
    if (current === next) throw badRequest('Choose a password different from your current one.');

    req.user.passwordHash = await bcrypt.hash(next, 10);
    // Bumping the version signs out every other session.
    req.user.tokenVersion = (req.user.tokenVersion || 0) + 1;
    getStore().save();
    logAudit(req.user, 'user.password_changed', req.user.email);
    res.json({ message: 'Password updated.', token: signToken(req.user) });
}));

module.exports = router;
