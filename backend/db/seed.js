// Seeds the question bank (always) and a realistic demo workspace (optional).
// Demo data is created once, on first start, so every role can be explored
// immediately. Disable it with SEED_DEMO=false.

const bcrypt = require('bcryptjs');
const { getStore } = require('./store');
const { questionBank } = require('../data/questionBank');
const { finalizeAttempt } = require('../services/attempts');
const { EXAMS, SECONDS_PER_QUESTION } = require('../lib/constants');

const DEMO_ACCOUNTS = {
    admin: { email: 'admin@adaptprep.dev', password: 'Admin@123' },
    teacher: { email: 'teacher@adaptprep.dev', password: 'Teacher@123' },
    student: { email: 'student@adaptprep.dev', password: 'Student@123' },
    neet: { email: 'neet@adaptprep.dev', password: 'Student@123' }
};

const seedQuestions = () => {
    const store = getStore();
    if (store.all('questions').length) return 0;
    const docs = [];
    Object.entries(questionBank).forEach(([examType, subjects]) => {
        Object.entries(subjects).forEach(([subject, tests]) => {
            Object.entries(tests).forEach(([key, list]) => {
                const testSet = parseInt(key.replace('test', ''), 10);
                list.forEach((q, i) => {
                    docs.push({
                        id: `${examType}-${subject}-t${testSet}-q${i + 1}`,
                        examType,
                        subject,
                        topic: q.topic,
                        difficulty: q.difficulty,
                        question: q.question,
                        options: q.options,
                        correct: q.correct,
                        explanation: q.explanation,
                        theory: q.theory || '',
                        source: 'bank',
                        testSet,
                        status: 'active',
                        createdBy: null
                    });
                });
            });
        });
    });
    store.insertMany('questions', docs);
    return docs.length;
};

// Deterministic PRNG so demo data looks the same on every fresh install.
const mulberry32 = (seed) => () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const seedDemo = () => {
    const store = getStore();
    const rand = mulberry32(20260925);
    const hash = (p) => bcrypt.hashSync(p, 10);
    const daysAgo = (d, h = 18) => {
        const t = new Date(Date.now() - d * 86400000);
        t.setUTCHours(h, Math.floor(rand() * 50), 0, 0);
        return Math.min(t.getTime(), Date.now() - 60000);
    };
    const mkUser = (name, email, password, role, examType, avatar, extra = {}) => store.insert('users', {
        name, email, passwordHash: hash(password), role, examType, avatar, institution: extra.institution || '', bio: extra.bio || '',
        targetYear: extra.targetYear || null, dailyGoal: 20, status: 'active', bookmarks: [], tokenVersion: 0, lastLoginAt: null
    });

    mkUser('Meera Nair', DEMO_ACCOUNTS.admin.email, DEMO_ACCOUNTS.admin.password, 'admin', 'jee', 'avatar_7.jpg', { institution: 'AdaptPrep' });
    const teacher = mkUser('Priya Mehta', DEMO_ACCOUNTS.teacher.email, DEMO_ACCOUNTS.teacher.password, 'teacher', 'jee', 'avatar_4.jpg', {
        institution: 'Vidya Coaching Centre', bio: 'Physics & chemistry faculty. 9 years preparing JEE/NEET aspirants.'
    });

    const S = (name, email, exam, avatar, skills, weakTopics = [], extra = {}) => ({
        user: mkUser(name, email, extra.password || 'Student@123', 'student', exam, avatar, { targetYear: 2027, institution: 'Vidya Coaching Centre' }),
        skills,
        weakTopics
    });
    const students = {
        aarav: S('Aarav Sharma', DEMO_ACCOUNTS.student.email, 'jee', 'avatar_1.jpg', { physics: 0.8, chemistry: 0.6, mathematics: 0.7 }, ['Thermodynamics', 'Chemical Bonding', 'Organic Chemistry', 'Calculus']),
        diya: S('Diya Patel', 'diya@adaptprep.dev', 'jee', 'avatar_2.jpg', { physics: 0.86, chemistry: 0.82, mathematics: 0.9 }),
        rohan: S('Rohan Verma', 'rohan@adaptprep.dev', 'jee', 'avatar_3.jpg', { physics: 0.42, chemistry: 0.38, mathematics: 0.45 }, ['Mechanics']),
        ishaan: S('Ishaan Gupta', 'ishaan@adaptprep.dev', 'jee', 'avatar_5.jpg', {}),
        ananya: S('Ananya Iyer', DEMO_ACCOUNTS.neet.email, 'neet', 'avatar_6.jpg', { physics: 0.66, chemistry: 0.74, biology: 0.85 }, ['Optics', 'Genetics']),
        kabir: S('Kabir Singh', 'kabir@adaptprep.dev', 'neet', 'avatar_8.jpg', { physics: 0.5, chemistry: 0.58, biology: 0.62 })
    };

    const bank = (exam, subject, set) => store.find('questions', (q) => q.examType === exam && q.subject === subject && q.testSet === set);

    const simulate = (s, { mode, title, questions, when, assignmentId = null, classId = null, testSet = null }) => {
        const answers = {};
        const timeSpent = {};
        questions.forEach((q) => {
            let p = s.skills[q.subject] ?? 0.5;
            if (q.difficulty === 'easy') p += 0.1;
            if (q.difficulty === 'hard') p -= 0.18;
            if (s.weakTopics.includes(q.topic)) p -= 0.35;
            timeSpent[q.id] = 25 + Math.floor(rand() * 95);
            if (rand() < 0.08) return;
            if (rand() < p) answers[q.id] = q.correct;
            else answers[q.id] = (q.correct + 1 + Math.floor(rand() * 3)) % 4;
        });
        const durationSec = questions.length * SECONDS_PER_QUESTION;
        const taken = Object.values(timeSpent).reduce((a, b) => a + b, 0);
        const attempt = store.insert('attempts', {
            userId: s.user.id, mode, title, examType: s.user.examType, subjects: [...new Set(questions.map((q) => q.subject))], testSet,
            assignmentId, classId, questionIds: questions.map((q) => q.id), answers, marked: [], timeSpent, durationSec,
            startedAt: new Date(when - Math.min(taken, durationSec) * 1000).toISOString(), submittedAt: null, status: 'in_progress', results: null, score: null
        });
        finalizeAttempt(attempt);
        attempt.submittedAt = new Date(when).toISOString();
        attempt.score.timeTaken = Math.min(taken, durationSec);
        attempt.createdAt = attempt.startedAt;
        attempt.updatedAt = attempt.submittedAt;
        return attempt;
    };

    const label = (s) => s.charAt(0).toUpperCase() + s.slice(1);
    const practiceHistory = (s, plan) => plan.forEach(([subject, set, day]) => simulate(s, {
        mode: 'practice', title: `${label(subject)} · Test ${set}`, questions: bank(s.user.examType, subject, set), when: daysAgo(day, 12 + Math.floor(rand() * 9)), testSet: set
    }));

    // Aarav: steady activity with a live 5-day streak.
    practiceHistory(students.aarav, [
        ['physics', 1, 16], ['chemistry', 1, 15], ['mathematics', 1, 13], ['physics', 2, 11], ['chemistry', 2, 9],
        ['mathematics', 2, 8], ['physics', 3, 6], ['chemistry', 3, 4], ['mathematics', 3, 3], ['physics', 4, 2], ['chemistry', 4, 1], ['mathematics', 4, 0]
    ]);
    practiceHistory(students.diya, [['physics', 1, 12], ['chemistry', 1, 10], ['mathematics', 1, 7], ['physics', 2, 5], ['mathematics', 2, 2], ['chemistry', 2, 1]]);
    practiceHistory(students.rohan, [['physics', 1, 14], ['chemistry', 1, 12], ['mathematics', 1, 10]]);
    practiceHistory(students.ananya, [['biology', 1, 9], ['chemistry', 1, 7], ['physics', 1, 5], ['biology', 2, 3], ['biology', 3, 1], ['chemistry', 2, 0]]);
    practiceHistory(students.kabir, [['biology', 1, 6], ['physics', 1, 4]]);

    const jeeClass = store.insert('classes', {
        name: 'JEE 2027 · Batch A', description: 'Weekend batch preparing for JEE Main 2027. Weekly drills every Friday.',
        examType: 'jee', teacherId: teacher.id, studentIds: [students.aarav.user.id, students.diya.user.id, students.rohan.user.id, students.ishaan.user.id],
        code: 'JEE27A', archived: false
    });
    const neetClass = store.insert('classes', {
        name: 'NEET Achievers', description: 'Biology-first batch for NEET UG aspirants.', examType: 'neet', teacherId: teacher.id,
        studentIds: [students.ananya.user.id, students.kabir.user.id], code: 'NEET27', archived: false
    });

    const pickTopic = (exam, subject, topics, n) => store.find('questions', (q) => q.examType === exam && q.subject === subject && topics.includes(q.topic)).slice(0, n);

    const mechQs = pickTopic('jee', 'physics', ['Mechanics', 'Kinematics', 'Projectile Motion', 'Circular Motion', 'Work and Energy'], 10);
    const pastDue = new Date(Date.now() - 3 * 86400000).toISOString();
    const mechAssignment = store.insert('assignments', {
        classId: jeeClass.id, teacherId: teacher.id, title: 'Mechanics Foundations Drill', instructions: 'Revise Newton\'s laws and work–energy before starting. No calculators.',
        questionIds: mechQs.map((q) => q.id), durationMin: 15, dueAt: pastDue, allowRetake: false
    });
    [['aarav', 5], ['diya', 6], ['rohan', 4]].forEach(([k, d]) => simulate(students[k], {
        mode: 'assignment', title: mechAssignment.title, questions: mechQs, when: daysAgo(d, 17), assignmentId: mechAssignment.id, classId: jeeClass.id
    }));

    const bondQs = pickTopic('jee', 'chemistry', ['Chemical Bonding', 'Atomic Structure', 'Periodic Trends'], 8);
    const bondAssignment = store.insert('assignments', {
        classId: jeeClass.id, teacherId: teacher.id, title: 'Chemical Bonding Checkpoint', instructions: 'Focus on VSEPR shapes and hybridisation. 12 minutes, one attempt.',
        questionIds: bondQs.map((q) => q.id), durationMin: 12, dueAt: new Date(Date.now() + 4 * 86400000).toISOString(), allowRetake: false
    });
    simulate(students.diya, { mode: 'assignment', title: bondAssignment.title, questions: bondQs, when: daysAgo(0, 9), assignmentId: bondAssignment.id, classId: jeeClass.id });

    const genQs = pickTopic('neet', 'biology', ['Genetics', 'Molecular Biology', 'Evolution', 'Cell Biology'], 10);
    store.insert('assignments', {
        classId: neetClass.id, teacherId: teacher.id, title: 'Genetics Sprint', instructions: 'Punnett squares and molecular basis of inheritance.',
        questionIds: genQs.map((q) => q.id), durationMin: 15, dueAt: new Date(Date.now() + 5 * 86400000).toISOString(), allowRetake: true
    });

    const adminUser = store.findOne('users', (u) => u.role === 'admin');
    store.insert('announcements', {
        scope: 'global', classId: null, authorId: adminUser.id, title: 'Welcome to AdaptPrep 👋',
        body: 'Your AI study coach is live. Take an AI Adaptive test to calibrate your level, then open your Study Plan for a personalised week.'
    });
    store.insert('announcements', {
        scope: 'class', classId: jeeClass.id, authorId: teacher.id, title: 'Friday drill moved to Saturday',
        body: 'This week\'s drill is on Saturday at 10 AM. Complete the Chemical Bonding Checkpoint before then.'
    });
    store.insert('announcements', {
        scope: 'class', classId: neetClass.id, authorId: teacher.id, title: 'Genetics Sprint is open',
        body: 'Retakes are allowed on this one — use them to push your score above 80%.'
    });

    // A little history so the audit log is not empty on first run.
    store.insert('audit', { actorId: teacher.id, actorName: teacher.name, actorRole: 'teacher', action: 'class.created', target: jeeClass.name, meta: {} });
    store.insert('audit', { actorId: teacher.id, actorName: teacher.name, actorRole: 'teacher', action: 'assignment.created', target: bondAssignment.title, meta: {} });
};

const seed = () => {
    const store = getStore();
    const added = seedQuestions();
    if (added) console.log(`[seed] Loaded ${added} questions into the bank.`);

    if (!store.all('users').length) {
        if (process.env.SEED_DEMO !== 'false') {
            seedDemo();
            console.log('[seed] Demo workspace created (admin, teacher, students, classes, assignments).');
        } else if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
            store.insert('users', {
                name: 'Administrator', email: process.env.ADMIN_EMAIL.toLowerCase(), passwordHash: bcrypt.hashSync(process.env.ADMIN_PASSWORD, 10),
                role: 'admin', examType: 'jee', avatar: 'avatar_7.jpg', institution: '', bio: '', targetYear: null, dailyGoal: 20,
                status: 'active', bookmarks: [], tokenVersion: 0, lastLoginAt: null
            });
            console.log(`[seed] Admin account created for ${process.env.ADMIN_EMAIL}.`);
        }
    }
    store.flush();
};

module.exports = { seed, DEMO_ACCOUNTS, EXAMS };
