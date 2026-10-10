import { summarize } from "../utils/statistics.js";
export function getInsights(data, minSleepNights = 5) {
  const rows = data.locations.map((location) => {
    const bio = data.biological.filter((row) => row.location_id === location.id);
    const sleep = summarize(bio.filter((row) => row.sleep_data_status === "available").map((row) => row.sleep_duration_hours));
    return { location, day_count: bio.length, sleep, hrv: summarize(bio.map((row) => row.hrv_avg_ms)),
      heart_rate: summarize(bio.map((row) => row.heart_rate_avg)), eligible: sleep.count >= minSleepNights };
  });
  const eligible = rows.filter((row) => row.eligible).sort((a, b) => b.sleep.avg - a.sleep.avg);
  const top = eligible[0]?.sleep.avg;
  const winners = top == null ? [] : eligible.filter((row) => row.sleep.avg.toFixed(2) === top.toFixed(2));
  return { metric: "sleep_duration_hours", minSleepNights, best_sleep: winners, locations: rows };
}
