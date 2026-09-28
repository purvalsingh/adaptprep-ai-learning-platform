const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const { auth, requireRole } = require('./middleware/auth');
const { securityHeaders, notFoundApi, errorHandler } = require('./middleware/security');
const { syncStore } = require('./middleware/sync');

const createApp = () => {
    const app = express();
    app.disable('x-powered-by');
    app.set('trust proxy', 1);

    app.use(securityHeaders);
    app.use(express.json({ limit: '200kb' }));
    const origins = (process.env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:5173').split(',').map((s) => s.trim());
    app.use('/api', cors({ origin: origins, credentials: false }));
    app.use('/api', (req, res, next) => { res.setHeader('Cache-Control', 'no-store'); next(); });
    app.use('/api', syncStore);

    app.use('/api/public', require('./routes/public'));
    app.use('/api/auth', require('./routes/auth'));
    app.use('/api/me', auth, require('./routes/me'));
    app.use('/api/tests', auth, require('./routes/tests'));
    app.use('/api/analytics', auth, require('./routes/analytics'));
    app.use('/api/classes', auth, require('./routes/classes'));
    app.use('/api/assignments', auth, require('./routes/assignments'));
    app.use('/api/questions', auth, require('./routes/questions'));
    app.use('/api/ai', auth, require('./routes/ai'));
    app.use('/api/announcements', auth, require('./routes/announcements'));
    app.use('/api/admin', auth, requireRole('admin'), require('./routes/admin'));
    app.use('/api', notFoundApi);

    // In production the backend also serves the built frontend (single deployable).
    const dist = path.join(__dirname, '..', 'frontend', 'dist');
    if (fs.existsSync(path.join(dist, 'index.html'))) {
        app.use(express.static(dist, { index: false, maxAge: '1h' }));
        app.get('*', (req, res) => res.sendFile(path.join(dist, 'index.html')));
    }

    app.use(errorHandler);
    return app;
};

module.exports = { createApp };
