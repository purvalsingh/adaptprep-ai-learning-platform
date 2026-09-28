const { getStore } = require('../db/store');
const { badRequest, forbidden, notFound, conflict, validate } = require('../lib/http');
const {
    EXAMS, MARKING, SECONDS_PER_QUESTION, SUBMIT_GRACE_SECONDS, DIFFICULTIES, subjectLabel
} = require('../lib/constants');
const { forTaking, forReview, activeQuestions, shuffle } = require('./questions');

const MODES = ['practice', 'adaptive', 'full', 'custom', 'revision', 'assignment'];

const deadlineOf = (attempt) => new Date(attempt.startedAt).getTime() + attempt.durationSec * 1000;
const isExpired = (attempt) => Date.now() > deadlineOf(attempt) + SUBMIT_GRACE_SECONDS * 1000;

// Per-topic accuracy from a student's submitted attempts; used by adaptive selection.
const topicAccuracy = (userId) => {
    const map = new Map();
    const seen = new Set();
    getStore().find('attempts', (a) => a.userId === userId && a.status === 'submitted').forEach((a) => {
        (a.results || []).forEach((r) => {
            seen.add(r.questionId);
            const key = `${r.subject}::${r.topic}`;
            const e = map.get(key) || { attempted: 0, correct: 0 };
            e.attempted += 1;
            if (r.status === 'correct') e.correct += 1;
            map.set(key, e);
        });
    });
    return { map, seen };
};

const pickAdaptive = (user, subjects, count) => {
    const { map, seen } = topicAccuracy(user.id);
    const pool = activeQuestions((q) => q.examType === user.examType && subjects.includes(q.subject));
    if (!pool.length) throw badRequest('No questions are available for this selection yet.');

    // Weight: weak and unexplored topics first, unseen questions preferred,
    // difficulty nudged towards the student's current level.
    const scored = pool.map((q) => {
        const stats = map.get(`${q.subject}::${q.topic}`);
        const acc = stats ? stats.correct / stats.attempted : null;
        let weight = acc === null ? 2.2 : 1 + (1 - acc) * 3;
        if (!seen.has(q.id)) weight *= 1.8;
        if (acc !== null && acc > 0.75 && q.difficulty === 'easy') weight *= 0.4;
        if (acc !== null && acc < 0.4 && q.difficulty === 'hard') weight *= 0.5;
        return { q, key: Math.random() ** (1 / weight) };
    });
    scored.sort((a, b) => b.key - a.key);
    return scored.slice(0, count).map((s) => s.q);
};

const buildSpec = (user, body) => {
    const store = getStore();
    const mode = validate.oneOf(body.mode, MODES, { field: 'Mode' });
    const exam = EXAMS[user.examType];
    if (!exam) throw badRequest('Your account has no exam selected. Update it in your profile.');

    if (mode === 'practice') {
        const subject = validate.oneOf(body.subject, exam.subjects, { field: 'Subject' });
        const testSet = validate.int(body.testSet, { field: 'Test set', min: 1, max: 100 });
        const questions = activeQuestions((q) => q.source === 'bank' && q.examType === user.examType && q.subject === subject && q.testSet === testSet);
        if (!questions.length) throw notFound('That test set does not exist.');
        return {
            mode, title: `${subjectLabel(subject)} · Test ${testSet}`, subjects: [subject], testSet,
            questions, durationSec: questions.length * SECONDS_PER_QUESTION
        };
    }

    if (mode === 'adaptive') {
        const subjects = body.subject ? [validate.oneOf(body.subject, exam.subjects, { field: 'Subject' })] : exam.subjects;
        const count = validate.int(body.count, { field: 'Question count', min: 5, max: 30, fallback: 15 });
        const questions = pickAdaptive(user, subjects, count);
        return {
            mode, title: `AI Adaptive · ${subjects.length === 1 ? subjectLabel(subjects[0]) : 'All subjects'}`, subjects,
            questions, durationSec: questions.length * SECONDS_PER_QUESTION
        };
    }

    if (mode === 'full') {
        const perSubject = 10;
        const questions = exam.subjects.flatMap((s) =>
            shuffle(activeQuestions((q) => q.examType === user.examType && q.subject === s)).slice(0, perSubject));
        return {
            mode, title: `${exam.name} Full Mock`, subjects: exam.subjects,
            questions, durationSec: questions.length * SECONDS_PER_QUESTION
        };
    }

    if (mode === 'custom') {
        const subject = validate.oneOf(body.subject, exam.subjects, { field: 'Subject' });
        const count = validate.int(body.count, { field: 'Question count', min: 5, max: 30, fallback: 10 });
        const difficulty = validate.oneOf(body.difficulty, ['mixed', ...DIFFICULTIES], { field: 'Difficulty', fallback: 'mixed' });
        const topics = Array.isArray(body.topics) ? body.topics.filter((t) => typeof t === 'string').slice(0, 30) : [];
        const pool = activeQuestions((q) => q.examType === user.examType && q.subject === subject
            && (!topics.length || topics.includes(q.topic))
            && (difficulty === 'mixed' || q.difficulty === difficulty));
        if (!pool.length) throw badRequest('No questions match those filters. Try fewer topic or difficulty filters.');
        const questions = shuffle(pool).slice(0, count);
        return {
            mode, title: `Custom · ${subjectLabel(subject)}${topics.length === 1 ? ` · ${topics[0]}` : ''}`, subjects: [subject],
            questions, durationSec: questions.length * SECONDS_PER_QUESTION
        };
    }

    if (mode === 'revision') {
        // Re-test the questions the student most recently got wrong.
        const count = validate.int(body.count, { field: 'Question count', min: 5, max: 30, fallback: 15 });
        const latest = new Map();
        store.find('attempts', (a) => a.userId === user.id && a.status === 'submitted')
            .sort((a, b) => new Date(a.submittedAt) - new Date(b.submittedAt))
            .forEach((a) => (a.results || []).forEach((r) => latest.set(r.questionId, r.status)));
        const wrongIds = [...latest.entries()].filter(([, s]) => s !== 'correct').map(([id]) => id);
        const questions = shuffle(wrongIds.map((id) => store.byId('questions', id)).filter((q) => q && q.status !== 'archived' && q.examType === user.examType)).slice(0, count);
        if (!questions.length) throw badRequest('No mistakes to revise yet — great work! Take a test first.');
        return {
            mode, title: 'Revision · Your mistakes', subjects: [...new Set(questions.map((q) => q.subject))],
            questions, durationSec: questions.length * SECONDS_PER_QUESTION
        };
    }

    // Assignment
    const assignment = store.byId('assignments', body.assignmentId);
    if (!assignment) throw notFound('Assignment not found.');
    const klass = store.byId('classes', assignment.classId);
    if (!klass || !klass.studentIds.includes(user.id)) throw forbidden('You are not a member of this class.');
    if (assignment.dueAt && Date.now() > new Date(assignment.dueAt).getTime()) throw badRequest('This assignment is past its due date.');
    const previous = store.find('attempts', (a) => a.userId === user.id && a.assignmentId === assignment.id);
    if (previous.some((a) => a.status === 'submitted') && !assignment.allowRetake) {
        throw conflict('You have already submitted this assignment.');
    }
    const questions = assignment.questionIds.map((id) => store.byId('questions', id)).filter(Boolean);
    if (!questions.length) throw badRequest('This assignment has no questions.');
    return {
        mode, title: assignment.title, subjects: [...new Set(questions.map((q) => q.subject))],
        assignmentId: assignment.id, classId: klass.id,
        questions, durationSec: assignment.durationMin * 60
    };
};

const createAttempt = (user, body) => {
    const store = getStore();
    if (user.role !== 'student') throw forbidden('Only students can take tests.');

    // Resume an unfinished attempt of the same assignment instead of starting over.
    if (body.mode === 'assignment') {
        const open = store.findOne('attempts', (a) => a.userId === user.id && a.assignmentId === body.assignmentId && a.status === 'in_progress');
        if (open && !isExpired(open)) return open;
        if (open) finalizeAttempt(open);
    }

    const inProgress = store.find('attempts', (a) => a.userId === user.id && a.status === 'in_progress');
    inProgress.filter(isExpired).forEach(finalizeAttempt);
    if (store.find('attempts', (a) => a.userId === user.id && a.status === 'in_progress').length >= 3) {
        throw conflict('You already have 3 tests in progress. Finish or submit one before starting another.');
    }

    const spec = buildSpec(user, body);
    return store.insert('attempts', {
        userId: user.id,
        mode: spec.mode,
        title: spec.title,
        examType: user.examType,
        subjects: spec.subjects,
        testSet: spec.testSet || null,
        assignmentId: spec.assignmentId || null,
        classId: spec.classId || null,
        questionIds: spec.questions.map((q) => q.id),
        answers: {},
        marked: [],
        timeSpent: {},
        durationSec: spec.durationSec,
        startedAt: new Date().toISOString(),
        submittedAt: null,
        status: 'in_progress',
        results: null,
        score: null
    });
};

const applyProgress = (attempt, body) => {
    const valid = new Set(attempt.questionIds);
    if (body.answers && typeof body.answers === 'object') {
        Object.entries(body.answers).forEach(([qid, val]) => {
            if (!valid.has(qid)) return;
            if (val === null) delete attempt.answers[qid];
            else if (Number.isInteger(val) && val >= 0 && val <= 3) attempt.answers[qid] = val;
        });
    }
    if (Array.isArray(body.marked)) {
        attempt.marked = [...new Set(body.marked.filter((id) => valid.has(id)))];
    }
    if (body.timeSpent && typeof body.timeSpent === 'object') {
        Object.entries(body.timeSpent).forEach(([qid, secs]) => {
            if (valid.has(qid) && Number.isFinite(secs) && secs >= 0) {
                attempt.timeSpent[qid] = Math.min(Math.round(secs), attempt.durationSec);
            }
        });
    }
};

const finalizeAttempt = (attempt) => {
    if (attempt.status === 'submitted') return attempt;
    const store = getStore();
    const results = attempt.questionIds.map((qid) => {
        const q = store.byId('questions', qid);
        const selected = Object.prototype.hasOwnProperty.call(attempt.answers, qid) ? attempt.answers[qid] : null;
        const correct = q ? q.correct : null;
        const status = selected === null ? 'skipped' : selected === correct ? 'correct' : 'incorrect';
        return {
            questionId: qid,
            subject: q?.subject || 'unknown',
            topic: q?.topic || 'Unknown',
            difficulty: q?.difficulty || 'medium',
            selected,
            correct,
            status,
            timeSpent: attempt.timeSpent[qid] || 0
        };
    });

    const count = (s) => results.filter((r) => r.status === s).length;
    const correct = count('correct');
    const incorrect = count('incorrect');
    const skipped = count('skipped');
    const total = results.length;
    const marks = correct * MARKING.correct + incorrect * MARKING.incorrect;
    const maxMarks = total * MARKING.correct;
    const attempted = correct + incorrect;
    const elapsed = Math.round((Date.now() - new Date(attempt.startedAt).getTime()) / 1000);

    attempt.results = results;
    attempt.score = {
        correct,
        incorrect,
        skipped,
        total,
        marks,
        maxMarks,
        percent: maxMarks ? Math.round((Math.max(marks, 0) / maxMarks) * 1000) / 10 : 0,
        accuracy: attempted ? Math.round((correct / attempted) * 1000) / 10 : 0,
        timeTaken: Math.min(elapsed, attempt.durationSec)
    };
    attempt.status = 'submitted';
    attempt.submittedAt = new Date().toISOString();
    attempt.updatedAt = attempt.submittedAt;
    store.save();
    return attempt;
};

const sweepExpired = () => {
    getStore().find('attempts', (a) => a.status === 'in_progress' && isExpired(a)).forEach(finalizeAttempt);
};

// Shape an attempt for the client. Answers are only revealed after submission.
const attemptView = (attempt, { bookmarks = [] } = {}) => {
    const store = getStore();
    const base = {
        id: attempt.id,
        mode: attempt.mode,
        title: attempt.title,
        examType: attempt.examType,
        subjects: attempt.subjects,
        testSet: attempt.testSet,
        assignmentId: attempt.assignmentId,
        status: attempt.status,
        durationSec: attempt.durationSec,
        startedAt: attempt.startedAt,
        submittedAt: attempt.submittedAt,
        deadline: new Date(deadlineOf(attempt)).toISOString(),
        serverNow: new Date().toISOString(),
        answers: attempt.answers,
        marked: attempt.marked,
        timeSpent: attempt.timeSpent
    };

    if (attempt.status === 'in_progress') {
        return {
            ...base,
            questions: attempt.questionIds.map((id) => store.byId('questions', id)).filter(Boolean).map(forTaking)
        };
    }

    return {
        ...base,
        score: attempt.score,
        results: attempt.results,
        questions: attempt.questionIds.map((id) => {
            const q = store.byId('questions', id);
            return q ? { ...forReview(q), bookmarked: bookmarks.includes(id) } : null;
        }).filter(Boolean)
    };
};

const attemptSummary = (a) => ({
    id: a.id,
    mode: a.mode,
    title: a.title,
    subjects: a.subjects,
    status: a.status,
    assignmentId: a.assignmentId,
    classId: a.classId,
    startedAt: a.startedAt,
    submittedAt: a.submittedAt,
    durationSec: a.durationSec,
    questionCount: a.questionIds.length,
    answeredCount: Object.keys(a.answers || {}).length,
    deadline: new Date(deadlineOf(a)).toISOString(),
    score: a.score
});

module.exports = {
    createAttempt, applyProgress, finalizeAttempt, sweepExpired, isExpired, attemptView, attemptSummary, topicAccuracy
};
