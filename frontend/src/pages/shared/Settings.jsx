import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, Monitor, Moon, Sun, Trash2, UserRound } from 'lucide-react';
import { del } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useUi } from '../../context/UiContext';
import { useDocumentTitle } from '../../lib/useApi';
import { Avatar, Badge, Card, Field, Modal, PageHeader, PasswordInput, Segmented } from '../../components/ui';
import { EXAM_LABEL, date } from '../../lib/format';

const AVATARS = Array.from({ length: 10 }, (_, i) => `avatar_${i + 1}.jpg`);

function ProfileCard() {
    const { user, updateProfile } = useAuth();
    const { toast } = useUi();
    const [form, setForm] = useState({
        name: user.name, avatar: user.avatar, bio: user.bio || '', institution: user.institution || '',
        examType: user.examType, targetYear: user.targetYear || '', dailyGoal: user.dailyGoal || 20
    });
    const [busy, setBusy] = useState(false);
    const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e?.target ? e.target.value : e }));

    const save = async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
            const payload = { name: form.name, avatar: form.avatar, bio: form.bio, institution: form.institution };
            if (user.role === 'student') Object.assign(payload, { examType: form.examType, targetYear: form.targetYear === '' ? null : Number(form.targetYear), dailyGoal: Number(form.dailyGoal) });
            await updateProfile(payload);
            toast('Profile saved');
        } catch (err) { toast(err.message, 'error'); }
        setBusy(false);
    };

    return (
        <Card title="Profile" subtitle={`Member since ${date(user.createdAt)}`}>
            <form className="col gap-16" onSubmit={save}>
                <div className="row gap-16">
                    <Avatar user={{ ...user, avatar: form.avatar }} size={64} />
                    <div className="avatar-pick grow">
                        {AVATARS.map((a) => (
                            <button type="button" key={a} className={form.avatar === a ? 'active' : ''} onClick={() => set('avatar')(a)} aria-label={`Avatar ${a.match(/\d+/)[0]}`} aria-pressed={form.avatar === a}>
                                <img className="avatar" src={`/assets/avatar/${a}`} alt="" width={34} height={34} style={{ width: 34, height: 34 }} />
                            </button>
                        ))}
                    </div>
                </div>
                <div className="form-grid">
                    <Field label="Full name"><input className="input" value={form.name} maxLength={60} onChange={set('name')} /></Field>
                    <Field label="Email" hint="Contact an admin to change your email."><input className="input" value={user.email} disabled /></Field>
                    <Field label="School / institute"><input className="input" value={form.institution} maxLength={100} onChange={set('institution')} /></Field>
                    {user.role === 'student' && (
                        <Field label="Target exam year"><input className="input" type="number" min={2024} max={2040} value={form.targetYear} onChange={set('targetYear')} placeholder="2027" /></Field>
                    )}
                    {user.role === 'student' && (
                        <Field label="Preparing for" hint="Switching exams requires leaving classes for the other exam.">
                            <Segmented value={form.examType} onChange={set('examType')} options={[{ value: 'jee', label: EXAM_LABEL.jee }, { value: 'neet', label: EXAM_LABEL.neet }]} />
                        </Field>
                    )}
                    {user.role === 'student' && (
                        <Field label="Daily goal (questions)"><input className="input" type="number" min={5} max={200} value={form.dailyGoal} onChange={set('dailyGoal')} /></Field>
                    )}
                    <Field label="Bio" className="full"><textarea className="textarea" maxLength={280} value={form.bio} onChange={set('bio')} placeholder="A line about you" /></Field>
                </div>
                <div className="row end"><button className="btn btn-primary" disabled={busy || form.name.trim().length < 2}>{busy ? 'Saving…' : 'Save profile'}</button></div>
            </form>
        </Card>
    );
}

function PasswordCard() {
    const { changePassword } = useAuth();
    const { toast } = useUi();
    const [f, setF] = useState({ current: '', next: '', confirm: '' });
    const [err, setErr] = useState('');
    const [busy, setBusy] = useState(false);
    const submit = async (e) => {
        e.preventDefault();
        setErr('');
        if (f.next !== f.confirm) return setErr('New passwords do not match.');
        setBusy(true);
        try {
            await changePassword(f.current, f.next);
            setF({ current: '', next: '', confirm: '' });
            toast('Password changed. Other devices have been signed out.');
        } catch (e2) { setErr(e2.message); }
        setBusy(false);
    };
    return (
        <Card title="Password" subtitle="Changing it signs you out everywhere else.">
            <form className="col gap-16" onSubmit={submit}>
                {err && <div className="form-error">{err}</div>}
                <Field label="Current password"><PasswordInput value={f.current} onChange={(e) => setF({ ...f, current: e.target.value })} /></Field>
                <Field label="New password" hint="At least 8 characters with a letter and a number."><PasswordInput value={f.next} autoComplete="new-password" onChange={(e) => setF({ ...f, next: e.target.value })} /></Field>
                <Field label="Confirm new password"><PasswordInput value={f.confirm} autoComplete="new-password" onChange={(e) => setF({ ...f, confirm: e.target.value })} /></Field>
                <div className="row end"><button className="btn btn-secondary" disabled={busy || !f.current || !f.next}><KeyRound size={16} /> Update password</button></div>
            </form>
        </Card>
    );
}

function DangerCard() {
    const { logout } = useAuth();
    const { toast } = useUi();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [pw, setPw] = useState('');
    const [busy, setBusy] = useState(false);
    const remove = async () => {
        setBusy(true);
        try {
            await del('/me', { password: pw });
            logout();
            navigate('/');
            toast('Your account has been deleted.');
        } catch (e) { toast(e.message, 'error'); setBusy(false); }
    };
    return (
        <Card title="Delete account" subtitle="Permanently removes your account, tests, conversations and classes you own.">
            <button className="btn btn-danger" onClick={() => setOpen(true)}><Trash2 size={16} /> Delete my account</button>
            {open && (
                <Modal title="Delete your account?" subtitle="This can't be undone." onClose={() => setOpen(false)}
                    footer={<><button className="btn btn-secondary" onClick={() => setOpen(false)}>Cancel</button><button className="btn btn-danger" disabled={!pw || busy} onClick={remove}>{busy ? 'Deleting…' : 'Delete forever'}</button></>}>
                    <Field label="Enter your password to confirm"><PasswordInput value={pw} onChange={(e) => setPw(e.target.value)} /></Field>
                </Modal>
            )}
        </Card>
    );
}

export default function Settings() {
    useDocumentTitle('Settings');
    const { user } = useAuth();
    const { theme, setTheme } = useUi();
    return (
        <div className="col gap-24" style={{ maxWidth: 860 }}>
            <PageHeader title="Profile & settings" subtitle={<span className="row gap-8"><UserRound size={14} /> {user.email} <Badge tone="brand">{user.role}</Badge></span>} />
            <ProfileCard />
            <Card title="Appearance">
                <div className="row wrap gap-16">
                    {[{ v: 'light', icon: Sun, l: 'Light' }, { v: 'dark', icon: Moon, l: 'Dark' }].map((o) => (
                        <button key={o.v} className={`role-opt ${theme === o.v ? 'active' : ''}`} style={{ minWidth: 150 }} onClick={() => setTheme(o.v)} aria-pressed={theme === o.v}>
                            <o.icon size={18} /><span className="bold small">{o.l}</span>
                        </button>
                    ))}
                    <span className="small subtle row gap-4"><Monitor size={14} /> Your choice is remembered on this device.</span>
                </div>
            </Card>
            <PasswordCard />
            <DangerCard />
        </div>
    );
}
