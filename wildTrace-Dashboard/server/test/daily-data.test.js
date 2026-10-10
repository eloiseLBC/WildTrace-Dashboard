import test from "node:test";
import assert from "node:assert/strict";
import { Readable } from "node:stream";
import { normalizeDocuments, createDailyDataService } from "../services/dailyDataService.js";
import { readJsonObjects } from "../services/objectStorage.js";
import { getInsights } from "../services/insightsService.js";
import { getEnvironmentalSummary } from "../services/environmentalService.js";
import { createApp } from "../app.js";
const document = (date = "2026-10-07", sleep = 0) => ({ date, schema_version: "1.0.0",
  environmental: [
    { timestamp: date + " 15:00:00", temperature: 20, humidity: 50, concentration_co2: "sensor" },
    { timestamp: date + " 08:00:00", temperature: 30, humidity: null, concentration_co2: 400 }],
  biological: { date, timezone: "Europe/Paris", city_country: { city: "Luynes", country: "France" },
    summary: { sleep_duration_hours: sleep, heart_rate_avg: 85, hrv_avg_ms: 47, steps_total: 0 },
    computed_metrics: { stress_status: "insufficient_data", stress_score: 5, sleep_duration_score: null } } });
const record = (d, modifiedAt) => ({ name: "daily.json", document: d, modifiedAt });
test("one daily document shares location, sorts captures and preserves missing measurements", () => {
  const data = normalizeDocuments([record(document())]);
  assert.equal(data.environmental.length, 2);
  assert.equal(data.biological.length, 1);
  assert.equal(data.locations.length, 1);
  assert.equal(data.environmental[0].location_id, data.biological[0].location_id);
  assert.match(data.environmental[0].timestamp, /08:00:00.*\+02:00$/);
  assert.equal(data.environmental[1].co2, null);
  assert.equal(data.biological[0].steps_total, 0);
  assert.equal(data.biological[0].sleep_duration_hours, 0);
  assert.equal(data.biological[0].sleep_data_status, "unknown");
  assert.equal(data.biological[0].stress_score, null);
  const summary = getEnvironmentalSummary(data)[0];
  assert.equal(summary.metrics.temperature.avg, 25);
  assert.equal(summary.metrics.humidity.avg, 50);
  assert.equal(summary.metrics.humidity.count, 1);
  assert.equal(getInsights(data).best_sleep.length, 0);
});
test("invalid documents are reported, empty sources differ from unusable sources", () => {
  const data = normalizeDocuments([{ invalidJson: true }, record(document())]);
  assert.equal(data.meta.partial, true);
  assert.equal(data.meta.documentCount, 1);
  assert.throws(() => normalizeDocuments([{ invalidJson: true }]));
  assert.equal(normalizeDocuments([]).meta.documentCount, 0);
});
test("daily versions are deduplicated and conflicts excluded", () => {
  const older = document("2026-10-07", 6);
  const newer = document("2026-10-07", 8);
  assert.equal(normalizeDocuments([record(older, "2026-10-08T01:00:00Z"), record(newer, "2026-10-08T02:00:00Z")]).biological[0].sleep_duration_hours, 8);
  assert.throws(() => normalizeDocuments([record(older), record(newer)]));
  assert.equal(normalizeDocuments([record(older), record(older)]).biological.length, 1);
});
test("known date mismatch excluded and ambiguous timestamps are not fabricated", () => {
  const d = document("2026-10-25", 8);
  d.environmental = [{ timestamp: "2026-10-25 02:30:00", temperature: 20 }, { timestamp: "2026-10-24 08:00:00" }];
  const data = normalizeDocuments([record(d)]);
  assert.equal(data.environmental.length, 1);
  assert.equal(data.environmental[0].timestamp, null);
  assert.ok(data.meta.warnings.some((w) => w.code === "capture_date_mismatch"));
});
test("cache coalesces calls, expires and does not cache failures", async () => {
  let calls = 0; let now = 0; let fail = false;
  const service = createDailyDataService({ clock: () => now, ttlMs: 10,
    loadRecords: async () => { calls++; if (fail) throw new Error("network"); return [record(document())]; } });
  await Promise.all([service(), service(), service()]); assert.equal(calls, 1);
  now = 11; await service(); assert.equal(calls, 2);
  now = 22; fail = true; await assert.rejects(service());
  fail = false; await service(); assert.equal(calls, 4);
});
test("object reader paginates, limits downloads and reports malformed JSON", async () => {
  const starts = []; let active = 0; let max = 0;
  const client = {
    listObjects: async ({ start }) => { starts.push(start); return { listObjects: start
      ? { objects: [{ name: "c.json" }, { name: "notes.txt" }] }
      : { objects: [{ name: "a.json" }, { name: "b.json" }], nextStartWith: "c.json" } }; },
    getObject: async ({ objectName }) => {
      active++; max = Math.max(max, active);
      await new Promise((resolve) => setTimeout(resolve, 5)); active--;
      return { value: Readable.from([objectName === "b.json" ? "bad" : JSON.stringify(document())]) };
    }
  };
  const results = await readJsonObjects({ client, namespaceName: "ns", bucketName: "bucket", concurrency: 2 });
  assert.deepEqual(starts, [undefined, "c.json"]);
  assert.equal(results.length, 3); assert.equal(results[1].invalidJson, true); assert.equal(max, 2);
  client.getObject = async () => { throw new Error("network"); };
  await assert.rejects(readJsonObjects({ client }));
});
test("sleep ranking respects threshold, missing values and ties", () => {
  const records = [record(document("2026-10-01", 7)), record(document("2026-10-02", 9))];
  const other = document("2026-10-01", 8); other.biological.city_country.city = "Tours";
  records.push(record(other));
  const data = normalizeDocuments(records);
  assert.equal(getInsights(data, 2).best_sleep.length, 1);
  assert.equal(getInsights(data, 1).best_sleep.length, 2);
});
test("API filters and errors are explicit and payloads omit source addresses", async (t) => {
  const app = createApp({ getDailyData: async () => normalizeDocuments([record(document())]) });
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const base = "http://127.0.0.1:" + server.address().port;
  const response = await fetch(base + "/api/dashboard");
  const result = await response.json();
  assert.equal(result.data.environmental.length, 2);
  assert.equal(result.data.biological.length, 1);
  assert.ok(!JSON.stringify(result).includes("key_file"));
  assert.equal((await fetch(base + "/api/dashboard?from=2026-02-30")).status, 400);
  assert.equal((await fetch(base + "/api/dashboard?from=2026-10-08&to=2026-10-07")).status, 400);
  const empty = await (await fetch(base + "/api/dashboard?locationId=unknown-id")).json();
  assert.equal(empty.data.environmental.length, 0);
  const ranged = await (await fetch(base + "/api/dashboard?from=2026-10-08")).json();
  assert.equal(ranged.data.biological.length, 0);
  assert.equal(ranged.data.insights.best_sleep.length, 0);
  assert.equal(ranged.data.locations.length, 1); // dropdown options remain available

});

test("nonexistent spring clock-change timestamps are not shifted silently", () => {
  const d = document("2026-03-29", 8);
  d.environmental = [{ timestamp: "2026-03-29 02:30:00", temperature: 20 }];
  assert.equal(normalizeDocuments([record(d)]).environmental[0].timestamp, null);
});
test("API reports OCI loading failures as 502", async (t) => {
  const app = createApp({ getDailyData: async () => { throw new Error("private details"); } });
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const response = await fetch("http://127.0.0.1:" + server.address().port + "/api/dashboard");
  assert.equal(response.status, 502);
  assert.ok(!(await response.text()).includes("private details"));
});
