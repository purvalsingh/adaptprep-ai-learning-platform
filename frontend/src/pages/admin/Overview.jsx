import { Link } from 'react-router-dom';
import { Activity, ArrowRight, BookOpenCheck, Database, GraduationCap, ScrollText, ShieldAlert, Users } from 'lucide-react';
import { useApi, useDocumentTitle } from '../../lib/useApi';
import { CountColumns } from '../../components/charts';
import { Card, Empty, ErrorState, PageHeader, PageLoader, Person, ProgressBar, Stat } from '../../components/ui';
import { EXAM_LABEL, relative, subjectLabel } from '../../lib/format';

export const actionLabel = (a) => a.replace(/[._]/g, ' ').replace(/^\w/, (c) => c.toUpperCase());

export default function AdminOverview() {
    useDocumentTitle('Admin overview');
    const { data, error, loading, reload } = useApi('/admin/overview');
    if (loading) return <PageLoader />;
    if (error) return <ErrorState error={error} onRetry={reload} />;
    const c = data.counts;
    const maxSubject = Math.max(1, ...data.subjects.map((s) => s.count));

    return (
        <div className="col gap-24">
            <PageHeader title="Platform overview" subtitle="Health, growth and activity across AdaptPrep."
                actions={<><Link to="/app/admin/users" className="btn btn-secondary"><Users size={16} /> Manage users</Link><Link to="/app/admin/system" className="btn btn-primary">System & AI</Link></>} />
            <div className="grid grid-4">
                <Stat label="Users" value={c.users} icon={Users} foot={`${c.students} students · ${c.teachers} teachers · ${c.admins} admins`} />
                <Stat label="Active this week" value={c.activeWeek} icon={Activity} tone="good" foot={`${c.testsWeek} tests submitted in 7 days`} />
                <Stat label="Classes" value={c.classes} icon={GraduationCap} foot={`${c.assignments} assignments`} />
                <Stat label="Questions" value={c.questions} icon={Database} tone="accent" foot={`${c.customQuestions} custom or AI-generated`} />
            </div>
            <div className="grid grid-2">
                <Card title="Tests submitted" subtitle="Last 14 days"><CountColumns data={data.activity} dataKey="tests" name="Tests" /></Card>
                <Card title="New sign-ups" subtitle="Last 14 days"><CountColumns data={data.signups} dataKey="count" name="Sign-ups" /></Card>
            </div>
            <div className="grid grid-3">
                <Card title="Tests by subject">
                    {data.subjects.length ? (
                        <div className="col gap-16">{data.subjects.map((s) => (
                            <div key={s.subject}>
                                <div className="row between small mb-8"><span className="bold">{subjectLabel(s.subject)}</span><b className="nums">{s.count}</b></div>
                                <ProgressBar value={(s.count / maxSubject) * 100} color="var(--brand)" label={`${s.subject} tests`} />
                            </div>
                        ))}
                            <hr className="divider" style={{ margin: 0 }} />
                            <div className="row wrap gap-16 small muted">{data.exams.map((e) => <span key={e.exam}>{EXAM_LABEL[e.exam]}: <b style={{ color: 'var(--ink)' }}>{e.students}</b> students</span>)}</div>
                        </div>
                    ) : <Empty title="No tests yet" />}
                </Card>
                <Card title="Top students" subtitle="By average score">
                    {data.topStudents.length ? (
                        <div className="list">{data.topStudents.map((s, i) => (
                            <div key={s.id} className="list-item">
                                <span className="bold nums subtle" style={{ width: 18 }}>{i + 1}</span>
                                <div className="grow"><Person user={s} sub={`${s.tests} tests`} size={30} /></div>
                                <b className="nums">{s.avgPercent}%</b>
                            </div>
                        ))}</div>
                    ) : <Empty icon={BookOpenCheck} title="No results yet" />}
                </Card>
                <Card title="Recent activity" action={<Link to="/app/admin/audit" className="btn btn-ghost btn-sm">Audit log <ArrowRight size={14} /></Link>}>
                    {data.recentAudit.length ? (
                        <div className="list">{data.recentAudit.slice(0, 6).map((e) => (
                            <div key={e.id} className="list-item top">
                                <span className="stat-icon"><ScrollText size={16} /></span>
                                <div style={{ minWidth: 0 }}>
                                    <div className="small"><b>{e.actorName}</b> · {actionLabel(e.action)}</div>
                                    <div className="list-sub truncate">{e.target} · {relative(e.createdAt)}</div>
                                </div>
                            </div>
                        ))}</div>
                    ) : <Empty title="No activity yet" />}
                </Card>
            </div>
            {c.suspended > 0 && (
                <div className="callout warn"><ShieldAlert size={18} /><div>{c.suspended} account{c.suspended === 1 ? ' is' : 's are'} suspended. <Link to="/app/admin/users?status=suspended">Review</Link></div></div>
            )}
        </div>
    );
}
