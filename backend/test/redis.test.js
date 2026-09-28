// Hosted-database mode, against a small in-process fake of the Upstash REST API.
process.env.DISABLE_RATE_LIMIT = 'true';
process.env.JWT_SECRET = 'test-secret-that-is-long-enough';

const http = require('http');
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');

// --- Fake Upstash: just the commands the store uses. ---
const kv = new Map();
const run = ([cmd, key, ...args]) => {
    switch (cmd.toUpperCase()) {
        case 'GET': return kv.has(key) ? kv.get(key) : null;
        case 'SET':
            if (args.includes('NX') && kv.has(key)) return null;
            kv.set(key, args[0]);
            return 'OK';
        case 'DEL': return kv.delete(key) ? 1 : 0;
        case 'INCR': {
            const n = Number(kv.get(key) || 0) + 1;
            kv.set(key, String(n));
            return n;
        }
        case 'HSET': {
            const h = kv.get(key) || new Map();
            let added = 0;
            for (let i = 0; i < args.length; i += 2) {
                if (!h.has(args[i])) added++;
                h.set(args[i], args[i + 1]);
            }
            kv.set(key, h);
            return added;
        }
        case 'HDEL': {
            const h = kv.get(key) || new Map();
            return args.filter((f) => h.delete(f)).length;
        }
        case 'HGETALL': return [...(kv.get(key) || new Map())].flat();
        default: throw new Error(`unsupported ${cmd}`);
    }
};
let requests = 0;
const fake = http.createServer((req, res) => {
    let body = '';
    req.on('data', (c) => { body += c; });
    req.on('end', () => {
        requests++;
        if (req.headers.authorization !== 'Bearer fake-token') {
            res.writeHead(401).end(JSON.stringify({ error: 'unauthorized' }));
            return;
        }
        const out = JSON.parse(body).map((c) => {
            try { return { result: run(c) }; } catch (err) { return { error: err.message }; }
        });
        res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify(out));
    });
});

let base;
let server;
let createRedis;
let Store;

before(async () => {
    await new Promise((r) => fake.listen(0, r));
    process.env.UPSTASH_REDIS_REST_URL = `http://127.0.0.1:${fake.address().port}`;
    process.env.UPSTASH_REDIS_REST_TOKEN = 'fake-token';
    ({ createRedis } = require('../db/redis'));
    ({ Store } = require('../db/store'));
    const { createApp } = require('../app');
    server = createApp().listen(0);
    await new Promise((r) => server.once('listening', r));
    base = `http://127.0.0.1:${server.address().port}`;
});

after(() => {
    server.close();
    fake.close();
});

const newInstance = () => new Store(undefined, {
    redis: createRedis({ url: process.env.UPSTASH_REDIS_REST_URL, token: 'fake-token' })
});

const call = async (method, path, { token, body } = {}) => {
    const res = await fetch(`${base}${path}`, {
        method,
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: body ? JSON.stringify(body) : undefined
    });
    return { status: res.status, data: await res.json().catch(() => ({})) };
};

test('first request seeds the empty database once', async () => {
    const { DEMO_ACCOUNTS } = require('../db/seed');
    const results = await Promise.all([1, 2, 3].map(() => call('POST', '/api/auth/login', { body: DEMO_ACCOUNTS.student })));
    results.forEach((r) => assert.equal(r.status, 200));

    const other = newInstance();
    await other.pull();
    assert.ok(other.all('questions').length > 0);
    const students = other.find('users', (u) => u.email === DEMO_ACCOUNTS.student.email);
    assert.equal(students.length, 1);
});

test('writes through the API are persisted and visible to other instances', async () => {
    const signup = await call('POST', '/api/auth/signup', { body: { name: 'Persisted Student', email: 'persist@x.com', password: 'abcdefg1', examType: 'jee' } });
    assert.equal(signup.status, 201);

    const other = newInstance();
    await other.pull();
    const user = other.findOne('users', (u) => u.email === 'persist@x.com');
    assert.ok(user);
    assert.equal(user.name, 'Persisted Student');

    // A change made by another instance shows up on the next API request.
    other.update('users', user.id, { name: 'Renamed Elsewhere' });
    await other.push();
    const me = await call('GET', '/api/auth/me', { token: signup.data.token });
    assert.equal(me.status, 200);
    assert.equal(JSON.stringify(me.data).includes('Renamed Elsewhere'), true);
});

test('store keeps order, applies deletes and only writes what changed', async () => {
    const a = newInstance();
    const b = newInstance();
    await a.pull();
    const firstIds = a.all('questions').slice(0, 12).map((q) => q.id);

    const docs = a.insertMany('announcements', [{ title: 'one' }, { title: 'two' }, { title: 'three' }]);
    await a.push();
    await b.pull();
    assert.deepEqual(b.all('questions').slice(0, 12).map((q) => q.id), firstIds);
    const titles = (s) => s.all('announcements').filter((x) => ['one', 'two', 'three'].includes(x.title)).map((x) => x.title);
    assert.deepEqual(titles(b), ['one', 'two', 'three']);

    b.remove('announcements', docs[1].id);
    await b.push();
    await a.pull();
    assert.deepEqual(titles(a), ['one', 'three']);

    const before = requests;
    assert.equal(await a.push(), 0); // nothing changed: no write
    await a.pull(); // up to date: one cheap version check
    assert.equal(requests - before, 1);
});

test('a lost race forces a full reload instead of hiding the other write', async () => {
    const a = newInstance();
    const b = newInstance();
    await a.pull();
    await b.pull();
    a.insert('audit', { action: 'from-a' });
    b.insert('audit', { action: 'from-b' });
    await a.push();
    await b.push(); // b now knows it missed a's write
    await b.pull();
    const actions = b.all('audit').map((x) => x.action);
    assert.ok(actions.includes('from-a'));
    assert.ok(actions.includes('from-b'));
});
