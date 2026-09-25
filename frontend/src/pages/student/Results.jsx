import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Award, Bookmark, CheckCircle2, ChevronDown, ChevronUp, Clock, RotateCcw, Sparkles, Target, XCircle } from 'lucide-react';
import { post } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useUi } from '../../context/UiContext';
import { useApi, useDocumentTitle } from '../../lib/useApi';
import { useStartTest } from '../../lib/useStartTest';
import Markdown from '../../lib/Markdown';
import { StatusBar } from '../../components/charts';
import { Badge, Card, Empty, ErrorState, PageHeader, PageLoader, ProgressBar, Ring, Segmented, StatusTag, Subject } from '../../components/ui';
import { MODE_LABEL, dateTime, duration, letter, subjectColor, subjectLabel } from '../../lib/format';

function QuestionReview({ q, r, n, attemptId, canBookmark, canExplain }) {
    const { toast } = useUi();
    const [open, setOpen] = useState(r.status !== 'correct');
    const [ai, setAi] = useState(null);
    const [aiLoading, setAiLoading] = useState(false);
    const [bookmarked, setBookmarked] = useState(q.bookmarked);

    const explain = async () => {
        setAiLoading(true);
        try {
            setAi(await post('/ai/explain', { attemptId, questionId: q.id }));
        } catch (e) {
            toast(e.message, 'error');
        } finally {
            setAiLoading(false);
        }
    };

    const toggleBookmark = async () => {
        try {
            const d = await post(`/me/bookmarks/${q.id}`);
            setBookmarked(d.bookmarked);
            toast(d.bookmarked ? 'Saved to your revision list' : 'Removed from bookmarks');
        } catch (e) {
            toast(e.message, 'error');
        }
    };

    return (
        <div className="card" id={`q-${n}`}>
            <div className="q-meta" style={{ marginBottom: 12 }}>
                <Badge>Q{n}</Badge>
                <StatusTag status={r.status} />
                <Subject subject={q.subject} />
                <span className="small subtle">· {q.topic} · {q.difficulty}</span>
                <div className="grow" />
                <span className="xs subtle row gap-4"><Clock size={12} /> {duration(r.timeSpent)}</span>
                {canBookmark && (
                    <button className={`btn btn-sm ${bookmarked ? 'btn-soft' : 'btn-ghost'}`} onClick={toggleBookmark} aria-pressed={bookmarked}>
                        <Bookmark size={14} fill={bookmarked ? 'currentColor' : 'none'} /> {bookmarked ? 'Saved' : 'Save'}
                    </button>
                )}
                <button className="btn btn-ghost btn-icon" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label={open ? 'Collapse' : 'Expand'}>
                    {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
            </div>
            <p style={{ fontWeight: 500, whiteSpace: 'pre-wrap' }}>{q.question}</p>
            {open && (
                <>
                    <div className="options mt-16">
                        {q.options.map((o, i) => {
                            const isCorrect = i === q.correct;
                            const isChosen = i === r.selected;
                            return (
                                <div key={i} className={`option ${isCorrect ? 'correct' : isChosen ? 'wrong' : ''}`} style={{ cursor: 'default' }}>
                                    <span className="key">{letter(i)}</span>
                                    <span>{o}</span>
                                    {isCorrect && <span className="tag" style={{ color: 'var(--good-ink)' }}><CheckCircle2 size={14} /> Correct answer</span>}
                                    {isChosen && !isCorrect && <span className="tag" style={{ color: 'var(--bad-ink)' }}><XCircle size={14} /> Your answer</span>}
                                </div>
                            );
                        })}
                    </div>
                    <div className="explain-box">
                        <div className="label mb-8">Solution</div>
                        <p className="small">{q.explanation}</p>
                        {q.theory && <><div className="label mb-8 mt-16">Concept</div><p className="small muted">{q.theory}</p></>}
                    </div>
                    {canExplain && (ai ? (
                        <div className="explain-box ai-box">
                            <div className="row gap-8 label mb-8"><Sparkles size={14} /> AI explanation <span className="xs subtle">· {ai.provider === 'local' ? 'AdaptPrep Local AI' : 'Gemini'}</span></div>
                            <Markdown text={ai.content} />
                        </div>
                    ) : (
                        <button className="btn btn-soft btn-sm mt-16" onClick={explain} disabled={aiLoading}>
                            <Sparkles size={14} /> {aiLoading ? 'Thinking…' : r.status === 'correct' ? 'Explain the reasoning' : 'Why was I wrong?'}
                        </button>
                    ))}
                </>
            )}
        </div>
    );
}

export default function Results() {
    const { id } = useParams();
    const { user } = useAuth();
    const { data, error, loading, reload } = useApi(`/tests/attempts/${id}`);
    const [filter, setFilter] = useState('all');
    const { start, starting } = useStartTest();
    useDocumentTitle(data?.attempt?.title ? `Results · ${data.attempt.title}` : 'Results');

    const a = data?.attempt;
    const bySubject = useMemo(() => {
        if (!a?.results) return [];
        const m = new Map();
        a.results.forEach((r) => {
            const e = m.get(r.subject) || { subject: r.subject, correct: 0, incorrect: 0, skipped: 0 };
            e[r.status] += 1;
            m.set(r.subject, e);
        });
        return [...m.values()];
    }, [a]);

    if (loading) return <PageLoader />;
    if (error) return <ErrorState error={error} onRetry={reload} />;
    if (a.status !== 'submitted') {
        return <Empty title="This test is still in progress" action={<Link className="btn btn-primary" to={`/test/${a.id}`}>Resume test</Link>} />;
    }

    const own = data.student?.id === user.id;
    const s = a.score;
    const qMap = Object.fromEntries(a.questions.map((q) => [q.id, q]));
    const rows = a.results.map((r, i) => ({ r, q: qMap[r.questionId], n: i + 1 })).filter((x) => x.q && (filter === 'all' || x.r.status === filter));
    const verdict = s.percent >= 80 ? 'Outstanding work!' : s.percent >= 60 ? 'Solid performance.' : s.percent >= 40 ? 'Good effort, room to grow.' : "Let's turn these mistakes into marks.";
    const back = own ? { to: '/app/history', label: 'Test history' } : { to: `/app/students/${data.student.id}`, label: data.student.name };

    const retake = () => {
        if (a.mode === 'practice') start({ mode: 'practice', subject: a.subjects[0], testSet: a.testSet }, 'retake');
        else if (a.mode === 'full') start({ mode: 'full' }, 'retake');
        else start({ mode: 'adaptive', count: 15, subject: a.subjects.length === 1 ? a.subjects[0] : undefined }, 'retake');
    };

    return (
        <div className="col gap-24">
            <PageHeader
                back={back}
                title={a.title}
                subtitle={`${MODE_LABEL[a.mode]} · submitted ${dateTime(a.submittedAt)}${own ? '' : ` · ${data.student.name}`}`}
                actions={own && a.mode !== 'assignment' && (
                    <button className="btn btn-secondary" onClick={retake} disabled={starting === 'retake'}>
                        <RotateCcw size={16} /> {a.mode === 'practice' || a.mode === 'full' ? 'Retake' : 'New adaptive test'}
                    </button>
                )}
            />

            <div className="grid grid-main">
                <div className="card score-hero">
                    <Ring value={s.percent} size={160} stroke={14} color={s.percent >= 60 ? 'var(--good)' : s.percent >= 40 ? 'var(--warn)' : 'var(--bad)'}>
                        <div><div style={{ fontSize: 34, fontWeight: 800, letterSpacing: '-0.04em' }} className="nums">{s.marks}</div><div className="xs subtle">of {s.maxMarks} marks</div></div>
                    </Ring>
                    <div className="col gap-16" style={{ minWidth: 0 }}>
                        <div>
                            <h2 style={{ fontSize: 22 }}>{verdict}</h2>
                            <p className="muted mt-8">You scored <b>{s.percent}%</b> with <b>{s.accuracy}%</b> accuracy on attempted questions.</p>
                        </div>
                        <StatusBar correct={s.correct} incorrect={s.incorrect} skipped={s.skipped} />
                        <div className="row wrap gap-16 small muted">
                            <span className="row gap-4"><Clock size={14} /> {duration(s.timeTaken)} of {duration(a.durationSec)}</span>
                            <span className="row gap-4"><Target size={14} /> {Math.round(s.timeTaken / s.total)}s per question</span>
                            <span className="row gap-4"><Award size={14} /> Marking +4 / −1</span>
                        </div>
                    </div>
                </div>
                <Card title="By subject">
                    <div className="col gap-16">
                        {bySubject.map((b) => {
                            const att = b.correct + b.incorrect;
                            return (
                                <div key={b.subject}>
                                    <div className="row between small mb-8"><Subject subject={b.subject} /><span className="nums"><b>{b.correct}</b>/{b.correct + b.incorrect + b.skipped} correct</span></div>
                                    <ProgressBar value={att ? (b.correct / att) * 100 : 0} color={subjectColor(b.subject)} label={`${subjectLabel(b.subject)} accuracy`} />
                                </div>
                            );
                        })}
                        {own && (
                            <div className="col gap-8 mt-8">
                                <Link to="/app/revision" className="btn btn-soft btn-sm">Open revision notebook</Link>
                                <Link to="/app/tutor" className="btn btn-ghost btn-sm"><Sparkles size={14} /> Discuss with AI tutor</Link>
                            </div>
                        )}
                    </div>
                </Card>
            </div>

            <div className="row between wrap">
                <h2>Question review</h2>
                <Segmented value={filter} onChange={setFilter} options={[
                    { value: 'all', label: `All ${s.total}` },
                    { value: 'incorrect', label: `Incorrect ${s.incorrect}` },
                    { value: 'skipped', label: `Skipped ${s.skipped}` },
                    { value: 'correct', label: `Correct ${s.correct}` }
                ]} />
            </div>
            <div className="col gap-16">
                {rows.length ? rows.map(({ q, r, n }) => (
                    <QuestionReview key={q.id} q={q} r={r} n={n} attemptId={a.id} canBookmark={own} canExplain />
                )) : <Card><Empty title="Nothing here">No questions match this filter.</Empty></Card>}
            </div>
        </div>
    );
}
