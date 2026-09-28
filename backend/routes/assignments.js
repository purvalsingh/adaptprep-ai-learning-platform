const express = require('express');
const { getStore } = require('../db/store');
const { requireRole } = require('../middleware/auth');
const { asyncHandler, badRequest, notFound, validate } = require('../lib/http');
const { EXAMS, DIFFICULTIES } = require('../lib/constants');
const { loadClass, assertClassOwner, assertClassMember } = require('../services/access');
const { activeQuestions, shuffle, forReview } = require('../services/questions');
const { userCard } = require('../services/users');
const { logAudit } = require('../services/audit');

const router = express.Router();

const loadAssignment = (id) => {
    const a = getStore().byId('assignments', id);
    if (!a) throw notFound('Assignment not found.');
    return a;
};

const parseDue = (value) => {
    if (value === null || value === '' || value === undefined) return null;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) throw badRequest('Due date is not valid.');
    return d.toISOString();
};

// Resolve the question list: explicit ids, or auto-pick by filters.
const resolveQuestions = (klass, body) => {
    const exam = EXAMS[klass.examType];
    if (Array.isArray(body.questionIds) && body.questionIds.length) {
        const ids = [...new Set(body.questionIds)].slice(0, 100);
        const qs = ids.map((id) => getStore().byId('questions', id));
        if (qs.some((q) => !q || q.status === 'archived')) throw badRequest('One or more selected questions no longer exist.');
        if (qs.some((q) => q.examType !== klass.examType)) throw badRequest(`All questions must be ${exam.name} questions for this class.`);
        return ids;
    }
    const auto = body.auto || {};
    const count = validate.int(auto.count, { field: 'Question count', min: 1, max: 60, fallback: 10 });
    const subjects = auto.subject ? [validate.oneOf(auto.subject, exam.subjects, { field: 'Subject' })] : exam.subjects;
    const difficulty = validate.oneOf(auto.difficulty, ['mixed', ...DIFFICULTIES], { field: 'Difficulty', fallback: 'mixed' });
    const topics = Array.isArray(auto.topics) ? auto.topics.filter((t) => typeof t === 'string') : [];
    const pool = activeQuestions((q) => q.examType === klass.examType && subjects.includes(q.subject)
        && (!topics.length || topics.includes(q.topic)) && (difficulty === 'mixed' || q.difficulty === difficulty));
    if (!pool.length) throw badRequest('No questions match those filters.');
    return shuffle(pool).slice(0, count).map((q) => q.id);
};

router.get('/', (req, res) => {
    const store = getStore();
    const u = req.user;
    const classes = store.find('classes', (c) => (u.role === 'admin' ? true : u.role === 'teacher' ? c.teacherId === u.id : c.studentIds.includes(u.id)));
    const classIds = new Set(classes.map((c) => c.id));
    const now = Date.now();
    const list = store.find('assignments', (a) => classIds.has(a.classId))
        .sort((a, b) => new Date(a.dueAt || '2999-01-01') - new Date(b.dueAt || '2999-01-01'))
        .map((a) => {
            const klass = classes.find((c) => c.id === a.classId);
            const base = {
                id: a.id, title: a.title, classId: a.classId, className: klass?.name, dueAt: a.dueAt, durationMin: a.durationMin,
                questionCount: a.questionIds.length, createdAt: a.createdAt, closed: Boolean(a.dueAt && new Date(a.dueAt).getTime() < now)
            };
            const attempts = store.find('attempts', (x) => x.assignmentId === a.id && x.status === 'submitted');
            if (u.role !== 'student') return { ...base, submitted: new Set(attempts.map((x) => x.userId)).size, studentCount: klass?.studentIds.length || 0 };
            const mine = attempts.filter((x) => x.userId === u.id).sort((x, y) => new Date(y.submittedAt) - new Date(x.submittedAt));
            const open = store.findOne('attempts', (x) => x.assignmentId === a.id && x.userId === u.id && x.status === 'in_progress');
            return { ...base, allowRetake: a.allowRetake, myAttemptId: mine[0]?.id || null, myScore: mine[0]?.score || null, inProgressId: open?.id || null };
        });
    res.json({ assignments: list });
});

router.post('/', requireRole('teacher', 'admin'), asyncHandler(async (req, res) => {
    const klass = loadClass(req.body.classId);
    assertClassOwner(req.user, klass);
    const questionIds = resolveQuestions(klass, req.body);
    const dueAt = parseDue(req.body.dueAt);
    if (dueAt && new Date(dueAt).getTime() < Date.now()) throw badRequest('Due date must be in the future.');

    const assignment = getStore().insert('assignments', {
        classId: klass.id,
        teacherId: req.user.id,
        title: validate.str(req.body.title, { field: 'Title', required: true, min: 3, max: 100 }),
        instructions: validate.str(req.body.instructions, { field: 'Instructions', max: 1000 }),
        questionIds,
        durationMin: validate.int(req.body.durationMin, { field: 'Duration', min: 1, max: 240, fallback: Math.max(5, Math.ceil(questionIds.length * 1.5)) }),
        dueAt,
        allowRetake: Boolean(req.body.allowRetake)
    });
    logAudit(req.user, 'assignment.created', assignment.title, { classId: klass.id, questions: questionIds.length });
    res.status(201).json({ assignment });
}));

router.get('/:id', asyncHandler(async (req, res) => {
    const store = getStore();
    const a = loadAssignment(req.params.id);
    const klass = loadClass(a.classId);
    assertClassMember(req.user, klass);
    const base = {
        id: a.id, title: a.title, instructions: a.instructions, classId: klass.id, className: klass.name,
        dueAt: a.dueAt, durationMin: a.durationMin, allowRetake: a.allowRetake, questionCount: a.questionIds.length,
        createdAt: a.createdAt, closed: Boolean(a.dueAt && new Date(a.dueAt).getTime() < Date.now()),
        teacher: userCard(store.byId('users', a.teacherId))
    };

    if (req.user.role === 'student') {
        const mine = store.find('attempts', (x) => x.assignmentId === a.id && x.userId === req.user.id)
            .sort((x, y) => new Date(y.startedAt) - new Date(x.startedAt))
            .map((x) => ({ id: x.id, status: x.status, score: x.score, submittedAt: x.submittedAt }));
        const subjects = [...new Set(a.questionIds.map((id) => store.byId('questions', id)?.subject).filter(Boolean))];
        return res.json({ assignment: { ...base, subjects }, attempts: mine });
    }

    assertClassOwner(req.user, klass);
    const questions = a.questionIds.map((id) => store.byId('questions', id)).filter(Boolean);
    const submitted = store.find('attempts', (x) => x.assignmentId === a.id && x.status === 'submitted');

    // Latest submission per student.
    const latest = new Map();
    submitted.sort((x, y) => new Date(x.submittedAt) - new Date(y.submittedAt)).forEach((x) => latest.set(x.userId, x));

    const submissions = klass.studentIds.map((sid) => {
        const s = store.byId('users', sid);
        const att = latest.get(sid);
        return {
            student: userCard(s),
            attemptId: att?.id || null,
            submittedAt: att?.submittedAt || null,
            score: att?.score || null,
            late: Boolean(att && a.dueAt && new Date(att.submittedAt) > new Date(a.dueAt))
        };
    }).filter((x) => x.student);

    const latestList = [...latest.values()];
    const questionStats = questions.map((q) => {
        const rows = latestList.map((x) => x.results.find((r) => r.questionId === q.id)).filter(Boolean);
        const choices = [0, 0, 0, 0];
        rows.forEach((r) => { if (r.selected !== null) choices[r.selected] += 1; });
        const correct = rows.filter((r) => r.status === 'correct').length;
        return { ...forReview(q), responses: rows.length, correctCount: correct, correctRate: rows.length ? Math.round((correct / rows.length) * 100) : null, choices };
    });

    const scores = latestList.map((x) => x.score.percent);
    res.json({
        assignment: base,
        stats: {
            students: klass.studentIds.length,
            submitted: latestList.length,
            avgPercent: scores.length ? Math.round((scores.reduce((p, c) => p + c, 0) / scores.length) * 10) / 10 : 0,
            highest: scores.length ? Math.max(...scores) : 0,
            lowest: scores.length ? Math.min(...scores) : 0
        },
        submissions,
        questions: questionStats
    });
}));

router.put('/:id', requireRole('teacher', 'admin'), asyncHandler(async (req, res) => {
    const a = loadAssignment(req.params.id);
    assertClassOwner(req.user, loadClass(a.classId));
    if (req.body.title !== undefined) a.title = validate.str(req.body.title, { field: 'Title', required: true, min: 3, max: 100 });
    if (req.body.instructions !== undefined) a.instructions = validate.str(req.body.instructions, { field: 'Instructions', max: 1000 });
    if (req.body.durationMin !== undefined) a.durationMin = validate.int(req.body.durationMin, { field: 'Duration', min: 1, max: 240 });
    if (req.body.dueAt !== undefined) a.dueAt = parseDue(req.body.dueAt);
    if (req.body.allowRetake !== undefined) a.allowRetake = Boolean(req.body.allowRetake);
    a.updatedAt = new Date().toISOString();
    getStore().save();
    res.json({ assignment: a });
}));

router.delete('/:id', requireRole('teacher', 'admin'), asyncHandler(async (req, res) => {
    const store = getStore();
    const a = loadAssignment(req.params.id);
    assertClassOwner(req.user, loadClass(a.classId));
    // Discard unfinished attempts; submitted work stays in students' history.
    store.removeWhere('attempts', (x) => x.assignmentId === a.id && x.status === 'in_progress');
    store.remove('assignments', a.id);
    logAudit(req.user, 'assignment.deleted', a.title);
    res.json({ message: 'Assignment deleted.' });
}));

module.exports = router;
