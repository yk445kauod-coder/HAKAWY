
import { Story, User, ForumPost, CollabProject, Message, Comment } from "../types";
import { db, ref, set, get, update, child } from "./firebase";
import { push } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const STORIES_PATH = 'hekayat_misr/stories';
const USERS_PATH = 'hekayat_misr/users';
const FORUM_PATH = 'hekayat_misr/forum';
const COLLAB_PATH = 'hekayat_misr/collabs';
const MESSAGES_PATH = 'hekayat_misr/messages';

export const saveStoriesToDb = async (stories: Story[]) => {
  try {
    const storiesRef = ref(db, STORIES_PATH);
    const updates: Record<string, any> = {};
    stories.forEach(story => {
      updates[story.id] = story;
    });
    await update(storiesRef, updates);
  } catch (e) {
    console.warn("Firebase save failed", e);
  }
};

export const loadStoriesFromDb = async (): Promise<Story[]> => {
  try {
    const storiesRef = ref(db, STORIES_PATH);
    const snapshot = await get(storiesRef);
    const val = snapshot.val();
    if (!val) return [];
    return Object.values(val) as Story[];
  } catch (e) {
    return [];
  }
};

export const getActiveStories = (allStories: Story[]): Story[] => {
  const now = new Date();
  return allStories.filter(story => {
    if (story.isUserStory) return true;
    const start = new Date(story.startDate);
    const diffTime = Math.abs(now.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  });
};

export const registerUser = async (user: User) => {
  const userRef = ref(db, `${USERS_PATH}/${user.username}`);
  const snap = await get(userRef);
  if (snap.exists()) throw new Error("المستخدم موجود بالفعل");
  await set(userRef, user);
};

export const loginUser = async (username: string, password: string): Promise<User> => {
  const userRef = ref(db, `${USERS_PATH}/${username}`);
  const snap = await get(userRef);
  if (!snap.exists()) throw new Error("المستخدم غير موجود");
  const userData = snap.val() as User;
  if (userData.password !== password) throw new Error("كلمة المرور غير صحيحة");
  return userData;
};

export const getAllUsers = async (): Promise<User[]> => {
  const snap = await get(ref(db, USERS_PATH));
  if (!snap.exists()) return [];
  return Object.values(snap.val()) as User[];
};

export const postToForum = async (post: ForumPost) => {
  await set(ref(db, `${FORUM_PATH}/${post.id}`), post);
};

export const likeForumPost = async (postId: string) => {
  const postRef = ref(db, `${FORUM_PATH}/${postId}`);
  const snap = await get(postRef);
  if (snap.exists()) {
    const current = snap.val() as ForumPost;
    await update(postRef, { likes: (current.likes || 0) + 1 });
  }
};

export const repostForumPost = async (postId: string) => {
  const postRef = ref(db, `${FORUM_PATH}/${postId}`);
  const snap = await get(postRef);
  if (snap.exists()) {
    const current = snap.val() as ForumPost;
    await update(postRef, { reposts: (current.reposts || 0) + 1 });
  }
};

export const addForumComment = async (postId: string, comment: Comment) => {
  const commentsRef = ref(db, `${FORUM_PATH}/${postId}/comments`);
  const newCommentRef = push(commentsRef);
  const commentWithId = { ...comment, id: newCommentRef.key };
  await set(newCommentRef, commentWithId);
};

export const loadForumPosts = async (): Promise<ForumPost[]> => {
  const snap = await get(ref(db, FORUM_PATH));
  if (!snap.exists()) return [];
  return Object.values(snap.val()) as ForumPost[];
};

export const createCollab = async (collab: CollabProject) => {
  await set(ref(db, `${COLLAB_PATH}/${collab.id}`), collab);
};

export const loadCollabs = async (): Promise<CollabProject[]> => {
  const snap = await get(ref(db, COLLAB_PATH));
  if (!snap.exists()) return [];
  return Object.values(snap.val()) as CollabProject[];
};

export const updateCollab = async (id: string, updates: Partial<CollabProject>) => {
  await update(ref(db, `${COLLAB_PATH}/${id}`), updates);
};

export const sendMessagePrivate = async (msg: Message) => {
  await set(ref(db, `${MESSAGES_PATH}/${msg.id}`), msg);
};

export const loadMessagesForUser = async (username: string): Promise<Message[]> => {
  const snap = await get(ref(db, MESSAGES_PATH));
  if (!snap.exists()) return [];
  const allMsgs = Object.values(snap.val()) as Message[];
  return allMsgs.filter(m => m.sender === username || m.receiver === username);
};

export const recordShareInDb = async (storyId: string) => {
  try {
    const storyRef = ref(db, `${STORIES_PATH}/${storyId}`);
    const snapshot = await get(storyRef);
    const s = snapshot.val();
    if (s) {
      const currentShares = s.share_count || 0;
      await update(storyRef, { share_count: currentShares + 1 });
    }
  } catch (e) {}
};

export const updateStoryRatingInDb = async (storyId: string, rating: number) => {
  try {
    const storyRef = ref(db, `${STORIES_PATH}/${storyId}`);
    const snapshot = await get(storyRef);
    const s = snapshot.val() as Story;
    if (s) {
      const currentCount = s.user_ratings_count || 0;
      const currentAvg = s.average_rating || 0;
      const newCount = currentCount + 1;
      const newAvg = ((currentAvg * currentCount) + rating) / newCount;
      await update(storyRef, { average_rating: Number(newAvg.toFixed(1)), user_ratings_count: newCount });
    }
  } catch (e) {}
  return await loadStoriesFromDb();
};

export const getStoryDay = (startDate: string): number => {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diffTime = now.getTime() - start.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return Math.min(Math.max(diffDays, 1), 3);
};
