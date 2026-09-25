// AI orchestrator: routes each request to the external LLM when configured and
// always falls back to the built-in local engine so AI features never break.

const gemini = require('./gemini');
const local = require('./localEngine');
const { generateQuestions, generatorTopics } = require('./generator');
const { subjectLabel, EXAMS } = require('../lib/constants');

const LOCAL_NAME = 'AdaptPrep Local AI';

const status = () => ({
    provider: gemini.isConfigured() ? 'gemini' : 'local',
    label: gemini.isConfigured() ? `Google Gemini (${process.env.GEMINI_MODEL || 'gemini-2.5-flash'}) with local fallback` : LOCAL_NAME,
    external: gemini.isConfigured()
});

const contextBlock = (user, a) => {
    if (user.role !== 'student') return `The user is a ${user.role} named ${user.name} on AdaptPrep, a JEE/NEET preparation platform.`;
    const exam = EXAMS[user.examType]?.name || 'JEE/NEET';
    if (!a || !a.totals.tests) return `Student ${user.name} is preparing for ${exam}. They have not taken any tests yet.`;
    return [
        `Student ${user.name} is preparing for ${exam}.`,
        `Tests: ${a.totals.tests}, accuracy ${a.totals.accuracy}%, average score ${a.totals.avgPercent}%, readiness ${a.totals.readiness}/100, streak ${a.streak.current} days.`,
        `Subjects: ${a.subjects.map((s) => `${subjectLabel(s.subject)} ${s.accuracy}%`).join(', ')}.`,
        `Weak topics: ${a.weakTopics.map((t) => `${t.topic} (${t.accuracy}%)`).join(', ') || 'none identified'}.`,
        `Strong topics: ${a.strongTopics.map((t) => t.topic).join(', ') || 'none identified'}.`
    ].join('\n');
};

const SYSTEM = (user, a) => `You are AdaptPrep AI, a warm, precise tutor for Indian competitive exams (JEE Main, NEET UG).
Answer in concise Markdown with short paragraphs, bullet lists and formulas in backticks. Use SI units.
Stay on educational topics; politely decline unrelated or unsafe requests. Never invent the student's data.
${contextBlock(user, a)}`;

// Intents that depend on server data are always answered locally so they stay accurate.
const LOCAL_ONLY = new Set(['performance', 'plan', 'mistakes', 'quiz', 'class', 'generate', 'platform', 'greeting', 'thanks', 'help']);

const chat = async ({ message, user, analytics, session }) => {
    const intent = local.detectIntent(message, user.role);
    const quizPending = Boolean(session.pendingQuiz);

    if (gemini.isConfigured() && !LOCAL_ONLY.has(intent) && !quizPending) {
        try {
            const history = session.messages.slice(-12).map((m) => ({ role: m.role, content: m.content }));
            const content = await gemini.generate({ system: SYSTEM(user, analytics), messages: [...history, { role: 'user', content: message }] });
            return { content, suggestions: [], provider: 'gemini' };
        } catch (err) {
            console.warn('[ai] Gemini failed, using local engine:', err.message);
        }
    }
    const reply = local.localChat({ message, user, analytics, session });
    return { ...reply, provider: 'local' };
};

const explain = async ({ question, selected, user }) => {
    if (gemini.isConfigured()) {
        try {
            const prompt = [
                `Question (${question.topic}, ${subjectLabel(question.subject)}): ${question.question}`,
                `Options: ${question.options.map((o, i) => `${String.fromCharCode(65 + i)}. ${o}`).join(' | ')}`,
                `Correct: ${String.fromCharCode(65 + question.correct)}. Student chose: ${selected === null || selected === undefined ? 'nothing (skipped)' : String.fromCharCode(65 + selected)}.`,
                `Reference explanation: ${question.explanation}`,
                'Explain step by step why the correct answer is right, why the student\'s choice is wrong (if it is), and give one tip to avoid the mistake.'
            ].join('\n');
            const content = await gemini.generate({ system: SYSTEM(user, null), messages: [{ role: 'user', content: prompt }], maxTokens: 800 });
            return { content, provider: 'gemini' };
        } catch (err) {
            console.warn('[ai] Gemini explain failed, using local engine:', err.message);
        }
    }
    return { content: local.explainQuestion(question, selected, user), provider: 'local' };
};

module.exports = {
    status,
    chat,
    explain,
    studyPlan: (user, analytics) => ({ ...local.buildStudyPlan(user, analytics), provider: 'local' }),
    classInsights: local.classInsights,
    generateQuestions,
    generatorTopics
};
