import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Story, ForumPost, CollabProject, User, Message, Comment } from './types';
import { generateDailyStories, remixStory, completeMissingParts } from './services/geminiService';
import { loadStoriesFromDb, saveStoriesToDb, getActiveStories, loadForumPosts, postToForum, likeForumPost, repostForumPost, addForumComment, loadCollabs, createCollab, updateCollab, loadMessagesForUser, sendMessagePrivate, getAllUsers } from './services/storage';
import Header from './components/Header';
import StoryCard from './components/StoryCard';
import SkeletonCard from './components/SkeletonCard';
import StoryForm from './components/StoryForm';
import SplashScreen from './components/SplashScreen';
import HelloPage from './components/HelloPage';
import Chat from './components/Chat';
import Sidebar from './components/Sidebar';
import FullStoryView from './components/FullStoryView';
import DeveloperInfo from './components/DeveloperInfo';
import AdPlaceholder from './components/AdPlaceholder';

const filterMap = { all: 'كل الروايات', ai: 'تأليف حكاوي', community: 'أقلام القراء' };

const App: React.FC = () => {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [user, setUser] = useState<User | null>(JSON.parse(localStorage.getItem('hekayat_user') || 'null'));
  const [activeTab, setActiveTab] = useState('feed');
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<'all' | 'ai' | 'community'>('all');
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>(localStorage.getItem('app_theme') as any || 'dark');
  const [showDev, setShowDev] = useState(false);

  // Forum state
  const [forumPosts, setForumPosts] = useState<ForumPost[]>([]);
  const [forumInput, setForumInput] = useState('');
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [commentInput, setCommentInput] = useState<Record<string, string>>({});
  
  // States
  const [collabs, setCollabs] = useState<CollabProject[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedChatUser, setSelectedChatUser] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setShowSplash(false), 2000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('app_theme', theme);
  }, [theme]);

  const syncAll = useCallback(async () => {
    setLoading(true);
    try {
      const [s, f, c, uList] = await Promise.all([
        loadStoriesFromDb(), 
        loadForumPosts(), 
        loadCollabs(),
        getAllUsers()
      ]);
      
      let allLoadedStories = [...s];
      setStories(getActiveStories(allLoadedStories));
      setForumPosts(f.sort((a,b) => b.timestamp.localeCompare(a.timestamp)));
      setCollabs(c.sort((a,b) => b.timestamp.localeCompare(a.timestamp)));
      setAllUsers(uList.filter(u => u.username !== user?.username));

      if (user) {
        const msgs = await loadMessagesForUser(user.username);
        setMessages(msgs.sort((a,b) => a.timestamp.localeCompare(b.timestamp)));
      }

      const todayStr = new Date().toISOString().split('T')[0];
      const aiToday = allLoadedStories.filter(x => !x.isUserStory && x.startDate.startsWith(todayStr));
      
      // Requirement: 10 new stories daily
      if (aiToday.length < 10) {
        setIsGeneratingAI(true);
        const newAI = await generateDailyStories(allLoadedStories);
        if (newAI.length) {
          await saveStoriesToDb(newAI);
          const refreshed = await loadStoriesFromDb();
          setStories(getActiveStories(refreshed));
        }
        setIsGeneratingAI(false);
      }

      // Final check for completions of any existing active stories
      const incomplete = getActiveStories(allLoadedStories).filter(x => !x.isUserStory && (!x.day1 || !x.day2 || !x.day3));
      if (incomplete.length > 0) {
        setIsGeneratingAI(true);
        const completions = await Promise.all(incomplete.map(st => completeMissingParts(st)));
        const validCompletions = completions.filter(x => x !== null) as Story[];
        if (validCompletions.length > 0) {
          await saveStoriesToDb(validCompletions);
          const finalRefreshed = await loadStoriesFromDb();
          setStories(getActiveStories(finalRefreshed));
        }
        setIsGeneratingAI(false);
      }

    } catch (e) {
      console.error("Sync Error:", e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { if (!showSplash && user) syncAll(); }, [showSplash, user, syncAll]);

  const handleAuth = (u: User) => {
    localStorage.setItem('hekayat_user', JSON.stringify(u));
    setUser(u);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedChatUser || !user) return;
    const msg: Message = {
      id: `msg-${Date.now()}`,
      sender: user.username,
      receiver: selectedChatUser,
      text: messageInput,
      timestamp: new Date().toISOString(),
      isRead: false
    };
    await sendMessagePrivate(msg);
    setMessages(prev => [...prev, msg]);
    setMessageInput('');
  };

  const handleForumSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forumInput.trim() || !user) return;
    const post: ForumPost = {
      id: `post-${Date.now()}`,
      author: user.username,
      title: 'نقاش',
      content: forumInput,
      timestamp: new Date().toISOString(),
      likes: 0,
      reposts: 0,
      tags: []
    };
    await postToForum(post);
    setForumPosts(prev => [post, ...prev]);
    setForumInput('');
  };

  const handleLikePost = async (postId: string) => {
    await likeForumPost(postId);
    syncAll();
  };

  const handleRepostPost = async (postId: string) => {
    await repostForumPost(postId);
    syncAll();
  };

  const handleCommentSubmit = async (e: React.FormEvent, postId: string) => {
    e.preventDefault();
    const text = commentInput[postId];
    if (!text?.trim() || !user) return;

    const newComment: Comment = {
      id: `com-${Date.now()}`,
      userName: user.username,
      text: text,
      timestamp: new Date().toISOString()
    };

    await addForumComment(postId, newComment);
    setCommentInput(prev => ({ ...prev, [postId]: '' }));
    syncAll();
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'forum':
        return (
          <div className="py-8 md:py-12 max-w-2xl mx-auto px-4 fade-in-up">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-4xl md:text-5xl font-black text-[var(--text-main)] tracking-tighter">مجلس <span className="text-rose-500">الحكماء</span></h2>
              <i className="fa-brands fa-twitter text-3xl text-sky-400"></i>
            </div>
            
            <div className="glass-morphism p-6 rounded-3xl mb-8 border border-[var(--border-color)]">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white font-black shadow-lg shrink-0 overflow-hidden">
                  {user?.username ? user.username[0].toUpperCase() : <i className="fa-solid fa-user"></i>}
                </div>
                <div className="flex-1">
                  <form onSubmit={handleForumSubmit}>
                    <textarea 
                      value={forumInput}
                      onChange={(e) => setForumInput(e.target.value)}
                      placeholder="ماذا يدور في خلدك يا حكواتي؟" 
                      className="w-full bg-transparent border-none text-[var(--text-main)] text-lg placeholder:text-slate-500 outline-none resize-none h-24 pt-2"
                    />
                    <div className="flex items-center justify-between border-t border-[var(--border-color)] pt-4 mt-2">
                       <div className="flex gap-5 text-sky-400 text-lg">
                          <i className="fa-solid fa-image cursor-pointer hover:opacity-70 transition-opacity"></i>
                          <i className="fa-solid fa-list-check cursor-pointer hover:opacity-70 transition-opacity"></i>
                          <i className="fa-solid fa-face-smile cursor-pointer hover:opacity-70 transition-opacity"></i>
                          <i className="fa-solid fa-location-dot cursor-pointer hover:opacity-70 transition-opacity"></i>
                       </div>
                       <button 
                        type="submit" 
                        disabled={!forumInput.trim()}
                        className="bg-indigo-600 disabled:opacity-50 text-white font-black px-8 py-2.5 rounded-full text-sm hover:bg-rose-600 transition-all shadow-xl active:scale-95"
                       >
                         نشر الهمسة
                       </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>

            <div className="divide-y divide-[var(--border-color)] border-t border-[var(--border-color)]">
              {forumPosts.map((p, index) => {
                const commentCount = p.comments ? Object.keys(p.comments).length : 0;
                const isExpanded = expandedComments[p.id];
                
                return (
                  <React.Fragment key={p.id}>
                    {/* Loopy Ad Placement in Forum */}
                    {index > 0 && index % 5 === 0 && <AdPlaceholder />}
                    
                    <div className="bg-transparent py-6 hover:bg-[var(--bg-secondary)]/30 transition-all group px-4 rounded-xl mb-1">
                      <div className="flex gap-4">
                        <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-white font-black shadow-md shrink-0 border border-white/5">
                          {p.author[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                           <div className="flex items-center gap-2 mb-1">
                             <span className="font-black text-[var(--text-main)] hover:underline truncate text-base">{p.author}</span>
                             <span className="text-slate-500 text-xs font-bold">@{p.author.toLowerCase()}</span>
                             <span className="text-slate-500 text-xs">· {new Date(p.timestamp).toLocaleDateString('ar-EG')}</span>
                           </div>
                           <p className="text-[var(--text-main)] text-base leading-relaxed mb-4 whitespace-pre-wrap">
                             {p.content}
                           </p>
                           
                           <div className="flex items-center justify-between text-slate-500 max-w-md ml-0 mr-auto pt-2">
                             <button 
                              onClick={() => setExpandedComments(prev => ({ ...prev, [p.id]: !prev[p.id] }))} 
                              className={`flex items-center gap-2 hover:text-sky-400 transition-all text-xs font-black ${isExpanded ? 'text-sky-400' : ''}`}
                             >
                                <i className="fa-regular fa-comment text-lg"></i>
                                <span>{commentCount}</span>
                             </button>
                             <button 
                              onClick={() => handleRepostPost(p.id)} 
                              className="flex items-center gap-2 hover:text-emerald-400 transition-all text-xs font-black"
                             >
                                <i className="fa-solid fa-retweet text-lg"></i>
                                <span>{p.reposts || 0}</span>
                             </button>
                             <button 
                              onClick={() => handleLikePost(p.id)} 
                              className={`flex items-center gap-2 hover:text-rose-500 transition-all text-xs font-black ${p.likes > 0 ? 'text-rose-500' : ''}`}
                             >
                                <i className={`${p.likes > 0 ? 'fa-solid' : 'fa-regular'} fa-heart text-lg`}></i>
                                <span>{p.likes || 0}</span>
                             </button>
                             <button className="flex items-center gap-2 hover:text-sky-400 transition-all text-xs">
                                <i className="fa-solid fa-share-nodes text-lg"></i>
                             </button>
                           </div>

                           {isExpanded && (
                             <div className="mt-6 space-y-4 animate-in fade-in slide-in-from-top-2">
                               <div className="border-t border-[var(--border-color)] pt-4">
                                 {p.comments && Object.values(p.comments).map((c: any) => (
                                   <div key={c.id} className="flex gap-3 mb-4">
                                     <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-[10px] text-white font-black shrink-0">
                                       {c.userName[0].toUpperCase()}
                                     </div>
                                     <div className="flex-1 bg-[var(--bg-main)]/50 p-3 rounded-2xl border border-[var(--border-color)]">
                                       <div className="flex justify-between items-center mb-1">
                                         <span className="text-xs font-black text-[var(--text-main)]">{c.userName}</span>
                                         <span className="text-[8px] text-slate-500">{new Date(c.timestamp).toLocaleTimeString('ar-EG')}</span>
                                       </div>
                                       <p className="text-xs text-[var(--text-sub)]">{c.text}</p>
                                     </div>
                                   </div>
                                 ))}
                                 {commentCount === 0 && <p className="text-xs text-slate-500 italic text-center py-2">كن أول من يضيف همسة لهذا الحكواتي...</p>}
                               </div>

                               <form onSubmit={(e) => handleCommentSubmit(e, p.id)} className="flex gap-2 items-center">
                                 <input 
                                  value={commentInput[p.id] || ''}
                                  onChange={(e) => setCommentInput(prev => ({ ...prev, [p.id]: e.target.value }))}
                                  placeholder="أضف تعليقك..." 
                                  className="flex-1 bg-[var(--bg-main)] border border-[var(--border-color)] p-3 rounded-xl text-xs text-[var(--text-main)] outline-none focus:border-sky-400 transition-all"
                                 />
                                 <button className="bg-sky-500 text-white w-10 h-10 rounded-xl hover:bg-rose-500 transition-all active:scale-90 flex items-center justify-center">
                                   <i className="fa-solid fa-paper-plane text-sm"></i>
                                 </button>
                               </form>
                             </div>
                           )}
                        </div>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        );
      case 'collab':
        return (
          <div className="py-12 md:py-20 max-w-5xl mx-auto px-4 fade-in-up">
            <h2 className="text-5xl md:text-7xl font-black mb-8 text-[var(--text-main)] tracking-tighter">رواق <span className="text-sky-400">التعاون</span></h2>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const f = e.target as any;
              const collab: CollabProject = { id: `collab-${Date.now()}`, title: f.title.value, description: f.desc.value, day1: f.day1.value, starter: user!.username, timestamp: new Date().toISOString(), status: 'active' };
              await createCollab(collab);
              syncAll();
              f.reset();
            }} className="mb-12 glass-morphism p-8 rounded-[2.5rem] space-y-4">
              <input name="title" placeholder="عنوان الملحمة الجماعية" className="w-full bg-[var(--bg-secondary)] p-5 rounded-2xl text-[var(--text-main)] border border-[var(--border-color)] outline-none focus:border-sky-400 font-bold" />
              <textarea name="day1" placeholder="ابدأ الفصل الأول من هنا..." className="w-full bg-[var(--bg-secondary)] p-5 rounded-2xl text-[var(--text-main)] border border-[var(--border-color)] outline-none focus:border-sky-400 h-32" />
              <button className="bg-sky-500 hover:bg-sky-400 text-black px-10 py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95">تأسيس المخطوطة</button>
            </form>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {collabs.map(c => (
                <div key={c.id} className="glass-morphism p-8 rounded-[3rem] group hover:border-sky-500/50 transition-all">
                  <div className="flex justify-between mb-6">
                    <span className="text-[10px] font-black text-sky-400 uppercase tracking-widest">المؤسس: {c.starter}</span>
                    <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${c.status === 'completed' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-sky-500/20 text-sky-400'}`}>{c.status === 'completed' ? 'مكتملة' : 'قيد النسج'}</span>
                  </div>
                  <h3 className="text-2xl font-black mb-4 text-[var(--text-main)] group-hover:text-sky-400 transition-colors">{c.title}</h3>
                  <div className="space-y-3 mb-10 border-t border-[var(--border-color)] pt-6">
                     <div className="flex items-center gap-3 text-[var(--text-sub)] font-bold text-xs"><i className="fa-solid fa-check-circle text-emerald-500"></i> {c.starter}</div>
                     <div className="flex items-center gap-3 text-[var(--text-sub)] font-bold text-xs">{c.day2 ? <i className="fa-solid fa-check-circle text-emerald-500"></i> : <i className="fa-regular fa-circle opacity-30"></i>} {c.day2Author || 'شاغر (الفصل 2)'}</div>
                     <div className="flex items-center gap-3 text-[var(--text-sub)] font-bold text-xs">{c.day3 ? <i className="fa-solid fa-check-circle text-emerald-500"></i> : <i className="fa-regular fa-circle opacity-30"></i>} {c.day3Author || 'شاغر (الفصل 3)'}</div>
                  </div>
                  {c.status !== 'completed' && (
                    <button 
                      onClick={async () => {
                        const part = c.day2 ? 3 : 2;
                        const text = prompt(`أضف الفصل ${part === 2 ? 'الثاني' : 'الثالث'} لهذه الحكاية:`);
                        if (!text || !user) return;
                        await updateCollab(c.id, part === 2 ? { day2: text, day2Author: user.username } : { day3: text, day3Author: user.username, status: 'completed' });
                        syncAll();
                      }}
                      className="w-full bg-[var(--bg-main)] hover:bg-sky-500 hover:text-black py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all"
                    >أضف بصمتك الروائية</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      case 'messages':
        return (
          <div className="py-12 md:py-20 max-w-6xl mx-auto px-4 fade-in-up h-[calc(100vh-160px)] flex flex-col">
            <h2 className="text-5xl md:text-7xl font-black mb-8 text-[var(--text-main)] tracking-tighter">بريد <span className="text-indigo-400">الهمسات</span></h2>
            <div className="flex-1 glass-morphism rounded-[3rem] flex overflow-hidden shadow-2xl">
               <div className="w-1/3 border-l border-[var(--border-color)] p-6 space-y-4 overflow-y-auto hidden md:block">
                 {allUsers.map(u => (
                   <button key={u.username} onClick={() => setSelectedChatUser(u.username)} className={`w-full p-5 rounded-2xl text-right transition-all flex items-center justify-between group ${selectedChatUser === u.username ? 'bg-indigo-600 text-white shadow-xl' : 'hover:bg-[var(--border-color)] text-[var(--text-sub)]'}`}>
                     <i className={`fa-solid fa-circle text-[8px] ${selectedChatUser === u.username ? 'text-white' : 'text-emerald-500'}`}></i>
                     <span className="font-bold text-sm">{u.username}</span>
                   </button>
                 ))}
               </div>
               <div className="flex-1 flex flex-col bg-[var(--bg-secondary)]/30">
                 {selectedChatUser ? (
                   <>
                     <div className="p-6 border-b border-[var(--border-color)] flex items-center justify-between">
                       <span className="text-sm font-bold text-[var(--text-main)]">محادثة مع: {selectedChatUser}</span>
                       <button onClick={()=>setSelectedChatUser(null)} className="md:hidden"><i className="fa-solid fa-arrow-left"></i></button>
                     </div>
                     <div className="flex-1 overflow-y-auto p-8 space-y-6 flex flex-col">
                       {messages.filter(m => (m.sender === selectedChatUser && m.receiver === user?.username) || (m.sender === user?.username && m.receiver === selectedChatUser)).map(m => (
                         <div key={m.id} className={`max-w-[75%] p-5 rounded-[1.5rem] text-sm font-medium ${m.sender === user?.username ? 'self-start bg-indigo-600 text-white rounded-tr-none' : 'self-end bg-[var(--bg-main)] text-[var(--text-main)] rounded-tl-none border border-[var(--border-color)] shadow-lg'}`}>
                           {m.text}
                           <span className="block text-[8px] mt-2 opacity-50 text-left">{new Date(m.timestamp).toLocaleTimeString('ar-EG')}</span>
                         </div>
                       ))}
                     </div>
                     <form onSubmit={handleSendMessage} className="p-6 border-t border-[var(--border-color)] flex gap-4">
                       <input value={messageInput} onChange={e => setMessageInput(e.target.value)} placeholder="اكتب همستك..." className="flex-1 bg-[var(--bg-main)] border border-[var(--border-color)] p-5 rounded-2xl text-[var(--text-main)] outline-none focus:border-indigo-400" />
                       <button className="bg-indigo-600 text-white w-14 rounded-2xl transition-all shadow-lg active:scale-95"><i className="fa-solid fa-paper-plane"></i></button>
                     </form>
                   </>
                 ) : (
                   <div className="flex-1 flex flex-col items-center justify-center opacity-30 p-12">
                     <i className="fa-solid fa-envelope-open-text text-8xl mb-8 float text-indigo-500"></i>
                     <p className="text-2xl font-black text-[var(--text-main)]">اختر كاتباً من القائمة لبدء تبادل الهمسات.</p>
                   </div>
                 )}
               </div>
            </div>
          </div>
        );
      default:
        const filtered = stories.filter(s => filter === 'ai' ? !s.isUserStory : filter === 'community' ? s.isUserStory : true);
        return (
          <>
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-10 pt-10">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 bg-rose-600 rounded-full animate-ping"></span>
                  <span className="text-[10px] font-black text-sky-400 uppercase tracking-[0.4em]">ملاحم يومية متجددة</span>
                </div>
                <h2 className="text-6xl md:text-8xl font-black tracking-tighter text-[var(--text-main)]">الـ <span className="text-indigo-600">رواق</span></h2>
                <div className="flex gap-2 p-2 glass-morphism w-fit rounded-2xl">
                  {(['all', 'ai', 'community'] as const).map(f => (
                    <button key={f} onClick={() => setFilter(f)} className={`text-[10px] font-black transition-all px-8 py-3 rounded-xl uppercase tracking-widest ${filter === f ? 'bg-indigo-600 text-white shadow-lg' : 'text-[var(--text-sub)] hover:text-[var(--text-main)]'}`}>
                      {filterMap[f]}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={() => setShowForm(true)} className="bg-rose-600 text-white font-black px-12 py-5 rounded-3xl hover:bg-rose-500 transition-all text-sm flex items-center gap-4 shadow-xl active:scale-95">
                <span>نشر ملحمتك</span>
                <i className="fa-solid fa-feather-pointed"></i>
              </button>
            </div>

            {isGeneratingAI && (
              <div className="mb-12 glass-morphism p-12 rounded-[3.5rem] animate-pulse flex flex-col items-center justify-center text-center">
                 <div className="w-14 h-14 border-4 border-t-rose-600 border-indigo-600 rounded-full animate-spin mb-6"></div>
                 <h4 className="text-2xl font-black text-indigo-500 mb-2">حكواتي الذكاء ينسج عوالم جديدة...</h4>
                 <p className="text-[11px] font-bold text-[var(--text-sub)] uppercase tracking-widest italic">يرجى الانتظار، جاري استحضار 10 روايات جديدة</p>
              </div>
            )}

            {showForm && <StoryForm onAdd={async (ns)=>{ ns.authorName = user?.username; await saveStoriesToDb([ns]); syncAll(); setShowForm(false); }} onCancel={() => setShowForm(false)} />}
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-16 mobile-grid">
              {loading ? <><SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard /></> : (
                filtered.map((story, index) => (
                  <React.Fragment key={story.id}>
                    {/* Loopy Ads in Story Feed: Every 3 stories */}
                    {index > 0 && index % 3 === 0 && <div className="col-span-full"><AdPlaceholder /></div>}
                    <StoryCard story={story} userName={user?.username || 'زائر'} onReadFull={() => setSelectedStory(story)} />
                  </React.Fragment>
                ))
              )}
            </div>
          </>
        );
    }
  };

  if (showSplash) return <SplashScreen />;
  if (!user) return <HelloPage onStart={handleAuth} />;

  return (
    <div className="min-h-screen pb-32 text-right selection:bg-rose-600 selection:text-white">
      <Header onShowDev={() => setShowDev(true)} activeTab={activeTab} onTabChange={setActiveTab} />
      {showDev && <DeveloperInfo onClose={() => setShowDev(false)} />}
      <Sidebar userName={user.username} activeTab={activeTab} onTabChange={setActiveTab} userPoints={user.points} />
      
      <button onClick={()=>setTheme(theme==='dark'?'light':'dark')} className="fixed top-6 left-6 z-[100] p-4 rounded-2xl glass-morphism hover:bg-[var(--border-color)] transition-all text-sky-400 shadow-2xl active:scale-90">
        {theme === 'dark' ? <i className="fa-solid fa-sun text-xl"></i> : <i className="fa-solid fa-moon text-xl"></i>}
      </button>

      <main className="max-w-7xl mx-auto px-6 xl:mr-80">
        {renderContent()}
      </main>

      {/* Mobile Footer Nav */}
      <nav className="xl:hidden fixed bottom-0 left-0 right-0 glass-morphism border-t border-[var(--border-color)] flex justify-around items-center py-4 px-6 z-[110] shadow-[0_-10px_40px_rgba(0,0,0,0.3)]">
        {[
          {id:'feed', icon:'fa-house'},
          {id:'forum', icon:'fa-comments'},
          {id:'collab', icon:'fa-hands-holding-circle'},
          {id:'messages', icon:'fa-envelope'}
        ].map(item => (
          <button key={item.id} onClick={()=>setActiveTab(item.id)} className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${activeTab === item.id ? 'bg-indigo-600 text-white scale-110 shadow-lg' : 'text-slate-500 hover:text-indigo-400'}`}>
            <i className={`fa-solid ${item.icon} text-xl`}></i>
          </button>
        ))}
      </nav>

      {selectedStory && <FullStoryView story={selectedStory} userName={user.username} onClose={() => setSelectedStory(null)} />}
      <Chat userName={user.username} />
    </div>
  );
};

export default App;