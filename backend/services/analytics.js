const { getStore } = require('../db/store');
const { EXAMS } = require('../lib/constants');
const { attemptSummary } = require('./attempts');
const { topicsFor } = require('./questions');

const pct = (num, den) => (den ? Math.round((num / den) * 1000) / 10 : 0);

const masteryOf = (accuracy, attempted) => {
    if (attempted < 2) return 'new';
    if (accuracy >= 85) return 'mastered';
    if (accuracy >= 65) return 'proficient';
    if (accuracy >= 40) return 'developing';
    return 'needs-work';
};

// Date key in the viewer's local timezone (offset in minutes as from Date#getTimezoneOffset).
const dayKey = (iso, tzOffset = 0) => {
    const d = new Date(new Date(iso).getTime() - tzOffset * 60000);
    return d.toISOString().slice(0, 10);
};

const computeStreak = (activeDays, tzOffset) => {
    const days = Object.keys(activeDays).sort();
    if (!days.length) return { current: 0, longest: 0 };
    let longest = 1;
    let run = 1;
    for (let i = 1; i < days.length; i += 1) {
        const diff = (Date.parse(days[i]) - Date.parse(days[i - 1])) / 86400000;
        run = diff === 1 ? run + 1 : 1;
        longest = Math.max(longest, run);
    }
    const today = dayKey(new Date().toISOString(), tzOffset);
    const yesterday = dayKey(new Date(Date.now() - 86400000).toISOString(), tzOffset);
    let current = 0;
    const last = days[days.length - 1];
    if (last === today || last === yesterday) {
        current = 1;
        for (let i = days.length - 1; i > 0; i -= 1) {
            if ((Date.parse(days[i]) - Date.parse(days[i - 1])) / 86400000 === 1) current += 1;
            else break;
        }
    }
    return { current, longest };
};

const computeStudentAnalytics = (userId, { tzOffset = 0 } = {}) => {
    const store = getStore();
    const user = store.byId('users', userId);
    const attempts = store
        .find('attempts', (a) => a.userId === userId && a.status === 'submitted')
        .sort((a, b) => new Date(a.submittedAt) - new Date(b.submittedAt));

    const subjects = new Map();
    const topics = new Map();
    const difficulty = new Map();
    const activeDays = {};
    let correct = 0;
    let incorrect = 0;
    let skipped = 0;
    let timeSpent = 0;

    attempts.forEach((a) => {
        const k = dayKey(a.submittedAt, tzOffset);
        activeDays[k] = (activeDays[k] || 0) + 1;
        timeSpent += a.score?.timeTaken || 0;
        (a.results || []).forEach((r) => {
            if (r.status === 'correct') correct += 1;
            else if (r.status === 'incorrect') incorrect += 1;
            else skipped += 1;

            const s = subjects.get(r.subject) || { subject: r.subject, attempted: 0, correct: 0, incorrect: 0, skipped: 0, time: 0, tests: new Set() };
            s.tests.add(a.id);
            s[r.status] += 1;
            if (r.status !== 'skipped') s.attempted += 1;
            s.time += r.timeSpent || 0;
            subjects.set(r.subject, s);

            if (r.status !== 'skipped') {
                const tk = `${r.subject}::${r.topic}`;
                const t = topics.get(tk) || { subject: r.subject, topic: r.topic, attempted: 0, correct: 0 };
                t.attempted += 1;
                if (r.status === 'correct') t.correct += 1;
                topics.set(tk, t);

                const d = difficulty.get(r.difficulty) || { difficulty: r.difficulty, attempted: 0, correct: 0 };
                d.attempted += 1;
                if (r.status === 'correct') d.correct += 1;
                difficulty.set(r.difficulty, d);
            }
        });
    });

    const exam = EXAMS[user?.examType] || EXAMS.jee;
    const subjectList = exam.subjects.map((name) => {
        const s = subjects.get(name) || { subject: name, attempted: 0, correct: 0, incorrect: 0, skipped: 0, time: 0, tests: new Set() };
        const total = s.correct + s.incorrect + s.skipped;
        return {
            subject: name,
            tests: s.tests.size,
            attempted: s.attempted,
            correct: s.correct,
            incorrect: s.incorrect,
            skipped: s.skipped,
            accuracy: pct(s.correct, s.attempted),
            avgTime: total ? Math.round(s.time / total) : 0
        };
    });

    const topicList = [...topics.values()].map((t) => {
        const accuracy = pct(t.correct, t.attempted);
        return { ...t, accuracy, mastery: masteryOf(accuracy, t.attempted) };
    }).sort((a, b) => a.accuracy - b.accuracy || b.attempted - a.attempted);

    const answered = correct + incorrect;
    const totalQ = answered + skipped;
    const accuracy = pct(correct, answered);
    const allTopics = user ? topicsFor(user.examType) : [];
    const coverage = pct(topicList.length, allTopics.length || 1);
    const percents = attempts.map((a) => a.score?.percent || 0);

    return {
        totals: {
            tests: attempts.length,
            questions: totalQ,
            correct,
            incorrect,
            skipped,
            accuracy,
            avgPercent: percents.length ? Math.round((percents.reduce((x, y) => x + y, 0) / percents.length) * 10) / 10 : 0,
            bestPercent: percents.length ? Math.max(...percents) : 0,
            timeSpentSec: timeSpent,
            avgTimePerQuestion: totalQ ? Math.round(timeSpent / totalQ) : 0,
            coverage,
            readiness: attempts.length ? Math.round(accuracy * 0.6 + coverage * 0.4) : 0
        },
        streak: { ...computeStreak(activeDays, tzOffset), activeDays },
        subjects: subjectList,
        topics: topicList,
        difficulty: ['easy', 'medium', 'hard'].map((d) => {
            const e = difficulty.get(d) || { difficulty: d, attempted: 0, correct: 0 };
            return { ...e, accuracy: pct(e.correct, e.attempted) };
        }),
        trend: attempts.slice(-20).map((a) => ({
            id: a.id,
            date: a.submittedAt,
            title: a.title,
            percent: a.score?.percent || 0,
            accuracy: a.score?.accuracy || 0
        })),
        weakTopics: topicList.filter((t) => t.attempted >= 2 && t.accuracy < 65).slice(0, 6),
        strongTopics: [...topicList].reverse().filter((t) => t.attempted >= 2 && t.accuracy >= 75).slice(0, 6),
        untouchedTopics: allTopics.filter((t) => !topics.has(`${t.subject}::${t.topic}`)).slice(0, 8),
        recent: attempts.slice(-5).reverse().map(attemptSummary)
    };
};

// Aggregate view of a class for teachers (and the AI class-insights feature).
const computeClassAnalytics = (klass) => {
    const store = getStore();
    const students = klass.studentIds.map((id) => store.byId('users', id)).filter(Boolean);
    const weekAgo = Date.now() - 7 * 86400000;
    const topicAgg = new Map();

    const rows = students.map((s) => {
        const a = computeStudentAnalytics(s.id);
        a.topics.forEach((t) => {
            const key = `${t.subject}::${t.topic}`;
            const e = topicAgg.get(key) || { subject: t.subject, topic: t.topic, attempted: 0, correct: 0, students: 0 };
            e.attempted += t.attempted;
            e.correct += t.correct;
            e.students += 1;
            topicAgg.set(key, e);
        });
        const lastAttempt = a.recent[0]?.submittedAt || null;
        const inactive = !lastAttempt || new Date(lastAttempt).getTime() < weekAgo;
        return {
            id: s.id,
            name: s.name,
            email: s.email,
            avatar: s.avatar,
            tests: a.totals.tests,
            accuracy: a.totals.accuracy,
            avgPercent: a.totals.avgPercent,
            streak: a.streak.current,
            lastActive: lastAttempt,
            atRisk: a.totals.tests > 0 ? (a.totals.accuracy < 45 || inactive) : true,
            riskReason: a.totals.tests === 0 ? 'No tests taken yet' : a.totals.accuracy < 45 ? 'Accuracy below 45%' : inactive ? 'Inactive for 7+ days' : null
        };
    });

    const topicsList = [...topicAgg.values()]
        .map((t) => ({ ...t, accuracy: pct(t.correct, t.attempted) }))
        .sort((a, b) => a.accuracy - b.accuracy);
    const active = rows.filter((r) => r.tests > 0);

    return {
        studentCount: rows.length,
        activeStudents: active.length,
        avgAccuracy: active.length ? Math.round((active.reduce((x, r) => x + r.accuracy, 0) / active.length) * 10) / 10 : 0,
        avgPercent: active.length ? Math.round((active.reduce((x, r) => x + r.avgPercent, 0) / active.length) * 10) / 10 : 0,
        students: rows.sort((a, b) => b.avgPercent - a.avgPercent),
        atRisk: rows.filter((r) => r.atRisk),
        weakTopics: topicsList.filter((t) => t.attempted >= 3).slice(0, 6),
        strongTopics: [...topicsList].reverse().filter((t) => t.attempted >= 3).slice(0, 6)
    };
};

module.exports = { computeStudentAnalytics, computeClassAnalytics, masteryOf, dayKey };
