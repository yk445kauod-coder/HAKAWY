
import React, { useState, useEffect, useRef } from 'react';
import { db, ref, set, get, update, child } from '../services/firebase';
import { onValue, push } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { ChatMessage } from '../types';

interface ChatProps {
  userName: string;
}

const Chat: React.FC<ChatProps> = ({ userName }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const chatRef = ref(db, 'hekayat_misr/chat');
    return onValue(chatRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const msgs = Object.values(data) as ChatMessage[];
        setMessages(msgs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()).slice(-50));
      }
    });
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    const chatRef = ref(db, 'hekayat_misr/chat');
    const newMsgRef = push(chatRef);
    await set(newMsgRef, {
      id: newMsgRef.key,
      userName,
      text,
      timestamp: new Date().toISOString()
    });
    setText('');
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 left-6 z-[60] bg-blue-600 text-white w-16 h-16 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-all border-4 border-white/10"
      >
        <i className="fa-solid fa-comments-bubble text-2xl"></i>
        <i className="fa-solid fa-comment-dots text-2xl"></i>
      </button>

      {isOpen && (
        <div className="fixed bottom-24 left-6 w-[calc(100vw-3rem)] md:w-[380px] h-[550px] bg-white dark:bg-[#0a192f] z-[60] rounded-[2.5rem] border border-gray-100 dark:border-white/5 flex flex-col shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom-6 fade-in overflow-hidden">
          <div className="p-6 border-b border-gray-50 dark:border-white/5 flex justify-between items-center bg-gray-50 dark:bg-white/5">
            <h3 className="font-black text-sm uppercase tracking-widest">مجلس حـكـاوي</h3>
            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-pink transition-colors">
              <i className="fa-solid fa-xmark text-xl"></i>
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.map((m) => (
              <div key={m.id} className={`flex flex-col ${m.userName === userName ? 'items-start text-right' : 'items-end text-left'}`}>
                <span className="text-[10px] text-gray-400 mb-1 px-1 font-bold uppercase tracking-widest">{m.userName}</span>
                <div className={`max-w-[85%] p-4 rounded-3xl text-sm font-medium leading-relaxed ${m.userName === userName ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-gray-100 dark:bg-white/5 text-gray-800 dark:text-white rounded-tl-none'}`}>
                  {m.text}
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={sendMessage} className="p-6 border-t border-gray-50 dark:border-white/5 flex gap-3 bg-gray-50 dark:bg-white/5">
            <input 
              className="flex-1 bg-white dark:bg-[#050a14] border border-gray-100 dark:border-white/10 rounded-2xl px-5 py-3 text-sm outline-none focus:border-pink dark:text-white transition-all"
              placeholder="شارك رأيك مع القراء..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <button className="bg-blue-600 text-white p-4 rounded-2xl hover:bg-pink transition-all shadow-lg">
              <i className="fa-solid fa-paper-plane"></i>
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default Chat;
