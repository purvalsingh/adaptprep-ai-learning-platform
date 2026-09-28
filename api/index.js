// Vercel serverless entry: the whole Express API runs as one function.
// vercel.json rewrites every /api/* request here; Express sees the original path.
const { getStore } = require('../backend/db/store');
const { seed } = require('../backend/db/seed');
const { createApp } = require('../backend/app');

// With a hosted database, seeding happens on the first request (backend/middleware/sync.js).
if (!getStore().remote) seed();

module.exports = createApp();
