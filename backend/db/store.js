// Lightweight embedded document store.
//
// Data lives in memory and is persisted to a single JSON file with atomic
// writes (write to a temp file, then rename). This keeps AdaptPrep runnable
// with zero external services while still behaving like a small database.
// Set DB_FILE=":memory:" to disable persistence (used by the test suite).
//
// With a hosted database the data is persisted there instead, so it survives
// serverless restarts and is shared by every instance: MongoDB when
// MONGODB_URI is set (e.g. Atlas), otherwise Upstash Redis when its
// credentials are present (UPSTASH_REDIS_REST_URL/TOKEN or Vercel's
// KV_REST_API_URL/TOKEN). The API stays synchronous: pull() refreshes memory
// before a request and push() writes the records that changed before the
// response is sent (see middleware/sync.js).

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { redisConfig, createRedis } = require('./redis');
const { mongoConfig, createMongo } = require('./mongo');

const COLLECTIONS = [
    'users',
    'questions',
    'attempts',
    'classes',
    'assignments',
    'announcements',
    'chats',
    'audit'
];

// Vercel's filesystem is read-only except /tmp (which is ephemeral per instance).
const DEFAULT_FILE = process.env.VERCEL
    ? '/tmp/adaptprep-db.json'
    : path.join(__dirname, '..', 'storage', 'db.json');

const PREFIX = process.env.REDIS_PREFIX || 'adaptprep';
const KEYS = {
    version: `${PREFIX}:version`,
    meta: `${PREFIX}:meta`,
    lock: `${PREFIX}:init-lock`,
    col: (c) => `${PREFIX}:col:${c}`
};

// Sort key that preserves insertion order across instances.
let seqCounter = 0;
const nextSeq = () => Date.now() * 1000 + (seqCounter++ % 1000);

class Store {
    constructor(file = process.env.DB_FILE || DEFAULT_FILE, { redis = null, mongo = null } = {}) {
        this.redis = redis;
        this.mongo = mongo;
        this.file = mongo ? `mongodb:${mongo.name}` : redis ? `redis:${PREFIX}` : file;
        this.inMemory = !this.remote && file === ':memory:';
        this.data = { meta: {} };
        COLLECTIONS.forEach((c) => { this.data[c] = []; });
        this.saveTimer = null;
        // Hosted mode: what was last read from / written to the database, for diffing.
        this.version = null;
        this.snapshot = { meta: '{}', cols: {} };
        COLLECTIONS.forEach((c) => { this.snapshot.cols[c] = new Map(); });
        if (!this.remote) this.load();
    }

    get remote() {
        return Boolean(this.redis || this.mongo);
    }

    // Reload everything from the database if another request/instance changed it.
    async pull({ force = false } = {}) {
        if (!this.remote) return;
        if (!force && this.version !== null) {
            const current = this.mongo
                ? await this.mongo.version()
                : Number((await this.redis.pipeline([['GET', KEYS.version]]))[0] || 0);
            if (current === this.version) return;
        }
        this.apply(this.mongo ? await this.mongo.load() : await this.loadRedis());
    }

    async loadRedis() {
        const [version, meta, ...flats] = await this.redis.transaction([
            ['GET', KEYS.version],
            ['GET', KEYS.meta],
            ...COLLECTIONS.map((c) => ['HGETALL', KEYS.col(c)])
        ]);
        const cols = {};
        COLLECTIONS.forEach((c, i) => {
            const flat = flats[i] || [];
            cols[c] = [];
            for (let j = 0; j < flat.length; j += 2) {
                const [seq, doc] = JSON.parse(flat[j + 1]);
                cols[c].push({ id: flat[j], seq, doc });
            }
        });
        return { version, meta, cols };
    }

    // Replace memory with a database snapshot: { version, meta (JSON), cols: { c: [{ id, seq, doc }] } }.
    apply({ version, meta, cols }) {
        this.data = { meta: meta ? JSON.parse(meta) : {} };
        this.snapshot = { meta: meta || '{}', cols: {} };
        COLLECTIONS.forEach((c) => {
            const rows = cols[c] || [];
            rows.sort((a, b) => a.seq - b.seq || String(a.doc.id).localeCompare(String(b.doc.id), undefined, { numeric: true }));
            this.data[c] = rows.map((r) => r.doc);
            this.snapshot.cols[c] = new Map(rows.map((r) => [r.id, { seq: r.seq, json: JSON.stringify(r.doc) }]));
        });
        this.version = Number(version || 0);
    }

    // Write every record that changed since the last pull/push.
    async push() {
        if (!this.remote) return 0;
        const change = { cols: {} };
        let writes = 0;
        const next = { meta: this.snapshot.meta, cols: {} };
        const metaJson = JSON.stringify(this.data.meta);
        if (metaJson !== this.snapshot.meta) {
            change.meta = metaJson;
            next.meta = metaJson;
            writes++;
        }
        COLLECTIONS.forEach((c) => {
            const prev = this.snapshot.cols[c];
            const snap = new Map();
            const upserts = [];
            this.data[c].forEach((doc) => {
                const json = JSON.stringify(doc);
                const old = prev.get(doc.id);
                const seq = old ? old.seq : nextSeq();
                snap.set(doc.id, { seq, json });
                if (!old || old.json !== json) upserts.push({ id: doc.id, seq, json });
            });
            const removed = [...prev.keys()].filter((id) => !snap.has(id));
            if (upserts.length || removed.length) change.cols[c] = { upserts, removed };
            writes += (upserts.length ? 1 : 0) + (removed.length ? 1 : 0);
            next.cols[c] = snap;
        });
        if (!writes) return 0;
        const version = this.mongo ? await this.mongo.write(change) : await this.writeRedis(change);
        this.snapshot = next;
        // If someone else wrote in between, our memory is missing their
        // changes: force a full reload on the next pull.
        this.version = this.version !== null && version === this.version + 1 ? version : null;
        return writes;
    }

    async writeRedis({ meta, cols }) {
        const commands = [];
        if (meta !== undefined) commands.push(['SET', KEYS.meta, meta]);
        Object.entries(cols).forEach(([c, { upserts, removed }]) => {
            if (upserts.length) commands.push(['HSET', KEYS.col(c), ...upserts.flatMap((u) => [u.id, `[${u.seq},${u.json}]`])]);
            if (removed.length) commands.push(['HDEL', KEYS.col(c), ...removed]);
        });
        const results = await this.redis.transaction([...commands, ['INCR', KEYS.version]]);
        return Number(results[results.length - 1]);
    }

    // Run fn once across all instances (e.g. first-time seeding).
    async withInitLock(fn) {
        if (this.mongo) return this.mongo.lock(fn);
        const [acquired] = await this.redis.pipeline([['SET', KEYS.lock, '1', 'NX', 'EX', '60']]);
        if (acquired !== 'OK') return false;
        try {
            await fn();
        } finally {
            await this.redis.pipeline([['DEL', KEYS.lock]]);
        }
        return true;
    }

    load() {
        if (this.inMemory || !fs.existsSync(this.file)) return;
        try {
            const raw = JSON.parse(fs.readFileSync(this.file, 'utf8'));
            this.data.meta = raw.meta || {};
            COLLECTIONS.forEach((c) => { this.data[c] = Array.isArray(raw[c]) ? raw[c] : []; });
        } catch (err) {
            // A corrupt file must never be silently overwritten: keep a copy for recovery.
            const backup = `${this.file}.corrupt-${Date.now()}`;
            fs.copyFileSync(this.file, backup);
            console.error(`[db] Could not parse ${this.file}; backed up to ${backup} and starting fresh.`);
        }
    }

    get meta() {
        return this.data.meta;
    }

    setMeta(key, value) {
        this.data.meta[key] = value;
        this.save();
    }

    // Debounced so bursts of writes (e.g. seeding) hit the disk once.
    save() {
        if (this.inMemory || this.remote) return;
        clearTimeout(this.saveTimer);
        this.saveTimer = setTimeout(() => this.flush(), 50);
    }

    flush() {
        if (this.inMemory || this.remote) return;
        clearTimeout(this.saveTimer);
        fs.mkdirSync(path.dirname(this.file), { recursive: true });
        const tmp = `${this.file}.tmp`;
        fs.writeFileSync(tmp, JSON.stringify(this.data));
        fs.renameSync(tmp, this.file);
    }

    all(col) {
        return this.data[col];
    }

    find(col, pred = () => true) {
        return this.data[col].filter(pred);
    }

    findOne(col, pred) {
        return this.data[col].find(pred) || null;
    }

    byId(col, id) {
        if (!id) return null;
        return this.data[col].find((d) => d.id === id) || null;
    }

    insert(col, doc) {
        const now = new Date().toISOString();
        const record = { id: doc.id || crypto.randomUUID(), createdAt: now, updatedAt: now, ...doc };
        this.data[col].push(record);
        this.save();
        return record;
    }

    insertMany(col, docs) {
        const now = new Date().toISOString();
        const records = docs.map((doc) => ({ id: doc.id || crypto.randomUUID(), createdAt: now, updatedAt: now, ...doc }));
        this.data[col].push(...records);
        this.save();
        return records;
    }

    update(col, id, patch) {
        const doc = this.byId(col, id);
        if (!doc) return null;
        Object.assign(doc, patch, { updatedAt: new Date().toISOString() });
        this.save();
        return doc;
    }

    remove(col, id) {
        const idx = this.data[col].findIndex((d) => d.id === id);
        if (idx === -1) return false;
        this.data[col].splice(idx, 1);
        this.save();
        return true;
    }

    removeWhere(col, pred) {
        const before = this.data[col].length;
        this.data[col] = this.data[col].filter((d) => !pred(d));
        const removed = before - this.data[col].length;
        if (removed) this.save();
        return removed;
    }

    reset() {
        this.data = { meta: {} };
        COLLECTIONS.forEach((c) => { this.data[c] = []; });
        this.save();
    }
}

let instance = null;

const getStore = () => {
    if (!instance) {
        const hosted = process.env.DB_FILE !== ':memory:';
        const mongo = hosted && mongoConfig();
        const redis = hosted && !mongo && redisConfig();
        instance = new Store(undefined, {
            mongo: mongo ? createMongo(mongo, COLLECTIONS) : null,
            redis: redis ? createRedis(redis) : null
        });
    }
    return instance;
};

// Only used by tests to get a fresh isolated database.
const createStore = (file, options) => {
    instance = new Store(file, options);
    return instance;
};

module.exports = { getStore, createStore, Store, COLLECTIONS };
