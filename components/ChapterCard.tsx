"use client";

import Image from "next/image";
import { Play, Pause, Volume2, Loader2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ChapterCardProps {
  title: string;
  content: string;
  imageUrl?: string;
  audioUrl?: string;
  index?: number;
}

// Animated waveform bars component
// Animated waveform bars component
function AudioWaveform({ isPlaying }: { isPlaying: boolean }) {
  const bars = 12;
  const [barConfig, setBarConfig] = useState<Array<{ height: number[]; duration: number }>>([]);

  useEffect(() => {
    setBarConfig(Array.from({ length: bars }).map(() => ({
      height: [8, Math.random() * 24 + 8, 12, Math.random() * 28 + 8, 8],
      duration: 0.8 + Math.random() * 0.4
    })));
  }, []);

  if (barConfig.length === 0) return null; // or return static placeholder

  return (
    <motion.div
      className="flex items-end gap-[3px] h-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: isPlaying ? 1 : 0 }}
      transition={{ duration: 0.3 }}
    >
      {barConfig.map((config, i) => (
        <motion.div
          key={i}
          className="w-1 bg-gradient-to-t from-blue-500 to-purple-400 rounded-full"
          animate={isPlaying ? {
            height: config.height,
          } : { height: 4 }}
          transition={{
            duration: config.duration,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
            delay: i * 0.05,
          }}
        />
      ))}
    </motion.div>
  );
}

// Background waveform effect
function WaveformBackground({ isPlaying }: { isPlaying: boolean }) {
  return (
    <AnimatePresence>
      {isPlaying && (
        <motion.div
          className="absolute inset-0 pointer-events-none overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Animated gradient waves */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/5 to-blue-600/10"
            animate={{
              backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear",
            }}
            style={{ backgroundSize: "200% 200%" }}
          />

          {/* Pulsing circles */}
          <motion.div
            className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-purple-500/10 blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute -left-20 -bottom-20 w-64 h-64 rounded-full bg-blue-500/10 blur-3xl"
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* Sound wave lines */}
          <svg className="absolute inset-0 w-full h-full opacity-20" preserveAspectRatio="none">
            <motion.path
              d="M0,50 Q25,30 50,50 T100,50 T150,50 T200,50"
              fill="none"
              stroke="url(#waveGradient)"
              strokeWidth="2"
              animate={{
                d: [
                  "M0,50 Q25,30 50,50 T100,50 T150,50 T200,50",
                  "M0,50 Q25,70 50,50 T100,50 T150,50 T200,50",
                  "M0,50 Q25,30 50,50 T100,50 T150,50 T200,50",
                ],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0,
              }}
            />
            <defs>
              <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="50%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
          </svg>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function ChapterCard({
  title,
  content,
  imageUrl,
  audioUrl,
  index = 0,
}: ChapterCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlayback = async () => {
    const currentAudioUrl = audioUrl || generatedAudioUrl;

    if (currentAudioUrl) {
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
      } else {
        // Ensure the audio element has the correct src if it changed
        if (audioRef.current && audioRef.current.src !== currentAudioUrl) {
          audioRef.current.src = currentAudioUrl;
          audioRef.current.load();
        }
        audioRef.current?.play();
        setIsPlaying(true);
      }
    } else {
      // Generate Audio via API
      try {
        setIsGenerating(true);
        const response = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: content }),
        });

        if (!response.ok) throw new Error("TTS Failed");

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setGeneratedAudioUrl(url);

        // Auto-play after generation
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.src = url;
            audioRef.current.play();
            setIsPlaying(true);
          }
        }, 100);

      } catch (error) {
        console.error("Failed to generate audio:", error);
        alert("Could not generate audio.");
      } finally {
        setIsGenerating(false);
      }
    }
  };

  useEffect(() => {
    if (audioRef.current) {
      const currentUrl = audioUrl || generatedAudioUrl;
      // Only attempt to control playback if we have a source
      if (currentUrl) {
        if (isPlaying) {
          audioRef.current.play().catch(e => {
            console.error("Play failed:", e);
            setIsPlaying(false);
          });
        } else {
          audioRef.current.pause();
        }
      }
    }
  }, [isPlaying, audioUrl, generatedAudioUrl]);

  const isEven = index % 2 === 0;
  const offsetClass = isEven ? "md:ml-0 md:mr-auto" : "md:ml-auto md:mr-0";

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, x: isEven ? -30 : 30 }}
      whileInView={{ opacity: 1, y: 0, x: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`w-full md:w-[85%] lg:w-[75%] ${offsetClass}`}
    >
      <Card className={`relative overflow-hidden border-border shadow-xl transition-all duration-500 bg-card backdrop-blur-sm hover:scale-[1.01] ${isPlaying ? 'ring-1 ring-ring' : 'hover:border-ring/50'}`}>
        {/* Audio waveform background effect */}
        <WaveformBackground isPlaying={isPlaying} />

        <CardContent className="p-0 relative z-10">
          <div className={`flex flex-col ${isEven ? "md:flex-row" : "md:flex-row-reverse"} gap-0`}>
            {/* Image Section */}
            <div className="w-full md:w-1/2 relative min-h-[280px] md:min-h-[350px] overflow-hidden group">
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <div className="text-muted-foreground text-sm">No Image</div>
                </div>
              )}
              <div className={`absolute inset-0 bg-gradient-to-${isEven ? 'r' : 'l'} from-transparent via-transparent to-slate-900/50 pointer-events-none`} />

              {/* Playing indicator on image */}
              <AnimatePresence>
                {isPlaying && (
                  <motion.div
                    className="absolute bottom-4 left-4 flex items-center gap-2 bg-black/60 backdrop-blur-sm px-3 py-2 rounded-full"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                  >
                    <Volume2 className="w-4 h-4 text-purple-400 animate-pulse" />
                    <span className="text-xs text-white/80">Now Playing</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Text Content Section */}
            <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col justify-center space-y-4">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2 tracking-tight leading-tight">
                {title}
              </h2>

              <div className="prose prose-sm md:prose-base prose-invert text-muted-foreground leading-relaxed line-clamp-6 md:line-clamp-none">
                {content}
              </div>

              {/* Audio Control */}
              <div className="pt-3 flex items-center gap-4">
                <Button
                  onClick={togglePlayback}
                  disabled={isGenerating}
                  size="default"
                  className={`gap-2 rounded-full font-medium transition-all duration-300 ${isPlaying
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground border border-border hover:bg-accent hover:scale-105"
                    }`}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Generating...
                    </>
                  ) : isPlaying ? (
                    <>
                      <Pause className="w-4 h-4 fill-current" /> Pause
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" /> Listen
                    </>
                  )}
                </Button>

                {/* Waveform visualization */}
                <AudioWaveform isPlaying={isPlaying} />

                <audio
                  ref={audioRef}
                  // src is handled dynamically
                  onEnded={() => setIsPlaying(false)}
                  className="hidden"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
