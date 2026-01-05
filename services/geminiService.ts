import { Story } from "../types";

async function callGeminiApi(action: string, payload: any) {
  // Proxied to Netlify Function via netlify.toml
  const res = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, payload })
  });
  if (!res.ok) throw new Error('Failed to call Gemini API');
  return await res.json();
}

async function generateCover(prompt: string): Promise<string | undefined> {
  try {
    const data = await callGeminiApi('generateImage', {
      prompt: `A cinematic artistic book cover for an Egyptian epic: ${prompt}. Mysterious, high-end detailed design, dramatic lighting, rich textures, no text.`
    });
    if (data.image) return `data:image/png;base64,${data.image}`;
  } catch (e) {}
  return undefined;
}

export const generateDailyStories = async (existingStories: Story[]): Promise<Story[]> => {
  const contextTitles = existingStories.map(s => s.title).slice(-15).join(', ');
  try {
    const prompt = `بصفتك "حكواتي المحروسة" الأعظم، قم بتأليف عشرة (10) روايات ملحمية مصرية جديدة بالكامل اليوم. 
    يجب أن تحتوي كل رواية على 3 فصول كاملة (Day 1, Day 2, Day 3).
    الفصول يجب أن تكون بأسلوب أدبي مصري بليغ ومشوق جداً، تنتهي بفصول معلقة (Cliffhangers) قوية جداً لتشويق القارئ للعودة غداً.
    تأكد من تنوع الأنواع بين الدراما، الرعب، والرومانسية (كلها بطابع مصري أصيل).
    العناوين السابقة لتجنب التكرار: [${contextTitles}].
    أنتج بالضبط 10 روايات في مصفوفة JSON.`;

    const data = await callGeminiApi('generateDaily', { prompt });
    const rawData = JSON.parse(data.text || "[]");
    const today = new Date().toISOString();
    
    return await Promise.all(rawData.slice(0, 10).map(async (s: any, index: number) => {
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
    const prompt = `القصة التالية بعنوان "${story.title}" ناقصة الفصول. 
    المحتوى الموجود حالياً:
    الفصل 1: ${story.day1 || "فارغ"}
    الفصل 2: ${story.day2 || "فارغ"}
    الفصل 3: ${story.day3 || "فارغ"}
    قم بإكمال الفصول الفارغة بأسلوب أدبي مصري ملحمي طويل جداً يتماشى مع السياق الحالي.`;

    const data = await callGeminiApi('complete', { prompt });
    const s = JSON.parse(data.text || "{}");
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
    const prompt = `قم بإعادة صياغة (Remix) هذه القصة المصرية بأسلوب ملحمي طويل جداً ومفصل:
    العنوان: ${original.title}
    القصة الأصلية: ${original.day1} ${original.day2} ${original.day3}
    التحول المطلوب (Twist): ${twist}
    أنتج نسخة جديدة مكونة من 3 فصول كاملة ومفصلة للغاية بأسلوب أدبي رفيع.`;

    const data = await callGeminiApi('remix', { prompt });
    const s = JSON.parse(data.text || "{}");
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