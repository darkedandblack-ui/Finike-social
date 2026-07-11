import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  increment,
  serverTimestamp,
  onSnapshot,
  writeBatch,
  type QueryDocumentSnapshot,
  type DocumentData,
} from "firebase/firestore";
import { getFirebaseDb } from "./config";
import {
  postFromFirestore,
  commentFromFirestore,
  eventFromFirestore,
  conversationFromFirestore,
  messageFromFirestore,
  notificationFromFirestore,
  reportFromFirestore,
  userProfileFromFirestore,
  adminActionFromFirestore,
  Timestamp,
} from "./converters";
import type {
  Post,
  Comment,
  Event,
  Conversation,
  Message,
  Notification,
  Report,
  UserProfile,
  FeedItem,
} from "@/types";
import { getEventStatus } from "@/lib/utils";

const db = () => getFirebaseDb();

// ─── Posts ───────────────────────────────────────────────────────────────────

export async function createPost(data: {
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  imageUrl?: string;
  category: string;
}): Promise<string> {
  const docRef = await addDoc(collection(db(), "posts"), {
    ...data,
    likesCount: 0,
    commentsCount: 0,
    isHidden: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  await updateDoc(doc(db(), "users", data.authorId), {
    postsCount: increment(1),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getPosts(
  category?: string,
  pageSize = 10,
  lastDoc?: QueryDocumentSnapshot<DocumentData>
): Promise<{ posts: Post[]; lastDoc: QueryDocumentSnapshot<DocumentData> | null }> {
  let q = query(
    collection(db(), "posts"),
    where("isHidden", "==", false),
    orderBy("createdAt", "desc"),
    limit(pageSize)
  );
  if (category && category !== "Tümü") {
    q = query(
      collection(db(), "posts"),
      where("isHidden", "==", false),
      where("category", "==", category),
      orderBy("createdAt", "desc"),
      limit(pageSize)
    );
  }
  if (lastDoc) {
    q = query(q, startAfter(lastDoc));
  }
  const snap = await getDocs(q);
  const posts = snap.docs.map(postFromFirestore);
  const newLastDoc = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null;
  return { posts, lastDoc: newLastDoc };
}

export async function getPost(postId: string): Promise<Post | null> {
  const snap = await getDoc(doc(db(), "posts", postId));
  if (!snap.exists()) return null;
  return postFromFirestore(snap);
}

export async function toggleLike(postId: string, userId: string): Promise<boolean> {
  console.log("=== TOGGLE LIKE START ===");
  console.log("Post ID:", postId);
  console.log("User ID:", userId);
  const likeId = `${postId}_${userId}`;
  const likeRef = doc(db(), "likes", likeId);
  const likeSnap = await getDoc(likeRef);
  const postRef = doc(db(), "posts", postId);
  console.log("Like exists:", likeSnap.exists());

  try {
    if (likeSnap.exists()) {
      console.log("Removing like...");
      await deleteDoc(likeRef);
      console.log("Like document deleted");
      try {
        await updateDoc(postRef, { likesCount: increment(-1) });
        console.log("LikesCount decremented");
      } catch (updateError) {
        const errorCode = (updateError as { code?: string })?.code;
        console.error("=== DECREMENT LIKE COUNT ERROR ===");
        console.error("Error Code:", errorCode);
        console.error("Full Error:", updateError);
        console.error("==================================");
        throw updateError;
      }
      return false;
    }
    console.log("Adding like...");
    const { setDoc } = await import("firebase/firestore");
    await setDoc(likeRef, {
      postId,
      userId,
      createdAt: serverTimestamp(),
    });
    console.log("Like document created");
    try {
      await updateDoc(postRef, { likesCount: increment(1) });
      console.log("LikesCount incremented");
    } catch (updateError) {
      const errorCode = (updateError as { code?: string })?.code;
      console.error("=== INCREMENT LIKE COUNT ERROR ===");
      console.error("Error Code:", errorCode);
      console.error("Full Error:", updateError);
      console.error("==================================");
      throw updateError;
    }
    return true;
  } catch (error) {
    const errorCode = (error as { code?: string })?.code;
    const errorMessage = (error as { message?: string })?.message;
    console.error("=== TOGGLE LIKE ERROR ===");
    console.error("Error Code:", errorCode);
    console.error("Error Message:", errorMessage);
    console.error("Full Error:", error);
    console.error("========================");
    throw error;
  }
}

export async function isPostLiked(postId: string, userId: string): Promise<boolean> {
  const q = query(
    collection(db(), "likes"),
    where("postId", "==", postId),
    where("userId", "==", userId),
    limit(1)
  );
  const snap = await getDocs(q);
  return !snap.empty;
}

export async function getComments(postId: string): Promise<Comment[]> {
  const q = query(
    collection(db(), "comments"),
    where("postId", "==", postId),
    orderBy("createdAt", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map(commentFromFirestore);
}

export async function addComment(data: {
  postId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
}): Promise<string> {
  const docRef = await addDoc(collection(db(), "comments"), {
    ...data,
    createdAt: serverTimestamp(),
  });
  await updateDoc(doc(db(), "posts", data.postId), {
    commentsCount: increment(1),
  });
  return docRef.id;
}

export async function deleteComment(commentId: string, postId: string): Promise<void> {
  await deleteDoc(doc(db(), "comments", commentId));
  await updateDoc(doc(db(), "posts", postId), {
    commentsCount: increment(-1),
  });
}

// ─── Events ──────────────────────────────────────────────────────────────────

export async function createEvent(data: Omit<Event, "id" | "createdAt" | "updatedAt" | "participantsCount" | "waitlistCount" | "status" | "isHidden" | "isApproved">): Promise<string> {
  const docRef = await addDoc(collection(db(), "events"), {
    ...data,
    participantsCount: 0,
    waitlistCount: 0,
    status: "upcoming",
    isHidden: false,
    isApproved: false,
    startDate: Timestamp.fromDate(data.startDate),
    endDate: Timestamp.fromDate(data.endDate),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
}

// ─── Etkinlik onay sistemi (admin/moderatör) ──────────────────────────────

export async function getPendingEvents(): Promise<Event[]> {
  const q = query(
    collection(db(), "events"),
    where("isApproved", "==", false),
    where("isHidden", "==", false),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map(eventFromFirestore);
}

export async function approveEvent(eventId: string): Promise<void> {
  const eventRef = doc(db(), "events", eventId);
  const eventSnap = await getDoc(eventRef);
  if (!eventSnap.exists()) return;
  const event = eventFromFirestore(eventSnap);

  await updateDoc(eventRef, {
    isApproved: true,
    updatedAt: serverTimestamp(),
  });

  notifyFollowersOfNewEvent({
    eventId,
    organizerId: event.organizerId,
    organizerName: event.organizerName,
    organizerAvatar: event.organizerAvatar,
    title: event.title,
  }).catch((err) => console.error("Follower notification failed:", err));
}

export async function rejectEvent(eventId: string): Promise<void> {
  await updateDoc(doc(db(), "events", eventId), {
    isHidden: true,
    updatedAt: serverTimestamp(),
  });
}

export async function getEvents(pageSize = 10): Promise<Event[]> {
  const q = query(
    collection(db(), "events"),
    where("isHidden", "==", false),
    orderBy("startDate", "asc"),
    limit(pageSize)
  );
  const snap = await getDocs(q);
  return snap.docs.map(eventFromFirestore).filter((e) => e.isApproved);
}

export async function getNearbyEvents(
  lat: number,
  lng: number,
  radiusKm = 50
): Promise<Event[]> {
  const allEvents = await getEvents(50);
  return allEvents.filter((event) => {
    const dist = Math.sqrt(
      Math.pow(event.location.lat - lat, 2) + Math.pow(event.location.lng - lng, 2)
    ) * 111;
    return dist <= radiusKm;
  });
}

export async function getEvent(eventId: string): Promise<Event | null> {
  const snap = await getDoc(doc(db(), "events", eventId));
  if (!snap.exists()) return null;
  return eventFromFirestore(snap);
}

export async function joinEvent(
  eventId: string,
  userId: string,
  userName: string,
  userAvatar?: string
): Promise<"joined" | "waitlisted" | "already_joined"> {
  const participantId = `${eventId}_${userId}`;
  const participantRef = doc(db(), "eventParticipants", participantId);
  const existing = await getDoc(participantRef);
  if (existing.exists()) return "already_joined";

  const eventRef = doc(db(), "events", eventId);
  const eventSnap = await getDoc(eventRef);
  if (!eventSnap.exists()) throw new Error("Etkinlik bulunamadı");

  const event = eventFromFirestore(eventSnap);
  const isFull = event.participantsCount >= event.maxParticipants;
  const status = isFull ? "waitlisted" : "joined";

  await setParticipant(participantRef, {
    eventId,
    userId,
    userName,
    userAvatar,
    status,
  });

  await updateDoc(eventRef, {
    participantsCount: increment(status === "joined" ? 1 : 0),
    waitlistCount: increment(status === "waitlisted" ? 1 : 0),
    updatedAt: serverTimestamp(),
  });

  // Etkinlik sahibine bildirim gönder (kendi etkinliğine katılmadıysa)
  if (event.organizerId !== userId) {
    try {
      await createNotification({
        userId: event.organizerId,
        type: "event_join",
        title:
          status === "joined" ? "Yeni Katılımcı! 🦁" : "Bekleme Listesine Katılım",
        body:
          status === "joined"
            ? `${userName}, "${event.title}" etkinliğinize katıldı. Hadi aslanım!`
            : `${userName}, "${event.title}" etkinliğinizin bekleme listesine katıldı.`,
        link: `/events/${eventId}`,
        actorId: userId,
        actorName: userName,
      });
    } catch (err) {
      console.error("Event join notification failed:", err);
    }
  }

  return status;
}

async function setParticipant(
  ref: ReturnType<typeof doc>,
  data: {
    eventId: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    status: "joined" | "waitlisted";
  }
) {
  const { setDoc } = await import("firebase/firestore");
  await setDoc(ref, {
    ...data,
    joinedAt: serverTimestamp(),
  });
}

export async function getEventParticipants(eventId: string) {
  const q = query(
    collection(db(), "eventParticipants"),
    where("eventId", "==", eventId),
    where("status", "==", "joined")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function isEventParticipant(eventId: string, userId: string): Promise<boolean> {
  const participantId = `${eventId}_${userId}`;
  const participantRef = doc(db(), "eventParticipants", participantId);
  const participantSnap = await getDoc(participantRef);
  return participantSnap.exists();
}

export async function leaveEvent(eventId: string, userId: string): Promise<void> {
  console.log("=== LEAVE EVENT START ===");
  console.log("Event ID:", eventId);
  console.log("User ID:", userId);
  const participantId = `${eventId}_${userId}`;
  const participantRef = doc(db(), "eventParticipants", participantId);

  try {
    const participantSnap = await getDoc(participantRef);
    if (!participantSnap.exists()) {
      console.log("Participant not found");
      return;
    }

    const status = participantSnap.data().status;
    await deleteDoc(participantRef);
    console.log("Participant document deleted");

    const eventRef = doc(db(), "events", eventId);
    if (status === "joined") {
      await updateDoc(eventRef, { participantsCount: increment(-1) });
      console.log("Event participantsCount decremented");
    } else if (status === "waitlisted") {
      await updateDoc(eventRef, { waitlistCount: increment(-1) });
      console.log("Event waitlistCount decremented");
    }
  } catch (error) {
    const errorCode = (error as { code?: string })?.code;
    const errorMessage = (error as { message?: string })?.message;
    console.error("=== LEAVE EVENT ERROR ===");
    console.error("Error Code:", errorCode);
    console.error("Error Message:", errorMessage);
    console.error("Full Error:", error);
    console.error("========================");
    throw error;
  }
}

// ─── Follow System ─────────────────────────────────────────────────────────────

export async function toggleFollow(
  followerId: string,
  followingId: string
): Promise<boolean> {
  console.log("=== TOGGLE FOLLOW START ===");
  console.log("Follower ID:", followerId);
  console.log("Following ID:", followingId);
  const followId = `${followerId}_${followingId}`;
  const followRef = doc(db(), "follows", followId);
  const followSnap = await getDoc(followRef);

  try {
    if (followSnap.exists()) {
      console.log("Removing follow...");
      await deleteDoc(followRef);
      console.log("Follow document deleted");

      // Decrement follower's following count
      const followerRef = doc(db(), "users", followerId);
      await updateDoc(followerRef, { followingCount: increment(-1) });
      console.log("Follower's followingCount decremented");

      // Decrement following's followers count
      const followingRef = doc(db(), "users", followingId);
      await updateDoc(followingRef, { followersCount: increment(-1) });
      console.log("Following's followersCount decremented");

      return false;
    }

    console.log("Adding follow...");
    const { setDoc } = await import("firebase/firestore");
    await setDoc(followRef, {
      followerId,
      followingId,
      createdAt: serverTimestamp(),
    });
    console.log("Follow document created");

    // Increment follower's following count
    const followerRef = doc(db(), "users", followerId);
    await updateDoc(followerRef, { followingCount: increment(1) });
    console.log("Follower's followingCount incremented");

    // Increment following's followers count
    const followingRef = doc(db(), "users", followingId);
    await updateDoc(followingRef, { followersCount: increment(1) });
    console.log("Following's followersCount incremented");

    return true;
  } catch (error) {
    const errorCode = (error as { code?: string })?.code;
    const errorMessage = (error as { message?: string })?.message;
    console.error("=== TOGGLE FOLLOW ERROR ===");
    console.error("Error Code:", errorCode);
    console.error("Error Message:", errorMessage);
    console.error("Full Error:", error);
    console.error("========================");
    throw error;
  }
}

export async function isFollowing(
  followerId: string,
  followingId: string
): Promise<boolean> {
  const followId = `${followerId}_${followingId}`;
  const followRef = doc(db(), "follows", followId);
  const followSnap = await getDoc(followRef);
  return followSnap.exists();
}

export async function getFollowers(userId: string): Promise<string[]> {
  const q = query(
    collection(db(), "follows"),
    where("followingId", "==", userId)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data().followerId as string);
}

async function notifyFollowersOfNewEvent(data: {
  eventId: string;
  organizerId: string;
  organizerName: string;
  organizerAvatar?: string;
  title: string;
}): Promise<void> {
  const followers = await getFollowers(data.organizerId);
  const recipients = followers.filter((id) => id !== data.organizerId);
  if (recipients.length === 0) return;

  const blockChecks = await Promise.all(
    recipients.map(async (followerId) => ({
      followerId,
      blocked: await isUserBlocked(followerId, data.organizerId),
    }))
  );
  const notified = blockChecks.filter((c) => !c.blocked).map((c) => c.followerId);
  if (notified.length === 0) return;

  const notificationData = {
    type: "event_created" as const,
    title: "Yeni Etkinlik",
    body: `${data.organizerName} yeni bir etkinlik paylaştı: ${data.title}`,
    link: "/events/",
    actorId: data.organizerId,
    actorName: data.organizerName,
  };

  const batchSize = 500;
  for (let i = 0; i < notified.length; i += batchSize) {
    const chunk = notified.slice(i, i + batchSize);
    const batch = writeBatch(db());
    for (const userId of chunk) {
      const notifRef = doc(collection(db(), "notifications"));
      batch.set(notifRef, {
        ...notificationData,
        userId,
        isRead: false,
        createdAt: serverTimestamp(),
      });
    }
    await batch.commit();
  }
}

// Kullanıcı profilini canlı (real-time) dinle — takipçi/takip sayısı F5
// gerekmeden anında güncellenir.
export function subscribeToUserProfile(
  userId: string,
  callback: (profile: UserProfile | null) => void
) {
  const ref = doc(db(), "users", userId);
  return onSnapshot(
    ref,
    (snap) => {
      if (!snap.exists()) {
        callback(null);
        return;
      }
      callback(userProfileFromFirestore(snap));
    },
    (error) => {
      console.error("Profile subscription error:", error);
    }
  );
}

// ─── Messages ────────────────────────────────────────────────────────────────

export async function getOrCreateConversation(
  userId: string,
  otherUserId: string,
  userName: string,
  otherUserName: string,
  userAvatar?: string,
  otherUserAvatar?: string
): Promise<string> {
  console.log("=== GET OR CREATE CONVERSATION START ===");
  console.log("User ID:", userId);
  console.log("Other User ID:", otherUserId);
  console.log("User Name:", userName);
  console.log("Other User Name:", otherUserName);
  const participants = [userId, otherUserId].sort();
  const conversationId = participants.join("_");
  console.log("Conversation ID:", conversationId);
  const convRef = doc(db(), "conversations", conversationId);
  const convSnap = await getDoc(convRef);
  console.log("Conversation exists:", convSnap.exists());

  if (!convSnap.exists()) {
    console.log("Creating new conversation...");
    const { setDoc } = await import("firebase/firestore");
    try {
      await setDoc(convRef, {
        participantIds: participants,
        participantNames: {
          [userId]: userName,
          [otherUserId]: otherUserName,
        },
        participantAvatars: {
          [userId]: userAvatar ?? "",
          [otherUserId]: otherUserAvatar ?? "",
        },
        unreadCounts: { [userId]: 0, [otherUserId]: 0 },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      console.log("Conversation created successfully");
    } catch (error) {
      const errorCode = (error as { code?: string })?.code;
      const errorMessage = (error as { message?: string })?.message;
      console.error("=== CREATE CONVERSATION ERROR ===");
      console.error("Error Code:", errorCode);
      console.error("Error Message:", errorMessage);
      console.error("Full Error:", error);
      console.error("==================================");
      throw error;
    }
  } else {
    console.log("Conversation already exists");
  }
  console.log("=== GET OR CREATE CONVERSATION COMPLETE ===");
  return conversationId;
}

export async function getConversations(userId: string): Promise<Conversation[]> {
  const q = query(
    collection(db(), "conversations"),
    where("participantIds", "array-contains", userId),
    orderBy("updatedAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map(conversationFromFirestore);
}

export function subscribeToMessages(
  conversationId: string,
  callback: (messages: Message[]) => void,
  onError?: (error: Error) => void
) {
  const q = query(
    collection(db(), "messages"),
    where("conversationId", "==", conversationId),
    orderBy("createdAt", "asc")
  );
  return onSnapshot(
    q,
    (snap) => {
      callback(snap.docs.map(messageFromFirestore));
    },
    (error) => {
      console.error("Messages subscription error:", error);
      onError?.(error);
    }
  );
}

export async function sendMessage(data: {
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  recipientId: string;
}): Promise<string> {
  if (!data.recipientId) {
    throw new Error("Alıcı bulunamadı.");
  }

  const batch = writeBatch(db());
  const msgRef = doc(collection(db(), "messages"));

  batch.set(msgRef, {
    conversationId: data.conversationId,
    senderId: data.senderId,
    senderName: data.senderName,
    content: data.content,
    isRead: false,
    createdAt: serverTimestamp(),
  });

  const convRef = doc(db(), "conversations", data.conversationId);
  batch.update(convRef, {
    lastMessage: data.content,
    lastMessageAt: serverTimestamp(),
    lastMessageSenderId: data.senderId,
    [`unreadCounts.${data.recipientId}`]: increment(1),
    updatedAt: serverTimestamp(),
  });

  await batch.commit();

  if (data.recipientId !== data.senderId) {
    try {
      await createNotification({
        userId: data.recipientId,
        type: "message",
        title: "Yeni Mesaj",
        body: `${data.senderName}: ${data.content.slice(0, 80)}`,
        link: `/messages/chat?id=${data.conversationId}`,
        actorId: data.senderId,
        actorName: data.senderName,
      });
    } catch (err) {
      console.error("Notification failed:", err);
    }
  }

  return msgRef.id;
}

// ─── Notifications ───────────────────────────────────────────────────────────

export async function createNotification(data: Omit<Notification, "id" | "createdAt" | "isRead">): Promise<void> {
  await addDoc(collection(db(), "notifications"), {
    ...data,
    isRead: false,
    createdAt: serverTimestamp(),
  });
}

export async function getNotifications(userId: string): Promise<Notification[]> {
  const q = query(
    collection(db(), "notifications"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
    limit(50)
  );
  const snap = await getDocs(q);
  return snap.docs.map(notificationFromFirestore);
}

export function subscribeToNotifications(
  userId: string,
  callback: (notifications: Notification[]) => void
) {
  const q = query(
    collection(db(), "notifications"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
    limit(50)
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(notificationFromFirestore));
  });
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  await updateDoc(doc(db(), "notifications", notificationId), { isRead: true });
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  const notifications = await getNotifications(userId);
  const batch = writeBatch(db());
  notifications
    .filter((n) => !n.isRead)
    .forEach((n) => {
      batch.update(doc(db(), "notifications", n.id), { isRead: true });
    });
  await batch.commit();
}

// ─── Reports ─────────────────────────────────────────────────────────────────

export async function createReport(data: Omit<Report, "id" | "createdAt" | "updatedAt" | "status">): Promise<string> {
  const docRef = await addDoc(collection(db(), "reports"), {
    ...data,
    status: "pending",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getReports(status?: string): Promise<Report[]> {
  let q = query(collection(db(), "reports"), orderBy("createdAt", "desc"));
  if (status) {
    q = query(
      collection(db(), "reports"),
      where("status", "==", status),
      orderBy("createdAt", "desc")
    );
  }
  const snap = await getDocs(q);
  return snap.docs.map(reportFromFirestore);
}

// ─── Admin ───────────────────────────────────────────────────────────────────

export async function getAllUsers(): Promise<UserProfile[]> {
  const snap = await getDocs(collection(db(), "users"));
  return snap.docs.map(userProfileFromFirestore);
}

export async function banUser(userId: string, adminId: string, adminName: string): Promise<void> {
  await updateDoc(doc(db(), "users", userId), {
    isBanned: true,
    updatedAt: serverTimestamp(),
  });
  await logAdminAction({
    adminId,
    adminName,
    action: "ban_user",
    targetType: "user",
    targetId: userId,
  });
}

export async function suspendUser(userId: string, adminId: string, adminName: string): Promise<void> {
  await updateDoc(doc(db(), "users", userId), {
    isSuspended: true,
    updatedAt: serverTimestamp(),
  });
  await logAdminAction({
    adminId,
    adminName,
    action: "suspend_user",
    targetType: "user",
    targetId: userId,
  });
}

export async function hidePost(postId: string, adminId: string, adminName: string): Promise<void> {
  await updateDoc(doc(db(), "posts", postId), { isHidden: true });
  await logAdminAction({
    adminId,
    adminName,
    action: "hide_post",
    targetType: "post",
    targetId: postId,
  });
}

export async function hideEvent(eventId: string, adminId: string, adminName: string): Promise<void> {
  await updateDoc(doc(db(), "events", eventId), { isHidden: true });
  await logAdminAction({
    adminId,
    adminName,
    action: "hide_event",
    targetType: "event",
    targetId: eventId,
  });
}

export async function resolveReport(
  reportId: string,
  status: "resolved" | "dismissed",
  adminId: string
): Promise<void> {
  await updateDoc(doc(db(), "reports", reportId), {
    status,
    resolvedBy: adminId,
    updatedAt: serverTimestamp(),
  });
}

async function logAdminAction(data: {
  adminId: string;
  adminName: string;
  action: string;
  targetType: string;
  targetId: string;
  details?: string;
}): Promise<void> {
  await addDoc(collection(db(), "adminActions"), {
    ...data,
    createdAt: serverTimestamp(),
  });
}

export async function getAdminStats() {
  const [users, posts, events, reports] = await Promise.all([
    getDocs(collection(db(), "users")),
    getDocs(collection(db(), "posts")),
    getDocs(collection(db(), "events")),
    getDocs(query(collection(db(), "reports"), where("status", "==", "pending"))),
  ]);
  return {
    totalUsers: users.size,
    totalPosts: posts.size,
    totalEvents: events.size,
    pendingReports: reports.size,
  };
}

// Bir koleksiyondaki belgeleri 450'lik gruplar halinde siler (Firestore batch
// limiti 500 olduğu için güvenli bir sınır kullanılır).
async function deleteDocsInBatches(refs: ReturnType<typeof doc>[]): Promise<void> {
  const chunkSize = 450;
  for (let i = 0; i < refs.length; i += chunkSize) {
    const chunk = refs.slice(i, i + chunkSize);
    const batch = writeBatch(db());
    chunk.forEach((ref) => batch.delete(ref));
    await batch.commit();
  }
}

async function getDocRefsWhere(
  collectionName: string,
  field: string,
  value: string
) {
  const snap = await getDocs(
    query(collection(db(), collectionName), where(field, "==", value))
  );
  return snap.docs.map((d) => d.ref);
}

/**
 * Bir kullanıcıyı ve ona ait TÜM verileri (gönderiler, yorumlar, beğeniler,
 * etkinlikler, katılımlar, takip ilişkileri, bildirimler) kalıcı olarak siler.
 *
 * NOT: Bu fonksiyon yalnızca Firestore verisini siler. Kullanıcının Firebase
 * Authentication hesabı (e-posta/şifre girişi) ayrıca silinmelidir — bunun
 * için Firebase Console > Authentication üzerinden elle silme ya da
 * `scripts/wipe-auth-users.mjs` betiği kullanılabilir (Admin SDK gerektirir).
 */
export async function deleteUserCascade(
  userId: string,
  adminId: string,
  adminName: string
): Promise<void> {
  const [
    postRefs,
    commentRefs,
    likeRefs,
    eventRefs,
    participantRefsAsUser,
    notifRefs,
    followerRefs,
    followingRefs,
  ] = await Promise.all([
    getDocRefsWhere("posts", "authorId", userId),
    getDocRefsWhere("comments", "authorId", userId),
    getDocRefsWhere("likes", "userId", userId),
    getDocRefsWhere("events", "organizerId", userId),
    getDocRefsWhere("eventParticipants", "userId", userId),
    getDocRefsWhere("notifications", "userId", userId),
    getDocRefsWhere("follows", "followerId", userId),
    getDocRefsWhere("follows", "followingId", userId),
  ]);

  await deleteDocsInBatches([
    ...postRefs,
    ...commentRefs,
    ...likeRefs,
    ...eventRefs,
    ...participantRefsAsUser,
    ...notifRefs,
    ...followerRefs,
    ...followingRefs,
  ]);

  await deleteDoc(doc(db(), "users", userId));

  await logAdminAction({
    adminId,
    adminName,
    action: "delete_user_cascade",
    targetType: "user",
    targetId: userId,
  });
}

/**
 * UYGULAMADAKİ TÜM VERİYİ SİLER (test hesapları, gönderiler, etkinlikler,
 * mesajlar, bildirimler vb.) — admin kendi profili HARİÇ. Geri alınamaz.
 *
 * NOT: Firebase Authentication hesapları bu fonksiyonla silinmez (client SDK
 * bunu yapamaz). Authentication > Users sekmesinden elle silinmeli veya
 * `scripts/wipe-auth-users.mjs` betiği ile (Admin SDK + service account)
 * toplu silinmelidir.
 */
export async function wipeAllData(
  adminId: string,
  adminName: string
): Promise<{ deletedCounts: Record<string, number> }> {
  const collectionsToWipe = [
    "posts",
    "comments",
    "likes",
    "events",
    "eventParticipants",
    "conversations",
    "messages",
    "notifications",
    "reports",
    "blocks",
    "follows",
  ];

  const deletedCounts: Record<string, number> = {};

  for (const collectionName of collectionsToWipe) {
    const snap = await getDocs(collection(db(), collectionName));
    const refs = snap.docs.map((d) => d.ref);
    deletedCounts[collectionName] = refs.length;
    await deleteDocsInBatches(refs);
  }

  // Kullanıcıları sil — admin/moderatör hesapları korunur ki giriş kilitlenmesin.
  const usersSnap = await getDocs(collection(db(), "users"));
  const userRefsToDelete = usersSnap.docs
    .filter((d) => {
      const role = d.data().role;
      return role !== "admin" && role !== "moderator";
    })
    .map((d) => d.ref);
  deletedCounts["users"] = userRefsToDelete.length;
  await deleteDocsInBatches(userRefsToDelete);

  // Korunan admin/moderatör hesaplarının sayaçlarını sıfırla.
  const keptAdmins = usersSnap.docs.filter((d) => {
    const role = d.data().role;
    return role === "admin" || role === "moderator";
  });
  await Promise.all(
    keptAdmins.map((d) =>
      updateDoc(d.ref, {
        followersCount: 0,
        followingCount: 0,
        postsCount: 0,
        updatedAt: serverTimestamp(),
      })
    )
  );

  await logAdminAction({
    adminId,
    adminName,
    action: "wipe_all_data",
    targetType: "system",
    targetId: "all",
    details: JSON.stringify(deletedCounts),
  });

  return { deletedCounts };
}

// ─── Blocks ──────────────────────────────────────────────────────────────────

export async function blockUser(blockerId: string, blockedId: string): Promise<void> {
  const blockId = `${blockerId}_${blockedId}`;
  const { setDoc } = await import("firebase/firestore");
  await setDoc(doc(db(), "blocks", blockId), {
    blockerId,
    blockedId,
    createdAt: serverTimestamp(),
  });
}

export async function isUserBlocked(blockerId: string, blockedId: string): Promise<boolean> {
  const blockId = `${blockerId}_${blockedId}`;
  const snap = await getDoc(doc(db(), "blocks", blockId));
  return snap.exists();
}

// ─── Feed ────────────────────────────────────────────────────────────────────

export async function getFeed(category?: string): Promise<FeedItem[]> {
  const [postsResult, eventsResult] = await Promise.allSettled([
    getPosts(category, 20),
    getEvents(10),
  ]);

  const posts =
    postsResult.status === "fulfilled" ? postsResult.value.posts : [];
  const events = eventsResult.status === "fulfilled" ? eventsResult.value : [];

  if (postsResult.status === "rejected") {
    console.error("Feed posts query failed:", postsResult.reason);
  }
  if (eventsResult.status === "rejected") {
    console.error("Feed events query failed:", eventsResult.reason);
  }

  const feedItems: FeedItem[] = [
    ...posts.map((post) => ({
      type: "post" as const,
      data: post,
      sortDate: post.createdAt,
    })),
    ...events.map((event) => ({
      type: "event" as const,
      data: { ...event, status: getEventStatus(event) },
      sortDate: event.createdAt,
    })),
  ];

  return feedItems.sort((a, b) => b.sortDate.getTime() - a.sortDate.getTime());
}

export async function getUserPosts(userId: string): Promise<Post[]> {
  const q = query(
    collection(db(), "posts"),
    where("authorId", "==", userId),
    where("isHidden", "==", false),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map(postFromFirestore);
}
