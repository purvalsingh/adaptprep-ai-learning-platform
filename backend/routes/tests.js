const express = require('express');
const { getStore } = require('../db/store');
const { requireRole } = require('../middleware/auth');
const { asyncHandler, notFound, badRequest, forbidden } = require('../lib/http');
const { EXAMS } = require('../lib/constants');
const {
    createAttempt, applyProgress, finalizeAttempt, isExpired, attemptView, attemptSummary
} = require('../services/attempts');
const { topicsFor, forReview } = require('../services/questions');
const { assertCanViewStudent } = require('../services/access');

const router = express.Router();

const loadAttempt = (req) => {
    const attempt = getStore().byId('attempts', req.params.id);
    if (!attempt) throw notFound('Test attempt not found.');
    // Lazily enforce the server-side deadline.
    if (attempt.status === 'in_progress' && isExpired(attempt)) finalizeAttempt(attempt);
    return attempt;
};

const loadOwnAttempt = (req) => {
    const attempt = loadAttempt(req);
    if (attempt.userId !== req.user.id) throw notFound('Test attempt not found.');
    return attempt;
};

// Catalog of practice sets for the student's exam, with personal bests.
router.get('/catalog', requireRole('student'), (req, res) => {
    const store = getStore();
    const exam = EXAMS[req.user.examType];
    const mine = store.find('attempts', (a) => a.userId === req.user.id && a.status === 'submitted' && a.mode === 'practice');

    const subjects = exam.subjects.map((subject) => {
        const sets = new Map();
        store.find('questions', (q) => q.source === 'bank' && q.status !== 'archived' && q.examType === exam.id && q.subject === subject)
            .forEach((q) => sets.set(q.testSet, (sets.get(q.testSet) || 0) + 1));
        return {
            subject,
            topics: topicsFor(exam.id, subject),
            sets: [...sets.entries()].sort((a, b) => a[0] - b[0]).map(([testSet, count]) => {
                const tries = mine.filter((a) => a.subjects[0] === subject && a.testSet === testSet);
                return {
                    testSet,
                    questions: count,
                    attempts: tries.length,
                    best: tries.length ? Math.max(...tries.map((a) => a.score.percent)) : null
                };
            })
        };
    });

    const inProgress = store.find('attempts', (a) => a.userId === req.user.id && a.status === 'in_progress')
        .filter((a) => {
            if (isExpired(a)) { finalizeAttempt(a); return false; }
            return true;
        })
        .map(attemptSummary);

    res.json({ exam: { id: exam.id, name: exam.name, subjects: exam.subjects }, subjects, inProgress });
});

router.post('/start', requireRole('student'), asyncHandler(async (req, res) => {
    const attempt = createAttempt(req.user, req.body || {});
    res.status(201).json({ attempt: attemptView(attempt) });
}));

router.get('/attempts', (req, res) => {
    const store = getStore();
    const status = req.query.status;
    const list = store.find('attempts', (a) => a.userId === req.user.id && (!status || a.status === status))
        .map((a) => {
            if (a.status === 'in_progress' && isExpired(a)) finalizeAttempt(a);
            return a;
        })
        .sort((a, b) => new Date(b.submittedAt || b.startedAt) - new Date(a.submittedAt || a.startedAt))
        .map(attemptSummary);
    res.json({ attempts: list });
});

router.get('/attempts/:id', asyncHandler(async (req, res) => {
    const attempt = loadAttempt(req);
    if (attempt.userId !== req.user.id) {
        // Teachers/admins may review a student's submitted work, never a live test.
        if (attempt.status !== 'submitted') throw notFound('Test attempt not found.');
        assertCanViewStudent(req.user, attempt.userId);
    }
    const owner = getStore().byId('users', attempt.userId);
    res.json({
        attempt: attemptView(attempt, { bookmarks: attempt.userId === req.user.id ? req.user.bookmarks || [] : [] }),
        student: owner ? { id: owner.id, name: owner.name, avatar: owner.avatar } : null
    });
}));

router.patch('/attempts/:id', requireRole('student'), asyncHandler(async (req, res) => {
    const attempt = loadOwnAttempt(req);
    if (attempt.status !== 'in_progress') {
        return res.status(409).json({ message: 'Time is up — this test has already been submitted.', status: attempt.status });
    }
    applyProgress(attempt, req.body || {});
    attempt.updatedAt = new Date().toISOString();
    getStore().save();
    res.json({ ok: true, serverNow: new Date().toISOString() });
}));

router.post('/attempts/:id/submit', requireRole('student'), asyncHandler(async (req, res) => {
    const attempt = loadOwnAttempt(req);
    if (attempt.status === 'in_progress') {
        applyProgress(attempt, req.body || {});
        finalizeAttempt(attempt);
    }
    res.json({ attempt: attemptView(attempt, { bookmarks: req.user.bookmarks || [] }) });
}));

// Abandon an unfinished self-practice test (assignments cannot be discarded).
router.delete('/attempts/:id', requireRole('student'), asyncHandler(async (req, res) => {
    const attempt = loadOwnAttempt(req);
    if (attempt.status !== 'in_progress') throw badRequest('Only unfinished tests can be discarded.');
    if (attempt.mode === 'assignment') throw forbidden('Assignments cannot be discarded. Submit it instead.');
    getStore().remove('attempts', attempt.id);
    res.json({ message: 'Test discarded.' });
}));

// Latest status per question the student answered incorrectly or skipped.
router.get('/mistakes', requireRole('student'), (req, res) => {
    const store = getStore();
    const latest = new Map();
    store.find('attempts', (a) => a.userId === req.user.id && a.status === 'submitted')
        .sort((a, b) => new Date(a.submittedAt) - new Date(b.submittedAt))
        .forEach((a) => (a.results || []).forEach((r) => latest.set(r.questionId, { ...r, attemptId: a.id, at: a.submittedAt })));
    const bookmarks = req.user.bookmarks || [];
    const mistakes = [...latest.values()]
        .filter((r) => r.status !== 'correct')
        .sort((a, b) => new Date(b.at) - new Date(a.at))
        .map((r) => {
            const q = store.byId('questions', r.questionId);
            return q ? { ...forReview(q), selected: r.selected, status: r.status, attemptId: r.attemptId, at: r.at, bookmarked: bookmarks.includes(q.id) } : null;
        })
        .filter(Boolean);
    res.json({ mistakes });
});

module.exports = router;
