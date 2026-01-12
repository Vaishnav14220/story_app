
"use client";

import { useState, useCallback } from "react";
import { Upload, Sparkles, BookOpen, RefreshCw, Loader2, Globe, ArrowLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { ChapterCard } from "@/components/ChapterCard";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { SettingsDialog } from "@/components/ui/SettingsDialog";
import { LoadingStory } from "@/components/LoadingSkeleton";

// Translations
const translations = {
  en: {
    title: "AI Storyteller",
    example: "Example",
    createNew: "Create New",
    mainTitle: "Weave Your Tale",
    mainDescription: "Spark your imagination. Provide ideas and a character, and let AI craft a magical journey.",
    storyIdeas: "Story Ideas (Bullet Points)",
    storyPlaceholder: "- A curious robot exploring Mars\n- Finds a glowing crystal\n- Befriends a Martian rock",
    provider: "AI Provider",
    character: "Character Template (Optional)",
    uploadCharacter: "Upload Character",
    generateStory: "Generate Story",
    loadingOpenAI: "Weaving with OpenAI...",
    loadingGemini: "Dreaming with Gemini...",
    language: "Language",
    english: "English",
    german: "Deutsch",
  },
  de: {
    title: "KI Geschichtenerzähler",
    example: "Beispiel",
    createNew: "Neu Erstellen",
    mainTitle: "Erschaffe Deine Geschichte",
    mainDescription: "Lass deiner Fantasie freien Lauf. Gib Ideen und einen Charakter an, und lass die KI eine magische Reise erschaffen.",
    storyIdeas: "Geschichtsideen (Stichpunkte)",
    storyPlaceholder: "- Ein neugieriger Roboter erkundet den Mars\n- Findet einen leuchtenden Kristall\n- Freundet sich mit einem Marsstein an",
    provider: "KI Anbieter",
    character: "Charakter Vorlage (Optional)",
    uploadCharacter: "Charakter Hochladen",
    generateStory: "Geschichte Erstellen",
    loadingOpenAI: "Erstelle mit OpenAI...",
    loadingGemini: "Träume mit Gemini...",
    language: "Sprache",
    english: "English",
    german: "Deutsch",
  }
};

export default function GeneratorPage() {
  const [prompt, setPrompt] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [provider, setProvider] = useState("openai");
  const [language, setLanguage] = useState<"en" | "de">("en");
  const [isLoading, setIsLoading] = useState(false);
  const [storyData, setStoryData] = useState<any>(null);
  const [apiKeys, setApiKeys] = useState<{ openai: string; gemini: string }>({ openai: "", gemini: "" });

  const t = translations[language];

  const handleKeysChange = useCallback((keys: { openai: string; gemini: string }) => {
    setApiKeys(keys);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("prompt", prompt);
      formData.append("provider", provider);
      formData.append("language", language);
      if (file) {
        formData.append("file", file);
      }

      const headers: HeadersInit = {};
      if (apiKeys.openai) headers["X-OpenAI-Key"] = apiKeys.openai;
      if (apiKeys.gemini) headers["X-Gemini-Key"] = apiKeys.gemini;

      const response = await fetch("/api/generate", {
        method: "POST",
        body: formData,
        headers,
      });

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setStoryData(data);
    } catch (error) {
      console.error("Failed to generate:", error);
      alert(language === "de"
        ? "Geschichte konnte nicht erstellt werden. Bitte prüfe deine API-Schlüssel."
        : "Failed to generate story. Please check your API keys and try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading skeleton while generating
  if (isLoading) {
    return <LoadingStory language={language} />;
  }

  if (storyData) {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden">
        {/* Subtle background effects */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          {/* Muted gradient mesh */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-muted/30 rounded-full blur-[120px]" />
          <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-muted/20 rounded-full blur-[100px]" />
          <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-muted/25 rounded-full blur-[100px]" />

          {/* Grid pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(hsl(var(--muted)/0.05)_1px,transparent_1px),linear-gradient(90deg,hsl(var(--muted)/0.05)_1px,transparent_1px)] bg-[size:60px_60px]" />
        </div>

        <header className="relative z-40 bg-card/90 border-b border-border py-4 sticky top-0 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => setStoryData(null)}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </Button>
              <h1 className="text-xl font-semibold text-foreground">
                {storyData.title || "Your Magic Story"}
              </h1>
            </div>
            <Button
              variant="outline"
              onClick={() => setStoryData(null)}
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" /> {t.createNew}
            </Button>
          </div>
        </header>

        <main className="relative z-10 py-12 px-6 max-w-6xl mx-auto">
          <div className="relative">
            {/* Connecting line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-border/0 via-border to-border/0 hidden md:block" />

            <div className="space-y-8 md:space-y-12">
              {storyData.chapters?.map((chapter: any, index: number) => (
                <div key={index} className="relative">
                  {/* Chapter number indicator */}
                  {index > 0 && (
                    <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 -top-6 z-10">
                      <div className="w-10 h-10 rounded-full bg-secondary border border-border flex items-center justify-center text-muted-foreground text-sm font-medium">
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

        {/* Custom animations */}
        <style jsx global>{`
          @keyframes float {
            0%, 100% { transform: translateY(0) translateX(0); }
            25% { transform: translateY(-20px) translateX(10px); }
            50% { transform: translateY(-10px) translateX(-10px); }
            75% { transform: translateY(-25px) translateX(5px); }
          }
          .animate-float {
            animation: float 6s ease-in-out infinite;
          }
          @keyframes twinkle {
            0%, 100% { opacity: 0.2; transform: scale(1); }
            50% { opacity: 0.8; transform: scale(1.5); }
          }
          .animate-twinkle {
            animation: twinkle 2s ease-in-out infinite;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <header className="bg-card/80 border-b border-border py-4 sticky top-0 z-10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              {t.title}
            </h1>
            <SettingsDialog onKeysChange={handleKeysChange} />
          </div>
          <div className="flex items-center gap-3">
            {/* AI Provider Toggle */}
            <div className="flex items-center bg-secondary rounded-lg p-1 border border-border">
              <Button
                variant="ghost"
                size="sm"
                className={`h-8 px-3 rounded-md text-sm ${provider === "openai" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                onClick={() => setProvider("openai")}
              >
                OpenAI
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`h-8 px-3 rounded-md text-sm ${provider === "google" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                onClick={() => setProvider("google")}
              >
                Gemini
              </Button>
            </div>
            {/* Language Toggle */}
            <div className="flex items-center bg-secondary rounded-lg p-1 border border-border">
              <Button
                variant="ghost"
                size="sm"
                className={`h-8 px-3 rounded-md ${language === "en" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                onClick={() => setLanguage("en")}
              >
                <span className="mr-1">🇬🇧</span> EN
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`h-8 px-3 rounded-md ${language === "de" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                onClick={() => setLanguage("de")}
              >
                <span className="mr-1">🇩🇪</span> DE
              </Button>
            </div>
            <Link href="/story">
              <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground">
                <BookOpen className="w-4 h-4" /> {t.example}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 flex max-w-7xl mx-auto w-full p-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 w-full items-center">
          {/* Left Side: Form */}
          <div className="flex flex-col justify-center">
            <Card className="w-full shadow-2xl border-border bg-card/50 backdrop-blur-sm">
              <CardHeader className="text-center space-y-2 pb-8 pt-10">
                <CardTitle className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  {t.mainTitle}
                </CardTitle>
                <CardDescription className="text-lg text-slate-500 max-w-md mx-auto">
                  {t.mainDescription}
                </CardDescription>
              </CardHeader>

              <CardContent className="px-8 pb-10">
                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="space-y-3">
                    <Label htmlFor="prompt" className="text-base font-semibold">
                      {t.storyIdeas}
                    </Label>
                    <Textarea
                      id="prompt"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder={t.storyPlaceholder}
                      className="min-h-[140px] text-base resize-none focus-visible:ring-blue-500"
                      required
                    />
                  </div>

                  <div className="space-y-3">
                    <Label className="text-base font-semibold">
                      {t.character}
                    </Label>
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                        className="hidden"
                        id="file-upload"
                      />
                      <Label
                        htmlFor="file-upload"
                        className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-slate-800/50 transition-all group"
                      >
                        <div className="flex flex-col items-center justify-center pt-2 pb-3 text-center">
                          <Upload className="w-6 h-6 text-slate-400 group-hover:text-blue-500 mb-2 transition-colors" />
                          <div className="text-sm text-slate-500 group-hover:text-slate-700 dark:text-slate-400">
                            {file ? (
                              <span className="font-semibold text-blue-600 text-sm truncate max-w-[150px] inline-block">{file.name}</span>
                            ) : (
                              <span className="text-sm">{t.uploadCharacter}</span>
                            )}
                          </div>
                        </div>
                      </Label>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-14 text-base font-medium"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        {provider === 'openai' ? t.loadingOpenAI : t.loadingGemini}
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-5 w-5" /> {t.generateStory}
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Right Side: Stunning Characters Hero */}
          <div className="h-full relative hidden lg:flex items-center justify-center min-h-[600px] perspective-1000">
            {/* Glowing orb background */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] animate-pulse" />

            {/* Character Composition */}
            <div className="relative w-full h-full">
              {/* Main center character (Tiger) */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 hover:scale-110 transition-transform duration-500">
                <div className="relative w-80 h-80 drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-float rounded-3xl overflow-hidden">
                  <Image src="/characters/tiger_v2.png" alt="Tiger" fill className="object-cover" />
                </div>
              </div>

              {/* Cactus */}
              <div className="absolute top-[10%] left-[10%] z-10 hover:scale-110 transition-transform duration-300">
                <div className="relative w-48 h-48 drop-shadow-2xl animate-float rounded-2xl overflow-hidden" style={{ animationDelay: '1s' }}>
                  <Image src="/characters/cactus_v2.png" alt="Cactus" fill className="object-cover" />
                </div>
              </div>

              {/* Dragon Fruit */}
              <div className="absolute top-[15%] right-[5%] z-10 hover:scale-110 transition-transform duration-300">
                <div className="relative w-40 h-40 drop-shadow-2xl animate-float rounded-2xl overflow-hidden" style={{ animationDelay: '2s' }}>
                  <Image src="/characters/dragonfruit_v2.png" alt="Dragon Fruit" fill className="object-cover" />
                </div>
              </div>

              {/* Robot */}
              <div className="absolute bottom-[10%] right-[15%] z-30 hover:scale-110 transition-transform duration-300">
                <div className="relative w-56 h-56 drop-shadow-2xl animate-float rounded-2xl overflow-hidden" style={{ animationDelay: '0.5s' }}>
                  <Image src="/characters/robot_v2.png" alt="Robot" fill className="object-cover" />
                </div>
              </div>

              {/* Decorative particles - positioned in gaps between characters */}
              <div className="absolute top-[5%] left-[45%] text-4xl animate-bounce delay-700 opacity-60 z-40 pointer-events-none">✨</div>
              <div className="absolute bottom-[5%] left-[45%] text-5xl animate-pulse delay-1000 opacity-60 z-40 pointer-events-none">⭐</div>
              <div className="absolute top-[50%] left-[5%] text-3xl animate-float delay-500 opacity-50 z-0 pointer-events-none">☁️</div>
              <div className="absolute top-[50%] right-[5%] text-3xl animate-ping delay-2000 opacity-40 z-0 pointer-events-none">💫</div>
            </div>
          </div>

          {/* Previous floating background (kept for mobile/subtle depth) */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10 opacity-30">
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-[100px]" />
            <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-primary/5 rounded-full blur-[100px]" />
          </div>

          {/* Float animation styles */}
          <style jsx global>{`
          @keyframes float {
            0%, 100% { transform: translateY(0) rotate(0deg); }
            25% { transform: translateY(-15px) rotate(5deg); }
            50% { transform: translateY(-8px) rotate(-3deg); }
            75% { transform: translateY(-20px) rotate(3deg); }
          }
          .animate-float {
            animation: float 6s ease-in-out infinite;
          }
        `}</style>
        </div>
      </main>
    </div >
  );
}

