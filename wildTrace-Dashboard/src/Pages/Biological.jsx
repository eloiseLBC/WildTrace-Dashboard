import React, { useState } from "react";
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import { useDashboardData } from "../api/useDashboardData.js";
import { DataFrame, Filters, MetricCard, average, display, inRange, locationName, isNumber } from "../components/DataView.jsx";
const metrics = { heart_rate_avg: ["Average heart rate", "bpm"], hrv_avg_ms: ["Average HRV", "ms"],
  sleep_duration_hours: ["Sleep duration", "h"], oxygen_saturation_avg_percent: ["Oxygen saturation", "%"],
  steps_total: ["Steps", "steps"], active_energy_kcal: ["Active energy", "kcal"],
  basal_energy_kcal: ["Basal energy", "kcal"], distance_walking_running_meters: ["Walking / running distance", "m"],
  workout_count: ["Workouts", ""] };
const usableValue = (row, field) => field === "sleep_duration_hours" && row.sleep_data_status !== "available" ? null : row[field];
export default function Biological({ loaders }) {
  const state = useDashboardData(loaders);
  const [location, setLocation] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [metric, setMetric] = useState("heart_rate_avg");
  const data = state.data;
  const rows = (data?.biological || []).filter((row) => inRange(row, location, from, to));
  const chart = rows.map((row) => ({ ...row, [metric]: usableValue(row, metric) }));
  const invalidRange = from && to && from > to;
  return <DataFrame title="Biological Data" subtitle="Daily biological summaries from your OCI documents" state={state}>
    {data && <>
      <Filters locations={data.locations} {...{ location, setLocation, from, setFrom, to, setTo }} />
      {invalidRange ? <p role="alert">The start date must be before the end date.</p> : !rows.length ? <p>No biological data for these filters.</p> : <>
        <p className="text-sm">{rows.length} daily summaries · Each valid day has equal weight.</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Object.entries(metrics).map(([key, [title, unit]]) => <MetricCard key={key} title={title}
          value={display(average(rows.map((row) => usableValue(row, key))), unit, ["steps_total", "workout_count"].includes(key) ? 0 : 1)}
          note={rows.filter((row) => isNumber(usableValue(row, key))).length + " valid daily values · daily mean"} />)}</div>
        {rows.some((row) => row.sleep_data_status === "unknown") && <p className="text-sm text-amber-900">Sleep duration of zero has unknown availability and is excluded from averages and comparisons.</p>}
        <section className="bg-white border border-stone-200 rounded-2xl p-4">
          <label>Chart metric<select className="ml-3 border rounded p-2" value={metric} onChange={(event) => setMetric(event.target.value)}>{Object.entries(metrics).map(([key, [title]]) => <option key={key} value={key}>{title}</option>)}</select></label>
          {chart.some((row) => isNumber(row[metric])) ? <div className="h-80 mt-4"><ResponsiveContainer width="100%" height="100%"><LineChart data={chart}>
            <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" /><YAxis domain={["auto", "auto"]} /><Tooltip />
            <Line type="linear" dataKey={metric} name={metrics[metric][0]} unit={metrics[metric][1]} stroke="#b65f32" strokeWidth={2} dot connectNulls={false} />
          </LineChart></ResponsiveContainer></div> : <p className="mt-4">Data unavailable for this metric.</p>}
        </section>
        <section className="bg-white border border-stone-200 rounded-2xl p-4 overflow-x-auto"><h2 className="font-semibold mb-3">Daily summaries</h2>
          <table className="w-full text-sm text-left"><thead><tr>{["Date", "Location", "Heart rate avg / min / max (bpm)", "HRV (ms)", "Sleep (h)", "Steps", "Sleep duration score", "Stress score"].map((title) => <th key={title} className="p-2 border-b">{title}</th>)}</tr></thead>
            <tbody>{rows.map((row) => <tr key={row.id}>
              <td className="p-2 border-b">{row.date}</td><td className="p-2 border-b">{locationName(data.locations, row.location_id)}</td>
              <td className="p-2 border-b">{[row.heart_rate_avg, row.heart_rate_min, row.heart_rate_max].map((value) => display(value, "", 0)).join(" / ")}</td>
              <td className="p-2 border-b">{display(row.hrv_avg_ms)}</td><td className="p-2 border-b">{display(row.sleep_duration_hours)}{row.sleep_data_status === "unknown" ? " (availability unknown)" : ""}</td>
              <td className="p-2 border-b">{display(row.steps_total, "", 0)}</td><td className="p-2 border-b">{display(row.sleep_duration_score)}<span className="block text-xs text-stone-500">{row.sleep_score_source?.replaceAll("_", " ")}</span></td>
              <td className="p-2 border-b">{display(row.stress_score)}<span className="block text-xs text-stone-500">{row.stress_status?.replaceAll("_", " ")}</span></td>
            </tr>)}</tbody></table>
          <p className="text-xs text-stone-500 mt-3">Computed scores are shown as supplied, without assuming a maximum scale. A duration score does not measure sleep quality.</p>
        </section>
      </>}
    </>}
  </DataFrame>;
}
