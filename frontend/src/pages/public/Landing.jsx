import { Link } from 'react-router-dom';
import {
    ArrowRight, BarChart3, BookOpenCheck, Brain, CalendarCheck, Check, ClipboardList, Flame, GraduationCap, LineChart, Moon,
    ShieldCheck, Sparkles, Sun, Target, Timer, Users, Wand2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useUi } from '../../context/UiContext';
import { useApi, useDocumentTitle } from '../../lib/useApi';
import { Ring } from '../../components/ui';

export function PublicNav() {
    const { user } = useAuth();
    const { theme, setTheme } = useUi();
    return (
        <header className="public-nav">
            <div className="public-nav-inner">
                <Link to="/" className="brand"><span className="brand-mark"><BookOpenCheck size={18} /></span>AdaptPrep</Link>
                <nav className="public-links">
                    <a href="/#features">Features</a>
                    <a href="/#roles">For schools</a>
                    <a href="/#ai">How the AI works</a>
                </nav>
                <div className="grow" />
                <button className="btn btn-ghost btn-icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="Toggle theme">
                    {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                </button>
                {user ? (
                    <Link to="/app" className="btn btn-primary">Open dashboard <ArrowRight size={16} /></Link>
                ) : (
                    <>
                        <Link to="/login" className="btn btn-ghost hide-sm">Sign in</Link>
                        <Link to="/signup" className="btn btn-primary">Get started</Link>
                    </>
                )}
            </div>
        </header>
    );
}

function HeroVisual() {
    return (
        <div className="hero-visual anim-in" aria-hidden="true">
            <div className="mock">
                <div className="row between mb-16">
                    <div>
                        <div className="xs subtle bold">READINESS INDEX</div>
                        <div className="bold" style={{ fontSize: 18 }}>JEE Main 2027</div>
                    </div>
                    <span className="badge badge-good"><Flame size={12} /> 7-day streak</span>
                </div>
                <div className="row gap-24" style={{ alignItems: 'center' }}>
                    <Ring value={72} size={132} stroke={12}>
                        <div><div style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.04em' }}>72</div><div className="xs subtle">of 100</div></div>
                    </Ring>
                    <div className="col gap-8 grow">
                        {[['Physics', 88, 'var(--s-physics)'], ['Chemistry', 54, 'var(--s-chemistry)'], ['Mathematics', 71, 'var(--s-third)']].map(([n, v, c]) => (
                            <div key={n}>
                                <div className="row between xs"><span className="bold">{n}</span><span className="nums muted">{v}%</span></div>
                                <div className="bar mt-8" style={{ marginTop: 4 }}><span style={{ width: `${v}%`, background: c }} /></div>
                            </div>
                        ))}
                    </div>
                </div>
                <hr className="divider" />
                <div className="row gap-8 xs bold subtle mb-8"><Sparkles size={14} color="var(--brand)" /> AI RECOMMENDATION</div>
                <p className="small">Chemical Bonding is costing you ~12 marks per mock. Tonight: 10 questions on VSEPR shapes, then an adaptive test.</p>
            </div>
            <div className="mock-float" style={{ left: -28, bottom: -72 }}>
                <div className="row gap-8"><span className="stat-icon good" style={{ width: 30, height: 30 }}><Check size={16} /></span>
                    <div><div className="bold">+18 marks</div><div className="xs subtle">vs. last full mock</div></div></div>
            </div>
            <div className="mock-float" style={{ right: 32, top: -34 }}>
                <div className="row gap-8"><span className="stat-icon" style={{ width: 30, height: 30 }}><Brain size={16} /></span>
                    <div><div className="bold">Quiz me on Optics</div><div className="xs subtle">AI tutor · instant</div></div></div>
            </div>
        </div>
    );
}

const FEATURES = [
    { icon: Target, title: 'Adaptive practice', text: 'Every AI Adaptive test is assembled from your weakest and unexplored topics, and gets harder as you improve.' },
    { icon: Timer, title: 'Real exam conditions', text: '+4/−1 marking, a server-enforced timer, mark-for-review and a question palette just like JEE Main and NEET.' },
    { icon: Sparkles, title: 'AI tutor that knows you', text: 'Ask about any concept, review your mistakes, or say "quiz me". Answers use your real test history.' },
    { icon: LineChart, title: 'Analytics that explain', text: 'Topic mastery, accuracy by difficulty, time per question, streaks and a readiness index in one place.' },
    { icon: CalendarCheck, title: 'Personal study plans', text: 'A 7-day plan rebuilt from your latest results: what to revise, what to practise, and when to take a full mock.' },
    { icon: ShieldCheck, title: 'Built to be fair', text: 'Answers never reach the browser before you submit, and grading happens on the server. No shortcuts, only progress.' }
];

const ROLES = [
    {
        icon: GraduationCap, name: 'Students', tag: 'Learn faster',
        points: ['600+ exam-style questions with worked solutions', 'AI Adaptive, custom, revision and full mock tests', 'AI tutor, study plan, bookmarks and a mistake notebook', 'Join your teacher\'s class with a 6-letter code']
    },
    {
        icon: ClipboardList, name: 'Teachers', tag: 'Teach smarter',
        points: ['Create classes and share a join code', 'Assign tests by hand or auto-pick by topic', 'See at-risk students and the class\'s weakest topics', 'Generate new questions with AI, then review and save them']
    },
    {
        icon: Users, name: 'Admins', tag: 'Run the platform',
        points: ['Manage users, roles and suspensions', 'Moderate the full question bank', 'Post platform-wide announcements', 'Audit log of every sensitive action']
    }
];

export default function Landing() {
    useDocumentTitle('');
    const { data: stats } = useApi('/public/stats');

    return (
        <div>
            <PublicNav />
            <section className="section hero">
                <div className="col gap-24 anim-in">
                    <span className="eyebrow"><Sparkles size={14} /> AI-powered JEE & NEET preparation</span>
                    <h1 className="display">Prep that <em>adapts</em> to you.</h1>
                    <p className="lead">AdaptPrep finds exactly where you lose marks, then builds the next test, study plan and explanation around it. Built for students, teachers and institutes.</p>
                    <div className="row wrap">
                        <Link to="/signup" className="btn btn-primary btn-lg">Start practising free <ArrowRight size={18} /></Link>
                        <Link to="/login?demo=student" className="btn btn-secondary btn-lg">Try the live demo</Link>
                    </div>
                    <div className="row wrap gap-16 small muted">
                        <span className="row gap-4"><Check size={16} color="var(--good-ink)" /> No setup or API keys needed</span>
                        <span className="row gap-4"><Check size={16} color="var(--good-ink)" /> Works on phone and desktop</span>
                    </div>
                </div>
                <HeroVisual />
            </section>

            <section className="section" style={{ paddingTop: 0 }}>
                <div className="stats-band">
                    <div><div className="v nums">{stats ? `${stats.questions}+` : '600+'}</div><div className="muted small">practice questions with solutions</div></div>
                    <div><div className="v nums">{stats?.topics ?? '80+'}</div><div className="muted small">syllabus topics tracked</div></div>
                    <div><div className="v">2</div><div className="muted small">exams: JEE Main & NEET UG</div></div>
                    <div><div className="v">3</div><div className="muted small">roles: student, teacher, admin</div></div>
                </div>
            </section>

            <section className="section" id="features">
                <div className="col gap-8" style={{ maxWidth: 640, marginBottom: 40 }}>
                    <span className="eyebrow">Features</span>
                    <h2 className="section-title">Everything a serious aspirant needs, and nothing that wastes time.</h2>
                </div>
                <div className="grid grid-3">
                    {FEATURES.map((f) => (
                        <div key={f.title} className="card feature">
                            <div className="feature-icon"><f.icon size={22} /></div>
                            <h3>{f.title}</h3>
                            <p>{f.text}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section className="section" id="roles" style={{ paddingTop: 24 }}>
                <div className="col gap-8" style={{ maxWidth: 640, marginBottom: 40 }}>
                    <span className="eyebrow">One platform, three roles</span>
                    <h2 className="section-title">Built for the whole classroom.</h2>
                </div>
                <div className="grid grid-3">
                    {ROLES.map((r) => (
                        <div key={r.name} className="card role-card">
                            <div className="row between">
                                <div className="feature-icon" style={{ margin: 0 }}><r.icon size={22} /></div>
                                <span className="badge badge-brand">{r.tag}</span>
                            </div>
                            <h3 style={{ fontSize: 20 }}>{r.name}</h3>
                            <ul>{r.points.map((p) => <li key={p}><Check size={16} />{p}</li>)}</ul>
                        </div>
                    ))}
                </div>
            </section>

            <section className="section" id="ai">
                <div className="grid grid-2" style={{ gap: 48, alignItems: 'center' }}>
                    <div className="col gap-16">
                        <span className="eyebrow">How the AI works</span>
                        <h2 className="section-title">A tutor that runs anywhere, even offline.</h2>
                        <p className="lead" style={{ fontSize: 17 }}>
                            AdaptPrep ships with its own built-in AI engine, so every feature works out of the box. It reads your analytics,
                            retrieves from curated syllabus notes and worked solutions, and computes new practice questions with verified answers.
                            Add a Gemini key and conversations upgrade to a large language model automatically.
                        </p>
                    </div>
                    <div className="col gap-16 steps">
                        {[
                            { icon: BarChart3, t: 'Diagnose', d: 'Every answer updates your topic mastery, accuracy by difficulty and time per question.' },
                            { icon: Brain, t: 'Adapt', d: 'The next test is weighted towards weak and unexplored topics at the right difficulty.' },
                            { icon: Wand2, t: 'Explain', d: 'Stuck? Get a step-by-step explanation of why your answer was wrong, and the formula to remember.' }
                        ].map((s, i) => (
                            <div key={s.t} className="card row top gap-16">
                                <span className="step-num">{i + 1}</span>
                                <div>
                                    <h3 className="row gap-8"><s.icon size={18} /> {s.t}</h3>
                                    <p className="muted small mt-8">{s.d}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="section" style={{ paddingTop: 24 }}>
                <div className="cta-band col gap-16" style={{ alignItems: 'center' }}>
                    <h2>Your next mock can be your best one.</h2>
                    <p>Create a free account in under a minute, or explore the demo as a student, teacher or admin.</p>
                    <div className="row wrap" style={{ justifyContent: 'center' }}>
                        <Link to="/signup" className="btn btn-lg" style={{ background: '#fff', color: '#2c2270' }}>Create free account</Link>
                        <Link to="/login?demo=teacher" className="btn btn-lg" style={{ background: 'rgba(255,255,255,0.14)', color: '#fff' }}>Explore as a teacher</Link>
                    </div>
                </div>
            </section>

            <footer className="footer">
                <div className="footer-inner">
                    <span className="row gap-8"><BookOpenCheck size={16} /> AdaptPrep · AI-powered exam preparation</span>
                    <span>AI engine: {stats?.ai || 'AdaptPrep Local AI'}</span>
                </div>
            </footer>
        </div>
    );
}
