const EXAMS = {
    jee: {
        id: 'jee',
        name: 'JEE Main',
        subjects: ['physics', 'chemistry', 'mathematics']
    },
    neet: {
        id: 'neet',
        name: 'NEET UG',
        subjects: ['physics', 'chemistry', 'biology']
    }
};

const EXAM_TYPES = Object.keys(EXAMS);
const ALL_SUBJECTS = ['physics', 'chemistry', 'mathematics', 'biology'];
const DIFFICULTIES = ['easy', 'medium', 'hard'];
const ROLES = ['student', 'teacher', 'admin'];
const AVATARS = Array.from({ length: 10 }, (_, i) => `avatar_${i + 1}.jpg`);

// Standard JEE Main / NEET marking: +4 for correct, -1 for incorrect, 0 for skipped.
const MARKING = { correct: 4, incorrect: -1, skipped: 0 };

// Seconds allotted per question for generated tests.
const SECONDS_PER_QUESTION = 90;
// Server-side grace period for network latency before an attempt is force-submitted.
const SUBMIT_GRACE_SECONDS = 30;

const subjectLabel = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');

module.exports = {
    EXAMS,
    EXAM_TYPES,
    ALL_SUBJECTS,
    DIFFICULTIES,
    ROLES,
    AVATARS,
    MARKING,
    SECONDS_PER_QUESTION,
    SUBMIT_GRACE_SECONDS,
    subjectLabel
};
