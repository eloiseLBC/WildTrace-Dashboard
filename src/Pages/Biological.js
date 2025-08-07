import React, { useState, useEffect } from "react";
import { BiologicalData, Location } from "@/entities/all";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, ScatterChart, Scatter, Cell } from 'recharts';
import { Heart, Activity, Thermometer, Moon, Wind, TrendingUp, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

export default function Biological() {
    const [biologicalData, setBiologicalData] = useState([]);
    const [locations, setLocations] = useState([]);
    const [selectedLocation, setSelectedLocation] = useState("all");
    const [selectedMetric, setSelectedMetric] = useState("heart_rate");
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [bioData, locationsData] = await Promise.all([
                BiologicalData.list('date'),
                Location.list('arrival_date')
            ]);

            setBiologicalData(bioData);
            setLocations(locationsData);
        } catch (error) {
            console.error("Error loading biological data:", error);
        }
        setIsLoading(false);
    };

    const getFilteredData = () => {
        if (selectedLocation === "all") return biologicalData;
        return biologicalData.filter(data => data.location_id === selectedLocation);
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

    const getHarmonyZones = () => {
        const filteredData = getFilteredData();
        return filteredData.map(data => ({
            location: getLocationName(data.location_id),
            date: format(new Date(data.date), 'MMM d'),
            harmony_score: calculateHarmonyScore(data),
            stress_level: data.stress_level,
            sleep_quality: data.sleep_quality_score,
            hrv: data.heart_rate_variability
        }));
    };

    const calculateHarmonyScore = (data) => {
        // Higher HRV, better sleep, lower stress = higher harmony
        const hrvScore = Math.min(100, (data.heart_rate_variability / 50) * 100);
        const sleepScore = (data.sleep_quality_score / 10) * 100;
        const stressScore = ((10 - data.stress_level) / 10) * 100;

        return (hrvScore + sleepScore + stressScore) / 3;
    };

    const getBiometricStats = () => {
        const filteredData = getFilteredData();
        if (filteredData.length === 0) return {};

        return {
            heartRate: {
                avg: filteredData.reduce((sum, d) => sum + (d.heart_rate_resting || 0), 0) / filteredData.length,
                range: [
                    Math.min(...filteredData.map(d => d.heart_rate_resting || 0)),
                    Math.max(...filteredData.map(d => d.heart_rate_resting || 0))
                ]
            },
            hrv: {
                avg: filteredData.reduce((sum, d) => sum + (d.heart_rate_variability || 0), 0) / filteredData.length
            },
            sleep: {
                avg: filteredData.reduce((sum, d) => sum + (d.sleep_quality_score || 0), 0) / filteredData.length,
                avgDuration: filteredData.reduce((sum, d) => sum + (d.sleep_duration || 0), 0) / filteredData.length
            },
            stress: {
                avg: filteredData.reduce((sum, d) => sum + (d.stress_level || 0), 0) / filteredData.length
            }
        };
    };

    const getStressColor = (stressLevel) => {
        if (stressLevel <= 3) return "#9caf88"; // Low stress - sage
        if (stressLevel <= 6) return "#d4af37"; // Medium stress - gold
        return "#c65d07"; // High stress - terracotta
    };

    if (isLoading) {
        return (
            <div className="p-8 space-y-6">
                <div className="space-y-4">
                    <div className="h-8 w-64 bg-stone/20 rounded animate-pulse"></div>
                    <div className="h-4 w-96 bg-stone/20 rounded animate-pulse"></div>
                </div>
                <div className="grid md:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-32 bg-stone/20 rounded-xl animate-pulse"></div>
                    ))}
                </div>
                <div className="h-96 bg-stone/20 rounded-xl animate-pulse"></div>
            </div>
        );
    }

    const stats = getBiometricStats();
    const timeSeriesData = prepareTimeSeriesData();
    const harmonyData = getHarmonyZones();

    return (
        <div className="p-4 md:p-8 space-y-8 bg-gradient-to-br from-cream via-white to-stone/10 min-h-screen">
            {/* Header */}
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-navy-deep to-terracotta rounded-xl flex items-center justify-center">
                        <Heart className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-forest-deep tracking-tight">Biological Responses</h1>
                        <p className="text-sage-soft font-medium">How your body adapted to each environment</p>
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
                        {getFilteredData().length} biometric readings
                    </Badge>
                </div>
            </div>

            {/* Biometric Overview */}
            <div className="grid md:grid-cols-4 gap-6">
                <Card className="luxury-card">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-forest-deep flex items-center gap-2 text-sm font-medium">
                            <Heart className="w-4 h-4 text-terracotta" />
                            Resting Heart Rate
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <p className="text-2xl font-bold text-forest-deep">{stats.heartRate?.avg.toFixed(0)} BPM</p>
                            <div className="text-xs text-sage-soft">
                                <span>Range: {stats.heartRate?.range[0]}-{stats.heartRate?.range[1]} BPM</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="luxury-card">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-forest-deep flex items-center gap-2 text-sm font-medium">
                            <Activity className="w-4 h-4 text-navy-deep" />
                            Heart Rate Variability
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <p className="text-2xl font-bold text-forest-deep">{stats.hrv?.avg.toFixed(0)}</p>
                            <div className="text-xs text-sage-soft">Higher = better recovery</div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="luxury-card">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-forest-deep flex items-center gap-2 text-sm font-medium">
                            <Moon className="w-4 h-4 text-gold-accent" />
                            Sleep Quality
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <p className="text-2xl font-bold text-forest-deep">{stats.sleep?.avg.toFixed(1)}/10</p>
                            <div className="text-xs text-sage-soft">{stats.sleep?.avgDuration.toFixed(1)} hours avg</div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="luxury-card">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-forest-deep flex items-center gap-2 text-sm font-medium">
                            <AlertTriangle className="w-4 h-4 text-sage-soft" />
                            Stress Level
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <p className="text-2xl font-bold text-forest-deep">{stats.stress?.avg.toFixed(1)}/10</p>
                            <div className="text-xs text-sage-soft">Lower is better</div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Visualizations */}
            <Tabs defaultValue="timeline" className="space-y-6">
                <TabsList className="bg-white/80 border border-sage-soft/30">
                    <TabsTrigger value="timeline">Body Timeline</TabsTrigger>
                    <TabsTrigger value="harmony">Harmony Zones</TabsTrigger>
                    <TabsTrigger value="correlations">Environment vs Body</TabsTrigger>
                </TabsList>

                <TabsContent value="timeline">
                    <Card className="luxury-card">
                        <CardHeader>
                            <CardTitle className="text-forest-deep">Biological Response Timeline</CardTitle>
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    variant={selectedMetric === "heart_rate" ? "default" : "outline"}
                                    onClick={() => setSelectedMetric("heart_rate")}
                                    className="text-xs"
                                >
                                    Heart Rate
                                </Button>
                                <Button
                                    size="sm"
                                    variant={selectedMetric === "sleep" ? "default" : "outline"}
                                    onClick={() => setSelectedMetric("sleep")}
                                    className="text-xs"
                                >
                                    Sleep Quality
                                </Button>
                                <Button
                                    size="sm"
                                    variant={selectedMetric === "stress" ? "default" : "outline"}
                                    onClick={() => setSelectedMetric("stress")}
                                    className="text-xs"
                                >
                                    Stress Level
                                </Button>
                                <Button
                                    size="sm"
                                    variant={selectedMetric === "hrv" ? "default" : "outline"}
                                    onClick={() => setSelectedMetric("hrv")}
                                    className="text-xs"
                                >
                                    HRV
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={400}>
                                <AreaChart data={timeSeriesData}>
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
                                    <Area
                                        type="monotone"
                                        dataKey={selectedMetric === "heart_rate" ? "heart_rate_resting" :
                                            selectedMetric === "sleep" ? "sleep_quality_score" :
                                                selectedMetric === "stress" ? "stress_level" : "heart_rate_variability"}
                                        stroke={selectedMetric === "heart_rate" ? "#c65d07" :
                                            selectedMetric === "sleep" ? "#d4af37" :
                                                selectedMetric === "stress" ? "#1e3a5f" : "#9caf88"}
                                        fill={selectedMetric === "heart_rate" ? "#c65d07" :
                                            selectedMetric === "sleep" ? "#d4af37" :
                                                selectedMetric === "stress" ? "#1e3a5f" : "#9caf88"}
                                        fillOpacity={0.3}
                                        strokeWidth={3}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="harmony">
                    <Card className="luxury-card">
                        <CardHeader>
                            <CardTitle className="text-forest-deep">Harmony Zones</CardTitle>
                            <p className="text-sm text-sage-soft">Places where your body and mind were most in balance</p>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={400}>
                                <ScatterChart data={harmonyData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#9caf88" opacity={0.3} />
                                    <XAxis dataKey="sleep_quality" name="Sleep Quality" stroke="#9caf88" fontSize={12} />
                                    <YAxis dataKey="hrv" name="Heart Rate Variability" stroke="#9caf88" fontSize={12} />
                                    <Tooltip
                                        cursor={{ strokeDasharray: '3 3' }}
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                const data = payload[0].payload;
                                                return (
                                                    <div className="bg-white/95 border border-sage-soft/30 rounded-lg p-3 shadow-lg">
                                                        <p className="font-semibold text-forest-deep">{data.location}</p>
                                                        <p className="text-sm text-sage-soft">Sleep: {data.sleep_quality}/10</p>
                                                        <p className="text-sm text-sage-soft">HRV: {data.hrv}</p>
                                                        <p className="text-sm text-sage-soft">Stress: {data.stress_level}/10</p>
                                                        <p className="text-sm text-sage-soft">Harmony: {data.harmony_score.toFixed(0)}%</p>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    <Scatter name="Locations" dataKey="harmony_score">
                                        {harmonyData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={getStressColor(entry.stress_level)} />
                                        ))}
                                    </Scatter>
                                </ScatterChart>
                            </ResponsiveContainer>
                            <div className="flex justify-center gap-6 mt-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-sage-soft"></div>
                                    <span className="text-xs text-sage-soft">Low Stress</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-gold-accent"></div>
                                    <span className="text-xs text-sage-soft">Medium Stress</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-terracotta"></div>
                                    <span className="text-xs text-sage-soft">High Stress</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="correlations">
                    <div className="grid md:grid-cols-2 gap-6">
                        <Card className="luxury-card">
                            <CardHeader>
                                <CardTitle className="text-forest-deep">Heart Rate vs Stress</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <ScatterChart data={timeSeriesData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#9caf88" opacity={0.3} />
                                        <XAxis dataKey="stress_level" name="Stress Level" stroke="#9caf88" fontSize={12} />
                                        <YAxis dataKey="heart_rate_resting" name="Resting HR" stroke="#9caf88" fontSize={12} />
                                        <Tooltip
                                            cursor={{ strokeDasharray: '3 3' }}
                                            contentStyle={{
                                                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                                border: '1px solid #9caf88',
                                                borderRadius: '8px'
                                            }}
                                        />
                                        <Scatter name="HR vs Stress" dataKey="heart_rate_resting" fill="#c65d07" />
                                    </ScatterChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        <Card className="luxury-card">
                            <CardHeader>
                                <CardTitle className="text-forest-deep">Sleep vs Recovery</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <ScatterChart data={timeSeriesData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#9caf88" opacity={0.3} />
                                        <XAxis dataKey="sleep_duration" name="Sleep Hours" stroke="#9caf88" fontSize={12} />
                                        <YAxis dataKey="heart_rate_variability" name="HRV" stroke="#9caf88" fontSize={12} />
                                        <Tooltip
                                            cursor={{ strokeDasharray: '3 3' }}
                                            contentStyle={{
                                                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                                border: '1px solid #9caf88',
                                                borderRadius: '8px'
                                            }}
                                        />
                                        <Scatter name="Sleep vs HRV" dataKey="heart_rate_variability" fill="#d4af37" />
                                    </ScatterChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>

            {/* Insights Summary */}
            <div className="grid md:grid-cols-3 gap-6">
                <Card className="luxury-card">
                    <CardHeader>
                        <CardTitle className="text-forest-deep flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-sage-soft" />
                            Best Recovery
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {(() => {
                            const bestHRV = Math.max(...harmonyData.map(d => d.hrv));
                            const bestLocation = harmonyData.find(d => d.hrv === bestHRV);
                            return bestLocation ? (
                                <div>
                                    <p className="font-semibold text-forest-deep">{bestLocation.location}</p>
                                    <p className="text-sm text-sage-soft mt-1">
                                        HRV: {bestLocation.hrv} • Sleep: {bestLocation.sleep_quality}/10
                                    </p>
                                </div>
                            ) : <p className="text-sage-soft">No data available</p>;
                        })()}
                    </CardContent>
                </Card>

                <Card className="luxury-card">
                    <CardHeader>
                        <CardTitle className="text-forest-deep flex items-center gap-2">
                            <Moon className="w-4 h-4 text-gold-accent" />
                            Best Sleep
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {(() => {
                            const bestSleep = Math.max(...harmonyData.map(d => d.sleep_quality));
                            const bestLocation = harmonyData.find(d => d.sleep_quality === bestSleep);
                            return bestLocation ? (
                                <div>
                                    <p className="font-semibold text-forest-deep">{bestLocation.location}</p>
                                    <p className="text-sm text-sage-soft mt-1">
                                        Quality: {bestLocation.sleep_quality}/10 • Stress: {bestLocation.stress_level}/10
                                    </p>
                                </div>
                            ) : <p className="text-sage-soft">No data available</p>;
                        })()}
                    </CardContent>
                </Card>

                <Card className="luxury-card">
                    <CardHeader>
                        <CardTitle className="text-forest-deep flex items-center gap-2">
                            <Heart className="w-4 h-4 text-terracotta" />
                            Calmest Environment
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {(() => {
                            const lowestStress = Math.min(...harmonyData.map(d => d.stress_level));
                            const calmestLocation = harmonyData.find(d => d.stress_level === lowestStress);
                            return calmestLocation ? (
                                <div>
                                    <p className="font-semibold text-forest-deep">{calmestLocation.location}</p>
                                    <p className="text-sm text-sage-soft mt-1">
                                        Stress: {calmestLocation.stress_level}/10 • Harmony: {calmestLocation.harmony_score.toFixed(0)}%
                                    </p>
                                </div>
                            ) : <p className="text-sage-soft">No data available</p>;
                        })()}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}