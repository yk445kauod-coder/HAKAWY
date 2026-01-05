
import { GoogleGenAI, Type } from "@google/genai";

const STORY_SCHEMA = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      genre: { type: Type.STRING, enum: ["Drama", "Horror", "Love"] },
      category: { type: Type.STRING },
      characters: { type: Type.ARRAY, items: { type: Type.STRING } },
      day1: { type: Type.STRING },
      day2: { type: Type.STRING },
      day3: { type: Type.STRING },
      summary: { type: Type.STRING },
      imagePrompt: { type: Type.STRING }
    },
    required: ["title", "genre", "category", "characters", "day1", "day2", "day3", "summary", "imagePrompt"],
  }
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { action, payload } = req.body;
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    switch (action) {
      case 'generateDaily': {
        const response = await ai.models.generateContent({
          model: "gemini-3-pro-preview",
          contents: payload.prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: STORY_SCHEMA,
            thinkingConfig: { thinkingBudget: 32000 }
          },
        });
        return res.status(200).json({ text: response.text });
      }
      case 'complete': {
        const response = await ai.models.generateContent({
          model: "gemini-3-pro-preview",
          contents: payload.prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                day1: { type: Type.STRING },
                day2: { type: Type.STRING },
                day3: { type: Type.STRING }
              },
              required: ["day1", "day2", "day3"]
            },
            thinkingConfig: { thinkingBudget: 15000 }
          }
        });
        return res.status(200).json({ text: response.text });
      }
      case 'remix': {
        const response = await ai.models.generateContent({
          model: "gemini-3-pro-preview",
          contents: payload.prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                day1: { type: Type.STRING },
                day2: { type: Type.STRING },
                day3: { type: Type.STRING },
                summary: { type: Type.STRING },
                imagePrompt: { type: Type.STRING }
              },
              required: ["title", "day1", "day2", "day3", "summary", "imagePrompt"]
            },
            thinkingConfig: { thinkingBudget: 20000 }
          }
        });
        return res.status(200).json({ text: response.text });
      }
      case 'generateImage': {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: {
            parts: [{ text: payload.prompt }],
          },
        });
        const imagePart = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
        return res.status(200).json({ image: imagePart?.inlineData?.data });
      }
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
