
import React, { useState } from 'react';
import { Story } from '../types';
import { getStoryDay, recordShareInDb } from '../services/storage';
import Comments from './Comments';

interface StoryCardProps {
  story: Story;
  userName: string;
  onReadFull: () => void;
  onRatingUpdate?: (updatedStories: Story[]) => void;
}

const genreMap: Record<string, string> = {
  'Drama': 'دراما إنسانية معاصرة',
  'Horror': 'رعب ماورائي أصيل',
  'Love': 'ملحمة عشق قاهرية'
};

const StoryCard: React.FC<StoryCardProps> = ({ story, userName, onReadFull }) => {
  const [showComments, setShowComments] = useState(false);
  const [isShared, setIsShared] = useState(false);

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    const url = new URL(window.location.origin);
    url.searchParams.set('story', story.id);
    const shareLink = url.toString();

    if (navigator.share) {
      try {
        await navigator.share({
          title: `رواق حكاوي: ${story.title}`,
          text: story.summary,
          url: shareLink
        });
        await recordShareInDb(story.id);
      } catch (err) {
        console.log("Share cancelled");
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareLink);
        await recordShareInDb(story.id);
        setIsShared(true);
        setTimeout(() => setIsShared(false), 3000);
      } catch (err) {
        alert("فشل نسخ الرابط.");
      }
    }
  };

  return (
    <article className="blog-card rounded-[2.5rem] md:rounded-[3.5rem] overflow-hidden flex flex-col h-full bg-[var(--bg-secondary)] premium-shadow transition-all duration-500 scale-hover border border-[var(--border-color)] relative fade-in-up group">
      <div className="absolute top-4 left-4 md:top-8 md:left-8 z-20 flex gap-2">
         <div className="flex items-center gap-2 bg-black/70 backdrop-blur-xl px-4 py-2 rounded-2xl border border-white/20 shadow-2xl">
            <span className="text-xs font-black text-sky-400">{story.average_rating || 'جديد'}</span>
            <i className="fa-solid fa-star text-rose-500 text-xs"></i>
          </div>
          <button 
            onClick={handleShare}
            className={`flex items-center gap-2 backdrop-blur-xl px-4 py-2 rounded-2xl border transition-all duration-300 shadow-2xl ${
              isShared 
                ? 'bg-emerald-600 border-emerald-400 text-white' 
                : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
            }`}
          >
            <i className={`fa-solid ${isShared ? 'fa-check' : 'fa-share-nodes'} text-xs`}></i>
            <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">
              {isShared ? 'تم النسخ' : 'نشر'}
            </span>
          </button>
      </div>

      <div className="relative h-[280px] md:h-[450px] w-full overflow-hidden cursor-pointer" onClick={onReadFull}>
        {story.coverImage ? (
          <img src={story.coverImage} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt={story.title} />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-800 to-indigo-950"></div>
        )}
        
        <div className="absolute inset-0 story-card-overlay flex flex-col justify-end p-8 md:p-10 text-white">
          <div className="transform transition-all duration-500 group-hover:-translate-y-2">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] bg-rose-600 text-white px-4 py-1.5 rounded-full mb-4 inline-block shadow-lg">
              {genreMap[story.genre] || story.genre}
            </span>
            <h3 className="text-2xl md:text-5xl font-black leading-tight mb-3 drop-shadow-2xl text-white">
              {story.title}
            </h3>
            <p className="text-slate-200 text-xs md:text-lg font-medium line-clamp-2 italic opacity-90 leading-relaxed max-w-2xl">
              "{story.summary}"
            </p>
          </div>
        </div>
      </div>

      <div className="p-8 md:p-10 flex flex-col flex-1 bg-[var(--bg-secondary)]">
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-[var(--border-color)]">
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest mb-1">تصنيف الرواق</span>
            <span className="font-bold text-sm md:text-lg text-[var(--text-main)]">{story.category}</span>
          </div>
          <div className="text-left">
            <span className="text-[9px] font-black text-[var(--text-sub)] uppercase tracking-widest block mb-1">تأليف</span>
            <span className="text-sky-500 font-bold text-xs">{story.isUserStory ? (story.authorName || 'عضو') : 'حكواتي الذكاء'}</span>
          </div>
        </div>

        <div className="mb-8">
          <span className="text-[9px] font-black text-[var(--text-sub)] uppercase tracking-widest block mb-3">الأبطال</span>
          <div className="flex flex-wrap gap-2">
            {story.characters.map((c, i) => (
              <span key={i} className="text-[10px] bg-[var(--accent-indigo)]/10 text-[var(--accent-indigo)] border border-[var(--accent-indigo)]/20 px-3 py-1 rounded-lg font-bold">
                {c.split(':')[0]}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-auto flex items-center gap-3">
          <button 
            onClick={onReadFull}
            className="flex-1 bg-indigo-600 hover:bg-rose-600 text-white font-black py-4 rounded-2xl transition-all duration-300 text-xs uppercase tracking-[0.2em] shadow-xl flex items-center justify-center gap-3 active:scale-95"
          >
            <span>اقرأ الملحمة</span>
            <i className="fa-solid fa-chevron-left text-[10px]"></i>
          </button>
          
          <button 
            onClick={() => setShowComments(!showComments)}
            className="w-14 h-14 border border-[var(--border-color)] rounded-2xl flex items-center justify-center text-[var(--text-sub)] hover:text-[var(--text-main)] hover:bg-[var(--border-color)] transition-all active:scale-90"
          >
            <i className="fa-solid fa-comments text-lg"></i>
          </button>
        </div>

        {showComments && (
          <div className="mt-8 border-t border-[var(--border-color)] pt-8 animate-in fade-in slide-in-from-top-4">
            <Comments storyId={story.id} userName={userName} />
          </div>
        )}
      </div>
    </article>
  );
};

export default StoryCard;
