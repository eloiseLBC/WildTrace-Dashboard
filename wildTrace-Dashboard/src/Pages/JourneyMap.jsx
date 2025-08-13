// src/pages/JourneyMap.jsx
import React, { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import { MapPin, Thermometer, BookOpen } from "lucide-react";
import { format } from "date-fns";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// --- Fix des icônes Leaflet avec Vite ---
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    iconUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

export default function JourneyMap() {
    const [locations, setLocations] = useState([]);
    const [environmentalData, setEnvironmental] = useState([]);
    const [journalEntries, setJournal] = useState([]);
    const [selected, setSelected] = useState(null);
    const [loading, setLoading] = useState(true);

    // Charge les données réelles de ton projet
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const [locs, env, journ] = await Promise.all([
                    Location.list("arrival_date"),
                    EnvironmentalData.list(),
                    JournalEntry.list(),
                ]);
                if (cancelled) return;

                const sorted = (locs ?? []).slice().sort(
                    (a, b) => new Date(a.arrival_date) - new Date(b.arrival_date)
                );

                setLocations(sorted);
                setEnvironmental(env ?? []);
                setJournal(journ ?? []);
                setSelected(sorted[0] ?? null);
            } catch (e) {
                console.error("Error loading data:", e);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    // Trajet + centre carte
    const path = useMemo(
        () => locations.map((l) => [l.latitude, l.longitude]),
        [locations]
    );

    const mapCenter = useMemo(() => {
        if (!locations.length) return [20, 0];
        const lat = locations.reduce((s, l) => s + l.latitude, 0) / locations.length;
        const lng = locations.reduce((s, l) => s + l.longitude, 0) / locations.length;
        return [lat, lng];
    }, [locations]);

    if (loading) {
        return (
            <div className="p-6">
                <div className="h-8 w-56 bg-gray-200 rounded animate-pulse mb-3" />
                <div className="h-4 w-96 bg-gray-200 rounded animate-pulse mb-6" />
                <div className="grid lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 h-[560px] bg-gray-100 rounded-2xl animate-pulse" />
                    <div className="h-[560px] bg-gray-100 rounded-2xl animate-pulse" />
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-8">
            {/* Titre */}
            <div className="mb-4">
                <h1 className="text-4xl font-extrabold tracking-tight text-[color:var(--forest-deep)]">
                    Global Journey Map
                </h1>
                <p className="text-gray-600">
                    Your path through the world, marked by data and memory
                </p>
            </div>

            {/* GRID à 2 lignes : (1) Pills  (2) Carte + Panneau */}
            <div className="grid gap-6 lg:grid-cols-3 lg:grid-rows-[auto_1fr]">
                {/* LIGNE 1 — Col gauche : Pills */}
                <div className="flex flex-wrap gap-2 lg:col-span-2 lg:row-start-1">
                    <Pill icon={<MapPin className="w-3.5 h-3.5" />}>
                        {locations.length} locations
                    </Pill>
                    <Pill icon={<Thermometer className="w-3.5 h-3.5" />}>
                        {environmentalData.length} environmental readings
                    </Pill>
                    <Pill icon={<BookOpen className="w-3.5 h-3.5" />}>
                        {journalEntries.length} journal entries
                    </Pill>
                </div>

                {/* LIGNE 2 — Col gauche : Carte */}
                <div className="lg:col-span-2 lg:row-start-2">
                    <div className="bg-gray-100 rounded-2xl shadow-md border border-gray-200 overflow-hidden">
                        <div className="h-[560px]">
                            <MapContainer
                                center={mapCenter}
                                zoom={2}
                                scrollWheelZoom
                                style={{ height: "100%", width: "100%" }}
                            >
                                <TileLayer
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    attribution='&copy; OpenStreetMap contributors'
                                />

                                {path.length >= 2 && (
                                    <Polyline
                                        positions={path}
                                        color="#9caf88"     // sauge
                                        weight={3}
                                        opacity={0.6}
                                        dashArray="6, 10"
                                    />
                                )}

                                {locations.map((loc) => (
                                    <Marker
                                        key={loc.id}
                                        position={[loc.latitude, loc.longitude]}
                                        eventHandlers={{ click: () => setSelected(loc) }}
                                    >
                                        <Popup>
                                            <div className="text-sm">
                                                <div className="font-semibold">{loc.name}</div>
                                                <div className="text-gray-500">{loc.country}</div>
                                                <div className="mt-1">
                                                    {format(new Date(loc.arrival_date), "MMM d, yyyy")}
                                                </div>
                                            </div>
                                        </Popup>
                                    </Marker>
                                ))}
                            </MapContainer>
                        </div>
                    </div>
                </div>

                {/* LIGNE 2 — Col droite : Panneau détails (aligné en haut de la carte) */}
                <div className="lg:col-start-3 lg:row-start-2 self-start">
                    {!selected ? (
                        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-gray-500 shadow-md">
                            <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                                <MapPin className="w-6 h-6 text-green-700" />
                            </div>
                            Click on a location marker to view details
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-lg">
                            <div className="flex items-center gap-2 mb-1">
                                <MapPin className="w-5 h-5 text-green-700" />
                                <h2 className="text-xl font-semibold text-gray-900">
                                    {selected.name}
                                    <span className="font-normal">, {selected.country}</span>
                                </h2>
                            </div>

                            {selected.image_url && (
                                <img
                                    src={selected.image_url}
                                    alt={selected.name}
                                    className="rounded-lg my-4 aspect-[16/9] object-cover"
                                />
                            )}

                            <div className="grid grid-cols-2 gap-6 text-sm">
                                <div>
                                    <p className="text-gray-500">Arrived</p>
                                    <p className="font-semibold text-gray-900">
                                        {format(new Date(selected.arrival_date), "MMM d, yyyy")}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-gray-500">Departed</p>
                                    <p className="font-semibold text-gray-900">
                                        {selected.departure_date
                                            ? format(new Date(selected.departure_date), "MMM d, yyyy")
                                            : "—"}
                                    </p>
                                </div>
                            </div>

                            {selected.description && (
                                <>
                                    <p className="mt-5 text-gray-900 font-medium">Notes</p>
                                    <p className="mt-1 text-gray-700 leading-relaxed">
                                        {selected.description}
                                    </p>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ---------- Composant Pill (indicateurs) ---------- */
function Pill({ icon, children }) {
    return (
        <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1 text-[13px] font-medium text-gray-800">
      {icon ? <span className="opacity-80">{icon}</span> : null}
            {children}
    </span>
    );
}
