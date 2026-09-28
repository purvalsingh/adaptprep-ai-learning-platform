import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowRight, CalendarClock, ClipboardList, Database, GraduationCap, Plus, Sparkles, Users } from 'lucide-react';
import { get } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useApi, useDocumentTitle } from '../../lib/useApi';
import { CreateClassModal } from '../shared/Classes';
import { Avatar, Badge, Card, Empty, ErrorState, PageLoader, ProgressBar, Stat } from '../../components/ui';
import { EXAM_LABEL, firstName, greeting, relative } from '../../lib/format';

export default function TeacherDashboard() {
    useDocumentTitle('Dashboard');
    const { user } = useAuth();
    const navigate = useNavigate();
    const classes = useApi('/classes');
    const assignments = useApi('/assignments');
    const [insights, setInsights] = useState({});
    const [creating, setCreating] = useState(false);

    // Pull AI analytics for each class (small number of classes per teacher).
    useEffect(() => {
        const list = classes.data?.classes || [];
        list.forEach((c) => {
            get(`/classes/${c.id}/analytics`).then((d) => setInsights((m) => ({ ...m, [c.id]: d }))).catch(() => {});
        });
    }, [classes.data]);

    if (classes.loading) return <PageLoader />;
    if (classes.error) return <ErrorState error={classes.error} onRetry={classes.reload} />;
    const list = classes.data.classes;
    const all = assignments.data?.assignments || [];
    const open = all.filter((a) => !a.closed);
    const students = list.reduce((n, c) => n + c.studentCount, 0);
    const atRisk = Object.entries(insights).flatMap(([cid, d]) => d.analytics.atRisk.map((s) => ({ ...s, className: list.find((c) => c.id === cid)?.name })));
    const recs = Object.entries(insights).flatMap(([cid, d]) => d.insights.recommendations.slice(0, 2).map((r) => ({ r, cls: list.find((c) => c.id === cid)?.name })));

    return (
        <div className="col gap-24">
            <section className="hero-card anim-in">
                <div className="row between wrap gap-24">
                    <div className="col gap-16" style={{ maxWidth: 620 }}>
                        <h1>{greeting()}, {firstName(user.name)}.</h1>
                        <p>{atRisk.length ? `${atRisk.length} student${atRisk.length === 1 ? ' needs' : 's need'} attention across your classes. The AI has a few suggestions below.` : 'Your classes are on track. Create an assignment to keep momentum going.'}</p>
                        <div className="row wrap">
                            <Link to="/app/assignments/new" className="btn btn-secondary btn-lg"><Plus size={18} /> New assignment</Link>
                            <button className="btn btn-ghost btn-lg" onClick={() => setCreating(true)}>Create class</button>
                        </div>
                    </div>
                </div>
            </section>

            <div className="grid grid-4">
                <Stat label="Classes" value={list.length} icon={GraduationCap} />
                <Stat label="Students" value={students} icon={Users} />
                <Stat label="Open assignments" value={open.length} icon={ClipboardList} tone="accent" foot={`${all.length} total`} />
                <Stat label="Need attention" value={atRisk.length} icon={AlertTriangle} tone="bad" foot="Low accuracy, inactive or not started" />
            </div>

            <div className="grid grid-main">
                <Card title="Your classes" action={<Link to="/app/classes" className="btn btn-ghost btn-sm">All <ArrowRight size={14} /></Link>}>
                    {list.length ? (
                        <div className="list">
                            {list.map((c) => {
                                const a = insights[c.id]?.analytics;
                                return (
                                    <Link key={c.id} to={`/app/classes/${c.id}`} className="list-item list-link">
                                        <span className="stat-icon"><GraduationCap size={18} /></span>
                                        <div className="grow" style={{ minWidth: 0 }}>
                                            <div className="row gap-8"><span className="list-title truncate">{c.name}</span><Badge>{EXAM_LABEL[c.examType]}</Badge></div>
                                            <div className="list-sub">{c.studentCount} students · code <span className="mono">{c.code}</span>{a ? ` · ${a.activeStudents} active` : ''}</div>
                                        </div>
                                        <div style={{ width: 140 }} className="hide-sm">
                                            <div className="row between xs"><span className="subtle">Avg score</span><b className="nums">{a ? `${a.avgPercent}%` : '…'}</b></div>
                                            <ProgressBar value={a?.avgPercent || 0} label={`${c.name} average`} />
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    ) : <Empty icon={GraduationCap} title="No classes yet" action={<button className="btn btn-primary" onClick={() => setCreating(true)}><Plus size={16} /> Create a class</button>}>Create a class and share its join code with students.</Empty>}
                </Card>
                <Card title="AI suggestions" subtitle="From your classes' recent results">
                    {recs.length ? (
                        <div className="col gap-16">
                            {recs.slice(0, 5).map(({ r, cls }, i) => (
                                <div key={i} className="row top gap-8 small">
                                    <Sparkles size={16} color="var(--brand)" style={{ flexShrink: 0, marginTop: 2 }} />
                                    <div><div className="xs subtle bold">{cls}</div>{r.replace(/\*\*/g, '')}</div>
                                </div>
                            ))}
                            <Link to="/app/tutor" className="btn btn-soft btn-sm">Ask the AI assistant</Link>
                        </div>
                    ) : <Empty icon={Sparkles} title="No suggestions yet">Suggestions appear once students start taking tests.</Empty>}
                </Card>
            </div>

            <div className="grid grid-2">
                <Card title="Students needing attention">
                    {atRisk.length ? (
                        <div className="list">
                            {atRisk.slice(0, 6).map((s) => (
                                <Link key={s.id + s.className} to={`/app/students/${s.id}`} className="list-item list-link">
                                    <Avatar user={s} size={32} />
                                    <div className="grow" style={{ minWidth: 0 }}><div className="list-title">{s.name}</div><div className="list-sub">{s.className} · {s.riskReason}</div></div>
                                    <Badge tone="bad"><AlertTriangle size={12} /> At risk</Badge>
                                </Link>
                            ))}
                        </div>
                    ) : <Empty title="Everyone is on track 🎉" />}
                </Card>
                <Card title="Assignments" action={<Link to="/app/assignments" className="btn btn-ghost btn-sm">All <ArrowRight size={14} /></Link>}>
                    {all.length ? (
                        <div className="list">
                            {all.slice(0, 5).map((a) => (
                                <Link key={a.id} to={`/app/assignments/${a.id}`} className="list-item list-link">
                                    <span className={`stat-icon ${a.closed ? '' : 'accent'}`}><CalendarClock size={16} /></span>
                                    <div className="grow" style={{ minWidth: 0 }}>
                                        <div className="list-title truncate">{a.title}</div>
                                        <div className="list-sub">{a.className} · {a.dueAt ? (a.closed ? `closed ${relative(a.dueAt)}` : `due ${relative(a.dueAt)}`) : 'no due date'}</div>
                                    </div>
                                    <span className="small nums">{a.submitted}/{a.studentCount}</span>
                                </Link>
                            ))}
                        </div>
                    ) : <Empty icon={ClipboardList} title="No assignments yet" action={<Link to="/app/assignments/new" className="btn btn-primary btn-sm">Create one</Link>} />}
                </Card>
            </div>

            <Card>
                <div className="row wrap gap-16">
                    <span className="stat-icon" style={{ width: 44, height: 44 }}><Database size={20} /></span>
                    <div className="grow"><h3>Build your own question bank</h3><p className="small muted">Write questions or let the AI generate verified ones, then use them in assignments.</p></div>
                    <Link to="/app/questions" className="btn btn-secondary">Open question bank</Link>
                </div>
            </Card>
            {creating && <CreateClassModal onClose={() => setCreating(false)} onCreated={(c) => navigate(`/app/classes/${c.id}`)} />}
        </div>
    );
}
