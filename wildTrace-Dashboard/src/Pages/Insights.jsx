import React, { useState } from "react";
import { Brain, Moon, Activity, Heart, MapPin } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import { useDashboardData } from "../api/useDashboardData.js";
import { Page, Controls, Panel, StatCard, Tabs, Empty, ChartTooltip, palette, gridStyle, axisStyle, fmt, isNumber } from "../components/JourneyDataView.jsx";
const metrics = { sleep: ["Sleep Duration", "h", palette.gold], hrv: ["HRV", "ms", palette.sage], heart_rate: ["Heart Rate", "bpm", palette.terra] };
export default function Insights({ loaders }) {
  const [location, setLocation] = useState("all"), [from, setFrom] = useState(""), [to, setTo] = useState(""), [metric, setMetric] = useState("sleep");
  const state = useDashboardData(loaders, { from, to, locationId: location === "all" ? undefined : location });
  const data = state.data;
  const insights = data?.insights;
  const comparisons = insights?.locations || [];
  const winners = insights?.best_sleep || [];
  const hrv = comparisons.filter((r) => isNumber(r.hrv.avg)).sort((a,b) => b.hrv.avg - a.hrv.avg)[0];
  const heart = comparisons.filter((r) => isNumber(r.heart_rate.avg)).sort((a,b) => a.heart_rate.avg - b.heart_rate.avg)[0];
  const [label, unit, color] = metrics[metric];
  const bars = comparisons.map((row) => ({ place: row.location.name, value: row[metric].avg }));
  return <Page title="Data Insights" subtitle="Patterns and discoveries from your living data" icon={Brain} state={state}>
    {data && <>
      <Controls locations={data.locations} {...{ location, setLocation, from, setFrom, to, setTo }} count={comparisons.length} noun="locations" />
      {from && to && from > to ? <Empty>The start date must be before the end date.</Empty> : <>
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-6">
          <StatCard title="Longest Average Sleep" icon={Moon} accent={palette.gold} value={winners.length ? winners.map((r) => r.location.name).join(" · ") : "—"} note={winners.length ? fmt(winners[0].sleep.avg) + " h · at least " + insights.minSleepNights + " nights per location" : ""} />
          <StatCard title="Highest Average HRV" icon={Activity} accent={palette.sage} value={hrv ? hrv.location.name : "—"} note={hrv ? fmt(hrv.hrv.avg) + " ms · " + hrv.hrv.count + " days" : ""} />
          <StatCard title="Lowest Average Heart Rate" icon={Heart} accent={palette.terra} value={heart ? heart.location.name : "—"} note={heart ? fmt(heart.heart_rate.avg) + " bpm · " + heart.heart_rate.count + " days" : ""} />
          <StatCard title="Observed Locations" icon={MapPin} accent={palette.navy} value={String(comparisons.length)} note="Locations with biological readings" />
        </div>
        <div className="space-y-6"><Tabs options={Object.entries(metrics).map(([key,v]) => [key,v[0]])} value={metric} onChange={setMetric} />
          <Panel title={label + " by Location"}>{bars.some((r) => isNumber(r.value)) ? <div style={{ height: 400 }}><ResponsiveContainer width="100%" height="100%"><BarChart data={bars} barSize={42}>
            <CartesianGrid {...gridStyle} /><XAxis dataKey="place" {...axisStyle} /><YAxis {...axisStyle} /><Tooltip content={<ChartTooltip />} cursor={{ fill: "#9caf8812" }} /><Bar dataKey="value" name={label} unit={unit} fill={color} fillOpacity={0.65} radius={[8,8,0,0]} />
          </BarChart></ResponsiveContainer></div> : <Empty>No recorded values for this comparison.</Empty>}
            {metric === "sleep" && <p className="text-xs mt-4" style={{ color: palette.sage }}>The sleep ranking requires at least {insights?.minSleepNights ?? 5} valid nights per location. Duration is distinct from sleep quality.</p>}
          </Panel>
        </div>
      </>}
    </>}
  </Page>;
}
