
import { GoogleGenAI } from "@google/genai";

export const maxDuration = 60;

// Helper to create a WAV file buffer from raw PCM data
function createWavBuffer(pcmData: Buffer, sampleRate: number = 24000, channels: number = 1, bitDepth: number = 16): Buffer {
    const byteRate = sampleRate * channels * (bitDepth / 8);
    const blockAlign = channels * (bitDepth / 8);
    const dataSize = pcmData.length;
    const headerSize = 44;
    const fileSize = headerSize + dataSize - 8;

    const header = Buffer.alloc(44);

    // RIFF header
    header.write('RIFF', 0);
    header.writeUInt32LE(fileSize, 4);
    header.write('WAVE', 8);

    // fmt subchunk
    header.write('fmt ', 12);
    header.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
    header.writeUInt16LE(1, 20); // AudioFormat (1 = PCM)
    header.writeUInt16LE(channels, 22);
    header.writeUInt32LE(sampleRate, 24);
    header.writeUInt32LE(byteRate, 28);
    header.writeUInt16LE(blockAlign, 32);
    header.writeUInt16LE(bitDepth, 34);

    // data subchunk
    header.write('data', 36);
    header.writeUInt32LE(dataSize, 40);

    return Buffer.concat([header, pcmData]);
}

export async function POST(req: Request) {
    try {
        const { text, apiKey } = await req.json();

        // Use provided key or env key
        const finalApiKey = apiKey || process.env.GEMINI_API_KEY;

        if (!finalApiKey) {
            return Response.json({ error: "Gemini API Key missing" }, { status: 401 });
        }

        if (!text) {
            return Response.json({ error: "Text is required" }, { status: 400 });
        }

        const ai = new GoogleGenAI({ apiKey: finalApiKey });

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text }] }],
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

        if (!audioData) {
            throw new Error("No audio data received from Gemini");
        }

        const pcmBuffer = Buffer.from(audioData, "base64");
        const wavBuffer = createWavBuffer(pcmBuffer);

        // Return the WAV file directly
        return new Response(wavBuffer, {
            headers: {
                "Content-Type": "audio/wav",
                "Content-Length": wavBuffer.length.toString(),
            },
        });

    } catch (error: any) {
        console.error("TTS API Error:", error);
        return Response.json({ error: error.message || "Failed to generate speech" }, { status: 500 });
    }
}
