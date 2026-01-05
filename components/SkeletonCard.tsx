
import React from 'react';

const SkeletonCard: React.FC = () => {
  return (
    <div className="rounded-[2rem] md:rounded-[3.5rem] overflow-hidden flex flex-col h-[600px] md:h-[800px] bg-white/5 dark:bg-[#0a192f]/40 animate-pulse border border-white/5 transition-all duration-1000">
      <div className="w-full h-full bg-gradient-to-br from-white/5 to-transparent"></div>
    </div>
  );
};

export default SkeletonCard;
