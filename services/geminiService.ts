
import { GoogleGenAI, Type } from "@google/genai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export async function getWitnessDetails(promise: string) {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are the Grand Notary. Analyze this promise: "${promise}".
      1. Write a 1-sentence witness statement of gravitas.
      2. Provide 3 short, objective success metrics (milestones).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            statement: { type: Type.STRING },
            milestones: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["statement", "milestones"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Witness failed:", error);
    return {
      statement: "Your word is recorded in the silence of the ledger.",
      milestones: ["Initiate commitment", "Maintain integrity", "Complete objective"]
    };
  }
}

export async function generateSeal(promise: string): Promise<string | undefined> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: `A futuristic, high-contrast, minimalist circular logo or seal representing the concept: "${promise}". Cyberpunk aesthetic, neon blue and obsidian, professional digital emblem, symmetrical.` }]
      }
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
  } catch (error) {
    console.error("Seal generation failed:", error);
  }
  return undefined;
}

export async function roastPromise(promise: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Roast this promise: "${promise}". One punchy, cynical sentence.`,
      config: { temperature: 0.9, maxOutputTokens: 60 }
    });
    return response.text?.trim() || "Talk is cheap.";
  } catch {
    return "The ledger remains unimpressed.";
  }
}
