import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { History as HistoryIcon, PlayCircle, Search, Trash2 } from 'lucide-react';
import { del } from '../../api/client';
import { useUi } from '../../context/UiContext';
import { useApi, useDocumentTitle } from '../../lib/useApi';
import { Badge, Card, Empty, ErrorState, PageHeader, PageLoader, Subject } from '../../components/ui';
import { MODE_LABEL, dateTime, duration } from '../../lib/format';

export default function History() {
    useDocumentTitle('Test history');
    const { data, error, loading, reload } = useApi('/tests/attempts');
    const { toast, confirm } = useUi();
    const navigate = useNavigate();
    const [mode, setMode] = useState('');
    const [q, setQ] = useState('');

    const rows = useMemo(() => (data?.attempts || []).filter((a) => (!mode || a.mode === mode) && (!q || a.title.toLowerCase().includes(q.toLowerCase()))), [data, mode, q]);

    const discard = async (a) => {
        if (!(await confirm({ title: 'Discard this test?', message: `"${a.title}" will be deleted without a score.`, confirmText: 'Discard', danger: true }))) return;
        try {
            await del(`/tests/attempts/${a.id}`);
            toast('Test discarded');
            reload({ quiet: true });
        } catch (e) { toast(e.message, 'error'); }
    };

    if (loading) return <PageLoader />;
    if (error) return <ErrorState error={error} onRetry={reload} />;

    return (
        <div>
            <PageHeader title="Test history" subtitle="Every test you've started, newest first." actions={<Link to="/app/practice" className="btn btn-primary">New test</Link>} />
            <Card flush>
                <div className="filters" style={{ padding: 16, borderBottom: '1px solid var(--line)' }}>
                    <div className="input-icon"><Search size={16} /><input className="input" placeholder="Search tests" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search tests" /></div>
                    <select className="select" value={mode} onChange={(e) => setMode(e.target.value)} aria-label="Filter by type">
                        <option value="">All types</option>
                        {Object.entries(MODE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                    <span className="small subtle">{rows.length} test{rows.length === 1 ? '' : 's'}</span>
                </div>
                {rows.length ? (
                    <div className="table-wrap">
                        <table className="table">
                            <thead><tr><th>Test</th><th className="hide-sm">Type</th><th className="hide-md">Date</th><th className="num">Correct</th><th className="num hide-sm">Time</th><th className="num">Score</th><th /></tr></thead>
                            <tbody>
                                {rows.map((a) => (
                                    <tr key={a.id} style={{ cursor: 'pointer' }} onClick={() => navigate(a.status === 'submitted' ? `/app/results/${a.id}` : `/test/${a.id}`)}>
                                        <td>
                                            <div className="bold">{a.title}</div>
                                            <div className="row gap-8 mt-8" style={{ marginTop: 2 }}>{a.subjects.map((s) => <Subject key={s} subject={s} />)}</div>
                                        </td>
                                        <td className="hide-sm"><Badge>{MODE_LABEL[a.mode]}</Badge></td>
                                        <td className="hide-md small muted">{dateTime(a.submittedAt || a.startedAt)}</td>
                                        {a.status === 'submitted' ? (
                                            <>
                                                <td className="num">{a.score.correct}/{a.score.total}</td>
                                                <td className="num hide-sm">{duration(a.score.timeTaken)}</td>
                                                <td className="num bold">{a.score.percent}%</td>
                                                <td />
                                            </>
                                        ) : (
                                            <>
                                                <td className="num subtle">{a.answeredCount}/{a.questionCount}</td>
                                                <td className="num hide-sm"><Badge tone="warn">In progress</Badge></td>
                                                <td className="num"><Link to={`/test/${a.id}`} className="btn btn-soft btn-sm" onClick={(e) => e.stopPropagation()}><PlayCircle size={14} /> Resume</Link></td>
                                                <td>
                                                    {a.mode !== 'assignment' && (
                                                        <button className="btn btn-ghost btn-icon" aria-label="Discard test" onClick={(e) => { e.stopPropagation(); discard(a); }}><Trash2 size={16} /></button>
                                                    )}
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : <Empty icon={HistoryIcon} title={data.attempts.length ? 'No tests match your filters' : 'No tests yet'} action={!data.attempts.length && <Link to="/app/practice" className="btn btn-primary">Take your first test</Link>} />}
            </Card>
        </div>
    );
}
