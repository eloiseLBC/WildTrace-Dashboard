import React, { useState, useEffect } from "react";
import { JournalEntry, Location } from "@/entities/all";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { BookOpen, Heart, Star, MapPin, Calendar, Plus, Search, Filter, Image as ImageIcon, Mic } from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

const EMOTIONS = ["calm", "joy", "excitement", "fear", "anxiety", "fatigue", "wonder", "peace", "stress", "curiosity", "melancholy", "euphoria"];

const EMOTION_COLORS = {
    calm: "bg-sage-soft/20 text-sage-soft border-sage-soft/30",
    joy: "bg-gold-accent/20 text-gold-accent border-gold-accent/30",
    excitement: "bg-terracotta/20 text-terracotta border-terracotta/30",
    fear: "bg-navy-deep/20 text-navy-deep border-navy-deep/30",
    anxiety: "bg-red-100 text-red-800 border-red-200",
    fatigue: "bg-gray-100 text-gray-700 border-gray-200",
    wonder: "bg-purple-100 text-purple-800 border-purple-200",
    peace: "bg-sage-soft/20 text-sage-soft border-sage-soft/30",
    stress: "bg-terracotta/20 text-terracotta border-terracotta/30",
    curiosity: "bg-blue-100 text-blue-800 border-blue-200",
    melancholy: "bg-indigo-100 text-indigo-800 border-indigo-200",
    euphoria: "bg-pink-100 text-pink-800 border-pink-200"
};

export default function Journal() {
    const [journalEntries, setJournalEntries] = useState([]);
    const [locations, setLocations] = useState([]);
    const [selectedLocation, setSelectedLocation] = useState("all");
    const [selectedEmotion, setSelectedEmotion] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [showNewEntry, setShowNewEntry] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [entriesData, locationsData] = await Promise.all([
                JournalEntry.list('-date'),
                Location.list('arrival_date')
            ]);

            setJournalEntries(entriesData);
            setLocations(locationsData);
        } catch (error) {
            console.error("Error loading journal data:", error);
        }
        setIsLoading(false);
    };

    const getLocationName = (locationId) => {
        const location = locations.find(loc => loc.id === locationId);
        return location ? location.name : "Unknown Location";
    };

    const getFilteredEntries = () => {
        let filtered = journalEntries;

        if (selectedLocation !== "all") {
            filtered = filtered.filter(entry => entry.location_id === selectedLocation);
        }

        if (selectedEmotion !== "all") {
            filtered = filtered.filter(entry => entry.emotions?.includes(selectedEmotion));
        }

        if (searchQuery) {
            filtered = filtered.filter(entry =>
                entry.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                entry.content?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        return filtered;
    };

    const getHighlightMoments = () => {
        return journalEntries.filter(entry => entry.highlight_moment);
    };

    const getEmotionStats = () => {
        const emotionCounts = {};
        journalEntries.forEach(entry => {
            entry.emotions?.forEach(emotion => {
                emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
            });
        });

        return Object.entries(emotionCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 6);
    };

    const getMoodTrend = () => {
        return journalEntries
            .filter(entry => entry.mood_score)
            .map(entry => ({
                date: format(new Date(entry.date), 'MMM d'),
                mood: entry.mood_score,
                location: getLocationName(entry.location_id)
            }));
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
                        <div key={i} className="h-64 bg-stone/20 rounded-xl animate-pulse"></div>
                    ))}
                </div>
            </div>
        );
    }

    const filteredEntries = getFilteredEntries();
    const highlightMoments = getHighlightMoments();
    const emotionStats = getEmotionStats();

    return (
        <div className="p-4 md:p-8 space-y-8 bg-gradient-to-br from-cream via-white to-stone/10 min-h-screen">
            {/* Header */}
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-gold-accent to-terracotta rounded-xl flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-forest-deep tracking-tight">Emotional Journey</h1>
                        <p className="text-sage-soft font-medium">Stories, feelings, and memories from the road</p>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex flex-wrap gap-4">
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-3 text-sage-soft" />
                        <Input
                            placeholder="Search entries..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 w-64 bg-white/80 border-sage-soft/30"
                        />
                    </div>

                    <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                        <SelectTrigger className="w-48 bg-white/80 border-sage-soft/30">
                            <SelectValue placeholder="Filter by location" />
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

                    <Select value={selectedEmotion} onValueChange={setSelectedEmotion}>
                        <SelectTrigger className="w-48 bg-white/80 border-sage-soft/30">
                            <SelectValue placeholder="Filter by emotion" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Emotions</SelectItem>
                            {EMOTIONS.map(emotion => (
                                <SelectItem key={emotion} value={emotion}>
                                    {emotion.charAt(0).toUpperCase() + emotion.slice(1)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Dialog open={showNewEntry} onOpenChange={setShowNewEntry}>
                        <DialogTrigger asChild>
                            <Button className="bg-forest-deep hover:bg-forest-deep/90">
                                <Plus className="w-4 h-4 mr-2" />
                                New Entry
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>Create New Journal Entry</DialogTitle>
                            </DialogHeader>
                            <NewEntryForm
                                locations={locations}
                                onSave={loadData}
                                onClose={() => setShowNewEntry(false)}
                            />
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="flex gap-4">
                    <Badge variant="outline" className="bg-white/80 border-sage-soft/30">
                        {filteredEntries.length} entries
                    </Badge>
                    <Badge variant="outline" className="bg-white/80 border-sage-soft/30">
                        <Star className="w-3 h-3 mr-1" />
                        {highlightMoments.length} highlights
                    </Badge>
                </div>
            </div>

            {/* Emotion Overview */}
            <div className="grid md:grid-cols-4 gap-6">
                <Card className="luxury-card md:col-span-3">
                    <CardHeader>
                        <CardTitle className="text-forest-deep">Emotional Landscape</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {emotionStats.map(([emotion, count]) => (
                                <Badge
                                    key={emotion}
                                    className={`${EMOTION_COLORS[emotion]} border cursor-pointer hover:opacity-80 transition-opacity`}
                                    onClick={() => setSelectedEmotion(emotion)}
                                >
                                    {emotion} ({count})
                                </Badge>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="luxury-card">
                    <CardHeader>
                        <CardTitle className="text-forest-deep flex items-center gap-2">
                            <Heart className="w-4 h-4 text-terracotta" />
                            Average Mood
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <p className="text-2xl font-bold text-forest-deep">
                                {(journalEntries.reduce((sum, entry) => sum + (entry.mood_score || 0), 0) / journalEntries.length).toFixed(1)}/10
                            </p>
                            <div className="text-xs text-sage-soft">Across all locations</div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Highlight Moments */}
            {highlightMoments.length > 0 && (
                <Card className="luxury-card">
                    <CardHeader>
                        <CardTitle className="text-forest-deep flex items-center gap-2">
                            <Star className="w-5 h-5 text-gold-accent" />
                            Highlight Moments
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-2 gap-4">
                            {highlightMoments.slice(0, 4).map((entry) => (
                                <div key={entry.id} className="p-4 bg-gradient-to-r from-gold-accent/10 to-terracotta/10 rounded-lg border border-gold-accent/20">
                                    <div className="flex items-start justify-between mb-2">
                                        <h4 className="font-semibold text-forest-deep">{entry.title}</h4>
                                        <Badge variant="outline" className="text-xs">
                                            {getLocationName(entry.location_id)}
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-sage-soft leading-relaxed mb-3">
                                        {entry.content.length > 120
                                            ? `${entry.content.substring(0, 120)}...`
                                            : entry.content
                                        }
                                    </p>
                                    <div className="flex gap-1">
                                        {entry.emotions?.slice(0, 3).map((emotion, idx) => (
                                            <Badge key={idx} className={`${EMOTION_COLORS[emotion]} text-xs`}>
                                                {emotion}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Journal Entries */}
            <div className="space-y-6">
                <h2 className="text-xl font-bold text-forest-deep">All Entries</h2>

                <AnimatePresence>
                    <div className="space-y-6">
                        {filteredEntries.map((entry) => (
                            <motion.div
                                key={entry.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3 }}
                            >
                                <Card className="luxury-card hover:shadow-xl transition-all duration-300">
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-3">
                                                    {entry.highlight_moment && (
                                                        <Star className="w-4 h-4 text-gold-accent fill-gold-accent" />
                                                    )}
                                                    <h3 className="text-xl font-bold text-forest-deep">{entry.title}</h3>
                                                </div>
                                                <div className="flex items-center gap-4 text-sm text-sage-soft">
                                                    <div className="flex items-center gap-1">
                                                        <MapPin className="w-3 h-3" />
                                                        {getLocationName(entry.location_id)}
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" />
                                                        {format(new Date(entry.date), 'MMM d, yyyy')}
                                                    </div>
                                                    {entry.mood_score && (
                                                        <div className="flex items-center gap-1">
                                                            <Heart className="w-3 h-3" />
                                                            {entry.mood_score}/10
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="prose prose-stone max-w-none">
                                            <p className="text-forest-deep leading-relaxed whitespace-pre-wrap">
                                                {entry.content}
                                            </p>
                                        </div>

                                        {entry.emotions && entry.emotions.length > 0 && (
                                            <div className="flex flex-wrap gap-2">
                                                {entry.emotions.map((emotion, idx) => (
                                                    <Badge key={idx} className={`${EMOTION_COLORS[emotion]} border`}>
                                                        {emotion}
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}

                                        {(entry.image_url || entry.audio_url) && (
                                            <div className="flex gap-4 pt-4 border-t border-stone/20">
                                                {entry.image_url && (
                                                    <div className="flex items-center gap-2 text-sm text-sage-soft">
                                                        <ImageIcon className="w-4 h-4" />
                                                        <span>Image attached</span>
                                                    </div>
                                                )}
                                                {entry.audio_url && (
                                                    <div className="flex items-center gap-2 text-sm text-sage-soft">
                                                        <Mic className="w-4 h-4" />
                                                        <span>Audio note</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </AnimatePresence>

                {filteredEntries.length === 0 && (
                    <Card className="luxury-card">
                        <CardContent className="p-8 text-center">
                            <BookOpen className="w-12 h-12 mx-auto mb-4 text-sage-soft/50" />
                            <p className="text-sage-soft">No entries match your current filters</p>
                            <Button
                                onClick={() => {
                                    setSelectedLocation("all");
                                    setSelectedEmotion("all");
                                    setSearchQuery("");
                                }}
                                variant="outline"
                                className="mt-4"
                            >
                                Clear Filters
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}

function NewEntryForm({ locations, onSave, onClose }) {
    const [formData, setFormData] = useState({
        location_id: "",
        date: new Date().toISOString().split('T')[0],
        title: "",
        content: "",
        emotions: [],
        mood_score: 5,
        highlight_moment: false
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await JournalEntry.create(formData);
            onSave();
            onClose();
        } catch (error) {
            console.error("Error creating journal entry:", error);
        }
    };

    const toggleEmotion = (emotion) => {
        setFormData(prev => ({
            ...prev,
            emotions: prev.emotions.includes(emotion)
                ? prev.emotions.filter(e => e !== emotion)
                : [...prev.emotions, emotion]
        }));
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-forest-deep">Location</label>
                    <Select
                        value={formData.location_id}
                        onValueChange={(value) => setFormData(prev => ({...prev, location_id: value}))}
                        required
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select location" />
                        </SelectTrigger>
                        <SelectContent>
                            {locations.map(location => (
                                <SelectItem key={location.id} value={location.id}>
                                    {location.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-forest-deep">Date</label>
                    <Input
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData(prev => ({...prev, date: e.target.value}))}
                        required
                    />
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-forest-deep">Title</label>
                <Input
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({...prev, title: e.target.value}))}
                    placeholder="Give your entry a title..."
                    required
                />
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-forest-deep">Content</label>
                <Textarea
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({...prev, content: e.target.value}))}
                    placeholder="Write about your experience..."
                    rows={6}
                    required
                />
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-forest-deep">Emotions</label>
                <div className="flex flex-wrap gap-2">
                    {EMOTIONS.map(emotion => (
                        <Badge
                            key={emotion}
                            className={`cursor-pointer transition-all ${
                                formData.emotions.includes(emotion)
                                    ? EMOTION_COLORS[emotion]
                                    : 'bg-stone/10 text-sage-soft border-stone/30 hover:bg-stone/20'
                            }`}
                            onClick={() => toggleEmotion(emotion)}
                        >
                            {emotion}
                        </Badge>
                    ))}
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-forest-deep">
                        Mood Score: {formData.mood_score}/10
                    </label>
                    <input
                        type="range"
                        min="1"
                        max="10"
                        value={formData.mood_score}
                        onChange={(e) => setFormData(prev => ({...prev, mood_score: parseInt(e.target.value)}))}
                        className="w-full"
                    />
                </div>

                <div className="flex items-center gap-2 pt-6">
                    <input
                        type="checkbox"
                        id="highlight"
                        checked={formData.highlight_moment}
                        onChange={(e) => setFormData(prev => ({...prev, highlight_moment: e.target.checked}))}
                        className="rounded"
                    />
                    <label htmlFor="highlight" className="text-sm font-medium text-forest-deep">
                        Mark as highlight moment
                    </label>
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={onClose}>
                    Cancel
                </Button>
                <Button type="submit" className="bg-forest-deep hover:bg-forest-deep/90">
                    Save Entry
                </Button>
            </div>
        </form>
    );
}