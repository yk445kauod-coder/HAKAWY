
import React from 'react';

interface SidebarProps {
  userName: string;
  activeTab: string;
  onTabChange: (tab: string) => void;
  userPoints?: number;
}

const Sidebar: React.FC<SidebarProps> = ({ userName, activeTab, onTabChange, userPoints = 150 }) => {
  const getLevelInfo = (pts: number) => {
    if (pts < 100) return { name: 'مبتدئ', sub: 'حبر طازة، وأحلام مالهاش حدود.', icon: 'fa-seedling', color: 'text-emerald-500' };
    if (pts < 500) return { name: 'غزّال حكاوي', sub: 'بيربط خيوط الحواديت باحتراف.', icon: 'fa-wind', color: 'text-sky-500' };
    if (pts < 1000) return { name: 'كبير الرواة', sub: 'قلمك هو سلاحك في دنيا الخيال.', icon: 'fa-pen-fancy', color: 'text-violet-500' };
    return { name: 'سلطان الحكي', sub: 'أسطورة حية على ضفاف النيل.', icon: 'fa-crown', color: 'text-amber-500' };
  };

  const level = getLevelInfo(userPoints);
  const nextMilestone = userPoints < 100 ? 100 : userPoints < 500 ? 500 : 1000;
  const progress = (userPoints / nextMilestone) * 100;

  const menuItems = [
    { id: 'feed', label: 'الرئيسية', icon: 'fa-clapperboard' },
    { id: 'forum', label: 'مجلس الحكماء', icon: 'fa-mosque' },
    { id: 'collab', label: 'كتابة جماعية', icon: 'fa-hands-holding-circle' },
    { id: 'messages', label: 'المراسلات', icon: 'fa-envelope-open-text' },
  ];

  return (
    <aside className="fixed right-0 top-[120px] bottom-0 w-80 bg-[var(--glass)] backdrop-blur-3xl border-l border-[var(--border-color)] p-8 hidden xl:flex flex-col z-40 transition-colors">
      <div className="mb-10 bg-[var(--bg-tertiary)] p-8 rounded-[2.5rem] border border-[var(--border-color)] shadow-sm">
        <div className="flex items-center gap-4 mb-6">
          <div className={`w-16 h-16 bg-[var(--bg-main)] rounded-2xl flex items-center justify-center text-3xl shadow-sm ${level.color}`}>
            <i className={`fa-solid ${level.icon}`}></i>
          </div>
          <div>
            <h4 className="text-[var(--text-main)] font-black text-xl tracking-tight">{userName}</h4>
            <span className={`text-[10px] font-black uppercase tracking-widest ${level.color}`}>{level.name}</span>
          </div>
        </div>
        
        <p className="text-[10px] text-[var(--text-sub)] font-bold mb-6 italic leading-relaxed text-right">"{level.sub}"</p>
        
        <div className="space-y-3">
          <div className="flex justify-between text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">
            <span>نقاط الخبرة</span>
            <span>{userPoints} / {nextMilestone}</span>
          </div>
          <div className="h-2 w-full bg-[var(--bg-main)] rounded-full overflow-hidden">
            <div className="h-full bg-[var(--accent-secondary)] transition-all duration-1000 shadow-[0_0_10px_rgba(244,63,94,0.3)]" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
      </div>

      <nav className="space-y-3 mb-10">
        {menuItems.map(item => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`w-full flex items-center gap-4 p-5 rounded-3xl transition-all font-black text-xs uppercase tracking-widest group ${
              activeTab === item.id 
                ? 'bg-[var(--accent-primary)] text-white shadow-lg border-t border-white/20' 
                : 'text-[var(--text-sub)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-main)]'
            }`}
          >
            <i className={`fa-solid ${item.icon} w-6 text-center text-xl transition-transform group-hover:scale-110`}></i>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="mt-auto">
        <div className="p-8 bg-gradient-to-br from-[var(--accent-primary)]/10 to-transparent rounded-[2.5rem] border border-[var(--border-color)]">
          <p className="text-[10px] font-black text-[var(--accent-primary)] uppercase tracking-[0.3em] mb-6">مرسم الكتابة</p>
          <div className="space-y-4">
            <button 
              onClick={() => onTabChange('remix')}
              className="w-full text-right text-xs font-bold text-[var(--text-sub)] hover:text-[var(--accent-secondary)] transition-colors flex items-center justify-between group"
            >
              <span>محرك الريمكس</span>
              <i className="fa-solid fa-wand-magic-sparkles group-hover:rotate-12 transition-transform text-[var(--accent-secondary)]"></i>
            </button>
            <button 
              onClick={() => onTabChange('collab')}
              className="w-full text-right text-xs font-bold text-[var(--text-sub)] hover:text-sky-500 transition-colors flex items-center justify-between group"
            >
              <span>تعاونات مفتوحة</span>
              <i className="fa-solid fa-code-branch group-hover:scale-110 transition-transform text-sky-500"></i>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
