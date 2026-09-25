import { useEffect, useMemo, useState } from 'react';
import { Archive, ArchiveRestore, Database, Plus, Search, Sparkles, Wand2 } from 'lucide-react';
import { del, get, post, put } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useUi } from '../../context/UiContext';
import { useApi, useDocumentTitle } from '../../lib/useApi';
import QuestionEditor from '../../components/QuestionEditor';
import { Badge, Card, Empty, ErrorState, Field, Modal, PageHeader, Pager, Segmented, Spinner, Subject } from '../../components/ui';
import { EXAM_LABEL, letter, subjectLabel } from '../../lib/format';

const EXAM_SUBJECTS = { jee: ['physics', 'chemistry', 'mathematics'], neet: ['physics', 'chemistry', 'biology'] };
const SOURCE = { bank: { label: 'Core bank', tone: null }, custom: { label: 'Custom', tone: 'brand' }, ai: { label: 'AI generated', tone: 'warn' } };

function GenerateModal({ onClose, onSaved }) {
    const { toast } = useUi();
    const [spec, setSpec] = useState({ examType: 'jee', subject: 'physics', topic: '', difficulty: 'mixed', count: 5 });
    const [topics, setTopics] = useState([]);
    const [drafts, setDrafts] = useState(null);
    const [keep, setKeep] = useState([]);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        get('/questions/meta/generator').then((d) => setTopics(d.topics)).catch(() => {});
    }, []);
    const topicOptions = topics.filter((t) => t.subject === spec.subject && t.exams.includes(spec.examType));

    const generate = async () => {
        setBusy(true);
        try {
            const d = await post('/questions/generate', { ...spec, topic: spec.topic || undefined });
            setDrafts(d.questions);
            setKeep(d.questions.map((_, i) => i));
        } catch (e) { toast(e.message, 'error'); }
        setBusy(false);
    };

    const save = async () => {
        setBusy(true);
        try {
            const d = await post('/questions/bulk', { questions: drafts.filter((_, i) => keep.includes(i)) });
            toast(`${d.questions.length} questions saved to your bank`);
            onSaved();
        } catch (e) { toast(e.message, 'error'); setBusy(false); }
    };

    return (
        <Modal size="lg" title="Generate questions with AI" subtitle="Numeric and conceptual templates compute the answer, so every generated key is correct. Review before saving." onClose={onClose}
            footer={drafts ? (
                <><button className="btn btn-secondary" onClick={() => setDrafts(null)}>Back</button><button className="btn btn-ghost" onClick={generate} disabled={busy}>Regenerate</button><button className="btn btn-primary" disabled={busy || !keep.length} onClick={save}>Save {keep.length} question{keep.length === 1 ? '' : 's'}</button></>
            ) : (
                <><button className="btn btn-secondary" onClick={onClose}>Cancel</button><button className="btn btn-primary" disabled={busy} onClick={generate}><Wand2 size={16} /> {busy ? 'Generating…' : 'Generate'}</button></>
            )}>
            {!drafts ? (
                <div className="col gap-16">
                    <div className="form-grid">
                        <Field label="Exam"><Segmented value={spec.examType} onChange={(v) => setSpec({ ...spec, examType: v, subject: EXAM_SUBJECTS[v].includes(spec.subject) ? spec.subject : 'physics', topic: '' })} options={[{ value: 'jee', label: EXAM_LABEL.jee }, { value: 'neet', label: EXAM_LABEL.neet }]} /></Field>
                        <Field label="Subject"><Segmented value={spec.subject} onChange={(v) => setSpec({ ...spec, subject: v, topic: '' })} options={EXAM_SUBJECTS[spec.examType].map((s) => ({ value: s, label: subjectLabel(s) }))} /></Field>
                        <Field label="Topic">
                            <select className="select" value={spec.topic} onChange={(e) => setSpec({ ...spec, topic: e.target.value })}>
                                <option value="">Any topic ({topicOptions.length} available)</option>
                                {topicOptions.map((t) => <option key={t.topic} value={t.topic}>{t.topic}</option>)}
                            </select>
                        </Field>
                        <Field label="How many"><Segmented value={spec.count} onChange={(v) => setSpec({ ...spec, count: v })} options={[3, 5, 10, 20].map((n) => ({ value: n, label: String(n) }))} /></Field>
                    </div>
                    <div className="callout"><Sparkles size={18} /><div className="small">The built-in AI uses verified templates (mechanics, circuits, optics, stoichiometry, kinetics, algebra, calculus, probability, genetics and more) and randomises values and distractors based on common mistakes.</div></div>
                </div>
            ) : (
                <div className="col gap-16">
                    {drafts.map((q, i) => (
                        <label key={i} className="card" style={{ cursor: 'pointer', borderColor: keep.includes(i) ? 'var(--brand)' : undefined }}>
                            <div className="row gap-8 mb-8">
                                <input type="checkbox" checked={keep.includes(i)} onChange={() => setKeep((k) => (k.includes(i) ? k.filter((x) => x !== i) : [...k, i]))} />
                                <Subject subject={q.subject} /><span className="small subtle">· {q.topic} · {q.difficulty}</span>
                            </div>
                            <p style={{ fontWeight: 500 }}>{q.question}</p>
                            <div className="opt-list">{q.options.map((o, j) => <div key={j} className={`opt-row ${j === q.correct ? 'ok' : ''}`}><b>{letter(j)}.</b> {o}</div>)}</div>
                            <p className="small muted mt-8">{q.explanation}</p>
                        </label>
                    ))}
                </div>
            )}
        </Modal>
    );
}

export default function QuestionBank() {
    useDocumentTitle('Question bank');
    const { user } = useAuth();
    const { toast, confirm } = useUi();
    const [filters, setFilters] = useState({ examType: '', subject: '', difficulty: '', source: '', status: '', mine: false, search: '' });
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [editing, setEditing] = useState(null);
    const [generating, setGenerating] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => { setFilters((f) => ({ ...f, search })); setPage(1); }, 300);
        return () => clearTimeout(t);
    }, [search]);

    const qs = useMemo(() => {
        const p = new URLSearchParams({ page: String(page), pageSize: '15' });
        Object.entries(filters).forEach(([k, v]) => { if (v) p.set(k, String(v)); });
        return p.toString();
    }, [filters, page]);
    const { data, error, loading, reload } = useApi(`/questions?${qs}`);
    const setF = (k) => (e) => { setFilters((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })); setPage(1); };

    const canEdit = (q) => user.role === 'admin' || (q.source !== 'bank' && q.createdBy === user.id);

    const archive = async (q) => {
        if (!(await confirm({ title: 'Archive question?', message: 'It will no longer appear in new tests. Past results stay reviewable.', confirmText: 'Archive' }))) return;
        try { await del(`/questions/${q.id}`); toast('Question archived'); reload({ quiet: true }); } catch (e) { toast(e.message, 'error'); }
    };
    const restore = async (q) => {
        try { await put(`/questions/${q.id}`, { status: 'active' }); toast('Question restored'); reload({ quiet: true }); } catch (e) { toast(e.message, 'error'); }
    };

    return (
        <div>
            <PageHeader title="Question bank" subtitle={user.role === 'admin' ? 'Moderate every question on the platform.' : 'Browse the core bank and manage your own questions.'}
                actions={<>
                    <button className="btn btn-secondary" onClick={() => setGenerating(true)}><Sparkles size={16} /> AI generate</button>
                    <button className="btn btn-primary" onClick={() => setEditing({})}><Plus size={16} /> New question</button>
                </>} />
            <Card flush>
                <div className="filters" style={{ padding: 16, borderBottom: '1px solid var(--line)' }}>
                    <div className="input-icon"><Search size={16} /><input className="input" placeholder="Search questions or topics" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search" /></div>
                    <select className="select" value={filters.examType} onChange={setF('examType')} aria-label="Exam"><option value="">All exams</option><option value="jee">JEE Main</option><option value="neet">NEET UG</option></select>
                    <select className="select" value={filters.subject} onChange={setF('subject')} aria-label="Subject"><option value="">All subjects</option>{['physics', 'chemistry', 'mathematics', 'biology'].map((s) => <option key={s} value={s}>{subjectLabel(s)}</option>)}</select>
                    <select className="select" value={filters.difficulty} onChange={setF('difficulty')} aria-label="Difficulty"><option value="">Any difficulty</option><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select>
                    <select className="select" value={filters.source} onChange={setF('source')} aria-label="Source"><option value="">All sources</option><option value="bank">Core bank</option><option value="custom">Custom</option><option value="ai">AI generated</option></select>
                    <select className="select" value={filters.status} onChange={setF('status')} aria-label="Status"><option value="">Active</option><option value="archived">Archived</option><option value="all">All</option></select>
                    <label className="checkbox small"><input type="checkbox" checked={filters.mine} onChange={setF('mine')} /> Only mine</label>
                </div>
                {loading ? <div className="page-loader" style={{ minHeight: 300 }}><Spinner lg /></div> : error ? <ErrorState error={error} onRetry={reload} /> : data.items.length ? (
                    <>
                        <div className="table-wrap">
                            <table className="table">
                                <thead><tr><th>Question</th><th className="hide-md">Subject</th><th className="hide-sm">Level</th><th className="hide-md">Source</th><th /></tr></thead>
                                <tbody>{data.items.map((q) => (
                                    <tr key={q.id} style={{ cursor: 'pointer', opacity: q.status === 'archived' ? 0.6 : 1 }} onClick={() => setEditing(q)}>
                                        <td style={{ maxWidth: 520 }}>
                                            <div className="truncate" style={{ fontWeight: 500 }}>{q.question}</div>
                                            <div className="xs subtle">{EXAM_LABEL[q.examType]} · {q.topic}{q.status === 'archived' ? ' · archived' : ''}</div>
                                        </td>
                                        <td className="hide-md"><Subject subject={q.subject} /></td>
                                        <td className="hide-sm"><Badge>{q.difficulty}</Badge></td>
                                        <td className="hide-md"><Badge tone={SOURCE[q.source]?.tone}>{SOURCE[q.source]?.label}</Badge></td>
                                        <td className="num" onClick={(e) => e.stopPropagation()}>
                                            {canEdit(q) && (q.status === 'archived'
                                                ? <button className="btn btn-ghost btn-icon" onClick={() => restore(q)} aria-label="Restore question"><ArchiveRestore size={16} /></button>
                                                : <button className="btn btn-ghost btn-icon" onClick={() => archive(q)} aria-label="Archive question"><Archive size={16} /></button>)}
                                        </td>
                                    </tr>
                                ))}</tbody>
                            </table>
                        </div>
                        <Pager page={data.page} totalPages={data.totalPages} total={data.total} onPage={setPage} />
                    </>
                ) : <Empty icon={Database} title="No questions match" action={<button className="btn btn-primary" onClick={() => setEditing({})}><Plus size={16} /> Write one</button>} />}
            </Card>
            {editing && (
                <QuestionEditor question={editing.id ? editing : null} readOnly={editing.id && !canEdit(editing)}
                    onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload({ quiet: true }); }} />
            )}
            {generating && <GenerateModal onClose={() => setGenerating(false)} onSaved={() => { setGenerating(false); setFilters((f) => ({ ...f, source: 'ai', mine: true })); setPage(1); }} />}
        </div>
    );
}
