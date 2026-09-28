// Lightweight embedded document store.
//
// Data lives in memory and is persisted to a single JSON file with atomic
// writes (write to a temp file, then rename). This keeps AdaptPrep runnable
// with zero external services while still behaving like a small database.
// Set DB_FILE=":memory:" to disable persistence (used by the test suite).
//
// When Upstash Redis credentials are present (UPSTASH_REDIS_REST_URL/TOKEN or
// Vercel's KV_REST_API_URL/TOKEN) the data is persisted to Redis instead, so it
// survives serverless restarts and is shared by every instance. The API stays
// synchronous: pull() refreshes memory before a request and push() writes the
// records that changed before the response is sent (see middleware/sync.js).

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { redisConfig, createRedis } = require('./redis');

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
    constructor(file = process.env.DB_FILE || DEFAULT_FILE, { redis = null } = {}) {
        this.redis = redis;
        this.file = redis ? `redis:${PREFIX}` : file;
        this.inMemory = !redis && file === ':memory:';
        this.data = { meta: {} };
        COLLECTIONS.forEach((c) => { this.data[c] = []; });
        this.saveTimer = null;
        // Redis mode: what was last read from / written to Redis, for diffing.
        this.version = null;
        this.snapshot = { meta: '{}', cols: {} };
        COLLECTIONS.forEach((c) => { this.snapshot.cols[c] = new Map(); });
        if (!redis) this.load();
    }

    get remote() {
        return Boolean(this.redis);
    }

    // Reload everything from Redis if another request/instance changed it.
    async pull({ force = false } = {}) {
        if (!this.redis) return;
        if (!force && this.version !== null) {
            const [current] = await this.redis.pipeline([['GET', KEYS.version]]);
            if (Number(current || 0) === this.version) return;
        }
        const results = await this.redis.transaction([
            ['GET', KEYS.version],
            ['GET', KEYS.meta],
            ...COLLECTIONS.map((c) => ['HGETALL', KEYS.col(c)])
        ]);
        const [version, meta, ...cols] = results;
        this.data = { meta: meta ? JSON.parse(meta) : {} };
        this.snapshot = { meta: meta || '{}', cols: {} };
        COLLECTIONS.forEach((c, i) => {
            const flat = cols[i] || [];
            const rows = [];
            const snap = new Map();
            for (let j = 0; j < flat.length; j += 2) {
                const [seq, doc] = JSON.parse(flat[j + 1]);
                rows.push({ seq, doc });
                snap.set(flat[j], { seq, json: JSON.stringify(doc) });
            }
            rows.sort((a, b) => a.seq - b.seq || String(a.doc.id).localeCompare(String(b.doc.id), undefined, { numeric: true }));
            this.data[c] = rows.map((r) => r.doc);
            this.snapshot.cols[c] = snap;
        });
        this.version = Number(version || 0);
    }

    // Write every record that changed since the last pull/push.
    async push() {
        if (!this.redis) return 0;
        const commands = [];
        const next = { meta: this.snapshot.meta, cols: {} };
        const metaJson = JSON.stringify(this.data.meta);
        if (metaJson !== this.snapshot.meta) {
            commands.push(['SET', KEYS.meta, metaJson]);
            next.meta = metaJson;
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
                if (!old || old.json !== json) upserts.push(doc.id, `[${seq},${json}]`);
            });
            const removed = [...prev.keys()].filter((id) => !snap.has(id));
            if (upserts.length) commands.push(['HSET', KEYS.col(c), ...upserts]);
            if (removed.length) commands.push(['HDEL', KEYS.col(c), ...removed]);
            next.cols[c] = snap;
        });
        if (!commands.length) return 0;
        const results = await this.redis.transaction([...commands, ['INCR', KEYS.version]]);
        const version = Number(results[results.length - 1]);
        this.snapshot = next;
        // If someone else wrote in between, our memory is missing their
        // changes: force a full reload on the next pull.
        this.version = this.version !== null && version === this.version + 1 ? version : null;
        return commands.length;
    }

    // Run fn once across all instances (e.g. first-time seeding).
    async withInitLock(fn) {
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
        if (this.inMemory || this.redis) return;
        clearTimeout(this.saveTimer);
        this.saveTimer = setTimeout(() => this.flush(), 50);
    }

    flush() {
        if (this.inMemory || this.redis) return;
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
        const redis = process.env.DB_FILE === ':memory:' ? null : redisConfig();
        instance = new Store(undefined, { redis: redis ? createRedis(redis) : null });
    }
    return instance;
};

// Only used by tests to get a fresh isolated database.
const createStore = (file, options) => {
    instance = new Store(file, options);
    return instance;
};

module.exports = { getStore, createStore, Store, COLLECTIONS };
