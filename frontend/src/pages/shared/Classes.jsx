import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, KeyRound, Plus, Users } from 'lucide-react';
import { post } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useUi } from '../../context/UiContext';
import { useApi, useDocumentTitle } from '../../lib/useApi';
import { Badge, Card, Empty, ErrorState, Field, Modal, PageHeader, PageLoader, Person, Segmented } from '../../components/ui';
import { EXAM_LABEL } from '../../lib/format';

export function CreateClassModal({ onClose, onCreated }) {
    const { toast } = useUi();
    const [form, setForm] = useState({ name: '', description: '', examType: 'jee' });
    const [busy, setBusy] = useState(false);
    const submit = async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
            const d = await post('/classes', form);
            toast(`Class created. Join code: ${d.class.code}`);
            onCreated(d.class);
        } catch (err) { toast(err.message, 'error'); setBusy(false); }
    };
    return (
        <Modal title="Create a class" subtitle="Students join with a 6-character code you'll get next." onClose={onClose}
            footer={<><button className="btn btn-secondary" onClick={onClose}>Cancel</button><button className="btn btn-primary" form="create-class" disabled={busy || form.name.trim().length < 3}>{busy ? 'Creating…' : 'Create class'}</button></>}>
            <form id="create-class" className="col gap-16" onSubmit={submit}>
                <Field label="Class name"><input className="input" autoFocus value={form.name} maxLength={80} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="JEE 2027 · Batch B" /></Field>
                <Field label="Exam"><Segmented value={form.examType} onChange={(v) => setForm({ ...form, examType: v })} options={[{ value: 'jee', label: 'JEE Main' }, { value: 'neet', label: 'NEET UG' }]} /></Field>
                <Field label="Description (optional)"><textarea className="textarea" maxLength={300} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Schedule, expectations, anything students should know." /></Field>
            </form>
        </Modal>
    );
}

function JoinCard({ onJoined }) {
    const { toast } = useUi();
    const [code, setCode] = useState('');
    const [busy, setBusy] = useState(false);
    const join = async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
            const d = await post('/classes/join', { code: code.trim() });
            toast(`You joined ${d.class.name}`);
            setCode('');
            onJoined(d.class);
        } catch (err) { toast(err.message, 'error'); }
        setBusy(false);
    };
    return (
        <Card>
            <form className="row wrap gap-16" onSubmit={join}>
                <span className="stat-icon" style={{ width: 44, height: 44 }}><KeyRound size={20} /></span>
                <div className="grow" style={{ minWidth: 200 }}>
                    <h3>Join a class</h3>
                    <p className="small muted">Enter the 6-character code your teacher shared.</p>
                </div>
                <input className="input mono" style={{ width: 170, letterSpacing: '0.15em', textTransform: 'uppercase' }} value={code} maxLength={12} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="ABC123" aria-label="Class code" />
                <button className="btn btn-primary" disabled={busy || code.trim().length < 4}>{busy ? 'Joining…' : 'Join'}</button>
            </form>
        </Card>
    );
}

export default function Classes() {
    const { user } = useAuth();
    useDocumentTitle(user.role === 'student' ? 'My classes' : 'Classes');
    const { data, error, loading, reload } = useApi('/classes');
    const [creating, setCreating] = useState(false);
    const navigate = useNavigate();

    if (loading) return <PageLoader />;
    if (error) return <ErrorState error={error} onRetry={reload} />;
    const isStudent = user.role === 'student';

    return (
        <div className="col gap-24">
            <PageHeader title={isStudent ? 'My classes' : 'Classes'}
                subtitle={isStudent ? 'Classes you belong to, with assignments and announcements from your teachers.' : 'Create classes, share join codes and track every student.'}
                actions={!isStudent && <button className="btn btn-primary" onClick={() => setCreating(true)}><Plus size={16} /> New class</button>} />
            {isStudent && <JoinCard onJoined={(c) => navigate(`/app/classes/${c.id}`)} />}
            {data.classes.length ? (
                <div className="grid grid-3">
                    {data.classes.map((c) => (
                        <Link key={c.id} to={`/app/classes/${c.id}`} className="card card-link col gap-16">
                            <div className="row between">
                                <span className="stat-icon" style={{ width: 44, height: 44 }}><GraduationCap size={22} /></span>
                                <div className="row gap-4">
                                    {c.archived && <Badge>Archived</Badge>}
                                    <Badge tone="brand">{EXAM_LABEL[c.examType]}</Badge>
                                </div>
                            </div>
                            <div>
                                <h3>{c.name}</h3>
                                {c.description && <p className="small muted mt-8" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{c.description}</p>}
                            </div>
                            <div className="grow" />
                            <div className="row between small">
                                {isStudent ? <Person user={c.teacher} sub="Teacher" size={28} /> : <span className="muted row gap-4"><Users size={14} /> {c.studentCount} students</span>}
                                {isStudent
                                    ? (c.pendingAssignments ? <Badge tone="warn">{c.pendingAssignments} to do</Badge> : <Badge tone="good">All done</Badge>)
                                    : <span className="mono bold">{c.code}</span>}
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                <Card>
                    {isStudent
                        ? <Empty icon={GraduationCap} title="You're not in any classes yet">Ask your teacher for a class code and enter it above.</Empty>
                        : <Empty icon={GraduationCap} title="No classes yet" action={<button className="btn btn-primary" onClick={() => setCreating(true)}><Plus size={16} /> Create your first class</button>}>Create a class, share its code, and students can join instantly.</Empty>}
                </Card>
            )}
            {creating && <CreateClassModal onClose={() => setCreating(false)} onCreated={(c) => navigate(`/app/classes/${c.id}`)} />}
        </div>
    );
}
