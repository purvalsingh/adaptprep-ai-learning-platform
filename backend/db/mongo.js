// MongoDB backend for the store (e.g. MongoDB Atlas; Vercel's Atlas
// integration sets MONGODB_URI). Same model as Redis mode: each app
// collection is a Mongo collection of plain documents (_id = id, plus a _seq
// sort key), and a version counter in "_meta" is bumped on every write so
// instances only reload when something changed. Needs a replica set (Atlas
// always is one) because reads and writes run in transactions.

const { MongoClient } = require('mongodb');

const config = () => (process.env.MONGODB_URI
    ? { uri: process.env.MONGODB_URI, dbName: process.env.MONGODB_DB || 'adaptprep' }
    : null);

const createMongo = ({ uri, dbName }, collections) => {
    const client = new MongoClient(uri, { maxPoolSize: 5, serverSelectionTimeoutMS: 10000 });
    let connecting = null;
    const db = () => {
        connecting = connecting || client.connect().then((c) => c.db(dbName)).catch((err) => {
            connecting = null;
            throw err;
        });
        return connecting;
    };
    const meta = async () => (await db()).collection('_meta');

    const transaction = async (fn) => {
        const d = await db();
        const session = client.startSession();
        try {
            let out;
            await session.withTransaction(async () => { out = await fn(d, session); }, {
                readConcern: { level: 'snapshot' },
                writeConcern: { w: 'majority' }
            });
            return out;
        } finally {
            await session.endSession();
        }
    };

    return {
        name: dbName,
        client,

        async version() {
            const v = await (await meta()).findOne({ _id: 'version' });
            return v ? v.n : 0;
        },

        // Consistent snapshot of everything, in the shape Store.apply() takes.
        load: () => transaction(async (d, session) => {
            const m = d.collection('_meta');
            const v = await m.findOne({ _id: 'version' }, { session });
            const metaDoc = await m.findOne({ _id: 'meta' }, { session });
            const cols = {};
            for (const c of collections) {
                const rows = await d.collection(c).find({}, { session }).toArray();
                cols[c] = rows.map(({ _id, _seq, ...doc }) => ({ id: _id, seq: _seq, doc }));
            }
            return { version: v ? v.n : 0, meta: metaDoc ? metaDoc.json : null, cols };
        }),

        // Apply one push atomically; returns the new version.
        write: ({ meta: metaJson, cols }) => transaction(async (d, session) => {
            if (metaJson !== undefined) {
                await d.collection('_meta').replaceOne({ _id: 'meta' }, { json: metaJson }, { upsert: true, session });
            }
            for (const [c, { upserts, removed }] of Object.entries(cols)) {
                const ops = upserts.map(({ id, seq, json }) => ({
                    replaceOne: { filter: { _id: id }, replacement: { ...JSON.parse(json), _id: id, _seq: seq }, upsert: true }
                }));
                if (removed.length) ops.push({ deleteMany: { filter: { _id: { $in: removed } } } });
                await d.collection(c).bulkWrite(ops, { session, ordered: true });
            }
            const v = await d.collection('_meta').findOneAndUpdate(
                { _id: 'version' },
                { $inc: { n: 1 } },
                { upsert: true, returnDocument: 'after', session }
            );
            return v.n;
        }),

        // Run fn once across all instances; a stale lock expires after 60s.
        async lock(fn) {
            const m = await meta();
            await m.deleteOne({ _id: 'init-lock', until: { $lt: Date.now() } });
            try {
                await m.insertOne({ _id: 'init-lock', until: Date.now() + 60 * 1000 });
            } catch (err) {
                if (err.code === 11000) return false;
                throw err;
            }
            try {
                await fn();
            } finally {
                await m.deleteOne({ _id: 'init-lock' });
            }
            return true;
        }
    };
};

module.exports = { mongoConfig: config, createMongo };
