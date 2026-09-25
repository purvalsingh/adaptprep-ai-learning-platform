export const SUBJECT_LABEL = { physics: 'Physics', chemistry: 'Chemistry', mathematics: 'Mathematics', biology: 'Biology' };
export const EXAM_LABEL = { jee: 'JEE Main', neet: 'NEET UG' };
export const subjectLabel = (s) => SUBJECT_LABEL[s] || (s ? s[0].toUpperCase() + s.slice(1) : '');

// Fixed entity → colour mapping (never by rank). Maths and biology share the
// third validated slot because they never appear in the same exam.
export const subjectColor = (s) => ({ physics: 'var(--s-physics)', chemistry: 'var(--s-chemistry)' }[s] || 'var(--s-third)');

export const MODE_LABEL = {
    practice: 'Practice set', adaptive: 'AI Adaptive', full: 'Full mock', custom: 'Custom', revision: 'Revision', assignment: 'Assignment'
};

export const pct = (n) => `${Math.round((n || 0) * 10) / 10}%`;

export const duration = (secs) => {
    const s = Math.max(0, Math.round(secs || 0));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    if (h) return `${h}h ${m}m`;
    if (m) return `${m}m ${s % 60 ? `${s % 60}s` : ''}`.trim();
    return `${s}s`;
};

export const clock = (secs) => {
    const s = Math.max(0, Math.floor(secs));
    const h = Math.floor(s / 3600);
    const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
    const ss = String(s % 60).padStart(2, '0');
    return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
};

export const date = (iso, opts = { day: 'numeric', month: 'short', year: 'numeric' }) =>
    iso ? new Date(iso).toLocaleDateString(undefined, opts) : '—';

export const dateTime = (iso) => (iso ? new Date(iso).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : '—');

export const relative = (iso) => {
    if (!iso) return 'never';
    const diff = (Date.now() - new Date(iso).getTime()) / 1000;
    const future = diff < 0;
    const a = Math.abs(diff);
    const fmt = (n, u) => `${n} ${u}${n === 1 ? '' : 's'}`;
    let s;
    if (a < 60) return future ? 'in a moment' : 'just now';
    if (a < 3600) s = fmt(Math.floor(a / 60), 'min');
    else if (a < 86400) s = fmt(Math.floor(a / 3600), 'hour');
    else if (a < 86400 * 30) s = fmt(Math.floor(a / 86400), 'day');
    else return date(iso);
    return future ? `in ${s}` : `${s} ago`;
};

export const greeting = () => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
};

export const firstName = (name) => (name || '').split(' ')[0];
export const letter = (i) => String.fromCharCode(65 + i);
export const tz = () => new Date().getTimezoneOffset();

export const MASTERY = {
    mastered: { label: 'Mastered', cls: 'badge-good' },
    proficient: { label: 'Proficient', cls: 'badge-brand' },
    developing: { label: 'Developing', cls: 'badge-warn' },
    'needs-work': { label: 'Needs work', cls: 'badge-bad' },
    new: { label: 'New', cls: '' }
};

// Local-datetime input value from ISO (and back).
export const toLocalInput = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
