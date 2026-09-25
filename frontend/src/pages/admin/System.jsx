import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { Cpu, HardDrive, KeyRound, Server, Sparkles } from 'lucide-react';
import { useApi, useDocumentTitle } from '../../lib/useApi';
import { Badge, Callout, Card, ErrorState, PageHeader, PageLoader } from '../../components/ui';
import { duration } from '../../lib/format';

export default function System() {
    useDocumentTitle('System & AI');
    const { data, error, loading, reload } = useApi('/admin/system');
    if (loading) return <PageLoader />;
    if (error) return <ErrorState error={error} onRetry={reload} />;
    return (
        <div className="col gap-24" style={{ maxWidth: 960 }}>
            <PageHeader title="System & AI" subtitle="Runtime status and configuration." />
            <Card title="AI engine" action={<Badge tone={data.ai.external ? 'good' : 'brand'}>{data.ai.external ? 'External LLM + fallback' : 'Built-in'}</Badge>}>
                <div className="row top gap-16">
                    <span className="stat-icon" style={{ width: 44, height: 44 }}><Sparkles size={22} /></span>
                    <div className="grow col gap-8">
                        <b>{data.ai.label}</b>
                        <p className="small muted">
                            The built-in <b>AdaptPrep Local AI</b> powers tutoring chat, performance analysis, study plans, per-question explanations,
                            interactive quizzes, class insights and verified question generation, with no external calls.
                            {data.ai.external ? ' Open-ended conversations and explanations are routed to Gemini, falling back to the local engine on any error.' : ''}
                        </p>
                        {!data.ai.external && (
                            <Callout icon={KeyRound}>
                                To upgrade conversations to a large language model, set <code>GEMINI_API_KEY</code> (and optionally <code>GEMINI_MODEL</code>) in <code>backend/.env</code> and restart the server. Data-driven features stay on the local engine so they remain accurate.
                            </Callout>
                        )}
                    </div>
                </div>
            </Card>
            <div className="grid grid-2">
                <Card title="Runtime">
                    <dl className="kv">
                        <dt className="row gap-4"><Server size={14} /> Environment</dt><dd>{data.env}</dd>
                        <dt className="row gap-4"><Cpu size={14} /> Node.js</dt><dd>{data.node}</dd>
                        <dt>Uptime</dt><dd>{duration(data.uptimeSec)}</dd>
                        <dt className="row gap-4"><HardDrive size={14} /> Storage</dt><dd className="mono xs" style={{ wordBreak: 'break-all' }}>{data.storage}</dd>
                    </dl>
                </Card>
                <Card title="Records">
                    <dl className="kv">
                        {Object.entries(data.records).map(([k, v]) => <Fragment key={k}><dt style={{ textTransform: 'capitalize' }}>{k}</dt><dd className="nums">{v.toLocaleString()}</dd></Fragment>)}
                    </dl>
                </Card>
            </div>
            <Card title="Security posture">
                <ul className="col gap-8 small" style={{ margin: 0, paddingLeft: 18 }}>
                    <li>Passwords hashed with bcrypt; sessions are signed JWTs revoked on password, role or status change.</li>
                    <li>Correct answers never leave the server until a test is submitted; grading and timers are enforced server-side.</li>
                    <li>Role-based access on every endpoint; teachers only see students in their own classes.</li>
                    <li>Rate limiting on sign-in and AI endpoints; security headers on every response.</li>
                    <li>Sensitive actions are recorded in the <Link to="/app/admin/audit">audit log</Link>.</li>
                </ul>
            </Card>
        </div>
    );
}
