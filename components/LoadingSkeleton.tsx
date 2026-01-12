"use client";

import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

interface SkeletonChapterCardProps {
    index?: number;
}

export function SkeletonChapterCard({ index = 0 }: SkeletonChapterCardProps) {
    const isEven = index % 2 === 0;
    const offsetClass = isEven ? "md:ml-0 md:mr-auto" : "md:ml-auto md:mr-0";

    return (
        <motion.div
            initial={{ opacity: 0, y: 50, x: isEven ? -30 : 30 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className={`w-full md:w-[85%] lg:w-[75%] ${offsetClass}`}
        >
            <Card className="overflow-hidden border-border shadow-xl bg-card backdrop-blur-sm">
                <CardContent className="p-0">
                    <div className={`flex flex-col ${isEven ? "md:flex-row" : "md:flex-row-reverse"} gap-0`}>
                        {/* Image Skeleton */}
                        <div className="w-full md:w-1/2 relative min-h-[280px] md:min-h-[350px] bg-muted overflow-hidden">
                            <div className="absolute inset-0 shimmer-animation" />
                        </div>

                        {/* Text Content Skeleton */}
                        <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col justify-center space-y-4">
                            {/* Title skeleton */}
                            <div className="h-8 w-3/4 bg-muted rounded-lg overflow-hidden relative">
                                <div className="absolute inset-0 shimmer-animation" />
                            </div>

                            {/* Content lines skeleton */}
                            <div className="space-y-3">
                                <div className="h-4 w-full bg-muted/70 rounded overflow-hidden relative">
                                    <div className="absolute inset-0 shimmer-animation" />
                                </div>
                                <div className="h-4 w-5/6 bg-muted/70 rounded overflow-hidden relative">
                                    <div className="absolute inset-0 shimmer-animation" />
                                </div>
                                <div className="h-4 w-4/5 bg-muted/70 rounded overflow-hidden relative">
                                    <div className="absolute inset-0 shimmer-animation" />
                                </div>
                                <div className="h-4 w-full bg-muted/70 rounded overflow-hidden relative">
                                    <div className="absolute inset-0 shimmer-animation" />
                                </div>
                            </div>

                            {/* Audio button skeleton */}
                            <div className="pt-3">
                                <div className="h-10 w-28 bg-muted rounded-full overflow-hidden relative">
                                    <div className="absolute inset-0 shimmer-animation" />
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}

export function LoadingStory({ language }: { language: "en" | "de" }) {
    const loadingTexts = {
        en: {
            title: "Creating Your Story...",
            subtitle: "AI is crafting images and narration for your magical tale",
            steps: ["Writing story", "Creating art", "Recording voice"]
        },
        de: {
            title: "Geschichte wird erstellt...",
            subtitle: "KI erstellt Bilder und Erzählung für deine magische Geschichte",
            steps: ["Geschichte schreiben", "Bilder erstellen", "Stimme aufnehmen"]
        }
    };

    const t = loadingTexts[language];

    return (
        <div className="min-h-screen bg-background">
            <header className="bg-card/90 border-b border-border py-4 sticky top-0 z-30 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
                    <div className="h-8 w-56 bg-muted rounded-lg overflow-hidden relative">
                        <div className="absolute inset-0 shimmer-animation" />
                    </div>
                </div>
            </header>

            <main className="py-12 px-6 max-w-6xl mx-auto">
                {/* Loading message */}
                <motion.div
                    className="text-center mb-12"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
                        {t.title}
                    </h2>
                    <p className="text-muted-foreground mb-8">{t.subtitle}</p>

                    {/* Animated steps */}
                    <div className="flex justify-center gap-3 flex-wrap">
                        {t.steps.map((step, i) => (
                            <motion.div
                                key={i}
                                className="flex items-center gap-2 text-sm text-foreground bg-secondary px-4 py-2 rounded-full border border-border"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.3 }}
                            >
                                <motion.div
                                    className="w-2 h-2 bg-primary rounded-full"
                                    animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                                    transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
                                />
                                {step}
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Skeleton cards with staggered layout */}
                <div className="space-y-16 md:space-y-20">
                    {[0, 1, 2, 3].map((index) => (
                        <SkeletonChapterCard key={index} index={index} />
                    ))}
                </div>
            </main>

            <style jsx global>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .shimmer-animation {
          background: linear-gradient(
            90deg,
            transparent,
            hsl(var(--foreground) / 0.05),
            transparent
          );
          animation: shimmer 2s infinite;
        }
      `}</style>
        </div>
    );
}
