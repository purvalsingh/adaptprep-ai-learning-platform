import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { post, put } from '../api/client';
import { useUi } from '../context/UiContext';
import { Field, Modal, Segmented } from './ui';
import { EXAM_LABEL, letter, subjectLabel } from '../lib/format';

const EXAM_SUBJECTS = { jee: ['physics', 'chemistry', 'mathematics'], neet: ['physics', 'chemistry', 'biology'] };
const blank = { examType: 'jee', subject: 'physics', topic: '', difficulty: 'medium', question: '', options: ['', '', '', ''], correct: 0, explanation: '', theory: '' };

// Create or edit a question. `readOnly` shows it without editing (bank questions for teachers).
export default function QuestionEditor({ question, onClose, onSaved, readOnly }) {
    const { toast } = useUi();
    const [q, setQ] = useState(() => (question ? { ...blank, ...question, theory: question.theory || '' } : blank));
    const [err, setErr] = useState('');
    const [busy, setBusy] = useState(false);
    const set = (k) => (v) => setQ((x) => ({ ...x, [k]: v?.target ? v.target.value : v }));

    const setExam = (examType) => setQ((x) => ({ ...x, examType, subject: EXAM_SUBJECTS[examType].includes(x.subject) ? x.subject : EXAM_SUBJECTS[examType][0] }));

    const save = async () => {
        setErr('');
        if (q.question.trim().length < 5) return setErr('Write the question (at least 5 characters).');
        if (q.options.some((o) => !o.trim())) return setErr('Fill in all four options.');
        if (new Set(q.options.map((o) => o.trim().toLowerCase())).size < 4) return setErr('Options must all be different.');
        if (q.topic.trim().length < 2) return setErr('Add a topic.');
        if (q.explanation.trim().length < 5) return setErr('Add an explanation so students can learn from mistakes.');
        setBusy(true);
        const payload = {
            examType: q.examType, subject: q.subject, topic: q.topic.trim(), difficulty: q.difficulty, question: q.question.trim(),
            options: q.options.map((o) => o.trim()), correct: q.correct, explanation: q.explanation.trim(), theory: q.theory.trim()
        };
        try {
            const d = question?.id ? await put(`/questions/${question.id}`, payload) : await post('/questions', payload);
            toast(question?.id ? 'Question updated' : 'Question added to the bank');
            onSaved(d.question);
        } catch (e) { setErr(e.message); setBusy(false); }
    };

    return (
        <Modal size="lg" title={readOnly ? 'Question' : question?.id ? 'Edit question' : 'New question'}
            subtitle={readOnly ? 'Questions from the core bank can only be edited by admins.' : 'Students see the explanation after submitting.'}
            onClose={onClose}
            footer={readOnly ? <button className="btn btn-secondary" onClick={onClose}>Close</button> : <><button className="btn btn-secondary" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save question'}</button></>}>
            <fieldset disabled={readOnly} style={{ border: 0, padding: 0, margin: 0 }} className="col gap-16">
                {err && <div className="form-error">{err}</div>}
                <div className="form-grid">
                    <Field label="Exam"><Segmented value={q.examType} onChange={readOnly ? () => {} : setExam} options={[{ value: 'jee', label: EXAM_LABEL.jee }, { value: 'neet', label: EXAM_LABEL.neet }]} /></Field>
                    <Field label="Subject"><Segmented value={q.subject} onChange={readOnly ? () => {} : set('subject')} options={EXAM_SUBJECTS[q.examType].map((s) => ({ value: s, label: subjectLabel(s) }))} /></Field>
                    <Field label="Topic"><input className="input" value={q.topic} maxLength={80} onChange={set('topic')} placeholder="e.g. Projectile Motion" /></Field>
                    <Field label="Difficulty"><Segmented value={q.difficulty} onChange={readOnly ? () => {} : set('difficulty')} options={['easy', 'medium', 'hard'].map((d) => ({ value: d, label: d[0].toUpperCase() + d.slice(1) }))} /></Field>
                </div>
                <Field label="Question"><textarea className="textarea" value={q.question} maxLength={2000} onChange={set('question')} /></Field>
                <div className="col gap-8">
                    <span className="label">Options <span className="subtle">(select the correct one)</span></span>
                    {q.options.map((o, i) => (
                        <div key={i} className="row gap-8">
                            <button type="button" className={`btn btn-icon ${q.correct === i ? 'btn-primary' : 'btn-secondary'}`} onClick={() => set('correct')(i)} aria-label={`Mark option ${letter(i)} correct`} aria-pressed={q.correct === i}>
                                {q.correct === i ? <CheckCircle2 size={16} /> : letter(i)}
                            </button>
                            <input className="input" value={o} maxLength={500} placeholder={`Option ${letter(i)}`} onChange={(e) => setQ((x) => ({ ...x, options: x.options.map((y, j) => (j === i ? e.target.value : y)) }))} />
                        </div>
                    ))}
                </div>
                <Field label="Explanation"><textarea className="textarea" value={q.explanation} maxLength={3000} onChange={set('explanation')} placeholder="Step-by-step solution" /></Field>
                <Field label="Concept notes (optional)"><textarea className="textarea" value={q.theory} maxLength={4000} onChange={set('theory')} placeholder="The underlying theory students should revise" /></Field>
            </fieldset>
        </Modal>
    );
}
