// src/pages/JourneyMap.jsx
import React, { useEffect, useMemo, useState } from "react";
import { MapPin, Thermometer, BookOpen } from "lucide-react";
import { format } from "date-fns";
import JourneyGlobe from "../components/JourneyGlobe";


/* -------------------- DONNÉES FACTICES -------------------- */
const MOCK_LOCATIONS = [
    {
        id: "tokyo",
        name: "Tokyo",
        country: "Japan",
        latitude: 35.6762,
        longitude: 139.6503,
        arrival_date: "2024-01-15",
        departure_date: "2024-02-01",
        image_url:
            "https://images.unsplash.com/photo-1505060895281-933ee13f76ea?q=80&w=1600&auto=format&fit=crop",
        description:
            "Bustling metropolis with incredible energy. The contrast between ancient temples and modern skyscrapers created a unique atmosphere that felt both overwhelming and inspiring.",
    },
    {
        id: "paris",
        name: "Paris",
        country: "France",
        latitude: 48.8566,
        longitude: 2.3522,
        arrival_date: "2024-03-05",
        departure_date: "2024-03-20",
        image_url:
            "https://images.unsplash.com/photo-1508057198894-247b23fe5ade?q=80&w=1600&auto=format&fit=crop",
        description:
            "Cafés ensoleillés, balades le long de la Seine, musées et petits marchés du week-end.",
    },
    {
        id: "lima",
        name: "Lima",
        country: "Peru",
        latitude: -12.0464,
        longitude: -77.0428,
        arrival_date: "2024-04-10",
        departure_date: "2024-04-25",
        image_url:
            "https://images.unsplash.com/photo-1543352634-8730cde56b5d?q=80&w=1600&auto=format&fit=crop",
        description:
            "Côte pacifique, brume matinale, ceviche et falaises de Miraflores.",
    },
    {
        id: "cape-town",
        name: "Cape Town",
        country: "South Africa",
        latitude: -33.9249,
        longitude: 18.4241,
        arrival_date: "2024-05-12",
        departure_date: "2024-05-28",
        image_url:
            "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?q=80&w=1600&auto=format&fit=crop",
        description:
            "Table Mountain majestueuse, vent marin et lumière dorée en fin d’après-midi.",
    },
    {
        id: "sydney",
        name: "Sydney",
        country: "Australia",
        latitude: -33.8688,
        longitude: 151.2093,
        arrival_date: "2024-06-10",
        departure_date: "2024-06-24",
        image_url:
            "https://images.unsplash.com/photo-1506976785307-8732e854ad75?q=80&w=1600&auto=format&fit=crop",
        description:
            "Baie mythique, surf à Bondi, ciel bleu quasi permanent et rythme détendu.",
    },
];

// pour les compteurs uniquement
const MOCK_ENV = [
    { id: 1, location_id: "tokyo" },
    { id: 2, location_id: "paris" },
    { id: 3, location_id: "sydney" },
    { id: 4, location_id: "cape-town" },
    { id: 5, location_id: "lima" },
    { id: 6, location_id: "tokyo" },
];

const MOCK_JOURNAL = [
    { id: 1, location_id: "tokyo" },
    { id: 2, location_id: "paris" },
    { id: 3, location_id: "paris" },
    { id: 4, location_id: "cape-town" },
];

export default function JourneyMap() {
    const [locations, setLocations] = useState([]);
    const [environmentalData, setEnvironmental] = useState([]);
    const [journalEntries, setJournal] = useState([]);
    const [selected, setSelected] = useState(null);
    const [loading, setLoading] = useState(true);

    // Simule un chargement async (aucune API)
    useEffect(() => {
        const timer = setTimeout(() => {
            const sorted = MOCK_LOCATIONS.slice().sort(
                (a, b) => new Date(a.arrival_date) - new Date(b.arrival_date)
            );
            setLocations(sorted);
            setEnvironmental(MOCK_ENV);
            setJournal(MOCK_JOURNAL);
            setSelected(sorted[0]); // sélectionner la première
            setLoading(false);
        }, 300);
        return () => clearTimeout(timer);
    }, []);

    // Chemin de voyage et centre de la carte
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

            {/* GRID à 2 lignes : (1) Pills  (2) Carte + Panneau alignés */}
            <div className="grid gap-6 lg:grid-cols-3 lg:grid-rows-[auto_1fr]">
                {/* LIGNE 1 — Pills */}
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

                {/* LIGNE 2 — Carte */}
                <div className="lg:col-span-2 lg:row-start-2">
                    <div className="bg-gray-100 rounded-2xl shadow-md border border-gray-200 overflow-hidden">
                        <div className="h-[560px]">
                            <div className="lg:col-span-2 lg:row-start-2">
                                <JourneyGlobe locations={locations} />
                            </div>

                        </div>
                    </div>
                </div>

                {/* LIGNE 2 — Panneau détails (aligné en haut de la carte) */}
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
