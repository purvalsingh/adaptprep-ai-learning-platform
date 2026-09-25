import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
    AlertTriangle, CalendarClock, ClipboardList, Copy, LogOut, Megaphone, Pencil, PlayCircle, Plus, RefreshCw, Sparkles, Trash2, Trophy, UserMinus, Users
} from 'lucide-react';
import { del, post, put } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useUi } from '../../context/UiContext';
import { useApi, useDocumentTitle } from '../../lib/useApi';
import Markdown from '../../lib/Markdown';
import { useStartTest } from '../../lib/useStartTest';
import {
    Avatar, Badge, Callout, Card, Empty, ErrorState, Field, Modal, PageHeader, PageLoader, Person, ProgressBar, Stat, Tabs
} from '../../components/ui';
import { EXAM_LABEL, date, dateTime, relative } from '../../lib/format';

function AssignmentsTab({ data, isStaff, reload }) {
    const { start, starting } = useStartTest();
    const { toast, confirm } = useUi();
    const list = data.assignments;
    const remove = async (a) => {
        if (!(await confirm({ title: 'Delete assignment?', message: `"${a.title}" will be removed. Submitted results stay in students' history.`, confirmText: 'Delete', danger: true }))) return;
        try { await del(`/assignments/${a.id}`); toast('Assignment deleted'); reload(); } catch (e) { toast(e.message, 'error'); }
    };
    if (!list.length) {
        return <Card><Empty icon={ClipboardList} title="No assignments yet" action={isStaff && <Link to={`/app/assignments/new?classId=${data.class.id}`} className="btn btn-primary"><Plus size={16} /> Create assignment</Link>}>{isStaff ? 'Assign a test to everyone in this class.' : 'Your teacher hasn\'t assigned anything yet.'}</Empty></Card>;
    }
    return (
        <div className="col gap-16">
            {list.map((a) => (
                <div key={a.id} className="card row wrap gap-16">
                    <span className={`stat-icon ${a.closed ? '' : 'accent'}`} style={{ width: 44, height: 44 }}><CalendarClock size={20} /></span>
                    <div className="grow" style={{ minWidth: 200 }}>
                        <div className="row gap-8 wrap">
                            <h3>{a.title}</h3>
                            {a.closed ? <Badge>Closed</Badge> : <Badge tone="warn">Open</Badge>}
                            {a.allowRetake && <Badge className="badge-outline">Retakes allowed</Badge>}
                        </div>
                        <p className="small muted mt-8" style={{ marginTop: 2 }}>
                            {a.questionCount} questions · {a.durationMin} min · {a.dueAt ? `due ${dateTime(a.dueAt)} (${relative(a.dueAt)})` : 'no due date'}
                        </p>
                        {a.instructions && <p className="small mt-8">{a.instructions}</p>}
                    </div>
                    {isStaff ? (
                        <div className="row gap-8">
                            <span className="small muted nums">{a.submitted}/{data.class.studentCount} submitted</span>
                            <Link to={`/app/assignments/${a.id}`} className="btn btn-secondary btn-sm">Report</Link>
                            <button className="btn btn-ghost btn-icon" onClick={() => remove(a)} aria-label="Delete assignment"><Trash2 size={16} /></button>
                        </div>
                    ) : (
                        <div className="row gap-8">
                            {a.myScore && <span className="bold nums">{a.myScore.percent}%</span>}
                            {a.myAttemptId && <Link to={`/app/results/${a.myAttemptId}`} className="btn btn-secondary btn-sm">View result</Link>}
                            {a.inProgressId && <Link to={`/test/${a.inProgressId}`} className="btn btn-primary btn-sm"><PlayCircle size={14} /> Resume</Link>}
                            {!a.inProgressId && !a.closed && (!a.myAttemptId || a.allowRetake) && (
                                <button className="btn btn-primary btn-sm" disabled={starting === a.id} onClick={() => start({ mode: 'assignment', assignmentId: a.id }, a.id)}>
                                    <PlayCircle size={14} /> {starting === a.id ? 'Starting…' : a.myAttemptId ? 'Retake' : 'Start'}
                                </button>
                            )}
                            {a.closed && !a.myAttemptId && <Badge tone="bad">Missed</Badge>}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

function StudentsTab({ data, reload }) {
    const { toast, confirm } = useUi();
    const students = data.class.students || [];
    const removeStudent = async (s) => {
        if (!(await confirm({ title: `Remove ${s.name}?`, message: 'They will lose access to this class. Their test history is kept.', confirmText: 'Remove', danger: true }))) return;
        try { await del(`/classes/${data.class.id}/students/${s.id}`); toast(`${s.name} removed`); reload(); } catch (e) { toast(e.message, 'error'); }
    };
    if (!students.length) return <Card><Empty icon={Users} title="No students yet">Share the join code <b className="mono">{data.class.code}</b> with your students.</Empty></Card>;
    return (
        <Card flush>
            <div className="table-wrap">
                <table className="table">
                    <thead><tr><th>Student</th><th className="num">Tests</th><th className="num">Accuracy</th><th className="num hide-sm">Avg score</th><th className="hide-md">Last active</th><th /></tr></thead>
                    <tbody>{students.map((s) => (
                        <tr key={s.id}>
                            <td><Link to={`/app/students/${s.id}`} style={{ color: 'inherit' }}><Person user={s} sub={s.email} size={32} /></Link></td>
                            <td className="num">{s.tests}</td>
                            <td className="num">{s.tests ? `${s.accuracy}%` : '—'}</td>
                            <td className="num hide-sm">{s.tests ? `${s.avgPercent}%` : '—'}</td>
                            <td className="hide-md small muted">{relative(s.lastActive)}</td>
                            <td className="num">
                                <div className="row end gap-4">
                                    <Link to={`/app/students/${s.id}`} className="btn btn-ghost btn-sm">Analytics</Link>
                                    <button className="btn btn-ghost btn-icon" onClick={() => removeStudent(s)} aria-label={`Remove ${s.name}`}><UserMinus size={16} /></button>
                                </div>
                            </td>
                        </tr>
                    ))}</tbody>
                </table>
            </div>
        </Card>
    );
}

function InsightsTab({ classId }) {
    const { data, error, loading, reload } = useApi(`/classes/${classId}/analytics`);
    if (loading) return <PageLoader />;
    if (error) return <ErrorState error={error} onRetry={reload} />;
    const { analytics: a, insights } = data;
    return (
        <div className="col gap-24">
            <div className="grid grid-4">
                <Stat label="Students" value={a.studentCount} icon={Users} foot={`${a.activeStudents} have taken a test`} />
                <Stat label="Average score" value={a.avgPercent} suffix="%" icon={Trophy} />
                <Stat label="Average accuracy" value={a.avgAccuracy} suffix="%" icon={Sparkles} tone="good" />
                <Stat label="Need attention" value={a.atRisk.length} icon={AlertTriangle} tone="bad" foot="Low accuracy or inactive" />
            </div>
            <Card title="AI class insights" subtitle={insights.summary}>
                {insights.recommendations.length ? (
                    <ul className="col gap-8" style={{ margin: 0, paddingLeft: 18 }}>{insights.recommendations.map((r) => <li key={r} className="small"><Markdown text={r} /></li>)}</ul>
                ) : <p className="muted small">No recommendations yet.</p>}
            </Card>
            <div className="grid grid-2">
                <Card title="Weakest topics" subtitle="Class-wide accuracy, at least 3 answers">
                    {a.weakTopics.length ? (
                        <div className="col gap-16">{a.weakTopics.map((t) => (
                            <div key={t.subject + t.topic}>
                                <div className="row between small mb-8"><b>{t.topic}</b><span className="nums muted">{t.accuracy}% · {t.students} students</span></div>
                                <ProgressBar value={t.accuracy} color="var(--bad)" label={`${t.topic} class accuracy`} />
                            </div>
                        ))}</div>
                    ) : <Empty title="Not enough data yet" />}
                </Card>
                <Card title="Students needing attention">
                    {a.atRisk.length ? (
                        <div className="list">{a.atRisk.map((s) => (
                            <Link key={s.id} to={`/app/students/${s.id}`} className="list-item list-link">
                                <Avatar user={s} size={32} />
                                <div className="grow"><div className="list-title">{s.name}</div><div className="list-sub">{s.riskReason}</div></div>
                                <Badge tone="bad"><AlertTriangle size={12} /> At risk</Badge>
                            </Link>
                        ))}</div>
                    ) : <Empty title="Everyone is on track 🎉" />}
                </Card>
            </div>
        </div>
    );
}

function Leaderboard({ classId }) {
    const { data, loading, error, reload } = useApi(`/classes/${classId}/leaderboard`);
    if (loading) return <PageLoader />;
    if (error) return <ErrorState error={error} onRetry={reload} />;
    if (!data.leaderboard.length) return <Card><Empty icon={Trophy} title="No rankings yet">Rankings appear once students complete tests.</Empty></Card>;
    return (
        <Card flush>
            <div className="table-wrap">
                <table className="table">
                    <thead><tr><th style={{ width: 60 }}>Rank</th><th>Student</th><th className="num">Tests</th><th className="num hide-sm">Streak</th><th className="num">Avg score</th></tr></thead>
                    <tbody>{data.leaderboard.map((r) => (
                        <tr key={r.id} style={r.isMe ? { background: 'var(--brand-soft)' } : undefined}>
                            <td className="bold nums">{r.rank <= 3 ? ['🥇', '🥈', '🥉'][r.rank - 1] : r.rank}</td>
                            <td><Person user={r} sub={r.isMe ? 'You' : null} size={30} /></td>
                            <td className="num">{r.tests}</td>
                            <td className="num hide-sm">{r.streak}🔥</td>
                            <td className="num bold">{r.avgPercent}%</td>
                        </tr>
                    ))}</tbody>
                </table>
            </div>
        </Card>
    );
}

function AnnouncementsTab({ data, isStaff, reload }) {
    const { toast } = useUi();
    const [form, setForm] = useState({ title: '', body: '' });
    const [busy, setBusy] = useState(false);
    const postIt = async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
            await post('/announcements', { ...form, classId: data.class.id });
            setForm({ title: '', body: '' });
            toast('Announcement posted');
            reload();
        } catch (err) { toast(err.message, 'error'); }
        setBusy(false);
    };
    return (
        <div className="col gap-16">
            {isStaff && (
                <Card title="Post to this class">
                    <form className="col gap-16" onSubmit={postIt}>
                        <input className="input" placeholder="Title" value={form.title} maxLength={120} onChange={(e) => setForm({ ...form, title: e.target.value })} aria-label="Title" />
                        <textarea className="textarea" placeholder="Message for your students" value={form.body} maxLength={2000} onChange={(e) => setForm({ ...form, body: e.target.value })} aria-label="Message" />
                        <div className="row end"><button className="btn btn-primary" disabled={busy || form.title.trim().length < 3 || form.body.trim().length < 3}><Megaphone size={16} /> Post</button></div>
                    </form>
                </Card>
            )}
            {data.announcements.length ? data.announcements.map((n) => (
                <Card key={n.id}>
                    <div className="row between mb-8"><Person user={n.author} sub={relative(n.createdAt)} size={32} /></div>
                    <h3>{n.title}</h3>
                    <p className="muted mt-8" style={{ whiteSpace: 'pre-wrap' }}>{n.body}</p>
                </Card>
            )) : <Card><Empty icon={Megaphone} title="No announcements yet" /></Card>}
        </div>
    );
}

function EditClassModal({ klass, onClose, onSaved }) {
    const { toast } = useUi();
    const [form, setForm] = useState({ name: klass.name, description: klass.description || '', archived: klass.archived });
    const save = async () => {
        try { await put(`/classes/${klass.id}`, form); toast('Class updated'); onSaved(); } catch (e) { toast(e.message, 'error'); }
    };
    return (
        <Modal title="Edit class" onClose={onClose} footer={<><button className="btn btn-secondary" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={save}>Save changes</button></>}>
            <div className="col gap-16">
                <Field label="Name"><input className="input" value={form.name} maxLength={80} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
                <Field label="Description"><textarea className="textarea" value={form.description} maxLength={300} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
                <label className="checkbox"><input type="checkbox" checked={form.archived} onChange={(e) => setForm({ ...form, archived: e.target.checked })} /> Archived (the join code stops working)</label>
            </div>
        </Modal>
    );
}

export default function ClassDetail() {
    const { id } = useParams();
    const { user } = useAuth();
    const { toast, confirm } = useUi();
    const navigate = useNavigate();
    const { data, error, loading, reload } = useApi(`/classes/${id}`);
    const isStaff = user.role !== 'student';
    const [tab, setTab] = useState('assignments');
    const [editing, setEditing] = useState(false);
    useDocumentTitle(data?.class?.name || 'Class');

    if (loading) return <PageLoader />;
    if (error) return <ErrorState error={error} onRetry={reload} />;
    const c = data.class;

    const copy = async () => {
        try { await navigator.clipboard.writeText(c.code); toast('Join code copied'); } catch { toast(`Join code: ${c.code}`, 'info'); }
    };
    const regenerate = async () => {
        if (!(await confirm({ title: 'Generate a new code?', message: 'The old code will stop working. Students already in the class are not affected.', confirmText: 'New code' }))) return;
        try { await post(`/classes/${c.id}/code`); toast('New join code generated'); reload({ quiet: true }); } catch (e) { toast(e.message, 'error'); }
    };
    const remove = async () => {
        if (!(await confirm({ title: 'Delete this class?', message: 'Assignments and announcements in it will be deleted. Students keep their test history.', confirmText: 'Delete class', danger: true }))) return;
        try { await del(`/classes/${c.id}`); toast('Class deleted'); navigate('/app/classes'); } catch (e) { toast(e.message, 'error'); }
    };
    const leave = async () => {
        if (!(await confirm({ title: 'Leave this class?', message: 'You can rejoin later with the class code.', confirmText: 'Leave', danger: true }))) return;
        try { await post(`/classes/${c.id}/leave`); toast('You left the class'); navigate('/app/classes'); } catch (e) { toast(e.message, 'error'); }
    };

    const tabs = [
        { id: 'assignments', label: 'Assignments', count: data.assignments.length },
        ...(isStaff ? [{ id: 'students', label: 'Students', count: c.studentCount }, { id: 'insights', label: 'AI insights', icon: Sparkles }] : []),
        { id: 'leaderboard', label: 'Leaderboard' },
        { id: 'announcements', label: 'Announcements', count: data.announcements.length }
    ];

    return (
        <div>
            <PageHeader
                back={{ to: user.role === 'admin' ? '/app/admin/classes' : '/app/classes', label: 'Classes' }}
                title={c.name}
                subtitle={`${EXAM_LABEL[c.examType]} · ${c.studentCount} students · created ${date(c.createdAt)}`}
                actions={isStaff ? (
                    <>
                        <Link to={`/app/assignments/new?classId=${c.id}`} className="btn btn-primary"><Plus size={16} /> Assignment</Link>
                        <button className="btn btn-secondary btn-icon" onClick={() => setEditing(true)} aria-label="Edit class"><Pencil size={16} /></button>
                        <button className="btn btn-secondary btn-icon" onClick={remove} aria-label="Delete class"><Trash2 size={16} /></button>
                    </>
                ) : <button className="btn btn-secondary" onClick={leave}><LogOut size={16} /> Leave class</button>}
            />

            {isStaff ? (
                <div className="card row wrap gap-16 mb-16">
                    <div className="grow" style={{ minWidth: 220 }}>
                        <div className="label">Join code</div>
                        <p className="small muted">Students enter this on their Classes page or at sign-up.</p>
                    </div>
                    <span className="code-box">{c.code}</span>
                    <button className="btn btn-secondary" onClick={copy}><Copy size={16} /> Copy</button>
                    <button className="btn btn-ghost" onClick={regenerate}><RefreshCw size={16} /> New code</button>
                </div>
            ) : (
                <div className="card row wrap gap-16 mb-16">
                    <Person user={c.teacher} sub="Your teacher" size={40} />
                    {c.description && <p className="small muted grow">{c.description}</p>}
                </div>
            )}
            {c.archived && <div className="mb-16"><Callout tone="warn">This class is archived. New students can't join.</Callout></div>}

            <Tabs tabs={tabs} value={tab} onChange={setTab} />
            {tab === 'assignments' && <AssignmentsTab data={data} isStaff={isStaff} reload={() => reload({ quiet: true })} />}
            {tab === 'students' && <StudentsTab data={data} reload={() => reload({ quiet: true })} />}
            {tab === 'insights' && <InsightsTab classId={c.id} />}
            {tab === 'leaderboard' && <Leaderboard classId={c.id} />}
            {tab === 'announcements' && <AnnouncementsTab data={data} isStaff={isStaff} reload={() => reload({ quiet: true })} />}
            {editing && <EditClassModal klass={c} onClose={() => setEditing(false)} onSaved={() => { setEditing(false); reload({ quiet: true }); }} />}
        </div>
    );
}
