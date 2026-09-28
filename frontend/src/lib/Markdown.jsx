// Minimal, safe Markdown renderer for AI responses. It builds React elements
// (never innerHTML), so model or user text can't inject markup.
import { Fragment } from 'react';

const inline = (text, keyBase) => {
    const out = [];
    const re = /(\*\*[^*]+\*\*|`[^`]+`|_[^_]+_|\*[^*\s][^*]*\*)/g;
    let last = 0;
    let m;
    let i = 0;
    while ((m = re.exec(text))) {
        if (m.index > last) out.push(text.slice(last, m.index));
        const tok = m[0];
        const k = `${keyBase}-${i += 1}`;
        if (tok.startsWith('**')) out.push(<strong key={k}>{tok.slice(2, -2)}</strong>);
        else if (tok.startsWith('`')) out.push(<code key={k}>{tok.slice(1, -1)}</code>);
        else out.push(<em key={k}>{tok.slice(1, -1)}</em>);
        last = m.index + tok.length;
    }
    if (last < text.length) out.push(text.slice(last));
    return out;
};

export default function Markdown({ text }) {
    const lines = (text || '').split('\n');
    const blocks = [];
    let list = null;
    let para = [];

    const flushPara = () => {
        if (para.length) blocks.push({ type: 'p', lines: para });
        para = [];
    };
    const flushList = () => {
        if (list) blocks.push(list);
        list = null;
    };

    lines.forEach((raw) => {
        const line = raw.trimEnd();
        const ul = line.match(/^\s*[-•*]\s+(.*)$/);
        const ol = line.match(/^\s*(\d+)[.)]\s+(.*)$/);
        if (!line.trim()) { flushPara(); flushList(); return; }
        if (/^#{1,4}\s/.test(line)) { flushPara(); flushList(); blocks.push({ type: 'h', text: line.replace(/^#+\s/, '') }); return; }
        if (line.startsWith('> ')) { flushPara(); flushList(); blocks.push({ type: 'quote', text: line.slice(2) }); return; }
        if (ul) {
            flushPara();
            if (!list || list.type !== 'ul') { flushList(); list = { type: 'ul', items: [] }; }
            list.items.push(ul[1]);
            return;
        }
        if (ol) {
            flushPara();
            if (!list || list.type !== 'ol') { flushList(); list = { type: 'ol', items: [] }; }
            list.items.push(ol[2]);
            return;
        }
        flushList();
        para.push(line);
    });
    flushPara();
    flushList();

    return (
        <div className="md">
            {blocks.map((b, i) => {
                if (b.type === 'h') return <h4 key={i}>{inline(b.text, i)}</h4>;
                if (b.type === 'quote') return <blockquote key={i}>{inline(b.text, i)}</blockquote>;
                if (b.type === 'ul') return <ul key={i}>{b.items.map((it, j) => <li key={j}>{inline(it, `${i}-${j}`)}</li>)}</ul>;
                if (b.type === 'ol') return <ol key={i}>{b.items.map((it, j) => <li key={j}>{inline(it, `${i}-${j}`)}</li>)}</ol>;
                return <p key={i}>{b.lines.map((l, j) => <Fragment key={j}>{j > 0 && <br />}{inline(l, `${i}-${j}`)}</Fragment>)}</p>;
            })}
        </div>
    );
}
