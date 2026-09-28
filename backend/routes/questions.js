const express = require('express');
const { getStore } = require('../db/store');
const { requireRole } = require('../middleware/auth');
const { rateLimit } = require('../middleware/security');
const { asyncHandler, badRequest, forbidden, notFound, paginate, validate } = require('../lib/http');
const { EXAM_TYPES, ALL_SUBJECTS, DIFFICULTIES, EXAMS } = require('../lib/constants');
const { forReview, topicsFor, parseQuestionInput } = require('../services/questions');
const { logAudit } = require('../services/audit');
const ai = require('../ai');

const router = express.Router();
const staff = requireRole('teacher', 'admin');

// Topic list is available to everyone (students use it to build custom tests).
router.get('/topics', (req, res) => {
    const examType = EXAM_TYPES.includes(req.query.examType) ? req.query.examType : req.user.examType || 'jee';
    const subject = ALL_SUBJECTS.includes(req.query.subject) ? req.query.subject : undefined;
    res.json({ topics: topicsFor(examType, subject) });
});

router.get('/', staff, (req, res) => {
    const q = req.query;
    const search = typeof q.search === 'string' ? q.search.trim().toLowerCase() : '';
    const includeArchived = q.status === 'archived' || q.status === 'all';
    const items = getStore().find('questions', (x) =>
        (q.status === 'archived' ? x.status === 'archived' : includeArchived || x.status !== 'archived')
        && (!q.examType || x.examType === q.examType)
        && (!q.subject || x.subject === q.subject)
        && (!q.topic || x.topic === q.topic)
        && (!q.difficulty || x.difficulty === q.difficulty)
        && (!q.source || x.source === q.source)
        && (q.mine !== 'true' || x.createdBy === req.user.id)
        && (!search || x.question.toLowerCase().includes(search) || x.topic.toLowerCase().includes(search)))
        .sort((a, b) => (a.source === 'bank') - (b.source === 'bank') || new Date(b.createdAt) - new Date(a.createdAt));
    const page = paginate(items, q);
    res.json({ ...page, items: page.items.map(forReview) });
});

router.get('/:id', staff, asyncHandler(async (req, res) => {
    const q = getStore().byId('questions', req.params.id);
    if (!q) throw notFound('Question not found.');
    res.json({ question: forReview(q) });
}));

const canEdit = (user, q) => user.role === 'admin' || (q.source !== 'bank' && q.createdBy === user.id);

router.post('/', staff, asyncHandler(async (req, res) => {
    const data = parseQuestionInput(req.body);
    const q = getStore().insert('questions', { ...data, source: 'custom', status: 'active', createdBy: req.user.id, testSet: null });
    logAudit(req.user, 'question.created', q.topic, { id: q.id });
    res.status(201).json({ question: forReview(q) });
}));

// Save a batch of AI-generated (and teacher-reviewed) questions.
router.post('/bulk', staff, asyncHandler(async (req, res) => {
    if (!Array.isArray(req.body.questions) || !req.body.questions.length) throw badRequest('No questions to save.');
    if (req.body.questions.length > 50) throw badRequest('You can save at most 50 questions at once.');
    const parsed = req.body.questions.map((q, i) => {
        try {
            return parseQuestionInput(q);
        } catch (err) {
            throw badRequest(`Question ${i + 1}: ${err.message}`);
        }
    });
    const saved = getStore().insertMany('questions', parsed.map((d) => ({ ...d, source: 'ai', status: 'active', createdBy: req.user.id, testSet: null })));
    logAudit(req.user, 'question.bulk_created', `${saved.length} questions`);
    res.status(201).json({ questions: saved.map(forReview) });
}));

router.put('/:id', staff, asyncHandler(async (req, res) => {
    const store = getStore();
    const q = store.byId('questions', req.params.id);
    if (!q) throw notFound('Question not found.');
    if (!canEdit(req.user, q)) throw forbidden('You can only edit questions you created.');
    const data = parseQuestionInput({ ...forReview(q), ...req.body }, { partial: false });
    if (req.body.status !== undefined) {
        if (!['active', 'archived'].includes(req.body.status)) throw badRequest('Invalid status.');
        data.status = req.body.status;
    }
    store.update('questions', q.id, data);
    logAudit(req.user, 'question.updated', q.topic, { id: q.id });
    res.json({ question: forReview(q) });
}));

// Questions are archived rather than hard-deleted so past results stay reviewable.
router.delete('/:id', staff, asyncHandler(async (req, res) => {
    const store = getStore();
    const q = store.byId('questions', req.params.id);
    if (!q) throw notFound('Question not found.');
    if (!canEdit(req.user, q)) throw forbidden('You can only remove questions you created.');
    store.update('questions', q.id, { status: 'archived' });
    logAudit(req.user, 'question.archived', q.topic, { id: q.id });
    res.json({ message: 'Question archived.' });
}));

const genLimiter = rateLimit({ windowMs: 60 * 1000, max: 20 });

router.post('/generate', staff, genLimiter, asyncHandler(async (req, res) => {
    const examType = validate.oneOf(req.body.examType, EXAM_TYPES, { field: 'Exam' });
    const subject = req.body.subject ? validate.oneOf(req.body.subject, EXAMS[examType].subjects, { field: 'Subject' }) : undefined;
    const difficulty = validate.oneOf(req.body.difficulty, ['mixed', ...DIFFICULTIES], { field: 'Difficulty', fallback: 'mixed' });
    const count = validate.int(req.body.count, { field: 'Count', min: 1, max: 20, fallback: 5 });
    const topic = typeof req.body.topic === 'string' && req.body.topic ? req.body.topic : undefined;
    const questions = ai.generateQuestions({ examType, subject, topic, difficulty, count });
    if (!questions.length) throw badRequest('The AI has no generator for that combination yet. Try another subject or topic.');
    res.json({ questions, provider: 'local', topics: ai.generatorTopics().filter((t) => t.exams.includes(examType)) });
}));

router.get('/meta/generator', staff, (req, res) => {
    res.json({ topics: ai.generatorTopics() });
});

module.exports = router;
