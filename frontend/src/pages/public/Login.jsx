import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, ArrowRight, BookOpenCheck, GraduationCap, Mail, Presentation, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useDocumentTitle } from '../../lib/useApi';
import { Field, PasswordInput } from '../../components/ui';

const DEMOS = [
    { id: 'student', label: 'Student', icon: GraduationCap, email: 'student@adaptprep.dev', password: 'Student@123', sub: 'Aarav · JEE' },
    { id: 'teacher', label: 'Teacher', icon: Presentation, email: 'teacher@adaptprep.dev', password: 'Teacher@123', sub: 'Priya · 2 classes' },
    { id: 'admin', label: 'Admin', icon: ShieldCheck, email: 'admin@adaptprep.dev', password: 'Admin@123', sub: 'Meera · platform' }
];

export function AuthAside() {
    return (
        <aside className="auth-side">
            <Link to="/" className="brand"><span className="brand-mark"><BookOpenCheck size={18} /></span>AdaptPrep</Link>
            <div>
                <p className="auth-quote">"The fastest way to a better score is knowing exactly which ten topics cost you marks."</p>
                <p style={{ opacity: 0.75, marginTop: 16 }}>AdaptPrep turns every test into a personal plan.</p>
            </div>
            <div className="row gap-16 small" style={{ opacity: 0.8 }}>
                <span>600+ questions</span><span>·</span><span>Adaptive AI</span><span>·</span><span>JEE & NEET</span>
            </div>
        </aside>
    );
}

export default function Login() {
    useDocumentTitle('Sign in');
    const { login, sessionNotice } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [params] = useSearchParams();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);

    const submit = async (e, creds) => {
        e?.preventDefault();
        const em = creds?.email ?? email;
        const pw = creds?.password ?? password;
        if (!em || !pw) { setError('Enter your email and password.'); return; }
        setBusy(true);
        setError('');
        try {
            await login(em, pw);
            navigate(location.state?.from || '/app', { replace: true });
        } catch (err) {
            setError(err.message);
            setBusy(false);
        }
    };

    useEffect(() => {
        const demo = DEMOS.find((d) => d.id === params.get('demo'));
        if (demo) { setEmail(demo.email); setPassword(demo.password); }
    }, [params]);

    return (
        <div className="auth">
            <AuthAside />
            <main className="auth-main">
                <div className="auth-card col gap-24 anim-in">
                    <div>
                        <Link to="/" className="brand hide-md-up" style={{ marginBottom: 24 }}><span className="brand-mark"><BookOpenCheck size={18} /></span>AdaptPrep</Link>
                        <h1>Welcome back</h1>
                        <p className="muted mt-8">Sign in to continue your preparation.</p>
                    </div>

                    <div>
                        <div className="label mb-8">Explore instantly with a demo account</div>
                        <div className="demo-grid">
                            {DEMOS.map((d) => (
                                <button key={d.id} type="button" className="demo-btn" disabled={busy} onClick={() => submit(null, d)}>
                                    <div className="t"><d.icon size={15} /> {d.label}</div>
                                    <div className="s">{d.sub}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="or">or sign in with email</div>

                    <form className="col gap-16" onSubmit={submit} noValidate>
                        {(error || sessionNotice) && <div className="form-error" role="alert"><AlertCircle size={16} />{error || sessionNotice}</div>}
                        <Field label="Email">
                            <div className="input-icon">
                                <Mail size={16} />
                                <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@school.edu" autoComplete="email" autoFocus />
                            </div>
                        </Field>
                        <Field label="Password">
                            <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} />
                        </Field>
                        <button className="btn btn-primary btn-lg btn-block" disabled={busy}>
                            {busy ? 'Signing in…' : <>Sign in <ArrowRight size={18} /></>}
                        </button>
                        <p className="small muted center">Forgot your password? Ask your teacher or administrator to reset it.</p>
                    </form>

                    <p className="center muted">New to AdaptPrep? <Link to="/signup" className="bold">Create an account</Link></p>
                </div>
            </main>
        </div>
    );
}
