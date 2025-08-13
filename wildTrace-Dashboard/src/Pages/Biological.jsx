import React, { useEffect, useMemo, useState } from "react";
import {
    AreaChart,
    Area,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    ScatterChart,
    Scatter,
    Cell,
} from "recharts";
import { Heart, Activity, Moon, TrendingUp } from "lucide-react";
import { format } from "date-fns";

/**
 * - `loaders` prop to plug API/entities
 *   loaders = {
 *     loadBiological: () => Promise<BiologicalData[]>,
 *     loadLocations: () => Promise<Location[]>
 *   }
 */

// --- Sample data (remove in prod) ---
const SAMPLE_LOCATIONS = [
    { id: "LOC-ECU-Quito", name: "Quito" },
    { id: "LOC-NAM-Sossus", name: "Sossusvlei" },
];
const SAMPLE_BIO = [
    {
        id: 1,
        location_id: "LOC-ECU-Quito",
        date: "2025-06-10",
        heart_rate_resting: 62,
        heart_rate_variability: 58,
        sleep_quality_score: 7.6,
        sleep_duration: 7.2,
        stress_level: 3,
    },
    {
        id: 2,
        location_id: "LOC-ECU-Quito",
        date: "2025-06-11",
        heart_rate_resting: 65,
        heart_rate_variability: 54,
        sleep_quality_score: 7.2,
        sleep_duration: 7.0,
        stress_level: 4,
    },
    {
        id: 3,
        location_id: "LOC-NAM-Sossus",
        date: "2025-07-05",
        heart_rate_resting: 58,
        heart_rate_variability: 72,
        sleep_quality_score: 8.8,
        sleep_duration: 8.1,
        stress_level: 2,
    },
    {
        id: 4,
        location_id: "LOC-NAM-Sossus",
        date: "2025-07-06",
        heart_rate_resting: 57,
        heart_rate_variability: 75,
        sleep_quality_score: 9.1,
        sleep_duration: 8.4,
        stress_level: 1,
    },
];

export default function Biological({ loaders }) {
    const [biologicalData, setBiologicalData] = useState([]);
    const [locations, setLocations] = useState([]);
    const [selectedLocation, setSelectedLocation] = useState("all");
    const [selectedMetric, setSelectedMetric] = useState("heart_rate");
    const [tab, setTab] = useState("timeline");
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setIsLoading(true);
            try {
                const [bio, locs] = await Promise.all([
                    loaders?.loadBiological?.() ?? Promise.resolve(SAMPLE_BIO),
                    loaders?.loadLocations?.() ?? Promise.resolve(SAMPLE_LOCATIONS),
                ]);
                if (!cancelled) {
                    setBiologicalData(bio ?? []);
                    setLocations(locs ?? []);
                }
            } catch (e) {
                // eslint-disable-next-line no-console
                console.error("Biological: load error", e);
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
        return found?.name ?? "Unknown Location";
    };

    const filtered = useMemo(() => {
        return selectedLocation === "all"
            ? biologicalData
            : biologicalData.filter((d) => d.location_id === selectedLocation);
    }, [biologicalData, selectedLocation]);

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

    const avg = (arr) => (arr.length ? arr.reduce((s, v) => s + (v ?? 0), 0) / arr.length : 0);

    const stats = useMemo(() => {
        if (!filtered.length) return {};
        return {
            heartRate: {
                avg: avg(filtered.map((d) => d.heart_rate_resting)),
                range: [
                    Math.min(...filtered.map((d) => d.heart_rate_resting ?? Number.POSITIVE_INFINITY)),
                    Math.max(...filtered.map((d) => d.heart_rate_resting ?? Number.NEGATIVE_INFINITY)),
                ],
            },
            hrv: { avg: avg(filtered.map((d) => d.heart_rate_variability)) },
            sleep: {
                avg: avg(filtered.map((d) => d.sleep_quality_score)),
                avgDuration: avg(filtered.map((d) => d.sleep_duration)),
            },
            stress: { avg: avg(filtered.map((d) => d.stress_level)) },
        };
    }, [filtered]);

    const calculateHarmonyScore = (d) => {
        const hrvScore = Math.min(100, ((d.heart_rate_variability ?? 0) / 50) * 100);
        const sleepScore = ((d.sleep_quality_score ?? 0) / 10) * 100;
        const stressScore = (((10 - (d.stress_level ?? 0)) / 10) * 100);
        return (hrvScore + sleepScore + stressScore) / 3;
    };

    const harmonyData = useMemo(() => {
        return filtered.map((d) => ({
            location: getLocationName(d.location_id),
            dateLabel: d.date ? format(new Date(d.date), "MMM d") : "",
            harmony_score: calculateHarmonyScore(d),
            stress_level: d.stress_level,
            sleep_quality: d.sleep_quality_score,
            hrv: d.heart_rate_variability,
            sleep_duration: d.sleep_duration,
            heart_rate_resting: d.heart_rate_resting,
        }));
    }, [filtered, locations]);

    const getStressColor = (level) => {
        if (level <= 3) return "#9caf88"; // Low -> sage
        if (level <= 6) return "#d4af37"; // Medium -> gold
        return "#c65d07"; // High -> terracotta
    };

    if (isLoading) {
        return (
            <div className="p-8 space-y-6">
                <div className="space-y-4">
                    <div className="h-8 w-64 bg-grey rounded animate-pulse" />
                    <div className="h-4 w-96 bg-grey rounded animate-pulse" />
                </div>
                <div className="grid md:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-32 bg-grey rounded-xl animate-pulse" />
                    ))}
                </div>
                <div className="h-96 bg-grey rounded-xl animate-pulse" />
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 space-y-8 bg-grey min-h-screen">
            <style>{`:root{--forest-deep:#1a2e1a;--sage-soft:#9caf88;--terracotta:#c65d07;--gold-accent:#d4af37;--navy-deep:#1e3a5f;--cream:#faf8f3;--stone:#e8e2d4;}`}</style>

            {/* Header */}
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-[color:var(--navy-deep)] to-[color:var(--terracotta)] rounded-xl flex items-center justify-center">
                        <Heart className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-[color:var(--forest-deep)] tracking-tight">Biological Responses</h1>
                        <p className="text-[color:var(--sage-soft)] font-medium">How your body adapted to each environment</p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 items-center">
                    <select
                        value={selectedLocation}
                        onChange={(e) => setSelectedLocation(e.target.value)}
                        className="w-48 bg-white/80 border border-[color:var(--sage-soft)]/30 rounded-lg px-3 py-2 text-sm"
                    >
                        <option value="all">All Locations</option>
                        {locations.map((loc) => (
                            <option key={loc.id} value={loc.id}>{loc.name}</option>
                        ))}
                    </select>
                    <span className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm bg-white/80 border-[color:var(--sage-soft)]/30">
            {filtered.length} biometric readings
          </span>
                </div>
            </div>

            {/* Stat cards */}
            <div className="grid md:grid-cols-4 gap-6">
                <StatCard title="Resting Heart Rate" icon={<Heart className="w-4 h-4" />} accent="var(--terracotta)">
                    <div className="space-y-2">
                        <p className="text-2xl font-bold text-[color:var(--forest-deep)]">{(stats.heartRate?.avg ?? 0).toFixed(0)} BPM</p>
                        <div className="text-xs text-[color:var(--sage-soft)]">
                            Range: {stats.heartRate?.range?.[0] ?? "-"}-{stats.heartRate?.range?.[1] ?? "-"} BPM
                        </div>
                    </div>
                </StatCard>

                <StatCard title="Heart Rate Variability" icon={<Activity className="w-4 h-4" />} accent="var(--navy-deep)">
                    <p className="text-2xl font-bold text-[color:var(--forest-deep)]">{(stats.hrv?.avg ?? 0).toFixed(0)}</p>
                    <div className="text-xs text-[color:var(--sage-soft)]">Higher = better recovery</div>
                </StatCard>

                <StatCard title="Sleep Quality" icon={<Moon className="w-4 h-4" />} accent="var(--gold-accent)">
                    <p className="text-2xl font-bold text-[color:var(--forest-deep)]">{(stats.sleep?.avg ?? 0).toFixed(1)}/10</p>
                    <div className="text-xs text-[color:var(--sage-soft)]">{(stats.sleep?.avgDuration ?? 0).toFixed(1)} hours avg</div>
                </StatCard>

                <StatCard title="Stress Level" icon={<TrendingUp className="w-4 h-4" />} accent="var(--sage-soft)">
                    <p className="text-2xl font-bold text-[color:var(--forest-deep)]">{(stats.stress?.avg ?? 0).toFixed(1)}/10</p>
                    <div className="text-xs text-[color:var(--sage-soft)]">Lower is better</div>
                </StatCard>
            </div>

            {/* Tabs */}
            <div className="space-y-6">
                <div className="inline-flex rounded-lg border border-[color:var(--sage-soft)]/30 bg-white/80 overflow-hidden">
                    <TabButton active={tab === "timeline"} onClick={() => setTab("timeline")}>Body Timeline</TabButton>
                    <TabButton active={tab === "harmony"} onClick={() => setTab("harmony")}>Harmony Zones</TabButton>
                    <TabButton active={tab === "correlations"} onClick={() => setTab("correlations")}>Environment vs Body</TabButton>
                </div>

                {tab === "timeline" && (
                    <div className="rounded-2xl border border-[color:var(--sage-soft)]/20 bg-white/90 backdrop-blur p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold text-[color:var(--forest-deep)]">Biological Response Timeline</h3>
                            <div className="flex gap-2">
                                <SmallToggle label="Heart Rate" active={selectedMetric === "heart_rate"} onClick={() => setSelectedMetric("heart_rate")} />
                                <SmallToggle label="Sleep Quality" active={selectedMetric === "sleep"} onClick={() => setSelectedMetric("sleep")} />
                                <SmallToggle label="Stress Level" active={selectedMetric === "stress"} onClick={() => setSelectedMetric("stress")} />
                                <SmallToggle label="HRV" active={selectedMetric === "hrv"} onClick={() => setSelectedMetric("hrv")} />
                            </div>
                        </div>
                        <div className="h-[400px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={timeSeriesData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="dateLabel" tick={{ fontSize: 12 }} />
                                    <YAxis tick={{ fontSize: 12 }} />
                                    <Tooltip />
                                    <Area
                                        type="monotone"
                                        dataKey={
                                            selectedMetric === "heart_rate"
                                                ? "heart_rate_resting"
                                                : selectedMetric === "sleep"
                                                    ? "sleep_quality_score"
                                                    : selectedMetric === "stress"
                                                        ? "stress_level"
                                                        : "heart_rate_variability"
                                        }
                                        fillOpacity={0.25}
                                        strokeWidth={2}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {tab === "harmony" && (
                    <div className="rounded-2xl border border-[color:var(--sage-soft)]/20 bg-white/90 backdrop-blur p-4">
                        <h3 className="font-semibold text-[color:var(--forest-deep)] mb-3">Harmony Zones</h3>
                        <div className="h-[400px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <ScatterChart data={harmonyData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="sleep_quality" name="Sleep Quality" tick={{ fontSize: 12 }} />
                                    <YAxis dataKey="hrv" name="HRV" tick={{ fontSize: 12 }} />
                                    <Tooltip
                                        cursor={{ strokeDasharray: "3 3" }}
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                const d = payload[0].payload;
                                                return (
                                                    <div className="bg-white/95 border border-[color:var(--sage-soft)]/30 rounded-lg p-3 shadow">
                                                        <p className="font-semibold text-[color:var(--forest-deep)]">{d.location}</p>
                                                        <p className="text-sm text-[color:var(--sage-soft)]">Sleep: {d.sleep_quality}/10</p>
                                                        <p className="text-sm text-[color:var(--sage-soft)]">HRV: {d.hrv}</p>
                                                        <p className="text-sm text-[color:var(--sage-soft)]">Stress: {d.stress_level}/10</p>
                                                        <p className="text-sm text-[color:var(--sage-soft)]">Harmony: {d.harmony_score.toFixed(0)}%</p>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    <Scatter name="Locations" dataKey="harmony_score">
                                        {harmonyData.map((entry, i) => (
                                            <Cell key={`c-${i}`} fill={getStressColor(entry.stress_level)} />
                                        ))}
                                    </Scatter>
                                </ScatterChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex justify-center gap-6 mt-4">
                            <LegendDot color="#9caf88" label="Low Stress" />
                            <LegendDot color="#d4af37" label="Medium Stress" />
                            <LegendDot color="#c65d07" label="High Stress" />
                        </div>
                    </div>
                )}

                {tab === "correlations" && (
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="rounded-2xl border border-[color:var(--sage-soft)]/20 bg-white/90 backdrop-blur p-4">
                            <h3 className="font-semibold text-[color:var(--forest-deep)] mb-3">Heart Rate vs Stress</h3>
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <ScatterChart data={timeSeriesData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="stress_level" name="Stress Level" tick={{ fontSize: 12 }} />
                                        <YAxis dataKey="heart_rate_resting" name="Resting HR" tick={{ fontSize: 12 }} />
                                        <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                                        <Scatter name="HR vs Stress" dataKey="heart_rate_resting" />
                                    </ScatterChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-[color:var(--sage-soft)]/20 bg-white/90 backdrop-blur p-4">
                            <h3 className="font-semibold text-[color:var(--forest-deep)] mb-3">Sleep vs Recovery</h3>
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <ScatterChart data={timeSeriesData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="sleep_duration" name="Sleep Hours" tick={{ fontSize: 12 }} />
                                        <YAxis dataKey="heart_rate_variability" name="HRV" tick={{ fontSize: 12 }} />
                                        <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                                        <Scatter name="Sleep vs HRV" dataKey="heart_rate_variability" />
                                    </ScatterChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Insights */}
            <div className="grid md:grid-cols-3 gap-6">
                <InsightCard title="Best Recovery" icon={<Activity className="w-4 h-4" />}>
                    {(() => {
                        if (!harmonyData.length) return <p className="text-[color:var(--sage-soft)]">No data available</p>;
                        const bestHRV = Math.max(...harmonyData.map((d) => d.hrv ?? 0));
                        const best = harmonyData.find((d) => d.hrv === bestHRV);
                        if (!best) return <p className="text-[color:var(--sage-soft)]">No data available</p>;
                        return (
                            <div>
                                <p className="font-semibold text-[color:var(--forest-deep)]">{best.location}</p>
                                <p className="text-sm text-[color:var(--sage-soft)] mt-1">HRV: {best.hrv} • Sleep: {best.sleep_quality}/10</p>
                            </div>
                        );
                    })()}
                </InsightCard>

                <InsightCard title="Best Sleep" icon={<Moon className="w-4 h-4" />}>
                    {(() => {
                        if (!harmonyData.length) return <p className="text-[color:var(--sage-soft)]">No data available</p>;
                        const bestSleep = Math.max(...harmonyData.map((d) => d.sleep_quality ?? 0));
                        const best = harmonyData.find((d) => d.sleep_quality === bestSleep);
                        if (!best) return <p className="text-[color:var(--sage-soft)]">No data available</p>;
                        return (
                            <div>
                                <p className="font-semibold text-[color:var(--forest-deep)]">{best.location}</p>
                                <p className="text-sm text-[color:var(--sage-soft)] mt-1">Quality: {best.sleep_quality}/10 • Stress: {best.stress_level}/10</p>
                            </div>
                        );
                    })()}
                </InsightCard>

                <InsightCard title="Calmest Environment" icon={<Heart className="w-4 h-4" />}>
                    {(() => {
                        if (!harmonyData.length) return <p className="text-[color:var(--sage-soft)]">No data available</p>;
                        const lowestStress = Math.min(...harmonyData.map((d) => d.stress_level ?? Number.POSITIVE_INFINITY));
                        const calmest = harmonyData.find((d) => d.stress_level === lowestStress);
                        if (!calmest) return <p className="text-[color:var(--sage-soft)]">No data available</p>;
                        return (
                            <div>
                                <p className="font-semibold text-[color:var(--forest-deep)]">{calmest.location}</p>
                                <p className="text-sm text-[color:var(--sage-soft)] mt-1">Stress: {calmest.stress_level}/10 • Harmony: {calmest.harmony_score.toFixed(0)}%</p>
                            </div>
                        );
                    })()}
                </InsightCard>
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
                active ? "bg-[color:var(--forest-deep)] text-white" : "text-[color:var(--forest-deep)] hover:bg-[color:var(--sage-soft)]/20"
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

function InsightCard({ title, icon, children }) {
    return (
        <div className="rounded-2xl border border-[color:var(--sage-soft)]/20 bg-white/90 backdrop-blur p-4">
            <div className="flex items-center gap-2 text-sm font-medium mb-2" style={{ color: "var(--forest-deep)" }}>
                <span>{icon}</span>
                {title}
            </div>
            {children}
        </div>
    );
}

function LegendDot({ color, label }) {
    return (
        <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-xs text-[color:var(--sage-soft)]">{label}</span>
        </div>
    );
}
