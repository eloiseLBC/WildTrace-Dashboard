import React, { useState } from "react";
import { Leaf, Thermometer, Droplets, Sun, Wind } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import { useDashboardData } from "../api/useDashboardData.js";
import { Page, Controls, Panel, StatCard, Tabs, Toggles, Empty, ChartTooltip, palette, gridStyle, axisStyle, fmt, range, average, isNumber, inRange, locationName, dayLabel } from "../components/JourneyDataView.jsx";
const metrics = { temperature: ["Temperature", "°C", palette.terra], humidity: ["Humidity", "%", palette.navy], luminosity: ["Light", "", palette.gold], co2: ["CO₂", "", palette.sage] };
export default function Environmental({ loaders }) {
  const state = useDashboardData(loaders);
  const [location, setLocation] = useState("all"), [from, setFrom] = useState(""), [to, setTo] = useState("");
  const [metric, setMetric] = useState("temperature"), [tab, setTab] = useState("timeseries");
  const data = state.data;
  const rows = (data?.environmental || []).filter((row) => inRange(row, location, from, to));
  const daily = (data?.environmentalSummary || []).filter((row) => inRange(row, location, from, to));
  const [min, max] = range(rows.map((row) => row.temperature));
  const series = rows.filter((row) => row.timestamp).map((row) => ({ ...row, label: dayLabel(row.date) + " · " + row.timestamp.slice(11,16), place: locationName(data.locations, row.location_id) }));
  const comparison = [...new Set(daily.map((row) => row.location_id))].map((id) => ({ place: locationName(data.locations, id), value: average(daily.filter((row) => row.location_id === id).map((row) => row.metrics[metric]?.avg)) }));
  const [label, unit, color] = metrics[metric];
  const toggles = <Toggles options={Object.entries(metrics).map(([key, value]) => [key, value[0]])} value={metric} onChange={setMetric} />;
  return <Page title="Environmental Data" subtitle="How the world's conditions shaped your journey" icon={Leaf} state={state}>
    {data && <>
      <Controls locations={data.locations} {...{ location, setLocation, from, setFrom, to, setTo }} count={rows.length} />
      {from && to && from > to ? <Empty>The start date must be before the end date.</Empty> : !rows.length ? <Empty /> : <>
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-6">
          <StatCard title="Temperature" icon={Thermometer} accent={palette.terra} value={fmt(average(rows.map((r) => r.temperature)))} unit="°C" note={"Range: " + fmt(min) + "° – " + fmt(max) + "°"} />
          <StatCard title="Humidity" icon={Droplets} accent={palette.navy} value={fmt(average(rows.map((r) => r.humidity)), 0)} unit="%" note="Average relative humidity" />
          <StatCard title="Light Exposure" icon={Sun} accent={palette.gold} value={fmt(average(rows.map((r) => r.luminosity)), 0)} note="Average measured luminosity" />
          <StatCard title="CO₂" icon={Wind} value={fmt(average(rows.map((r) => r.co2)), 0)} note="Average measured concentration" />
        </div>
        <div className="space-y-6"><Tabs options={[["timeseries", "Time Series"], ["comparison", "Location Comparison"], ["daily", "Daily Overview"]]} value={tab} onChange={setTab} />
          {tab === "timeseries" && <Panel title="Environmental Conditions Over Time" controls={toggles}>
            {series.some((row) => isNumber(row[metric])) ? <div style={{ height: 400 }}><ResponsiveContainer width="100%" height="100%"><LineChart data={series} margin={{ top: 12, right: 20, bottom: 8, left: 0 }}>
              <CartesianGrid {...gridStyle} /><XAxis dataKey="label" {...axisStyle} minTickGap={60} /><YAxis {...axisStyle} domain={["auto", "auto"]} width={45} /><Tooltip content={<ChartTooltip />} />
              <Line type="monotone" dataKey={metric} name={label} unit={unit} stroke={color} strokeWidth={2.5} dot={series.length === 1 ? { r: 4 } : false} activeDot={{ r: 5, stroke: "white", strokeWidth: 2 }} connectNulls={false} />
            </LineChart></ResponsiveContainer></div> : <Empty>No timestamped measurements for this metric.</Empty>}
          </Panel>}
          {tab === "comparison" && <Panel title={label + " Comparison by Location"} controls={toggles}>
            {comparison.some((row) => isNumber(row.value)) ? <div style={{ height: 400 }}><ResponsiveContainer width="100%" height="100%"><BarChart data={comparison} barSize={42}>
              <CartesianGrid {...gridStyle} /><XAxis dataKey="place" {...axisStyle} /><YAxis {...axisStyle} /><Tooltip content={<ChartTooltip />} cursor={{ fill: "#9caf8812" }} /><Bar dataKey="value" name={label} unit={unit} fill={color} fillOpacity={0.65} radius={[8,8,0,0]} />
            </BarChart></ResponsiveContainer></div> : <Empty />}
            <p className="text-xs mt-4" style={{ color: palette.sage }}>Each valid daily average has equal weight.</p>
          </Panel>}
          {tab === "daily" && <Panel title="Daily Environmental Overview"><div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead><tr>{["Day", "Location", "Temperature", "Humidity", "Light", "CO₂"].map((title) => <th key={title} className="py-3 pr-5 font-medium" style={{ color: palette.sage }}>{title}</th>)}</tr></thead><tbody>{daily.map((row) => <tr key={row.date + row.location_id} style={{ borderTop: "1px solid #e8e2d455" }}><td className="py-3 pr-5">{dayLabel(row.date)}</td><td className="py-3 pr-5">{locationName(data.locations, row.location_id)}</td>{["temperature", "humidity", "luminosity", "co2"].map((key) => <td className="py-3 pr-5" key={key}>{fmt(row.metrics[key]?.avg)}</td>)}</tr>)}</tbody></table></div></Panel>}
        </div>
        <details className="text-xs" style={{ color: palette.sage }}><summary className="cursor-pointer">About these measurements</summary><p className="mt-2">Averages describe collected captures. Pressure, luminosity and CO₂ retain their source units until confirmed. Missing values are excluded.</p></details>
      </>}
    </>}
  </Page>;
}
