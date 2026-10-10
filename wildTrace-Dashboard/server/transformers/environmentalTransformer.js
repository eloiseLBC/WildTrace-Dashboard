import { DateTime } from "luxon";
import { measurement } from "../utils/statistics.js";

export function transformEnvironmentalData(document, context, warn) {
  return (document.environmental ?? []).flatMap((capture, index) => {
    if (!capture || typeof capture !== "object" || Array.isArray(capture)) {
      warn("invalid_capture"); return [];
    }
    const zone = capture.timezone || document.biological?.timezone;
    const raw = typeof capture.timestamp === "string" ? capture.timestamp : "";
    const hasOffset = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(raw);
    const dt = raw && (hasOffset || zone) ? DateTime.fromISO(raw.replace(" ", "T"),
      { zone: zone || "UTC", setZone: true }) : null;
    const unchangedLocalTime = hasOffset || !dt?.isValid || dt.toFormat("yyyy-MM-dd HH:mm:ss") === raw.slice(0, 19).replace("T", " ");
    const timestampValid = dt?.isValid && unchangedLocalTime && dt.toISODate() === context.date && dt.getPossibleOffsets().length === 1;
    if (dt?.isValid && dt.toISODate() !== context.date) { warn("capture_date_mismatch"); return []; }
    if (!timestampValid) warn("unknown_capture_time");
    const fields = { temperature: [-Infinity, Infinity], humidity: [0, 100], pressure: [0, Infinity],
      luminosity: [0, Infinity], co2: [0, Infinity], latitude: [-90, 90], longitude: [-180, 180] };
    const values = {};
    const sources = {};
    for (const [field, bounds] of Object.entries(fields)) {
      const sourceField = field === "co2" ? "concentration_co2" : field;
      values[field] = measurement(capture[sourceField], ...bounds);
      if (capture[sourceField] != null && values[field] == null) warn("invalid_" + field);
      const source = capture[sourceField + "_source"];
      if (typeof source === "string") sources[field] = source;
    }
    return [{ id: context.id + ":env:" + index, date: context.date, location_id: context.location_id,
      timestamp: timestampValid ? dt.toISO() : null, timestamp_raw: raw || null,
      timezone: zone || (hasOffset ? dt?.zoneName : null), ...values, sources }];
  });
}
