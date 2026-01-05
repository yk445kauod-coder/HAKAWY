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
      day1: { type: Type.STRING, description: "الفصل الأول الملحمي - طويل جداً ومشوق وينتهي بنقطة تحول أو cliffhanger مثير" },
      day2: { type: Type.STRING, description: "الفصل الثاني الملحمي - تصاعد الأحداث وينتهي بموقف عالق يشد القارئ للعودة غداً" },
      day3: { type: Type.STRING, description: "الفصل الثالث الملحمي - الخاتمة المرضية التي تحل العقدة" },
      summary: { type: Type.STRING },
      imagePrompt: { type: Type.STRING }
    },
    required: ["title", "genre", "category", "characters", "day1", "day2", "day3", "summary", "imagePrompt"],
  }
};

export const handler = async (event: any) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { action, payload } = JSON.parse(event.body);
    
    // Requirement: Use process.env.API_KEY exclusively
    const apiKey = process.env.API_KEY;
    
    if (!apiKey) {
      return { 
        statusCode: 500, 
        body: JSON.stringify({ error: 'API_KEY is not configured in Netlify environment variables.' }) 
      };
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    let result: any = {};

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
        result = { text: response.text };
        break;
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
        result = { text: response.text };
        break;
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
        result = { text: response.text };
        break;
      }
      case 'generateImage': {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: {
            parts: [{ text: payload.prompt }],
          },
        });
        const imagePart = response.candidates?.[0]?.content?.parts.find((p: any) => p.inlineData);
        result = { image: imagePart?.inlineData?.data };
        break;
      }
      default:
        return { statusCode: 400, body: JSON.stringify({ error: 'Invalid action' }) };
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result)
    };
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
