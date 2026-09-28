import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookMarked, Bookmark, CheckCircle2, ChevronDown, ChevronUp, RotateCcw, XCircle } from 'lucide-react';
import { post } from '../../api/client';
import { useUi } from '../../context/UiContext';
import { useApi, useDocumentTitle } from '../../lib/useApi';
import { useStartTest } from '../../lib/useStartTest';
import { Badge, Card, Empty, ErrorState, PageHeader, PageLoader, StatusTag, Subject, Tabs } from '../../components/ui';
import { letter, relative } from '../../lib/format';

function RevisionCard({ q, onUnbookmark }) {
    const { toast } = useUi();
    const [reveal, setReveal] = useState(false);
    const [pick, setPick] = useState(null);
    const [bookmarked, setBookmarked] = useState(q.bookmarked ?? true);

    const toggleBookmark = async () => {
        try {
            const d = await post(`/me/bookmarks/${q.id}`);
            setBookmarked(d.bookmarked);
            if (!d.bookmarked) onUnbookmark?.(q.id);
        } catch (e) { toast(e.message, 'error'); }
    };

    return (
        <div className="card">
            <div className="q-meta">
                <Subject subject={q.subject} />
                <span className="small subtle">· {q.topic}</span>
                {q.status && <StatusTag status={q.status} />}
                {q.at && <span className="xs subtle">{relative(q.at)}</span>}
                <div className="grow" />
                <button className={`btn btn-sm ${bookmarked ? 'btn-soft' : 'btn-ghost'}`} onClick={toggleBookmark} aria-pressed={bookmarked}>
                    <Bookmark size={14} fill={bookmarked ? 'currentColor' : 'none'} />{bookmarked ? 'Saved' : 'Save'}
                </button>
            </div>
            <p style={{ fontWeight: 500, whiteSpace: 'pre-wrap' }}>{q.question}</p>
            <div className="options mt-16">
                {q.options.map((o, i) => {
                    const cls = pick === null ? '' : i === q.correct ? 'correct' : i === pick ? 'wrong' : '';
                    return (
                        <button key={i} className={`option ${cls}`} disabled={pick !== null} onClick={() => { setPick(i); setReveal(true); }}>
                            <span className="key">{letter(i)}</span><span>{o}</span>
                            {pick !== null && i === q.correct && <span className="tag" style={{ color: 'var(--good-ink)' }}><CheckCircle2 size={14} /> Correct</span>}
                            {pick === i && i !== q.correct && <span className="tag" style={{ color: 'var(--bad-ink)' }}><XCircle size={14} /> Your pick</span>}
                        </button>
                    );
                })}
            </div>
            <div className="row between mt-16">
                <span className="xs subtle">{pick === null ? 'Try it again before revealing the answer.' : pick === q.correct ? 'Nice, you got it this time! 🎉' : 'Not yet. Read the solution and try again later.'}</span>
                <button className="btn btn-ghost btn-sm" onClick={() => setReveal((r) => !r)}>{reveal ? <ChevronUp size={14} /> : <ChevronDown size={14} />} {reveal ? 'Hide' : 'Show'} solution</button>
            </div>
            {reveal && (
                <div className="explain-box">
                    <div className="label mb-8">Answer: {letter(q.correct)}. {q.options[q.correct]}</div>
                    <p className="small">{q.explanation}</p>
                    {q.theory && <p className="small muted mt-8">{q.theory}</p>}
                    {pick !== null && <button className="btn btn-ghost btn-sm mt-8" onClick={() => { setPick(null); setReveal(false); }}><RotateCcw size={14} /> Try again</button>}
                </div>
            )}
        </div>
    );
}

export default function Revision() {
    useDocumentTitle('Revision');
    const [tab, setTab] = useState('mistakes');
    const mistakes = useApi('/tests/mistakes');
    const bookmarks = useApi('/me/bookmarks');
    const { start, starting } = useStartTest();

    const loading = mistakes.loading || bookmarks.loading;
    const error = mistakes.error || bookmarks.error;
    if (loading) return <PageLoader />;
    if (error) return <ErrorState error={error} onRetry={() => { mistakes.reload(); bookmarks.reload(); }} />;

    const list = tab === 'mistakes' ? mistakes.data.mistakes : bookmarks.data.questions.map((q) => ({ ...q, bookmarked: true }));
    const removeBookmark = (id) => bookmarks.setData((d) => ({ questions: d.questions.filter((q) => q.id !== id) }));

    return (
        <div>
            <PageHeader title="Revision notebook" subtitle="Your mistakes and saved questions in one place. Re-attempt them until they're easy."
                actions={<button className="btn btn-primary" disabled={!mistakes.data.mistakes.length || starting === 'revision'} onClick={() => start({ mode: 'revision', count: 15 })}><RotateCcw size={16} /> {starting === 'revision' ? 'Starting…' : 'Timed revision test'}</button>} />
            <Tabs value={tab} onChange={setTab} tabs={[
                { id: 'mistakes', label: 'Mistakes to fix', count: mistakes.data.mistakes.length },
                { id: 'bookmarks', label: 'Bookmarked', count: bookmarks.data.questions.length }
            ]} />
            {list.length ? (
                <div className="col gap-16">
                    {tab === 'mistakes' && <p className="small muted">Showing questions whose latest attempt was incorrect or skipped. Answer them correctly in a test and they drop off this list.</p>}
                    {list.map((q) => <RevisionCard key={q.id} q={q} onUnbookmark={tab === 'bookmarks' ? removeBookmark : undefined} />)}
                </div>
            ) : (
                <Card>
                    {tab === 'mistakes'
                        ? <Empty icon={CheckCircle2} title="No open mistakes" action={<Link to="/app/practice" className="btn btn-primary">Practise now</Link>}>Every question you've attempted is currently correct. Impressive!</Empty>
                        : <Empty icon={BookMarked} title="No bookmarks yet">Tap <Badge><Bookmark size={12} /> Save</Badge> on any question in your results to keep it here.</Empty>}
                </Card>
            )}
        </div>
    );
}
