const express = require('express');
const { getStore } = require('../db/store');
const { EXAMS } = require('../lib/constants');
const { activeQuestions } = require('../services/questions');
const ai = require('../ai');

const router = express.Router();

router.get('/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// Real numbers for the landing page — no marketing fiction.
router.get('/stats', (req, res) => {
    const store = getStore();
    const questions = activeQuestions();
    const topics = new Set(questions.map((q) => `${q.subject}::${q.topic}`));
    res.json({
        questions: questions.length,
        topics: topics.size,
        exams: Object.values(EXAMS).map((e) => ({ id: e.id, name: e.name, subjects: e.subjects })),
        testsTaken: store.find('attempts', (a) => a.status === 'submitted').length,
        ai: ai.status().label
    });
});

module.exports = router;
