
import React from 'react';

const SplashScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[100] bg-[#050a14] flex flex-col items-center justify-center">
      <div className="relative text-center">
        <i className="fa-solid fa-feather-pointed text-pink text-4xl mb-6 float block"></i>
        <div className="text-7xl font-black font-cairo text-white mb-4 tracking-tighter float">حكاوي</div>
        <div className="w-16 h-1 bg-cyan-500 mx-auto rounded-full"></div>
      </div>
      <p className="mt-8 text-blue-300/60 font-bold tracking-[0.4em] uppercase text-[10px]">ننسج ملاحم النيل</p>
    </div>
  );
};

export default SplashScreen;
