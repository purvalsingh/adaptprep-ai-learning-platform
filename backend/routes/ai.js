const express = require('express');
const { getStore } = require('../db/store');
const { requireRole } = require('../middleware/auth');
const { rateLimit } = require('../middleware/security');
const { asyncHandler, badRequest, notFound, validate } = require('../lib/http');
const { computeStudentAnalytics } = require('../services/analytics');
const { assertCanViewStudent } = require('../services/access');
const ai = require('../ai');

const router = express.Router();
const aiLimiter = rateLimit({ windowMs: 60 * 1000, max: 30, message: 'You are sending messages very quickly. Take a breath and try again in a minute.' });

const MAX_SESSIONS = 50;
const MAX_MESSAGES = 200;

router.get('/status', (req, res) => res.json(ai.status()));

const sessionSummary = (s) => ({
    id: s.id,
    title: s.title,
    messageCount: s.messages.length,
    lastMessage: s.messages[s.messages.length - 1]?.content?.slice(0, 80) || '',
    createdAt: s.createdAt,
    updatedAt: s.updatedAt
});

const loadSession = (req) => {
    const s = getStore().byId('chats', req.params.id);
    if (!s || s.userId !== req.user.id) throw notFound('Conversation not found.');
    return s;
};

router.get('/chats', (req, res) => {
    const sessions = getStore().find('chats', (c) => c.userId === req.user.id)
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
        .map(sessionSummary);
    res.json({ sessions });
});

router.post('/chats', (req, res) => {
    const store = getStore();
    const mine = store.find('chats', (c) => c.userId === req.user.id).sort((a, b) => new Date(a.updatedAt) - new Date(b.updatedAt));
    // Keep storage bounded: drop the oldest conversation beyond the cap.
    if (mine.length >= MAX_SESSIONS) store.remove('chats', mine[0].id);
    const session = store.insert('chats', { userId: req.user.id, title: 'New conversation', messages: [], pendingQuiz: null });
    res.status(201).json({ session: { ...sessionSummary(session), messages: [] } });
});

router.get('/chats/:id', asyncHandler(async (req, res) => {
    const s = loadSession(req);
    res.json({ session: { ...sessionSummary(s), messages: s.messages } });
}));

router.delete('/chats/:id', asyncHandler(async (req, res) => {
    const s = loadSession(req);
    getStore().remove('chats', s.id);
    res.json({ message: 'Conversation deleted.' });
}));

router.post('/chats/:id/messages', aiLimiter, asyncHandler(async (req, res) => {
    const store = getStore();
    const s = loadSession(req);
    const message = validate.str(req.body.message, { field: 'Message', required: true, max: 2000 });
    if (s.messages.length >= MAX_MESSAGES) throw badRequest('This conversation is full. Start a new one to keep chatting.');

    const analytics = req.user.role === 'student' ? computeStudentAnalytics(req.user.id) : null;
    const reply = await ai.chat({ message, user: req.user, analytics, session: s });

    const now = new Date().toISOString();
    s.messages.push({ role: 'user', content: message, at: now });
    const assistant = { role: 'assistant', content: reply.content, at: new Date().toISOString(), provider: reply.provider, suggestions: reply.suggestions || [] };
    s.messages.push(assistant);
    if (s.title === 'New conversation') s.title = message.length > 48 ? `${message.slice(0, 45)}…` : message;
    s.updatedAt = assistant.at;
    store.save();

    res.json({ message: assistant, session: sessionSummary(s) });
}));

router.get('/study-plan', requireRole('student'), (req, res) => {
    const analytics = computeStudentAnalytics(req.user.id);
    res.json({ plan: ai.studyPlan(req.user, analytics), analytics: { totals: analytics.totals, weakTopics: analytics.weakTopics, strongTopics: analytics.strongTopics, subjects: analytics.subjects } });
});

// Explain a question from a submitted attempt the viewer is allowed to see.
router.post('/explain', aiLimiter, asyncHandler(async (req, res) => {
    const store = getStore();
    const attempt = store.byId('attempts', req.body.attemptId);
    if (!attempt || attempt.status !== 'submitted') throw notFound('Submitted test not found.');
    if (attempt.userId !== req.user.id) assertCanViewStudent(req.user, attempt.userId);
    const result = (attempt.results || []).find((r) => r.questionId === req.body.questionId);
    const question = result && store.byId('questions', result.questionId);
    if (!question) throw notFound('Question not found in this test.');
    const out = await ai.explain({ question, selected: result.selected, user: req.user });
    res.json(out);
}));

module.exports = router;
