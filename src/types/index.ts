import type { Timestamp } from "firebase/firestore";

export type UserRole = "user" | "admin" | "moderator";

export type EventStatus = "upcoming" | "ongoing" | "completed" | "cancelled";

export type ReportType = "post" | "comment" | "user" | "message" | "event";

export type ReportStatus = "pending" | "resolved" | "dismissed";

export type NotificationType =
  | "like"
  | "comment"
  | "message"
  | "event_join"
  | "event_created"
  | "event_reminder"
  | "follow"
  | "system";

export interface GeoLocation {
  lat: number;
  lng: number;
  city: string;
  address?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  username: string;
  bio?: string;
  avatarUrl?: string;
  coverUrl?: string;
  interests: string[];
  location?: GeoLocation;
  role: UserRole;
  isBanned: boolean;
  isSuspended: boolean;
  isOnboarded: boolean;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  imageUrl?: string;
  category: string;
  likesCount: number;
  commentsCount: number;
  isHidden: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  createdAt: Date;
}

export interface Like {
  id: string;
  postId: string;
  userId: string;
  createdAt: Date;
}

export interface Event {
  id: string;
  organizerId: string;
  organizerName: string;
  organizerAvatar?: string;
  title: string;
  description: string;
  imageUrl?: string;
  category: string;
  location: GeoLocation;
  startDate: Date;
  endDate: Date;
  maxParticipants: number;
  participantsCount: number;
  waitlistCount: number;
  status: EventStatus;
  isHidden: boolean;
  isApproved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface EventParticipant {
  id: string;
  eventId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  status: "joined" | "waitlisted";
  joinedAt: Date;
}

export interface Conversation {
  id: string;
  participantIds: string[];
  participantNames: Record<string, string>;
  participantAvatars: Record<string, string>;
  lastMessage?: string;
  lastMessageAt?: Date;
  lastMessageSenderId?: string;
  unreadCounts: Record<string, number>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  isRead: boolean;
  createdAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
  actorId?: string;
  actorName?: string;
  isRead: boolean;
  createdAt: Date;
}

export interface Report {
  id: string;
  reporterId: string;
  reporterName: string;
  type: ReportType;
  targetId: string;
  reason: string;
  description?: string;
  status: ReportStatus;
  resolvedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminAction {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  targetType: string;
  targetId: string;
  details?: string;
  createdAt: Date;
}

export interface Block {
  id: string;
  blockerId: string;
  blockedId: string;
  createdAt: Date;
}

export type FirestoreTimestamp = Timestamp;

export interface FeedItem {
  type: "post" | "event";
  data: Post | Event;
  sortDate: Date;
}
