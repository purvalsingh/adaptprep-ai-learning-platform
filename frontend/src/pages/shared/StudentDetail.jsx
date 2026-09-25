import { Link, useParams } from 'react-router-dom';
import { useApi, useDocumentTitle } from '../../lib/useApi';
import AnalyticsView from '../../components/AnalyticsView';
import { Card, ErrorState, PageHeader, PageLoader, Person } from '../../components/ui';
import { EXAM_LABEL, relative } from '../../lib/format';

export default function StudentDetail() {
    const { id } = useParams();
    const { data, error, loading, reload } = useApi(`/analytics/student/${id}`);
    useDocumentTitle(data?.student?.name || 'Student');
    if (loading) return <PageLoader />;
    if (error) return <ErrorState error={error} onRetry={reload} />;
    const { student: s, analytics: a } = data;
    return (
        <div className="col gap-24">
            <PageHeader back={{ to: '/app/classes', label: 'Classes' }} title={s.name} subtitle={`${EXAM_LABEL[s.examType]} student · ${s.email}`} />
            <Card>
                <div className="row wrap between">
                    <Person user={s} sub={s.institution || 'No institute set'} size={48} />
                    <div className="row wrap gap-24 small">
                        <span><span className="subtle">Target year</span> <b>{s.targetYear || '—'}</b></span>
                        <span><span className="subtle">Last login</span> <b>{relative(s.lastLoginAt)}</b></span>
                        <span><span className="subtle">Weak topics</span> <b>{a.weakTopics.slice(0, 3).map((t) => t.topic).join(', ') || '—'}</b></span>
                    </div>
                </div>
            </Card>
            <AnalyticsView a={a} />
            {a.recent.length > 0 && (
                <Card title="Recent submissions" subtitle="Open any test to see the student's answers.">
                    <div className="list">{a.recent.map((r) => (
                        <Link key={r.id} to={`/app/results/${r.id}`} className="list-item list-link">
                            <div className="grow"><div className="list-title">{r.title}</div><div className="list-sub">{relative(r.submittedAt)}</div></div>
                            <b className="nums">{r.score.percent}%</b>
                        </Link>
                    ))}</div>
                </Card>
            )}
        </div>
    );
}
