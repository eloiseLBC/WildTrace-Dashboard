import React, { useEffect, useMemo, useState } from "react";
import { BookOpen, Heart, Star, MapPin, Calendar, Plus, Search, Image as ImageIcon, Mic } from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

/**
 * - `loaders` to plug backend/entities
 *   loaders = {
 *     loadEntries: () => Promise<JournalEntry[]>,
 *     loadLocations: () => Promise<Location[]>,
 *     createEntry?: (payload) => Promise<void>
 *   }
 */

const EMOTIONS = [
    "calm",
    "joy",
    "excitement",
    "fear",
    "anxiety",
    "fatigue",
    "wonder",
    "peace",
    "stress",
    "curiosity",
    "melancholy",
    "euphoria",
];

const EMOTION_STYLES = {
    calm: "bg-[color:var(--sage-soft)]/20 text-[color:var(--sage-soft)] border-[color:var(--sage-soft)]/30",
    joy: "bg-[color:var(--gold-accent)]/20 text-[color:var(--gold-accent)] border-[color:var(--gold-accent)]/30",
    excitement: "bg-[color:var(--terracotta)]/20 text-[color:var(--terracotta)] border-[color:var(--terracotta)]/30",
    fear: "bg-[color:var(--navy-deep)]/20 text-[color:var(--navy-deep)] border-[color:var(--navy-deep)]/30",
    anxiety: "bg-red-100 text-red-800 border-red-200",
    fatigue: "bg-gray-100 text-gray-700 border-gray-200",
    wonder: "bg-purple-100 text-purple-800 border-purple-200",
    peace: "bg-[color:var(--sage-soft)]/20 text-[color:var(--sage-soft)] border-[color:var(--sage-soft)]/30",
    stress: "bg-[color:var(--terracotta)]/20 text-[color:var(--terracotta)] border-[color:var(--terracotta)]/30",
    curiosity: "bg-blue-100 text-blue-800 border-blue-200",
    melancholy: "bg-indigo-100 text-indigo-800 border-indigo-200",
    euphoria: "bg-pink-100 text-pink-800 border-pink-200",
};

// --- Sample data ---
const SAMPLE_LOCATIONS = [
    { id: "LOC-ECU-Quito", name: "Quito" },
    { id: "LOC-NAM-Sossus", name: "Sossusvlei" },
];
const SAMPLE_ENTRIES = [
    {
        id: "J100",
        location_id: "LOC-ECU-Quito",
        date: "2025-06-10",
        title: "Sky city",
        content: "Stepped into a city of light. The altitude pressed, but the colors lifted everything.",
        emotions: ["wonder", "curiosity", "calm"],
        mood_score: 8.2,
        highlight_moment: true,
        image_url: "",
        audio_url: "",
    },
    {
        id: "J101",
        location_id: "LOC-NAM-Sossus",
        date: "2025-07-06",
        title: "Singing dunes",
        content: "Wind wrote long notes across the sand. I listened until the sun fell.",
        emotions: ["peace", "joy"],
        mood_score: 9.1,
        highlight_moment: false,
    },
];

export default function Journal({ loaders }) {
    const [journalEntries, setJournalEntries] = useState([]);
    const [locations, setLocations] = useState([]);
    const [selectedLocation, setSelectedLocation] = useState("all");
    const [selectedEmotion, setSelectedEmotion] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [showNewEntry, setShowNewEntry] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setIsLoading(true);
            try {
                const [entries, locs] = await Promise.all([
                    loaders?.loadEntries?.() ?? Promise.resolve(SAMPLE_ENTRIES),
                    loaders?.loadLocations?.() ?? Promise.resolve(SAMPLE_LOCATIONS),
                ]);
                if (!cancelled) {
                    setJournalEntries(entries ?? []);
                    setLocations(locs ?? []);
                }
            } catch (e) {
                // eslint-disable-next-line no-console
                console.error("Journal: load error", e);
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [loaders]);

    const getLocationName = (id) => locations.find((l) => l.id === id)?.name ?? "Unknown Location";

    const filteredEntries = useMemo(() => {
        let arr = [...journalEntries];
        if (selectedLocation !== "all") arr = arr.filter((e) => e.location_id === selectedLocation);
        if (selectedEmotion !== "all") arr = arr.filter((e) => e.emotions?.includes(selectedEmotion));
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            arr = arr.filter((e) => e.title?.toLowerCase().includes(q) || e.content?.toLowerCase().includes(q));
        }
        return arr;
    }, [journalEntries, selectedLocation, selectedEmotion, searchQuery]);

    const highlightMoments = useMemo(() => journalEntries.filter((e) => e.highlight_moment), [journalEntries]);

    const emotionStats = useMemo(() => {
        const counts = new Map();
        for (const e of journalEntries) {
            for (const emo of e.emotions ?? []) counts.set(emo, (counts.get(emo) ?? 0) + 1);
        }
        return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
    }, [journalEntries]);

    if (isLoading) {
        return (
            <div className="p-8 space-y-6">
                <div className="space-y-4">
                    <div className="h-8 w-64 bg-[color:var(--stone)]/20 rounded animate-pulse" />
                    <div className="h-4 w-96 bg-[color:var(--stone)]/20 rounded animate-pulse" />
                </div>
                <div className="grid md:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-64 bg-[color:var(--stone)]/20 rounded-xl animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    const averageMood = (journalEntries.reduce((s, e) => s + (e.mood_score ?? 0), 0) / (journalEntries.length || 1)).toFixed(1);

    return (
        <div className="p-4 md:p-8 space-y-8 bg-grey min-h-screen">
            <style>{`:root{--forest-deep:#1a2e1a;--sage-soft:#9caf88;--terracotta:#c65d07;--gold-accent:#d4af37;--navy-deep:#1e3a5f;--cream:#faf8f3;--stone:#e8e2d4;}`}</style>

            {/* Header */}
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-[color:purple]/70 to-[color:var(--stone)] rounded-xl flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-[color:var(--forest-deep)] tracking-tight">Emotional Journey</h1>
                        <p className="text-[color:var(--sage-soft)] font-medium">Stories, feelings, and memories from the road</p>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex flex-wrap gap-3 items-center">
                    {/* Search */}
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-3 text-[color:var(--sage-soft)]" />
                        <input
                            type="text"
                            placeholder="Search entries..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 w-64 bg-white/80 border border-[color:var(--sage-soft)]/30 rounded-lg px-3 py-2 text-sm"
                        />
                    </div>

                    {/* Location filter */}
                    <select
                        value={selectedLocation}
                        onChange={(e) => setSelectedLocation(e.target.value)}
                        className="w-48 bg-white/80 border border-[color:var(--sage-soft)]/30 rounded-lg px-3 py-2 text-sm"
                    >
                        <option value="all">All Locations</option>
                        {locations.map((l) => (
                            <option key={l.id} value={l.id}>{l.name}</option>
                        ))}
                    </select>

                    {/* Emotion filter */}
                    <select
                        value={selectedEmotion}
                        onChange={(e) => setSelectedEmotion(e.target.value)}
                        className="w-48 bg-white/80 border border-[color:var(--sage-soft)]/30 rounded-lg px-3 py-2 text-sm"
                    >
                        <option value="all">All Emotions</option>
                        {EMOTIONS.map((emo) => (
                            <option key={emo} value={emo}>{emo[0].toUpperCase() + emo.slice(1)}</option>
                        ))}
                    </select>

                    {/* New entry button */}
                    <button
                        type="button"
                        onClick={() => setShowNewEntry(true)}
                        className="inline-flex items-center gap-2 rounded-lg bg-[color:var(--forest-deep)] text-white px-3 py-2 text-sm hover:opacity-95"
                    >
                        <Plus className="w-4 h-4" /> New Entry
                    </button>
                </div>

                <div className="flex gap-3">
          <span className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm bg-white/80 border-[color:var(--sage-soft)]/30">
            {filteredEntries.length} entries
          </span>
                    <span className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm bg-white/80 border-[color:var(--sage-soft)]/30">
            <Star className="w-3 h-3" /> {highlightMoments.length} highlights
          </span>
                </div>
            </div>

            {/* Emotion overview */}
            <div className="grid md:grid-cols-4 gap-6">
                <div className="md:col-span-3 rounded-2xl border border-[color:var(--sage-soft)]/20 bg-white/90 backdrop-blur p-5">
                    <h3 className="font-semibold text-[color:var(--forest-deep)] mb-3">Emotional Landscape</h3>
                    <div className="flex flex-wrap gap-2">
                        {emotionStats.map(([emotion, count]) => (
                            <span
                                key={emotion}
                                className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm border cursor-pointer hover:opacity-80 ${EMOTION_STYLES[emotion]}`}
                                onClick={() => setSelectedEmotion(emotion)}
                            >
                {emotion} ({count})
              </span>
                        ))}
                    </div>
                </div>

                <div className="rounded-2xl border border-[color:var(--sage-soft)]/20 bg-white/90 backdrop-blur p-5">
                    <div className="flex items-center gap-2 text-sm font-medium mb-2" style={{ color: "var(--forest-deep)" }}>
                        <Heart className="w-4 h-4" /> Average Mood
                    </div>
                    <p className="text-2xl font-bold text-[color:var(--forest-deep)]">{averageMood}/10</p>
                    <div className="text-xs text-[color:var(--sage-soft)]">Across all locations</div>
                </div>
            </div>

            {/* Highlights */}
            {!!highlightMoments.length && (
                <div className="rounded-2xl border border-[color:var(--sage-soft)]/20 bg-white/90 backdrop-blur p-5">
                    <div className="flex items-center gap-2 mb-3" style={{ color: "var(--forest-deep)" }}>
                        <Star className="w-5 h-5" style={{ color: "var(--gold-accent)" }} />
                        <h3 className="font-semibold">Highlight Moments</h3>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                        {highlightMoments.slice(0, 4).map((entry) => (
                            <div key={entry.id} className="p-4 bg-gradient-to-r from-[color:var(--gold-accent)]/10 to-[color:var(--terracotta)]/10 rounded-lg border border-[color:var(--gold-accent)]/20">
                                <div className="flex items-start justify-between mb-2">
                                    <h4 className="font-semibold text-[color:var(--forest-deep)]">{entry.title}</h4>
                                    <span className="inline-flex items-center gap-1 text-xs rounded-full border px-2 py-0.5">{getLocationName(entry.location_id)}</span>
                                </div>
                                <p className="text-sm leading-relaxed mb-3">
                                    {entry.content?.length > 120 ? `${entry.content.slice(0, 120)}...` : entry.content}
                                </p>
                                <div className="flex gap-1 flex-wrap">
                                    {entry.emotions?.slice(0, 3).map((emo, i) => (
                                        <span key={`${entry.id}-e${i}`} className={`text-xs rounded-full border px-2 py-0.5 ${EMOTION_STYLES[emo]}`}>{emo}</span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Entries list */}
            <div className="space-y-6">
                <h2 className="text-xl font-bold text-[color:var(--forest-deep)]">All Entries</h2>
                <AnimatePresence>
                    <div className="space-y-6">
                        {filteredEntries.map((entry) => (
                            <motion.div key={entry.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.25 }}>
                                <div className="rounded-2xl border border-[color:var(--sage-soft)]/20 bg-white/90 backdrop-blur p-5 hover:shadow-xl transition-all duration-300">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-3">
                                                {entry.highlight_moment && <Star className="w-4 h-4" style={{ color: "var(--gold-accent)" }} />}
                                                <h3 className="text-xl font-bold text-[color:var(--forest-deep)]">{entry.title}</h3>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-4 text-sm text-[color:var(--sage-soft)]">
                                                <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" />{getLocationName(entry.location_id)}</span>
                                                <span className="inline-flex items-center gap-1"><Calendar className="w-3 h-3" />{format(new Date(entry.date), "MMM d, yyyy")}</span>
                                                {entry.mood_score && <span className="inline-flex items-center gap-1"><Heart className="w-3 h-3" />{entry.mood_score}/10</span>}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="prose prose-stone max-w-none">
                                        <p className="text-[color:var(--forest-deep)] leading-relaxed whitespace-pre-wrap">{entry.content}</p>
                                    </div>

                                    {!!entry.emotions?.length && (
                                        <div className="flex flex-wrap gap-2 mt-3">
                                            {entry.emotions.map((emo, i) => (
                                                <span key={`${entry.id}-emo-${i}`} className={`text-xs rounded-full border px-2 py-0.5 ${EMOTION_STYLES[emo]}`}>{emo}</span>
                                            ))}
                                        </div>
                                    )}

                                    {(entry.image_url || entry.audio_url) && (
                                        <div className="flex gap-4 pt-4 mt-4 border-t border-[color:var(--stone)]/30 text-[color:var(--sage-soft)]">
                                            {entry.image_url && (
                                                <span className="inline-flex items-center gap-2 text-sm"><ImageIcon className="w-4 h-4" /> Image attached</span>
                                            )}
                                            {entry.audio_url && (
                                                <span className="inline-flex items-center gap-2 text-sm"><Mic className="w-4 h-4" /> Audio note</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </AnimatePresence>

                {!filteredEntries.length && (
                    <div className="rounded-2xl border border-[color:var(--sage-soft)]/20 bg-white/90 backdrop-blur p-8 text-center">
                        <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p className="text-[color:var(--sage-soft)]">No entries match your current filters</p>
                        <button
                            type="button"
                            onClick={() => { setSelectedLocation("all"); setSelectedEmotion("all"); setSearchQuery(""); }}
                            className="mt-4 border rounded-lg px-3 py-2 text-sm hover:bg-[color:var(--sage-soft)]/10"
                        >
                            Clear Filters
                        </button>
                    </div>
                )}
            </div>

            {/* New Entry Modal */}
            <AnimatePresence>
                {showNewEntry && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50">
                        <div className="absolute inset-0 bg-black/40" onClick={() => setShowNewEntry(false)} />
                        <div className="absolute inset-0 flex items-center justify-center p-4">
                            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-2xl rounded-2xl border border-[color:var(--sage-soft)]/30 bg-white p-5">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-semibold text-[color:var(--forest-deep)]">Create New Journal Entry</h3>
                                    <button onClick={() => setShowNewEntry(false)} className="text-sm hover:underline">Close</button>
                                </div>
                                <NewEntryForm
                                    locations={locations}
                                    onSave={async (payload) => {
                                        try {
                                            if (loaders?.createEntry) {
                                                await loaders.createEntry(payload);
                                            } else {
                                                // local append fallback
                                                setJournalEntries((prev) => [{ id: `LOCAL-${Date.now()}`, ...payload }, ...prev]);
                                            }
                                            setShowNewEntry(false);
                                        } catch (e) {
                                            // eslint-disable-next-line no-console
                                            console.error("create entry error", e);
                                        }
                                    }}
                                />
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function NewEntryForm({ locations, onSave }) {
    const [form, setForm] = useState({
        location_id: "",
        date: new Date().toISOString().slice(0, 10),
        title: "",
        content: "",
        emotions: [],
        mood_score: 5,
        highlight_moment: false,
    });

    const toggleEmotion = (emo) => {
        setForm((f) => ({
            ...f,
            emotions: f.emotions.includes(emo)
                ? f.emotions.filter((x) => x !== emo)
                : [...f.emotions, emo],
        }));
    };

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                onSave(form);
            }}
            className="space-y-6"
        >
            <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-[color:var(--forest-deep)]">Location</label>
                    <select
                        value={form.location_id}
                        onChange={(e) => setForm((f) => ({ ...f, location_id: e.target.value }))}
                        required
                        className="w-full bg-white/80 border border-[color:var(--sage-soft)]/30 rounded-lg px-3 py-2 text-sm"
                    >
                        <option value="" disabled>
                            Select location
                        </option>
                        {locations.map((l) => (
                            <option key={l.id} value={l.id}>
                                {l.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-[color:var(--forest-deep)]">Date</label>
                    <input
                        type="date"
                        value={form.date}
                        onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                        required
                        className="w-full bg-white/80 border border-[color:var(--sage-soft)]/30 rounded-lg px-3 py-2 text-sm"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-[color:var(--forest-deep)]">Title</label>
                <input
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="Give your entry a title..."
                    required
                    className="w-full bg-white/80 border border-[color:var(--sage-soft)]/30 rounded-lg px-3 py-2 text-sm"
                />
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-[color:var(--forest-deep)]">Content</label>
                <textarea
                    value={form.content}
                    onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                    placeholder="Write about your experience..."
                    rows={6}
                    required
                    className="w-full bg-white/80 border border-[color:var(--sage-soft)]/30 rounded-lg px-3 py-2 text-sm"
                />
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-[color:var(--forest-deep)]">Emotions</label>
                <div className="flex flex-wrap gap-2">
                    {EMOTIONS.map((emo) => (
                        <button
                            type="button"
                            key={emo}
                            className={`text-xs rounded-full border px-2 py-0.5 transition-all ${
                                form.emotions.includes(emo)
                                    ? EMOTION_STYLES[emo]
                                    : "bg-[color:var(--stone)]/20 text-[color:var(--sage-soft)] border-[color:var(--stone)]/40 hover:bg-[color:var(--stone)]/30"
                            }`}
                            onClick={() => toggleEmotion(emo)}
                        >
                            {emo}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-[color:var(--forest-deep)]">Mood Score: {form.mood_score}/10</label>
                    <input
                        type="range"
                        min={1}
                        max={10}
                        value={form.mood_score}
                        onChange={(e) => setForm((f) => ({ ...f, mood_score: Number(e.target.value) }))}
                        className="w-full"
                    />
                </div>
                <label className="inline-flex items-center gap-2 pt-6">
                    <input
                        type="checkbox"
                        checked={form.highlight_moment}
                        onChange={(e) => setForm((f) => ({ ...f, highlight_moment: e.target.checked }))}
                    />
                    <span className="text-sm font-medium text-[color:var(--forest-deep)]">Mark as highlight moment</span>
                </label>
            </div>

            <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => history.back?.()} className="border rounded-lg px-3 py-2 text-sm hover:bg-[color:var(--sage-soft)]/10">Cancel</button>
                <button type="submit" className="rounded-lg bg-[color:var(--forest-deep)] text-white px-3 py-2 text-sm hover:opacity-95">Save Entry</button>
            </div>
        </form>
    );
}
