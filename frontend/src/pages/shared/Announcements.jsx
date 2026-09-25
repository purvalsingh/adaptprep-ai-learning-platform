import { useState } from 'react';
import { Globe, Megaphone, Trash2, Users } from 'lucide-react';
import { del, post } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useUi } from '../../context/UiContext';
import { useApi, useDocumentTitle } from '../../lib/useApi';
import { Badge, Card, Empty, ErrorState, Field, PageHeader, PageLoader, Person } from '../../components/ui';
import { dateTime, relative } from '../../lib/format';

export default function Announcements() {
    useDocumentTitle('Announcements');
    const { user } = useAuth();
    const { toast, confirm } = useUi();
    const feed = useApi('/announcements');
    const classes = useApi(user.role === 'student' ? null : '/classes');
    const [form, setForm] = useState({ title: '', body: '', classId: user.role === 'admin' ? '' : null });
    const [busy, setBusy] = useState(false);

    const canPost = user.role !== 'student';
    const ownClasses = (classes.data?.classes || []).filter((c) => user.role === 'admin' || c.teacher?.id === user.id);
    const target = form.classId ?? ownClasses[0]?.id ?? '';

    const submit = async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
            await post('/announcements', { title: form.title, body: form.body, classId: target || undefined });
            toast('Announcement posted');
            setForm((f) => ({ ...f, title: '', body: '' }));
            feed.reload({ quiet: true });
        } catch (err) { toast(err.message, 'error'); }
        setBusy(false);
    };

    const remove = async (a) => {
        if (!(await confirm({ title: 'Delete announcement?', message: `"${a.title}" will be removed for everyone.`, confirmText: 'Delete', danger: true }))) return;
        try { await del(`/announcements/${a.id}`); feed.reload({ quiet: true }); toast('Deleted'); } catch (e) { toast(e.message, 'error'); }
    };

    if (feed.loading) return <PageLoader />;
    if (feed.error) return <ErrorState error={feed.error} onRetry={feed.reload} />;

    return (
        <div className="col gap-24" style={{ maxWidth: 820 }}>
            <PageHeader title="Announcements" subtitle={user.role === 'student' ? 'Updates from your teachers and the AdaptPrep team.' : 'Keep your students informed.'} />
            {canPost && (user.role === 'admin' || ownClasses.length > 0) && (
                <Card title="New announcement">
                    <form className="col gap-16" onSubmit={submit}>
                        <Field label="Audience">
                            <select className="select" value={target} onChange={(e) => setForm({ ...form, classId: e.target.value })}>
                                {user.role === 'admin' && <option value="">Everyone on the platform</option>}
                                {ownClasses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </Field>
                        <Field label="Title"><input className="input" value={form.title} maxLength={120} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
                        <Field label="Message"><textarea className="textarea" value={form.body} maxLength={2000} onChange={(e) => setForm({ ...form, body: e.target.value })} /></Field>
                        <div className="row end"><button className="btn btn-primary" disabled={busy || form.title.trim().length < 3 || form.body.trim().length < 3}><Megaphone size={16} /> {busy ? 'Posting…' : 'Post announcement'}</button></div>
                    </form>
                </Card>
            )}
            {canPost && user.role === 'teacher' && !ownClasses.length && !classes.loading && (
                <Card><Empty icon={Users} title="Create a class to post announcements" /></Card>
            )}
            {feed.data.announcements.length ? feed.data.announcements.map((a) => (
                <Card key={a.id} className="anim-in">
                    <div className="row between mb-16">
                        <Person user={a.author} sub={`${relative(a.createdAt)} · ${dateTime(a.createdAt)}`} />
                        <div className="row gap-8">
                            {a.scope === 'global' ? <Badge tone="brand"><Globe size={12} /> Everyone</Badge> : <Badge><Users size={12} /> {a.className}</Badge>}
                            {(user.role === 'admin' || a.authorId === user.id) && <button className="btn btn-ghost btn-icon" onClick={() => remove(a)} aria-label="Delete announcement"><Trash2 size={16} /></button>}
                        </div>
                    </div>
                    <h3>{a.title}</h3>
                    <p className="muted mt-8" style={{ whiteSpace: 'pre-wrap' }}>{a.body}</p>
                </Card>
            )) : <Card><Empty icon={Megaphone} title="No announcements yet" /></Card>}
        </div>
    );
}
