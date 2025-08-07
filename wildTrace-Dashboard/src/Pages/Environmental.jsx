import React, { useState, useEffect } from "react";
import { EnvironmentalData, Location } from "@/entities/all";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { Thermometer, Droplets, Sun, Wind, Activity } from "lucide-react";
import { format } from "date-fns";

export default function Environmental() {
    const [environmentalData, setEnvironmentalData] = useState([]);
    const [locations, setLocations] = useState([]);
    const [selectedLocation, setSelectedLocation] = useState("all");
    const [selectedMetric, setSelectedMetric] = useState("temperature");
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [envData, locationsData] = await Promise.all([
                EnvironmentalData.list('date'),
                Location.list('arrival_date')
            ]);

            setEnvironmentalData(envData);
            setLocations(locationsData);
        } catch (error) {
            console.error("Error loading environmental data:", error);
        }
        setIsLoading(false);
    };

    const getFilteredData = () => {
        if (selectedLocation === "all") return environmentalData;
        return environmentalData.filter(data => data.location_id === selectedLocation);
    };

    const getLocationName = (locationId) => {
        const location = locations.find(loc => loc.id === locationId);
        return location ? location.name : "Unknown Location";
    };

    const prepareTimeSeriesData = () => {
        const filteredData = getFilteredData();
        return filteredData.map(data => ({
            ...data,
            date: format(new Date(data.date), 'MMM d'),
            location: getLocationName(data.location_id)
        }));
    };

    const prepareRadarData = () => {
        const filteredData = getFilteredData();
        if (filteredData.length === 0) return [];

        // Group by location and calculate averages
        const locationGroups = {};
        filteredData.forEach(data => {
            const locationName = getLocationName(data.location_id);
            if (!locationGroups[locationName]) {
                locationGroups[locationName] = {
                    temperature: [],
                    humidity: [],
                    light: [],
                    airQuality: [],
                    noise: []
                };
            }

            locationGroups[locationName].temperature.push(data.temperature_avg || 0);
            locationGroups[locationName].humidity.push(data.humidity || 0);
            locationGroups[locationName].light.push(data.light_exposure || 0);
            locationGroups[locationName].airQuality.push(data.air_quality_index || 0);
            locationGroups[locationName].noise.push(data.noise_level || 0);
        });

        // Calculate averages and normalize (0-100 scale)
        return Object.entries(locationGroups).map(([location, metrics]) => {
            const avg = (arr) => arr.reduce((sum, val) => sum + val, 0) / arr.length;

            return {
                location,
                Temperature: Math.min(100, (avg(metrics.temperature) / 40) * 100), // Normalize to 40°C max
                Humidity: avg(metrics.humidity),
                Light: Math.min(100, (avg(metrics.light) / 10000) * 100), // Normalize to 10k lux max
                'Air Quality': Math.min(100, (avg(metrics.airQuality) / 200) * 100), // Normalize to 200 AQI max
                Noise: Math.min(100, (avg(metrics.noise) / 100) * 100) // Normalize to 100dB max
            };
        });
    };

    const getMetricIcon = (metric) => {
        const icons = {
            temperature: Thermometer,
            humidity: Droplets,
            light: Sun,
            air_quality: Wind,
            noise: Activity
        };
        return icons[metric] || Activity;
    };

    const getMetricStats = () => {
        const filteredData = getFilteredData();
        if (filteredData.length === 0) return {};

        return {
            temperature: {
                avg: filteredData.reduce((sum, d) => sum + (d.temperature_avg || 0), 0) / filteredData.length,
                min: Math.min(...filteredData.map(d => d.temperature_min || 0)),
                max: Math.max(...filteredData.map(d => d.temperature_max || 0))
            },
            humidity: {
                avg: filteredData.reduce((sum, d) => sum + (d.humidity || 0), 0) / filteredData.length
            },
            light: {
                avg: filteredData.reduce((sum, d) => sum + (d.light_exposure || 0), 0) / filteredData.length
            },
            airQuality: {
                avg: filteredData.reduce((sum, d) => sum + (d.air_quality_index || 0), 0) / filteredData.length
            }
        };
    };

    if (isLoading) {
        return (
            <div className="p-8 space-y-6">
                <div className="space-y-4">
                    <div className="h-8 w-64 bg-stone/20 rounded animate-pulse"></div>
                    <div className="h-4 w-96 bg-stone/20 rounded animate-pulse"></div>
                </div>
                <div className="grid md:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-32 bg-stone/20 rounded-xl animate-pulse"></div>
                    ))}
                </div>
                <div className="h-96 bg-stone/20 rounded-xl animate-pulse"></div>
            </div>
        );
    }

    const stats = getMetricStats();
    const timeSeriesData = prepareTimeSeriesData();
    const radarData = prepareRadarData();

    return (
        <div className="p-4 md:p-8 space-y-8 bg-gradient-to-br from-cream via-white to-stone/10 min-h-screen">
            {/* Header */}
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-terracotta to-gold-accent rounded-xl flex items-center justify-center">
                        <Thermometer className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-forest-deep tracking-tight">Environmental Data</h1>
                        <p className="text-sage-soft font-medium">How the world's conditions shaped your journey</p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-4">
                    <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                        <SelectTrigger className="w-48 bg-white/80 border-sage-soft/30">
                            <SelectValue placeholder="Select location" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Locations</SelectItem>
                            {locations.map(location => (
                                <SelectItem key={location.id} value={location.id}>
                                    {location.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Badge variant="outline" className="bg-white/80 border-sage-soft/30">
                        {getFilteredData().length} data points
                    </Badge>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid md:grid-cols-4 gap-6">
                <Card className="luxury-card">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-forest-deep flex items-center gap-2 text-sm font-medium">
                            <Thermometer className="w-4 h-4 text-terracotta" />
                            Temperature
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <p className="text-2xl font-bold text-forest-deep">{stats.temperature?.avg.toFixed(1)}°C</p>
                            <div className="text-xs text-sage-soft">
                                <span>Range: {stats.temperature?.min.toFixed(1)}° - {stats.temperature?.max.toFixed(1)}°</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="luxury-card">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-forest-deep flex items-center gap-2 text-sm font-medium">
                            <Droplets className="w-4 h-4 text-navy-deep" />
                            Humidity
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <p className="text-2xl font-bold text-forest-deep">{stats.humidity?.avg.toFixed(0)}%</p>
                            <div className="text-xs text-sage-soft">Average relative humidity</div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="luxury-card">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-forest-deep flex items-center gap-2 text-sm font-medium">
                            <Sun className="w-4 h-4 text-gold-accent" />
                            Light Exposure
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <p className="text-2xl font-bold text-forest-deep">{stats.light?.avg.toFixed(0)}</p>
                            <div className="text-xs text-sage-soft">Lux average</div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="luxury-card">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-forest-deep flex items-center gap-2 text-sm font-medium">
                            <Wind className="w-4 h-4 text-sage-soft" />
                            Air Quality
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <p className="text-2xl font-bold text-forest-deep">{stats.airQuality?.avg.toFixed(0)}</p>
                            <div className="text-xs text-sage-soft">AQI average</div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Visualizations */}
            <Tabs defaultValue="timeseries" className="space-y-6">
                <TabsList className="bg-white/80 border border-sage-soft/30">
                    <TabsTrigger value="timeseries">Time Series</TabsTrigger>
                    <TabsTrigger value="comparison">Location Comparison</TabsTrigger>
                    <TabsTrigger value="ecosystem">Ecosystem Overview</TabsTrigger>
                </TabsList>

                <TabsContent value="timeseries">
                    <Card className="luxury-card">
                        <CardHeader>
                            <CardTitle className="text-forest-deep">Environmental Conditions Over Time</CardTitle>
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    variant={selectedMetric === "temperature" ? "default" : "outline"}
                                    onClick={() => setSelectedMetric("temperature")}
                                    className="text-xs"
                                >
                                    Temperature
                                </Button>
                                <Button
                                    size="sm"
                                    variant={selectedMetric === "humidity" ? "default" : "outline"}
                                    onClick={() => setSelectedMetric("humidity")}
                                    className="text-xs"
                                >
                                    Humidity
                                </Button>
                                <Button
                                    size="sm"
                                    variant={selectedMetric === "light" ? "default" : "outline"}
                                    onClick={() => setSelectedMetric("light")}
                                    className="text-xs"
                                >
                                    Light
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={400}>
                                <LineChart data={timeSeriesData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#9caf88" opacity={0.3} />
                                    <XAxis dataKey="date" stroke="#9caf88" fontSize={12} />
                                    <YAxis stroke="#9caf88" fontSize={12} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                            border: '1px solid #9caf88',
                                            borderRadius: '8px'
                                        }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey={selectedMetric === "temperature" ? "temperature_avg" :
                                            selectedMetric === "humidity" ? "humidity" : "light_exposure"}
                                        stroke={selectedMetric === "temperature" ? "#c65d07" :
                                            selectedMetric === "humidity" ? "#1e3a5f" : "#d4af37"}
                                        strokeWidth={3}
                                        dot={{ fill: "#1a2e1a", strokeWidth: 2, r: 4 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="comparison">
                    <Card className="luxury-card">
                        <CardHeader>
                            <CardTitle className="text-forest-deep">Temperature Comparison by Location</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={400}>
                                <BarChart data={timeSeriesData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#9caf88" opacity={0.3} />
                                    <XAxis dataKey="location" stroke="#9caf88" fontSize={12} />
                                    <YAxis stroke="#9caf88" fontSize={12} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                            border: '1px solid #9caf88',
                                            borderRadius: '8px'
                                        }}
                                    />
                                    <Bar dataKey="temperature_avg" fill="#c65d07" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="ecosystem">
                    {radarData.length > 0 ? (
                        <Card className="luxury-card">
                            <CardHeader>
                                <CardTitle className="text-forest-deep">Ecosystem Profiles</CardTitle>
                                <p className="text-sm text-sage-soft">Comparing environmental conditions across locations</p>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={400}>
                                    <RadarChart data={radarData[0]}>
                                        <PolarGrid stroke="#9caf88" opacity={0.3} />
                                        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fill: '#9caf88' }} />
                                        <PolarRadiusAxis
                                            angle={90}
                                            domain={[0, 100]}
                                            tick={{ fontSize: 10, fill: '#9caf88' }}
                                        />
                                        <Radar
                                            name="Environmental Profile"
                                            dataKey="value"
                                            stroke="#1a2e1a"
                                            fill="#9caf88"
                                            fillOpacity={0.3}
                                            strokeWidth={2}
                                        />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="luxury-card">
                            <CardContent className="p-8 text-center">
                                <Thermometer className="w-12 h-12 mx-auto mb-4 text-sage-soft/50" />
                                <p className="text-sage-soft">Not enough data for ecosystem comparison</p>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}