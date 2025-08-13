import React, { useEffect, useMemo, useState } from "react";
import { Database, Download, FileText, Calendar, MapPin, Star } from "lucide-react";
import { format } from "date-fns";

/**
 * - `loaders` prop to plug API/entities
 *   loaders = {
 *     loadLocations: () => Promise<Location[]>,
 *     loadBiological: () => Promise<BiologicalData[]>,
 *     loadEnvironmental: () => Promise<EnvironmentalData[]>,
 *     loadJournal: () => Promise<JournalEntry[]>
 *   }
 */

// --- Sample data (remove in prod) ---
const SAMPLE_LOCATIONS = [
    { id: "LOC-ECU-Quito", name: "Quito", country: "Ecuador", latitude: -0.18, longitude: -78.47, arrival_date: "2025-06-09", departure_date: "2025-06-13", description: "High-altitude city" },
    { id: "LOC-NAM-Sossus", name: "Sossusvlei", country: "Namibia", latitude: -24.73, longitude: 15.30, arrival_date: "2025-07-04", departure_date: "2025-07-08", description: "Sand dunes" },
];
const SAMPLE_BIO = [
    { id: 1, location_id: "LOC-ECU-Quito", date: "2025-06-10T08:00:00Z", heart_rate_resting: 62, heart_rate_active: 122, heart_rate_variability: 58, body_temperature: 36.6, sleep_quality_score: 7.6, sleep_duration: 7.2, respiratory_rate: 13, activity_level: 0.6, stress_level: 3 },
    { id: 2, location_id: "LOC-NAM-Sossus", date: "2025-07-05T08:00:00Z", heart_rate_resting: 58, heart_rate_active: 118, heart_rate_variability: 72, body_temperature: 36.7, sleep_quality_score: 8.8, sleep_duration: 8.1, respiratory_rate: 12, activity_level: 0.7, stress_level: 2 },
];
const SAMPLE_ENV = [
    { id: 11, location_id: "LOC-ECU-Quito", date: "2025-06-10", temperature_avg: 14.2, temperature_min: 9.7, temperature_max: 18.3, humidity: 68, light_exposure: 4200, air_quality_index: 45, noise_level: 37, weather_condition: "partly cloudy" },
    { id: 12, location_id: "LOC-NAM-Sossus", date: "2025-07-05", temperature_avg: 28.5, temperature_min: 21.0, temperature_max: 34.1, humidity: 22, light_exposure: 9800, air_quality_index: 30, noise_level: 28, weather_condition: "clear" },
];
const SAMPLE_JOURNAL = [
    { id: "J100", location_id: "LOC-ECU-Quito", date: "2025-06-10", title: "Sky city", content: "Stepped into a city of light.", emotions: ["wonder", "curiosity", "calm"], mood_score: 8.2, highlight_moment: true },
    { id: "J101", location_id: "LOC-NAM-Sossus", date: "2025-07-06", title: "Singing dunes", content: "Wind wrote long notes across the sand.", emotions: ["peace", "joy"], mood_score: 9.1, highlight_moment: false },
];

export default function DataArchive({ loaders }) {
    const [data, setData] = useState({ locations: [], biological: [], environmental: [], journal: [] });
    const [isLoading, setIsLoading] = useState(true);
    const [tab, setTab] = useState("locations");
    const [isExporting, setIsExporting] = useState(false);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setIsLoading(true);
            try {
                const [locs, bio, env, jour] = await Promise.all([
                    loaders?.loadLocations?.() ?? Promise.resolve(SAMPLE_LOCATIONS),
                    loaders?.loadBiological?.() ?? Promise.resolve(SAMPLE_BIO),
                    loaders?.loadEnvironmental?.() ?? Promise.resolve(SAMPLE_ENV),
                    loaders?.loadJournal?.() ?? Promise.resolve(SAMPLE_JOURNAL),
                ]);
                if (!cancelled) setData({ locations: locs ?? [], biological: bio ?? [], environmental: env ?? [], journal: jour ?? [] });
            } catch (e) {
                // eslint-disable-next-line no-console
                console.error("DataArchive: load error", e);
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [loaders]);

    const getLocationName = (id) => data.locations.find((l) => l.id === id)?.name ?? "Unknown";

    const exportToCSV = (rows, filename, headers) => {
        if (!rows?.length) return;
        const csv = [
            headers.join(","),
            ...rows.map((r) => headers.map((h) => {
                let v = r[h];
                if (Array.isArray(v)) v = v.join("; ");
                if (v === null || v === undefined) v = "";
                v = String(v);
                if (v.includes(",") || v.includes("\n") || v.includes("\"")) v = '"' + v.replaceAll('"', '""') + '"';
                return v;
            }).join(",")),
        ].join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `${filename}.csv`;
        document.body.appendChild(link);
        link.click();
        link.remove();
    };

    const exportAll = async () => {
        setIsExporting(true);
        try {
            exportToCSV(data.locations, "locations", [
                "name", "country", "latitude", "longitude", "arrival_date", "departure_date", "description",
            ]);
            const bioRows = data.biological.map((b) => ({
                ...b,
                location_name: getLocationName(b.location_id),
                date: b.date ? format(new Date(b.date), "yyyy-MM-dd HH:mm:ss") : "",
            }));
            exportToCSV(bioRows, "biological_data", [
                "location_name", "date", "heart_rate_resting", "heart_rate_active", "heart_rate_variability",
                "body_temperature", "sleep_quality_score", "sleep_duration", "respiratory_rate", "activity_level", "stress_level",
            ]);
            const envRows = data.environmental.map((e) => ({
                ...e,
                location_name: getLocationName(e.location_id),
                date: e.date ? format(new Date(e.date), "yyyy-MM-dd") : "",
            }));
            exportToCSV(envRows, "environmental_data", [
                "location_name", "date", "temperature_avg", "temperature_min", "temperature_max",
                "humidity", "light_exposure", "air_quality_index", "noise_level", "weather_condition",
            ]);
            const jourRows = data.journal.map((j) => ({
                ...j,
                location_name: getLocationName(j.location_id),
                date: j.date ? format(new Date(j.date), "yyyy-MM-dd") : "",
                emotions: Array.isArray(j.emotions) ? j.emotions.join("; ") : j.emotions,
            }));
            exportToCSV(jourRows, "journal_entries", [
                "location_name", "date", "title", "content", "emotions", "mood_score", "highlight_moment",
            ]);
        } catch (e) {
            // eslint-disable-next-line no-console
            console.error("exportAll error", e);
        } finally {
            setIsExporting(false);
        }
    };

    const totals = useMemo(() => ({
        locations: data.locations.length,
        biological: data.biological.length,
        environmental: data.environmental.length,
        journal: data.journal.length,
    }), [data]);

    if (isLoading) {
        return (
            <div className="p-8 space-y-6">
                <div className="space-y-4">
                    <div className="h-8 w-64 bg-[color:var(--stone)]/20 rounded animate-pulse" />
                    <div className="h-4 w-96 bg-[color:var(--stone)]/20 rounded animate-pulse" />
                </div>
                <div className="h-96 bg-[color:var(--stone)]/20 rounded-xl animate-pulse" />
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 space-y-8 bg-grey min-h-screen">
            <style>{`:root{--forest-deep:#1a2e1a;--sage-soft:#9caf88;--terracotta:#c65d07;--gold-accent:#d4af37;--navy-deep:#1e3a5f;--cream:#faf8f3;--stone:#e8e2d4;}`}</style>

            {/* Header */}
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-[color:var(--stone)] to-[color:var(--sage-soft)] rounded-xl flex items-center justify-center">
                        <Database className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-[color:var(--forest-deep)] tracking-tight">Data Archive</h1>
                        <p className="text-[color:var(--sage-soft)] font-medium">Your complete dataset for analysis and backup</p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-3 items-center">
                    <button
                        type="button"
                        onClick={exportAll}
                        disabled={isExporting}
                        className="inline-flex items-center gap-2 rounded-lg bg-[color:var(--forest-deep)] text-white px-3 py-2 text-sm disabled:opacity-60"
                    >
                        {isExporting ? (
                            <>
                                <span className="w-4 h-4 mr-1 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Exporting...
                            </>
                        ) : (
                            <>
                                <Download className="w-4 h-4" /> Export All Data
                            </>
                        )}
                    </button>

                    <span className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm bg-white/80 border-[color:var(--sage-soft)]/30">{totals.locations} locations</span>
                    <span className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm bg-white/80 border-[color:var(--sage-soft)]/30">{totals.biological} bio readings</span>
                    <span className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm bg-white/80 border-[color:var(--sage-soft)]/30">{totals.environmental} env readings</span>
                    <span className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm bg-white/80 border-[color:var(--sage-soft)]/30">{totals.journal} journal entries</span>
                </div>
            </div>

            {/* Overview cards */}
            <div className="grid md:grid-cols-4 gap-6">
                <StatCard title="Locations" icon={<MapPin className="w-4 h-4" />} accent="var(--terracotta)">
                    <p className="text-2xl font-bold text-[color:var(--forest-deep)]">{totals.locations}</p>
                    <div className="text-xs text-[color:var(--sage-soft)]">
                        {data.locations.length > 0 && (
                            <span>
                {format(new Date(data.locations[0]?.arrival_date), "MMM yyyy")} – {format(new Date(data.locations[data.locations.length - 1]?.departure_date || data.locations[data.locations.length - 1]?.arrival_date), "MMM yyyy")}
              </span>
                        )}
                    </div>
                </StatCard>

                <StatCard title="Biometric Data" icon={<FileText className="w-4 h-4" />} accent="var(--navy-deep)">
                    <p className="text-2xl font-bold text-[color:var(--forest-deep)]">{totals.biological}</p>
                    <div className="text-xs text-[color:var(--sage-soft)]">Heart rate, sleep, stress</div>
                </StatCard>

                <StatCard title="Environmental Data" icon={<FileText className="w-4 h-4" />} accent="var(--gold-accent)">
                    <p className="text-2xl font-bold text-[color:var(--forest-deep)]">{totals.environmental}</p>
                    <div className="text-xs text-[color:var(--sage-soft)]">Climate and conditions</div>
                </StatCard>

                <StatCard title="Journal Entries" icon={<FileText className="w-4 h-4" />} accent="var(--sage-soft)">
                    <p className="text-2xl font-bold text-[color:var(--forest-deep)]">{totals.journal}</p>
                    <div className="text-xs text-[color:var(--sage-soft)]">Stories and emotions</div>
                </StatCard>
            </div>

            {/* Tabs */}
            <div className="space-y-6">
                <div className="inline-flex rounded-lg border border-[color:var(--sage-soft)]/30 bg-white/80 overflow-hidden">
                    <TabButton active={tab === "locations"} onClick={() => setTab("locations")}>Locations</TabButton>
                    <TabButton active={tab === "biological"} onClick={() => setTab("biological")}>Biological</TabButton>
                    <TabButton active={tab === "environmental"} onClick={() => setTab("environmental")}>Environmental</TabButton>
                    <TabButton active={tab === "journal"} onClick={() => setTab("journal")}>Journal</TabButton>
                </div>

                {tab === "locations" && (
                    <div className="rounded-2xl border border-[color:var(--sage-soft)]/20 bg-white/90 backdrop-blur p-4 overflow-x-auto">
                        <h3 className="font-semibold text-[color:var(--forest-deep)] mb-3">Location Data</h3>
                        <table className="w-full text-sm">
                            <thead>
                            <tr className="text-left border-b border-[color:var(--stone)]/30">
                                <th className="py-2 pr-4">Name</th>
                                <th className="py-2 pr-4">Country</th>
                                <th className="py-2 pr-4">Coordinates</th>
                                <th className="py-2 pr-4">Arrival</th>
                                <th className="py-2 pr-4">Departure</th>
                                <th className="py-2 pr-4">Duration</th>
                            </tr>
                            </thead>
                            <tbody>
                            {data.locations.map((l) => {
                                const arr = l.arrival_date ? new Date(l.arrival_date) : null;
                                const dep = l.departure_date ? new Date(l.departure_date) : null;
                                const duration = arr && dep ? Math.ceil((dep - arr) / (1000 * 60 * 60 * 24)) : null;
                                return (
                                    <tr key={l.id} className="border-b border-[color:var(--stone)]/20">
                                        <td className="py-2 pr-4 font-medium">{l.name}</td>
                                        <td className="py-2 pr-4">{l.country}</td>
                                        <td className="py-2 pr-4">{Number(l.latitude).toFixed(3)}, {Number(l.longitude).toFixed(3)}</td>
                                        <td className="py-2 pr-4">{arr ? format(arr, "MMM d, yyyy") : "-"}</td>
                                        <td className="py-2 pr-4">{dep ? format(dep, "MMM d, yyyy") : "-"}</td>
                                        <td className="py-2 pr-4">{duration ? `${duration} days` : "-"}</td>
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                    </div>
                )}

                {tab === "biological" && (
                    <div className="rounded-2xl border border-[color:var(--sage-soft)]/20 bg-white/90 backdrop-blur p-4 overflow-x-auto">
                        <h3 className="font-semibold text-[color:var(--forest-deep)] mb-3">Biological Data</h3>
                        <table className="w-full text-sm">
                            <thead>
                            <tr className="text-left border-b border-[color:var(--stone)]/30">
                                <th className="py-2 pr-4">Date</th>
                                <th className="py-2 pr-4">Location</th>
                                <th className="py-2 pr-4">Heart Rate</th>
                                <th className="py-2 pr-4">HRV</th>
                                <th className="py-2 pr-4">Sleep Quality</th>
                                <th className="py-2 pr-4">Stress</th>
                            </tr>
                            </thead>
                            <tbody>
                            {data.biological.slice(0, 20).map((b) => (
                                <tr key={b.id} className="border-b border-[color:var(--stone)]/20">
                                    <td className="py-2 pr-4">{b.date ? format(new Date(b.date), "MMM d, yyyy") : "-"}</td>
                                    <td className="py-2 pr-4">{getLocationName(b.location_id)}</td>
                                    <td className="py-2 pr-4">{b.heart_rate_resting} BPM</td>
                                    <td className="py-2 pr-4">{b.heart_rate_variability}</td>
                                    <td className="py-2 pr-4">{b.sleep_quality_score}/10</td>
                                    <td className="py-2 pr-4">{b.stress_level}/10</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                        {data.biological.length > 20 && (
                            <div className="text-center py-3 text-[color:var(--sage-soft)] text-sm">Showing first 20 entries of {data.biological.length} total</div>
                        )}
                    </div>
                )}

                {tab === "environmental" && (
                    <div className="rounded-2xl border border-[color:var(--sage-soft)]/20 bg-white/90 backdrop-blur p-4 overflow-x-auto">
                        <h3 className="font-semibold text-[color:var(--forest-deep)] mb-3">Environmental Data</h3>
                        <table className="w-full text-sm">
                            <thead>
                            <tr className="text-left border-b border-[color:var(--stone)]/30">
                                <th className="py-2 pr-4">Date</th>
                                <th className="py-2 pr-4">Location</th>
                                <th className="py-2 pr-4">Temperature</th>
                                <th className="py-2 pr-4">Humidity</th>
                                <th className="py-2 pr-4">Air Quality</th>
                                <th className="py-2 pr-4">Conditions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {data.environmental.slice(0, 20).map((e) => (
                                <tr key={e.id} className="border-b border-[color:var(--stone)]/20">
                                    <td className="py-2 pr-4">{e.date ? format(new Date(e.date), "MMM d, yyyy") : "-"}</td>
                                    <td className="py-2 pr-4">{getLocationName(e.location_id)}</td>
                                    <td className="py-2 pr-4">{e.temperature_avg}°C</td>
                                    <td className="py-2 pr-4">{e.humidity}%</td>
                                    <td className="py-2 pr-4">{e.air_quality_index} AQI</td>
                                    <td className="py-2 pr-4 capitalize">{e.weather_condition}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                        {data.environmental.length > 20 && (
                            <div className="text-center py-3 text-[color:var(--sage-soft)] text-sm">Showing first 20 entries of {data.environmental.length} total</div>
                        )}
                    </div>
                )}

                {tab === "journal" && (
                    <div className="rounded-2xl border border-[color:var(--sage-soft)]/20 bg-white/90 backdrop-blur p-4">
                        <h3 className="font-semibold text-[color:var(--forest-deep)] mb-3">Journal Entries</h3>
                        <div className="space-y-4">
                            {data.journal.slice(0, 10).map((j) => (
                                <div key={j.id} className="p-4 border border-[color:var(--stone)]/30 rounded-lg space-y-2">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-semibold text-[color:var(--forest-deep)]">{j.title}</h4>
                                        <div className="flex items-center gap-2 text-sm text-[color:var(--sage-soft)]">
                                            <span>{getLocationName(j.location_id)}</span>
                                            <span>•</span>
                                            <span>{j.date ? format(new Date(j.date), "MMM d, yyyy") : "-"}</span>
                                            {j.mood_score && (<><span>•</span><span>{j.mood_score}/10</span></>)}
                                        </div>
                                    </div>
                                    <p className="text-sm text-[color:var(--sage-soft)] leading-relaxed">
                                        {j.content?.length > 200 ? `${j.content.slice(0, 200)}...` : j.content}
                                    </p>
                                    {!!j.emotions?.length && (
                                        <div className="flex gap-1 flex-wrap">
                                            {j.emotions.slice(0, 4).map((emo, i) => (
                                                <span key={`${j.id}-emo-${i}`} className="text-xs rounded-full border px-2 py-0.5 bg-[color:var(--sage-soft)]/20 border-[color:var(--sage-soft)]/30">{emo}</span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                            {data.journal.length > 10 && (
                                <div className="text-center py-3 text-[color:var(--sage-soft)] text-sm">Showing first 10 entries of {data.journal.length} total</div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Documentation */}
            <div className="rounded-2xl border border-[color:var(--sage-soft)]/20 bg-white/90 backdrop-blur p-5">
                <h3 className="font-semibold text-[color:var(--forest-deep)] mb-2">Data Documentation</h3>
                <section className="prose prose-stone max-w-none">
                    <h4>Dataset Overview</h4>
                    <p className="text-[color:var(--sage-soft)]">This dashboard contains a comprehensive dataset of your travel journey, combining location data, environmental conditions, biological responses, and personal reflections.</p>
                    <h4>Data Sources & Methodology</h4>
                    <ul className="text-[color:var(--sage-soft)]">
                        <li><strong>Location Data:</strong> GPS coordinates, arrival/departure dates, and personal notes</li>
                        <li><strong>Environmental Data:</strong> Temperature, humidity, air quality, noise levels from local sensors and APIs</li>
                        <li><strong>Biological Data:</strong> Heart rate, HRV, sleep quality, and stress measurements from wearable devices</li>
                        <li><strong>Journal Entries:</strong> Personal reflections, emotions, and highlight moments</li>
                    </ul>
                    <h4>Data Quality & Considerations</h4>
                    <ul className="text-[color:var(--sage-soft)]">
                        <li>All biological data is self-reported or from personal wearable devices</li>
                        <li>Environmental data may vary based on local measurement conditions</li>
                        <li>Journal entries represent subjective experiences and emotional states</li>
                        <li>Data gaps may exist due to device availability or connectivity issues</li>
                    </ul>
                    <h4>Usage & Privacy</h4>
                    <p className="text-[color:var(--sage-soft)]">This data is personal and should be handled according to your privacy preferences. When sharing or publishing insights, consider anonymizing location details and personal information.</p>
                </section>
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
            className={`px-3 py-2 text-sm ${active ? "bg-[color:var(--forest-deep)] text-white" : "text-[color:var(--forest-deep)] hover:bg-[color:var(--sage-soft)]/20"}`}
        >
            {children}
        </button>
    );
}
