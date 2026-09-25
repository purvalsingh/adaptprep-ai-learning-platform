// Lightweight embedded document store.
//
// Data lives in memory and is persisted to a single JSON file with atomic
// writes (write to a temp file, then rename). This keeps AdaptPrep runnable
// with zero external services while still behaving like a small database.
// Set DB_FILE=":memory:" to disable persistence (used by the test suite).

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

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

const DEFAULT_FILE = path.join(__dirname, '..', 'storage', 'db.json');

class Store {
    constructor(file = process.env.DB_FILE || DEFAULT_FILE) {
        this.file = file;
        this.inMemory = file === ':memory:';
        this.data = { meta: {} };
        COLLECTIONS.forEach((c) => { this.data[c] = []; });
        this.saveTimer = null;
        this.load();
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
        if (this.inMemory) return;
        clearTimeout(this.saveTimer);
        this.saveTimer = setTimeout(() => this.flush(), 50);
    }

    flush() {
        if (this.inMemory) return;
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
    if (!instance) instance = new Store();
    return instance;
};

// Only used by tests to get a fresh isolated database.
const createStore = (file) => {
    instance = new Store(file);
    return instance;
};

module.exports = { getStore, createStore, COLLECTIONS };
