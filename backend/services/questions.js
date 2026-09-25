const { getStore } = require('../db/store');
const { badRequest, validate } = require('../lib/http');
const { EXAM_TYPES, ALL_SUBJECTS, DIFFICULTIES, EXAMS } = require('../lib/constants');

// What a student sees while a test is running: never the answer or explanation.
const forTaking = (q) => ({
    id: q.id,
    subject: q.subject,
    topic: q.topic,
    difficulty: q.difficulty,
    question: q.question,
    options: q.options
});

// Full record for review screens and question-bank management.
const forReview = (q) => ({
    id: q.id,
    examType: q.examType,
    subject: q.subject,
    topic: q.topic,
    difficulty: q.difficulty,
    question: q.question,
    options: q.options,
    correct: q.correct,
    explanation: q.explanation,
    theory: q.theory,
    source: q.source,
    testSet: q.testSet,
    status: q.status,
    createdBy: q.createdBy,
    createdAt: q.createdAt,
    updatedAt: q.updatedAt
});

const activeQuestions = (pred = () => true) =>
    getStore().find('questions', (q) => q.status !== 'archived' && pred(q));

const shuffle = (arr) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
};

const topicsFor = (examType, subject) => {
    const set = new Map();
    activeQuestions((q) => q.examType === examType && (!subject || q.subject === subject)).forEach((q) => {
        const key = `${q.subject}::${q.topic}`;
        const entry = set.get(key) || { subject: q.subject, topic: q.topic, count: 0 };
        entry.count += 1;
        set.set(key, entry);
    });
    return [...set.values()].sort((a, b) => b.count - a.count);
};

// Validates and normalises a question payload from teachers/admins.
const parseQuestionInput = (body, { partial = false } = {}) => {
    const out = {};
    const need = (k) => !partial || body[k] !== undefined;

    if (need('examType')) out.examType = validate.oneOf(body.examType, EXAM_TYPES, { field: 'Exam' });
    if (need('subject')) out.subject = validate.oneOf(body.subject, ALL_SUBJECTS, { field: 'Subject' });
    if (out.examType && out.subject && !EXAMS[out.examType].subjects.includes(out.subject)) {
        throw badRequest(`${out.subject} is not part of ${EXAMS[out.examType].name}.`);
    }
    if (need('topic')) out.topic = validate.str(body.topic, { field: 'Topic', required: true, min: 2, max: 80 });
    if (need('difficulty')) out.difficulty = validate.oneOf(body.difficulty, DIFFICULTIES, { field: 'Difficulty' });
    if (need('question')) out.question = validate.str(body.question, { field: 'Question', required: true, min: 5, max: 2000 });
    if (need('options')) {
        if (!Array.isArray(body.options) || body.options.length !== 4) throw badRequest('Exactly four options are required.');
        out.options = body.options.map((o, i) => validate.str(o, { field: `Option ${String.fromCharCode(65 + i)}`, required: true, max: 500 }));
        if (new Set(out.options.map((o) => o.toLowerCase())).size !== 4) throw badRequest('Options must all be different.');
    }
    if (need('correct')) out.correct = validate.int(body.correct, { field: 'Correct option', min: 0, max: 3 });
    if (need('explanation')) out.explanation = validate.str(body.explanation, { field: 'Explanation', required: !partial, min: 5, max: 3000 });
    if (body.theory !== undefined) out.theory = validate.str(body.theory, { field: 'Theory', max: 4000 });
    return out;
};

module.exports = { forTaking, forReview, activeQuestions, shuffle, topicsFor, parseQuestionInput };
