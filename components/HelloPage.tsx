
import React, { useState } from 'react';
import { User } from '../types';
import { registerUser, loginUser } from '../services/storage';

interface HelloPageProps {
  onStart: (user: User) => void;
}

const HelloPage: React.FC<HelloPageProps> = ({ onStart }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        const user = await loginUser(username, password);
        onStart(user);
      } else {
        const newUser: User = {
          username,
          password,
          points: 50,
          level: 'مبتدئ',
          bio: 'كاتب جديد في رواق حكاوي',
          badges: ['بذرة إبداع']
        };
        await registerUser(newUser);
        onStart(newUser);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050a14] flex flex-col items-center justify-center px-6 text-center animate-in fade-in duration-1000 overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-900/20 via-transparent to-pink/10 pointer-events-none"></div>
      
      <div className="max-w-md w-full bg-white/5 backdrop-blur-3xl p-10 rounded-[3rem] border border-white/5 relative z-10 shadow-2xl">
        <div className="mb-10">
          <i className="fa-solid fa-feather-pointed text-pink text-5xl mb-6 float block mx-auto"></i>
          <h1 className="text-4xl md:text-5xl font-black mb-2 text-white tracking-tighter">رواق حكاوي</h1>
          <p className="text-blue-300/60 text-sm font-bold uppercase tracking-widest">مخطوطات مصر الرقمية</p>
        </div>

        <div className="flex bg-white/5 rounded-2xl p-1 mb-8">
          <button 
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-3 rounded-xl font-bold transition-all ${isLogin ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500'}`}
          >دخول</button>
          <button 
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-3 rounded-xl font-bold transition-all ${!isLogin ? 'bg-pink text-white shadow-lg' : 'text-gray-500'}`}
          >عضوية جديدة</button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <input 
            type="text"
            placeholder="اسم الكاتب"
            className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-center text-lg outline-none focus:border-pink text-white transition-all"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input 
            type="password"
            placeholder="كلمة السر"
            className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-center text-lg outline-none focus:border-pink text-white transition-all"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <p className="text-pink text-xs font-bold animate-pulse">{error}</p>}
          <button 
            type="submit"
            disabled={loading}
            className={`w-full ${isLogin ? 'bg-blue-600' : 'bg-pink'} text-white font-black py-5 rounded-2xl text-xl hover:opacity-90 transition-all shadow-xl flex items-center justify-center gap-3`}
          >
            {loading ? <i className="fa-solid fa-spinner animate-spin"></i> : (isLogin ? 'دخول الرواق' : 'انضم للمبدعين')}
          </button>
        </form>
        
        <p className="mt-10 text-[9px] text-white/20 font-bold uppercase tracking-[0.3em]">بوابة المبدعين - القاهرة</p>
      </div>
    </div>
  );
};

export default HelloPage;
