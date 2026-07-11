import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  updateProfile,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import { getFirebaseAuth, getFirebaseDb } from "./config";
import { generateUsername } from "@/lib/utils";
import type { UserProfile } from "@/types";
import { userProfileFromFirestore } from "./converters";

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

function isLocalhost(): boolean {
  return (
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1")
  );
}

export function getAuthErrorMessage(error: unknown): string {
  const code = (error as { code?: string })?.code ?? "";
  const messages: Record<string, string> = {
    "auth/unauthorized-domain":
      "Bu domain Firebase'de yetkili değil. Firebase Console → Authentication → Settings → Authorized domains'e domain'ini ekle.",
    "auth/popup-blocked":
      "Popup engellendi. Sayfa yenileniyor, tekrar dene.",
    "auth/popup-closed-by-user": "Google giriş penceresi kapatıldı.",
    "auth/network-request-failed": "İnternet bağlantısı hatası.",
    "auth/invalid-credential": "E-posta veya şifre hatalı.",
    "auth/email-already-in-use": "Bu e-posta zaten kayıtlı.",
  };
  return messages[code] ?? "Giriş başarısız. Lütfen tekrar deneyin.";
}

async function createUserProfile(user: User, displayName: string): Promise<void> {
  const db = getFirebaseDb();
  const username = generateUsername(user.email ?? user.uid);
  const profileData = {
    email: user.email ?? "",
    displayName,
    username,
    bio: "",
    avatarUrl: user.photoURL ?? "",
    coverUrl: "",
    interests: [],
    role: "user",
    isBanned: false,
    isSuspended: false,
    isOnboarded: false,
    followersCount: 0,
    followingCount: 0,
    postsCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  console.log("=== CREATING USER PROFILE ===");
  console.log("User UID:", user.uid);
  console.log("Profile Data:", profileData);
  try {
    await setDoc(doc(db, "users", user.uid), profileData);
    console.log("User profile created successfully");
  } catch (error) {
    const errorCode = (error as { code?: string })?.code;
    const errorMessage = (error as { message?: string })?.message;
    console.error("=== CREATE USER PROFILE ERROR ===");
    console.error("Error Code:", errorCode);
    console.error("Error Message:", errorMessage);
    console.error("Full Error:", error);
    console.error("==================================");
    throw error;
  }
}

export async function ensureUserProfile(user: User): Promise<void> {
  console.log("=== ENSURING USER PROFILE ===");
  console.log("User UID:", user.uid);
  console.log("User Email:", user.email);
  console.log("User Display Name:", user.displayName);
  const profileRef = doc(getFirebaseDb(), "users", user.uid);
  const profileSnap = await getDoc(profileRef);
  console.log("Profile exists:", profileSnap.exists());
  if (!profileSnap.exists()) {
    console.log("Profile does not exist, creating new profile...");
    await createUserProfile(user, user.displayName ?? "Kullanıcı");
  } else {
    console.log("Profile already exists");
  }
  console.log("===============================");
}

export async function handleGoogleRedirectResult(): Promise<User | null> {
  const auth = getFirebaseAuth();
  try {
    const result = await getRedirectResult(auth);
    if (result?.user) {
      await ensureUserProfile(result.user);
      return result.user;
    }
  } catch (error) {
    const errorCode = (error as { code?: string })?.code;
    const errorMessage = (error as { message?: string })?.message;
    console.error("=== GOOGLE REDIRECT RESULT ERROR ===");
    console.error("Error Code:", errorCode);
    console.error("Error Message:", errorMessage);
    console.error("Full Error:", error);
    console.error("====================================");
  }
  return null;
}

export async function signUpWithEmail(
  email: string,
  password: string,
  displayName: string
): Promise<User> {
  const auth = getFirebaseAuth();
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(credential.user, { displayName });
  await createUserProfile(credential.user, displayName);
  return credential.user;
}

export async function signInWithEmail(email: string, password: string): Promise<User> {
  const auth = getFirebaseAuth();
  const credential = await signInWithEmailAndPassword(auth, email, password);
  await ensureUserProfile(credential.user);
  return credential.user;
}

/** Canlı sitede redirect kullanır (popup çoğu tarayıcıda engellenir). Localhost'ta popup. */
export async function signInWithGoogle(): Promise<User | null> {
  const auth = getFirebaseAuth();

  console.log("=== GOOGLE SIGN-IN START ===");
  console.log("Is Localhost:", isLocalhost());
  console.log("Auth Domain:", process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN);
  console.log("Project ID:", process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);

  if (!isLocalhost()) {
    console.log("Using redirect method (production)");
    try {
      await signInWithRedirect(auth, googleProvider);
      return null;
    } catch (error) {
      const errorCode = (error as { code?: string })?.code;
      const errorMessage = (error as { message?: string })?.message;
      console.error("=== GOOGLE REDIRECT ERROR ===");
      console.error("Error Code:", errorCode);
      console.error("Error Message:", errorMessage);
      console.error("Full Error:", error);
      console.error("============================");
      throw error;
    }
  }

  console.log("Using popup method (localhost)");
  try {
    const credential = await signInWithPopup(auth, googleProvider);
    console.log("=== POPUP SUCCESSFUL ===");
    console.log("User UID:", credential.user.uid);
    console.log("User Email:", credential.user.email);
    console.log("User Display Name:", credential.user.displayName);
    console.log("Credential:", credential);
    console.log("=======================");
    await ensureUserProfile(credential.user);
    console.log("=== SIGN-IN WITH GOOGLE COMPLETE ===");
    console.log("Returning user:", credential.user.uid);
    console.log("====================================");
    return credential.user;
  } catch (error: unknown) {
    const errorCode = (error as { code?: string })?.code;
    const errorMessage = (error as { message?: string })?.message;
    console.error("=== GOOGLE POPUP ERROR ===");
    console.error("Error Code:", errorCode);
    console.error("Error Message:", errorMessage);
    console.error("Full Error:", error);
    console.error("==========================");

    if (
      errorCode === "auth/popup-blocked" ||
      errorCode === "auth/popup-closed-by-user" ||
      errorCode === "auth/cancelled-popup-request"
    ) {
      console.log("Popup blocked, falling back to redirect");
      try {
        await signInWithRedirect(auth, googleProvider);
        return null;
      } catch (redirectError) {
        const redirectErrorCode = (redirectError as { code?: string })?.code;
        const redirectErrorMessage = (redirectError as { message?: string })?.message;
        console.error("=== GOOGLE REDIRECT FALLBACK ERROR ===");
        console.error("Error Code:", redirectErrorCode);
        console.error("Error Message:", redirectErrorMessage);
        console.error("Full Error:", redirectError);
        console.error("====================================");
        throw redirectError;
      }
    }
    throw error;
  }
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(getFirebaseAuth());
}

export function subscribeToAuthState(callback: (user: User | null) => void) {
  return onAuthStateChanged(getFirebaseAuth(), callback);
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(getFirebaseDb(), "users", userId));
  if (!snap.exists()) return null;
  return userProfileFromFirestore(snap);
}

export async function updateUserProfile(
  userId: string,
  data: Partial<UserProfile>
): Promise<void> {
  const { id: _id, createdAt: _createdAt, ...updateData } = data as UserProfile;
  await setDoc(
    doc(getFirebaseDb(), "users", userId),
    { ...updateData, updatedAt: serverTimestamp() },
    { merge: true }
  );
}
