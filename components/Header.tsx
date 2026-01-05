
import React from 'react';

interface HeaderProps {
  onShowDev?: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Header: React.FC<HeaderProps> = ({ onShowDev, activeTab, onTabChange }) => {
  return (
    <header className="bg-[var(--nav-bg)] backdrop-blur-xl border-b border-[var(--border-color)] py-6 md:py-10 mb-8 md:mb-12 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8">
        <div className="text-center md:text-right group cursor-pointer" onClick={() => onTabChange('feed')}>
          <h1 className="text-4xl md:text-6xl font-black text-[var(--text-main)] tracking-tighter transition-all group-hover:text-[var(--accent-secondary)]">
            حكـاوي <i className="fa-solid fa-book-open-reader text-[var(--accent-secondary)] ml-2 text-2xl md:text-4xl"></i>
          </h1>
          <div className="flex items-center justify-center md:justify-start gap-2 md:gap-3 mt-1 md:mt-2">
            <div className="h-[2px] w-4 md:w-6 bg-[var(--accent-primary)]"></div>
            <p className="text-[var(--accent-primary)] text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em]">
              روايات مـلحـمـيـة يـومـيـة
            </p>
          </div>
        </div>
        
        <nav className="flex items-center gap-6 md:gap-12 text-[9px] md:text-[10px] font-black text-[var(--text-sub)] uppercase tracking-[0.2em] md:tracking-[0.3em]">
          <button 
            onClick={() => onTabChange('feed')} 
            className={`transition-colors flex items-center gap-2 ${activeTab === 'feed' ? 'text-[var(--text-main)] border-b-2 border-[var(--accent-secondary)] pb-1' : 'hover:text-[var(--text-main)]'}`}
          >
            <i className="fa-solid fa-house"></i> الرئيسية
          </button>
          <button 
            onClick={() => onTabChange('forum')} 
            className={`transition-colors flex items-center gap-2 ${activeTab === 'forum' ? 'text-[var(--text-main)] border-b-2 border-[var(--accent-secondary)] pb-1' : 'hover:text-[var(--text-main)]'}`}
          >
            <i className="fa-solid fa-comments"></i> المنتدى
          </button>
          <button onClick={onShowDev} className="hover:text-[var(--accent-secondary)] transition-colors flex items-center gap-2">
            <i className="fa-solid fa-code"></i> المطور
          </button>
        </nav>
      </div>
    </header>
  );
};

export default Header;
