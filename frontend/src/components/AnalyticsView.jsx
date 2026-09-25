import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, Clock, Flame, Gauge, Target, TrendingUp } from 'lucide-react';
import { ActivityHeatmap, StatusBar, SubjectBars, TrendChart } from './charts';
import { Badge, Card, Empty, ProgressBar, Segmented, Stat, Subject } from './ui';
import { MASTERY, duration, relative, subjectLabel } from '../lib/format';

// Full analytics view, shared by the student's own page and teacher drill-downs.
export default function AnalyticsView({ a, resultsBase = '/app/results' }) {
    const t = a.totals;
    const [subject, setSubject] = useState('all');
    const [view, setView] = useState('chart');
    const topics = useMemo(() => a.topics.filter((x) => subject === 'all' || x.subject === subject), [a, subject]);

    if (!t.tests) {
        return <Card><Empty icon={BarChart3} title="No tests completed yet">Analytics appear after the first submitted test.</Empty></Card>;
    }

    return (
        <div className="col gap-24">
            <div className="grid grid-4">
                <Stat label="Readiness index" value={t.readiness} suffix="/100" icon={Gauge} foot={`${t.coverage}% of topics covered`} />
                <Stat label="Accuracy" value={t.accuracy} suffix="%" icon={Target} tone="good" foot={`${t.correct} correct · ${t.incorrect} wrong`} />
                <Stat label="Average score" value={t.avgPercent} suffix="%" icon={TrendingUp} foot={`Best ${t.bestPercent}% over ${t.tests} tests`} />
                <Stat label="Streak" value={a.streak.current} suffix="days" icon={Flame} tone="accent" foot={`Longest ${a.streak.longest} days`} />
            </div>

            <div className="grid grid-main">
                <Card title="Score trend" subtitle="Marks as % of maximum, last 20 tests"
                    action={<Segmented value={view} onChange={setView} options={[{ value: 'chart', label: 'Chart' }, { value: 'table', label: 'Table' }]} />}>
                    {view === 'chart' ? (a.trend.length >= 2 ? <TrendChart data={a.trend} /> : <Empty title="Needs two or more tests" />) : (
                        <div className="table-wrap" style={{ maxHeight: 260, overflowY: 'auto' }}>
                            <table className="table">
                                <thead><tr><th>Test</th><th className="num">Score</th><th className="num">Accuracy</th></tr></thead>
                                <tbody>{[...a.trend].reverse().map((r) => (
                                    <tr key={r.id}><td><Link to={`${resultsBase}/${r.id}`}>{r.title}</Link><div className="xs subtle">{relative(r.date)}</div></td><td className="num">{r.percent}%</td><td className="num">{r.accuracy}%</td></tr>
                                ))}</tbody>
                            </table>
                        </div>
                    )}
                </Card>
                <Card title="Answer breakdown" subtitle={`${t.questions} questions answered`}>
                    <StatusBar correct={t.correct} incorrect={t.incorrect} skipped={t.skipped} />
                    <hr className="divider" />
                    <div className="label mb-8">Accuracy by difficulty</div>
                    <div className="col gap-8">
                        {a.difficulty.map((d) => (
                            <div key={d.difficulty}>
                                <div className="row between small"><span style={{ textTransform: 'capitalize' }}>{d.difficulty}</span><span className="nums muted">{d.attempted ? `${d.accuracy}% of ${d.attempted}` : '—'}</span></div>
                                <ProgressBar value={d.accuracy} label={`${d.difficulty} accuracy`} />
                            </div>
                        ))}
                    </div>
                    <hr className="divider" />
                    <div className="row between small"><span className="muted row gap-4"><Clock size={14} /> Time practised</span><b>{duration(t.timeSpentSec)}</b></div>
                </Card>
            </div>

            <div className="grid grid-2">
                <Card title="Accuracy by subject">
                    <SubjectBars subjects={a.subjects} />
                    <div className="table-wrap mt-16">
                        <table className="table">
                            <thead><tr><th>Subject</th><th className="num">Tests</th><th className="num">Answered</th><th className="num">Avg time</th></tr></thead>
                            <tbody>{a.subjects.map((s) => (
                                <tr key={s.subject}><td><Subject subject={s.subject} /></td><td className="num">{s.tests}</td><td className="num">{s.attempted}</td><td className="num">{s.avgTime}s</td></tr>
                            ))}</tbody>
                        </table>
                    </div>
                </Card>
                <Card title="Practice activity" subtitle="Tests per day">
                    <ActivityHeatmap activeDays={a.streak.activeDays} weeks={20} />
                    {a.untouchedTopics.length > 0 && (
                        <>
                            <hr className="divider" />
                            <div className="label mb-8">Topics you haven't tried yet</div>
                            <div className="row wrap gap-8">{a.untouchedTopics.map((u) => <Badge key={u.subject + u.topic} className="badge-outline">{u.topic}</Badge>)}</div>
                        </>
                    )}
                </Card>
            </div>

            <Card title="Topic mastery" subtitle="Weakest first. Mastery needs at least 2 answers."
                action={<Segmented value={subject} onChange={setSubject} options={[{ value: 'all', label: 'All' }, ...a.subjects.map((s) => ({ value: s.subject, label: subjectLabel(s.subject) }))]} />}>
                {topics.length ? (
                    <div className="table-wrap">
                        <table className="table">
                            <thead><tr><th>Topic</th><th className="hide-sm">Subject</th><th>Mastery</th><th className="num">Answered</th><th style={{ width: '30%' }}>Accuracy</th></tr></thead>
                            <tbody>{topics.map((x) => (
                                <tr key={x.subject + x.topic}>
                                    <td className="bold">{x.topic}</td>
                                    <td className="hide-sm"><Subject subject={x.subject} /></td>
                                    <td><span className={`badge ${MASTERY[x.mastery].cls}`}>{MASTERY[x.mastery].label}</span></td>
                                    <td className="num">{x.attempted}</td>
                                    <td><div className="row gap-8"><div className="grow"><ProgressBar value={x.accuracy} label={`${x.topic} accuracy`} /></div><span className="nums small" style={{ width: 44, textAlign: 'right' }}>{x.accuracy}%</span></div></td>
                                </tr>
                            ))}</tbody>
                        </table>
                    </div>
                ) : <Empty title="No topics yet for this subject" />}
            </Card>
        </div>
    );
}
