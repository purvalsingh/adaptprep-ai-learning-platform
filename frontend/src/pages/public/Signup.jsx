import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowRight, GraduationCap, Presentation } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useDocumentTitle } from '../../lib/useApi';
import { Field, PasswordInput, Segmented } from '../../components/ui';
import { AuthAside } from './Login';

const AVATARS = Array.from({ length: 10 }, (_, i) => `avatar_${i + 1}.jpg`);

const strength = (p) => {
    let s = 0;
    if (p.length >= 8) s += 1;
    if (/[A-Za-z]/.test(p) && /\d/.test(p)) s += 1;
    if (p.length >= 12 || /[^A-Za-z0-9]/.test(p)) s += 1;
    return s;
};

export default function Signup() {
    useDocumentTitle('Create account');
    const { signup } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ role: 'student', name: '', email: '', password: '', examType: 'jee', avatar: 'avatar_1.jpg', institution: '', classCode: '' });
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e?.target ? e.target.value : e }));

    const submit = async (e) => {
        e.preventDefault();
        setError('');
        if (form.name.trim().length < 2) return setError('Please enter your full name.');
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) return setError('Please enter a valid email address.');
        if (form.password.length < 8 || !/[A-Za-z]/.test(form.password) || !/\d/.test(form.password)) {
            return setError('Password must be at least 8 characters and include a letter and a number.');
        }
        setBusy(true);
        try {
            const payload = { ...form, email: form.email.trim(), name: form.name.trim() };
            if (form.role !== 'student' || !form.classCode.trim()) delete payload.classCode;
            await signup(payload);
            navigate('/app', { replace: true });
        } catch (err) {
            setError(err.message);
            setBusy(false);
        }
    };

    const st = strength(form.password);

    return (
        <div className="auth">
            <AuthAside />
            <main className="auth-main">
                <form className="auth-card col gap-16 anim-in" onSubmit={submit} noValidate>
                    <div>
                        <h1>Create your account</h1>
                        <p className="muted mt-8">Free forever for students. Takes under a minute.</p>
                    </div>

                    <div className="role-pick" role="radiogroup" aria-label="I am a">
                        {[
                            { v: 'student', icon: GraduationCap, t: "I'm a student", s: 'Practise & track progress' },
                            { v: 'teacher', icon: Presentation, t: "I'm a teacher", s: 'Run classes & assignments' }
                        ].map((r) => (
                            <button type="button" key={r.v} role="radio" aria-checked={form.role === r.v} className={`role-opt ${form.role === r.v ? 'active' : ''}`} onClick={() => set('role')(r.v)}>
                                <r.icon size={20} />
                                <div><div className="bold small">{r.t}</div><div className="xs subtle">{r.s}</div></div>
                            </button>
                        ))}
                    </div>

                    {error && <div className="form-error" role="alert"><AlertCircle size={16} />{error}</div>}

                    <Field label="Full name"><input className="input" value={form.name} onChange={set('name')} autoComplete="name" placeholder="Aarav Sharma" maxLength={60} /></Field>
                    <Field label="Email"><input className="input" type="email" value={form.email} onChange={set('email')} autoComplete="email" placeholder="you@school.edu" /></Field>
                    <Field label="Password" hint="At least 8 characters with a letter and a number.">
                        <PasswordInput value={form.password} onChange={set('password')} autoComplete="new-password" />
                        {form.password && (
                            <div className="row gap-4" aria-label={`Password strength ${['weak', 'weak', 'good', 'strong'][st]}`}>
                                {[0, 1, 2].map((i) => <span key={i} style={{ flex: 1, height: 4, borderRadius: 4, background: i < st ? ['var(--bad)', 'var(--warn)', 'var(--good)'][st - 1] : 'var(--surface-3)' }} />)}
                                <span className="xs subtle" style={{ width: 48, textAlign: 'right' }}>{['Weak', 'Weak', 'Good', 'Strong'][st]}</span>
                            </div>
                        )}
                    </Field>

                    {form.role === 'student' ? (
                        <>
                            <Field label="Preparing for">
                                <Segmented value={form.examType} onChange={set('examType')} options={[{ value: 'jee', label: 'JEE Main' }, { value: 'neet', label: 'NEET UG' }]} />
                            </Field>
                            <Field label="Class code (optional)" hint="Got a code from your teacher? Enter it to join their class now.">
                                <input className="input mono" value={form.classCode} onChange={(e) => set('classCode')(e.target.value.toUpperCase())} placeholder="e.g. JEE27A" maxLength={12} />
                            </Field>
                        </>
                    ) : (
                        <Field label="School or institute (optional)"><input className="input" value={form.institution} onChange={set('institution')} maxLength={100} placeholder="Vidya Coaching Centre" /></Field>
                    )}

                    <Field label="Pick an avatar">
                        <div className="avatar-pick">
                            {AVATARS.map((a) => (
                                <button type="button" key={a} className={form.avatar === a ? 'active' : ''} onClick={() => set('avatar')(a)} aria-label={`Avatar ${a.match(/\d+/)[0]}`} aria-pressed={form.avatar === a}>
                                    <img className="avatar" src={`/assets/avatar/${a}`} alt="" width={40} height={40} style={{ width: 40, height: 40 }} />
                                </button>
                            ))}
                        </div>
                    </Field>

                    <button className="btn btn-primary btn-lg btn-block" disabled={busy}>{busy ? 'Creating account…' : <>Create account <ArrowRight size={18} /></>}</button>
                    <p className="center muted">Already have an account? <Link to="/login" className="bold">Sign in</Link></p>
                </form>
            </main>
        </div>
    );
}
