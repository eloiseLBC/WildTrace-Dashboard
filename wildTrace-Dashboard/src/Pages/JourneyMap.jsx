import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { Location, EnvironmentalData, JournalEntry } from "@/entities/all";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, Thermometer, Image as ImageIcon } from "lucide-react";
import { format } from "date-fns";
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
import L from 'leaflet';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function JourneyMap() {
    const [locations, setLocations] = useState([]);
    const [environmentalData, setEnvironmentalData] = useState([]);
    const [journalEntries, setJournalEntries] = useState([]);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [locationsData, envData, journalData] = await Promise.all([
                Location.list('arrival_date'),
                EnvironmentalData.list(),
                JournalEntry.list()
            ]);

            setLocations(locationsData);
            setEnvironmentalData(envData);
            setJournalEntries(journalData);
        } catch (error) {
            console.error("Error loading data:", error);
        }
        setIsLoading(false);
    };

    const getLocationEnvironmentalData = (locationId) => {
        return environmentalData.filter(data => data.location_id === locationId);
    };

    const getLocationJournalEntries = (locationId) => {
        return journalEntries.filter(entry => entry.location_id === locationId);
    };

    const createJourneyPath = () => {
        return locations
            .sort((a, b) => new Date(a.arrival_date) - new Date(b.arrival_date))
            .map(location => [location.latitude, location.longitude]);
    };

    const getMapCenter = () => {
        if (locations.length === 0) return [20, 0];
        const avgLat = locations.reduce((sum, loc) => sum + loc.latitude, 0) / locations.length;
        const avgLng = locations.reduce((sum, loc) => sum + loc.longitude, 0) / locations.length;
        return [avgLat, avgLng];
    };

    if (isLoading) {
        return (
            <div className="p-8 space-y-6">
                <div className="space-y-4">
                    <div className="h-8 w-64 bg-stone/20 rounded animate-pulse"></div>
                    <div className="h-4 w-96 bg-stone/20 rounded animate-pulse"></div>
                </div>
                <div className="h-96 bg-stone/20 rounded-xl animate-pulse"></div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 space-y-8 bg-gradient-to-br from-cream via-white to-stone/10 min-h-screen">
            {/* Header */}
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-forest-deep to-sage-soft rounded-xl flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-forest-deep tracking-tight">Global Journey Map</h1>
                        <p className="text-sage-soft font-medium">Your path through the world, marked by data and memory</p>
                    </div>
                </div>

                <div className="flex gap-4">
                    <Badge variant="outline" className="bg-white/80 border-sage-soft/30">
                        <MapPin className="w-3 h-3 mr-1" />
                        {locations.length} locations
                    </Badge>
                    <Badge variant="outline" className="bg-white/80 border-sage-soft/30">
                        <Thermometer className="w-3 h-3 mr-1" />
                        {environmentalData.length} environmental readings
                    </Badge>
                    <Badge variant="outline" className="bg-white/80 border-sage-soft/30">
                        <ImageIcon className="w-3 h-3 mr-1" />
                        {journalEntries.length} journal entries
                    </Badge>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Main Map */}
                <div className="lg:col-span-2">
                    <Card className="luxury-card overflow-hidden h-[600px]">
                        <CardContent className="p-0 h-full">
                            {locations.length > 0 ? (
                                <MapContainer
                                    center={getMapCenter()}
                                    zoom={2}
                                    style={{ height: '100%', width: '100%' }}
                                    className="rounded-xl"
                                >
                                    <TileLayer
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                    />

                                    {/* Journey Path */}
                                    <Polyline
                                        positions={createJourneyPath()}
                                        color="#9caf88"
                                        weight={3}
                                        opacity={0.8}
                                        dashArray="5, 10"
                                    />

                                    {/* Location Markers */}
                                    {locations.map((location, index) => (
                                        <Marker
                                            key={location.id}
                                            position={[location.latitude, location.longitude]}
                                            eventHandlers={{
                                                click: () => setSelectedLocation(location)
                                            }}
                                        >
                                            <Popup>
                                                <div className="space-y-2 min-w-48">
                                                    <h3 className="font-bold text-forest-deep">{location.name}</h3>
                                                    <p className="text-sm text-sage-soft">{location.country}</p>
                                                    <div className="text-xs">
                                                        <div className="flex items-center gap-1">
                                                            <Calendar className="w-3 h-3" />
                                                            {format(new Date(location.arrival_date), 'MMM d, yyyy')}
                                                        </div>
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        onClick={() => setSelectedLocation(location)}
                                                        className="w-full mt-2 bg-forest-deep hover:bg-forest-deep/90"
                                                    >
                                                        View Details
                                                    </Button>
                                                </div>
                                            </Popup>
                                        </Marker>
                                    ))}
                                </MapContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-sage-soft">
                                    <div className="text-center">
                                        <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                        <p>No locations data yet. Add your journey points to see the map.</p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Location Details Sidebar */}
                <div className="space-y-6">
                    {selectedLocation ? (
                        <>
                            <Card className="luxury-card">
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-xl text-forest-deep flex items-center gap-2">
                                        <MapPin className="w-5 h-5" />
                                        {selectedLocation.name}
                                    </CardTitle>
                                    <p className="text-sage-soft font-medium">{selectedLocation.country}</p>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {selectedLocation.image_url && (
                                        <img
                                            src={selectedLocation.image_url}
                                            alt={selectedLocation.name}
                                            className="w-full h-32 object-cover rounded-lg"
                                        />
                                    )}

                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <p className="text-sage-soft/80">Arrived</p>
                                            <p className="font-semibold text-forest-deep">
                                                {format(new Date(selectedLocation.arrival_date), 'MMM d, yyyy')}
                                            </p>
                                        </div>
                                        {selectedLocation.departure_date && (
                                            <div>
                                                <p className="text-sage-soft/80">Departed</p>
                                                <p className="font-semibold text-forest-deep">
                                                    {format(new Date(selectedLocation.departure_date), 'MMM d, yyyy')}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {selectedLocation.description && (
                                        <div>
                                            <p className="text-sage-soft/80 text-sm mb-2">Notes</p>
                                            <p className="text-forest-deep text-sm leading-relaxed">
                                                {selectedLocation.description}
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Environmental Summary */}
                            {getLocationEnvironmentalData(selectedLocation.id).length > 0 && (
                                <Card className="luxury-card">
                                    <CardHeader>
                                        <CardTitle className="text-forest-deep flex items-center gap-2">
                                            <Thermometer className="w-4 h-4" />
                                            Environment
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {(() => {
                                            const envData = getLocationEnvironmentalData(selectedLocation.id);
                                            const avgTemp = envData.reduce((sum, d) => sum + (d.temperature_avg || 0), 0) / envData.length;
                                            const avgHumidity = envData.reduce((sum, d) => sum + (d.humidity || 0), 0) / envData.length;

                                            return (
                                                <div className="grid grid-cols-2 gap-4 text-sm">
                                                    <div>
                                                        <p className="text-sage-soft/80">Avg Temperature</p>
                                                        <p className="font-semibold text-forest-deep">{avgTemp.toFixed(1)}°C</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sage-soft/80">Avg Humidity</p>
                                                        <p className="font-semibold text-forest-deep">{avgHumidity.toFixed(0)}%</p>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </CardContent>
                                </Card>
                            )}

                            {/* Journal Entries */}
                            {getLocationJournalEntries(selectedLocation.id).length > 0 && (
                                <Card className="luxury-card">
                                    <CardHeader>
                                        <CardTitle className="text-forest-deep flex items-center gap-2">
                                            <ImageIcon className="w-4 h-4" />
                                            Memories
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        {getLocationJournalEntries(selectedLocation.id).slice(0, 2).map((entry) => (
                                            <div key={entry.id} className="p-3 bg-stone/10 rounded-lg">
                                                <p className="text-sm text-forest-deep leading-relaxed">
                                                    {entry.content.length > 100
                                                        ? `${entry.content.substring(0, 100)}...`
                                                        : entry.content
                                                    }
                                                </p>
                                                <div className="flex gap-1 mt-2">
                                                    {entry.emotions?.slice(0, 3).map((emotion, idx) => (
                                                        <Badge key={idx} variant="outline" className="text-xs bg-sage-soft/20">
                                                            {emotion}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                            )}
                        </>
                    ) : (
                        <Card className="luxury-card">
                            <CardContent className="p-8 text-center">
                                <MapPin className="w-12 h-12 mx-auto mb-4 text-sage-soft/50" />
                                <p className="text-sage-soft">Click on a location marker to view details</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}