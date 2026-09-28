const { getStore } = require('../db/store');

const MAX_ENTRIES = 5000;

const logAudit = (actor, action, target = '', meta = {}) => {
    const store = getStore();
    store.insert('audit', {
        actorId: actor?.id || null,
        actorName: actor?.name || 'system',
        actorRole: actor?.role || 'system',
        action,
        target,
        meta
    });
    const entries = store.all('audit');
    if (entries.length > MAX_ENTRIES) entries.splice(0, entries.length - MAX_ENTRIES);
};

module.exports = { logAudit };
