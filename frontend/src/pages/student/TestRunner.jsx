import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, BookOpenCheck, Bookmark, ChevronLeft, ChevronRight, Clock, CloudOff, Eraser, Check, Keyboard, Send } from 'lucide-react';
import { get, patch, post } from '../../api/client';
import { useUi } from '../../context/UiContext';
import { useDocumentTitle } from '../../lib/useApi';
import { Badge, ErrorState, Modal, PageLoader, Subject } from '../../components/ui';
import { clock, letter } from '../../lib/format';

export default function TestRunner() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { toast } = useUi();
    const [attempt, setAttempt] = useState(null);
    const [error, setError] = useState(null);
    const [idx, setIdx] = useState(0);
    const [answers, setAnswers] = useState({});
    const [marked, setMarked] = useState([]);
    const [remaining, setRemaining] = useState(null);
    const [saveState, setSaveState] = useState('saved');
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [showKeys, setShowKeys] = useState(false);
    useDocumentTitle(attempt?.title || 'Test');

    const offset = useRef(0); // serverNow - clientNow
    const timeSpent = useRef({});
    const viewStart = useRef(Date.now());
    const dirty = useRef(false);
    const saveTimer = useRef(null);
    const finished = useRef(false);
    const stateRef = useRef({ answers: {}, marked: [] });
    stateRef.current = { answers, marked };

    // Load (or resume) the attempt.
    useEffect(() => {
        get(`/tests/attempts/${id}`).then(({ attempt: a }) => {
            if (a.status !== 'in_progress') { navigate(`/app/results/${a.id}`, { replace: true }); return; }
            offset.current = new Date(a.serverNow).getTime() - Date.now();
            timeSpent.current = { ...a.timeSpent };
            setAnswers(a.answers || {});
            setMarked(a.marked || []);
            // Resume on the first unanswered question.
            const firstOpen = a.questions.findIndex((q) => a.answers?.[q.id] === undefined);
            setIdx(firstOpen === -1 ? 0 : firstOpen);
            setAttempt(a);
        }).catch(setError);
    }, [id, navigate]);

    const recordTime = useCallback(() => {
        if (!attempt) return;
        const q = attempt.questions[idx];
        if (!q) return;
        const secs = (Date.now() - viewStart.current) / 1000;
        viewStart.current = Date.now();
        timeSpent.current[q.id] = (timeSpent.current[q.id] || 0) + secs;
        dirty.current = true;
    }, [attempt, idx]);

    const finish = useCallback(async (reason) => {
        if (finished.current) return;
        finished.current = true;
        recordTime();
        setSubmitting(true);
        try {
            await post(`/tests/attempts/${id}/submit`, { ...stateRef.current, timeSpent: timeSpent.current });
        } catch (e) {
            if (e.status !== 409) {
                finished.current = false;
                setSubmitting(false);
                toast(`${e.message} Your answers are saved — try submitting again.`, 'error');
                return;
            }
        }
        if (reason === 'timeout') toast("Time's up! Your test was submitted automatically.", 'info');
        navigate(`/app/results/${id}`, { replace: true });
    }, [id, navigate, recordTime, toast]);

    const save = useCallback(async () => {
        if (!attempt || finished.current || !dirty.current) return;
        dirty.current = false;
        setSaveState('saving');
        try {
            await patch(`/tests/attempts/${id}`, { ...stateRef.current, timeSpent: timeSpent.current });
            setSaveState('saved');
        } catch (e) {
            if (e.status === 409) { finished.current = true; toast('Time is up — this test was submitted.', 'info'); navigate(`/app/results/${id}`, { replace: true }); return; }
            dirty.current = true;
            setSaveState('error');
        }
    }, [attempt, id, navigate, toast]);

    const queueSave = useCallback(() => {
        dirty.current = true;
        clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(save, 600);
    }, [save]);

    // Periodic save (also retries after a failed save) and time tracking.
    useEffect(() => {
        if (!attempt) return undefined;
        const t = setInterval(() => { recordTime(); save(); }, 15000);
        return () => clearInterval(t);
    }, [attempt, recordTime, save]);

    // Countdown against the server's deadline.
    useEffect(() => {
        if (!attempt) return undefined;
        const deadline = new Date(attempt.deadline).getTime();
        const tick = () => {
            const left = Math.max(0, (deadline - (Date.now() + offset.current)) / 1000);
            setRemaining(left);
            if (left <= 0) finish('timeout');
        };
        tick();
        const t = setInterval(tick, 500);
        return () => clearInterval(t);
    }, [attempt, finish]);

    // Warn before leaving mid-test.
    useEffect(() => {
        const h = (e) => { if (!finished.current) { e.preventDefault(); e.returnValue = ''; } };
        window.addEventListener('beforeunload', h);
        return () => window.removeEventListener('beforeunload', h);
    }, []);

    const go = useCallback((n) => {
        if (!attempt) return;
        const next = Math.max(0, Math.min(attempt.questions.length - 1, n));
        if (next === idx) return;
        recordTime();
        setIdx(next);
        queueSave();
    }, [attempt, idx, recordTime, queueSave]);

    const choose = useCallback((opt) => {
        const q = attempt?.questions[idx];
        if (!q) return;
        setAnswers((a) => ({ ...a, [q.id]: opt }));
        queueSave();
    }, [attempt, idx, queueSave]);

    const clearAnswer = useCallback(() => {
        const q = attempt?.questions[idx];
        if (!q) return;
        setAnswers((a) => ({ ...a, [q.id]: null }));
        queueSave();
    }, [attempt, idx, queueSave]);

    const toggleMark = useCallback(() => {
        const q = attempt?.questions[idx];
        if (!q) return;
        setMarked((m) => (m.includes(q.id) ? m.filter((x) => x !== q.id) : [...m, q.id]));
        queueSave();
    }, [attempt, idx, queueSave]);

    // Keyboard shortcuts.
    useEffect(() => {
        const onKey = (e) => {
            if (confirmOpen || e.target.closest('input, textarea, select') || e.metaKey || e.ctrlKey || e.altKey) return;
            const k = e.key.toLowerCase();
            if (['1', '2', '3', '4'].includes(k)) choose(Number(k) - 1);
            else if (['a', 'b', 'c', 'd'].includes(k)) choose(k.charCodeAt(0) - 97);
            else if (k === 'arrowright' || k === 'n') go(idx + 1);
            else if (k === 'arrowleft' || k === 'p') go(idx - 1);
            else if (k === 'm') toggleMark();
            else if (k === 'x') clearAnswer();
            else return;
            e.preventDefault();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [choose, go, idx, toggleMark, clearAnswer, confirmOpen]);

    if (error) return <div style={{ padding: 24 }}><ErrorState error={error} onRetry={() => window.location.reload()} /></div>;
    if (!attempt) return <PageLoader />;

    const q = attempt.questions[idx];
    const total = attempt.questions.length;
    const answeredCount = attempt.questions.filter((x) => answers[x.id] !== undefined && answers[x.id] !== null).length;
    const selected = answers[q.id];
    const isMarked = marked.includes(q.id);
    const low = remaining !== null && remaining < 60;

    return (
        <div className="runner">
            <header className="runner-bar">
                <span className="brand-mark hide-sm"><BookOpenCheck size={18} /></span>
                <div className="grow" style={{ minWidth: 0 }}>
                    <div className="bold truncate">{attempt.title}</div>
                    <div className="xs subtle row gap-8">
                        <span>{answeredCount}/{total} answered</span>
                        <span className="row gap-4" aria-live="polite">
                            {saveState === 'saving' && 'Saving…'}
                            {saveState === 'saved' && <><Check size={12} /> Saved</>}
                            {saveState === 'error' && <span style={{ color: 'var(--bad-ink)' }} className="row gap-4"><CloudOff size={12} /> Offline — will retry</span>}
                        </span>
                    </div>
                </div>
                <span className={`timer ${low ? 'low' : ''}`} role="timer" aria-label="Time remaining"><Clock size={16} />{remaining === null ? '--:--' : clock(remaining)}</span>
                <button className="btn btn-primary" onClick={() => { recordTime(); setConfirmOpen(true); }} disabled={submitting}><Send size={16} /><span className="hide-sm">Submit</span></button>
            </header>

            <div className="runner-body">
                <div className="col gap-16">
                    <div className="card q-card anim-in" key={q.id}>
                        <div className="q-meta">
                            <Badge tone="brand">Question {idx + 1} of {total}</Badge>
                            <Subject subject={q.subject} />
                            <span className="subtle small">· {q.topic}</span>
                            <Badge className="hide-sm">{q.difficulty}</Badge>
                            <div className="grow" />
                            <button className={`btn btn-sm ${isMarked ? 'btn-soft' : 'btn-ghost'}`} onClick={toggleMark} aria-pressed={isMarked}>
                                <Bookmark size={15} fill={isMarked ? 'currentColor' : 'none'} /> {isMarked ? 'Marked' : 'Mark for review'}
                            </button>
                        </div>
                        <div className="q-text">{q.question}</div>
                        <div className="options" role="radiogroup" aria-label="Answer options">
                            {q.options.map((opt, i) => (
                                <button key={i} role="radio" aria-checked={selected === i} className={`option ${selected === i ? 'selected' : ''}`} onClick={() => choose(i)}>
                                    <span className="key">{letter(i)}</span>
                                    <span>{opt}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="row between wrap">
                        <button className="btn btn-secondary" onClick={() => go(idx - 1)} disabled={idx === 0}><ChevronLeft size={16} /> Previous</button>
                        <div className="row gap-8">
                            <button className="btn btn-ghost" onClick={clearAnswer} disabled={selected === undefined || selected === null}><Eraser size={16} /><span className="hide-sm">Clear</span></button>
                            {idx < total - 1
                                ? <button className="btn btn-primary" onClick={() => go(idx + 1)}>{selected === undefined || selected === null ? 'Skip' : 'Save & next'} <ChevronRight size={16} /></button>
                                : <button className="btn btn-primary" onClick={() => { recordTime(); setConfirmOpen(true); }}>Review & submit <Send size={16} /></button>}
                        </div>
                    </div>
                </div>

                <aside className="col gap-16">
                    <div className="card">
                        <div className="card-head" style={{ marginBottom: 12 }}><h3>Question palette</h3></div>
                        <div className="palette">
                            {attempt.questions.map((x, i) => {
                                const done = answers[x.id] !== undefined && answers[x.id] !== null;
                                return (
                                    <button key={x.id} onClick={() => go(i)}
                                        className={`${done ? 'answered' : ''} ${marked.includes(x.id) ? 'marked' : ''} ${i === idx ? 'current' : ''}`}
                                        aria-label={`Question ${i + 1}${done ? ', answered' : ''}${marked.includes(x.id) ? ', marked for review' : ''}`}>
                                        {i + 1}
                                    </button>
                                );
                            })}
                        </div>
                        <div className="legend mt-16 xs">
                            <span><span className="dot" style={{ background: 'var(--brand)' }} /> Answered</span>
                            <span><span className="dot" style={{ border: '1.5px solid var(--line-strong)' }} /> Not answered</span>
                            <span><span className="dot" style={{ background: 'var(--warn)' }} /> Marked</span>
                        </div>
                    </div>
                    <div className="card small">
                        <div className="row between mb-8"><span className="muted">Marking</span><b>+4 / −1 / 0</b></div>
                        <div className="row between mb-8"><span className="muted">Answered</span><b className="nums">{answeredCount}</b></div>
                        <div className="row between"><span className="muted">Marked for review</span><b className="nums">{marked.length}</b></div>
                        <button className="btn btn-ghost btn-sm btn-block mt-16" onClick={() => setShowKeys((s) => !s)}><Keyboard size={14} /> Keyboard shortcuts</button>
                        {showKeys && (
                            <div className="col gap-8 mt-8 xs muted">
                                <span><span className="kbd">1–4</span> / <span className="kbd">A–D</span> choose an option</span>
                                <span><span className="kbd">←</span> <span className="kbd">→</span> previous / next</span>
                                <span><span className="kbd">M</span> mark for review · <span className="kbd">X</span> clear</span>
                            </div>
                        )}
                    </div>
                </aside>
            </div>

            {confirmOpen && (
                <Modal title="Submit test?" onClose={() => setConfirmOpen(false)}
                    footer={<><button className="btn btn-secondary" onClick={() => setConfirmOpen(false)}>Keep working</button><button className="btn btn-primary" disabled={submitting} onClick={() => finish('manual')}>{submitting ? 'Submitting…' : 'Submit now'}</button></>}>
                    <div className="col gap-16">
                        <div className="grid grid-3" style={{ gap: 8 }}>
                            <div className="card center" style={{ padding: 12 }}><div className="stat-value nums">{answeredCount}</div><div className="xs subtle">Answered</div></div>
                            <div className="card center" style={{ padding: 12 }}><div className="stat-value nums">{total - answeredCount}</div><div className="xs subtle">Unanswered</div></div>
                            <div className="card center" style={{ padding: 12 }}><div className="stat-value nums">{marked.length}</div><div className="xs subtle">Marked</div></div>
                        </div>
                        {total - answeredCount > 0 && (
                            <div className="callout warn"><AlertTriangle size={18} /><div>Unanswered questions score 0. You still have <b>{clock(remaining || 0)}</b> left.</div></div>
                        )}
                        <p className="small muted">You can't change answers after submitting.</p>
                    </div>
                </Modal>
            )}
        </div>
    );
}
