import React, { useEffect, useMemo, useState } from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar,
} from "recharts";
import { Leaf, Thermometer, Droplets, Sun, Wind, Activity } from "lucide-react";
import { format } from "date-fns";

/**
 * - `loaders` prop to plug your API/entities
 *   loaders = {
 *     loadEnvironmental: () => Promise<EnvironmentalData[]>,
 *     loadLocations: () => Promise<Location[]>
 *   }
 */

// --- Sample data for first render (remove in prod) ---
const SAMPLE_LOCATIONS = [
    { id: "LOC-ECU-Quito", name: "Quito" },
    { id: "LOC-NAM-Sossus", name: "Sossusvlei" },
];
const SAMPLE_ENV = [
    { id: 1, location_id: "LOC-ECU-Quito", date: "2025-06-10", temperature_avg: 14.2, temperature_min: 9.7, temperature_max: 18.3, humidity: 68, light_exposure: 4200, air_quality_index: 45, noise_level: 37 },
    { id: 2, location_id: "LOC-ECU-Quito", date: "2025-06-11", temperature_avg: 13.4, temperature_min: 8.2, temperature_max: 17.9, humidity: 71, light_exposure: 5200, air_quality_index: 50, noise_level: 40 },
    { id: 3, location_id: "LOC-NAM-Sossus", date: "2025-07-05", temperature_avg: 28.5, temperature_min: 21.0, temperature_max: 34.1, humidity: 22, light_exposure: 9800, air_quality_index: 30, noise_level: 28 },
    { id: 4, location_id: "LOC-NAM-Sossus", date: "2025-07-06", temperature_avg: 29.1, temperature_min: 22.4, temperature_max: 35.2, humidity: 19, light_exposure: 10000, air_quality_index: 28, noise_level: 26 },
];

export default function Environmental({ loaders }) {
    const [environmentalData, setEnvironmentalData] = useState([]);
    const [locations, setLocations] = useState([]);
    const [selectedLocation, setSelectedLocation] = useState("all");
    const [selectedMetric, setSelectedMetric] = useState("temperature");
    const [tab, setTab] = useState("timeseries");
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setIsLoading(true);
            try {
                const [env, locs] = await Promise.all([
                    loaders?.loadEnvironmental?.() ?? Promise.resolve(SAMPLE_ENV),
                    loaders?.loadLocations?.() ?? Promise.resolve(SAMPLE_LOCATIONS),
                ]);
                if (!cancelled) {
                    setEnvironmentalData(env ?? []);
                    setLocations(locs ?? []);
                }
            } catch (e) {
                // eslint-disable-next-line no-console
                console.error("Environmental: load error", e);
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [loaders]);

    const getLocationName = (locationId) => {
        const found = locations.find((l) => l.id === locationId);
        return found?.name ?? "Unknown";
    };

    const filtered = useMemo(() => {
        return selectedLocation === "all"
            ? environmentalData
            : environmentalData.filter((d) => d.location_id === selectedLocation);
    }, [environmentalData, selectedLocation]);

    const stats = useMemo(() => {
        if (!filtered.length) return {};
        const avg = (arr) => (arr.length ? arr.reduce((s, v) => s + (v ?? 0), 0) / arr.length : 0);
        const tmin = Math.min(...filtered.map((d) => d.temperature_min ?? Number.POSITIVE_INFINITY));
        const tmax = Math.max(...filtered.map((d) => d.temperature_max ?? Number.NEGATIVE_INFINITY));
        return {
            temperature: { avg: avg(filtered.map((d) => d.temperature_avg)), min: tmin, max: tmax },
            humidity: { avg: avg(filtered.map((d) => d.humidity)) },
            light: { avg: avg(filtered.map((d) => d.light_exposure)) },
            airQuality: { avg: avg(filtered.map((d) => d.air_quality_index)) },
        };
    }, [filtered]);

    const timeSeriesData = useMemo(() => {
        return filtered
            .slice()
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .map((d) => ({
                ...d,
                dateLabel: d.date ? format(new Date(d.date), "MMM d") : "",
                locationName: getLocationName(d.location_id),
            }));
    }, [filtered, locations]);

    // Radar data expects an array of subjects with values per series.
    // We'll create a single series (selected or aggregated) and normalize 0..100.
    const radarData = useMemo(() => {
        if (!filtered.length) return [];
        const avg = (arr) => (arr.length ? arr.reduce((s, v) => s + (v ?? 0), 0) / arr.length : 0);
        const byLoc = new Map();
        for (const d of filtered) {
            if (!byLoc.has(d.location_id)) byLoc.set(d.location_id, []);
            byLoc.get(d.location_id).push(d);
        }
        // compute averages per location then turn into subjects
        const rows = [];
        for (const [locId, rowsArr] of byLoc.entries()) {
            const t = avg(rowsArr.map((x) => x.temperature_avg));
            const h = avg(rowsArr.map((x) => x.humidity));
            const l = avg(rowsArr.map((x) => x.light_exposure));
            const aqi = avg(rowsArr.map((x) => x.air_quality_index));
            const n = avg(rowsArr.map((x) => x.noise_level));
            rows.push({
                location: getLocationName(locId),
                Temperature: Math.min(100, (t / 40) * 100), // 0..40C
                Humidity: Math.max(0, Math.min(100, h)),
                Light: Math.min(100, (l / 10000) * 100), // 0..10k lux
                "Air Quality": Math.min(100, (aqi / 200) * 100), // 0..200 AQI
                Noise: Math.min(100, (n / 100) * 100), // 0..100 dB
            });
        }
        // For a simple single-series radar, pick first location or aggregate
        const first = rows[0];
        if (!first) return [];
        return [
            { subject: "Temperature", value: first.Temperature },
            { subject: "Humidity", value: first.Humidity },
            { subject: "Light", value: first.Light },
            { subject: "Air Quality", value: first["Air Quality"] },
            { subject: "Noise", value: first.Noise },
        ];
    }, [filtered, locations]);

    if (isLoading) {
        return (
            <div className="p-8 space-y-6">
                <div className="space-y-4">
                    <div className="h-8 w-64 bg-grey rounded animate-pulse" />
                    <div className="h-4 w-96 bg-grey rounded animate-pulse" />
                </div>
                <div className="grid md:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-32 bg-grey rounded-xl animate-pulse" />
                    ))}
                </div>
                <div className="h-96 bg-grey rounded-xl animate-pulse" />
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 space-y-8 bg-grey from-[color:var(--cream)] via-white to-[color:var(--stone)]/10 min-h-screen">
            {/* local vars fallback */}
            <style>{`
        :root { --forest-deep:#1a2e1a; --sage-soft:#9caf88; --terracotta:#c65d07; --gold-accent:#d4af37; --navy-deep:#1e3a5f; --cream:#faf8f3; --stone:#e8e2d4; }
      `}</style>

            {/* Header */}
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-grey rounded-xl flex items-center justify-center">
                        <Leaf className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-[color:var(--forest-deep)] tracking-tight">Environmental Data</h1>
                        <p className="text-[color:var(--sage-soft)] font-medium">How the world's conditions shaped your journey</p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 items-center">
                    {/* Select (native) */}
                    <select
                        value={selectedLocation}
                        onChange={(e) => setSelectedLocation(e.target.value)}
                        className="w-48 bg-white/80 border border-[color:var(--sage-soft)]/30 rounded-lg px-3 py-2 text-sm"
                    >
                        <option value="all">All Locations</option>
                        {locations.map((loc) => (
                            <option key={loc.id} value={loc.id}>
                                {loc.name}
                            </option>
                        ))}
                    </select>

                    {/* Badge */}
                    <span className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm bg-white/80 border-[color:var(--sage-soft)]/30">
            {filtered.length} data points
          </span>
                </div>
            </div>

            {/* Stats */}
            <div className="grid md:grid-cols-4 gap-6">
                <StatCard title="Temperature" icon={<Thermometer className="w-4 h-4" />} accent="var(--terracotta)">
                    <div className="space-y-2">
                        <p className="text-2xl font-bold text-[color:var(--forest-deep)]">{(stats.temperature?.avg ?? 0).toFixed(1)}°C</p>
                        <div className="text-xs text-[color:var(--sage-soft)]">
                            Range: {(stats.temperature?.min ?? 0).toFixed(1)}° - {(stats.temperature?.max ?? 0).toFixed(1)}°
                        </div>
                    </div>
                </StatCard>

                <StatCard title="Humidity" icon={<Droplets className="w-4 h-4" />} accent="var(--navy-deep)">
                    <p className="text-2xl font-bold text-[color:var(--forest-deep)]">{(stats.humidity?.avg ?? 0).toFixed(0)}%</p>
                    <div className="text-xs text-[color:var(--sage-soft)]">Average relative humidity</div>
                </StatCard>

                <StatCard title="Light Exposure" icon={<Sun className="w-4 h-4" />} accent="var(--gold-accent)">
                    <p className="text-2xl font-bold text-[color:var(--forest-deep)]">{(stats.light?.avg ?? 0).toFixed(0)}</p>
                    <div className="text-xs text-[color:var(--sage-soft)]">Lux average</div>
                </StatCard>

                <StatCard title="Air Quality" icon={<Wind className="w-4 h-4" />} accent="var(--sage-soft)">
                    <p className="text-2xl font-bold text-[color:var(--forest-deep)]">{(stats.airQuality?.avg ?? 0).toFixed(0)}</p>
                    <div className="text-xs text-[color:var(--sage-soft)]">AQI average</div>
                </StatCard>
            </div>

            {/* Tabs */}
            <div className="space-y-6">
                <div className="inline-flex rounded-lg border border-[color:var(--sage-soft)]/30 bg-white/80 overflow-hidden">
                    <TabButton active={tab === "timeseries"} onClick={() => setTab("timeseries")}>Time Series</TabButton>
                    <TabButton active={tab === "comparison"} onClick={() => setTab("comparison")}>Location Comparison</TabButton>
                    <TabButton active={tab === "ecosystem"} onClick={() => setTab("ecosystem")}>Ecosystem Overview</TabButton>
                </div>

                {tab === "timeseries" && (
                    <div className="rounded-2xl border border-[color:var(--sage-soft)]/20 bg-white/90 backdrop-blur p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold text-[color:var(--forest-deep)]">Environmental Conditions Over Time</h3>
                            <div className="flex gap-2">
                                <SmallToggle label="Temperature" active={selectedMetric === "temperature"} onClick={() => setSelectedMetric("temperature")} />
                                <SmallToggle label="Humidity" active={selectedMetric === "humidity"} onClick={() => setSelectedMetric("humidity")} />
                                <SmallToggle label="Light" active={selectedMetric === "light"} onClick={() => setSelectedMetric("light")} />
                            </div>
                        </div>
                        <div className="h-[400px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={timeSeriesData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="dateLabel" tick={{ fontSize: 12 }} />
                                    <YAxis tick={{ fontSize: 12 }} />
                                    <Tooltip />
                                    <Line
                                        type="monotone"
                                        dataKey={selectedMetric === "temperature" ? "temperature_avg" : selectedMetric === "humidity" ? "humidity" : "light_exposure"}
                                        strokeWidth={2}
                                        dot={false}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {tab === "comparison" && (
                    <div className="rounded-2xl border border-[color:var(--sage-soft)]/20 bg-white/90 backdrop-blur p-4">
                        <h3 className="font-semibold text-[color:var(--forest-deep)] mb-3">Temperature Comparison by Location</h3>
                        <div className="h-[400px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={timeSeriesData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="locationName" tick={{ fontSize: 12 }} />
                                    <YAxis tick={{ fontSize: 12 }} />
                                    <Tooltip />
                                    <Bar dataKey="temperature_avg" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {tab === "ecosystem" && (
                    <div className="rounded-2xl border border-[color:var(--sage-soft)]/20 bg-white/90 backdrop-blur p-4">
                        <h3 className="font-semibold text-[color:var(--forest-deep)] mb-3">Ecosystem Profiles</h3>
                        {radarData.length ? (
                            <div className="h-[400px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart data={radarData} outerRadius={120}>
                                        <PolarGrid />
                                        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
                                        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
                                        <Radar name="Environmental Profile" dataKey="value" fillOpacity={0.3} strokeWidth={2} />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="p-8 text-center">
                                <Thermometer className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p className="text-[color:var(--sage-soft)]">Not enough data for ecosystem comparison</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function StatCard({ title, icon, accent, children }) {
    return (
        <div className="rounded-2xl border border-[color:var(--sage-soft)]/20 bg-white/90 backdrop-blur p-4">
            <div className="flex items-center gap-2 text-sm font-medium mb-2" style={{ color: "var(--forest-deep)" }}>
                <span className="inline-flex h-5 w-5 items-center justify-center" style={{ color: accent }}>{icon}</span>
                {title}
            </div>
            {children}
        </div>
    );
}

function TabButton({ active, onClick, children }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`px-3 py-2 text-sm ${
                active
                    ? "bg-[color:var(--forest-deep)] text-white"
                    : "text-[color:var(--forest-deep)] hover:bg-[color:var(--sage-soft)]/20"
            }`}
        >
            {children}
        </button>
    );
}

function SmallToggle({ label, active, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`px-2.5 py-1.5 rounded-lg text-xs border ${
                active
                    ? "bg-[color:var(--forest-deep)] text-white border-[color:var(--forest-deep)]"
                    : "bg-white text-[color:var(--forest-deep)] border-[color:var(--sage-soft)]/40 hover:bg-[color:var(--sage-soft)]/20"
            }`}
        >
            {label}
        </button>
    );
}
