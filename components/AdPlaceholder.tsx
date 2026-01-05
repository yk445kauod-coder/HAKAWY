
import React from 'react';

const AdPlaceholder: React.FC = () => {
  return (
    <div className="w-full my-12 px-4 animate-in fade-in duration-1000">
      <div className="max-w-4xl mx-auto h-32 bg-gradient-to-r from-blue-900/10 via-white/5 to-blue-900/10 border border-white/5 rounded-[2rem] flex items-center justify-center relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-2 text-[8px] font-black uppercase text-gray-500/30 tracking-widest">SPONSORED</div>
        <div className="text-center opacity-40 group-hover:opacity-80 transition-opacity">
           <i className="fa-solid fa-rectangle-ad text-2xl text-gray-400 mb-2"></i>
           <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">دعم الرواق</p>
        </div>
      </div>
    </div>
  );
};

export default AdPlaceholder;
