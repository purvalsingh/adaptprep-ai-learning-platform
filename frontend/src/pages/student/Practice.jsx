import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Atom, BookMarked, Calculator, Dna, FlaskConical, Layers, PlayCircle, SlidersHorizontal, Sparkles, Timer } from 'lucide-react';
import { useApi, useDocumentTitle } from '../../lib/useApi';
import { useStartTest } from '../../lib/useStartTest';
import { Badge, Callout, Card, ErrorState, Field, Modal, PageHeader, PageLoader, Segmented } from '../../components/ui';
import { duration, subjectLabel } from '../../lib/format';

const SUBJECT_ICON = { physics: Atom, chemistry: FlaskConical, mathematics: Calculator, biology: Dna };

function AdaptiveModal({ subjects, onClose, onStart, busy }) {
    const [subject, setSubject] = useState('');
    const [count, setCount] = useState(15);
    return (
        <Modal title="AI Adaptive test" subtitle="Questions are weighted towards your weak and unexplored topics, at a difficulty matched to your level." onClose={onClose}
            footer={<><button className="btn btn-secondary" onClick={onClose}>Cancel</button><button className="btn btn-primary" disabled={busy} onClick={() => onStart({ mode: 'adaptive', subject: subject || undefined, count })}><Sparkles size={16} />{busy ? 'Preparing…' : 'Start test'}</button></>}>
            <div className="col gap-16">
                <Field label="Subjects">
                    <Segmented value={subject} onChange={setSubject} options={[{ value: '', label: 'All' }, ...subjects.map((s) => ({ value: s, label: subjectLabel(s) }))]} />
                </Field>
                <Field label="Number of questions">
                    <Segmented value={count} onChange={setCount} options={[10, 15, 20, 30].map((n) => ({ value: n, label: String(n) }))} />
                </Field>
                <p className="small muted"><Timer size={14} style={{ verticalAlign: -2 }} /> Time limit: {duration(count * 90)} · +4 correct, −1 incorrect</p>
            </div>
        </Modal>
    );
}

function CustomModal({ catalog, onClose, onStart, busy }) {
    const [subject, setSubject] = useState(catalog.exam.subjects[0]);
    const [topics, setTopics] = useState([]);
    const [difficulty, setDifficulty] = useState('mixed');
    const [count, setCount] = useState(10);
    const topicList = catalog.subjects.find((s) => s.subject === subject)?.topics || [];
    useEffect(() => setTopics([]), [subject]);
    const toggle = (t) => setTopics((x) => (x.includes(t) ? x.filter((y) => y !== t) : [...x, t]));

    return (
        <Modal title="Build a custom test" subtitle="Choose exactly what to practise." onClose={onClose} size="lg"
            footer={<><button className="btn btn-secondary" onClick={onClose}>Cancel</button><button className="btn btn-primary" disabled={busy} onClick={() => onStart({ mode: 'custom', subject, topics, difficulty, count })}><PlayCircle size={16} />{busy ? 'Preparing…' : `Start ${count}-question test`}</button></>}>
            <div className="col gap-16">
                <Field label="Subject">
                    <Segmented value={subject} onChange={setSubject} options={catalog.exam.subjects.map((s) => ({ value: s, label: subjectLabel(s) }))} />
                </Field>
                <Field label={`Topics ${topics.length ? `(${topics.length} selected)` : '(all topics)'}`}>
                    <div className="row wrap gap-8" style={{ maxHeight: 200, overflowY: 'auto' }}>
                        {topicList.map((t) => (
                            <button key={t.topic} type="button" className={`chip ${topics.includes(t.topic) ? 'active' : ''}`} onClick={() => toggle(t.topic)} aria-pressed={topics.includes(t.topic)}>
                                {t.topic} <span className="xs" style={{ opacity: 0.7 }}>{t.count}</span>
                            </button>
                        ))}
                    </div>
                </Field>
                <div className="form-grid">
                    <Field label="Difficulty">
                        <Segmented value={difficulty} onChange={setDifficulty} options={['mixed', 'easy', 'medium', 'hard'].map((d) => ({ value: d, label: d[0].toUpperCase() + d.slice(1) }))} />
                    </Field>
                    <Field label="Questions">
                        <Segmented value={count} onChange={setCount} options={[5, 10, 20, 30].map((n) => ({ value: n, label: String(n) }))} />
                    </Field>
                </div>
                <p className="small muted">If fewer questions match your filters, the test will include all that match.</p>
            </div>
        </Modal>
    );
}

export default function Practice() {
    useDocumentTitle('Practice');
    const { data, error, loading, reload } = useApi('/tests/catalog');
    const { start, starting } = useStartTest();
    const [params, setParams] = useSearchParams();
    const [modal, setModal] = useState(null);
    const [subjectTab, setSubjectTab] = useState(null);

    useEffect(() => {
        if (params.get('start') === 'adaptive') {
            setModal('adaptive');
            setParams({}, { replace: true });
        }
    }, [params, setParams]);

    const current = useMemo(() => data?.subjects.find((s) => s.subject === (subjectTab || data.exam.subjects[0])), [data, subjectTab]);

    if (loading) return <PageLoader />;
    if (error) return <ErrorState error={error} onRetry={reload} />;

    const modes = [
        { id: 'adaptive', icon: Sparkles, title: 'AI Adaptive', text: 'Targets your weak and unexplored topics. The best default for daily practice.', meta: '10–30 questions', featured: true, action: () => setModal('adaptive') },
        { id: 'full', icon: Layers, title: 'Full mock', text: `10 questions from each ${data.exam.name} subject under exam conditions.`, meta: `30 questions · ${duration(30 * 90)}`, action: () => start({ mode: 'full' }) },
        { id: 'custom', icon: SlidersHorizontal, title: 'Custom test', text: 'Pick a subject, specific topics and a difficulty level.', meta: '5–30 questions', action: () => setModal('custom') },
        { id: 'revision', icon: BookMarked, title: 'Revise mistakes', text: 'Re-attempt questions you got wrong or skipped until they stick.', meta: 'Up to 15 questions', action: () => start({ mode: 'revision', count: 15 }) }
    ];

    return (
        <div>
            <PageHeader title="Practice" subtitle={`${data.exam.name} · every test uses +4 / −1 marking and a server-side timer.`} />

            {data.inProgress.length > 0 && (
                <div className="mb-16">
                    <Callout tone="warn" icon={Timer}>
                        <div className="row between wrap">
                            <span><b>Unfinished tests:</b> {data.inProgress.map((x) => x.title).join(', ')}</span>
                            <div className="row gap-8">{data.inProgress.map((x) => <Link key={x.id} to={`/test/${x.id}`} className="btn btn-secondary btn-sm">Resume</Link>)}</div>
                        </div>
                    </Callout>
                </div>
            )}

            <div className="grid grid-4 mb-16">
                {modes.map((m) => (
                    <div key={m.id} className={`card mode-card ${m.featured ? 'featured' : ''}`}>
                        <div className="row between">
                            <div className="mode-icon"><m.icon size={22} /></div>
                            {m.featured && <Badge tone="brand">Recommended</Badge>}
                        </div>
                        <div>
                            <h3>{m.title}</h3>
                            <p className="small muted mt-8">{m.text}</p>
                        </div>
                        <div className="grow" />
                        <div className="row between">
                            <span className="xs subtle">{m.meta}</span>
                            <button className={`btn ${m.featured ? 'btn-primary' : 'btn-secondary'} btn-sm`} disabled={starting === m.id} onClick={m.action}>
                                {starting === m.id ? 'Starting…' : 'Start'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <Card title="Practice sets" subtitle="Ten 10-question sets per subject, each covering a mix of topics and difficulties.">
                <div className="mb-16">
                    <Segmented value={current.subject} onChange={setSubjectTab} options={data.exam.subjects.map((s) => ({ value: s, label: subjectLabel(s) }))} />
                </div>
                <div className="row gap-16 mb-16">
                    <span className={`subj-tile ${current.subject}`}>{(() => { const I = SUBJECT_ICON[current.subject]; return <I size={22} />; })()}</span>
                    <div>
                        <h3>{subjectLabel(current.subject)}</h3>
                        <p className="small muted">{current.topics.length} topics · {current.sets.filter((s) => s.attempts).length}/{current.sets.length} sets attempted</p>
                    </div>
                </div>
                <div className="set-grid">
                    {current.sets.map((s) => {
                        const key = `${current.subject}-${s.testSet}`;
                        return (
                            <button key={key} className="set-btn" disabled={!!starting} onClick={() => start({ mode: 'practice', subject: current.subject, testSet: s.testSet }, key)}>
                                <span className="t">Test {s.testSet}</span>
                                <span className="xs subtle">{s.questions} questions · 15 min</span>
                                {starting === key ? <span className="xs bold" style={{ color: 'var(--brand)' }}>Starting…</span>
                                    : s.best !== null ? <span className="xs bold" style={{ color: s.best >= 70 ? 'var(--good-ink)' : s.best >= 40 ? 'var(--warn-ink)' : 'var(--bad-ink)' }}>Best {s.best}% · {s.attempts}×</span>
                                        : <span className="xs" style={{ color: 'var(--brand)' }}>Not attempted</span>}
                            </button>
                        );
                    })}
                </div>
            </Card>

            {modal === 'adaptive' && <AdaptiveModal subjects={data.exam.subjects} busy={starting === 'adaptive'} onClose={() => setModal(null)} onStart={(spec) => start(spec)} />}
            {modal === 'custom' && <CustomModal catalog={data} busy={starting === 'custom'} onClose={() => setModal(null)} onStart={(spec) => start(spec)} />}
        </div>
    );
}
