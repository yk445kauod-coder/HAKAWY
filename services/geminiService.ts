
import { GoogleGenAI, Type } from "@google/genai";
import { Story } from "../types";

// Note: The variable `process.env.API_KEY` is standard for this environment's security injection.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const STORY_SCHEMA = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      genre: { type: Type.STRING, enum: ["Drama", "Horror", "Love"] },
      category: { type: Type.STRING },
      characters: { type: Type.ARRAY, items: { type: Type.STRING } },
      day1: { type: Type.STRING, description: "الفصل الأول الملحمي - طويل جداً ومفصل" },
      day2: { type: Type.STRING, description: "الفصل الثاني الملحمي - طويل جداً ومفصل" },
      day3: { type: Type.STRING, description: "الفصل الثالث الملحمي - الخاتمة الطويلة" },
      summary: { type: Type.STRING },
      imagePrompt: { type: Type.STRING }
    },
    required: ["title", "genre", "category", "characters", "day1", "day2", "day3", "summary", "imagePrompt"],
  }
};

async function generateCover(prompt: string): Promise<string | undefined> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: `A cinematic artistic book cover for an Egyptian epic: ${prompt}. Mysterious, high-end detailed design, dramatic lighting, rich textures, no text.` }],
      },
    });
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
  } catch (e) {}
  return undefined;
}

export const generateDailyStories = async (existingStories: Story[]): Promise<Story[]> => {
  const contextTitles = existingStories.map(s => s.title).slice(-5).join(', ');
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `بصفتك "حكواتي المحروسة" الأعظم، قم بتأليف روايتين (2) ملحميتين مصريتين كاملتين. 
      يجب أن يحتوي كل عمل على 3 فصول كاملة (Day 1, Day 2, Day 3) يتم توليدها جميعاً الآن.
      الفصول يجب أن تكون طويلة جداً (أكثر من 2000 كلمة لكل فصل) وبأسلوب أدبي مصري بليغ.
      لا تترك أي فصل فارغاً أو قصيراً.
      العناوين السابقة لتجنب التكرار: [${contextTitles}].`,
      config: {
        responseMimeType: "application/json",
        responseSchema: STORY_SCHEMA,
        thinkingConfig: { thinkingBudget: 32000 }
      },
    });
    const rawData = JSON.parse(response.text || "[]");
    const today = new Date().toISOString();
    return await Promise.all(rawData.slice(0, 2).map(async (s: any, index: number) => {
      const cover = await generateCover(s.imagePrompt);
      return { 
        ...s, 
        id: `novel-${Date.now()}-${index}`, 
        startDate: today, 
        user_ratings_count: 0, 
        isUserStory: false, 
        coverImage: cover,
        share_count: 0 
      };
    }));
  } catch (error) {
    console.error("AI Daily Story Generation failed", error);
    return [];
  }
};

export const completeMissingParts = async (story: Story): Promise<Story | null> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `القصة التالية بعنوان "${story.title}" ناقصة الفصول. 
      المحتوى الموجود حالياً:
      الفصل 1: ${story.day1 || "فارغ"}
      الفصل 2: ${story.day2 || "فارغ"}
      الفصل 3: ${story.day3 || "فارغ"}
      
      قم بإكمال الفصول الفارغة بأسلوب أدبي مصري ملحمي طويل جداً يتماشى مع السياق الحالي.`,
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
    const s = JSON.parse(response.text || "{}");
    return {
      ...story,
      day1: s.day1 || story.day1,
      day2: s.day2 || story.day2,
      day3: s.day3 || story.day3
    };
  } catch (e) {
    return null;
  }
};

export const remixStory = async (original: Story, twist: string): Promise<Story | null> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `قم بإعادة صياغة (Remix) هذه القصة المصرية بأسلوب ملحمي طويل جداً ومفصل:
      العنوان: ${original.title}
      القصة الأصلية: ${original.day1} ${original.day2} ${original.day3}
      التحول المطلوب (Twist): ${twist}
      أنتج نسخة جديدة مكونة من 3 فصول كاملة ومفصلة للغاية بأسلوب أدبي رفيع.`,
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
    const s = JSON.parse(response.text || "{}");
    const cover = await generateCover(s.imagePrompt);
    return {
      ...original,
      id: `remix-${Date.now()}`,
      title: s.title,
      day1: s.day1,
      day2: s.day2,
      day3: s.day3,
      summary: s.summary,
      coverImage: cover,
      remixOf: original.id,
      isUserStory: true,
      startDate: new Date().toISOString()
    };
  } catch (e) {
    return null;
  }
};
