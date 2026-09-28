import { useState } from 'react';
import { History, MessageSquare, Plus, Sparkles, Trash2 } from 'lucide-react';
import { del } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useUi } from '../../context/UiContext';
import { useApi, useDocumentTitle } from '../../lib/useApi';
import ChatPanel from '../../components/ChatPanel';
import { relative } from '../../lib/format';

export default function Tutor() {
    const { user } = useAuth();
    useDocumentTitle(user.role === 'student' ? 'AI Tutor' : 'AI Assistant');
    const { toast, confirm } = useUi();
    const sessions = useApi('/ai/chats');
    const status = useApi('/ai/status');
    const [active, setActive] = useState(null);
    const [showList, setShowList] = useState(false);

    const remove = async (s, e) => {
        e.stopPropagation();
        if (!(await confirm({ title: 'Delete conversation?', message: `"${s.title}" will be permanently deleted.`, confirmText: 'Delete', danger: true }))) return;
        try {
            await del(`/ai/chats/${s.id}`);
            if (active === s.id) setActive(null);
            sessions.reload({ quiet: true });
        } catch (err) { toast(err.message, 'error'); }
    };

    const list = sessions.data?.sessions || [];

    return (
        <div>
            <div className="row between wrap mb-16">
                <div>
                    <h1 style={{ fontSize: 24 }}>{user.role === 'student' ? 'AI Tutor' : 'AI Assistant'}</h1>
                    <p className="muted small mt-8" style={{ marginTop: 2 }}>
                        <Sparkles size={13} style={{ verticalAlign: -2 }} /> Powered by {status.data?.label || 'AdaptPrep Local AI'}
                    </p>
                </div>
                <div className="row gap-8">
                    <button className="btn btn-secondary hide-up-md" onClick={() => setShowList((s) => !s)}><History size={16} /> Chats</button>
                    <button className="btn btn-primary" onClick={() => { setActive(null); setShowList(false); }}><Plus size={16} /> New chat</button>
                </div>
            </div>
            <div className="card card-flush" style={{ position: 'relative' }}>
                <div className="tutor">
                    <aside className={`tutor-side ${showList ? 'show' : ''}`}>
                        <div className="label" style={{ padding: '14px 16px 6px' }}>Conversations</div>
                        <div className="list-scroll">
                            {list.length === 0 && <p className="small subtle" style={{ padding: 10 }}>No conversations yet.</p>}
                            {list.map((s) => (
                                <div key={s.id} role="button" tabIndex={0} className={`session-item ${active === s.id ? 'active' : ''}`}
                                    onClick={() => { setActive(s.id); setShowList(false); }} onKeyDown={(e) => { if (e.key === 'Enter') { setActive(s.id); setShowList(false); } }}>
                                    <MessageSquare size={16} style={{ flexShrink: 0 }} />
                                    <div className="grow" style={{ minWidth: 0 }}>
                                        <div className="small bold truncate">{s.title}</div>
                                        <div className="xs subtle">{relative(s.updatedAt)}</div>
                                    </div>
                                    <button className="btn btn-ghost btn-icon" style={{ width: 28, height: 28 }} onClick={(e) => remove(s, e)} aria-label={`Delete ${s.title}`}><Trash2 size={14} /></button>
                                </div>
                            ))}
                        </div>
                    </aside>
                    <div style={{ minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                        <ChatPanel
                            key={active || 'new'}
                            sessionId={active}
                            onSessionCreated={(id) => { setActive(id); sessions.reload({ quiet: true }); }}
                            onActivity={() => sessions.reload({ quiet: true })}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
