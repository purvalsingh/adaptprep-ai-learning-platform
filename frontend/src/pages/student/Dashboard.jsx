import { Link } from 'react-router-dom';
import {
    ArrowRight, BookOpenCheck, CalendarClock, CheckCircle2, Clock, Flame, Megaphone, PlayCircle, Sparkles, Target, TrendingUp
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApi, useDocumentTitle } from '../../lib/useApi';
import { useStartTest } from '../../lib/useStartTest';
import { ActivityHeatmap, SubjectBars, TrendChart } from '../../components/charts';
import { Badge, Card, Empty, ErrorState, PageLoader, ProgressBar, Ring, Stat, Subject } from '../../components/ui';
import { EXAM_LABEL, duration, firstName, greeting, relative, tz } from '../../lib/format';

export default function StudentDashboard() {
    useDocumentTitle('Dashboard');
    const { user } = useAuth();
    const analytics = useApi(`/analytics/me?tz=${tz()}`);
    const catalog = useApi('/tests/catalog');
    const assignments = useApi('/assignments');
    const news = useApi('/announcements');
    const { start, starting } = useStartTest();

    if (analytics.loading) return <PageLoader />;
    if (analytics.error) return <ErrorState error={analytics.error} onRetry={analytics.reload} />;
    const a = analytics.data.analytics;
    const t = a.totals;
    const inProgress = catalog.data?.inProgress || [];
    const due = (assignments.data?.assignments || []).filter((x) => !x.closed && !x.myAttemptId).slice(0, 3);
    const todayCount = a.streak.activeDays[new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10)] || 0;

    return (
        <div className="col gap-24">
            <section className="hero-card anim-in">
                <svg className="hero-pattern" viewBox="0 0 200 200" aria-hidden="true"><circle cx="100" cy="100" r="90" fill="none" stroke="#fff" strokeWidth="2" /><circle cx="100" cy="100" r="60" fill="none" stroke="#fff" strokeWidth="2" /><circle cx="100" cy="100" r="30" fill="none" stroke="#fff" strokeWidth="2" /></svg>
                <div className="row between wrap gap-24" style={{ position: 'relative' }}>
                    <div className="col gap-16" style={{ maxWidth: 560 }}>
                        <div className="row gap-8 wrap">
                            <Badge className="badge-outline" tone={null}><span style={{ color: '#fff' }}>{EXAM_LABEL[user.examType]}</span></Badge>
                            {a.streak.current > 0 && <span className="badge" style={{ background: 'rgba(255,255,255,0.16)', color: '#fff' }}><Flame size={12} /> {a.streak.current}-day streak</span>}
                        </div>
                        <h1>{greeting()}, {firstName(user.name)}.</h1>
                        <p>
                            {t.tests === 0
                                ? "Let's find your starting point. Take a 15-question AI Adaptive test and your dashboard will fill in."
                                : a.weakTopics[0]
                                    ? `Your biggest opportunity right now is ${a.weakTopics[0].topic} (${a.weakTopics[0].accuracy}% accuracy). A focused adaptive test will target it.`
                                    : 'You are on a roll. Keep your streak alive with an adaptive test today.'}
                        </p>
                        <div className="row wrap">
                            <button className="btn btn-secondary btn-lg" disabled={starting === 'adaptive'} onClick={() => start({ mode: 'adaptive', count: 15 })}>
                                <Sparkles size={18} /> {starting === 'adaptive' ? 'Preparing…' : 'Start AI Adaptive test'}
                            </button>
                            <Link to="/app/plan" className="btn btn-ghost btn-lg">View study plan</Link>
                        </div>
                    </div>
                    <div className="col" style={{ alignItems: 'center' }}>
                        <Ring value={t.readiness} size={150} stroke={12} color="#fff">
                            <div><div style={{ fontSize: 38, fontWeight: 800, letterSpacing: '-0.04em' }}>{t.readiness}</div><div className="xs" style={{ opacity: 0.8 }}>Readiness</div></div>
                        </Ring>
                        <div className="xs" style={{ opacity: 0.8 }}>Accuracy × syllabus coverage</div>
                    </div>
                </div>
            </section>

            {inProgress.length > 0 && (
                <div className="callout warn anim-in" style={{ alignItems: 'center' }}>
                    <Clock size={18} />
                    <div className="grow">
                        <b>You have {inProgress.length} unfinished test{inProgress.length > 1 ? 's' : ''}.</b> The timer keeps running on the server.
                    </div>
                    {inProgress.map((x) => (
                        <Link key={x.id} to={`/test/${x.id}`} className="btn btn-secondary btn-sm"><PlayCircle size={15} /> Resume {x.title}</Link>
                    ))}
                </div>
            )}

            <div className="grid grid-4">
                <Stat label="Tests completed" value={t.tests} icon={BookOpenCheck} foot={`${t.questions} questions answered`} />
                <Stat label="Accuracy" value={t.accuracy} suffix="%" icon={Target} tone="good" foot={`Best score ${t.bestPercent}%`} />
                <Stat label="Current streak" value={a.streak.current} suffix={a.streak.current === 1 ? 'day' : 'days'} icon={Flame} tone="accent" foot={`Longest ${a.streak.longest} · ${todayCount ? 'done today ✓' : 'practise today to extend'}`} />
                <Stat label="Time practised" value={duration(t.timeSpentSec)} icon={Clock} foot={`~${t.avgTimePerQuestion}s per question`} />
            </div>

            <div className="grid grid-main">
                <Card title="Score trend" subtitle="Your last 20 tests, marks as % of maximum" action={<Link to="/app/analytics" className="btn btn-ghost btn-sm">Analytics <ArrowRight size={14} /></Link>}>
                    {a.trend.length >= 2 ? <TrendChart data={a.trend} /> : <Empty icon={TrendingUp} title="Your trend appears after two tests">Each test adds a point so you can see momentum at a glance.</Empty>}
                </Card>
                <Card title="Accuracy by subject" subtitle="Correct ÷ attempted">
                    {a.subjects.some((s) => s.attempted) ? <SubjectBars subjects={a.subjects} /> : <Empty icon={Target} title="No answers yet">Complete a test to see subject accuracy.</Empty>}
                </Card>
            </div>

            <div className="grid grid-3">
                <Card title="Focus topics" subtitle="Lowest accuracy, at least 2 attempts" action={<Link to="/app/plan" className="btn btn-ghost btn-sm">Plan</Link>}>
                    {a.weakTopics.length ? (
                        <div className="list">
                            {a.weakTopics.slice(0, 4).map((w) => (
                                <div key={w.subject + w.topic} className="list-item">
                                    <div className="grow">
                                        <div className="row between"><span className="list-title truncate">{w.topic}</span><span className="small nums bold">{w.accuracy}%</span></div>
                                        <div className="row between mt-8" style={{ marginTop: 4 }}><Subject subject={w.subject} /><span className="xs subtle">{w.attempted} answered</span></div>
                                        <div className="mt-8"><ProgressBar value={w.accuracy} color="var(--bad)" label={`${w.topic} accuracy`} /></div>
                                    </div>
                                    <button className="btn btn-soft btn-sm" disabled={!!starting} onClick={() => start({ mode: 'custom', subject: w.subject, topics: [w.topic], count: 10 }, w.topic)}>
                                        {starting === w.topic ? '…' : 'Practise'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : <Empty icon={CheckCircle2} title="No weak topics yet">Weak topics appear once you've answered a topic at least twice.</Empty>}
                </Card>

                <Card title="Assignments due" action={<Link to="/app/classes" className="btn btn-ghost btn-sm">Classes</Link>}>
                    {due.length ? (
                        <div className="list">
                            {due.map((x) => (
                                <Link key={x.id} to={`/app/classes/${x.classId}`} className="list-item list-link">
                                    <span className="stat-icon accent"><CalendarClock size={18} /></span>
                                    <div className="grow" style={{ minWidth: 0 }}>
                                        <div className="list-title truncate">{x.title}</div>
                                        <div className="list-sub">{x.className} · {x.dueAt ? `due ${relative(x.dueAt)}` : 'no due date'}</div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : <Empty icon={CalendarClock} title="You're all caught up">Assignments from your teachers show up here. Join a class with a code on the Classes page.</Empty>}
                </Card>

                <Card title="Announcements" action={<Link to="/app/announcements" className="btn btn-ghost btn-sm">All</Link>}>
                    {news.data?.announcements?.length ? (
                        <div className="list">
                            {news.data.announcements.slice(0, 3).map((n) => (
                                <div key={n.id} className="list-item top">
                                    <span className="stat-icon"><Megaphone size={16} /></span>
                                    <div style={{ minWidth: 0 }}>
                                        <div className="list-title">{n.title}</div>
                                        <div className="list-sub">{n.className || 'Everyone'} · {relative(n.createdAt)}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : <Empty icon={Megaphone} title="No announcements" />}
                </Card>
            </div>

            <div className="grid grid-main">
                <Card title="Practice activity" subtitle="Each square is a day, darker means more tests">
                    <ActivityHeatmap activeDays={a.streak.activeDays} />
                </Card>
                <Card title="Recent tests" action={<Link to="/app/history" className="btn btn-ghost btn-sm">History</Link>}>
                    {a.recent.length ? (
                        <div className="list">
                            {a.recent.slice(0, 4).map((r) => (
                                <Link key={r.id} to={`/app/results/${r.id}`} className="list-item list-link">
                                    <div className="grow" style={{ minWidth: 0 }}>
                                        <div className="list-title truncate">{r.title}</div>
                                        <div className="list-sub">{relative(r.submittedAt)} · {r.score.correct}/{r.score.total} correct</div>
                                    </div>
                                    <span className="bold nums">{r.score.percent}%</span>
                                </Link>
                            ))}
                        </div>
                    ) : <Empty title="No tests yet" action={<Link to="/app/practice" className="btn btn-primary btn-sm">Browse practice</Link>} />}
                </Card>
            </div>
        </div>
    );
}
