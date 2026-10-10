import React from "react";
import { RefreshCw } from "lucide-react";
import { isNumber, average, inRange, locationName } from "./DataView.jsx";
export { isNumber, average, inRange, locationName };
export const palette = { forest: "#1a2e1a", sage: "#9caf88", terra: "#c65d07", gold: "#d4af37", navy: "#1e3a5f" };
export const fmt = (value, digits = 1) => isNumber(value) ? value.toFixed(digits) : "—";
export const gridStyle = { stroke: "#e8e2d4", strokeDasharray: "3 5", vertical: false };
export const axisStyle = { tick: { fontSize: 11, fill: "#89947f" }, axisLine: false, tickLine: false };
export function Page({ title, subtitle, icon: Icon, state, children }) {
  return <div className="p-4 md:p-8 space-y-8 min-h-screen" style={{ color: palette.forest }}>
    <style>{`:root{--forest-deep:#1a2e1a;--sage-soft:#9caf88;--terracotta:#c65d07;--gold-accent:#d4af37;--navy-deep:#1e3a5f;--cream:#faf8f3;--stone:#e8e2d4;}`}</style>
    <header className="flex items-start justify-between gap-4">
      <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #1a2e1a, #9caf88)" }}><Icon className="w-5 h-5 text-white" /></div>
        <div><h1 className="text-3xl font-bold tracking-tight">{title}</h1><p className="font-medium mt-1" style={{ color: palette.sage }}>{subtitle}</p></div></div>
      <button type="button" onClick={state.reload} disabled={state.loading} aria-label="Reload data" title="Reload data" className="p-2 rounded-lg hover:bg-stone-100 disabled:opacity-40" style={{ color: palette.sage }}><RefreshCw className={"w-4 h-4 " + (state.loading ? "animate-spin" : "")} /></button>
    </header>
    {state.loading ? <div role="status" aria-label="Loading data" className="space-y-6"><div className="grid md:grid-cols-4 gap-6">{[1,2,3,4].map((i) => <div key={i} className="h-32 rounded-2xl bg-stone-100 animate-pulse" />)}</div><div className="h-96 rounded-2xl bg-stone-100 animate-pulse" /></div>
      : state.error ? <Panel><p role="alert" className="text-red-700">{state.error}</p></Panel> : children}
    {!state.loading && !state.error && state.meta?.warnings?.length > 0 && <details className="text-xs" style={{ color: "#7d896f" }}><summary className="cursor-pointer">Data availability notes</summary><p className="mt-2">{state.meta.partial ? "Some daily documents could not be used. These results are partial." : "Some measurements are missing or invalid and have been excluded from averages."}</p></details>}
  </div>;
}
export function Controls({ locations, location, setLocation, from, setFrom, to, setTo, count, noun = "data points" }) {
  return <div className="flex flex-wrap gap-3 items-center">
    <select aria-label="Location" value={location} onChange={(e) => setLocation(e.target.value)} className="w-48 rounded-lg px-3 py-2 text-sm bg-white/80" style={{ border: "1px solid #9caf8866" }}>
      <option value="all">All Locations</option>{locations.map((loc) => <option key={loc.id} value={loc.id}>{loc.name}, {loc.country}</option>)}<option value="unknown">Unknown location</option>
    </select>
    <input aria-label="From date" title="From date" type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-lg px-3 py-2 text-sm bg-white/80" style={{ border: "1px solid #9caf8866" }} />
    <span style={{ color: palette.sage }}>—</span>
    <input aria-label="To date" title="To date" type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-lg px-3 py-2 text-sm bg-white/80" style={{ border: "1px solid #9caf8866" }} />
    <span className="inline-flex rounded-full px-3 py-1 text-sm bg-white/80" style={{ border: "1px solid #9caf884d" }}>{count} {noun}</span>
  </div>;
}
export function Panel({ title, children, controls }) {
  return <section className="rounded-2xl bg-white/90 backdrop-blur p-4 md:p-5" style={{ border: "1px solid #9caf8833" }}>
    {(title || controls) && <div className="flex flex-wrap items-center justify-between gap-3 mb-5">{title && <h2 className="font-semibold">{title}</h2>}{controls}</div>}{children}
  </section>;
}
export function StatCard({ title, icon: Icon, accent = palette.sage, value, unit, note }) {
  return <Panel><div className="flex items-center gap-2 text-sm font-medium mb-2"><Icon className="w-4 h-4" style={{ color: accent }} />{title}</div>
    <p className="text-2xl font-bold">{value}{value !== "—" && unit ? <span className="ml-1 text-lg font-medium">{unit}</span> : null}</p>
    <p className="text-xs mt-2" style={{ color: palette.sage }}>{value === "—" ? "No data available" : note}</p>
  </Panel>;
}
export function Tabs({ options, value, onChange }) {
  return <div className="inline-flex flex-wrap rounded-lg overflow-hidden bg-white/80" style={{ border: "1px solid #9caf884d" }}>
    {options.map(([key, label]) => <button type="button" key={key} onClick={() => onChange(key)} aria-pressed={key === value} className="px-3 py-2 text-sm transition-colors" style={{ background: key === value ? palette.forest : undefined, color: key === value ? "white" : palette.forest }}>{label}</button>)}
  </div>;
}
export function Toggles({ options, value, onChange }) {
  return <div className="flex flex-wrap gap-2">{options.map(([key, label]) => <button type="button" key={key} aria-pressed={key === value} onClick={() => onChange(key)} className="px-2.5 py-1.5 rounded-lg text-xs transition-colors" style={{ border: "1px solid #9caf8866", background: key === value ? palette.forest : "white", color: key === value ? "white" : palette.forest }}>{label}</button>)}</div>;
}
export function Empty({ children = "No data available for these filters." }) { return <p className="py-12 text-center text-sm" style={{ color: palette.sage }}>{children}</p>; }
export function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return <div className="bg-white/95 rounded-xl p-3 text-sm shadow-sm" style={{ border: "1px solid #9caf884d" }}><p className="font-semibold mb-1">{label}</p>{payload.map((p, i) => <p key={i} style={{ color: p.color || palette.sage }}>{p.name}: {fmt(p.value)}{p.unit ? " " + p.unit : ""}</p>)}{payload[0]?.payload?.place && <p className="text-xs mt-1" style={{ color: palette.sage }}>{payload[0].payload.place}</p>}</div>;
}
export function range(values) { const valid = values.filter(isNumber); return valid.length ? [valid.reduce((min, v) => Math.min(min, v), Infinity), valid.reduce((max, v) => Math.max(max, v), -Infinity)] : [null, null]; }
export const dayLabel = (date) => new Intl.DateTimeFormat("en", { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(date + "T12:00:00Z"));
