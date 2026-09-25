import { useEffect, useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft, CheckCircle2, CircleSlash, Eye, EyeOff, Inbox, X, XCircle } from 'lucide-react';
import { subjectLabel } from '../lib/format';

export function Spinner({ lg }) {
    return <span className={`spinner ${lg ? 'spinner-lg' : ''}`} role="status" aria-label="Loading" />;
}

export function PageLoader() {
    return <div className="page-loader"><Spinner lg /></div>;
}

export function Button({ variant = 'primary', size, loading, children, className = '', icon: Icon, ...props }) {
    return (
        <button className={`btn btn-${variant} ${size ? `btn-${size}` : ''} ${className}`} disabled={loading || props.disabled} {...props}>
            {loading ? <Spinner /> : Icon ? <Icon size={size === 'sm' ? 15 : 17} /> : null}
            {children}
        </button>
    );
}

export function Card({ title, subtitle, action, children, className = '', flush, ...rest }) {
    return (
        <section className={`card ${flush ? 'card-flush' : ''} ${className}`} {...rest}>
            {(title || action) && (
                <div className="card-head" style={flush ? { padding: '20px 20px 0' } : undefined}>
                    <div className="grow">
                        {title && <h2>{title}</h2>}
                        {subtitle && <div className="card-sub">{subtitle}</div>}
                    </div>
                    {action}
                </div>
            )}
            {children}
        </section>
    );
}

export function PageHeader({ title, subtitle, actions, back }) {
    return (
        <div className="page-head anim-in">
            <div className="grow">
                {back && <Link to={back.to} className="back-link"><ArrowLeft size={14} /> {back.label}</Link>}
                <h1>{title}</h1>
                {subtitle && <p>{subtitle}</p>}
            </div>
            {actions && <div className="row wrap">{actions}</div>}
        </div>
    );
}

export function Stat({ label, value, suffix, foot, icon: Icon, tone }) {
    return (
        <div className="card stat">
            <div className="row between">
                <span className="stat-label">{label}</span>
                {Icon && <span className={`stat-icon ${tone || ''}`}><Icon size={18} /></span>}
            </div>
            <div className="stat-value">{value}{suffix && <small>{suffix}</small>}</div>
            {foot && <div className="stat-foot">{foot}</div>}
        </div>
    );
}

export function Badge({ tone, children, className = '' }) {
    return <span className={`badge ${tone ? `badge-${tone}` : ''} ${className}`}>{children}</span>;
}

export function Subject({ subject }) {
    return <span className={`subj subj-${subject}`}><span className="dot" />{subjectLabel(subject)}</span>;
}

// Status always carries an icon + label, never colour alone.
export function StatusTag({ status }) {
    if (status === 'correct') return <Badge tone="good"><CheckCircle2 size={13} /> Correct</Badge>;
    if (status === 'incorrect') return <Badge tone="bad"><XCircle size={13} /> Incorrect</Badge>;
    return <Badge><CircleSlash size={13} /> Skipped</Badge>;
}

export function Avatar({ user, size = 36 }) {
    const [broken, setBroken] = useState(false);
    if (!user) return null;
    if (user.avatar && !broken) {
        return <img className="avatar" src={`/assets/avatar/${user.avatar}`} alt="" width={size} height={size} style={{ width: size, height: size }} onError={() => setBroken(true)} />;
    }
    const initials = (user.name || '?').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
    return <span className="avatar-fallback" style={{ width: size, height: size, fontSize: size * 0.38 }}>{initials}</span>;
}

export function Person({ user, sub, size = 36 }) {
    return (
        <div className="person">
            <Avatar user={user} size={size} />
            <div style={{ minWidth: 0 }}>
                <div className="person-name truncate">{user?.name}</div>
                {sub && <div className="person-sub truncate">{sub}</div>}
            </div>
        </div>
    );
}

export function ProgressBar({ value, color, label }) {
    const v = Math.max(0, Math.min(100, value || 0));
    return (
        <div className="bar" role="progressbar" aria-valuenow={Math.round(v)} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
            <span style={{ width: `${v}%`, background: color }} />
        </div>
    );
}

export function Ring({ value, size = 120, stroke = 10, color = 'var(--brand)', children }) {
    const r = (size - stroke) / 2;
    const c = 2 * Math.PI * r;
    const v = Math.max(0, Math.min(100, value || 0));
    return (
        <div className="ring-wrap" style={{ width: size, height: size }}>
            <svg width={size} height={size} aria-hidden="true">
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-3)" strokeWidth={stroke} />
                <circle
                    cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
                    strokeDasharray={c} strokeDashoffset={c - (v / 100) * c} style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.2,0.8,0.2,1)' }}
                />
            </svg>
            <div className="ring-label">{children}</div>
        </div>
    );
}

export function Empty({ icon: Icon = Inbox, title, children, action }) {
    return (
        <div className="empty">
            <div className="empty-icon"><Icon size={24} /></div>
            <h3>{title}</h3>
            {children && <p>{children}</p>}
            {action && <div className="mt-8">{action}</div>}
        </div>
    );
}

export function ErrorState({ error, onRetry }) {
    return (
        <div className="empty">
            <div className="empty-icon" style={{ background: 'var(--bad-soft)', color: 'var(--bad-ink)' }}><AlertCircle size={24} /></div>
            <h3>Something went wrong</h3>
            <p>{error?.message || String(error)}</p>
            {onRetry && <button className="btn btn-secondary mt-8" onClick={onRetry}>Try again</button>}
        </div>
    );
}

export function Callout({ tone, icon: Icon = AlertCircle, children }) {
    return <div className={`callout ${tone || ''}`}><Icon size={18} /><div>{children}</div></div>;
}

export function Modal({ title, subtitle, onClose, children, footer, size }) {
    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', onKey);
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
    }, [onClose]);
    return (
        <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className={`modal ${size === 'lg' ? 'modal-lg' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
                <div className="modal-head">
                    <div>
                        <h2>{title}</h2>
                        {subtitle && <p className="muted small mt-8">{subtitle}</p>}
                    </div>
                    <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Close"><X size={18} /></button>
                </div>
                <div className="modal-body">{children}</div>
                {footer && <div className="modal-foot">{footer}</div>}
            </div>
        </div>
    );
}

export function Field({ label, hint, children, className = '' }) {
    return (
        <div className={`field ${className}`}>
            {label && <label>{label}</label>}
            {children}
            {hint && <span className="hint">{hint}</span>}
        </div>
    );
}

export function PasswordInput({ value, onChange, placeholder = '••••••••', autoComplete = 'current-password', id }) {
    const [show, setShow] = useState(false);
    const auto = useId();
    return (
        <div className="input-icon">
            <input
                id={id || auto} className="input" type={show ? 'text' : 'password'} value={value} onChange={onChange}
                placeholder={placeholder} autoComplete={autoComplete} style={{ paddingLeft: 12, paddingRight: 44 }}
            />
            <button type="button" className="btn btn-ghost btn-icon input-action" style={{ width: 32, height: 32 }} onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'}>
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
        </div>
    );
}

export function Tabs({ tabs, value, onChange }) {
    return (
        <div className="tabs" role="tablist">
            {tabs.map((t) => (
                <button key={t.id} role="tab" aria-selected={value === t.id} className={value === t.id ? 'active' : ''} onClick={() => onChange(t.id)}>
                    {t.icon && <t.icon size={15} />}{t.label}{t.count !== undefined && <span className="badge">{t.count}</span>}
                </button>
            ))}
        </div>
    );
}

export function Segmented({ options, value, onChange }) {
    return (
        <div className="segmented" role="radiogroup">
            {options.map((o) => (
                <button key={o.value} role="radio" aria-checked={value === o.value} className={value === o.value ? 'active' : ''} onClick={() => onChange(o.value)} type="button">
                    {o.label}
                </button>
            ))}
        </div>
    );
}

export function Pager({ page, totalPages, total, onPage }) {
    if (totalPages <= 1) return <div className="pager"><span>{total} total</span></div>;
    return (
        <div className="pager">
            <span>{total} total · page {page} of {totalPages}</span>
            <div className="row gap-8">
                <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>Previous</button>
                <button className="btn btn-secondary btn-sm" disabled={page >= totalPages} onClick={() => onPage(page + 1)}>Next</button>
            </div>
        </div>
    );
}
