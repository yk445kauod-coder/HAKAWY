
export type StoryGenre = 'Drama' | 'Horror' | 'Love';

export interface User {
  username: string;
  password?: string;
  points: number;
  level: string;
  bio: string;
  badges: string[];
}

export interface Story {
  id: string;
  title: string;
  genre: StoryGenre;
  category: string;
  characters: string[];
  day1: string;
  day2: string;
  day3: string;
  summary: string;
  startDate: string;
  average_rating: number | null;
  user_ratings_count: number;
  isUserStory?: boolean;
  coverImage?: string;
  remixOf?: string;
  authorName?: string;
}

export interface ForumPost {
  id: string;
  author: string;
  title: string;
  content: string;
  timestamp: string;
  likes: number;
  reposts: number;
  comments?: Record<string, Comment>;
  tags: string[];
}

export interface CollabProject {
  id: string;
  title: string;
  starter: string;
  description: string;
  day1: string;
  day2?: string;
  day3?: string;
  day2Author?: string;
  day3Author?: string;
  status: 'active' | 'completed';
  timestamp: string;
}

export interface Message {
  id: string;
  sender: string;
  receiver: string;
  text: string;
  timestamp: string;
  isRead: boolean;
}

export interface ChatMessage {
  id: string;
  userName: string;
  text: string;
  timestamp: string;
}

export interface Comment {
  id: string;
  userName: string;
  text: string;
  timestamp: string;
}
