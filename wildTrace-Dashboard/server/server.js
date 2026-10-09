import { createApp } from "./app.js";
import { getObjectStorageClient, ociSettings } from "./config/oci.js";
import { readJsonObjects } from "./services/objectStorage.js";
import { createDailyDataService } from "./services/dailyDataService.js";

function integer(key, fallback, min, max) {
  const raw = process.env[key]?.trim();
  const value = raw ? Number(raw) : fallback;
  if (!Number.isInteger(value) || value < min || value > max) throw new Error(`Invalid configuration: ${key}`);
  return value;
}
const port = integer("PORT", 3001, 1, 65535);
const ttlMs = integer("DAILY_CACHE_TTL_SECONDS", 60, 0, 86400) * 1000;
const concurrency = integer("OCI_DOWNLOAD_CONCURRENCY", 5, 1, 50);
const minSleepNights = integer("INSIGHTS_MIN_SLEEP_NIGHTS", 5, 1, 365);
const origins = (process.env.CORS_ORIGIN || "http://localhost:5173").split(",").map((value) => value.trim()).filter(Boolean);
const getDailyData = createDailyDataService({ ttlMs,
  loadRecords: () => readJsonObjects({ client: getObjectStorageClient(), ...ociSettings, concurrency }) });
const app = createApp({ getDailyData, origins, minSleepNights });
app.listen(port, "127.0.0.1", () => console.log(`WildTrace API started at http://localhost:${port}`));
