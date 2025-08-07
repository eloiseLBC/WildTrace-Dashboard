import React, { useState, useEffect } from "react";
import { BiologicalData, EnvironmentalData, JournalEntry, Location } from "@/entities/all";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Database, Download, FileText, ExternalLink, Calendar, MapPin } from "lucide-react";
import { format } from "date-fns";

export default function DataArchive() {
    const [data, setData] = useState({
        locations: [],
        biological: [],
        environmental: [],
        journal: []
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isExporting, setIsExporting] = useState(false);

    useEffect(() => {
        loadAllData();
    }, []);

    const loadAllData = async () => {
        setIsLoading(true);
        try {
            const [locations, biological, environmental, journal] = await Promise.all([
                Location.list('arrival_date'),
                BiologicalData.list('date'),
                EnvironmentalData.list('date'),
                JournalEntry.list('date')
            ]);

            setData({ locations, biological, environmental, journal });
        } catch (error) {
            console.error("Error loading data:", error);
        }
        setIsLoading(false);
    };

    const getLocationName = (locationId) => {
        const location = data.locations.find(loc => loc.id === locationId);
        return location ? location.name : "Unknown Location";
    };

    const exportToCSV = (dataArray, filename, headers) => {
        if (dataArray.length === 0) return;

        const csvContent = [
            headers.join(','),
            ...dataArray.map(row => headers.map(header => {
                const value = row[header];
                if (value === null || value === undefined) return '';
                if (typeof value === 'string' && value.includes(',')) return `"${value}"`;
                return value;
            }).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const exportAllData = async () => {
        setIsExporting(true);
        try {
            // Export locations
            exportToCSV(data.locations, 'locations', [
                'name', 'country', 'latitude', 'longitude', 'arrival_date', 'departure_date', 'description'
            ]);

            // Export biological data with location names
            const biologicalWithLocations = data.biological.map(bio => ({
                ...bio,
                location_name: getLocationName(bio.location_id),
                date: format(new Date(bio.date), 'yyyy-MM-dd HH:mm:ss')
            }));
            exportToCSV(biologicalWithLocations, 'biological_data', [
                'location_name', 'date', 'heart_rate_resting', 'heart_rate_active', 'heart_rate_variability',
                'body_temperature', 'sleep_quality_score', 'sleep_duration', 'respiratory_rate', 'activity_level', 'stress_level'
            ]);

            // Export environmental data
            const environmentalWithLocations = data.environmental.map(env => ({
                ...env,
                location_name: getLocationName(env.location_id),
                date: format(new Date(env.date), 'yyyy-MM-dd')
            }));
            exportToCSV(environmentalWithLocations, 'environmental_data', [
                'location_name', 'date', 'temperature_avg', 'temperature_min', 'temperature_max',
                'humidity', 'light_exposure', 'air_quality_index', 'noise_level', 'weather_condition'
            ]);

            // Export journal entries
            const journalWithLocations = data.journal.map(entry => ({
                ...entry,
                location_name: getLocationName(entry.location_id),
                date: format(new Date(entry.date), 'yyyy-MM-dd'),
                emotions: Array.isArray(entry.emotions) ? entry.emotions.join('; ') : entry.emotions
            }));
            exportToCSV(journalWithLocations, 'journal_entries', [
                'location_name', 'date', 'title', 'content', 'emotions', 'mood_score', 'highlight_moment'
            ]);

        } catch (error) {
            console.error("Error exporting data:", error);
        }
        setIsExporting(false);
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
                    <div className="w-10 h-10 bg-gradient-to-br from-stone to-sage-soft rounded-xl flex items-center justify-center">
                        <Database className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-forest-deep tracking-tight">Data Archive</h1>
                        <p className="text-sage-soft font-medium">Your complete dataset for analysis and backup</p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-4">
                    <Button
                        onClick={exportAllData}
                        disabled={isExporting}
                        className="bg-forest-deep hover:bg-forest-deep/90"
                    >
                        {isExporting ? (
                            <>
                                <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Exporting...
                            </>
                        ) : (
                            <>
                                <Download className="w-4 h-4 mr-2" />
                                Export All Data
                            </>
                        )}
                    </Button>

                    <div className="flex gap-2">
                        <Badge variant="outline" className="bg-white/80 border-sage-soft/30">
                            {data.locations.length} locations
                        </Badge>
                        <Badge variant="outline" className="bg-white/80 border-sage-soft/30">
                            {data.biological.length} bio readings
                        </Badge>
                        <Badge variant="outline" className="bg-white/80 border-sage-soft/30">
                            {data.environmental.length} env readings
                        </Badge>
                        <Badge variant="outline" className="bg-white/80 border-sage-soft/30">
                            {data.journal.length} journal entries
                        </Badge>
                    </div>
                </div>
            </div>

            {/* Data Overview */}
            <div className="grid md:grid-cols-4 gap-6">
                <Card className="luxury-card">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-forest-deep flex items-center gap-2 text-sm font-medium">
                            <MapPin className="w-4 h-4 text-terracotta" />
                            Locations
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <p className="text-2xl font-bold text-forest-deep">{data.locations.length}</p>
                            <div className="text-xs text-sage-soft">
                                {data.locations.length > 0 && (
                                    <span>
                    {format(new Date(data.locations[0]?.arrival_date), 'MMM yyyy')} - {' '}
                                        {format(new Date(data.locations[data.locations.length - 1]?.departure_date || data.locations[data.locations.length - 1]?.arrival_date), 'MMM yyyy')}
                  </span>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="luxury-card">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-forest-deep flex items-center gap-2 text-sm font-medium">
                            <FileText className="w-4 h-4 text-navy-deep" />
                            Biometric Data
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <p className="text-2xl font-bold text-forest-deep">{data.biological.length}</p>
                            <div className="text-xs text-sage-soft">Heart rate, sleep, stress data</div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="luxury-card">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-forest-deep flex items-center gap-2 text-sm font-medium">
                            <FileText className="w-4 h-4 text-gold-accent" />
                            Environmental Data
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <p className="text-2xl font-bold text-forest-deep">{data.environmental.length}</p>
                            <div className="text-xs text-sage-soft">Climate and conditions</div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="luxury-card">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-forest-deep flex items-center gap-2 text-sm font-medium">
                            <FileText className="w-4 h-4 text-sage-soft" />
                            Journal Entries
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <p className="text-2xl font-bold text-forest-deep">{data.journal.length}</p>
                            <div className="text-xs text-sage-soft">Stories and emotions</div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Data Tables */}
            <Tabs defaultValue="locations" className="space-y-6">
                <TabsList className="bg-white/80 border border-sage-soft/30">
                    <TabsTrigger value="locations">Locations</TabsTrigger>
                    <TabsTrigger value="biological">Biological</TabsTrigger>
                    <TabsTrigger value="environmental">Environmental</TabsTrigger>
                    <TabsTrigger value="journal">Journal</TabsTrigger>
                </TabsList>

                <TabsContent value="locations">
                    <Card className="luxury-card">
                        <CardHeader>
                            <CardTitle className="text-forest-deep">Location Data</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Country</TableHead>
                                            <TableHead>Coordinates</TableHead>
                                            <TableHead>Arrival</TableHead>
                                            <TableHead>Departure</TableHead>
                                            <TableHead>Duration</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data.locations.map(location => {
                                            const duration = location.departure_date
                                                ? Math.ceil((new Date(location.departure_date) - new Date(location.arrival_date)) / (1000 * 60 * 60 * 24))
                                                : null;

                                            return (
                                                <TableRow key={location.id}>
                                                    <TableCell className="font-medium">{location.name}</TableCell>
                                                    <TableCell>{location.country}</TableCell>
                                                    <TableCell className="text-sm">
                                                        {location.latitude.toFixed(3)}, {location.longitude.toFixed(3)}
                                                    </TableCell>
                                                    <TableCell>{format(new Date(location.arrival_date), 'MMM d, yyyy')}</TableCell>
                                                    <TableCell>
                                                        {location.departure_date
                                                            ? format(new Date(location.departure_date), 'MMM d, yyyy')
                                                            : '-'
                                                        }
                                                    </TableCell>
                                                    <TableCell>{duration ? `${duration} days` : '-'}</TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="biological">
                    <Card className="luxury-card">
                        <CardHeader>
                            <CardTitle className="text-forest-deep">Biological Data</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Location</TableHead>
                                            <TableHead>Heart Rate</TableHead>
                                            <TableHead>HRV</TableHead>
                                            <TableHead>Sleep Quality</TableHead>
                                            <TableHead>Stress Level</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data.biological.slice(0, 20).map(bio => (
                                            <TableRow key={bio.id}>
                                                <TableCell>{format(new Date(bio.date), 'MMM d, yyyy')}</TableCell>
                                                <TableCell>{getLocationName(bio.location_id)}</TableCell>
                                                <TableCell>{bio.heart_rate_resting} BPM</TableCell>
                                                <TableCell>{bio.heart_rate_variability}</TableCell>
                                                <TableCell>{bio.sleep_quality_score}/10</TableCell>
                                                <TableCell>{bio.stress_level}/10</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                {data.biological.length > 20 && (
                                    <div className="text-center py-4 text-sage-soft text-sm">
                                        Showing first 20 entries of {data.biological.length} total
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="environmental">
                    <Card className="luxury-card">
                        <CardHeader>
                            <CardTitle className="text-forest-deep">Environmental Data</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Location</TableHead>
                                            <TableHead>Temperature</TableHead>
                                            <TableHead>Humidity</TableHead>
                                            <TableHead>Air Quality</TableHead>
                                            <TableHead>Conditions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data.environmental.slice(0, 20).map(env => (
                                            <TableRow key={env.id}>
                                                <TableCell>{format(new Date(env.date), 'MMM d, yyyy')}</TableCell>
                                                <TableCell>{getLocationName(env.location_id)}</TableCell>
                                                <TableCell>{env.temperature_avg}°C</TableCell>
                                                <TableCell>{env.humidity}%</TableCell>
                                                <TableCell>{env.air_quality_index} AQI</TableCell>
                                                <TableCell className="capitalize">{env.weather_condition}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                {data.environmental.length > 20 && (
                                    <div className="text-center py-4 text-sage-soft text-sm">
                                        Showing first 20 entries of {data.environmental.length} total
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="journal">
                    <Card className="luxury-card">
                        <CardHeader>
                            <CardTitle className="text-forest-deep">Journal Entries</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {data.journal.slice(0, 10).map(entry => (
                                    <div key={entry.id} className="p-4 border border-stone/20 rounded-lg space-y-2">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-semibold text-forest-deep">{entry.title}</h4>
                                            <div className="flex items-center gap-2 text-sm text-sage-soft">
                                                <span>{getLocationName(entry.location_id)}</span>
                                                <span>•</span>
                                                <span>{format(new Date(entry.date), 'MMM d, yyyy')}</span>
                                                {entry.mood_score && (
                                                    <>
                                                        <span>•</span>
                                                        <span>{entry.mood_score}/10</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <p className="text-sm text-sage-soft leading-relaxed">
                                            {entry.content.length > 200
                                                ? `${entry.content.substring(0, 200)}...`
                                                : entry.content
                                            }
                                        </p>
                                        {entry.emotions && entry.emotions.length > 0 && (
                                            <div className="flex gap-1">
                                                {entry.emotions.slice(0, 4).map((emotion, idx) => (
                                                    <Badge key={idx} variant="outline" className="text-xs bg-sage-soft/20">
                                                        {emotion}
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {data.journal.length > 10 && (
                                    <div className="text-center py-4 text-sage-soft text-sm">
                                        Showing first 10 entries of {data.journal.length} total
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Documentation */}
            <Card className="luxury-card">
                <CardHeader>
                    <CardTitle className="text-forest-deep">Data Documentation</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-stone max-w-none">
                    <h3 className="text-forest-deep">Dataset Overview</h3>
                    <p className="text-sage-soft">
                        This dashboard contains a comprehensive dataset of your travel journey, combining location data,
                        environmental conditions, biological responses, and personal reflections.
                    </p>

                    <h4 className="text-forest-deep">Data Sources & Methodology</h4>
                    <ul className="text-sage-soft">
                        <li><strong>Location Data:</strong> GPS coordinates, arrival/departure dates, and personal notes</li>
                        <li><strong>Environmental Data:</strong> Temperature, humidity, air quality, noise levels from local sensors and APIs</li>
                        <li><strong>Biological Data:</strong> Heart rate, HRV, sleep quality, and stress measurements from wearable devices</li>
                        <li><strong>Journal Entries:</strong> Personal reflections, emotions, and highlight moments</li>
                    </ul>

                    <h4 className="text-forest-deep">Data Quality & Considerations</h4>
                    <ul className="text-sage-soft">
                        <li>All biological data is self-reported or from personal wearable devices</li>
                        <li>Environmental data may vary based on local measurement conditions</li>
                        <li>Journal entries represent subjective experiences and emotional states</li>
                        <li>Data gaps may exist due to device availability or connectivity issues</li>
                    </ul>

                    <h4 className="text-forest-deep">Usage & Privacy</h4>
                    <p className="text-sage-soft">
                        This data is personal and should be handled according to your privacy preferences.
                        When sharing or publishing insights, consider anonymizing location details and personal information.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}