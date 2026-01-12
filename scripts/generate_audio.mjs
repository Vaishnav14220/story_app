
import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read .env file for GEMINI_API_KEY
const envPath = path.resolve(__dirname, "../.env");
let apiKey = process.env.GEMINI_API_KEY;

if (!apiKey && fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    const match = envConfig.match(/GEMINI_API_KEY=(.*)/);
    if (match) {
        apiKey = match[1].trim();
        // Remove quotes if present
        if (apiKey.startsWith('"') && apiKey.endsWith('"')) {
            apiKey = apiKey.slice(1, -1);
        }
    }
}

if (!apiKey) {
    console.error("GEMINI_API_KEY not found in environment or .env file.");
    process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

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

// Helper to create WAV buffer (simplified from previous code)
function createWavBuffer(pcmData, sampleRate = 24000, channels = 1, bitDepth = 16) {
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

async function generateAudio() {
    const outputDir = path.resolve(__dirname, "../public/story");
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log(`Using API Key: ${apiKey.slice(0, 5)}...`);

    for (const [index, chapter] of chapters.entries()) {
        console.log(`Generating audio for Chapter ${index + 1}...`);
        try {
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
                const outputPath = path.join(outputDir, chapter.filename);
                fs.writeFileSync(outputPath, wavBuffer);
                console.log(`Saved ${chapter.filename}`);
            } else {
                console.error(`Failed to get audio data for Chapter ${index + 1}`);
            }
        } catch (error) {
            console.error(`Error generating Chapter ${index + 1}:`, error.message);
        }
    }
}

generateAudio();
