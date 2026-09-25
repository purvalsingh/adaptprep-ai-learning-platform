import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckSquare, Search, Sparkles, Square } from 'lucide-react';
import { post } from '../../api/client';
import { useUi } from '../../context/UiContext';
import { useApi, useDocumentTitle } from '../../lib/useApi';
import { Card, Empty, ErrorState, Field, PageHeader, PageLoader, Pager, Segmented, Spinner, Subject } from '../../components/ui';
import { EXAM_LABEL, subjectLabel, toLocalInput } from '../../lib/format';

const EXAM_SUBJECTS = { jee: ['physics', 'chemistry', 'mathematics'], neet: ['physics', 'chemistry', 'biology'] };

function Picker({ examType, selected, setSelected }) {
    const [subject, setSubject] = useState('');
    const [search, setSearch] = useState('');
    const [debounced, setDebounced] = useState('');
    const [page, setPage] = useState(1);
    useEffect(() => { const t = setTimeout(() => { setDebounced(search); setPage(1); }, 300); return () => clearTimeout(t); }, [search]);
    const qs = new URLSearchParams({ examType, page: String(page), pageSize: '10', ...(subject ? { subject } : {}), ...(debounced ? { search: debounced } : {}) });
    const { data, loading, error, reload } = useApi(`/questions?${qs}`);
    const toggle = (id) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

    return (
        <div className="col gap-16">
            <div className="filters">
                <div className="input-icon"><Search size={16} /><input className="input" value={search} placeholder="Search by text or topic" onChange={(e) => setSearch(e.target.value)} aria-label="Search questions" /></div>
                <select className="select" value={subject} onChange={(e) => { setSubject(e.target.value); setPage(1); }} aria-label="Subject">
                    <option value="">All subjects</option>
                    {EXAM_SUBJECTS[examType].map((s) => <option key={s} value={s}>{subjectLabel(s)}</option>)}
                </select>
                <span className="small bold" style={{ color: 'var(--brand)' }}>{selected.length} selected</span>
                {selected.length > 0 && <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSelected([])}>Clear</button>}
            </div>
            <div className="card card-flush">
                {loading ? <div className="page-loader" style={{ minHeight: 200 }}><Spinner /></div> : error ? <ErrorState error={error} onRetry={reload} /> : data.items.length ? (
                    <>
                        <div className="list" style={{ padding: '4px 16px' }}>
                            {data.items.map((q) => {
                                const on = selected.includes(q.id);
                                return (
                                    <button type="button" key={q.id} className="list-item" style={{ border: 0, borderBottom: '1px solid var(--line)', background: 'none', textAlign: 'left', cursor: 'pointer', width: '100%', padding: '12px 0' }} onClick={() => toggle(q.id)} aria-pressed={on}>
                                        {on ? <CheckSquare size={18} color="var(--brand)" style={{ flexShrink: 0 }} /> : <Square size={18} color="var(--ink-3)" style={{ flexShrink: 0 }} />}
                                        <div className="grow" style={{ minWidth: 0 }}>
                                            <div className="small" style={{ fontWeight: 500 }}>{q.question}</div>
                                            <div className="row gap-8 xs subtle mt-8" style={{ marginTop: 2 }}><Subject subject={q.subject} /> · {q.topic} · {q.difficulty}</div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                        <Pager page={data.page} totalPages={data.totalPages} total={data.total} onPage={setPage} />
                    </>
                ) : <Empty title="No questions match" />}
            </div>
        </div>
    );
}

export default function AssignmentNew() {
    useDocumentTitle('New assignment');
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const { toast } = useUi();
    const classes = useApi('/classes');
    const tomorrow = useMemo(() => { const d = new Date(Date.now() + 3 * 86400000); d.setHours(21, 0, 0, 0); return toLocalInput(d.toISOString()); }, []);
    const [form, setForm] = useState({ classId: params.get('classId') || '', title: '', instructions: '', dueAt: tomorrow, durationMin: 15, allowRetake: false });
    const [mode, setMode] = useState('auto');
    const [auto, setAuto] = useState({ subject: '', topics: [], difficulty: 'mixed', count: 10 });
    const [selected, setSelected] = useState([]);
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState('');

    const myClasses = (classes.data?.classes || []).filter((c) => !c.archived);
    const klass = myClasses.find((c) => c.id === form.classId) || null;
    useEffect(() => { if (!form.classId && myClasses[0]) setForm((f) => ({ ...f, classId: myClasses[0].id })); }, [myClasses, form.classId]);
    useEffect(() => { setSelected([]); setAuto((a) => ({ ...a, subject: '', topics: [] })); }, [form.classId]);

    const topics = useApi(klass ? `/questions/topics?examType=${klass.examType}${auto.subject ? `&subject=${auto.subject}` : ''}` : null);

    const submit = async (e) => {
        e.preventDefault();
        setErr('');
        if (!klass) return setErr('Choose a class.');
        if (form.title.trim().length < 3) return setErr('Give the assignment a title (at least 3 characters).');
        if (mode === 'pick' && !selected.length) return setErr('Select at least one question.');
        if (form.dueAt && new Date(form.dueAt).getTime() < Date.now()) return setErr('The due date must be in the future.');
        setBusy(true);
        try {
            const body = {
                classId: form.classId, title: form.title.trim(), instructions: form.instructions.trim(), durationMin: Number(form.durationMin),
                dueAt: form.dueAt ? new Date(form.dueAt).toISOString() : null, allowRetake: form.allowRetake,
                ...(mode === 'pick' ? { questionIds: selected } : { auto: { ...auto, subject: auto.subject || undefined } })
            };
            const d = await post('/assignments', body);
            toast(`Assigned to ${klass.name}`);
            navigate(`/app/assignments/${d.assignment.id}`);
        } catch (e2) { setErr(e2.message); setBusy(false); }
    };

    if (classes.loading) return <PageLoader />;
    if (classes.error) return <ErrorState error={classes.error} onRetry={classes.reload} />;
    if (!myClasses.length) return <Card><Empty title="Create a class first" action={<Link to="/app/classes" className="btn btn-primary">Go to classes</Link>}>Assignments are given to a class.</Empty></Card>;

    return (
        <form onSubmit={submit} className="col gap-24" style={{ maxWidth: 960 }}>
            <PageHeader back={{ to: '/app/assignments', label: 'Assignments' }} title="New assignment" subtitle="Assign a timed test to every student in a class." />
            {err && <div className="form-error">{err}</div>}
            <Card title="Details">
                <div className="form-grid">
                    <Field label="Class">
                        <select className="select" value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value })}>
                            {myClasses.map((c) => <option key={c.id} value={c.id}>{c.name} · {EXAM_LABEL[c.examType]}</option>)}
                        </select>
                    </Field>
                    <Field label="Title"><input className="input" value={form.title} maxLength={100} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Week 6 · Electrostatics drill" /></Field>
                    <Field label="Due date" hint="Students can't start after this time."><input className="input" type="datetime-local" value={form.dueAt} onChange={(e) => setForm({ ...form, dueAt: e.target.value })} /></Field>
                    <Field label="Time limit (minutes)"><input className="input" type="number" min={1} max={240} value={form.durationMin} onChange={(e) => setForm({ ...form, durationMin: e.target.value })} /></Field>
                    <Field label="Instructions (optional)" className="full"><textarea className="textarea" maxLength={1000} value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} placeholder="What to revise first, rules, etc." /></Field>
                    <label className="checkbox full"><input type="checkbox" checked={form.allowRetake} onChange={(e) => setForm({ ...form, allowRetake: e.target.checked })} /> Allow students to retake (the latest attempt counts)</label>
                </div>
            </Card>

            <Card title="Questions" action={<Segmented value={mode} onChange={setMode} options={[{ value: 'auto', label: 'Auto-pick' }, { value: 'pick', label: 'Choose manually' }]} />}>
                {klass && mode === 'auto' && (
                    <div className="col gap-16">
                        <div className="callout"><Sparkles size={18} /><div className="small">AdaptPrep randomly picks questions that match your filters. Every student gets the same set.</div></div>
                        <div className="form-grid">
                            <Field label="Subject"><Segmented value={auto.subject} onChange={(v) => setAuto({ ...auto, subject: v, topics: [] })} options={[{ value: '', label: 'All' }, ...EXAM_SUBJECTS[klass.examType].map((s) => ({ value: s, label: subjectLabel(s) }))]} /></Field>
                            <Field label="Difficulty"><Segmented value={auto.difficulty} onChange={(v) => setAuto({ ...auto, difficulty: v })} options={['mixed', 'easy', 'medium', 'hard'].map((d) => ({ value: d, label: d[0].toUpperCase() + d.slice(1) }))} /></Field>
                            <Field label="Number of questions"><Segmented value={auto.count} onChange={(v) => { setAuto({ ...auto, count: v }); setForm((f) => ({ ...f, durationMin: Math.ceil(v * 1.5) })); }} options={[5, 10, 15, 20, 30].map((n) => ({ value: n, label: String(n) }))} /></Field>
                        </div>
                        <Field label={`Topics ${auto.topics.length ? `(${auto.topics.length})` : '(any)'}`}>
                            <div className="row wrap gap-8" style={{ maxHeight: 180, overflowY: 'auto' }}>
                                {(topics.data?.topics || []).map((t) => (
                                    <button key={t.subject + t.topic} type="button" className={`chip ${auto.topics.includes(t.topic) ? 'active' : ''}`} aria-pressed={auto.topics.includes(t.topic)}
                                        onClick={() => setAuto((a) => ({ ...a, topics: a.topics.includes(t.topic) ? a.topics.filter((x) => x !== t.topic) : [...a.topics, t.topic] }))}>
                                        {t.topic} <span className="xs" style={{ opacity: 0.7 }}>{t.count}</span>
                                    </button>
                                ))}
                            </div>
                        </Field>
                    </div>
                )}
                {klass && mode === 'pick' && <Picker examType={klass.examType} selected={selected} setSelected={setSelected} />}
            </Card>

            <div className="row end">
                <Link to="/app/assignments" className="btn btn-secondary">Cancel</Link>
                <button className="btn btn-primary btn-lg" disabled={busy}>{busy ? 'Assigning…' : `Assign to ${klass?.name || 'class'}`}</button>
            </div>
        </form>
    );
}
