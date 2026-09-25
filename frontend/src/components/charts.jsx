// Chart components. Colours come from CSS tokens (validated categorical +
// status palettes); text always uses ink tokens, never series colours.
import { useMemo } from 'react';
import {
    Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis
} from 'recharts';
import { date, subjectColor, subjectLabel } from '../lib/format';

const Tip = ({ active, payload, label, fmt }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="chart-tooltip">
            <div className="t">{label}</div>
            {payload.map((p) => (
                <div key={p.dataKey} className="row gap-8 small">
                    <span className="dot" style={{ background: p.color || p.payload.color }} />
                    <span className="muted">{p.name}</span>
                    <b className="nums">{fmt ? fmt(p.value, p.payload) : p.value}</b>
                </div>
            ))}
        </div>
    );
};

// Score trend: one series, area under a 2px line, crosshair tooltip.
export function TrendChart({ data, height = 240 }) {
    const rows = data.map((d, i) => ({ ...d, name: `#${i + 1}`, label: `${date(d.date, { day: 'numeric', month: 'short' })} · ${d.title}` }));
    return (
        <div style={{ width: '100%', height }}>
            <ResponsiveContainer>
                <AreaChart data={rows} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--brand)" stopOpacity={0.22} />
                            <stop offset="100%" stopColor="var(--brand)" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} strokeDasharray="0" />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} interval="preserveStartEnd" />
                    <YAxis domain={[0, 100]} tickLine={false} axisLine={false} ticks={[0, 25, 50, 75, 100]} />
                    <Tooltip
                        cursor={{ stroke: 'var(--line-strong)', strokeWidth: 1 }}
                        content={({ active, payload }) => (active && payload?.length ? (
                            <div className="chart-tooltip">
                                <div className="t">{payload[0].payload.label}</div>
                                <div className="small">Score <b className="nums">{payload[0].payload.percent}%</b> · Accuracy <b className="nums">{payload[0].payload.accuracy}%</b></div>
                            </div>
                        ) : null)}
                    />
                    <Area type="monotone" dataKey="percent" name="Score" stroke="var(--brand)" strokeWidth={2} fill="url(#trendFill)"
                        dot={{ r: 3, strokeWidth: 2, fill: 'var(--surface)' }} activeDot={{ r: 5, strokeWidth: 2, stroke: 'var(--surface)', fill: 'var(--brand)' }} />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}

// Accuracy by subject: bars coloured by subject identity, direct-labelled axis.
export function SubjectBars({ subjects, height = 200 }) {
    const rows = subjects.map((s) => ({ name: subjectLabel(s.subject), accuracy: s.accuracy, color: subjectColor(s.subject), attempted: s.attempted }));
    return (
        <div style={{ width: '100%', height }}>
            <ResponsiveContainer>
                <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }} barCategoryGap={14}>
                    <CartesianGrid horizontal={false} />
                    <XAxis type="number" domain={[0, 100]} tickLine={false} axisLine={false} ticks={[0, 25, 50, 75, 100]} unit="%" />
                    <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} width={92} />
                    <Tooltip cursor={{ fill: 'var(--surface-3)' }} content={<Tip fmt={(v, p) => `${v}% (${p.attempted} answered)`} />} />
                    <Bar dataKey="accuracy" name="Accuracy" radius={[0, 4, 4, 0]} maxBarSize={22}>
                        {rows.map((r) => <Cell key={r.name} fill={r.color} />)}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

// Status composition (correct / incorrect / skipped) as a single stacked bar with labels.
export function StatusBar({ correct, incorrect, skipped }) {
    const total = correct + incorrect + skipped || 1;
    const parts = [
        { k: 'Correct', v: correct, c: 'var(--good)' },
        { k: 'Incorrect', v: incorrect, c: 'var(--bad)' },
        { k: 'Skipped', v: skipped, c: 'var(--neutral)' }
    ];
    return (
        <div>
            <div style={{ display: 'flex', height: 12, borderRadius: 999, overflow: 'hidden', gap: 2, background: 'var(--surface)' }}>
                {parts.filter((p) => p.v).map((p) => (
                    <span key={p.k} title={`${p.k}: ${p.v}`} style={{ width: `${(p.v / total) * 100}%`, background: p.c }} />
                ))}
            </div>
            <div className="legend mt-8">
                {parts.map((p) => (
                    <span key={p.k}><span className="dot" style={{ background: p.c }} />{p.k} <b className="nums" style={{ color: 'var(--ink)' }}>{p.v}</b></span>
                ))}
            </div>
        </div>
    );
}

// Single-series column chart for counts over days (admin activity etc).
export function CountColumns({ data, dataKey, name, height = 220 }) {
    const rows = data.map((d) => ({ ...d, label: date(d.date, { day: 'numeric', month: 'short' }) }));
    return (
        <div style={{ width: '100%', height }}>
            <ResponsiveContainer>
                <BarChart data={rows} margin={{ top: 8, right: 8, left: -24, bottom: 0 }} barCategoryGap={4}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={16} />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{ fill: 'var(--surface-3)' }} content={<Tip />} />
                    <Bar dataKey={dataKey} name={name} fill="var(--brand)" radius={[4, 4, 0, 0]} maxBarSize={28} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

// GitHub-style activity grid for the last N weeks.
export function ActivityHeatmap({ activeDays = {}, weeks = 16 }) {
    const cells = useMemo(() => {
        const today = new Date();
        const key = (d) => {
            const x = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
            return x.toISOString().slice(0, 10);
        };
        const start = new Date(today);
        start.setDate(today.getDate() - (weeks * 7 - 1) - today.getDay());
        const out = [];
        for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
            const k = key(d);
            const n = activeDays[k] || 0;
            out.push({ k, n, level: n === 0 ? 0 : n === 1 ? 1 : n <= 3 ? 2 : 3, today: k === key(today) });
        }
        return out;
    }, [activeDays, weeks]);
    const activeCount = cells.filter((c) => c.n).length;
    return (
        <div>
            <div style={{ overflowX: 'auto', paddingBottom: 4 }}>
                <div className="heatmap" role="img" aria-label={`${activeCount} active days in the last ${weeks} weeks`}>
                    {cells.map((c) => <span key={c.k} data-l={c.level} data-today={c.today} title={`${date(c.k)}: ${c.n} test${c.n === 1 ? '' : 's'}`} />)}
                </div>
            </div>
            <div className="row between mt-8 xs subtle">
                <span>{activeCount} active day{activeCount === 1 ? '' : 's'} in {weeks} weeks</span>
                <span className="row gap-4">Less <span className="heatmap" style={{ display: 'inline-flex', gap: 3 }}><span /><span data-l="1" /><span data-l="2" /><span data-l="3" /></span> More</span>
            </div>
        </div>
    );
}
