// Small TF-IDF retriever over concept notes and question-bank explanations.
// Lets the local tutor ground answers in real course material.

const { KNOWLEDGE } = require('./knowledge');
const { activeQuestions } = require('../services/questions');

const STOP = new Set(('a an and are as at be by can do does for from how i in is it me my of on or so that the this to was what when where which who why will with you your explain tell about please give'
    + ' define meaning mean help understand concept').split(' '));

const tokenize = (text) => (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9²³⁻\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOP.has(t))
    .map((t) => (t.length > 4 && t.endsWith('s') ? t.slice(0, -1) : t));

class Index {
    constructor(docs) {
        this.docs = docs;
        this.df = new Map();
        this.vectors = docs.map((d) => {
            const tf = new Map();
            tokenize(d.text).forEach((t) => tf.set(t, (tf.get(t) || 0) + 1));
            // Keywords/titles count extra so curated notes rank well.
            tokenize(d.boost || '').forEach((t) => tf.set(t, (tf.get(t) || 0) + 3));
            tf.forEach((_, t) => this.df.set(t, (this.df.get(t) || 0) + 1));
            return tf;
        });
        const n = docs.length;
        this.idf = (t) => Math.log(1 + n / (1 + (this.df.get(t) || 0)));
        this.norms = this.vectors.map((tf) => {
            let s = 0;
            tf.forEach((c, t) => { s += (c * this.idf(t)) ** 2; });
            return Math.sqrt(s) || 1;
        });
    }

    search(query, { limit = 5, filter } = {}) {
        const q = new Map();
        tokenize(query).forEach((t) => q.set(t, (q.get(t) || 0) + 1));
        if (!q.size) return [];
        let qn = 0;
        q.forEach((c, t) => { qn += (c * this.idf(t)) ** 2; });
        qn = Math.sqrt(qn) || 1;

        const scored = [];
        this.vectors.forEach((tf, i) => {
            if (filter && !filter(this.docs[i])) return;
            let dot = 0;
            q.forEach((c, t) => {
                const d = tf.get(t);
                if (d) dot += c * d * this.idf(t) ** 2;
            });
            if (dot > 0) scored.push({ doc: this.docs[i], score: dot / (qn * this.norms[i]) });
        });
        return scored.sort((a, b) => b.score - a.score).slice(0, limit);
    }
}

let conceptIndex = null;
let questionIndex = null;
let questionCount = -1;

const concepts = () => {
    if (!conceptIndex) {
        conceptIndex = new Index(KNOWLEDGE.map((k) => ({
            type: 'concept',
            ref: k,
            subject: k.subject,
            text: `${k.summary} ${k.formulas.join(' ')} ${k.tips.join(' ')}`,
            boost: `${k.title} ${k.topic} ${k.keywords.join(' ')}`
        })));
    }
    return conceptIndex;
};

const questions = () => {
    const all = activeQuestions();
    if (!questionIndex || all.length !== questionCount) {
        questionCount = all.length;
        questionIndex = new Index(all.map((q) => ({
            type: 'question',
            ref: q,
            subject: q.subject,
            examType: q.examType,
            text: `${q.question} ${q.theory || ''} ${q.explanation || ''}`,
            boost: q.topic
        })));
    }
    return questionIndex;
};

const searchConcepts = (query, opts) => concepts().search(query, opts);
const searchQuestions = (query, opts) => questions().search(query, opts);

module.exports = { searchConcepts, searchQuestions, tokenize };
