"use client";

import { ChapterCard } from "@/components/ChapterCard";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";

// Example Story: "The Pulsing Vein of Ares" - A curious root on Mars
const STORY_DATA = [
    {
        title: "The Glint in the Dust",
        content: `In the silent expanse of the Gale Crater, the rover 'Aurelius' crunched over the oxidized iron sands. Its high-definition cameras panned across the desolate landscape until they snagged on something impossible. Tucked beneath a jagged shelf of basalt was a translucent, amber-colored fiber. It wasn't a mineral formation or a trick of the light. It was a root, thin as a wire, pulsing with a rhythmic, bioluminescent glow that defied the freezing Martian wind.`,
        imageUrl: "/story/chapter1.png",
        audioUrl: "/story/chapter1.wav",
    },
    {
        title: "The Subsurface Song",
        content: `As Aurelius deployed its drill for a micro-sample, the root reacted. It didn't break; it retreated, pulling deeper into the regolith like a startled worm. The rover's seismic sensors picked up a low-frequency hum vibrating through the crust. This was no solitary organism. The root was merely a sensory tip, a tiny nerve ending belonging to a massive, dormant biological network that had survived beneath the permafrost for eons, hidden from the prying eyes of the cosmos.`,
        imageUrl: "/story/chapter2.png",
        audioUrl: "/story/chapter2.wav",
    },
    {
        title: "First Contact",
        content: `Mission Control was in chaos. Scientists argued over data streams, but Dr. Elena Vasquez saw what others missed. The hum wasn't random — it was patterned, repeating. A language. She instructed Aurelius to respond with a simple electromagnetic pulse. For hours, nothing. Then, the ground beneath the rover began to glow. Thousands of roots surfaced simultaneously, weaving together to form a shape: a perfect circle with a single point in the center. The universal symbol for 'here.' It was saying hello.`,
        imageUrl: "/story/chapter3.png",
        audioUrl: "/story/chapter3.wav",
    },
    {
        title: "The Awakening Garden",
        content: `Over the following weeks, something miraculous unfolded. Wherever the roots touched the surface, they released ancient water vapor, creating tiny pockets of atmosphere. Microscopic spores, dormant for millennia, began to bloom into alien lichen, painting the red dust in patches of emerald and gold. Mars was waking up. And at the heart of it all, the curious root network pulsed with what could only be described as joy — a planet-sized organism that had waited billions of years just to share its garden with someone new.`,
        imageUrl: "/story/chapter4.png",
        audioUrl: "/story/chapter4.wav",
    },
];

function AdminAudioGenerator() {
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [msg, setMsg] = useState("");

    const generate = async () => {
        const key = localStorage.getItem("user_gemini_key");
        if (!key) {
            alert("Please set your Gemini API Key in the settings on the home page first.");
            return;
        }

        try {
            setStatus("loading");
            const res = await fetch("/api/generate-static-audio", {
                method: "POST",
                headers: {
                    "X-Gemini-Key": key
                }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed");

            setStatus("success");
            setMsg("Audio generated! Refresh page to listen.");
        } catch (e: any) {
            setStatus("error");
            setMsg(e.message);
        }
    };

    if (status === "success") return <div className="text-green-400 text-sm font-medium">{msg}</div>;

    return (
        <div className="flex flex-col items-center gap-2">
            <Button
                onClick={generate}
                disabled={status === "loading"}
                variant="outline"
                className="bg-slate-900/50 border-slate-700 text-slate-300 hover:text-white"
            >
                {status === "loading" ? "Generating Audio Assets..." : "Generate Audio Assets (Admin)"}
            </Button>
            {status === "error" && <div className="text-red-400 text-xs">{msg}</div>}
        </div>
    );
}


export default function StoryPage() {
    const [stars, setStars] = useState<Array<{ top: string; left: string; animationDuration: string; animationDelay: string }>>([]);

    useEffect(() => {
        const newStars = [...Array(30)].map(() => ({
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            animationDuration: `${2 + Math.random() * 2}s`,
            animationDelay: `${Math.random() * 3}s`,
        }));
        setStars(newStars);
    }, []);

    return (
        <div className="min-h-screen bg-slate-950 relative overflow-hidden font-sans">
            {/* Animated background effects */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-600/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-red-600/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-amber-600/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />

                {/* Stars */}
                {stars.map((star, i) => (
                    <div
                        key={i}
                        className="absolute w-1 h-1 bg-white/30 rounded-full"
                        style={{
                            top: star.top,
                            left: star.left,
                            animation: `twinkle ${star.animationDuration} ease-in-out infinite`,
                            animationDelay: star.animationDelay,
                        }}
                    />
                ))}

                <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />
            </div>

            <header className="relative z-40 bg-slate-900/80 border-b border-slate-800 py-4 sticky top-0 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
                    <Link href="/">
                        <Button variant="ghost" className="gap-2 text-slate-400 hover:text-white">
                            <ArrowLeft className="w-4 h-4" /> Back to Home
                        </Button>
                    </Link>
                    <h1 className="text-xl font-bold bg-gradient-to-r from-orange-400 via-red-400 to-amber-400 bg-clip-text text-transparent">
                        Example Story
                    </h1>
                </div>
            </header>

            <main className="relative z-10 py-12 px-6 max-w-6xl mx-auto">
                <div className="text-center max-w-3xl mx-auto mb-16 space-y-6">
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white bg-gradient-to-r from-orange-300 via-red-300 to-amber-300 bg-clip-text text-transparent">
                        The Pulsing Vein of Ares
                    </h1>
                    <p className="text-lg text-slate-400 leading-relaxed">
                        A curious root on Mars discovers humanity, and shares its ancient garden with the cosmos.
                    </p>

                    {/* Admin Audio Generation Control */}
                    <div className="pt-4">
                        <AdminAudioGenerator />
                    </div>
                </div>

                <div className="relative">
                    <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-orange-500/0 via-red-500/30 to-orange-500/0 hidden md:block" />

                    <div className="space-y-8 md:space-y-12">
                        {STORY_DATA.map((chapter, index) => (
                            <div key={index} className="relative">
                                {index > 0 && (
                                    <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 -top-6 z-10">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-600 to-red-600 flex items-center justify-center text-white font-bold shadow-lg shadow-red-500/20 animate-pulse">
                                            {index + 1}
                                        </div>
                                    </div>
                                )}
                                <ChapterCard
                                    {...chapter}
                                    index={index}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </main>

            <footer className="relative z-10 bg-slate-900/50 py-12 mt-24 border-t border-slate-800">
                <div className="text-center text-slate-500">
                    <p>© 2026 AI Storyteller. Powered by Gemini & Next.js.</p>
                </div>
            </footer>

            <style jsx global>{`
                @keyframes twinkle {
                    0%, 100% { opacity: 0.3; }
                    50% { opacity: 1; }
                }
            `}</style>
        </div>
    );
}
