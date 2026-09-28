const jwt = require('jsonwebtoken');
const { getStore } = require('../db/store');
const { unauthorized, forbidden } = require('../lib/http');
const { getJwtSecret } = require('../lib/secrets');

const signToken = (user) => jwt.sign(
    { sub: user.id, role: user.role, tv: user.tokenVersion || 0 },
    getJwtSecret(),
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
);

// Verifies the bearer token and loads the current user. Tokens are invalidated
// when the account is suspended, deleted, or its password/role changes (tokenVersion).
const auth = (req, res, next) => {
    const header = req.header('Authorization') || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return next(unauthorized());

    let payload;
    try {
        payload = jwt.verify(token, getJwtSecret());
    } catch (err) {
        return next(unauthorized('Your session has expired. Please sign in again.'));
    }

    const user = getStore().byId('users', payload.sub);
    if (!user || (user.tokenVersion || 0) !== payload.tv) {
        return next(unauthorized('Your session is no longer valid. Please sign in again.'));
    }
    if (user.status === 'suspended') {
        return next(forbidden('This account has been suspended. Contact your administrator.'));
    }

    req.user = user;
    next();
};

const requireRole = (...roles) => (req, res, next) => {
    if (!req.user) return next(unauthorized());
    if (!roles.includes(req.user.role)) return next(forbidden());
    next();
};

// Strips secrets before a user record leaves the server.
const publicUser = (user) => {
    if (!user) return null;
    const { passwordHash, tokenVersion, bookmarks, ...rest } = user;
    return rest;
};

module.exports = { auth, requireRole, signToken, publicUser };
