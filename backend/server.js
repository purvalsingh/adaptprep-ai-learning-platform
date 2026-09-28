require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const { getStore } = require('./db/store');
const { seed } = require('./db/seed');
const { sweepExpired } = require('./services/attempts');
const { createApp } = require('./app');
const ai = require('./ai');

const store = getStore();
// With a hosted database, seeding happens on the first request (middleware/sync.js).
if (!store.remote) seed();

const app = createApp();
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
    console.log(`AdaptPrep API running on http://localhost:${PORT}`);
    console.log(`AI provider: ${ai.status().label}`);
    console.log(`Data: ${store.inMemory ? 'in-memory' : store.file}`);
});

// Auto-submit tests whose timer ran out even if the student closed the tab.
const sweeper = store.remote ? null : setInterval(sweepExpired, 30 * 1000);

const shutdown = () => {
    clearInterval(sweeper);
    store.flush();
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 2000).unref();
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
