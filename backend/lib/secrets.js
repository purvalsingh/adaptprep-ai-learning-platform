const crypto = require('crypto');
const { getStore } = require('../db/store');

let cached = null;

// Uses JWT_SECRET when provided; otherwise generates a strong secret once and
// keeps it in the datastore so sessions survive restarts in local setups.
const getJwtSecret = () => {
    if (cached) return cached;
    if (process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 16) {
        cached = process.env.JWT_SECRET;
        return cached;
    }
    const store = getStore();
    if (!store.meta.jwtSecret) {
        store.setMeta('jwtSecret', crypto.randomBytes(48).toString('hex'));
    }
    cached = store.meta.jwtSecret;
    return cached;
};

const resetSecretCache = () => { cached = null; };

module.exports = { getJwtSecret, resetSecretCache };
