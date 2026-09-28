import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { BarChart3, CheckCircle2, Pencil, Trash2, Trophy, Users } from 'lucide-react';
import { del, put } from '../../api/client';
import { useUi } from '../../context/UiContext';
import { useApi, useDocumentTitle } from '../../lib/useApi';
import { Badge, Card, Empty, ErrorState, Field, Modal, PageHeader, PageLoader, Person, ProgressBar, Stat, Subject, Tabs } from '../../components/ui';
import { dateTime, letter, relative, toLocalInput } from '../../lib/format';

function EditModal({ a, onClose, onSaved }) {
    const { toast } = useUi();
    const [f, setF] = useState({ title: a.title, instructions: a.instructions || '', dueAt: toLocalInput(a.dueAt), durationMin: a.durationMin, allowRetake: a.allowRetake });
    const save = async () => {
        try {
            await put(`/assignments/${a.id}`, { ...f, durationMin: Number(f.durationMin), dueAt: f.dueAt ? new Date(f.dueAt).toISOString() : null });
            toast('Assignment updated');
            onSaved();
        } catch (e) { toast(e.message, 'error'); }
    };
    return (
        <Modal title="Edit assignment" onClose={onClose} footer={<><button className="btn btn-secondary" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={save}>Save</button></>}>
            <div className="col gap-16">
                <Field label="Title"><input className="input" value={f.title} maxLength={100} onChange={(e) => setF({ ...f, title: e.target.value })} /></Field>
                <Field label="Instructions"><textarea className="textarea" value={f.instructions} maxLength={1000} onChange={(e) => setF({ ...f, instructions: e.target.value })} /></Field>
                <div className="form-grid">
                    <Field label="Due date" hint="Extend it to reopen a closed assignment."><input className="input" type="datetime-local" value={f.dueAt} onChange={(e) => setF({ ...f, dueAt: e.target.value })} /></Field>
                    <Field label="Time limit (min)"><input className="input" type="number" min={1} max={240} value={f.durationMin} onChange={(e) => setF({ ...f, durationMin: e.target.value })} /></Field>
                </div>
                <label className="checkbox"><input type="checkbox" checked={f.allowRetake} onChange={(e) => setF({ ...f, allowRetake: e.target.checked })} /> Allow retakes</label>
            </div>
        </Modal>
    );
}

export default function AssignmentDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { toast, confirm } = useUi();
    const { data, error, loading, reload } = useApi(`/assignments/${id}`);
    const [tab, setTab] = useState('submissions');
    const [editing, setEditing] = useState(false);
    useDocumentTitle(data?.assignment?.title || 'Assignment');

    if (loading) return <PageLoader />;
    if (error) return <ErrorState error={error} onRetry={reload} />;
    const { assignment: a, stats, submissions, questions } = data;

    const remove = async () => {
        if (!(await confirm({ title: 'Delete assignment?', message: 'Students can no longer take it. Submitted results remain in their history.', confirmText: 'Delete', danger: true }))) return;
        try { await del(`/assignments/${a.id}`); toast('Assignment deleted'); navigate(`/app/classes/${a.classId}`); } catch (e) { toast(e.message, 'error'); }
    };

    const hardest = [...questions].filter((q) => q.responses).sort((x, y) => x.correctRate - y.correctRate);

    return (
        <div className="col gap-24">
            <PageHeader back={{ to: `/app/classes/${a.classId}`, label: a.className }} title={a.title}
                subtitle={`${a.questionCount} questions · ${a.durationMin} min · ${a.dueAt ? `${a.closed ? 'closed' : 'due'} ${dateTime(a.dueAt)}` : 'no due date'}`}
                actions={<>
                    <button className="btn btn-secondary" onClick={() => setEditing(true)}><Pencil size={16} /> Edit</button>
                    <button className="btn btn-secondary btn-icon" onClick={remove} aria-label="Delete assignment"><Trash2 size={16} /></button>
                </>} />

            <div className="grid grid-4">
                <Stat label="Submitted" value={stats.submitted} suffix={`/ ${stats.students}`} icon={Users} foot={`${stats.students ? Math.round((stats.submitted / stats.students) * 100) : 0}% of the class`} />
                <Stat label="Average score" value={stats.avgPercent} suffix="%" icon={BarChart3} />
                <Stat label="Highest" value={stats.highest} suffix="%" icon={Trophy} tone="good" />
                <Stat label="Lowest" value={stats.lowest} suffix="%" icon={BarChart3} tone="bad" />
            </div>

            {hardest.length > 0 && hardest[0].correctRate < 60 && (
                <div className="callout warn">
                    <BarChart3 size={18} />
                    <div><b>Re-teach suggestion:</b> only {hardest[0].correctRate}% answered "{hardest[0].question.slice(0, 90)}{hardest[0].question.length > 90 ? '…' : ''}" correctly ({hardest[0].topic}).</div>
                </div>
            )}

            <Tabs value={tab} onChange={setTab} tabs={[{ id: 'submissions', label: 'Submissions', count: stats.submitted }, { id: 'questions', label: 'Question analysis', count: questions.length }]} />

            {tab === 'submissions' ? (
                <Card flush>
                    {submissions.length ? (
                        <div className="table-wrap">
                            <table className="table">
                                <thead><tr><th>Student</th><th>Status</th><th className="hide-sm">Submitted</th><th className="num">Correct</th><th className="num">Score</th><th /></tr></thead>
                                <tbody>{submissions.map((s) => (
                                    <tr key={s.student.id}>
                                        <td><Person user={s.student} size={30} /></td>
                                        <td>{s.attemptId ? <Badge tone={s.late ? 'warn' : 'good'}><CheckCircle2 size={12} /> {s.late ? 'Late' : 'Submitted'}</Badge> : <Badge>{a.closed ? 'Missed' : 'Pending'}</Badge>}</td>
                                        <td className="hide-sm small muted">{s.submittedAt ? relative(s.submittedAt) : '—'}</td>
                                        <td className="num">{s.score ? `${s.score.correct}/${s.score.total}` : '—'}</td>
                                        <td className="num bold">{s.score ? `${s.score.percent}%` : '—'}</td>
                                        <td className="num">{s.attemptId && <Link className="btn btn-ghost btn-sm" to={`/app/results/${s.attemptId}`}>Review</Link>}</td>
                                    </tr>
                                ))}</tbody>
                            </table>
                        </div>
                    ) : <Empty icon={Users} title="No students in this class yet" />}
                </Card>
            ) : (
                <div className="col gap-16">
                    {questions.map((q, i) => (
                        <Card key={q.id}>
                            <div className="q-meta">
                                <Badge>Q{i + 1}</Badge><Subject subject={q.subject} /><span className="small subtle">· {q.topic} · {q.difficulty}</span>
                                <div className="grow" />
                                {q.responses ? <b className="nums" style={{ color: q.correctRate >= 70 ? 'var(--good-ink)' : q.correctRate >= 40 ? 'var(--warn-ink)' : 'var(--bad-ink)' }}>{q.correctRate}% correct</b> : <span className="small subtle">No responses</span>}
                            </div>
                            <p style={{ fontWeight: 500 }}>{q.question}</p>
                            <div className="col gap-8 mt-16">
                                {q.options.map((o, j) => {
                                    const n = q.choices[j];
                                    const share = q.responses ? (n / q.responses) * 100 : 0;
                                    return (
                                        <div key={j}>
                                            <div className="row between small"><span className={j === q.correct ? 'bold' : ''} style={j === q.correct ? { color: 'var(--good-ink)' } : undefined}>{letter(j)}. {o} {j === q.correct && '✓'}</span><span className="nums muted">{n} ({Math.round(share)}%)</span></div>
                                            <ProgressBar value={share} color={j === q.correct ? 'var(--good)' : 'var(--neutral)'} label={`Option ${letter(j)} share`} />
                                        </div>
                                    );
                                })}
                            </div>
                        </Card>
                    ))}
                </div>
            )}
            {editing && <EditModal a={a} onClose={() => setEditing(false)} onSaved={() => { setEditing(false); reload({ quiet: true }); }} />}
        </div>
    );
}
