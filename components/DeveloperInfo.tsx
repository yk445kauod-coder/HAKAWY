
import React from 'react';

interface DeveloperInfoProps {
  onClose: () => void;
}

const DeveloperInfo: React.FC<DeveloperInfoProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 animate-in fade-in zoom-in duration-300">
      <div className="absolute inset-0 bg-[#050a14]/95 backdrop-blur-xl" onClick={onClose}></div>
      <div className="relative w-full max-w-md bg-white dark:bg-[#0a192f] rounded-[2.5rem] p-10 shadow-2xl border border-white/5 text-center">
        <div className="w-24 h-24 bg-gradient-to-tr from-blue-600 to-pink rounded-full mx-auto mb-8 flex items-center justify-center shadow-lg">
          <i className="fa-solid fa-user-tie text-white text-4xl"></i>
        </div>
        
        <h3 className="text-3xl font-black mb-2 dark:text-white">يوسف خميس</h3>
        <p className="text-pink font-bold text-sm uppercase tracking-widest mb-8">Yousef Khamis</p>
        
        <div className="space-y-4 mb-10">
          <div className="flex items-center justify-center gap-3 text-blue-400 font-bold">
            <i className="fa-solid fa-envelope"></i>
            <a href="mailto:yousefmadbouly60@gmail.com" className="hover:text-pink transition-colors">yousefmadbouly60@gmail.com</a>
          </div>
          <div className="flex items-center justify-center gap-3 text-gray-500 text-sm">
            <i className="fa-solid fa-terminal"></i>
            <span>Lead Frontend Architect & Gemini AI Expert</span>
          </div>
        </div>

        <button 
          onClick={onClose}
          className="w-full bg-blue-600 hover:bg-pink text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-blue-600/20"
        >
          إغلاق النافذة
        </button>
      </div>
    </div>
  );
};

export default DeveloperInfo;
