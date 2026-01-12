import { OpenAI } from "openai";
import { put } from "@vercel/blob";
import { GoogleGenAI } from "@google/genai";

export const maxDuration = 60; // Allow 60 seconds for generation

// Helper to save base64 image to Vercel Blob (or return data URL if no blob storage)
async function saveBase64ImageToBlob(base64Data: string, filename: string, mimeType: string = "image/png"): Promise<string | null> {
    const token = process.env.BLOB_READ_WRITE_TOKEN;

    // If no blob token, return as data URL (works for local dev)
    if (!token) {
        console.log("No BLOB_READ_WRITE_TOKEN, returning data URL");
        return `data:${mimeType};base64,${base64Data}`;
    }

    try {
        const buffer = Buffer.from(base64Data, "base64");
        const { url: blobUrl } = await put(filename, buffer, { access: 'public', token });
        return blobUrl;
    } catch (error) {
        console.error("Failed to save base64 image to Blob:", error);
        // Fallback to data URL
        return `data:${mimeType};base64,${base64Data}`;
    }
}

// Helper to save images from URL to Vercel Blob
async function saveImageToBlob(url: string, filename: string): Promise<string | null> {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) return url;
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        const { url: blobUrl } = await put(filename, blob, { access: 'public', token });
        return blobUrl;
    } catch (error) {
        console.error("Failed to save image to Blob:", error);
        return null;
    }
}

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

// Helper to save audio to Vercel Blob (or return data URL if no blob storage)
async function saveAudioToBlob(buffer: ArrayBuffer, filename: string, mimeType: string = "audio/mpeg"): Promise<string | null> {
    const token = process.env.BLOB_READ_WRITE_TOKEN;

    // If no blob token, return as data URL (works for local dev)
    if (!token) {
        console.log("No BLOB_READ_WRITE_TOKEN, returning audio data URL");
        const base64 = Buffer.from(buffer).toString('base64');
        return `data:${mimeType};base64,${base64}`;
    }

    try {
        const { url: blobUrl } = await put(filename, buffer, { access: 'public', token });
        return blobUrl;
    } catch (error) {
        console.error("Failed to save audio to Blob:", error);
        // Fallback to data URL
        const base64 = Buffer.from(buffer).toString('base64');
        return `data:${mimeType};base64,${base64}`;
    }
}

// --- OpenAI Logic ---
async function generateStoryWithOpenAI(apiKey: string, prompt: string, characterDescription: string | null, language: string) {
    const openai = new OpenAI({ apiKey });

    const languageInstruction = language === "de"
        ? "Write the story in German (Deutsch)."
        : "Write the story in English.";

    // 1. Generate Story Text (JSON)
    const systemPrompt = `
    You are a creative storyteller.
    Write a short story based on the user's ideas.
    ${languageInstruction}
    The story should have a title and 3-5 chapters.
    Each chapter needs a title, a paragraph of text, and an image prompt for DALL-E (always in English for the image generator).
    ${characterDescription ? `The main character looks like this: ${characterDescription}. Ensure the image prompts describe this character effectively.` : ""}
    Return ONLY valid JSON.
  `;

    const chatCompletion = await openai.chat.completions.create({
        model: "gpt-4o",
        response_format: { type: "json_object" },
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Story Ideas: ${prompt}` },
        ],
    });

    const storyJson = JSON.parse(chatCompletion.choices[0].message.content || "{}");
    console.log("OpenAI Raw Response:", JSON.stringify(storyJson, null, 2));

    // Normalize chapters - handle different possible field names
    const rawChapters = storyJson.chapters || storyJson.stories || [];
    const normalizedChapters = rawChapters.map((ch: any) => ({
        title: ch.title || ch.chapter_title || "Untitled Chapter",
        content: ch.content || ch.text || ch.body || ch.paragraph || ch.description || ch.story || "",
        image_prompt: ch.image_prompt || ch.imagePrompt || ch.image_description || "",
    }));

    console.log("Normalized Chapters:", JSON.stringify(normalizedChapters, null, 2));

    const story = {
        title: storyJson.title || storyJson.story_title || "My Story",
        chapters: normalizedChapters,
    };

    // 2. Process Chapters (Images and Audio)
    const processedChapters = await Promise.all(story.chapters.map(async (chapter: any, index: number) => {
        // Generate Image
        let imageUrl = null;
        try {
            const imageResponse = await openai.images.generate({
                model: "dall-e-3",
                prompt: `Pixar style illustration. ${chapter.image_prompt} ${characterDescription ? `Character visual: ${characterDescription}` : ""}`,
                n: 1,
                size: "1024x1024",
                quality: "hd",
            });

            const imageData = imageResponse.data?.[0];
            if (imageData) {
                // DALL-E 3 returns URL
                if (imageData.url) {
                    imageUrl = await saveImageToBlob(imageData.url, `chapter-${index}-${Date.now()}.png`) || imageData.url;
                }
                // Fallback to b64_json if available
                else if (imageData.b64_json) {
                    imageUrl = await saveBase64ImageToBlob(imageData.b64_json, `chapter-${index}-${Date.now()}.png`, "image/png");
                }
            }
            console.log(`Image generated for chapter ${index + 1}: ${imageUrl ? 'success' : 'no data'}`);
        } catch (e: any) {
            console.error("Image gen failed for chapter", index, e?.message || e);
        }

        // Generate Audio
        let audioUrl = null;
        try {
            const mp3 = await openai.audio.speech.create({
                model: "tts-1",
                voice: "alloy",
                input: chapter.content,
            });
            const buffer = await mp3.arrayBuffer();
            audioUrl = await saveAudioToBlob(buffer, `chapter-${index}-${Date.now()}.mp3`);
        } catch (e) {
            console.error("Audio gen failed for chapter", index, e);
        }

        return { ...chapter, imageUrl, audioUrl };
    }));

    return { ...story, chapters: processedChapters };
}


// --- Gemini Logic (using @google/genai SDK) ---
async function generateStoryWithGemini(apiKey: string, prompt: string, characterDescription: string | null, language: string) {
    const ai = new GoogleGenAI({ apiKey });

    const languageInstruction = language === "de"
        ? "Schreibe die Geschichte auf Deutsch."
        : "Write the story in English.";

    // 1. Generate Story Text (JSON) using gemini-3-flash-preview
    console.log("Generating story with Gemini...");
    const storyPrompt = `
    You are a creative storyteller.
    ${languageInstruction}
    Write a short story based on these ideas: "${prompt}".
    ${characterDescription ? `The main character description: ${characterDescription}` : ""}
    The story must have 3-5 chapters.
    Return ONLY valid JSON with this structure:
    {
      "title": "Story Title",
      "chapters": [
        { "title": "Chapter 1 Title", "content": "Chapter text...", "image_prompt": "Detailed image description in English for image generator..." }
      ]
    }
  `;

    const storyResponse = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: storyPrompt,
        config: {
            responseMimeType: "application/json",
        }
    });

    // Extract JSON from response
    let storyText = storyResponse.text || "";
    // Clean up potential markdown code blocks
    storyText = storyText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const story = JSON.parse(storyText);

    // 2. Process Chapters (Images using Gemini native image generation)
    const processedChapters = await Promise.all(story.chapters.map(async (chapter: any, index: number) => {
        let imageUrl = null;

        // Generate Image with Gemini 3 Pro Image Preview (as per official docs)
        try {
            console.log(`Generating image for chapter ${index + 1}...`);
            const imagePrompt = `Pixar style illustration for a children's story. ${chapter.image_prompt} ${characterDescription ? `The main character: ${characterDescription}` : ""}`;

            const imageResponse = await ai.models.generateContent({
                model: "gemini-3-pro-image-preview",
                contents: imagePrompt,
                config: {
                    responseModalities: ["TEXT", "IMAGE"],
                    imageConfig: {
                        aspectRatio: "1:1",
                        imageSize: "1K",
                    },
                }
            });

            // Extract image from response parts
            if (imageResponse.candidates && imageResponse.candidates[0]?.content?.parts) {
                for (const part of imageResponse.candidates[0].content.parts) {
                    if (part.inlineData) {
                        const base64Data = part.inlineData.data;
                        const mimeType = part.inlineData.mimeType || "image/png";
                        if (base64Data) {
                            imageUrl = await saveBase64ImageToBlob(base64Data, `gemini-chapter-${index}-${Date.now()}.png`, mimeType);
                            console.log(`Image saved for chapter ${index + 1}: ${imageUrl ? 'success' : 'failed'}`);
                            if (imageUrl) break;
                        }
                    }
                }
            }
        } catch (e: any) {
            console.error("Gemini image gen failed for chapter", index, e?.message || e);
        }

        // Generate Audio with Gemini TTS
        let audioUrl = null;
        try {
            console.log(`Generating audio for chapter ${index + 1}...`);

            // Create an expressive storytelling prompt
            const narrativePrompt = `[Voice Direction: You are a warm, engaging storyteller narrating a magical children's story. 
Speak with gentle enthusiasm and wonder. Vary your pace - slow down for dramatic moments, speed up for exciting parts. 
Add subtle emotional expression - joy for happy moments, suspense for mysterious parts, warmth for tender scenes.
Use a soothing, melodic tone like a parent reading a bedtime story.]

${chapter.content}`;

            const audioResponse = await ai.models.generateContent({
                model: "gemini-2.5-flash-preview-tts",
                contents: [{ parts: [{ text: narrativePrompt }] }],
                config: {
                    responseModalities: ["AUDIO"],
                    speechConfig: {
                        voiceConfig: {
                            prebuiltVoiceConfig: {
                                voiceName: "Kore" // Warm, friendly storytelling voice
                            },
                        },
                    },
                },
            });

            // Extract audio from response
            const audioData = audioResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            if (audioData) {
                // Convert raw PCM to WAV format for browser playback
                const pcmBuffer = Buffer.from(audioData, "base64");
                const wavBuffer = createWavBuffer(pcmBuffer);

                // For local dev without blob storage, use data URL
                const token = process.env.BLOB_READ_WRITE_TOKEN;
                if (!token) {
                    audioUrl = `data:audio/wav;base64,${wavBuffer.toString('base64')}`;
                } else {
                    const { url: blobUrl } = await put(`gemini-audio-${index}-${Date.now()}.wav`, wavBuffer, { access: 'public', token });
                    audioUrl = blobUrl;
                }
                console.log(`Audio saved for chapter ${index + 1}: success`);
            }
        } catch (e: any) {
            console.error("Gemini audio gen failed for chapter", index, e?.message || e);
        }

        return { ...chapter, imageUrl, audioUrl };
    }));

    return { ...story, chapters: processedChapters };
}

// --- Main Handler ---
export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const prompt = formData.get("prompt") as string;
        const provider = (formData.get("provider") as string) || "openai";
        const language = (formData.get("language") as string) || "en";
        const file = formData.get("file") as File | null;

        // Get API Keys from Headers or Env
        const headerOpenAiKey = req.headers.get("X-OpenAI-Key");
        const headerGeminiKey = req.headers.get("X-Gemini-Key");

        const finalOpenAiKey = headerOpenAiKey || process.env.OPENAI_API_KEY;
        const finalGeminiKey = headerGeminiKey || process.env.GEMINI_API_KEY;

        if (!prompt) {
            return Response.json({ error: "Prompt is required" }, { status: 400 });
        }

        // Validate Keys based on provider
        if (provider === "openai" && !finalOpenAiKey) {
            return Response.json({ error: "OpenAI API Key missing. Please check Settings." }, { status: 401 });
        }
        if (provider === "google" && !finalGeminiKey) {
            return Response.json({ error: "Gemini API Key missing. Please check Settings." }, { status: 401 });
        }

        // Character Analysis (Vision)
        let characterDescription: string | null = null;
        if (file) {
            const buffer = Buffer.from(await file.arrayBuffer());
            const base64Image = buffer.toString("base64");
            const mimeType = file.type;

            if (provider === "google") {
                try {
                    const ai = new GoogleGenAI({ apiKey: finalGeminiKey! });
                    // Use Gemini Flash for Vision (Fast)
                    const response = await ai.models.generateContent({
                        model: "gemini-3-flash-preview",
                        contents: [
                            {
                                role: "user",
                                parts: [
                                    { text: "Describe this character in detail (appearance, colors, features) for an image generator." },
                                    { inlineData: { mimeType, data: base64Image } }
                                ]
                            }
                        ]
                    });
                    characterDescription = response.text || null;
                } catch (e) {
                    console.error("Gemini Vision failed:", e);
                }
            } else {
                // OpenAI Vision
                try {
                    const openai = new OpenAI({ apiKey: finalOpenAiKey! });
                    const visionResponse = await openai.chat.completions.create({
                        model: "gpt-4o",
                        messages: [
                            {
                                role: "user",
                                content: [
                                    { type: "text", text: "Describe this character in detail (appearance, colors, features) for an image generator." },
                                    { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64Image}` } },
                                ],
                            },
                        ],
                        max_tokens: 300,
                    });
                    characterDescription = visionResponse.choices[0].message.content;
                } catch (e) {
                    console.error("OpenAI Vision failed:", e);
                }
            }
        }

        // Generate Story based on provider
        let storyData;
        if (provider === "google") {
            storyData = await generateStoryWithGemini(finalGeminiKey!, prompt, characterDescription, language);
        } else {
            storyData = await generateStoryWithOpenAI(finalOpenAiKey!, prompt, characterDescription, language);
        }

        return Response.json(storyData);

    } catch (error: any) {
        console.error("API Error:", error);
        return Response.json({ error: error.message || "Something went wrong" }, { status: 500 });
    }
}
