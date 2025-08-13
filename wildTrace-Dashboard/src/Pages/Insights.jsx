import React, { useEffect, useMemo, useState } from "react";
import { Brain, Lightbulb, TrendingUp, Heart, Thermometer, BookOpen, Sparkles, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";

/**
 * Insights (React-only)
 * - Tailwind v4-ready (index.css: `@import "tailwindcss";`)
 * - No shadcn/ui; tabs, badges, cards done with Tailwind
 * - Pluggable data + LLM via props
 *   props.loaders = {
 *     loadLocations: ()=>Promise<Location[]>,
 *     loadBiological: ()=>Promise<BiologicalData[]>,
 *     loadEnvironmental: ()=>Promise<EnvironmentalData[]>,
 *     loadJournal: ()=>Promise<JournalEntry[]>,
 *   }
 *   props.invoke?: ({prompt, schema}) => Promise<AIResponse>
 */

// ---- Fallback demo data ----
const SAMPLE_LOCATIONS = [
    { id: "LOC-ECU-Quito", name: "Quito", country: "Ecuador", arrival_date: "2025-06-09", departure_date: "2025-06-13" },
    { id: "LOC-NAM-Sossus", name: "Sossusvlei", country: "Namibia", arrival_date: "2025-07-04", departure_date: "2025-07-08" },
];
const SAMPLE_BIO = [
    { id: 1, location_id: "LOC-ECU-Quito", date: "2025-06-10T08:00:00Z", heart_rate_resting: 62, heart_rate_variability: 58, sleep_quality_score: 7.6, stress_level: 3 },
    { id: 2, location_id: "LOC-NAM-Sossus", date: "2025-07-05T08:00:00Z", heart_rate_resting: 58, heart_rate_variability: 72, sleep_quality_score: 8.8, stress_level: 2 },
];
const SAMPLE_ENV = [
    { id: 11, location_id: "LOC-ECU-Quito", date: "2025-06-10", temperature_avg: 14.2, humidity: 68, air_quality_index: 45 },
    { id: 12, location_id: "LOC-NAM-Sossus", date: "2025-07-05", temperature_avg: 28.5, humidity: 22, air_quality_index: 30 },
];
const SAMPLE_JOURNAL = [
    { id: "J100", location_id: "LOC-ECU-Quito", date: "2025-06-10", title: "Sky city", content: "Stepped into a city of light.", emotions: ["wonder", "curiosity", "calm"], mood_score: 8.2, highlight_moment: true },
    { id: "J101", location_id: "LOC-NAM-Sossus", date: "2025-07-06", title: "Singing dunes", content: "Wind wrote long notes across the sand.", emotions: ["peace", "joy"], mood_score: 9.1, highlight_moment: false },
];

export default function Insights({ loaders, invoke }) {
    const [data, setData] = useState({ locations: [], biological: [], environmental: [], journal: [] });
    const [insights, setInsights] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [tab, setTab] = useState("patterns");

    // Load all
    useEffect(() => {
        let cancelled = false;
        (async () => {
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
                console.error("Insights: load error", e);
            }
        })();
        return () => { cancelled = true; };
    }, [loaders]);

    const getLocationName = (id) => data.locations.find((l) => l.id === id)?.name ?? "Unknown";

    const topEmotions = useMemo(() => {
        const counts = new Map();
        for (const j of data.journal) for (const emo of j.emotions ?? []) counts.set(emo, (counts.get(emo) ?? 0) + 1);
        return [...counts.entries()].sort((a,b)=>b[1]-a[1]).slice(0,5).map(([emotion,count])=>({emotion,count}));
    }, [data.journal]);

    const locationInsights = useMemo(() => {
        const byLoc = new Map();
        for (const loc of data.locations) {
            const bio = data.biological.filter((b) => b.location_id === loc.id);
            const env = data.environmental.filter((e) => e.location_id === loc.id);
            const jour = data.journal.filter((j) => j.location_id === loc.id);
            if (!bio.length && !env.length && !jour.length) continue;
            byLoc.set(loc.name, {
                location: loc,
                biological: {
                    avg_heart_rate: avg(bio.map((x)=>x.heart_rate_resting)),
                    avg_hrv: avg(bio.map((x)=>x.heart_rate_variability)),
                    avg_sleep: avg(bio.map((x)=>x.sleep_quality_score)),
                    avg_stress: avg(bio.map((x)=>x.stress_level)),
                },
                environmental: {
                    avg_temp: avg(env.map((x)=>x.temperature_avg)),
                    avg_humidity: avg(env.map((x)=>x.humidity)),
                },
                mood: {
                    avg_mood: avg(jour.map((x)=>x.mood_score)),
                    highlight_moments: jour.filter((x)=>x.highlight_moment).length,
                },
            });
        }
        return [...byLoc.values()];
    }, [data]);

    const bestLocations = useMemo(() => {
        if (!locationInsights.length) return { best_sleep:null, lowest_stress:null, highest_mood:null, best_recovery:null };
        const cmp = (a,b,sel,rev=false)=> (rev? (a[sel]<b[sel]) : (a[sel]>b[sel])) ? b : a;
        const by = (pick) => locationInsights.reduce((best,curr)=> !best?curr : (pick(curr)>pick(best)?curr:best), null);
        return {
            best_sleep: by((x)=>x.biological.avg_sleep || 0),
            lowest_stress: locationInsights.reduce((best,curr)=> !best?curr : ((curr.biological.avg_stress||99) < (best.biological.avg_stress||99) ? curr:best), null),
            highest_mood: by((x)=>x.mood.avg_mood || 0),
            best_recovery: by((x)=>x.biological.avg_hrv || 0),
        };
    }, [locationInsights]);

    async function generateInsights() {
        setIsLoading(true);
        try {
            const summary = makeDataSummary(data, topEmotions);
            const schema = {
                type: "object",
                properties: {
                    key_patterns: { type: "array", items: { type: "object", properties: { title:{type:"string"}, description:{type:"string"}, data_support:{type:"string"}, significance:{ type:"string", enum:["high","medium","low"] } } } },
                    correlations: { type: "array", items: { type: "object", properties: { variables:{type:"string"}, relationship:{type:"string"}, strength:{ type:"string", enum:["strong","moderate","weak"] }, explanation:{type:"string"} } } },
                    recommendations: { type: "array", items: { type: "object", properties: { category:{type:"string"}, recommendation:{type:"string"}, reasoning:{type:"string"}, priority:{ type:"string", enum:["high","medium","low"] } } } },
                    discoveries: { type: "array", items: { type: "object", properties: { finding:{type:"string"}, surprise_factor:{ type:"string", enum:["very_surprising","somewhat_surprising","expected"] }, implications:{type:"string"} } } },
                },
            };

            let res;
            if (invoke) {
                res = await invoke({ prompt: buildPrompt(summary), schema });
            } else {
                // Fallback synthetic insights
                res = mockInsights(summary);
            }
            setInsights(res);
            setTab("patterns");
        } catch (e) {
            // eslint-disable-next-line no-console
            console.error("generateInsights error", e);
        } finally {
            setIsLoading(false);
        }
    }

    const barData = locationInsights.map((loc) => ({
        name: loc.location.name,
        sleep: loc.biological.avg_sleep ?? 0,
        stress: Math.max(0, 10 - (loc.biological.avg_stress ?? 0)), // invert for visual
        mood: loc.mood.avg_mood ?? 0,
        recovery: (loc.biological.avg_hrv ?? 0) / 5,
    }));

    return (
        <div className="p-4 md:p-8 space-y-8 bg-grey min-h-screen">
            <style>{`:root{--forest-deep:#1a2e1a;--sage-soft:#9caf88;--terracotta:#c65d07;--gold-accent:#d4af37;--navy-deep:#1e3a5f;--cream:#faf8f3;--stone:#e8e2d4;}`}</style>

            {/* Header */}
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-[color:var(--navy-deep)] to-[color:var(--gold-accent)] rounded-xl flex items-center justify-center">
                        <Brain className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-[color:var(--forest-deep)] tracking-tight">AI Insights</h1>
                        <p className="text-[color:var(--sage-soft)] font-medium">Patterns and discoveries from your living data</p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-3 items-center">
                    <button
                        type="button"
                        onClick={generateInsights}
                        disabled={isLoading}
                        className="inline-flex items-center gap-2 rounded-lg bg-[color:var(--forest-deep)] text-white px-3 py-2 text-sm disabled:opacity-60"
                    >
                        {isLoading ? (<><RefreshCw className="w-4 h-4 animate-spin" /> Analyzing...</>) : (<><Sparkles className="w-4 h-4" /> Generate New Insights</>)}
                    </button>

                    <span className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm bg-white/80 border-[color:var(--sage-soft)]/30">
            {data.locations.length} locations • {data.biological.length} bio readings • {data.journal.length} entries
          </span>
                </div>
            </div>

            {/* Quick stats */}
            <div className="grid md:grid-cols-4 gap-6">
                <StatCard title="Best Sleep Location" icon={<Heart className="w-4 h-4" />} accent="var(--terracotta)">
                    {bestLocations.best_sleep ? (
                        <div>
                            <p className="text-lg font-bold text-[color:var(--forest-deep)]">{bestLocations.best_sleep.location.name}</p>
                            <p className="text-sm text-[color:var(--sage-soft)]">{(bestLocations.best_sleep.biological.avg_sleep ?? 0).toFixed(1)}/10 quality</p>
                        </div>
                    ) : (<p className="text-[color:var(--sage-soft)]">No data</p>)}
                </StatCard>
                <StatCard title="Lowest Stress" icon={<Thermometer className="w-4 h-4" />} accent="var(--navy-deep)">
                    {bestLocations.lowest_stress ? (
                        <div>
                            <p className="text-lg font-bold text-[color:var(--forest-deep)]">{bestLocations.lowest_stress.location.name}</p>
                            <p className="text-sm text-[color:var(--sage-soft)]">{(bestLocations.lowest_stress.biological.avg_stress ?? 0).toFixed(1)}/10 stress</p>
                        </div>
                    ) : (<p className="text-[color:var(--sage-soft)]">No data</p>)}
                </StatCard>
                <StatCard title="Highest Mood" icon={<BookOpen className="w-4 h-4" />} accent="var(--gold-accent)">
                    {bestLocations.highest_mood ? (
                        <div>
                            <p className="text-lg font-bold text-[color:var(--forest-deep)]">{bestLocations.highest_mood.location.name}</p>
                            <p className="text-sm text-[color:var(--sage-soft)]">{(bestLocations.highest_mood.mood.avg_mood ?? 0).toFixed(1)}/10 mood</p>
                        </div>
                    ) : (<p className="text-[color:var(--sage-soft)]">No data</p>)}
                </StatCard>
                <StatCard title="Best Recovery" icon={<TrendingUp className="w-4 h-4" />} accent="var(--sage-soft)">
                    {bestLocations.best_recovery ? (
                        <div>
                            <p className="text-lg font-bold text-[color:var(--forest-deep)]">{bestLocations.best_recovery.location.name}</p>
                            <p className="text-sm text-[color:var(--sage-soft)]">HRV {(bestLocations.best_recovery.biological.avg_hrv ?? 0).toFixed(0)}</p>
                        </div>
                    ) : (<p className="text-[color:var(--sage-soft)]">No data</p>)}
                </StatCard>
            </div>

            {/* Tabs (only when insights exist) */}
            {insights && (
                <div className="space-y-6">
                    <div className="inline-flex rounded-lg border border-[color:var(--sage-soft)]/30 bg-white/80 overflow-hidden">
                        <TabButton active={tab === "patterns"} onClick={()=>setTab("patterns")}>Key Patterns</TabButton>
                        <TabButton active={tab === "correlations"} onClick={()=>setTab("correlations")}>Correlations</TabButton>
                        <TabButton active={tab === "recommendations"} onClick={()=>setTab("recommendations")}>Recommendations</TabButton>
                        <TabButton active={tab === "discoveries"} onClick={()=>setTab("discoveries")}>Discoveries</TabButton>
                    </div>

                    {tab === "patterns" && (
                        <div className="space-y-4">
                            {(insights.key_patterns ?? []).map((p, i) => (
                                <CardRow key={`pat-${i}`} title={p.title} badge={p.significance} badgePalette={{high:"terracotta", medium:"gold-accent", low:"sage-soft"}}>
                                    <p className="text-[color:var(--forest-deep)] leading-relaxed">{p.description}</p>
                                    {p.data_support && (
                                        <div className="p-3 bg-[color:var(--stone)]/10 rounded-lg mt-2">
                                            <p className="text-sm text-[color:var(--sage-soft)]"><strong>Data Support:</strong> {p.data_support}</p>
                                        </div>
                                    )}
                                </CardRow>
                            ))}
                        </div>
                    )}

                    {tab === "correlations" && (
                        <div className="space-y-4">
                            {(insights.correlations ?? []).map((c, i) => (
                                <CardRow key={`cor-${i}`} title={c.variables} badge={c.strength} badgePalette={{strong:"terracotta", moderate:"gold-accent", weak:"sage-soft"}}>
                                    <p className="text-[color:var(--forest-deep)] font-medium">{c.relationship}</p>
                                    <p className="text-[color:var(--sage-soft)] leading-relaxed">{c.explanation}</p>
                                </CardRow>
                            ))}
                        </div>
                    )}

                    {tab === "recommendations" && (
                        <div className="space-y-4">
                            {(insights.recommendations ?? []).map((r, i) => (
                                <CardRow key={`rec-${i}`} title={r.recommendation} prefixBadge={r.category} badge={r.priority} badgePalette={{high:"terracotta", medium:"gold-accent", low:"sage-soft"}}>
                                    <p className="text-[color:var(--sage-soft)] leading-relaxed">{r.reasoning}</p>
                                </CardRow>
                            ))}
                        </div>
                    )}

                    {tab === "discoveries" && (
                        <div className="space-y-4">
                            {(insights.discoveries ?? []).map((d, i) => (
                                <CardRow key={`disc-${i}`} title={d.finding} icon={<Lightbulb className="w-5 h-5" style={{color:"var(--gold-accent)"}}/>} badge={d.surprise_factor?.replace("_"," ")} badgePalette={{very_surprising:"terracotta", somewhat_surprising:"gold-accent", expected:"sage-soft"}}>
                                    <p className="text-[color:var(--sage-soft)] leading-relaxed">{d.implications}</p>
                                </CardRow>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Location comparison chart */}
            {!!locationInsights.length && (
                <div className="rounded-2xl border border-[color:var(--sage-soft)]/20 bg-white/90 backdrop-blur p-5">
                    <h3 className="font-semibold text-[color:var(--forest-deep)] mb-3">Location Well‑being Comparison</h3>
                    <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={barData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#9caf88" opacity={0.3} />
                            <XAxis dataKey="name" stroke="#9caf88" fontSize={12} />
                            <YAxis stroke="#9caf88" fontSize={12} />
                            <Tooltip contentStyle={{ background:"rgba(255,255,255,0.95)", border:"1px solid #9caf88", borderRadius:8 }} />
                            <Bar dataKey="sleep" fill="#d4af37" name="Sleep Quality" />
                            <Bar dataKey="stress" fill="#9caf88" name="Low Stress" />
                            <Bar dataKey="mood" fill="#c65d07" name="Mood" />
                            <Bar dataKey="recovery" fill="#1e3a5f" name="Recovery" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}

            {!insights && !isLoading && (
                <div className="rounded-2xl border border-[color:var(--sage-soft)]/20 bg-white/90 backdrop-blur p-12 text-center">
                    <Brain className="w-16 h-16 mx-auto mb-6 opacity-50" />
                    <h3 className="text-xl font-bold text-[color:var(--forest-deep)] mb-4">Ready to Discover Insights</h3>
                    <p className="text-[color:var(--sage-soft)] mb-6 max-w-md mx-auto">Click "Generate New Insights" to analyze your data and surface patterns about how different environments affected your well‑being.</p>
                    <button type="button" onClick={generateInsights} className="rounded-lg bg-[color:var(--forest-deep)] text-white px-3 py-2 text-sm">Start Analysis</button>
                </div>
            )}
        </div>
    );
}

// ---------- helpers ----------
const avg = (arr) => (arr.length ? arr.reduce((s,v)=>s+(Number(v)||0),0)/arr.length : 0);

function makeDataSummary(data, topEmotions) {
    return {
        locations: data.locations.map((l)=>({ name:l.name, country:l.country, arrival_date:l.arrival_date, departure_date:l.departure_date })),
        biological_summary: {
            total_readings: data.biological.length,
            avg_heart_rate: avg(data.biological.map((d)=>d.heart_rate_resting)),
            avg_hrv: avg(data.biological.map((d)=>d.heart_rate_variability)),
            avg_sleep_quality: avg(data.biological.map((d)=>d.sleep_quality_score)),
            avg_stress: avg(data.biological.map((d)=>d.stress_level)),
        },
        environmental_summary: {
            total_readings: data.environmental.length,
            avg_temperature: avg(data.environmental.map((d)=>d.temperature_avg)),
            avg_humidity: avg(data.environmental.map((d)=>d.humidity)),
            avg_air_quality: avg(data.environmental.map((d)=>d.air_quality_index)),
        },
        journal_summary: {
            total_entries: data.journal.length,
            highlight_moments: data.journal.filter((j)=>j.highlight_moment).length,
            avg_mood: avg(data.journal.map((j)=>j.mood_score)),
            common_emotions: topEmotions,
        },
    };
}

function buildPrompt(summary) {
    return `You are an expert data analyst specializing in human-environment interactions and biometric analysis. Analyze the following travel and biometric data to provide deep insights about how different environments affected this person's physical and emotional well-being.\n\nData Summary:\n${JSON.stringify(summary, null, 2)}\n\nPlease provide:\n1. Key patterns in how environment affected biology (heart rate, sleep, stress)\n2. Interesting correlations between location, weather, and mood\n3. Specific recommendations for optimal environments based on the data\n4. Surprising discoveries or anomalies in the data\n5. Suggestions for future travel or lifestyle optimization\n\nBe insightful, specific, and focus on actionable findings. Use the person's actual data points.`;
}

function mockInsights(summary){
    const hotBetterSleep = summary.environmental_summary.avg_temperature > 20;
    return {
        key_patterns: [
            { title:"Warmer climates ↗ sleep quality", description:"Average sleep scores were higher on warmer days.", data_support:`Avg temp ${summary.environmental_summary.avg_temperature?.toFixed?.(1)}°C vs sleep ${summary.biological_summary.avg_sleep_quality?.toFixed?.(1)}/10`, significance:"high" },
            { title:"Lower stress with higher HRV", description:"HRV rises when reported stress is low.", data_support:`HRV ${summary.biological_summary.avg_hrv?.toFixed?.(0)} and stress ${summary.biological_summary.avg_stress?.toFixed?.(1)}/10`, significance:"medium" },
        ],
        correlations: [
            { variables:"Humidity × Mood", relationship:"Mood increases slightly as humidity decreases", strength:"moderate", explanation:"Dryer air coincided with higher mood scores." },
            { variables:"AQI × HRV", relationship:"Better air → better recovery", strength:"weak", explanation:"Lower AQI aligned with higher HRV averages." },
        ],
        recommendations: [
            { category:"Itinerary", recommendation: hotBetterSleep?"Prioritize warm, dry locations":"Avoid excessive heat; prefer temperate zones", reasoning:"Based on temperature-sleep relation.", priority:"high" },
            { category:"Recovery", recommendation:"Schedule lighter days after travel", reasoning:"HRV dips around travel windows; recovery days help.", priority:"medium" },
            { category:"Sleep", recommendation:"Sunset walks 30–45 min", reasoning:"Light exposure timing improved sleep quality in records.", priority:"low" },
        ],
        discoveries: [
            { finding:"Short, intense days ≠ worse mood", surprise_factor:"somewhat_surprising", implications:"Mood remained high even on active days—balance volume with recovery." },
        ],
    };
}

function StatCard({ title, icon, accent, children }){
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

function TabButton({ active, onClick, children }){
    return (
        <button type="button" onClick={onClick} className={`px-3 py-2 text-sm ${active?"bg-[color:var(--forest-deep)] text-white":"text-[color:var(--forest-deep)] hover:bg-[color:var(--sage-soft)]/20"}`}>{children}</button>
    );
}

function CardRow({ title, children, icon, badge, badgePalette, prefixBadge }){
    const palette = {
        "terracotta":"var(--terracotta)",
        "gold-accent":"var(--gold-accent)",
        "sage-soft":"var(--sage-soft)",
    };
    const badgeColor = badgePalette?.[badge] && palette[badgePalette[badge]] ? palette[badgePalette[badge]] : "var(--sage-soft)";
    return (
        <div className="rounded-2xl border border-[color:var(--sage-soft)]/20 bg-white/90 backdrop-blur p-5">
            <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                    {icon}
                    <h4 className="font-semibold text-[color:var(--forest-deep)]">{title}</h4>
                </div>
                <div className="flex items-center gap-2">
                    {prefixBadge && <span className="text-xs rounded-full border px-2 py-0.5" style={{color:"var(--forest-deep)", borderColor:"var(--forest-deep)"}}>{prefixBadge}</span>}
                    {badge && <span className="text-xs rounded-full border px-2 py-0.5" style={{ color: badgeColor, borderColor: badgeColor }}>{badge}</span>}
                </div>
            </div>
            <div>{children}</div>
        </div>
    );
}
