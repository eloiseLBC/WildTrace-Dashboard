import React, { useState } from "react";
import { useDashboardData } from "../api/useDashboardData.js";
import { DataFrame, Filters, MetricCard, display } from "../components/DataView.jsx";
export default function Insights({ loaders }) {
  const [location, setLocation] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const state = useDashboardData(loaders, { from, to, locationId: location === "all" ? undefined : location });
  const data = state.data;
  const minimum = data?.insights?.minSleepNights ?? 5;
  const comparisons = (data?.insights?.locations || []).map((row) => ({ place: row.location,
    days: row.day_count, nights: row.sleep.count, sleep: row.sleep.avg, hrv: row.hrv.avg, eligible: row.eligible }));
  const winners = (data?.insights?.best_sleep || []).map((row) => ({ place: row.location, sleep: row.sleep.avg }));
  return <DataFrame title="Data Insights" subtitle="Comparisons calculated from your daily documents" state={state}>
    {data && <>
      <Filters locations={data.locations} {...{ location, setLocation, from, setFrom, to, setTo }} />
      {from && to && from > to ? <p role="alert">The start date must be before the end date.</p> : <>
        <MetricCard title="Highest observed average sleep duration"
          value={winners.length ? winners.map((row) => row.place.city + ", " + row.place.country).join(" · ") : "Insufficient data"}
          note={winners.length ? display(winners[0].sleep, "h", 2) + " · at least " + minimum + " valid nights per location" : "At least " + minimum + " valid nights per location are required."} />
        {comparisons.length ? <div className="overflow-x-auto bg-white p-4 rounded-2xl border border-stone-200"><table className="w-full text-left text-sm">
          <thead><tr>{["Location", "Days", "Valid nights", "Mean sleep (h)", "Mean HRV (ms)", "Sleep comparison"].map((title) => <th className="p-2 border-b" key={title}>{title}</th>)}</tr></thead>
          <tbody>{comparisons.map((row) => <tr key={row.place.id}><td className="p-2 border-b">{row.place.city}, {row.place.country}</td><td className="p-2 border-b">{row.days}</td>
            <td className="p-2 border-b">{row.nights}</td><td className="p-2 border-b">{display(row.sleep, "", 2)}</td><td className="p-2 border-b">{display(row.hrv)}</td><td className="p-2 border-b">{row.eligible ? "Eligible" : "Insufficient nights"}</td></tr>)}</tbody>
        </table></div> : <p>No biological data associated with a known location for these filters.</p>}
        <p className="text-sm text-stone-600">These comparisons describe your observed measurements. Sleep duration does not measure sleep quality, and HRV alone is not a recovery score.</p>
      </>}
    </>}
  </DataFrame>;
}
