"use client";

import { useState, useEffect } from "react";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SettingsDialogProps {
    onKeysChange: (keys: { openai: string; gemini: string }) => void;
}

export function SettingsDialog({ onKeysChange }: SettingsDialogProps) {
    const [open, setOpen] = useState(false);
    const [openaiKey, setOpenaiKey] = useState("");
    const [geminiKey, setGeminiKey] = useState("");

    // Load keys from localStorage on mount
    useEffect(() => {
        const storedOpenaiKey = localStorage.getItem("user_openai_key") || "";
        const storedGeminiKey = localStorage.getItem("user_gemini_key") || "";

        // Only update state if needed to prevent loops if parent re-renders
        setOpenaiKey(current => current !== storedOpenaiKey ? storedOpenaiKey : current);
        setGeminiKey(current => current !== storedGeminiKey ? storedGeminiKey : current);

        // Notify parent once on mount
        onKeysChange({ openai: storedOpenaiKey, gemini: storedGeminiKey });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSave = () => {
        localStorage.setItem("user_openai_key", openaiKey);
        localStorage.setItem("user_gemini_key", geminiKey);
        onKeysChange({ openai: openaiKey, gemini: geminiKey });
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
                    <Settings className="w-5 h-5" />
                    <span className="sr-only">Settings</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>API Settings</DialogTitle>
                    <DialogDescription>
                        Enter your personal API keys to use the app. These are stored locally in your browser.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="openai-key">OpenAI API Key</Label>
                        <Input
                            id="openai-key"
                            type="password"
                            placeholder="sk-..."
                            value={openaiKey}
                            onChange={(e) => setOpenaiKey(e.target.value)}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="gemini-key">Gemini API Key</Label>
                        <Input
                            id="gemini-key"
                            type="password"
                            placeholder="AIza..."
                            value={geminiKey}
                            onChange={(e) => setGeminiKey(e.target.value)}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleSave}>Save changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
