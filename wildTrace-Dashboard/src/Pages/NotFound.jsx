import React from "react";
import { Link } from "react-router-dom";
import { Compass, Map, Home } from "lucide-react";
import { motion } from "framer-motion";

// Simple helper to mirror your createPageUrl("JourneyMap") => "/journeymap"
const createPageUrl = (name) => `/${String(name || "").toLowerCase()}`;

export default function NotFound() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-[color:var(--cream)] via-white to-[color:var(--stone)]/10 flex items-center justify-center p-4 relative overflow-hidden">
            <style>{`:root{--forest-deep:#1a2e1a;--sage-soft:#9caf88;--terracotta:#c65d07;--gold-accent:#d4af37;--navy-deep:#1e3a5f;--cream:#faf8f3;--stone:#e8e2d4;}`}</style>

            {/* Background floating dots (percent-based, no window.* deps) */}
            <div className="absolute inset-0 -z-10">
                {Array.from({ length: 20 }).map((_, i) => (
                    <motion.span
                        key={`bg-${i}`}
                        className="absolute w-1 h-1 bg-[color:var(--sage-soft)]/10 rounded-full"
                        style={{ left: `${5 + (i * 4) % 90}%`, top: `${(i * 7) % 95}%` }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 0.5, 0] }}
                        transition={{ duration: 8 + (i % 5), repeat: Infinity, delay: (i % 10) * 0.3 }}
                    />
                ))}
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="max-w-2xl w-full text-center"
            >
                <div className="rounded-2xl border border-[color:var(--sage-soft)]/20 bg-white/90 backdrop-blur p-8 sm:p-12 luxury-card">
                    {/* Wobbling compass */}
                    <motion.div
                        initial={{ rotate: 0 }}
                        animate={{ rotate: [0, -10, 10, -5, 5, 0] }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3, ease: "easeInOut" }}
                        className="w-24 h-24 mx-auto bg-gradient-to-br from-[color:var(--sage-soft)] to-[color:var(--forest-deep)] rounded-full flex items-center justify-center mb-8"
                    >
                        <Compass className="w-12 h-12 text-white" />
                    </motion.div>

                    {/* Titles */}
                    <div className="space-y-4">
                        <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-6xl font-bold text-[color:var(--forest-deep)] tracking-tight">
                            404
                        </motion.h1>
                        <motion.h2 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="text-2xl font-semibold text-[color:var(--forest-deep)]">
                            You've wandered off the map
                        </motion.h2>
                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="text-[color:var(--sage-soft)] text-lg leading-relaxed max-w-lg mx-auto">
                            This location doesn't exist in your living data journey. Let's guide you back to familiar territory where your experiences await.
                        </motion.p>
                    </div>

                    {/* Floating data points (local to the card) */}
                    <div className="relative py-8">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <motion.span
                                key={`pt-${i}`}
                                className="absolute w-2 h-2 bg-[color:var(--sage-soft)]/40 rounded-full"
                                style={{ left: `${20 + i * 10}%`, top: "50%" }}
                                initial={{ y: 0, opacity: 0.3 }}
                                animate={{ y: [0, -20, 0], opacity: [0.3, 0.8, 0.3] }}
                                transition={{ duration: 3 + (i % 3), repeat: Infinity, delay: (i % 5) * 0.4 }}
                            />
                        ))}
                    </div>

                    {/* Actions */}
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="space-y-4">
                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                            <Link to={createPageUrl("JourneyMap")} className="inline-flex items-center gap-2 bg-[color:var(--forest-deep)] text-white px-6 py-3 rounded-lg hover:opacity-90">
                                <Map className="w-4 h-4" /> Return to Journey Map
                            </Link>
                            <Link to="/" className="inline-flex items-center gap-2 border px-6 py-3 rounded-lg border-[color:var(--sage-soft)]/30 text-[color:var(--sage-soft)] hover:bg-[color:var(--sage-soft)]/10">
                                <Home className="w-4 h-4" /> Go Home
                            </Link>
                        </div>

                        {/* Quick Navigation */}
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="pt-8">
                            <p className="text-sm text-[color:var(--sage-soft)]/80 mb-4">Quick Navigation</p>
                            <div className="flex flex-wrap justify-center gap-3">
                                {[
                                    { name: "Environmental Data", icon: "🌿", page: "Environmental" },
                                    { name: "Biology", icon: "🧬", page: "Biological" },
                                    { name: "Journal", icon: "📖", page: "Journal" },
                                    { name: "Insights", icon: "🧠", page: "Insights" },
                                ].map((it) => (
                                    <Link key={it.page} to={createPageUrl(it.page)} className="flex items-center gap-2 px-4 py-2 bg-[color:var(--stone)]/10 hover:bg-[color:var(--stone)]/20 rounded-lg transition-colors text-sm text-[color:var(--sage-soft)] hover:text-[color:var(--forest-deep)]">
                                        <span>{it.icon}</span>
                                        <span>{it.name}</span>
                                    </Link>
                                ))}
                            </div>
                        </motion.div>
                    </motion.div>

                    {/* Quote */}
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="pt-8 border-t border-[color:var(--stone)]/20">
                        <blockquote className="text-[color:var(--sage-soft)]/80 italic text-sm">
                            "Not all who wander are lost, but sometimes we need a compass to find our way back to the data."
                        </blockquote>
                    </motion.div>
                </div>
            </motion.div>
        </div>
    );
}
