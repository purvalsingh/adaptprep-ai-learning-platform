import { useNavigate } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';
import { useApi, useDocumentTitle } from '../../lib/useApi';
import { Badge, Card, Empty, ErrorState, PageHeader, PageLoader, Person } from '../../components/ui';
import { EXAM_LABEL, date } from '../../lib/format';

export default function AdminClasses() {
    useDocumentTitle('All classes');
    const { data, error, loading, reload } = useApi('/admin/classes');
    const navigate = useNavigate();
    if (loading) return <PageLoader />;
    if (error) return <ErrorState error={error} onRetry={reload} />;
    return (
        <div>
            <PageHeader title="Classes" subtitle="Every class on the platform. Open one to manage it as its teacher would." />
            <Card flush>
                {data.classes.length ? (
                    <div className="table-wrap">
                        <table className="table">
                            <thead><tr><th>Class</th><th className="hide-sm">Teacher</th><th>Code</th><th className="num">Students</th><th className="num hide-sm">Assignments</th><th className="hide-md">Created</th></tr></thead>
                            <tbody>{data.classes.map((c) => (
                                <tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/app/classes/${c.id}`)}>
                                    <td><div className="bold">{c.name}</div><div className="row gap-4 mt-8" style={{ marginTop: 2 }}><Badge>{EXAM_LABEL[c.examType]}</Badge>{c.archived && <Badge>Archived</Badge>}</div></td>
                                    <td className="hide-sm">{c.teacher ? <Person user={c.teacher} size={28} /> : <span className="subtle">—</span>}</td>
                                    <td className="mono">{c.code}</td>
                                    <td className="num">{c.studentCount}</td>
                                    <td className="num hide-sm">{c.assignmentCount}</td>
                                    <td className="hide-md small muted">{date(c.createdAt)}</td>
                                </tr>
                            ))}</tbody>
                        </table>
                    </div>
                ) : <Empty icon={GraduationCap} title="No classes yet">Teachers create classes from their dashboard.</Empty>}
            </Card>
        </div>
    );
}
