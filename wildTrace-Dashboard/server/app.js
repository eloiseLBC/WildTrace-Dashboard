import express from "express";
import cors from "cors";
import { validDate } from "./services/dailyDataService.js";
import { getEnvironmentalSummary } from "./services/environmentalService.js";
import { getInsights } from "./services/insightsService.js";

export function createApp({ getDailyData, origins = ["http://localhost:5173"], minSleepNights = 5 }) {
  const app = express();
  app.use(cors({ origin: origins }));
  app.get("/api/health", (_req, res) => res.json({ status: "ok", service: "WildTrace API" }));
  app.use("/api", (req, res, next) => {
    const { from, to, locationId } = req.query;
    if ((from !== undefined && !validDate(from)) || (to !== undefined && !validDate(to))
      || (from && to && from > to) || (locationId !== undefined && typeof locationId !== "string")) {
      return res.status(400).json({ error: "Invalid date range or location filter" });
    }
    next();
  });
  const route = (path, select) => app.get(path, async (req, res) => {
    try {
      const all = await getDailyData();
      const { from, to, locationId } = req.query;
      const keep = (row) => (!from || row.date >= from) && (!to || row.date <= to)
        && (!locationId || (locationId === "unknown" ? row.location_id == null : row.location_id === locationId));
      const environmental = all.environmental.filter(keep);
      const biological = all.biological.filter(keep);
      const ids = new Set([...environmental, ...biological].map((row) => row.location_id));
      const data = { ...all, environmental, biological, locations: all.locations.filter((loc) => ids.has(loc.id)) };
      res.set("Cache-Control", "no-store").json({ data: select(data, all), meta: { ...all.meta, filters: { from: from || null, to: to || null, locationId: locationId || null } } });
    } catch {
      res.status(502).json({ error: "Unable to load daily documents from OCI. Check server configuration and source data." });
    }
  });
  route("/api/dashboard", (data, all) => ({ environmental: data.environmental, biological: data.biological,
    locations: all.locations, environmentalSummary: getEnvironmentalSummary(data), insights: getInsights(data, minSleepNights) }));
  route("/api/environmental/captures", (data) => data.environmental);
  route("/api/environmental/summary", getEnvironmentalSummary);
  route("/api/biological/captures", (data) => data.biological);
  route("/api/locations", (data) => data.locations);
  route("/api/insights", (data) => getInsights(data, minSleepNights));
  return app;
}
