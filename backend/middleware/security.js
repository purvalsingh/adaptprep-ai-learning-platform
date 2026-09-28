const { HttpError } = require('../lib/http');

// Minimal security headers (a dependency-free subset of what helmet sets).
const securityHeaders = (req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.removeHeader('X-Powered-By');
    next();
};

// Fixed-window in-memory rate limiter keyed by user id (when signed in) or IP.
const rateLimit = ({ windowMs, max, message }) => {
    const hits = new Map();
    return (req, res, next) => {
        if (process.env.DISABLE_RATE_LIMIT === 'true') return next();
        const key = req.user?.id || req.ip;
        const now = Date.now();
        const entry = hits.get(key);
        if (!entry || now > entry.reset) {
            hits.set(key, { count: 1, reset: now + windowMs });
            return next();
        }
        entry.count += 1;
        if (entry.count > max) {
            res.setHeader('Retry-After', Math.ceil((entry.reset - now) / 1000));
            return next(new HttpError(429, message || 'Too many requests. Please slow down and try again shortly.'));
        }
        next();
    };
};

const notFoundApi = (req, res) => {
    res.status(404).json({ message: `No API route for ${req.method} ${req.originalUrl}` });
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({ message: 'Malformed JSON body.' });
    }
    if (err.type === 'entity.too.large') {
        return res.status(413).json({ message: 'Request body is too large.' });
    }
    const status = err instanceof HttpError ? err.status : 500;
    if (status >= 500) console.error('[error]', err);
    res.status(status).json({
        message: status >= 500 ? 'Something went wrong on our side. Please try again.' : err.message,
        ...(err.details ? { details: err.details } : {})
    });
};

module.exports = { securityHeaders, rateLimit, notFoundApi, errorHandler };
