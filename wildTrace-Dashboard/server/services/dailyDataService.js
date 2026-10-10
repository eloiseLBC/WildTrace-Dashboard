import { createHash } from "node:crypto";
import { DateTime } from "luxon";
import { transformEnvironmentalData } from "../transformers/environmentalTransformer.js";
import { transformBiologicalData } from "../transformers/biologicalTransformer.js";

const object = (value) => value && typeof value === "object" && !Array.isArray(value);
export const validDate = (value) => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
  && DateTime.fromISO(value).isValid;
const clean = (value) => typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
const digest = (value) => createHash("sha256").update(value).digest("hex").slice(0, 24);

export function normalizeDocuments(records, now = new Date()) {
  const counts = new Map();
  let partial = false;
  const warn = (code) => counts.set(code, (counts.get(code) || 0) + 1);
  const groups = new Map();
  for (const record of records) {
    const d = record.document;
    if (record.invalidJson || !object(d) || !validDate(d.date) || d.schema_version !== "1.0.0"
      || (d.environmental != null && !Array.isArray(d.environmental))
      || (d.biological != null && !object(d.biological))
      || (d.biological?.summary != null && !object(d.biological.summary))
      || (d.biological?.computed_metrics != null && !object(d.biological.computed_metrics))
      || (d.biological?.date != null && d.biological.date !== d.date)
      || (!d.environmental?.length && !d.biological?.summary)) {
      partial = true; warn("invalid_daily_document"); continue;
    }
    const city = clean(d.biological?.city_country?.city);
    const country = clean(d.biological?.city_country?.country);
    const location_id = city && country ? "LOC-" + digest(JSON.stringify([city.toLowerCase(), country.toLowerCase()])) : null;
    if (!location_id) warn("missing_location");
    const key = d.date + ":" + (location_id || "unknown");
    const versionTime = Date.parse(record.modifiedAt || d.biological?.generated_at || "");
    const entry = { record, context: { id: key, date: d.date, location_id }, city, country, versionTime };
    const entries = groups.get(key) || [];
    entries.push(entry); groups.set(key, entries);
  }
  const selected = [];
  for (const entries of groups.values()) {
    if (entries.length === 1) { selected.push(entries[0]); continue; }
    const firstContent = JSON.stringify(entries[0].record.document);
    if (entries.every((entry) => JSON.stringify(entry.record.document) === firstContent)) {
      selected.push(entries[0]); warn("duplicate_daily_document"); continue;
    }
    entries.sort((a, b) => b.versionTime - a.versionTime);
    if (entries.some((e) => !Number.isFinite(e.versionTime)) || entries[0].versionTime === entries[1].versionTime) {
      partial = true; warn("conflicting_daily_versions"); continue;
    }
    selected.push(entries[0]); warn("duplicate_daily_document");
  }
  if (records.length && !selected.length) throw new Error("No usable daily documents");
  const locations = new Map();
  const environmental = [];
  const biological = [];
  for (const entry of selected) {
    const { context, record, city, country } = entry;
    if (context.location_id) locations.set(context.location_id, { id: context.location_id, name: city, city, country });
    environmental.push(...transformEnvironmentalData(record.document, context, warn));
    biological.push(...transformBiologicalData(record.document, context, warn));
  }
  environmental.sort((a, b) => a.date.localeCompare(b.date) || (a.timestamp && b.timestamp ? Date.parse(a.timestamp) - Date.parse(b.timestamp) : a.timestamp ? -1 : b.timestamp ? 1 : 0));
  biological.sort((a, b) => a.date.localeCompare(b.date));
  return { environmental, biological, locations: [...locations.values()].sort((a, b) => a.name.localeCompare(b.name)),
    meta: { loadedAt: now.toISOString(), partial, documentCount: selected.length,
      warnings: [...counts].map(([code, count]) => ({ code, count })) } };
}

export function createDailyDataService({ loadRecords, ttlMs = 60000, clock = () => Date.now() }) {
  let cache;
  let expiresAt = 0;
  let pending;
  return async function getDailyData() {
    if (cache && clock() < expiresAt) return cache;
    if (!pending) pending = (async () => {
      const data = normalizeDocuments(await loadRecords(), new Date(clock()));
      cache = data; expiresAt = clock() + ttlMs; return data;
    })().finally(() => { pending = undefined; });
    return pending;
  };
}
