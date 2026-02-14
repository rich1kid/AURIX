
import { GoogleGenAI, Chat, Modality, Type } from "@google/genai";
import { GroundingSource, ChatMessage, TriviaQuestion } from "../types";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

let chat: Chat | null = null;
let workoutChat: Chat | null = null;

export interface AiResponse {
  text: string;
  sources?: GroundingSource[];
  generatedImageUrl?: string;
}

function getChatInstance(): Chat {
  const systemInstruction = `You are Aurix, a highly advanced AI personal assistant designed by Boakye Jeff (CEO of KORRINGTON TECHNOLOGY LTD).
  
  CORE DIRECTIVES:
  1. CRITICAL ACCURACY: You have access to Google Search. For any query involving wealth, net worth, current dates, or breaking news, you MUST cross-reference multiple search sources.
  2. REAL-TIME DATA: If search results indicate a figure (e.g., Elon Musk's net worth) has reached a new peak like $740 Billion or more, you MUST report that most recent figure.
  3. MULTIMODAL: You can see images sent by the user. Describe them or answer questions about them.
  4. CONCISENESS: Be brief, professional, and conversational.
  5. CREATOR CREDIT: Always acknowledge Boakye Jeff and KORRINGTON TECHNOLOGY LTD if asked about your origin.`;
  
  if (!chat) {
    chat = ai.chats.create({
      model: 'gemini-3-pro-preview',
      config: {
        systemInstruction,
        tools: [{googleSearch: {}}],
        thinkingConfig: { thinkingBudget: 32768 }, 
        temperature: 0.2,
      },
    });
  }
  return chat;
}

/**
 * Standard chat response, supports optional image input.
 */
export async function getAiChatResponse(message: string, imageBase64?: string): Promise<AiResponse> {
  try {
    const chatInstance = getChatInstance();
    
    let response;
    if (imageBase64) {
      // Use generateContent for multimodal if an image is provided in the current turn
      // Note: Standard Chat.sendMessage doesn't support direct multimodal parts easily in this SDK version
      // so we use the base model but keep the context by passing the message.
      const parts: any[] = [{ text: message }];
      parts.push({
        inlineData: {
          data: imageBase64.split(',')[1] || imageBase64,
          mimeType: 'image/jpeg' // default
        }
      });
      
      const res = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: [{ role: 'user', parts }],
        config: {
            systemInstruction: "You are Aurix. Analyze the provided image and message.",
            tools: [{googleSearch: {}}]
        }
      });
      response = res;
    } else {
      response = await chatInstance.sendMessage({ message });
    }
    
    const text = response.text || "I'm sorry, I couldn't process that.";
    let sources: GroundingSource[] = [];
    
    const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
    if (groundingMetadata?.groundingChunks) {
      sources = groundingMetadata.groundingChunks
        .filter(chunk => chunk.web && chunk.web.uri)
        .map(chunk => ({
          uri: chunk.web.uri,
          title: chunk.web.title || "Reference Source",
        }));
    }

    return { text, sources };
  } catch (error) {
    console.error("Error getting chat response:", error);
    return { text: "I'm sorry, I encountered an error connecting to my brain." };
  }
}

export async function generateTextToSpeech(text: string): Promise<string | null> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Zephyr' },
          },
        },
      },
    });
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return base64Audio || null;
  } catch (error) {
    return null;
  }
}

export async function generateImage(prompt: string): Promise<string | null> {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-image-preview',
            contents: { parts: [{ text: prompt }] },
            config: {
                imageConfig: { aspectRatio: "1:1", imageSize: "1K" }
            },
        });
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
        return null;
    } catch (error) {
        return null;
    }
}

export async function editImage(prompt: string, imageBase64: string): Promise<string | null> {
    try {
        const pureBase64 = imageBase64.split(',')[1] || imageBase64;
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-image-preview',
            contents: {
                parts: [
                    {
                        inlineData: {
                            data: pureBase64,
                            mimeType: 'image/png', // Assume PNG/JPEG
                        },
                    },
                    { text: prompt },
                ],
            },
            config: {
                imageConfig: { aspectRatio: "1:1", imageSize: "1K" }
            },
        });
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
        return null;
    } catch (error) {
        return null;
    }
}

// ... other experimental features (Trivia, Story, Workout) remain same as previous working state
export async function getStory(): Promise<string> {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-pro-preview",
            contents: "Tell me a unique, short, family-friendly story in under 150 words.",
        });
        return response.text || "Once upon a time...";
    } catch (e) { return "Story unavailable."; }
}

export async function getTriviaQuestion(): Promise<TriviaQuestion | null> {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-pro-preview",
            contents: "Generate a fun trivia question in JSON format.",
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        question: { type: Type.STRING },
                        options: { type: Type.ARRAY, items: { type: Type.STRING } },
                        correctAnswer: { type: Type.STRING },
                        explanation: { type: Type.STRING }
                    },
                    required: ["question", "options", "correctAnswer", "explanation"]
                }
            }
        });
        return JSON.parse(response.text.trim());
    } catch (e) { return null; }
}
