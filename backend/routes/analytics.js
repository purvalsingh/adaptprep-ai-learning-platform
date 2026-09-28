const express = require('express');
const { getStore } = require('../db/store');
const { asyncHandler, notFound } = require('../lib/http');
const { computeStudentAnalytics } = require('../services/analytics');
const { assertCanViewStudent } = require('../services/access');
const { publicUser } = require('../middleware/auth');

const router = express.Router();

const tz = (req) => {
    const n = parseInt(req.query.tz, 10);
    return Number.isFinite(n) && Math.abs(n) <= 840 ? n : 0;
};

router.get('/me', (req, res) => {
    res.json({ analytics: computeStudentAnalytics(req.user.id, { tzOffset: tz(req) }) });
});

router.get('/student/:id', asyncHandler(async (req, res) => {
    const student = getStore().byId('users', req.params.id);
    if (!student || student.role !== 'student') throw notFound('Student not found.');
    assertCanViewStudent(req.user, student.id);
    res.json({ student: publicUser(student), analytics: computeStudentAnalytics(student.id, { tzOffset: tz(req) }) });
}));

module.exports = router;
