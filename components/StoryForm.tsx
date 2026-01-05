
import React, { useState } from 'react';
import { Story, StoryGenre } from '../types';

interface StoryFormProps {
  onAdd: (story: Story) => Promise<void>;
  onCancel: () => void;
}

const StoryForm: React.FC<StoryFormProps> = ({ onAdd, onCancel }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    genre: 'Drama' as StoryGenre,
    category: '',
    characters: '',
    summary: '',
    day1: '',
    day2: '',
    day3: '',
    coverImage: ''
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, coverImage: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    // Basic Validation
    if (!formData.day1 || !formData.day2 || !formData.day3) {
      alert("برجاء إكمال جميع فصول الرواية.");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const newStory: Story = {
        id: `user-story-${Date.now()}`,
        title: formData.title,
        genre: formData.genre,
        category: formData.category || formData.genre,
        characters: formData.characters.split(',').map(s => s.trim()),
        summary: formData.summary,
        day1: formData.day1,
        day2: formData.day2,
        day3: formData.day3,
        startDate: new Date().toISOString(),
        average_rating: null,
        user_ratings_count: 0,
        isUserStory: true,
        coverImage: formData.coverImage
      };
      
      await onAdd(newStory);
    } catch (error) {
      console.error("Submission failed", error);
      alert("عذراً، حدث خطأ أثناء النشر. حاول مرة أخرى.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#0a192f] border border-gray-100 dark:border-white/5 rounded-3xl md:rounded-[32px] p-6 md:p-8 mb-12 md:mb-16 premium-shadow relative overflow-hidden">
      {isSubmitting && (
        <div className="absolute inset-0 z-50 bg-white/80 dark:bg-[#0a192f]/90 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-300">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-pink rounded-full animate-spin mb-6"></div>
          <p className="text-blue-500 font-black text-lg animate-pulse">جاري تخليد ملحمتك في السجلات...</p>
        </div>
      )}

      <div className="mb-8 pb-6 border-b border-gray-50 dark:border-white/5 flex justify-between items-center">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white mb-1">نثر ملحمة جديدة</h2>
          <p className="text-gray-400 text-[10px] md:text-sm font-medium">دع قلمك يخط ملامح الخيال</p>
        </div>
        <button onClick={onCancel} className="text-gray-300 hover:text-pink transition-colors">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-3">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">غلاف الملحمة</label>
          <div 
            className={`relative h-48 md:h-64 w-full rounded-2xl md:rounded-3xl border-2 border-dashed transition-all overflow-hidden flex flex-col items-center justify-center cursor-pointer ${
              formData.coverImage ? 'border-transparent' : 'border-gray-100 dark:border-white/10 hover:border-pink bg-gray-50 dark:bg-white/5'
            }`}
            onClick={() => document.getElementById('coverInput')?.click()}
          >
            {formData.coverImage ? (
              <img src={formData.coverImage} className="absolute inset-0 w-full h-full object-cover" alt="Cover Preview" />
            ) : (
              <div className="text-center p-4">
                <svg className="w-10 h-10 text-gray-200 dark:text-white/10 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">رفع صورة الغلاف</p>
              </div>
            )}
            <input id="coverInput" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">العنوان</label>
            <input 
              required
              className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl p-4 text-sm font-bold focus:border-pink outline-none transition-all dark:text-white"
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">النوع</label>
              <select 
                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl p-4 text-sm font-bold outline-none focus:border-pink dark:text-white"
                value={formData.genre}
                onChange={e => setFormData({...formData, genre: e.target.value as StoryGenre})}
              >
                <option value="Drama">دراما</option>
                <option value="Horror">رعب</option>
                <option value="Love">رومانسية</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">التصنيف</label>
              <input 
                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl p-4 text-sm font-bold outline-none focus:border-pink dark:text-white"
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value})}
              />
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">أبطال الحكاية (افصل بينهم بفاصلة)</label>
          <input 
            required
            className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl p-4 text-sm font-bold outline-none focus:border-pink dark:text-white"
            value={formData.characters}
            onChange={e => setFormData({...formData, characters: e.target.value})}
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">الملخص</label>
          <textarea 
            required
            className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl p-4 text-sm font-medium h-24 outline-none focus:border-pink resize-none dark:text-white"
            value={formData.summary}
            onChange={e => setFormData({...formData, summary: e.target.value})}
          />
        </div>

        <div className="space-y-8">
          {['day1', 'day2', 'day3'].map((day, idx) => (
            <div key={day} className="space-y-2">
              <label className="text-xs font-black text-gray-900 dark:text-white flex items-center gap-2">
                <span className={`w-6 h-6 rounded-full text-[10px] flex items-center justify-center ${idx === 0 ? 'bg-pink text-white' : idx === 1 ? 'bg-blue-600 text-white' : 'bg-black text-white'}`}>
                  {idx + 1}
                </span>
                {idx === 0 ? 'الفصل الأول' : idx === 1 ? 'الفصل الثاني' : 'الفصل الثالث'}
              </label>
              <textarea 
                required
                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl p-4 md:p-6 text-sm md:text-base h-48 md:h-64 outline-none focus:border-pink leading-relaxed dark:text-white"
                value={(formData as any)[day]}
                onChange={e => setFormData({...formData, [day]: e.target.value})}
              />
            </div>
          ))}
        </div>

        <button 
          type="submit"
          disabled={isSubmitting}
          className={`w-full bg-black dark:bg-blue-600 text-white font-black py-4 md:py-5 rounded-2xl transition-all text-base md:text-lg shadow-xl flex items-center justify-center gap-4 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:scale-[1.01]'}`}
        >
          {isSubmitting ? (
            <>
              <i className="fa-solid fa-spinner animate-spin"></i>
              <span>جاري النشر...</span>
            </>
          ) : (
            <>
              <span>نشر الملحمة</span>
              <i className="fa-solid fa-paper-plane"></i>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default StoryForm;
