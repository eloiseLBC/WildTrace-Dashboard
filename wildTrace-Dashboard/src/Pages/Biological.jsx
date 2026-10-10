import React, { useState, useId } from "react";
import { Heart, Activity, Moon, TrendingUp } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, ScatterChart, Scatter, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import { useDashboardData } from "../api/useDashboardData.js";
import { Page, Controls, Panel, StatCard, Tabs, Toggles, Empty, ChartTooltip, palette, gridStyle, axisStyle, fmt, range, average, isNumber, inRange, locationName, dayLabel } from "../components/JourneyDataView.jsx";
const metrics = { heart_rate_avg: ["Heart Rate", "bpm", palette.terra], sleep_duration_hours: ["Sleep Duration", "h", palette.gold], stress_score: ["Stress", "", palette.sage], hrv_avg_ms: ["HRV", "ms", palette.navy] };
export default function Biological({ loaders }) {
  const state = useDashboardData(loaders);
  const [location, setLocation] = useState("all"), [from, setFrom] = useState(""), [to, setTo] = useState("");
  const [metric, setMetric] = useState("heart_rate_avg"), [tab, setTab] = useState("timeline");
  const gradient = "bio-" + useId().replaceAll(":", "");
  const data = state.data;
  const raw = (data?.biological || []).filter((row) => inRange(row, location, from, to));
  const rows = raw.map((row) => ({ ...row, sleep_duration_hours: row.sleep_data_status === "available" ? row.sleep_duration_hours : null,
    label: dayLabel(row.date), place: locationName(data.locations, row.location_id) }));
  const [min] = range(rows.map((r) => r.heart_rate_min)); const [, max] = range(rows.map((r) => r.heart_rate_max));
  const [label, unit, color] = metrics[metric];
  const paired = rows.filter((r) => isNumber(r.sleep_duration_hours) && isNumber(r.hrv_avg_ms));
  const stressPairs = rows.filter((r) => isNumber(r.stress_score) && isNumber(r.heart_rate_avg));
  const highestHRV = rows.filter((r) => isNumber(r.hrv_avg_ms)).sort((a,b) => b.hrv_avg_ms - a.hrv_avg_ms)[0];
  const longestSleep = rows.filter((r) => isNumber(r.sleep_duration_hours)).sort((a,b) => b.sleep_duration_hours - a.sleep_duration_hours)[0];
  return <Page title="Biological Responses" subtitle="How your body adapted to each environment" icon={Heart} state={state}>
    {data && <>
      <Controls locations={data.locations} {...{ location, setLocation, from, setFrom, to, setTo }} count={rows.length} noun="daily readings" />
      {from && to && from > to ? <Empty>The start date must be before the end date.</Empty> : !rows.length ? <Empty /> : <>
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-6">
          <StatCard title="Average Heart Rate" icon={Heart} accent={palette.terra} value={fmt(average(rows.map((r) => r.heart_rate_avg)), 0)} unit="BPM" note={"Range: " + fmt(min, 0) + "–" + fmt(max, 0) + " BPM"} />
          <StatCard title="Heart Rate Variability" icon={Activity} accent={palette.navy} value={fmt(average(rows.map((r) => r.hrv_avg_ms)), 0)} unit="ms" note="Average daily HRV" />
          <StatCard title="Sleep Duration" icon={Moon} accent={palette.gold} value={fmt(average(rows.map((r) => r.sleep_duration_hours)))} unit="h" note="Average recorded duration" />
          <StatCard title="Stress Score" icon={TrendingUp} value={fmt(average(rows.map((r) => r.stress_score)))} note="Source score · scale not yet confirmed" />
        </div>
        <div className="space-y-6"><Tabs options={[["timeline", "Body Timeline"], ["sleep", "Sleep & HRV"], ["relations", "Body Relationships"]]} value={tab} onChange={setTab} />
          {tab === "timeline" && <Panel title="Biological Response Timeline" controls={<Toggles options={Object.entries(metrics).map(([key, v]) => [key, v[0]])} value={metric} onChange={setMetric} />}>
            {rows.some((row) => isNumber(row[metric])) ? <div style={{ height: 400 }}><ResponsiveContainer width="100%" height="100%"><AreaChart data={rows} margin={{ top: 12, right: 20, bottom: 8, left: 0 }}>
              <defs><linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity={0.22} /><stop offset="100%" stopColor={color} stopOpacity={0.015} /></linearGradient></defs>
              <CartesianGrid {...gridStyle} /><XAxis dataKey="label" {...axisStyle} minTickGap={40} /><YAxis {...axisStyle} domain={["auto", "auto"]} width={45} /><Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey={metric} name={label} unit={unit} stroke={color} fill={"url(#" + gradient + ")"} strokeWidth={2.5} dot={rows.length === 1 ? { r: 4, fill: color } : false} activeDot={{ r: 5, stroke: "white", strokeWidth: 2 }} connectNulls={false} />
            </AreaChart></ResponsiveContainer></div> : <Empty>No recorded values for this metric.</Empty>}
          </Panel>}
          {tab === "sleep" && <Panel title="Sleep Duration & Heart Rate Variability">
            {paired.length ? <div style={{ height: 400 }}><ResponsiveContainer width="100%" height="100%"><ScatterChart><CartesianGrid {...gridStyle} /><XAxis type="number" dataKey="sleep_duration_hours" name="Sleep" unit=" h" {...axisStyle} /><YAxis type="number" dataKey="hrv_avg_ms" name="HRV" unit=" ms" {...axisStyle} /><Tooltip content={<ChartTooltip />} /><Scatter name="Daily readings" data={paired} fill={palette.sage} fillOpacity={0.75} /></ScatterChart></ResponsiveContainer></div> : <Empty>Recorded sleep and HRV on the same day are needed for this view.</Empty>}
          </Panel>}
          {tab === "relations" && <div className="grid lg:grid-cols-2 gap-6"><Panel title="Heart Rate & Stress">
            {stressPairs.length ? <div style={{ height: 300 }}><ResponsiveContainer width="100%" height="100%"><ScatterChart><CartesianGrid {...gridStyle} /><XAxis type="number" dataKey="stress_score" name="Stress" {...axisStyle} /><YAxis type="number" dataKey="heart_rate_avg" name="Heart Rate" unit=" bpm" {...axisStyle} /><Tooltip content={<ChartTooltip />} /><Scatter data={stressPairs} fill={palette.terra} fillOpacity={0.65} /></ScatterChart></ResponsiveContainer></div> : <Empty>No paired heart rate and stress data available.</Empty>}
          </Panel><Panel title="Sleep & HRV"><p className="text-sm leading-relaxed" style={{ color: palette.sage }}>Explore recorded sleep duration alongside daily HRV in the Sleep & HRV tab. These observations do not establish a causal relationship.</p></Panel></div>}
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          <StatCard title="Highest HRV Reading" icon={Activity} value={highestHRV ? highestHRV.place : "—"} note={highestHRV ? fmt(highestHRV.hrv_avg_ms) + " ms · " + highestHRV.label : ""} />
          <StatCard title="Longest Recorded Sleep" icon={Moon} value={longestSleep ? longestSleep.place : "—"} note={longestSleep ? fmt(longestSleep.sleep_duration_hours) + " h · " + longestSleep.label : ""} />
          <StatCard title="Daily Activity" icon={TrendingUp} value={fmt(average(rows.map((r) => r.steps_total)), 0)} unit="steps" note="Average daily step count" />
        </div>
        <details className="text-xs" style={{ color: palette.sage }}><summary className="cursor-pointer">More daily measurements</summary><div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-6 mt-4">
          <StatCard title="Oxygen Saturation" icon={Heart} value={fmt(average(rows.map((r) => r.oxygen_saturation_avg_percent)))} unit="%" note="Daily average" />
          <StatCard title="Active Energy" icon={Activity} value={fmt(average(rows.map((r) => r.active_energy_kcal)), 0)} unit="kcal" note="Daily average" />
          <StatCard title="Walking & Running" icon={Activity} value={fmt(isNumber(average(rows.map((r) => r.distance_walking_running_meters))) ? average(rows.map((r) => r.distance_walking_running_meters)) / 1000 : null)} unit="km" note="Daily average" />
          <StatCard title="Workouts" icon={Activity} value={fmt(average(rows.map((r) => r.workout_count)))} note="Daily average" />
        </div><p className="mt-3">Sleep values with unknown availability are excluded. HRV alone is not a recovery score. Missing metrics are shown as a dash.</p></details>
      </>}
    </>}
  </Page>;
}
