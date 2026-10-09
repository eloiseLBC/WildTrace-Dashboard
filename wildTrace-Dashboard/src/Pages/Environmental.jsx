import React, { useState } from "react";
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import { useDashboardData } from "../api/useDashboardData.js";
import { DataFrame, Filters, MetricCard, average, display, inRange, locationName, isNumber } from "../components/DataView.jsx";
const metrics = { temperature: "Temperature (°C)", humidity: "Humidity (%)", pressure: "Pressure",
  luminosity: "Luminosity", co2: "CO₂" };
export default function Environmental({ loaders }) {
  const state = useDashboardData(loaders);
  const [location, setLocation] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [metric, setMetric] = useState("temperature");
  const data = state.data;
  const rows = (data?.environmental || []).filter((row) => inRange(row, location, from, to));
  const invalidRange = from && to && from > to;
  const chart = rows.filter((row) => row.timestamp).map((row) => ({ ...row,
    label: row.timestamp.slice(0, 16).replace("T", " ") + " " + row.timestamp.slice(-6),
    place: locationName(data.locations, row.location_id) }));
  return <DataFrame title="Environmental Data" subtitle="Environmental captures from your daily OCI documents" state={state}>
    {data && <>
      <Filters locations={data.locations} {...{ location, setLocation, from, setFrom, to, setTo }} />
      {invalidRange ? <p role="alert">The start date must be before the end date.</p> : !rows.length ? <p>No environmental data for these filters.</p> : <>
        <p className="text-sm">{rows.length} captures · Averages describe the collected measurements.</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">{Object.entries(metrics).map(([key, title]) => <MetricCard key={key} title={title}
          value={display(average(rows.map((row) => row[key])), key === "temperature" ? "°C" : key === "humidity" ? "%" : "")}
          note={rows.filter((row) => isNumber(row[key])).length + " valid measurements"} />)}</div>
        <p className="text-xs text-stone-600">Pressure, luminosity and CO₂ are shown in source units pending unit confirmation. CO₂ is not AQI.</p>
        <section className="bg-white rounded-2xl border border-stone-200 p-4">
          <label>Chart metric<select className="ml-3 border rounded p-2" value={metric} onChange={(event) => setMetric(event.target.value)}>{Object.entries(metrics).map(([key, title]) => <option key={key} value={key}>{title}</option>)}</select></label>
          {chart.some((row) => isNumber(row[metric])) ? <div className="h-80 mt-4"><ResponsiveContainer width="100%" height="100%"><LineChart data={chart}>
            <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="label" tick={{ fontSize: 11 }} minTickGap={50} /><YAxis domain={["auto", "auto"]} /><Tooltip />
            <Line type="linear" dataKey={metric} name={metrics[metric]} stroke="#1a5c40" strokeWidth={2} dot={false} connectNulls={false} />
          </LineChart></ResponsiveContainer></div> : <p className="mt-4">No timestamped measurements for this metric.</p>}
        </section>
        <section className="bg-white rounded-2xl border border-stone-200 p-4 overflow-x-auto"><h2 className="font-semibold mb-3">Captures</h2>
          <table className="w-full text-sm text-left"><thead><tr>{["Time", "Location", ...Object.values(metrics)].map((title) => <th className="p-2 border-b" key={title}>{title}</th>)}</tr></thead>
            <tbody>{rows.map((row) => <tr key={row.id}><td className="p-2 border-b whitespace-nowrap">{row.timestamp || (row.timestamp_raw ? row.timestamp_raw + " (timezone unresolved)" : row.date)}</td><td className="p-2 border-b">{locationName(data.locations, row.location_id)}</td>
              {Object.keys(metrics).map((key) => <td className="p-2 border-b" key={key} title={row.sources?.[key] || "Source unspecified"}>{display(row[key])}</td>)}
            </tr>)}</tbody></table>
        </section>
      </>}
    </>}
  </DataFrame>;
}
