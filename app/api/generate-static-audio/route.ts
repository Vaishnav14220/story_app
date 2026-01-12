
import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";

export const maxDuration = 300; // Allow 5 minutes

// Helper to create a WAV file buffer (same as before)
function createWavBuffer(pcmData: Buffer, sampleRate: number = 24000, channels: number = 1, bitDepth: number = 16): Buffer {
    const byteRate = sampleRate * channels * (bitDepth / 8);
    const blockAlign = channels * (bitDepth / 8);
    const dataSize = pcmData.length;
    const headerSize = 44;
    const fileSize = headerSize + dataSize - 8;
    const header = Buffer.alloc(44);
    header.write('RIFF', 0);
    header.writeUInt32LE(fileSize, 4);
    header.write('WAVE', 8);
    header.write('fmt ', 12);
    header.writeUInt32LE(16, 16);
    header.writeUInt16LE(1, 20);
    header.writeUInt16LE(channels, 22);
    header.writeUInt32LE(sampleRate, 24);
    header.writeUInt32LE(byteRate, 28);
    header.writeUInt16LE(blockAlign, 32);
    header.writeUInt16LE(bitDepth, 34);
    header.write('data', 36);
    header.writeUInt32LE(dataSize, 40);
    return Buffer.concat([header, pcmData]);
}

const chapters = [
    {
        filename: "chapter1.wav",
        content: `In the silent expanse of the Gale Crater, the rover 'Aurelius' crunched over the oxidized iron sands. Its high-definition cameras panned across the desolate landscape until they snagged on something impossible. Tucked beneath a jagged shelf of basalt was a translucent, amber-colored fiber. It wasn't a mineral formation or a trick of the light. It was a root, thin as a wire, pulsing with a rhythmic, bioluminescent glow that defied the freezing Martian wind.`
    },
    {
        filename: "chapter2.wav",
        content: `As Aurelius deployed its drill for a micro-sample, the root reacted. It didn't break; it retreated, pulling deeper into the regolith like a startled worm. The rover's seismic sensors picked up a low-frequency hum vibrating through the crust. This was no solitary organism. The root was merely a sensory tip, a tiny nerve ending belonging to a massive, dormant biological network that had survived beneath the permafrost for eons, hidden from the prying eyes of the cosmos.`
    },
    {
        filename: "chapter3.wav",
        content: `Mission Control was in chaos. Scientists argued over data streams, but Dr. Elena Vasquez saw what others missed. The hum wasn't random — it was patterned, repeating. A language. She instructed Aurelius to respond with a simple electromagnetic pulse. For hours, nothing. Then, the ground beneath the rover began to glow. Thousands of roots surfaced simultaneously, weaving together to form a shape: a perfect circle with a single point in the center. The universal symbol for 'here.' It was saying hello.`
    },
    {
        filename: "chapter4.wav",
        content: `Over the following weeks, something miraculous unfolded. Wherever the roots touched the surface, they released ancient water vapor, creating tiny pockets of atmosphere. Microscopic spores, dormant for millennia, began to bloom into alien lichen, painting the red dust in patches of emerald and gold. Mars was waking up. And at the heart of it all, the curious root network pulsed with what could only be described as joy — a planet-sized organism that had waited billions of years just to share its garden with someone new.`
    }
];

export async function POST(req: Request) {
    const headerKey = req.headers.get("X-Gemini-Key");
    const apiKey = headerKey || process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return NextResponse.json({ error: "GEMINI_API_KEY not found in env or headers" }, { status: 401 });
    }

    const ai = new GoogleGenAI({ apiKey });
    const outputDir = path.join(process.cwd(), "public", "story");

    // Ensure directory exists
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const results = [];

    for (const chapter of chapters) {
        try {
            console.log(`Generating ${chapter.filename}...`);
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash-preview-tts",
                contents: [{ parts: [{ text: chapter.content }] }],
                config: {
                    responseModalities: ["AUDIO"],
                    speechConfig: {
                        voiceConfig: {
                            prebuiltVoiceConfig: {
                                voiceName: "Kore"
                            },
                        },
                    },
                },
            });

            const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            if (audioData) {
                const pcmBuffer = Buffer.from(audioData, "base64");
                const wavBuffer = createWavBuffer(pcmBuffer);
                const filePath = path.join(outputDir, chapter.filename);
                fs.writeFileSync(filePath, wavBuffer);
                results.push({ file: chapter.filename, status: "success" });
            } else {
                results.push({ file: chapter.filename, status: "failed", error: "No audio data" });
            }
        } catch (error: any) {
            console.error(`Error generating ${chapter.filename}:`, error);
            results.push({ file: chapter.filename, status: "error", error: error.message });
        }
    }

    return NextResponse.json({ results });
}
