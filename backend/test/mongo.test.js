// Hosted-database mode against a real MongoDB replica set. Skipped unless
// MONGODB_TEST_URI is set, e.g. a local one:
//   docker run -d --name mongo-rs -p 27099:27017 mongo:7 --replSet rs0
//   docker exec mongo-rs mongosh --eval 'rs.initiate({_id:"rs0",members:[{_id:0,host:"127.0.0.1:27017"}]})'
//   MONGODB_TEST_URI='mongodb://127.0.0.1:27099/?directConnection=true' npm test
process.env.DISABLE_RATE_LIMIT = 'true';
process.env.JWT_SECRET = 'test-secret-that-is-long-enough';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');

const URI = process.env.MONGODB_TEST_URI;
const skip = !URI && 'set MONGODB_TEST_URI to run';
const dbName = `adaptprep_test_${Date.now()}`;

let base;
let server;
let createMongo;
let Store;
let COLLECTIONS;
const instances = [];

before(async () => {
    if (skip) return;
    process.env.MONGODB_URI = URI;
    process.env.MONGODB_DB = dbName;
    ({ createMongo } = require('../db/mongo'));
    ({ Store, COLLECTIONS } = require('../db/store'));
    const { createApp } = require('../app');
    server = createApp().listen(0);
    await new Promise((r) => server.once('listening', r));
    base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
    if (skip) return;
    server.close();
    const { getStore } = require('../db/store');
    const { client } = getStore().mongo;
    await client.db(dbName).dropDatabase();
    await Promise.all([client, ...instances].map((c) => c.close()));
});

const newInstance = () => {
    const mongo = createMongo({ uri: URI, dbName }, COLLECTIONS);
    instances.push(mongo.client);
    return new Store(undefined, { mongo });
};

const call = async (method, path, { token, body } = {}) => {
    const res = await fetch(`${base}${path}`, {
        method,
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: body ? JSON.stringify(body) : undefined
    });
    return { status: res.status, data: await res.json().catch(() => ({})) };
};

test('first request seeds the empty database once', { skip }, async () => {
    const { DEMO_ACCOUNTS } = require('../db/seed');
    const results = await Promise.all([1, 2, 3].map(() => call('POST', '/api/auth/login', { body: DEMO_ACCOUNTS.student })));
    results.forEach((r) => assert.equal(r.status, 200));

    const other = newInstance();
    await other.pull();
    assert.ok(other.all('questions').length > 0);
    assert.equal(other.find('users', (u) => u.email === DEMO_ACCOUNTS.student.email).length, 1);
    // Fields round-trip exactly (no leaked _id/_seq, nested data intact).
    const q = other.all('questions')[0];
    assert.equal('_id' in q || '_seq' in q, false);
    assert.ok(Array.isArray(q.options));
});

test('writes through the API are persisted and visible to other instances', { skip }, async () => {
    const signup = await call('POST', '/api/auth/signup', { body: { name: 'Persisted Student', email: 'persist@x.com', password: 'abcdefg1', examType: 'jee' } });
    assert.equal(signup.status, 201);

    const other = newInstance();
    await other.pull();
    const user = other.findOne('users', (u) => u.email === 'persist@x.com');
    assert.ok(user);

    other.update('users', user.id, { name: 'Renamed Elsewhere' });
    await other.push();
    const me = await call('GET', '/api/auth/me', { token: signup.data.token });
    assert.equal(me.status, 200);
    assert.equal(JSON.stringify(me.data).includes('Renamed Elsewhere'), true);
});

test('store keeps order, applies deletes and only writes what changed', { skip }, async () => {
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
    assert.equal(await a.push(), 0);
});

test('a lost race forces a full reload instead of hiding the other write', { skip }, async () => {
    const a = newInstance();
    const b = newInstance();
    await a.pull();
    await b.pull();
    a.insert('audit', { action: 'from-a' });
    b.insert('audit', { action: 'from-b' });
    await a.push();
    await b.push();
    await b.pull();
    const actions = b.all('audit').map((x) => x.action);
    assert.ok(actions.includes('from-a'));
    assert.ok(actions.includes('from-b'));
});
