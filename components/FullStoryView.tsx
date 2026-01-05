
import React, { useEffect, useState, useMemo } from 'react';
import { Story } from '../types';
import { updateStoryRatingInDb, getStoryDay } from '../services/storage';
import Comments from './Comments';

interface FullStoryViewProps {
  story: Story;
  userName: string;
  onClose: () => void;
}

const genreMap: Record<string, string> = {
  'Drama': 'دراما إنسانية معاصرة',
  'Horror': 'رعب ماورائي أصيل',
  'Love': 'ملحمة عشق قاهرية'
};

const FullStoryView: React.FC<FullStoryViewProps> = ({ story: initialStory, userName, onClose }) => {
  const [story, setStory] = useState<Story>(initialStory);
  const [readMode, setReadMode] = useState<'dark' | 'light' | 'sepia' | 'blue'>('dark');
  const [fontSize, setFontSize] = useState(20);
  const [rating, setRating] = useState(0);
  const [hasRated, setHasRated] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  const [expandedChapters, setExpandedChapters] = useState<Record<number, boolean>>({ 1: true, 2: true, 3: true });

  const currentDay = useMemo(() => {
    if (story.isUserStory) return 3; // User stories are usually fully available
    return getStoryDay(story.startDate);
  }, [story]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const handleScroll = (e: any) => {
      const target = e.target;
      if (target) {
        const progress = (target.scrollTop / (target.scrollHeight - target.clientHeight)) * 100;
        setReadingProgress(progress);
      }
    };
    const scrollContainer = document.querySelector('.story-scroll-container');
    scrollContainer?.addEventListener('scroll', handleScroll);
    return () => {
      document.body.style.overflow = 'unset';
      scrollContainer?.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleRate = async (val: number) => {
    if (hasRated) return;
    setRating(val);
    try {
      const updatedStories = await updateStoryRatingInDb(story.id, val);
      const updatedStory = updatedStories.find(s => s.id === story.id);
      if (updatedStory) setStory(updatedStory);
      setHasRated(true);
    } catch (e) {
      console.error("Rating failed", e);
    }
  };

  const getDayText = (day: number) => {
    if (day === 1) return story.day1;
    if (day === 2) return story.day2;
    if (day === 3) return story.day3;
    return "";
  };

  const readingTime = useMemo(() => {
    const totalText = (story.day1 || "") + (story.day2 || "") + (story.day3 || "");
    const wordsPerMinute = 200;
    const words = totalText.split(/\s+/).length;
    return Math.ceil(words / wordsPerMinute);
  }, [story]);

  const toggleChapter = (day: number) => {
    if (day > currentDay) return;
    setExpandedChapters(prev => ({ ...prev, [day]: !prev[day] }));
  };

  const modeClasses = {
    dark: 'read-mode-dark',
    light: 'read-mode-light',
    sepia: 'read-mode-sepia',
    blue: 'read-mode-blue'
  };

  return (
    <div className={`fixed inset-0 z-[120] overflow-y-auto story-scroll-container animate-in fade-in duration-500 transition-all ${modeClasses[readMode]}`}>
      <div className="fixed top-0 left-0 h-1 bg-rose-600 z-[130] transition-all duration-300" style={{ width: `${readingProgress}%` }} />

      <div className="relative h-[55vh] md:h-[75vh] w-full">
        {story.coverImage ? (
          <img src={story.coverImage} className="w-full h-full object-cover" alt={story.title} />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-900 to-indigo-900"></div>
        )}
        <div className="absolute inset-0 story-card-overlay flex flex-col justify-end p-6 md:p-16 text-white">
          <div className="max-w-5xl mx-auto w-full">
            <button 
              onClick={onClose}
              className="mb-8 flex items-center gap-3 text-white/90 hover:text-rose-500 transition-all font-black uppercase text-xs tracking-[0.3em] group"
            >
              <i className="fa-solid fa-arrow-right-long transition-transform group-hover:translate-x-2"></i>
              مغادرة الرواق
            </button>

            <h1 className="text-4xl md:text-7xl font-black mb-6 leading-tight tracking-tighter drop-shadow-2xl">
              {story.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-white/90 text-xs md:text-sm font-bold">
              <span className="bg-rose-600 px-5 py-2.5 rounded-full text-white shadow-xl">{genreMap[story.genre]}</span>
              <span className="bg-white/10 backdrop-blur-md px-5 py-2.5 rounded-full border border-white/20">{story.category}</span>
              <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-5 py-2.5 rounded-full border border-white/10">
                <i className="fa-regular fa-clock"></i>
                <span>يوم {currentDay} من 3</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12 md:py-24 relative">
        <div className="sticky top-6 z-[140] mb-16 flex items-center justify-between gap-4 bg-[var(--read-bg)]/80 backdrop-blur-xl p-5 rounded-[2.5rem] shadow-2xl border border-white/5">
          <div className="flex items-center gap-4">
            {(['dark', 'light', 'sepia', 'blue'] as const).map(mode => (
              <button 
                key={mode}
                onClick={() => setReadMode(mode)}
                title={mode}
                className={`w-10 h-10 rounded-full border-2 transition-all shadow-sm ${modeClasses[mode]} ${readMode === mode ? 'border-rose-500 scale-110' : 'border-transparent opacity-50'}`}
              />
            ))}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setFontSize(prev => Math.max(16, prev - 2))} className="w-11 h-11 flex items-center justify-center hover:bg-rose-500/20 rounded-2xl transition-all border border-transparent hover:border-rose-500/30 text-[var(--read-text)]">
              <i className="fa-solid fa-minus text-sm"></i>
            </button>
            <button onClick={() => setFontSize(prev => Math.min(44, prev + 2))} className="w-11 h-11 flex items-center justify-center hover:bg-rose-500/20 rounded-2xl transition-all border border-transparent hover:border-rose-500/30 text-[var(--read-text)]">
              <i className="fa-solid fa-plus text-sm"></i>
            </button>
          </div>
        </div>

        <div className="space-y-32 md:space-y-48">
          {[1, 2, 3].map(day => {
            const text = getDayText(day);
            if (!text) return null;
            const isLocked = day > currentDay;
            const isExpanded = expandedChapters[day];

            return (
              <section key={day} className={`fade-in-up ${isLocked ? 'opacity-40 grayscale cursor-not-allowed' : ''}`}>
                <div 
                  className={`flex items-center gap-8 mb-12 group select-none border-b border-rose-500/20 pb-10 ${!isLocked ? 'cursor-pointer' : ''}`}
                  onClick={() => toggleChapter(day)}
                >
                  <div className="flex flex-col flex-1 text-right">
                    <div className="flex items-center gap-4 mb-3">
                      <span className="text-[11px] font-black uppercase tracking-[0.5em] text-rose-500">الفصل {day === 1 ? 'الأول' : day === 2 ? 'الثاني' : 'الثالث'}</span>
                      {isLocked && <span className="bg-amber-500/20 text-amber-500 text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest"><i className="fa-solid fa-lock ml-1"></i> يُفتح غداً</span>}
                    </div>
                    <h3 className="text-3xl md:text-6xl font-black flex items-center justify-between text-[var(--read-text)]">
                        {day === 1 ? 'بداية النسج' : day === 2 ? 'ذروة الملحمة' : 'خاتمة المخطوطة'}
                        {!isLocked && <i className={`fa-solid fa-chevron-down text-2xl transition-transform duration-700 ${isExpanded ? 'rotate-180' : ''}`}></i>}
                    </h3>
                  </div>
                </div>

                {!isLocked && (
                  <div className={`transition-all duration-700 ease-in-out overflow-hidden ${isExpanded ? 'opacity-100' : 'max-h-0 opacity-0 pointer-events-none'}`}>
                    <div className="max-w-none text-right">
                      <p 
                        className="leading-relaxed md:leading-[2.5] whitespace-pre-wrap font-medium tracking-wide first-letter:text-6xl md:first-letter:text-8xl first-letter:font-black first-letter:text-rose-600 first-letter:ml-4 text-[var(--read-text)]"
                        style={{ fontSize: `${fontSize}px` }}
                      >
                        {text}
                      </p>
                    </div>
                  </div>
                )}
                
                {isLocked && (
                  <div className="py-12 border-2 border-dashed border-rose-500/20 rounded-[3rem] text-center">
                    <i className="fa-solid fa-hourglass-half text-5xl mb-6 text-rose-500/50 float"></i>
                    <p className="text-xl font-black text-[var(--read-text)] mb-2">هذا الفصل ما زال في علم الغيب...</p>
                    <p className="text-xs opacity-50 text-[var(--read-text)] uppercase tracking-widest">عُد غداً لتعرف ماذا حدث للأبطال</p>
                  </div>
                )}
              </section>
            );
          })}
        </div>

        <div className="mt-40 md:mt-56 bg-black/5 dark:bg-white/5 backdrop-blur-lg p-12 md:p-24 rounded-[4rem] text-center shadow-2xl border border-white/5">
          <h4 className="text-3xl md:text-6xl font-black mb-6 text-[var(--read-text)]">تقييم الملحمة</h4>
          <p className="text-xl opacity-70 mb-14 max-w-2xl mx-auto leading-relaxed text-[var(--read-text)]">رأيكم يخلد الحكايات في ذاكرة المحروسة.</p>
          
          <div className="flex justify-center gap-4 md:gap-10 mb-14">
            {[1, 2, 3, 4, 5].map(star => (
              <button 
                key={star} 
                disabled={hasRated}
                onClick={() => handleRate(star)}
                className={`transition-all duration-400 hover:scale-125 active:scale-95 ${rating >= star ? 'text-yellow-400 drop-shadow-lg' : 'text-slate-500 opacity-20'}`}
              >
                <i className="fa-solid fa-star text-4xl md:text-8xl"></i>
              </button>
            ))}
          </div>
          
          {hasRated && (
            <div className="animate-in zoom-in duration-600 bg-rose-600/10 p-10 rounded-[2.5rem] border border-rose-500/20 max-w-md mx-auto text-[var(--read-text)]">
              <p className="text-rose-600 font-black text-2xl md:text-3xl mb-4">نشكركم على التقييم!</p>
            </div>
          )}
        </div>

        <div className="mt-24 text-[var(--read-text)]">
          <Comments storyId={story.id} userName={userName} />
        </div>
      </div>
    </div>
  );
};

export default FullStoryView;
