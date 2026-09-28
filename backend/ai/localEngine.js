// AdaptPrep Local AI — a deterministic, offline tutor used whenever no
// external LLM key is configured (or when the external provider fails).
// It grounds every answer in the student's real analytics and the curated
// knowledge base, so it is useful without any API access.

const { KNOWLEDGE, STRATEGY } = require('./knowledge');
const { searchConcepts, searchQuestions } = require('./retrieval');
const { activeQuestions, shuffle } = require('../services/questions');
const { subjectLabel, EXAMS } = require('../lib/constants');
const { getStore } = require('../db/store');

const L = (s) => subjectLabel(s);
const first = (name) => (name || 'there').split(' ')[0];
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const letter = (i) => String.fromCharCode(65 + i);

const has = (text, words) => words.some((w) => (w instanceof RegExp ? w.test(text) : text.includes(w)));

const INTENTS = [
    { id: 'greeting', test: (t) => /^(hi|hello|hey|hii+|yo|namaste|good (morning|afternoon|evening))\b[\s!.]*$/i.test(t.trim()) },
    { id: 'thanks', test: (t) => /^(thanks|thank you|thx|ty|great|awesome|cool|ok|okay)\b[\s!.]*$/i.test(t.trim()) },
    { id: 'help', test: (t) => has(t, ['what can you do', 'help me use', 'how do you work', 'your features', 'who are you', 'what are you']) || /^help\b/.test(t) },
    { id: 'class', roles: ['teacher'], test: (t) => has(t, ['class', 'student', 'at risk', 'at-risk', 'struggling', 'cohort', 'my batch', 'section']) },
    { id: 'generate', roles: ['teacher', 'admin'], test: (t) => has(t, ['generate', 'create question', 'make question', 'new question', 'draft question', 'write question']) },
    { id: 'platform', roles: ['admin'], test: (t) => has(t, ['platform', 'users', 'how many', 'stats', 'statistics', 'overview', 'teachers', 'signups']) },
    { id: 'quiz', test: (t) => has(t, ['quiz me', 'test me', 'ask me', 'practice question', 'give me a question', 'quick question', 'quiz']) },
    { id: 'mistakes', test: (t) => has(t, ['mistake', 'wrong answer', 'got wrong', 'incorrect', 'errors', 'review my']) },
    { id: 'plan', test: (t) => has(t, ['plan', 'schedule', 'timetable', 'time table', 'routine', 'what should i study', 'what to study', 'where should i start', 'roadmap']) },
    { id: 'performance', test: (t) => has(t, ['how am i doing', 'my performance', 'performance', 'progress', 'my score', 'analyse me', 'analyze me', 'analyse my', 'analyze my', 'my weak', 'weak topic', 'weak area', 'weakness', 'my strong', 'strong topic', 'strength', 'how can i improve', 'how do i improve', 'report card', 'readiness', 'my accuracy', 'my streak']) },
    { id: 'stress', test: (t) => has(t, ['stress', 'anxious', 'anxiety', 'nervous', 'scared', 'panic', 'demotivat', 'motivat', 'give up', 'tired', 'burnout', 'burn out', 'sad', 'depressed']) },
    { id: 'time', test: (t) => has(t, ['time management', 'manage time', 'speed', 'faster', 'running out of time', 'not enough time', 'focus', 'concentrat', 'procrastinat']) },
    { id: 'tips', test: (t) => has(t, ['tip', 'strategy', 'exam day', 'negative marking', 'guess', 'attempt order', 'how to score', 'crack']) },
    { id: 'formula', test: (t) => has(t, ['formula', 'formulae', 'equation for', 'formulas']) }
];

const detectIntent = (text, role) => {
    const t = text.toLowerCase();
    const hit = INTENTS.find((i) => (!i.roles || i.roles.includes(role)) && i.test(t));
    return hit ? hit.id : 'concept';
};

const conceptMarkdown = (k, { formulasOnly = false } = {}) => {
    const lines = [`### ${k.title}`, ''];
    if (!formulasOnly) lines.push(k.summary, '');
    if (k.formulas.length) {
        lines.push('**Key formulas**');
        k.formulas.forEach((f) => lines.push(`- \`${f}\``));
        lines.push('');
    }
    if (!formulasOnly && k.tips.length) {
        lines.push('**Exam tips**');
        k.tips.forEach((tip) => lines.push(`- ${tip}`));
    }
    return lines.join('\n').trim();
};

const topicLine = (t) => `**${t.topic}** (${L(t.subject)}) — ${t.accuracy}% over ${t.attempted} question${t.attempted === 1 ? '' : 's'}`;

// ---------------------------------------------------------------- student intents

const performanceReply = (user, a) => {
    if (!a || !a.totals.tests) {
        return {
            content: `You haven't completed a test yet, ${first(user.name)}, so I don't have data to analyse.\n\n**Best first step:** take an **AI Adaptive test** from the Practice page. After one test I can show your strong and weak topics and build a study plan around them.`,
            suggestions: ['Make me a study plan', 'Quiz me', 'Tips for negative marking']
        };
    }
    const t = a.totals;
    const bySubject = [...a.subjects].filter((s) => s.attempted).sort((x, y) => y.accuracy - x.accuracy);
    const lines = [
        `Here's your snapshot, ${first(user.name)}:`,
        '',
        `- **Tests completed:** ${t.tests} (${t.questions} questions)`,
        `- **Accuracy:** ${t.accuracy}% · **Average score:** ${t.avgPercent}% · **Best:** ${t.bestPercent}%`,
        `- **Syllabus coverage:** ${t.coverage}% of topics attempted · **Readiness index:** ${t.readiness}/100`,
        `- **Streak:** ${a.streak.current} day${a.streak.current === 1 ? '' : 's'} (best ${a.streak.longest})`,
        ''
    ];
    if (bySubject.length) {
        lines.push('**By subject**');
        bySubject.forEach((s) => lines.push(`- ${L(s.subject)}: ${s.accuracy}% accuracy, ~${s.avgTime}s per question`));
        lines.push('');
    }
    if (a.weakTopics.length) {
        lines.push('**Focus next on**');
        a.weakTopics.slice(0, 3).forEach((w) => lines.push(`- ${topicLine(w)}`));
        lines.push('');
    }
    if (a.strongTopics.length) {
        lines.push(`**You're strong in** ${a.strongTopics.slice(0, 3).map((s) => s.topic).join(', ')} — keep them warm with occasional revision.`);
        lines.push('');
    }
    const trend = a.trend.slice(-3);
    if (trend.length >= 2) {
        const delta = Math.round((trend[trend.length - 1].percent - trend[0].percent) * 10) / 10;
        lines.push(delta >= 0
            ? `📈 Your last ${trend.length} tests are trending **up by ${delta} points**. Great momentum!`
            : `📉 Your last ${trend.length} tests dipped by ${Math.abs(delta)} points — let's review mistakes before the next one.`);
    }
    if (t.skipped > t.incorrect && t.accuracy > 70) {
        lines.push('', "💡 You skip more than you get wrong while your accuracy is high — you can afford to attempt a few more questions.");
    } else if (t.accuracy < 50 && t.incorrect > t.correct) {
        lines.push('', '💡 With −1 negative marking, low-confidence guesses are costing you marks. Attempt only when you can eliminate two options.');
    }
    return {
        content: lines.join('\n'),
        suggestions: ['Make me a study plan', 'Review my mistakes', a.weakTopics[0] ? `Explain ${a.weakTopics[0].topic}` : 'Quiz me']
    };
};

const planReply = (user, a) => {
    const plan = buildStudyPlan(user, a);
    const lines = [`Here's a focused 7-day plan for you, ${first(user.name)}:`, '', `_${plan.summary}_`, ''];
    plan.days.forEach((d) => {
        lines.push(`**${d.day} — ${d.focus}**`);
        d.tasks.forEach((task) => lines.push(`- ${task}`));
        lines.push('');
    });
    lines.push('You can open the **Study Plan** page any time to see this with progress links.');
    return { content: lines.join('\n'), suggestions: ['How am I doing?', 'Quiz me', 'Time management tips'] };
};

const mistakesReply = (user) => {
    const store = getStore();
    const wrong = [];
    store.find('attempts', (x) => x.userId === user.id && x.status === 'submitted')
        .sort((x, y) => new Date(y.submittedAt) - new Date(x.submittedAt))
        .forEach((att) => (att.results || []).forEach((r) => {
            if (r.status === 'incorrect' && wrong.length < 4) wrong.push({ r, att });
        }));
    if (!wrong.length) {
        return {
            content: "I couldn't find any incorrect answers in your recent tests — either you're on fire 🔥 or you haven't taken a test yet. Try an adaptive test to find your blind spots.",
            suggestions: ['Quiz me', 'How am I doing?']
        };
    }
    const lines = ['Here are your most recent mistakes and what to take away from each:', ''];
    wrong.forEach(({ r }, i) => {
        const q = store.byId('questions', r.questionId);
        if (!q) return;
        lines.push(`**${i + 1}. ${q.topic} (${L(q.subject)})**`);
        lines.push(`> ${q.question}`);
        lines.push(`- You chose **${letter(r.selected)}. ${q.options[r.selected]}** — correct is **${letter(q.correct)}. ${q.options[q.correct]}**`);
        lines.push(`- ${q.explanation}`);
        lines.push('');
    });
    lines.push('Open **Revision** to re-attempt all your mistakes, or ask me to explain any of these topics in depth.');
    return { content: lines.join('\n'), suggestions: [`Explain ${store.byId('questions', wrong[0].r.questionId)?.topic || 'this topic'}`, 'Quiz me', 'Make me a study plan'] };
};

const quizReply = (user, a, session, message) => {
    const exam = EXAMS[user.examType] || EXAMS.jee;
    const t = message.toLowerCase();
    const subject = exam.subjects.find((s) => t.includes(s) || (s === 'mathematics' && /\bmaths?\b/.test(t)));
    const weak = a?.weakTopics?.map((w) => w.topic) || [];
    let pool = activeQuestions((q) => q.examType === (user.examType || 'jee') && (!subject || q.subject === subject));
    const weakPool = pool.filter((q) => weak.includes(q.topic));
    if (weakPool.length && !subject) pool = weakPool;
    const q = shuffle(pool)[0];
    if (!q) return { content: 'I could not find a question for that right now.', suggestions: [] };
    session.pendingQuiz = { questionId: q.id, askedAt: new Date().toISOString() };
    const lines = [
        `**Quick quiz — ${q.topic} (${L(q.subject)}, ${q.difficulty})**${weakPool.includes(q) ? ' · picked from your weak topics' : ''}`,
        '',
        q.question,
        '',
        ...q.options.map((o, i) => `**${letter(i)}.** ${o}`),
        '',
        'Reply with **A**, **B**, **C** or **D**.'
    ];
    return { content: lines.join('\n'), suggestions: ['A', 'B', 'C', 'D'] };
};

const parseQuizAnswer = (message, q) => {
    const t = message.trim().toLowerCase().replace(/[.)!]/g, '');
    const m = t.match(/^(?:option\s*|answer\s*(?:is\s*)?|it'?s\s*)?([abcd1-4])$/);
    if (m) return /[1-4]/.test(m[1]) ? Number(m[1]) - 1 : m[1].charCodeAt(0) - 97;
    const idx = q.options.findIndex((o) => o.toLowerCase() === t);
    return idx >= 0 ? idx : null;
};

const gradeQuiz = (session, message) => {
    const q = getStore().byId('questions', session.pendingQuiz.questionId);
    if (!q) { session.pendingQuiz = null; return null; }
    const choice = parseQuizAnswer(message, q);
    if (choice === null) return null;
    session.pendingQuiz = null;
    const right = choice === q.correct;
    const lines = [
        right ? `✅ **Correct!** ${letter(q.correct)}. ${q.options[q.correct]}` : `❌ **Not quite.** You chose ${letter(choice)}; the answer is **${letter(q.correct)}. ${q.options[q.correct]}**`,
        '',
        `**Why:** ${q.explanation}`
    ];
    if (q.theory) lines.push('', `**Concept:** ${q.theory}`);
    return { content: lines.join('\n'), suggestions: ['Another one', `Explain ${q.topic}`, 'How am I doing?'] };
};

// ---------------------------------------------------------------- teacher/admin intents

const classReply = (user) => {
    const { computeClassAnalytics } = require('../services/analytics');
    const classes = getStore().find('classes', (c) => c.teacherId === user.id && !c.archived);
    if (!classes.length) {
        return { content: "You don't have any classes yet. Create one from **Classes → New class**, share the join code with students, and I'll start tracking them for you.", suggestions: ['Generate questions on Kinematics'] };
    }
    const lines = [`Here's a quick read on your ${classes.length} class${classes.length === 1 ? '' : 'es'}:`, ''];
    classes.forEach((c) => {
        const ca = computeClassAnalytics(c);
        lines.push(`**${c.name}** — ${ca.studentCount} students, ${ca.activeStudents} active, average score ${ca.avgPercent}%`);
        if (ca.atRisk.length) lines.push(`- ⚠️ Needs attention: ${ca.atRisk.slice(0, 4).map((s) => `${s.name} (${s.riskReason})`).join('; ')}`);
        if (ca.weakTopics.length) lines.push(`- Weakest topics: ${ca.weakTopics.slice(0, 3).map((t) => `${t.topic} ${t.accuracy}%`).join(', ')}`);
        lines.push('');
    });
    lines.push('**Suggestion:** create a short targeted assignment on the weakest topic above — use **Assignments → New → Auto-pick by topic** so every student gets practice where the class is losing marks.');
    return { content: lines.join('\n'), suggestions: ['Generate questions on the weakest topic', 'Tips for engaging inactive students'] };
};

const generateReply = (user, message) => {
    const { generateQuestions, generatorTopics } = require('./generator');
    const t = message.toLowerCase();
    const topics = generatorTopics();
    const topic = topics.find((x) => t.includes(x.topic.toLowerCase()));
    const subject = topic?.subject || ['physics', 'chemistry', 'mathematics', 'biology'].find((s) => t.includes(s));
    const qs = generateQuestions({ subject, topic: topic?.topic, count: 2 });
    if (!qs.length) return { content: 'I could not find a matching template. Try a topic like Kinematics, Electricity, Stoichiometry, Algebra or Genetics.', suggestions: [] };
    const lines = ['Here are two freshly generated questions (answers computed, so they are always correct):', ''];
    qs.forEach((q, i) => {
        lines.push(`**${i + 1}. ${q.topic} · ${q.difficulty}**`, q.question, ...q.options.map((o, j) => `- ${letter(j)}. ${o}${j === q.correct ? ' ✅' : ''}`), `_${q.explanation}_`, '');
    });
    lines.push(`To generate a batch and save them to your bank, open **Question Bank → AI Generate**. I can generate for: ${[...new Set(topics.map((x) => x.topic))].slice(0, 12).join(', ')}, and more.`);
    return { content: lines.join('\n'), suggestions: ['Generate questions on Genetics', 'How are my classes doing?'] };
};

const platformReply = () => {
    const store = getStore();
    const users = store.all('users');
    const count = (r) => users.filter((u) => u.role === r).length;
    const weekAgo = Date.now() - 7 * 86400000;
    const recentAttempts = store.find('attempts', (a) => a.status === 'submitted' && new Date(a.submittedAt).getTime() > weekAgo).length;
    return {
        content: [
            '**Platform overview**',
            '',
            `- Users: ${users.length} (${count('student')} students, ${count('teacher')} teachers, ${count('admin')} admins)`,
            `- Suspended accounts: ${users.filter((u) => u.status === 'suspended').length}`,
            `- Classes: ${store.all('classes').length} · Assignments: ${store.all('assignments').length}`,
            `- Tests submitted in the last 7 days: ${recentAttempts}`,
            `- Active questions in the bank: ${activeQuestions().length}`,
            '',
            'Open the **Admin Overview** for charts and the **Audit Log** for a record of sensitive actions.'
        ].join('\n'),
        suggestions: ['Generate questions on Optics']
    };
};

// ---------------------------------------------------------------- general intents

const strategyReply = (kind, user) => {
    const intro = {
        stress: `It's completely normal to feel this way, ${first(user.name)} — preparing for a competitive exam is hard, and you're showing up. A few things that genuinely help:`,
        time: 'Time is usually lost to indecision, not slow calculation. Try these:',
        tips: 'Here are the exam strategies that make the biggest difference with +4/−1 marking:'
    }[kind];
    const list = kind === 'tips' ? STRATEGY.general : STRATEGY[kind];
    const extra = kind === 'stress' ? '\n\nIf stress ever feels overwhelming, please talk to someone you trust — a parent, teacher or counsellor. You don\'t have to handle it alone. 💙' : '';
    return {
        content: `${intro}\n\n${list.map((x) => `- ${x}`).join('\n')}${extra}`,
        suggestions: ['Make me a study plan', 'How am I doing?', 'Quiz me']
    };
};

const conceptReply = (user, message, a, { formulasOnly = false } = {}) => {
    const exam = EXAMS[user.examType];
    const filter = exam ? (d) => exam.subjects.includes(d.subject) : undefined;
    const hits = searchConcepts(message, { limit: 2, filter });
    const best = hits[0];

    if (best && best.score > 0.08) {
        const k = best.doc.ref;
        const related = searchQuestions(`${message} ${k.topic}`, {
            limit: 1,
            filter: (d) => d.subject === k.subject && (!user.examType || d.examType === user.examType)
        })[0];
        const parts = [conceptMarkdown(k, { formulasOnly })];
        if (related && !formulasOnly) {
            const q = related.doc.ref;
            parts.push('', '**Worked example from the question bank**', `> ${q.question}`, '', `Answer: **${q.options[q.correct]}** — ${q.explanation}`);
        }
        const weak = a?.weakTopics?.find((w) => w.topic === k.topic);
        if (weak) parts.push('', `📌 This is one of your weaker topics (${weak.accuracy}% accuracy). Try a **Custom test** on ${k.topic} to lock it in.`);
        return {
            content: parts.join('\n'),
            suggestions: [`Quiz me on ${L(k.subject)}`, hits[1] && hits[1].score > 0.08 && hits[1].doc.subject === k.subject ? `Explain ${hits[1].doc.ref.title}` : 'Make me a study plan', formulasOnly ? `Explain ${k.title}` : `Formulas for ${k.topic}`]
        };
    }

    const qHits = searchQuestions(message, { limit: 1, filter: user.examType ? (d) => d.examType === user.examType : undefined });
    if (qHits[0] && qHits[0].score > 0.1) {
        const q = qHits[0].doc.ref;
        return {
            content: [
                `Here's what I found about **${q.topic}** (${L(q.subject)}):`,
                '',
                q.theory || q.explanation,
                '',
                '**Related practice question**',
                `> ${q.question}`,
                '',
                `Answer: **${q.options[q.correct]}** — ${q.explanation}`
            ].join('\n'),
            suggestions: [`Quiz me on ${L(q.subject)}`, 'How am I doing?']
        };
    }

    const sampleTopics = KNOWLEDGE.filter((k) => !exam || exam.subjects.includes(k.subject)).map((k) => k.title);
    return {
        content: [
            "I'm running in **offline tutor mode**, so I answer from AdaptPrep's built-in syllabus notes and question bank. I couldn't match that question to a topic yet.",
            '',
            'Try naming the concept directly, for example:',
            ...shuffle(sampleTopics).slice(0, 4).map((x) => `- "Explain ${x}"`),
            '',
            'Or ask me to **analyse your performance**, **make a study plan**, **review your mistakes** or **quiz you**.'
        ].join('\n'),
        suggestions: ['How am I doing?', 'Quiz me', 'Make me a study plan']
    };
};

const helpReply = (user) => {
    const byRole = {
        student: [
            '- 📊 **Analyse your performance** — "How am I doing?"',
            '- 🗓️ **Build a study plan** — "Make me a study plan"',
            '- 🧠 **Explain concepts** — "Explain projectile motion", "Formulas for electrochemistry"',
            '- ❌ **Review mistakes** — "Review my mistakes"',
            '- 🎯 **Quiz you** — "Quiz me on physics"',
            '- 💬 **Exam strategy & motivation** — "Tips for negative marking", "I feel stressed"'
        ],
        teacher: [
            '- 👩‍🏫 **Class insights** — "How are my classes doing?" / "Which students are at risk?"',
            '- ✍️ **Generate questions** — "Generate questions on Electricity"',
            '- 🧠 **Explain concepts** for lesson prep — "Explain Hardy–Weinberg"',
            '- 🎯 **Sample quiz** — "Quiz me on chemistry"'
        ],
        admin: [
            '- 🛡️ **Platform overview** — "Platform stats"',
            '- ✍️ **Generate questions** — "Generate questions on Probability"',
            '- 🧠 **Explain concepts** — "Explain Newton\'s laws"'
        ]
    };
    return {
        content: [`I'm **AdaptPrep AI**, your ${user.role === 'student' ? 'study coach' : 'teaching assistant'}. Here's what I can do:`, '', ...(byRole[user.role] || byRole.student)].join('\n'),
        suggestions: user.role === 'student' ? ['How am I doing?', 'Quiz me', 'Make me a study plan'] : user.role === 'teacher' ? ['How are my classes doing?', 'Generate questions on Kinematics'] : ['Platform stats']
    };
};

// ---------------------------------------------------------------- public API

const localChat = ({ message, user, analytics, session }) => {
    const text = message.trim();

    if (session.pendingQuiz) {
        const graded = gradeQuiz(session, text);
        if (graded) return graded;
        if (/^(another|next|one more|again)\b/i.test(text)) return quizReply(user, analytics, session, text);
        session.pendingQuiz = null;
    }
    if (/^(another( one)?|next( question)?|one more)[\s!.]*$/i.test(text)) return quizReply(user, analytics, session, text);

    const intent = detectIntent(text, user.role);
    switch (intent) {
        case 'greeting': return {
            content: `Hey ${first(user.name)}! 👋 ${user.role === 'student' ? 'Ready to make some progress today? I can analyse your performance, explain a concept, or quiz you.' : 'How can I help you today?'}`,
            suggestions: helpReply(user).suggestions
        };
        case 'thanks': return { content: pick(['Anytime! 🙌', 'Happy to help — keep going! 💪', "You've got this. Ping me whenever you're stuck."]), suggestions: helpReply(user).suggestions };
        case 'help': return helpReply(user);
        case 'class': return classReply(user);
        case 'generate': return generateReply(user, text);
        case 'platform': return platformReply();
        case 'quiz': return quizReply(user, analytics, session, text);
        case 'mistakes': return mistakesReply(user);
        case 'plan': return planReply(user, analytics);
        case 'performance': return user.role === 'student' ? performanceReply(user, analytics) : helpReply(user);
        case 'stress': return strategyReply('stress', user);
        case 'time': return strategyReply('time', user);
        case 'tips': return strategyReply('tips', user);
        case 'formula': return conceptReply(user, text, analytics, { formulasOnly: true });
        default: return conceptReply(user, text, analytics);
    }
};

// Structured 7-day plan, used by the chat and the Study Plan page.
function buildStudyPlan(user, a) {
    const exam = EXAMS[user.examType] || EXAMS.jee;
    const weak = a?.weakTopics || [];
    const untouched = a?.untouchedTopics || [];
    const subjects = [...(a?.subjects || exam.subjects.map((s) => ({ subject: s, accuracy: 0, attempted: 0 })))]
        .sort((x, y) => (x.attempted ? x.accuracy : -1) - (y.attempted ? y.accuracy : -1));
    const focusQueue = [
        ...weak.map((w) => ({ subject: w.subject, topic: w.topic, reason: `${w.accuracy}% accuracy`, kind: 'weak' })),
        ...untouched.map((u) => ({ subject: u.subject, topic: u.topic, reason: 'not attempted yet', kind: 'new' }))
    ];
    while (focusQueue.length < 5) {
        const s = subjects[focusQueue.length % subjects.length];
        focusQueue.push({ subject: s.subject, topic: `${L(s.subject)} mixed revision`, reason: 'keep skills sharp', kind: 'review' });
    }

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const plan = days.map((day, i) => {
        if (i === 5) {
            return { day, focus: 'Full mock test', tasks: [`Take a full ${exam.name} mock under exam conditions`, 'Spend 45 minutes analysing every mistake', 'Note 3 recurring error patterns'], link: { mode: 'full' } };
        }
        if (i === 6) {
            return { day, focus: 'Rest & light revision', tasks: ['Revise your formula sheet (20 min)', 'Re-attempt bookmarked questions', 'Rest — sleep is part of the plan'], link: { page: 'revision' } };
        }
        const f = focusQueue[i % focusQueue.length];
        return {
            day,
            focus: `${f.topic}`,
            subject: f.subject,
            tasks: [
                f.kind === 'new' ? `Learn the core ideas of ${f.topic} (${L(f.subject)}) — ask the AI tutor to explain it` : `Revise ${f.topic} theory and formulas (${f.reason})`,
                `Custom test: 10 questions on ${f.topic}`,
                i % 2 === 0 ? 'AI Adaptive test (15 questions) across all subjects' : 'Review today\'s mistakes and bookmark tricky ones'
            ],
            link: { mode: 'custom', subject: f.subject, topic: f.topic }
        };
    });

    const t = a?.totals;
    const summary = !t || !t.tests
        ? 'No test history yet — this plan starts with diagnostics so the AI can learn your strengths.'
        : `Built from ${t.tests} test${t.tests === 1 ? '' : 's'}: ${weak.length} weak topic${weak.length === 1 ? '' : 's'} and ${untouched.length ? `${untouched.length}+ unexplored topics` : 'good coverage'}. Target: raise accuracy from ${t.accuracy}% towards ${Math.min(95, Math.round(t.accuracy + 10))}%.`;

    const recommendations = [];
    if (t && t.tests) {
        if (t.accuracy < 50) recommendations.push('Prioritise accuracy over speed this week: attempt fewer questions, but only ones you can justify.');
        if (t.avgTimePerQuestion > 100) recommendations.push(`You average ${t.avgTimePerQuestion}s per question — aim for under 90s with timed custom tests.`);
        if (t.coverage < 50) recommendations.push(`You've touched only ${t.coverage}% of topics. Broaden coverage with adaptive tests.`);
        if (a.streak.current < 2) recommendations.push('Build a daily habit: even one 10-question test a day keeps your streak and memory alive.');
        const lastSubj = subjects[0];
        if (lastSubj?.attempted) recommendations.push(`${L(lastSubj.subject)} is your lowest subject (${lastSubj.accuracy}%). Give it an extra 30 minutes daily.`);
    } else {
        recommendations.push('Start with one AI Adaptive test to calibrate your level.', 'Then try one practice set per subject to reveal strong and weak areas.');
    }

    return {
        summary,
        focusAreas: focusQueue.slice(0, 5),
        days: plan,
        recommendations: recommendations.slice(0, 4)
    };
}

const explainQuestion = (q, selected, user) => {
    const lines = [];
    if (selected === null || selected === undefined) {
        lines.push(`You skipped this one. The correct answer is **${letter(q.correct)}. ${q.options[q.correct]}**.`);
    } else if (selected === q.correct) {
        lines.push(`✅ You got this right: **${letter(q.correct)}. ${q.options[q.correct]}**. Here's the reasoning to make sure it wasn't luck:`);
    } else {
        lines.push(`You chose **${letter(selected)}. ${q.options[selected]}**, but the correct answer is **${letter(q.correct)}. ${q.options[q.correct]}**.`);
    }
    lines.push('', '**Step-by-step**', q.explanation);
    if (q.theory) lines.push('', '**Underlying concept**', q.theory);
    const k = searchConcepts(`${q.topic} ${q.question}`, { limit: 1, filter: (d) => d.subject === q.subject })[0];
    if (k && k.score > 0.05) {
        const note = k.doc.ref;
        if (note.formulas.length) lines.push('', `**Formulas to remember (${note.title})**`, ...note.formulas.slice(0, 4).map((f) => `- \`${f}\``));
        if (note.tips.length) lines.push('', `💡 ${note.tips[0]}`);
    }
    if (selected !== null && selected !== undefined && selected !== q.correct) {
        lines.push('', `**How to avoid this mistake:** re-read what the question asks, write the governing formula for ${q.topic} before substituting, and check units in your final answer.`);
    }
    return lines.join('\n');
};

const classInsights = (klass, ca) => {
    const recs = [];
    if (!ca.studentCount) recs.push(`Share the join code **${klass.code}** with students so they can join this class.`);
    if (ca.atRisk.length) recs.push(`Reach out to ${ca.atRisk.slice(0, 3).map((s) => s.name).join(', ')}${ca.atRisk.length > 3 ? ` and ${ca.atRisk.length - 3} more` : ''} — they are flagged as at-risk.`);
    if (ca.weakTopics[0]) recs.push(`Run a 10-question assignment on **${ca.weakTopics[0].topic}** — class accuracy there is only ${ca.weakTopics[0].accuracy}%.`);
    if (ca.weakTopics[1]) recs.push(`Schedule a quick concept recap on **${ca.weakTopics[1].topic}** (${ca.weakTopics[1].accuracy}%).`);
    if (ca.strongTopics[0]) recs.push(`The class is confident in **${ca.strongTopics[0].topic}** (${ca.strongTopics[0].accuracy}%) — reduce time spent there.`);
    if (ca.studentCount && ca.activeStudents < ca.studentCount) recs.push(`${ca.studentCount - ca.activeStudents} student(s) haven't taken any test yet. A short, low-stakes assignment can help them start.`);
    const summary = ca.activeStudents
        ? `${ca.activeStudents} of ${ca.studentCount} students are active with an average score of ${ca.avgPercent}% and accuracy of ${ca.avgAccuracy}%.`
        : 'No test activity yet in this class.';
    return { summary, recommendations: recs };
};

module.exports = { localChat, buildStudyPlan, explainQuestion, classInsights, detectIntent };
