// Parametric question generator used by the local AI when teachers ask it to
// draft new practice questions. Every template computes the correct answer and
// derives distractors from common student mistakes, so the output is correct
// by construction (unlike free-form text generation).

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const rint = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const fmt = (x) => {
    if (Number.isInteger(x)) return String(x);
    return String(Math.round(x * 100) / 100);
};
const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
const frac = (n, d) => {
    const g = gcd(n, d);
    return d / g === 1 ? String(n / g) : `${n / g}/${d / g}`;
};
const fact = (n) => (n <= 1 ? 1 : n * fact(n - 1));
const nCr = (n, r) => fact(n) / (fact(r) * fact(n - r));

const TEMPLATES = [
    // ---------- Physics ----------
    {
        id: 'ke', subject: 'physics', topic: 'Work and Energy', difficulty: 'easy', exams: ['jee', 'neet'],
        build() {
            const m = rint(1, 10); const v = pick([2, 4, 5, 6, 8, 10, 12, 15, 20]);
            const ke = 0.5 * m * v * v;
            return {
                question: `A body of mass ${m} kg moves with a speed of ${v} m/s. What is its kinetic energy?`,
                answer: `${fmt(ke)} J`,
                distractors: [`${fmt(m * v * v)} J`, `${fmt(0.5 * m * v)} J`, `${fmt(m * v * v / 4)} J`],
                explanation: `KE = ½mv² = ½ × ${m} × ${v}² = ${fmt(ke)} J.`,
                theory: 'Kinetic energy depends on the square of speed: KE = ½mv². Doubling the speed quadruples the kinetic energy.'
            };
        }
    },
    {
        id: 'impulse', subject: 'physics', topic: 'Mechanics', difficulty: 'easy', exams: ['jee', 'neet'],
        build() {
            const m = pick([2, 4, 5, 10]); const F = pick([10, 20, 40, 50]); const t = pick([2, 3, 4, 5]);
            const v = (F * t) / m;
            return {
                question: `A constant force of ${F} N acts on a ${m} kg body initially at rest for ${t} s. What is its final speed?`,
                answer: `${fmt(v)} m/s`,
                distractors: [`${fmt(F * t * m)} m/s`, `${fmt(F / (m * t))} m/s`, `${fmt((2 * F * t) / m)} m/s`],
                explanation: `Impulse = change in momentum: Ft = mv, so v = Ft/m = ${F} × ${t} / ${m} = ${fmt(v)} m/s.`,
                theory: 'The impulse–momentum theorem states FΔt = Δp. Starting from rest, the final momentum equals the impulse.'
            };
        }
    },
    {
        id: 'parallel-resistors', subject: 'physics', topic: 'Electricity', difficulty: 'medium', exams: ['jee', 'neet'],
        build() {
            const [r1, r2] = pick([[3, 6], [4, 12], [6, 12], [2, 3], [4, 4], [6, 3], [12, 12]]);
            const V = pick([6, 12, 24]);
            const req = (r1 * r2) / (r1 + r2);
            const I = V / req;
            return {
                question: `Two resistors of ${r1} Ω and ${r2} Ω are connected in parallel across a ${V} V battery of negligible internal resistance. What current is drawn from the battery?`,
                answer: `${fmt(I)} A`,
                distractors: [`${fmt(V / (r1 + r2))} A`, `${fmt(V / Math.max(r1, r2))} A`, `${fmt(I * 2)} A`],
                explanation: `R_eq = (${r1} × ${r2}) / (${r1} + ${r2}) = ${fmt(req)} Ω, so I = V/R_eq = ${V}/${fmt(req)} = ${fmt(I)} A.`,
                theory: 'For resistors in parallel, 1/R_eq = 1/R₁ + 1/R₂. The equivalent resistance is always smaller than the smallest individual resistor.'
            };
        }
    },
    {
        id: 'projectile-range', subject: 'physics', topic: 'Projectile Motion', difficulty: 'medium', exams: ['jee', 'neet'],
        build() {
            const u = pick([10, 20, 30, 40]); const theta = pick([15, 30, 45, 60, 75]);
            const sin2 = { 15: 0.5, 30: Math.sqrt(3) / 2, 45: 1, 60: Math.sqrt(3) / 2, 75: 0.5 }[theta];
            const R = (u * u * sin2) / 10;
            return {
                question: `A ball is projected at ${u} m/s at ${theta}° to the horizontal. What is its horizontal range? (g = 10 m/s²)`,
                answer: `${fmt(R)} m`,
                distractors: [`${fmt((u * u) / 10 === R ? R * 1.5 : (u * u) / 10)} m`, `${fmt(R / 2)} m`, `${fmt(R * 2)} m`],
                explanation: `R = u² sin2θ / g = ${u}² × sin${2 * theta}° / 10 = ${fmt(R)} m.`,
                theory: 'Range R = u² sin2θ/g is maximum at 45°. Complementary angles (θ and 90° − θ) give equal ranges.'
            };
        }
    },
    {
        id: 'free-fall', subject: 'physics', topic: 'Kinematics', difficulty: 'easy', exams: ['jee', 'neet'],
        build() {
            const t = rint(1, 6);
            const h = 0.5 * 10 * t * t;
            return {
                question: `A stone dropped from rest reaches the ground in ${t} s. From what height was it dropped? (g = 10 m/s², ignore air resistance)`,
                answer: `${fmt(h)} m`,
                distractors: [`${fmt(10 * t * t)} m`, `${fmt(10 * t)} m`, `${fmt(5 * t)} m`],
                explanation: `s = ut + ½gt² with u = 0: h = ½ × 10 × ${t}² = ${fmt(h)} m.`,
                theory: 'In free fall the only acceleration is g. With zero initial velocity, distance fallen grows with the square of time.'
            };
        }
    },
    {
        id: 'wave-speed', subject: 'physics', topic: 'Waves', difficulty: 'easy', exams: ['jee', 'neet'],
        build() {
            const f = pick([100, 200, 250, 400, 500]); const lambda = pick([0.5, 0.8, 1.2, 1.5, 2]);
            const v = f * lambda;
            return {
                question: `A wave has a frequency of ${f} Hz and a wavelength of ${lambda} m. What is its speed?`,
                answer: `${fmt(v)} m/s`,
                distractors: [`${fmt(f / lambda)} m/s`, `${fmt(2 * v)} m/s`, `${fmt(v / 2)} m/s`],
                explanation: `v = fλ = ${f} × ${lambda} = ${fmt(v)} m/s.`,
                theory: 'For any periodic wave, speed = frequency × wavelength. Frequency is set by the source; speed is set by the medium.'
            };
        }
    },
    {
        id: 'photon-energy', subject: 'physics', topic: 'Modern Physics', difficulty: 'medium', exams: ['jee', 'neet'],
        build() {
            const lambda = pick([310, 400, 496, 620]);
            const E = 1240 / lambda;
            return {
                question: `What is the energy of a photon of wavelength ${lambda} nm? (Use hc = 1240 eV·nm)`,
                answer: `${fmt(E)} eV`,
                distractors: [`${fmt(E * 2)} eV`, `${fmt(E / 2)} eV`, `${fmt(E + 1)} eV`],
                explanation: `E = hc/λ = 1240 / ${lambda} = ${fmt(E)} eV.`,
                theory: 'Photon energy is inversely proportional to wavelength: E = hf = hc/λ. Shorter wavelength means higher energy.'
            };
        }
    },
    {
        id: 'half-life', subject: 'physics', topic: 'Nuclear Physics', difficulty: 'medium', exams: ['jee', 'neet'],
        build() {
            const N0 = pick([800, 1600, 3200, 6400]); const th = pick([2, 5, 10]); const n = rint(2, 4);
            const N = N0 / 2 ** n;
            return {
                question: `A radioactive sample has a half-life of ${th} days. If it initially has ${N0} undecayed nuclei, how many remain after ${th * n} days?`,
                answer: `${fmt(N)}`,
                distractors: [`${fmt(N0 / (2 * n))}`, `${fmt(N * 2)}`, `${fmt(N / 2)}`],
                explanation: `${th * n} days = ${n} half-lives, so N = N₀/2ⁿ = ${N0}/2^${n} = ${fmt(N)}.`,
                theory: 'After each half-life, half of the remaining nuclei decay. After n half-lives, N = N₀/2ⁿ.'
            };
        }
    },

    // ---------- Chemistry ----------
    {
        id: 'molarity', subject: 'chemistry', topic: 'Stoichiometry', difficulty: 'easy', exams: ['jee', 'neet'],
        build() {
            const mass = pick([2, 4, 8, 10, 20]); const vol = pick([100, 250, 500, 1000]);
            const M = (mass / 40) / (vol / 1000);
            return {
                question: `${mass} g of NaOH (molar mass 40 g/mol) is dissolved in water to make ${vol} mL of solution. What is the molarity?`,
                answer: `${fmt(M)} M`,
                distractors: [`${fmt(mass / 40)} M`, `${fmt((mass / 40) / vol)} M`, `${fmt(M * 2)} M`],
                explanation: `Moles = ${mass}/40 = ${fmt(mass / 40)} mol; volume = ${vol / 1000} L; M = ${fmt(mass / 40)}/${vol / 1000} = ${fmt(M)} M.`,
                theory: 'Molarity is moles of solute per litre of solution. Always convert mL to L before dividing.'
            };
        }
    },
    {
        id: 'ph-strong-acid', subject: 'chemistry', topic: 'Acid-Base Chemistry', difficulty: 'easy', exams: ['jee', 'neet'],
        build() {
            const n = rint(1, 5);
            return {
                question: `What is the pH of a 10⁻${'⁰¹²³⁴⁵'[n]} M HCl solution at 25 °C?`,
                answer: `${n}`,
                distractors: [`${14 - n}`, `${n + 1}`, `${n === 1 ? 0.1 : n - 1}`],
                explanation: `HCl is a strong acid and ionises completely, so [H⁺] = 10⁻${'⁰¹²³⁴⁵'[n]} M and pH = −log[H⁺] = ${n}.`,
                theory: 'pH = −log[H⁺]. Strong acids dissociate completely, so [H⁺] equals the acid concentration (for concentrations well above 10⁻⁷ M).'
            };
        }
    },
    {
        id: 'gas-stp', subject: 'chemistry', topic: 'States of Matter', difficulty: 'easy', exams: ['jee', 'neet'],
        build() {
            const V = pick([5.6, 11.2, 33.6, 44.8, 67.2]);
            const n = V / 22.4;
            return {
                question: `How many moles of an ideal gas occupy ${V} L at STP? (Molar volume = 22.4 L)`,
                answer: `${fmt(n)} mol`,
                distractors: [`${fmt(n * 2)} mol`, `${fmt(V * 22.4 / 100)} mol`, `${fmt(n + 1)} mol`],
                explanation: `n = V / 22.4 = ${V} / 22.4 = ${fmt(n)} mol.`,
                theory: 'At STP one mole of any ideal gas occupies 22.4 L (older STP definition used in most Indian exam syllabi).'
            };
        }
    },
    {
        id: 'first-order', subject: 'chemistry', topic: 'Chemical Kinetics', difficulty: 'medium', exams: ['jee', 'neet'],
        build() {
            const [k, t] = pick([[0.0693, 10], [0.1386, 5], [0.231, 3], [0.3465, 2], [0.01386, 50]]);
            return {
                question: `A first-order reaction has a rate constant of ${k} min⁻¹. What is its half-life?`,
                answer: `${t} min`,
                distractors: [`${fmt(t * 2)} min`, `${fmt(1 / k)} min`, `${fmt(t / 2)} min`],
                explanation: `For a first-order reaction t½ = 0.693/k = 0.693/${k} = ${t} min.`,
                theory: 'First-order half-life is independent of initial concentration: t½ = 0.693/k.'
            };
        }
    },

    // ---------- Mathematics ----------
    {
        id: 'quadratic-roots', subject: 'mathematics', topic: 'Algebra', difficulty: 'easy', exams: ['jee'],
        build() {
            const a = pick([1, 2, 3]); const b = pick([-7, -5, -3, 2, 4, 6]); const c = pick([-6, -4, 3, 5, 8]);
            const askSum = Math.random() < 0.5;
            const eq = `${a === 1 ? '' : a}x² ${b < 0 ? '−' : '+'} ${Math.abs(b)}x ${c < 0 ? '−' : '+'} ${Math.abs(c)} = 0`;
            const ans = askSum ? frac(-b, a) : frac(c, a);
            const wrong = askSum ? [frac(b, a), frac(c, a), frac(-c, a)] : [frac(-c, a), frac(-b, a), frac(b, a)];
            return {
                question: `If α and β are the roots of ${eq}, what is ${askSum ? 'α + β' : 'αβ'}?`,
                answer: ans,
                distractors: wrong,
                explanation: askSum ? `For ax² + bx + c = 0, α + β = −b/a = ${frac(-b, a)}.` : `For ax² + bx + c = 0, αβ = c/a = ${frac(c, a)}.`,
                theory: 'Vieta\'s relations: for ax² + bx + c = 0, sum of roots = −b/a and product of roots = c/a.'
            };
        }
    },
    {
        id: 'derivative-point', subject: 'mathematics', topic: 'Calculus', difficulty: 'medium', exams: ['jee'],
        build() {
            const a = rint(1, 3); const b = rint(1, 5); const c = rint(1, 6); const p = rint(1, 3);
            const val = 3 * a * p * p + 2 * b * p + c;
            return {
                question: `If f(x) = ${a === 1 ? '' : a}x³ + ${b === 1 ? '' : b}x² + ${c === 1 ? '' : c}x, find f′(${p}).`,
                answer: `${val}`,
                distractors: [`${a * p ** 3 + b * p * p + c * p}`, `${3 * a * p * p + b * p + c}`, `${val + 2 * b}`],
                explanation: `f′(x) = ${3 * a}x² + ${2 * b}x + ${c}, so f′(${p}) = ${3 * a * p * p} + ${2 * b * p} + ${c} = ${val}.`,
                theory: 'Power rule: d/dx xⁿ = n·xⁿ⁻¹. Differentiate term by term, then substitute the point.'
            };
        }
    },
    {
        id: 'ap-term', subject: 'mathematics', topic: 'Series', difficulty: 'easy', exams: ['jee'],
        build() {
            const a = rint(2, 9); const d = rint(2, 7); const n = rint(10, 30);
            const val = a + (n - 1) * d;
            return {
                question: `The first term of an arithmetic progression is ${a} and the common difference is ${d}. What is the ${n}th term?`,
                answer: `${val}`,
                distractors: [`${a + n * d}`, `${a + (n - 2) * d}`, `${n * d}`],
                explanation: `aₙ = a + (n − 1)d = ${a} + ${n - 1} × ${d} = ${val}.`,
                theory: 'In an AP, each term adds the common difference d, so the nth term is a + (n − 1)d.'
            };
        }
    },
    {
        id: 'combinations', subject: 'mathematics', topic: 'Combinatorics', difficulty: 'medium', exams: ['jee'],
        build() {
            const n = rint(6, 10); const r = rint(2, 4);
            const val = nCr(n, r);
            return {
                question: `In how many ways can a committee of ${r} be chosen from ${n} people?`,
                answer: `${val}`,
                distractors: [`${fact(n) / fact(n - r)}`, `${nCr(n, r - 1)}`, `${val + n}`],
                explanation: `Order does not matter, so use ⁿCᵣ = ${n}!/(${r}! × ${n - r}!) = ${val}.`,
                theory: 'Selections (order irrelevant) use combinations ⁿCᵣ; arrangements (order matters) use permutations ⁿPᵣ = ⁿCᵣ × r!.'
            };
        }
    },
    {
        id: 'dice-sum', subject: 'mathematics', topic: 'Probability', difficulty: 'medium', exams: ['jee'],
        build() {
            const s = rint(3, 11);
            const ways = 6 - Math.abs(7 - s);
            return {
                question: `Two fair dice are thrown. What is the probability that the sum of the numbers is ${s}?`,
                answer: frac(ways, 36),
                distractors: [frac(ways + 1, 36), frac(1, 6) === frac(ways, 36) ? frac(1, 12) : frac(1, 6), frac(ways, 12)],
                explanation: `There are 36 equally likely outcomes and ${ways} of them sum to ${s}, so P = ${ways}/36 = ${frac(ways, 36)}.`,
                theory: 'For two dice, the number of ways to get sum s is 6 − |7 − s| (for s from 2 to 12).'
            };
        }
    },

    // ---------- Biology ----------
    {
        id: 'monohybrid', subject: 'biology', topic: 'Genetics', difficulty: 'easy', exams: ['neet'],
        build() {
            const [dom, rec] = pick([['tall', 'dwarf'], ['round seed', 'wrinkled seed'], ['purple flower', 'white flower'], ['yellow seed', 'green seed']]);
            const variant = rint(0, 2);
            const q = [
                { ask: `show the ${rec} phenotype`, ans: '1/4', exp: 'Only the aa genotype (1 of 4 combinations) shows the recessive trait.' },
                { ask: `show the ${dom} phenotype`, ans: '3/4', exp: 'AA and Aa (3 of 4 combinations) show the dominant trait.' },
                { ask: 'be heterozygous', ans: '1/2', exp: 'Aa appears in 2 of the 4 Punnett-square boxes.' }
            ][variant];
            return {
                question: `In pea plants, ${dom} (A) is dominant over ${rec} (a). Two heterozygous plants (Aa × Aa) are crossed. What fraction of the offspring will ${q.ask}?`,
                answer: q.ans,
                distractors: ['1/4', '3/4', '1/2', '1/3'].filter((x) => x !== q.ans),
                explanation: `Aa × Aa gives AA : Aa : aa = 1 : 2 : 1. ${q.exp}`,
                theory: "Mendel's law of segregation: each parent passes one allele. A monohybrid cross gives a 3:1 phenotypic and 1:2:1 genotypic ratio."
            };
        }
    },
    {
        id: 'hardy-weinberg', subject: 'biology', topic: 'Evolution', difficulty: 'hard', exams: ['neet'],
        build() {
            const q = pick([0.1, 0.2, 0.3, 0.4, 0.5]);
            const p = 1 - q;
            const carrier = 2 * p * q;
            return {
                question: `In a population in Hardy–Weinberg equilibrium, ${fmt(q * q * 100)}% of individuals show a recessive phenotype. What is the frequency of heterozygous carriers?`,
                answer: fmt(carrier),
                distractors: [fmt(p), fmt(q), fmt(p * p)].map((x) => (x === fmt(carrier) ? fmt(carrier + 0.05) : x)),
                explanation: `q² = ${fmt(q * q)}, so q = ${fmt(q)} and p = 1 − q = ${fmt(p)}. Carrier frequency 2pq = 2 × ${fmt(p)} × ${fmt(q)} = ${fmt(carrier)}.`,
                theory: 'Hardy–Weinberg: p + q = 1 and p² + 2pq + q² = 1. Start from q² (recessive phenotype frequency) to find q.'
            };
        }
    },
    {
        id: 'chromosomes', subject: 'biology', topic: 'Cell Division', difficulty: 'easy', exams: ['neet'],
        build() {
            const [org, diploid] = pick([['human', 46], ['onion', 16], ['fruit fly (Drosophila)', 8], ['garden pea', 14], ['rice', 24], ['maize', 20], ['dog', 78]]);
            const askGamete = Math.random() < 0.5;
            return {
                question: askGamete
                    ? `The somatic cells of ${org} have ${diploid} chromosomes. How many chromosomes are present in its gametes?`
                    : `A somatic cell of ${org} with ${diploid} chromosomes divides by mitosis. How many chromosomes does each daughter cell have?`,
                answer: `${askGamete ? diploid / 2 : diploid}`,
                distractors: askGamete ? [`${diploid}`, `${diploid * 2}`, `${diploid / 4}`] : [`${diploid / 2}`, `${diploid * 2}`, `${diploid / 4}`],
                explanation: askGamete
                    ? `Gametes are formed by meiosis, which halves the chromosome number: ${diploid}/2 = ${diploid / 2}.`
                    : `Mitosis produces genetically identical daughter cells with the same chromosome number (${diploid}).`,
                theory: 'Mitosis is equational (2n → 2n). Meiosis is reductional (2n → n), producing haploid gametes.'
            };
        }
    }
];

const shuffleOptions = (answer, distractors) => {
    const opts = [answer];
    distractors.forEach((d) => {
        let v = String(d);
        let bump = 1;
        while (opts.includes(v)) {
            const f = v.match(/^(-?\d+)\/(\d+)$/);
            const num = parseFloat(v);
            if (f) v = frac(Number(f[1]) + bump, Number(f[2]));
            else if (Number.isFinite(num)) v = v.replace(String(num), fmt(num + bump));
            else v = `${v} (approx.)`;
            bump += 1;
        }
        opts.push(v);
    });
    const order = [0, 1, 2, 3].sort(() => Math.random() - 0.5);
    return { options: order.map((i) => opts[i]), correct: order.indexOf(0) };
};

const templatesFor = ({ examType, subject, topic, difficulty }) => TEMPLATES.filter((t) =>
    (!examType || t.exams.includes(examType))
    && (!subject || t.subject === subject)
    && (!topic || t.topic.toLowerCase() === topic.toLowerCase())
    && (!difficulty || difficulty === 'mixed' || t.difficulty === difficulty));

const generateQuestions = ({ examType, subject, topic, difficulty, count = 5 }) => {
    let pool = templatesFor({ examType, subject, topic, difficulty });
    if (!pool.length) pool = templatesFor({ examType, subject });
    if (!pool.length) return [];
    const out = [];
    const seen = new Set();
    const start = Math.floor(Math.random() * pool.length);
    // Rotate through matching templates so a batch covers as many as possible.
    for (let i = 0; out.length < count && i < count * 10; i += 1) {
        const t = pool[(start + i) % pool.length];
        const built = t.build();
        if (seen.has(built.question)) continue;
        seen.add(built.question);
        const { options, correct } = shuffleOptions(built.answer, built.distractors);
        out.push({
            examType: examType || t.exams[0],
            subject: t.subject,
            topic: t.topic,
            difficulty: t.difficulty,
            question: built.question,
            options,
            correct,
            explanation: built.explanation,
            theory: built.theory,
            template: t.id
        });
    }
    return out;
};

const generatorTopics = () => [...new Map(TEMPLATES.map((t) => [`${t.subject}::${t.topic}`, { subject: t.subject, topic: t.topic, exams: t.exams }])).values()];

module.exports = { generateQuestions, generatorTopics, TEMPLATES };
