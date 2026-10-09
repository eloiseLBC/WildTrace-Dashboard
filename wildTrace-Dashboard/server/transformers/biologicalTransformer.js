import { measurement } from "../utils/statistics.js";
export function transformBiologicalData(document, context, warn) {
  if (!document.biological || !document.biological.summary) return [];
  const bio = document.biological;
  const summary = bio.summary;
  const values = {};
  const fields = ["heart_rate_avg", "heart_rate_min", "heart_rate_max", "hrv_avg_ms",
    "oxygen_saturation_avg_percent", "sleep_duration_hours", "steps_total", "active_energy_kcal",
    "basal_energy_kcal", "distance_walking_running_meters", "workout_count"];
  for (const field of fields) {
    const max = field === "oxygen_saturation_avg_percent" ? 100 : Infinity;
    values[field] = measurement(summary[field], 0, max);
    if (["steps_total", "workout_count"].includes(field) && values[field] != null && !Number.isInteger(values[field])) values[field] = null;
    if (summary[field] != null && values[field] == null) warn("invalid_" + field);
  }
  const computed = bio.computed_metrics ?? {};
  const duration = values.sleep_duration_hours;
  return [{ id: context.id + ":bio", date: context.date, location_id: context.location_id,
    timezone: bio.timezone || null, ...values,
    sleep_data_status: duration == null ? "missing" : duration > 0 ? "available" : "unknown",
    sleep_duration_score: measurement(computed.sleep_duration_score),
    sleep_score_source: typeof computed.sleep_score_source === "string" ? computed.sleep_score_source : null,
    stress_status: typeof computed.stress_status === "string" ? computed.stress_status : "unknown",
    stress_score: computed.stress_status === "insufficient_data" ? null : measurement(computed.stress_score),
    hrv_baseline_ms: measurement(computed.hrv_baseline_ms, 0),
    hrv_baseline_days: measurement(computed.hrv_baseline_days, 0),
    hrv_change_percent: measurement(computed.hrv_change_percent) }];
}
