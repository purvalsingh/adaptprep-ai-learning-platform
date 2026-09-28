import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ClipboardList, Plus } from 'lucide-react';
import { useApi, useDocumentTitle } from '../../lib/useApi';
import { Badge, Card, Empty, ErrorState, PageHeader, PageLoader, ProgressBar, Segmented } from '../../components/ui';
import { dateTime, relative } from '../../lib/format';

export default function Assignments() {
    useDocumentTitle('Assignments');
    const { data, error, loading, reload } = useApi('/assignments');
    const [filter, setFilter] = useState('open');
    const navigate = useNavigate();
    if (loading) return <PageLoader />;
    if (error) return <ErrorState error={error} onRetry={reload} />;
    const rows = data.assignments.filter((a) => filter === 'all' || (filter === 'open' ? !a.closed : a.closed));

    return (
        <div>
            <PageHeader title="Assignments" subtitle="Tests you've assigned to your classes."
                actions={<Link to="/app/assignments/new" className="btn btn-primary"><Plus size={16} /> New assignment</Link>} />
            <div className="mb-16"><Segmented value={filter} onChange={setFilter} options={[{ value: 'open', label: 'Open' }, { value: 'closed', label: 'Closed' }, { value: 'all', label: 'All' }]} /></div>
            <Card flush>
                {rows.length ? (
                    <div className="table-wrap">
                        <table className="table">
                            <thead><tr><th>Assignment</th><th className="hide-md">Class</th><th className="hide-sm">Due</th><th style={{ width: 200 }}>Submissions</th></tr></thead>
                            <tbody>{rows.map((a) => (
                                <tr key={a.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/app/assignments/${a.id}`)}>
                                    <td><div className="bold">{a.title}</div><div className="xs subtle">{a.questionCount} questions · {a.durationMin} min</div></td>
                                    <td className="hide-md">{a.className}</td>
                                    <td className="hide-sm">{a.dueAt ? <><div className="small">{dateTime(a.dueAt)}</div><div className="xs subtle">{relative(a.dueAt)}</div></> : <span className="subtle">No due date</span>}{a.closed && <Badge className="mt-8">Closed</Badge>}</td>
                                    <td>
                                        <div className="row between xs mb-8"><span className="subtle">{a.submitted} of {a.studentCount}</span><b className="nums">{a.studentCount ? Math.round((a.submitted / a.studentCount) * 100) : 0}%</b></div>
                                        <ProgressBar value={a.studentCount ? (a.submitted / a.studentCount) * 100 : 0} label="Submission rate" />
                                    </td>
                                </tr>
                            ))}</tbody>
                        </table>
                    </div>
                ) : <Empty icon={ClipboardList} title={data.assignments.length ? `No ${filter} assignments` : 'No assignments yet'} action={<Link to="/app/assignments/new" className="btn btn-primary"><Plus size={16} /> Create assignment</Link>} />}
            </Card>
        </div>
    );
}
