import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarCheck, CheckCircle2, Circle, Lightbulb, PlayCircle, RefreshCw, Sparkles } from 'lucide-react';
import { useApi, useDocumentTitle } from '../../lib/useApi';
import { useStartTest } from '../../lib/useStartTest';
import { Badge, Callout, Card, ErrorState, PageHeader, PageLoader, Subject } from '../../components/ui';

const DONE_KEY = 'adaptprep-plan-done';
const weekKey = () => {
    const d = new Date();
    const monday = new Date(d);
    monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return monday.toISOString().slice(0, 10);
};
const loadDone = () => {
    try {
        const raw = JSON.parse(localStorage.getItem(DONE_KEY) || '{}');
        return raw.week === weekKey() ? raw.items || {} : {};
    } catch { return {}; }
};

export default function StudyPlan() {
    useDocumentTitle('Study plan');
    const { data, error, loading, reload } = useApi('/ai/study-plan');
    const { start, starting } = useStartTest();
    const [done, setDone] = useState(loadDone);
    const todayIdx = (new Date().getDay() + 6) % 7;

    const toggle = (k) => {
        const next = { ...done, [k]: !done[k] };
        setDone(next);
        try { localStorage.setItem(DONE_KEY, JSON.stringify({ week: weekKey(), items: next })); } catch { /* ignore */ }
    };

    if (loading) return <PageLoader />;
    if (error) return <ErrorState error={error} onRetry={reload} />;
    const { plan } = data;
    const total = plan.days.reduce((n, d) => n + d.tasks.length, 0);
    const completed = Object.values(done).filter(Boolean).length;

    const launch = (link, key) => {
        if (link.mode === 'custom') start({ mode: 'custom', subject: link.subject, topics: [link.topic], count: 10 }, key);
        else if (link.mode === 'full') start({ mode: 'full' }, key);
    };

    return (
        <div className="col gap-24">
            <PageHeader title="Your AI study plan" subtitle="Rebuilt from your latest results every time you open it."
                actions={<button className="btn btn-secondary" onClick={() => reload()}><RefreshCw size={16} /> Refresh plan</button>} />

            <div className="grid grid-main">
                <Card>
                    <div className="row top gap-16">
                        <span className="stat-icon" style={{ width: 44, height: 44 }}><Sparkles size={22} /></span>
                        <div className="grow">
                            <h2>This week's focus</h2>
                            <p className="muted mt-8">{plan.summary}</p>
                            <div className="row wrap gap-8 mt-16">
                                {plan.focusAreas.map((f) => (
                                    <Badge key={f.topic} tone={f.kind === 'weak' ? 'bad' : f.kind === 'new' ? 'brand' : null}>{f.topic} · {f.reason}</Badge>
                                ))}
                            </div>
                        </div>
                    </div>
                </Card>
                <Card title="Weekly progress">
                    <div className="stat-value nums">{completed}<small>/ {total} tasks</small></div>
                    <div className="bar mt-16"><span style={{ width: `${(completed / total) * 100}%` }} /></div>
                    <p className="xs subtle mt-8">Tick tasks as you finish them. Progress resets each Monday.</p>
                </Card>
            </div>

            {plan.recommendations.length > 0 && (
                <Callout icon={Lightbulb}>
                    <b>Coach's notes</b>
                    <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>{plan.recommendations.map((r) => <li key={r}>{r}</li>)}</ul>
                </Callout>
            )}

            <div className="grid grid-3">
                {plan.days.map((d, i) => (
                    <div key={d.day} className="card col gap-16" style={i === todayIdx ? { borderColor: 'var(--brand)', boxShadow: '0 0 0 1px var(--brand)' } : undefined}>
                        <div className="row between">
                            <div>
                                <div className="xs subtle bold">{d.day.toUpperCase()}{i === todayIdx && ' · TODAY'}</div>
                                <h3 className="mt-8" style={{ marginTop: 4 }}>{d.focus}</h3>
                            </div>
                            {d.subject ? <Subject subject={d.subject} /> : <CalendarCheck size={18} color="var(--ink-3)" />}
                        </div>
                        <div className="col gap-8">
                            {d.tasks.map((task, j) => {
                                const k = `${i}-${j}`;
                                return (
                                    <button key={k} className="row top gap-8" style={{ border: 0, background: 'none', padding: 0, textAlign: 'left', cursor: 'pointer', color: done[k] ? 'var(--ink-3)' : 'var(--ink)' }} onClick={() => toggle(k)} aria-pressed={!!done[k]}>
                                        {done[k] ? <CheckCircle2 size={18} color="var(--good)" style={{ flexShrink: 0 }} /> : <Circle size={18} color="var(--line-strong)" style={{ flexShrink: 0 }} />}
                                        <span className="small" style={{ textDecoration: done[k] ? 'line-through' : 'none' }}>{task}</span>
                                    </button>
                                );
                            })}
                        </div>
                        <div className="grow" />
                        {d.link?.mode && (
                            <button className="btn btn-soft btn-sm" disabled={!!starting} onClick={() => launch(d.link, d.day)}>
                                <PlayCircle size={14} /> {starting === d.day ? 'Starting…' : d.link.mode === 'full' ? 'Start full mock' : `Practise ${d.link.topic}`}
                            </button>
                        )}
                        {d.link?.page === 'revision' && <Link to="/app/revision" className="btn btn-soft btn-sm">Open revision</Link>}
                    </div>
                ))}
            </div>
        </div>
    );
}
