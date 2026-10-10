import { summarize } from "../utils/statistics.js";
export const getEnvironmentalCaptures = (data) => data.environmental;
export function getEnvironmentalSummary(data) {
  const groups = new Map();
  for (const row of data.environmental) {
    const key = row.date + ":" + row.location_id;
    const group = groups.get(key) || [];
    group.push(row); groups.set(key, group);
  }
  return [...groups.values()].map((rows) => ({ date: rows[0].date, location_id: rows[0].location_id,
    capture_count: rows.length, metrics: Object.fromEntries(["temperature", "humidity", "pressure", "luminosity", "co2"]
      .map((field) => [field, summarize(rows.map((row) => row[field]))])) }));
}
