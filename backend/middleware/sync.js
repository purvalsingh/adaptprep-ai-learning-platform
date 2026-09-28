// Keeps the in-memory store in step with Redis when running on a hosted
// database (see db/store.js). Requests in one instance run one at a time so a
// reload can never swap data out from under a handler; each request sees the
// latest data and its changes are saved before the response goes out.
// With the local JSON file this middleware does nothing.

const { getStore } = require('../db/store');
const { seed } = require('../db/seed');
const { sweepExpired } = require('../services/attempts');
const { getJwtSecret } = require('../lib/secrets');

const SWEEP_EVERY_MS = 30 * 1000;
const SEED_WAIT_MS = 30 * 1000;

let ready = null;
let queue = Promise.resolve();
let lastSweep = 0;

const needsSeed = (store) => !store.all('questions').length || !store.all('users').length;

// First request in an instance: load the data, seeding an empty database once
// (the lock stops two cold starts from both creating the demo workspace).
const init = async (store) => {
    await store.pull({ force: true });
    if (!needsSeed(store)) return;
    const seeded = await store.withInitLock(async () => {
        await store.pull({ force: true });
        if (needsSeed(store)) seed();
        getJwtSecret();
        await store.push();
    });
    if (seeded) return;
    const deadline = Date.now() + SEED_WAIT_MS;
    while (needsSeed(store) && Date.now() < deadline) {
        await new Promise((r) => setTimeout(r, 500));
        await store.pull({ force: true });
    }
};

const syncStore = (req, res, next) => {
    const store = getStore();
    if (!store.remote) return next();

    let release;
    const slot = new Promise((r) => { release = r; });
    const turn = queue;
    queue = queue.then(() => slot);

    turn.then(async () => {
        ready = ready || init(store).catch((err) => { ready = null; throw err; });
        await ready;
        await store.pull();
        if (Date.now() - lastSweep > SWEEP_EVERY_MS) {
            lastSweep = Date.now();
            sweepExpired();
        }
    }).then(() => {
        const end = res.end;
        let ending = false;
        res.end = function (...args) {
            if (ending) return end.apply(res, args);
            ending = true;
            store.push()
                .catch((err) => {
                    console.error(err);
                    store.version = null; // discard unsaved changes on the next pull
                    if (!res.headersSent) {
                        res.statusCode = 503;
                        res.setHeader('Content-Type', 'application/json; charset=utf-8');
                        res.removeHeader('Content-Length');
                        args = [JSON.stringify({ message: 'Could not save your changes. Please try again.' })];
                    }
                })
                .finally(() => {
                    end.apply(res, args);
                    release();
                });
            return res;
        };
        // Client went away before a response: still save and free the queue.
        res.once('close', () => {
            if (!ending) store.push().catch((err) => console.error(err)).finally(release);
        });
        next();
    }).catch((err) => {
        release();
        console.error(err);
        res.status(503).json({ message: 'Database unavailable. Please try again shortly.' });
    });
};

module.exports = { syncStore };
