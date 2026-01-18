import { GoogleGenAI } from "@google/genai";

const apiKey = (import.meta as any).env?.VITE_AI_API_KEY || '';
const client = new GoogleGenAI({ apiKey });

export async function getWitnessDetails(promise: string) {
  try {
    const response = await client.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: [{
        role: 'user',
        parts: [{
          text: `You are the Grand Notary. Analyze this promise: "${promise}".
          Format your response as a JSON object with:
          - statement: A 1-sentence witness statement of gravitas.
          - milestones: An array of 3 short, objective success metrics.`
        }]
      }],
      config: {
        responseMimeType: "application/json"
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
    const response = await client.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: [{
        role: 'user',
        parts: [{
          text: `A futuristic, high-contrast, minimalist circular logo or seal representing the concept: "${promise}". Cyberpunk aesthetic, neon blue and obsidian, professional digital emblem, symmetrical.`
        }]
      }]
    });

    // Note: Standard text generation doesn't return images. 
    // If the model supports image generation, it would be in response.candidates
    const candidates = (response as any).candidates;
    if (candidates && candidates[0]?.content?.parts) {
      for (const part of candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
  } catch (error) {
    console.error("Seal generation failed:", error);
  }
  return undefined;
}

export async function roastPromise(promise: string): Promise<string> {
  try {
    const response = await client.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: [{
        role: 'user',
        parts: [{
          text: `Roast this promise: "${promise}". One punchy, cynical sentence.`
        }]
      }]
    });
    return response.text?.trim() || "Talk is cheap.";
  } catch {
    return "The ledger remains unimpressed.";
  }
}
