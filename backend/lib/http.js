// Shared HTTP helpers: typed errors, async route wrapper, input validation.

class HttpError extends Error {
    constructor(status, message, details) {
        super(message);
        this.status = status;
        this.details = details;
    }
}

const badRequest = (msg, details) => new HttpError(400, msg, details);
const unauthorized = (msg = 'Please sign in to continue.') => new HttpError(401, msg);
const forbidden = (msg = 'You do not have permission to do that.') => new HttpError(403, msg);
const notFound = (msg = 'Not found.') => new HttpError(404, msg);
const conflict = (msg) => new HttpError(409, msg);

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const str = (value, { field, min = 0, max = 500, required = false, trim = true } = {}) => {
    if (value === undefined || value === null || value === '') {
        if (required) throw badRequest(`${field} is required.`);
        return '';
    }
    if (typeof value !== 'string') throw badRequest(`${field} must be text.`);
    const v = trim ? value.trim() : value;
    if (required && !v) throw badRequest(`${field} is required.`);
    if (v.length < min) throw badRequest(`${field} must be at least ${min} characters.`);
    if (v.length > max) throw badRequest(`${field} must be at most ${max} characters.`);
    return v;
};

const int = (value, { field, min = -Infinity, max = Infinity, fallback } = {}) => {
    if (value === undefined || value === null || value === '') {
        if (fallback !== undefined) return fallback;
        throw badRequest(`${field} is required.`);
    }
    const n = Number(value);
    if (!Number.isInteger(n)) throw badRequest(`${field} must be a whole number.`);
    if (n < min || n > max) throw badRequest(`${field} must be between ${min} and ${max}.`);
    return n;
};

const oneOf = (value, allowed, { field, fallback } = {}) => {
    if ((value === undefined || value === null || value === '') && fallback !== undefined) return fallback;
    const v = typeof value === 'string' ? value.toLowerCase() : value;
    if (!allowed.includes(v)) throw badRequest(`${field} must be one of: ${allowed.join(', ')}.`);
    return v;
};

const email = (value) => {
    const v = str(value, { field: 'Email', required: true, max: 254 }).toLowerCase();
    if (!EMAIL_RE.test(v)) throw badRequest('Please enter a valid email address.');
    return v;
};

const password = (value, field = 'Password') => {
    const v = str(value, { field, required: true, max: 128, trim: false });
    if (v.length < 8) throw badRequest(`${field} must be at least 8 characters.`);
    if (!/[A-Za-z]/.test(v) || !/\d/.test(v)) throw badRequest(`${field} must contain at least one letter and one number.`);
    return v;
};

const paginate = (items, query) => {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(query.pageSize, 10) || 20));
    const total = items.length;
    return {
        items: items.slice((page - 1) * pageSize, page * pageSize),
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize))
    };
};

module.exports = {
    HttpError,
    badRequest,
    unauthorized,
    forbidden,
    notFound,
    conflict,
    asyncHandler,
    validate: { str, int, oneOf, email, password },
    paginate
};
