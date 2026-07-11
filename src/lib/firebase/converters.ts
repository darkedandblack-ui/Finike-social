import { Timestamp, type DocumentData, type DocumentSnapshot, type QueryDocumentSnapshot } from "firebase/firestore";
import type {
  UserProfile,
  Post,
  Comment,
  Event,
  Conversation,
  Message,
  Notification,
  Report,
  AdminAction,
} from "@/types";

function toDate(value: Timestamp | Date | undefined): Date {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  return value.toDate();
}

export function userProfileFromFirestore(
  snap: QueryDocumentSnapshot<DocumentData> | DocumentSnapshot<DocumentData>
): UserProfile {
  const data = snap.data();
  if (!data) {
    throw new Error("User profile document has no data");
  }
  return {
    id: snap.id,
    email: data.email ?? "",
    displayName: data.displayName ?? "",
    username: data.username ?? "",
    bio: data.bio,
    avatarUrl: data.avatarUrl,
    coverUrl: data.coverUrl,
    interests: data.interests ?? [],
    location: data.location,
    role: data.role ?? "user",
    isBanned: data.isBanned ?? false,
    isSuspended: data.isSuspended ?? false,
    isOnboarded: data.isOnboarded ?? false,
    followersCount: data.followersCount ?? 0,
    followingCount: data.followingCount ?? 0,
    postsCount: data.postsCount ?? 0,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

export function postFromFirestore(
  snap: QueryDocumentSnapshot<DocumentData>
): Post {
  const data = snap.data();
  return {
    id: snap.id,
    authorId: data.authorId,
    authorName: data.authorName,
    authorAvatar: data.authorAvatar,
    content: data.content,
    imageUrl: data.imageUrl,
    category: data.category,
    likesCount: data.likesCount ?? 0,
    commentsCount: data.commentsCount ?? 0,
    isHidden: data.isHidden ?? false,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

export function commentFromFirestore(
  snap: QueryDocumentSnapshot<DocumentData>
): Comment {
  const data = snap.data();
  return {
    id: snap.id,
    postId: data.postId,
    authorId: data.authorId,
    authorName: data.authorName,
    authorAvatar: data.authorAvatar,
    content: data.content,
    createdAt: toDate(data.createdAt),
  };
}

export function eventFromFirestore(
  snap: QueryDocumentSnapshot<DocumentData>
): Event {
  const data = snap.data();
  return {
    id: snap.id,
    organizerId: data.organizerId,
    organizerName: data.organizerName,
    organizerAvatar: data.organizerAvatar,
    title: data.title,
    description: data.description,
    imageUrl: data.imageUrl,
    category: data.category,
    location: data.location,
    startDate: toDate(data.startDate),
    endDate: toDate(data.endDate),
    maxParticipants: data.maxParticipants,
    participantsCount: data.participantsCount ?? 0,
    waitlistCount: data.waitlistCount ?? 0,
    status: data.status ?? "upcoming",
    isHidden: data.isHidden ?? false,
    isApproved: data.isApproved ?? true,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

export function conversationFromFirestore(
  snap: QueryDocumentSnapshot<DocumentData>
): Conversation {
  const data = snap.data();
  return {
    id: snap.id,
    participantIds: data.participantIds ?? [],
    participantNames: data.participantNames ?? {},
    participantAvatars: data.participantAvatars ?? {},
    lastMessage: data.lastMessage,
    lastMessageAt: data.lastMessageAt ? toDate(data.lastMessageAt) : undefined,
    lastMessageSenderId: data.lastMessageSenderId,
    unreadCounts: data.unreadCounts ?? {},
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

export function messageFromFirestore(
  snap: QueryDocumentSnapshot<DocumentData>
): Message {
  const data = snap.data();
  return {
    id: snap.id,
    conversationId: data.conversationId,
    senderId: data.senderId,
    senderName: data.senderName,
    content: data.content,
    isRead: data.isRead ?? false,
    createdAt: toDate(data.createdAt),
  };
}

export function notificationFromFirestore(
  snap: QueryDocumentSnapshot<DocumentData>
): Notification {
  const data = snap.data();
  return {
    id: snap.id,
    userId: data.userId,
    type: data.type,
    title: data.title,
    body: data.body,
    link: data.link,
    actorId: data.actorId,
    actorName: data.actorName,
    isRead: data.isRead ?? false,
    createdAt: toDate(data.createdAt),
  };
}

export function reportFromFirestore(
  snap: QueryDocumentSnapshot<DocumentData>
): Report {
  const data = snap.data();
  return {
    id: snap.id,
    reporterId: data.reporterId,
    reporterName: data.reporterName,
    type: data.type,
    targetId: data.targetId,
    reason: data.reason,
    description: data.description,
    status: data.status ?? "pending",
    resolvedBy: data.resolvedBy,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

export function adminActionFromFirestore(
  snap: QueryDocumentSnapshot<DocumentData>
): AdminAction {
  const data = snap.data();
  return {
    id: snap.id,
    adminId: data.adminId,
    adminName: data.adminName,
    action: data.action,
    targetType: data.targetType,
    targetId: data.targetId,
    details: data.details,
    createdAt: toDate(data.createdAt),
  };
}

export { Timestamp };
