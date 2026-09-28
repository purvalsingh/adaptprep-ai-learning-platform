import { useEffect, useMemo, useState } from 'react';
import { ScrollText, Search } from 'lucide-react';
import { useApi, useDocumentTitle } from '../../lib/useApi';
import { Badge, Card, Empty, ErrorState, PageHeader, Pager, Spinner } from '../../components/ui';
import { dateTime, relative } from '../../lib/format';
import { actionLabel } from './Overview';

const GROUPS = [['', 'All actions'], ['user', 'Accounts'], ['admin', 'Admin actions'], ['class', 'Classes'], ['assignment', 'Assignments'], ['question', 'Questions'], ['announcement', 'Announcements']];

export default function Audit() {
    useDocumentTitle('Audit log');
    const [action, setAction] = useState('');
    const [search, setSearch] = useState('');
    const [q, setQ] = useState('');
    const [page, setPage] = useState(1);
    useEffect(() => { const t = setTimeout(() => { setQ(search); setPage(1); }, 300); return () => clearTimeout(t); }, [search]);
    const path = useMemo(() => `/admin/audit?${new URLSearchParams({ page: String(page), pageSize: '25', ...(action ? { action } : {}), ...(q ? { search: q } : {}) })}`, [page, action, q]);
    const { data, error, loading, reload } = useApi(path);

    return (
        <div>
            <PageHeader title="Audit log" subtitle="A record of sensitive actions: sign-ups, role changes, deletions and content changes." />
            <Card flush>
                <div className="filters" style={{ padding: 16, borderBottom: '1px solid var(--line)' }}>
                    <div className="input-icon"><Search size={16} /><input className="input" placeholder="Search actor or target" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search audit log" /></div>
                    <select className="select" value={action} onChange={(e) => { setAction(e.target.value); setPage(1); }} aria-label="Action type">
                        {GROUPS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                </div>
                {loading ? <div className="page-loader" style={{ minHeight: 300 }}><Spinner lg /></div> : error ? <ErrorState error={error} onRetry={reload} /> : data.items.length ? (
                    <>
                        <div className="table-wrap">
                            <table className="table">
                                <thead><tr><th>When</th><th>Actor</th><th>Action</th><th className="hide-sm">Target</th></tr></thead>
                                <tbody>{data.items.map((e) => (
                                    <tr key={e.id}>
                                        <td className="small"><div>{relative(e.createdAt)}</div><div className="xs subtle">{dateTime(e.createdAt)}</div></td>
                                        <td><div className="bold small">{e.actorName}</div><div className="xs subtle">{e.actorRole}</div></td>
                                        <td><Badge tone={e.action.includes('deleted') || e.action.includes('reset') ? 'bad' : e.action.startsWith('admin') ? 'warn' : null}>{actionLabel(e.action)}</Badge></td>
                                        <td className="hide-sm small">{e.target}{e.meta && Object.keys(e.meta).length > 0 && <div className="xs subtle mono truncate" style={{ maxWidth: 320 }}>{JSON.stringify(e.meta)}</div>}</td>
                                    </tr>
                                ))}</tbody>
                            </table>
                        </div>
                        <Pager page={data.page} totalPages={data.totalPages} total={data.total} onPage={setPage} />
                    </>
                ) : <Empty icon={ScrollText} title="No matching entries" />}
            </Card>
        </div>
    );
}
