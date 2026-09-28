import { useEffect, useRef, useState } from 'react';
import { ArrowUp, Sparkles } from 'lucide-react';
import { get, post } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useUi } from '../context/UiContext';
import Markdown from '../lib/Markdown';
import { firstName } from '../lib/format';
import { Spinner } from './ui';

const STARTERS = {
    student: ['How am I doing?', 'Make me a study plan', 'Quiz me', 'Explain projectile motion', 'Review my mistakes', 'Tips for negative marking'],
    teacher: ['How are my classes doing?', 'Which students are at risk?', 'Generate questions on Electricity', 'Explain Hardy–Weinberg'],
    admin: ['Platform stats', 'Generate questions on Probability', "Explain Newton's laws"]
};

/**
 * Conversation view. If `sessionId` is null a conversation is created on the
 * first message and reported through `onSessionCreated`.
 */
export default function ChatPanel({ sessionId, onSessionCreated, onActivity }) {
    const { user } = useAuth();
    const { toast } = useUi();
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [input, setInput] = useState('');
    const scrollRef = useRef(null);
    const inputRef = useRef(null);
    const activeId = useRef(sessionId);

    useEffect(() => {
        activeId.current = sessionId;
        if (!sessionId) { setMessages([]); return; }
        let cancelled = false;
        setLoading(true);
        get(`/ai/chats/${sessionId}`)
            .then((d) => { if (!cancelled) setMessages(d.session.messages); })
            .catch((e) => { if (!cancelled) toast(e.message, 'error'); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [sessionId, toast]);

    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }, [messages, sending]);

    const send = async (text) => {
        const message = (text ?? input).trim();
        if (!message || sending) return;
        setInput('');
        setSending(true);
        setMessages((m) => [...m, { role: 'user', content: message, at: new Date().toISOString() }]);
        try {
            let id = activeId.current;
            if (!id) {
                const created = await post('/ai/chats');
                id = created.session.id;
                activeId.current = id;
                onSessionCreated?.(id);
            }
            const d = await post(`/ai/chats/${id}/messages`, { message });
            setMessages((m) => [...m, d.message]);
            onActivity?.(d.session);
        } catch (e) {
            setMessages((m) => m.slice(0, -1));
            setInput(message);
            toast(e.message, 'error');
        } finally {
            setSending(false);
            inputRef.current?.focus();
        }
    };

    const onKey = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            send();
        }
    };

    const last = messages[messages.length - 1];
    const suggestions = last?.role === 'assistant' ? last.suggestions || [] : [];

    return (
        <div className="chat">
            <div className="chat-scroll" ref={scrollRef}>
                {loading && <div className="page-loader" style={{ minHeight: 120 }}><Spinner /></div>}
                {!loading && !messages.length && (
                    <div className="col gap-16" style={{ margin: 'auto 0', alignItems: 'center', textAlign: 'center' }}>
                        <div className="empty-icon"><Sparkles size={24} /></div>
                        <div>
                            <h3>Hi {firstName(user?.name)}, I'm AdaptPrep AI</h3>
                            <p className="muted small mt-8" style={{ maxWidth: 360 }}>
                                {user?.role === 'student'
                                    ? 'I know your test history, so I can explain concepts, spot weak topics, quiz you and plan your week.'
                                    : 'I can summarise your classes, flag at-risk students, and draft practice questions for you.'}
                            </p>
                        </div>
                        <div className="suggestions" style={{ justifyContent: 'center' }}>
                            {(STARTERS[user?.role] || STARTERS.student).map((s) => (
                                <button key={s} className="chip" onClick={() => send(s)}>{s}</button>
                            ))}
                        </div>
                    </div>
                )}
                {messages.map((m, i) => (
                    <div key={i} className={`msg ${m.role} anim-in`}>
                        {m.role === 'assistant' && <div className="msg-avatar"><Sparkles size={16} /></div>}
                        <div style={{ minWidth: 0 }}>
                            <div className="msg-bubble">{m.role === 'assistant' ? <Markdown text={m.content} /> : m.content}</div>
                            {m.role === 'assistant' && m.provider && (
                                <div className="msg-meta">{m.provider === 'local' ? 'AdaptPrep Local AI' : 'Gemini'}</div>
                            )}
                        </div>
                    </div>
                ))}
                {sending && (
                    <div className="msg assistant">
                        <div className="msg-avatar"><Sparkles size={16} /></div>
                        <div className="msg-bubble"><span className="typing"><span /><span /><span /></span></div>
                    </div>
                )}
                {!sending && suggestions.length > 0 && (
                    <div className="suggestions" style={{ paddingLeft: 40 }}>
                        {suggestions.map((s) => <button key={s} className="chip" onClick={() => send(s)}>{s}</button>)}
                    </div>
                )}
            </div>
            <form className="chat-input" onSubmit={(e) => { e.preventDefault(); send(); }}>
                <textarea
                    ref={inputRef} className="textarea" rows={1} value={input} maxLength={2000}
                    onChange={(e) => setInput(e.target.value)} onKeyDown={onKey}
                    placeholder={user?.role === 'student' ? 'Ask about a concept, your progress, or say "quiz me"…' : 'Ask about your classes or generate questions…'}
                    aria-label="Message AdaptPrep AI"
                />
                <button className="btn btn-primary btn-icon" style={{ width: 44, height: 44 }} disabled={!input.trim() || sending} aria-label="Send">
                    <ArrowUp size={18} />
                </button>
            </form>
        </div>
    );
}
