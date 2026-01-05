
import React, { useState, useEffect } from 'react';
import { db, ref, set } from '../services/firebase';
import { onValue, push } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { Comment } from '../types';

interface CommentsProps {
  storyId: string;
  userName: string;
}

const Comments: React.FC<CommentsProps> = ({ storyId, userName }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState('');

  useEffect(() => {
    const commentsRef = ref(db, `hekayat_misr/comments/${storyId}`);
    return onValue(commentsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.values(data) as Comment[];
        setComments(list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      }
    });
  }, [storyId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    const commentsRef = ref(db, `hekayat_misr/comments/${storyId}`);
    const newCommentRef = push(commentsRef);
    await set(newCommentRef, {
      id: newCommentRef.key,
      userName,
      text,
      timestamp: new Date().toISOString()
    });
    setText('');
  };

  return (
    <div className="mt-12 pt-12 border-t border-[var(--border-color)] animate-in fade-in duration-500">
      <h4 className="text-2xl font-black mb-8 text-[var(--text-main)]">التعليقات والهمسات ({comments.length})</h4>
      
      <form onSubmit={handleSubmit} className="mb-10 flex gap-4">
        <input 
          className="flex-1 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-2xl p-5 text-sm font-bold outline-none focus:border-[var(--accent-primary)] text-[var(--text-main)] transition-all"
          placeholder="ما رأيك في هذه الملحمة؟"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button className="bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-white px-8 rounded-2xl font-black text-sm transition-all shadow-md active:scale-95">ارسل الهمسة</button>
      </form>

      <div className="space-y-8">
        {comments.map(c => (
          <div key={c.id} className="group p-6 rounded-[2rem] bg-[var(--bg-tertiary)] border border-transparent hover:border-[var(--border-color)] transition-all">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-[var(--accent-primary)] text-white flex items-center justify-center font-black text-xs shadow-sm">
                {c.userName[0].toUpperCase()}
              </div>
              <div className="flex flex-col">
                <span className="font-black text-sm text-[var(--text-main)]">{c.userName}</span>
                <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{new Date(c.timestamp).toLocaleDateString('ar-EG')}</span>
              </div>
            </div>
            <p className="text-[var(--text-sub)] text-sm leading-relaxed font-medium">{c.text}</p>
          </div>
        ))}
        {comments.length === 0 && (
          <div className="text-center py-10 opacity-40">
            <i className="fa-solid fa-comment-dots text-4xl mb-4 text-[var(--text-muted)]"></i>
            <p className="italic text-sm text-[var(--text-muted)]">لا توجد تعليقات بعد، كن أول من يعلق!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Comments;
