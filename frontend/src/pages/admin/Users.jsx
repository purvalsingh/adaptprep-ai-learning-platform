import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Ban, Copy, KeyRound, MoreHorizontal, Pencil, Search, ShieldCheck, Trash2, UserPlus } from 'lucide-react';
import { del, post, put } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useUi } from '../../context/UiContext';
import { useApi, useDocumentTitle } from '../../lib/useApi';
import { Badge, Card, Empty, ErrorState, Field, Modal, PageHeader, Pager, PasswordInput, Person, Segmented, Spinner } from '../../components/ui';
import { EXAM_LABEL, date, relative } from '../../lib/format';

const ROLE_TONE = { admin: 'bad', teacher: 'brand', student: null };

function UserModal({ user, onClose, onSaved }) {
    const { toast } = useUi();
    const creating = !user;
    const [f, setF] = useState(user ? { name: user.name, role: user.role, examType: user.examType, status: user.status } : { name: '', email: '', password: '', role: 'student', examType: 'jee' });
    const [busy, setBusy] = useState(false);
    const save = async () => {
        setBusy(true);
        try {
            if (creating) await post('/admin/users', f);
            else await put(`/admin/users/${user.id}`, { name: f.name, role: f.role, examType: f.examType });
            toast(creating ? 'User created' : 'User updated');
            onSaved();
        } catch (e) { toast(e.message, 'error'); setBusy(false); }
    };
    return (
        <Modal title={creating ? 'Add user' : `Edit ${user.name}`} subtitle={creating ? 'Admins can create accounts of any role.' : 'Changing the role signs the user out.'} onClose={onClose}
            footer={<><button className="btn btn-secondary" onClick={onClose}>Cancel</button><button className="btn btn-primary" disabled={busy} onClick={save}>{busy ? 'Saving…' : 'Save'}</button></>}>
            <div className="col gap-16">
                <Field label="Name"><input className="input" value={f.name} maxLength={60} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
                {creating && <Field label="Email"><input className="input" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>}
                {creating && <Field label="Initial password" hint="At least 8 characters with a letter and a number."><PasswordInput value={f.password} autoComplete="new-password" onChange={(e) => setF({ ...f, password: e.target.value })} /></Field>}
                <Field label="Role"><Segmented value={f.role} onChange={(v) => setF({ ...f, role: v })} options={[{ value: 'student', label: 'Student' }, { value: 'teacher', label: 'Teacher' }, { value: 'admin', label: 'Admin' }]} /></Field>
                {f.role === 'student' && <Field label="Exam"><Segmented value={f.examType} onChange={(v) => setF({ ...f, examType: v })} options={[{ value: 'jee', label: EXAM_LABEL.jee }, { value: 'neet', label: EXAM_LABEL.neet }]} /></Field>}
            </div>
        </Modal>
    );
}

function RowMenu({ u, me, onEdit, onChanged }) {
    const { toast, confirm } = useUi();
    const [open, setOpen] = useState(false);
    const [temp, setTemp] = useState(null);
    useEffect(() => {
        if (!open) return undefined;
        const close = () => setOpen(false);
        setTimeout(() => document.addEventListener('click', close), 0);
        return () => document.removeEventListener('click', close);
    }, [open]);

    const toggleSuspend = async () => {
        const suspend = u.status !== 'suspended';
        if (suspend && !(await confirm({ title: `Suspend ${u.name}?`, message: 'They are signed out immediately and cannot sign in until reactivated.', confirmText: 'Suspend', danger: true }))) return;
        try { await put(`/admin/users/${u.id}`, { status: suspend ? 'suspended' : 'active' }); toast(suspend ? 'User suspended' : 'User reactivated'); onChanged(); } catch (e) { toast(e.message, 'error'); }
    };
    const reset = async () => {
        if (!(await confirm({ title: `Reset ${u.name}'s password?`, message: 'A temporary password will be generated and their sessions ended.', confirmText: 'Reset password' }))) return;
        try { const d = await post(`/admin/users/${u.id}/reset-password`); setTemp(d.temporaryPassword); } catch (e) { toast(e.message, 'error'); }
    };
    const remove = async () => {
        if (!(await confirm({ title: `Delete ${u.name}?`, message: u.role === 'teacher' ? 'Their classes, assignments and announcements will also be deleted. This cannot be undone.' : 'Their tests and conversations will be permanently deleted.', confirmText: 'Delete user', danger: true }))) return;
        try { await del(`/admin/users/${u.id}`); toast('User deleted'); onChanged(); } catch (e) { toast(e.message, 'error'); }
    };

    return (
        <div className="dropdown">
            <button className="btn btn-ghost btn-icon" onClick={() => setOpen((o) => !o)} aria-label={`Actions for ${u.name}`} aria-haspopup="menu"><MoreHorizontal size={18} /></button>
            {open && (
                <div className="dropdown-menu" role="menu">
                    <button className="dropdown-item" onClick={onEdit}><Pencil size={16} /> Edit name & role</button>
                    <button className="dropdown-item" onClick={reset}><KeyRound size={16} /> Reset password</button>
                    {u.id !== me && <button className="dropdown-item" onClick={toggleSuspend}>{u.status === 'suspended' ? <><ShieldCheck size={16} /> Reactivate</> : <><Ban size={16} /> Suspend</>}</button>}
                    {u.id !== me && <button className="dropdown-item danger" onClick={remove}><Trash2 size={16} /> Delete</button>}
                </div>
            )}
            {temp && (
                <Modal title="Temporary password" subtitle={`Share it with ${u.name} securely. It is shown only once.`} onClose={() => setTemp(null)}
                    footer={<button className="btn btn-primary" onClick={() => setTemp(null)}>Done</button>}>
                    <div className="row gap-8">
                        <span className="code-box grow" style={{ fontSize: 18, letterSpacing: '0.05em' }}>{temp}</span>
                        <button className="btn btn-secondary" onClick={async () => { try { await navigator.clipboard.writeText(temp); toast('Copied'); } catch { /* ignore */ } }}><Copy size={16} /> Copy</button>
                    </div>
                </Modal>
            )}
        </div>
    );
}

export default function Users() {
    useDocumentTitle('Users');
    const { user: me } = useAuth();
    const [params] = useSearchParams();
    const [role, setRole] = useState('');
    const [status, setStatus] = useState(params.get('status') || '');
    const [search, setSearch] = useState('');
    const [q, setQ] = useState('');
    const [page, setPage] = useState(1);
    const [modal, setModal] = useState(null);
    useEffect(() => { const t = setTimeout(() => { setQ(search); setPage(1); }, 300); return () => clearTimeout(t); }, [search]);
    const path = useMemo(() => `/admin/users?${new URLSearchParams({ page: String(page), pageSize: '15', ...(role ? { role } : {}), ...(status ? { status } : {}), ...(q ? { search: q } : {}) })}`, [page, role, status, q]);
    const { data, error, loading, reload } = useApi(path);

    return (
        <div>
            <PageHeader title="Users" subtitle="Manage every account on the platform." actions={<button className="btn btn-primary" onClick={() => setModal({ create: true })}><UserPlus size={16} /> Add user</button>} />
            <Card flush>
                <div className="filters" style={{ padding: 16, borderBottom: '1px solid var(--line)' }}>
                    <div className="input-icon"><Search size={16} /><input className="input" placeholder="Search name or email" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search users" /></div>
                    <Segmented value={role} onChange={(v) => { setRole(v); setPage(1); }} options={[{ value: '', label: 'All' }, { value: 'student', label: 'Students' }, { value: 'teacher', label: 'Teachers' }, { value: 'admin', label: 'Admins' }]} />
                    <select className="select" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} aria-label="Status"><option value="">Any status</option><option value="active">Active</option><option value="suspended">Suspended</option></select>
                </div>
                {loading ? <div className="page-loader" style={{ minHeight: 300 }}><Spinner lg /></div> : error ? <ErrorState error={error} onRetry={reload} /> : data.items.length ? (
                    <>
                        <div className="table-wrap">
                            <table className="table">
                                <thead><tr><th>User</th><th>Role</th><th className="hide-sm">Status</th><th className="hide-md">Joined</th><th className="hide-md">Last login</th><th /></tr></thead>
                                <tbody>{data.items.map((u) => (
                                    <tr key={u.id}>
                                        <td><Person user={u} sub={u.email} size={32} /></td>
                                        <td><Badge tone={ROLE_TONE[u.role]}>{u.role}</Badge>{u.role === 'student' && <span className="xs subtle" style={{ marginLeft: 6 }}>{u.examType.toUpperCase()}</span>}</td>
                                        <td className="hide-sm">{u.status === 'suspended' ? <Badge tone="bad"><Ban size={12} /> Suspended</Badge> : <Badge tone="good">Active</Badge>}</td>
                                        <td className="hide-md small muted">{date(u.createdAt)}</td>
                                        <td className="hide-md small muted">{relative(u.lastLoginAt)}</td>
                                        <td className="num"><RowMenu u={u} me={me.id} onEdit={() => setModal({ user: u })} onChanged={() => reload({ quiet: true })} /></td>
                                    </tr>
                                ))}</tbody>
                            </table>
                        </div>
                        <Pager page={data.page} totalPages={data.totalPages} total={data.total} onPage={setPage} />
                    </>
                ) : <Empty title="No users match" />}
            </Card>
            {modal && <UserModal user={modal.user} onClose={() => setModal(null)} onSaved={() => { setModal(null); reload({ quiet: true }); }} />}
        </div>
    );
}
