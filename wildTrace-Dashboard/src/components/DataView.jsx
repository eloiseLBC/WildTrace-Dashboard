import React from "react";
export const isNumber = (value) => typeof value === "number" && Number.isFinite(value);
export const average = (values) => {
  const valid = values.filter(isNumber);
  return valid.length ? valid.reduce((sum, value) => sum + value, 0) / valid.length : null;
};
export const display = (value, unit = "", decimals = 1) => isNumber(value) ? value.toFixed(decimals) + (unit ? " " + unit : "") : "Data unavailable";
export function DataFrame({ title, subtitle, state, children }) {
  return <div className="p-4 md:p-8 space-y-6 bg-stone-50 min-h-screen text-green-950">
    <header className="flex flex-wrap justify-between gap-4 items-start">
      <div><h1 className="text-3xl font-bold">{title}</h1><p className="text-stone-600 mt-1">{subtitle}</p></div>
      <button type="button" onClick={state.reload} disabled={state.loading} className="rounded-lg border border-stone-300 bg-white px-4 py-2 disabled:opacity-50">Reload data</button>
    </header>
    {state.loading ? <p role="status">Loading OCI data…</p> : state.error ? <div role="alert" className="p-4 bg-red-50 text-red-800 rounded-xl">{state.error}</div> : <>
      {state.meta?.warnings?.length > 0 && <div role="status" className="p-4 bg-amber-50 text-amber-900 rounded-xl">
        <p>{state.meta.partial ? "Some documents were excluded. Results are partial." : "Data quality notes: some values may be unavailable."}</p>
        <ul className="list-disc pl-5">{state.meta.warnings.map((warning) => <li key={warning.code}>{warning.code.replaceAll("_", " ")} ({warning.count})</li>)}</ul>
      </div>}
      {children}
      {state.meta?.loadedAt && <p className="text-xs text-stone-500">Source: OCI daily documents · Server snapshot: {state.meta.loadedAt} · Reload uses the server cache until it expires.</p>}
    </>}
  </div>;
}
export function Filters({ locations, location, setLocation, from, setFrom, to, setTo }) {
  return <div className="flex flex-wrap gap-4 p-4 bg-white border border-stone-200 rounded-xl">
    <label className="text-sm">Location<select className="block border rounded p-2 mt-1" value={location} onChange={(event) => setLocation(event.target.value)}>
      <option value="all">All locations</option>{locations.map((item) => <option key={item.id} value={item.id}>{item.city}, {item.country}</option>)}
      <option value="unknown">Unknown location</option>
    </select></label>
    <label className="text-sm">From<input type="date" className="block border rounded p-2 mt-1" value={from} onChange={(event) => setFrom(event.target.value)} /></label>
    <label className="text-sm">To<input type="date" className="block border rounded p-2 mt-1" value={to} onChange={(event) => setTo(event.target.value)} /></label>
  </div>;
}
export const inRange = (row, location, from, to) => (location === "all" || (location === "unknown" ? row.location_id == null : row.location_id === location))
  && (!from || row.date >= from) && (!to || row.date <= to);
export const locationName = (locations, id) => {
  const location = locations.find((item) => item.id === id);
  return location ? location.city + ", " + location.country : "Unknown location";
};
export function MetricCard({ title, value, note }) {
  return <div className="p-5 bg-white border border-stone-200 rounded-2xl"><h2 className="text-sm text-stone-600">{title}</h2>
    <p className="text-2xl font-semibold mt-2">{value}</p>{note && <p className="text-xs text-stone-500 mt-2">{note}</p>}</div>;
}
