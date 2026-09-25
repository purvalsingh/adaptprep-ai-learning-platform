// End-to-end API tests. Run with `npm test` (uses an in-memory database).
process.env.DB_FILE = ':memory:';
process.env.DISABLE_RATE_LIMIT = 'true';
process.env.JWT_SECRET = 'test-secret-that-is-long-enough';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { getStore } = require('../db/store');
const { seed, DEMO_ACCOUNTS } = require('../db/seed');
const { createApp } = require('../app');

let server;
let base;

const call = async (method, path, { token, body } = {}) => {
    const res = await fetch(`${base}${path}`, {
        method,
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: body ? JSON.stringify(body) : undefined
    });
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
};

const login = async (account) => (await call('POST', '/api/auth/login', { body: account })).data.token;

let tokens = {};

before(async () => {
    seed();
    server = createApp().listen(0);
    base = `http://127.0.0.1:${server.address().port}`;
    tokens = {
        admin: await login(DEMO_ACCOUNTS.admin),
        teacher: await login(DEMO_ACCOUNTS.teacher),
        student: await login(DEMO_ACCOUNTS.student),
        neet: await login(DEMO_ACCOUNTS.neet)
    };
});

after(() => server.close());

test('public endpoints respond without auth', async () => {
    const health = await call('GET', '/api/public/health');
    assert.equal(health.status, 200);
    const stats = await call('GET', '/api/public/stats');
    assert.equal(stats.data.questions, 600);
});

test('signup validates input and never allows self-registered admins', async () => {
    assert.equal((await call('POST', '/api/auth/signup', { body: { name: 'A', email: 'x@y.com', password: 'abcdefg1' } })).status, 400);
    assert.equal((await call('POST', '/api/auth/signup', { body: { name: 'Test', email: 'bad-email', password: 'abcdefg1' } })).status, 400);
    assert.equal((await call('POST', '/api/auth/signup', { body: { name: 'Test', email: 'weak@x.com', password: 'short' } })).status, 400);
    assert.equal((await call('POST', '/api/auth/signup', { body: { name: 'Test', email: 'root@x.com', password: 'abcdefg1', role: 'admin' } })).status, 400);
    const ok = await call('POST', '/api/auth/signup', { body: { name: 'New Student', email: 'new@x.com', password: 'abcdefg1', examType: 'neet' } });
    assert.equal(ok.status, 201);
    assert.equal(ok.data.user.role, 'student');
    assert.equal(ok.data.user.passwordHash, undefined);
    assert.equal((await call('POST', '/api/auth/signup', { body: { name: 'Dup', email: 'NEW@x.com', password: 'abcdefg1' } })).status, 409);
});

test('login rejects wrong credentials', async () => {
    const res = await call('POST', '/api/auth/login', { body: { email: DEMO_ACCOUNTS.student.email, password: 'wrong-pass1' } });
    assert.equal(res.status, 401);
});

test('role boundaries are enforced', async () => {
    assert.equal((await call('GET', '/api/admin/overview', { token: tokens.student })).status, 403);
    assert.equal((await call('GET', '/api/admin/overview', { token: tokens.teacher })).status, 403);
    assert.equal((await call('GET', '/api/questions', { token: tokens.student })).status, 403);
    assert.equal((await call('POST', '/api/tests/start', { token: tokens.teacher, body: { mode: 'adaptive' } })).status, 403);
    assert.equal((await call('GET', '/api/admin/overview', { token: tokens.admin })).status, 200);
    assert.equal((await call('GET', '/api/tests/catalog')).status, 401);
});

test('running tests never expose answers; grading happens on the server', async () => {
    const start = await call('POST', '/api/tests/start', { token: tokens.student, body: { mode: 'practice', subject: 'physics', testSet: 5 } });
    assert.equal(start.status, 201);
    const { attempt } = start.data;
    assert.equal(attempt.status, 'in_progress');
    attempt.questions.forEach((q) => {
        assert.equal(q.correct, undefined);
        assert.equal(q.explanation, undefined);
        assert.equal(q.theory, undefined);
    });

    // Another student cannot see or modify it.
    assert.equal((await call('GET', `/api/tests/attempts/${attempt.id}`, { token: tokens.neet })).status, 404);
    // Teachers cannot peek at a live test either.
    assert.equal((await call('GET', `/api/tests/attempts/${attempt.id}`, { token: tokens.teacher })).status, 404);

    const store = getStore();
    const answers = {};
    attempt.questions.forEach((q, i) => { if (i < 6) answers[q.id] = store.byId('questions', q.id).correct; });
    answers['not-a-question'] = 1;
    const patch = await call('PATCH', `/api/tests/attempts/${attempt.id}`, { token: tokens.student, body: { answers } });
    assert.equal(patch.status, 200);

    const wrongIdx = (store.byId('questions', attempt.questions[6].id).correct + 1) % 4;
    const submit = await call('POST', `/api/tests/attempts/${attempt.id}/submit`, { token: tokens.student, body: { answers: { [attempt.questions[6].id]: wrongIdx } } });
    assert.equal(submit.status, 200);
    const { score } = submit.data.attempt;
    assert.equal(score.correct, 6);
    assert.equal(score.incorrect, 1);
    assert.equal(score.skipped, 3);
    assert.equal(score.marks, 6 * 4 - 1);
    assert.ok(submit.data.attempt.questions[0].correct !== undefined, 'answers revealed after submission');

    // Cannot change answers after submission.
    assert.equal((await call('PATCH', `/api/tests/attempts/${attempt.id}`, { token: tokens.student, body: { answers: {} } })).status, 409);

    // Teacher of the student's class can review the submitted attempt.
    assert.equal((await call('GET', `/api/tests/attempts/${attempt.id}`, { token: tokens.teacher })).status, 200);

    // AI can explain a question from a submitted attempt.
    const explain = await call('POST', '/api/ai/explain', { token: tokens.student, body: { attemptId: attempt.id, questionId: attempt.questions[6].id } });
    assert.equal(explain.status, 200);
    assert.match(explain.data.content, /correct answer/i);
});

test('expired tests are auto-submitted by the server', async () => {
    const start = await call('POST', '/api/tests/start', { token: tokens.student, body: { mode: 'adaptive', count: 5 } });
    const record = getStore().byId('attempts', start.data.attempt.id);
    record.startedAt = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const res = await call('PATCH', `/api/tests/attempts/${record.id}`, { token: tokens.student, body: { answers: {} } });
    assert.equal(res.status, 409);
    assert.equal(getStore().byId('attempts', record.id).status, 'submitted');
});

test('students can only bookmark questions they have attempted', async () => {
    const store = getStore();
    const unseen = store.findOne('questions', (q) => q.examType === 'jee' && q.subject === 'physics' && q.testSet === 10);
    assert.equal((await call('POST', `/api/me/bookmarks/${unseen.id}`, { token: tokens.student })).status, 403);
    const seen = store.findOne('attempts', (a) => a.status === 'submitted' && a.userId === store.findOne('users', (u) => u.email === DEMO_ACCOUNTS.student.email).id).questionIds[0];
    const ok = await call('POST', `/api/me/bookmarks/${seen}`, { token: tokens.student });
    assert.equal(ok.status, 200);
    assert.equal(ok.data.bookmarked, true);
});

test('classes: join by code, exam must match, teachers see only their students', async () => {
    const created = await call('POST', '/api/classes', { token: tokens.teacher, body: { name: 'Test Class', examType: 'neet' } });
    assert.equal(created.status, 201);
    const { code, id } = created.data.class;
    assert.match(code, /^[A-Z2-9]{6}$/);

    const mismatch = await call('POST', '/api/classes/join', { token: tokens.student, body: { code } });
    assert.equal(mismatch.status, 400);
    const joined = await call('POST', '/api/classes/join', { token: tokens.neet, body: { code: code.toLowerCase() } });
    assert.equal(joined.status, 200);
    assert.equal((await call('POST', '/api/classes/join', { token: tokens.neet, body: { code } })).status, 409);

    // Students cannot see the roster analytics; another teacher cannot manage the class.
    assert.equal((await call('GET', `/api/classes/${id}/analytics`, { token: tokens.neet })).status, 403);
    const signup = await call('POST', '/api/auth/signup', { body: { name: 'Other Teacher', email: 'other@x.com', password: 'abcdefg1', role: 'teacher' } });
    assert.equal((await call('GET', `/api/classes/${id}/analytics`, { token: signup.data.token })).status, 403);
    assert.equal((await call('DELETE', `/api/classes/${id}`, { token: signup.data.token })).status, 403);
    const student = getStore().findOne('users', (u) => u.email === DEMO_ACCOUNTS.student.email);
    assert.equal((await call('GET', `/api/analytics/student/${student.id}`, { token: signup.data.token })).status, 403);
    assert.equal((await call('GET', `/api/analytics/student/${student.id}`, { token: tokens.teacher })).status, 200);
});

test('assignments: create, attempt once, report', async () => {
    const classes = (await call('GET', '/api/classes', { token: tokens.teacher })).data.classes;
    const jee = classes.find((c) => c.examType === 'jee');
    const past = await call('POST', '/api/assignments', { token: tokens.teacher, body: { classId: jee.id, title: 'Past', auto: { count: 3 }, dueAt: '2000-01-01' } });
    assert.equal(past.status, 400);

    const created = await call('POST', '/api/assignments', {
        token: tokens.teacher,
        body: { classId: jee.id, title: 'Quick Check', auto: { subject: 'mathematics', count: 4 }, durationMin: 10, dueAt: new Date(Date.now() + 86400000).toISOString() }
    });
    assert.equal(created.status, 201);
    const aid = created.data.assignment.id;

    const start = await call('POST', '/api/tests/start', { token: tokens.student, body: { mode: 'assignment', assignmentId: aid } });
    assert.equal(start.status, 201);
    // Starting again resumes the same attempt.
    const resume = await call('POST', '/api/tests/start', { token: tokens.student, body: { mode: 'assignment', assignmentId: aid } });
    assert.equal(resume.data.attempt.id, start.data.attempt.id);
    await call('POST', `/api/tests/attempts/${start.data.attempt.id}/submit`, { token: tokens.student, body: {} });
    const again = await call('POST', '/api/tests/start', { token: tokens.student, body: { mode: 'assignment', assignmentId: aid } });
    assert.equal(again.status, 409);

    // A student outside the class cannot start it.
    assert.equal((await call('POST', '/api/tests/start', { token: tokens.neet, body: { mode: 'assignment', assignmentId: aid } })).status, 403);

    const report = await call('GET', `/api/assignments/${aid}`, { token: tokens.teacher });
    assert.equal(report.status, 200);
    assert.equal(report.data.stats.submitted, 1);
    assert.equal(report.data.questions.length, 4);
});

test('admin: suspension revokes sessions immediately; last admin is protected', async () => {
    const signup = await call('POST', '/api/auth/signup', { body: { name: 'Soon Suspended', email: 'sus@x.com', password: 'abcdefg1' } });
    const token = signup.data.token;
    assert.equal((await call('GET', '/api/auth/me', { token })).status, 200);
    const upd = await call('PUT', `/api/admin/users/${signup.data.user.id}`, { token: tokens.admin, body: { status: 'suspended' } });
    assert.equal(upd.status, 200);
    assert.equal((await call('GET', '/api/auth/me', { token })).status, 401);
    assert.equal((await call('POST', '/api/auth/login', { body: { email: 'sus@x.com', password: 'abcdefg1' } })).status, 403);

    const admin = getStore().findOne('users', (u) => u.role === 'admin');
    assert.equal((await call('PUT', `/api/admin/users/${admin.id}`, { token: tokens.admin, body: { role: 'student' } })).status, 403);
    assert.equal((await call('DELETE', `/api/admin/users/${admin.id}`, { token: tokens.admin })).status, 403);

    const reset = await call('POST', `/api/admin/users/${signup.data.user.id}/reset-password`, { token: tokens.admin });
    assert.match(reset.data.temporaryPassword, /^Temp-/);
});

test('password change signs out other sessions', async () => {
    const signup = await call('POST', '/api/auth/signup', { body: { name: 'Pw Changer', email: 'pw@x.com', password: 'abcdefg1' } });
    const old = signup.data.token;
    const res = await call('POST', '/api/auth/change-password', { token: old, body: { currentPassword: 'abcdefg1', newPassword: 'newpass123' } });
    assert.equal(res.status, 200);
    assert.equal((await call('GET', '/api/auth/me', { token: old })).status, 401);
    assert.equal((await call('GET', '/api/auth/me', { token: res.data.token })).status, 200);
});

test('AI tutor chat works offline and remembers quiz state', async () => {
    const session = (await call('POST', '/api/ai/chats', { token: tokens.student })).data.session;
    const r1 = await call('POST', `/api/ai/chats/${session.id}/messages`, { token: tokens.student, body: { message: 'How am I doing?' } });
    assert.equal(r1.status, 200);
    assert.match(r1.data.message.content, /Accuracy/);
    const r2 = await call('POST', `/api/ai/chats/${session.id}/messages`, { token: tokens.student, body: { message: 'Quiz me' } });
    assert.match(r2.data.message.content, /Reply with/);
    const r3 = await call('POST', `/api/ai/chats/${session.id}/messages`, { token: tokens.student, body: { message: 'a' } });
    assert.match(r3.data.message.content, /(Correct|Not quite)/);
    // Other users cannot read this conversation.
    assert.equal((await call('GET', `/api/ai/chats/${session.id}`, { token: tokens.neet })).status, 404);

    const plan = await call('GET', '/api/ai/study-plan', { token: tokens.student });
    assert.equal(plan.data.plan.days.length, 7);
});

test('teachers can generate, review and save AI questions', async () => {
    const gen = await call('POST', '/api/questions/generate', { token: tokens.teacher, body: { examType: 'jee', subject: 'physics', count: 4 } });
    assert.equal(gen.status, 200);
    assert.equal(gen.data.questions.length, 4);
    const saved = await call('POST', '/api/questions/bulk', { token: tokens.teacher, body: { questions: gen.data.questions } });
    assert.equal(saved.status, 201);
    const id = saved.data.questions[0].id;
    // Teachers cannot edit bank questions, but can edit their own.
    const bankQ = getStore().findOne('questions', (q) => q.source === 'bank');
    assert.equal((await call('PUT', `/api/questions/${bankQ.id}`, { token: tokens.teacher, body: { topic: 'Hacked' } })).status, 403);
    assert.equal((await call('PUT', `/api/questions/${id}`, { token: tokens.teacher, body: { topic: 'Edited Topic' } })).status, 200);
    assert.equal((await call('DELETE', `/api/questions/${id}`, { token: tokens.teacher })).status, 200);
    assert.equal(getStore().byId('questions', id).status, 'archived');
});
