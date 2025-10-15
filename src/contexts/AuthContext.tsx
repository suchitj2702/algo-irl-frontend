import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  onAuthStateChanged,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  type User as FirebaseUser,
} from "firebase/auth";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import type { FirebaseError } from "firebase/app";
import app, { auth, type User as AppUser } from "../config/firebase";

type SubscriptionStatus = "active" | "canceled" | "past_due" | "none";

export interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  getIdToken: (forceRefresh?: boolean) => Promise<string | null>;
  hasActiveSubscription: () => Promise<boolean>;
  getSubscriptionStatus: () => Promise<SubscriptionStatus>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_USER_STORAGE_KEY = "algoIRL.auth.user";

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

const firebaseErrorMessages: Record<string, string> = {
  "auth/email-already-in-use": "An account already exists with that email.",
  "auth/invalid-email": "That email address appears to be invalid.",
  "auth/invalid-credential": "The provided credentials are invalid. Please try again.",
  "auth/user-disabled": "This account has been disabled. Contact support if you believe this is a mistake.",
  "auth/user-not-found": "No account found for that email address.",
  "auth/wrong-password": "Incorrect password. Please try again.",
  "auth/too-many-requests": "Too many attempts. Please wait and try again shortly.",
  "auth/network-request-failed": "Network error. Check your connection and try again.",
  "auth/popup-blocked": "The sign-in popup was blocked. Please allow popups and try again.",
  "auth/popup-closed-by-user": "The sign-in popup was closed before completing.",
};

function mapFirebaseUser(firebaseUser: FirebaseUser): AppUser {
  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    displayName: firebaseUser.displayName,
    photoURL: firebaseUser.photoURL,
  };
}

function getStoredUser(): AppUser | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(AUTH_USER_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as AppUser;
  } catch {
    window.localStorage.removeItem(AUTH_USER_STORAGE_KEY);
    return null;
  }
}

function persistUser(nextUser: AppUser | null) {
  if (typeof window === "undefined") {
    return;
  }

  if (nextUser) {
    window.localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(nextUser));
  } else {
    window.localStorage.removeItem(AUTH_USER_STORAGE_KEY);
  }
}

function getFriendlyErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "code" in error) {
    const firebaseError = error as FirebaseError;
    return firebaseErrorMessages[firebaseError.code] ?? "Something went wrong. Please try again.";
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(() => getStoredUser());
  const [loading, setLoading] = useState<boolean>(() => {
    const storedUser = getStoredUser();
    return storedUser ? false : true;
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        if (firebaseUser) {
          const mappedUser = mapFirebaseUser(firebaseUser);
          setUser(mappedUser);
          persistUser(mappedUser);
        } else {
          setUser(null);
          persistUser(null);
        }
        setLoading(false);
      },
      (authError) => {
        const friendlyMessage = getFriendlyErrorMessage(authError);
        setError(friendlyMessage);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const handleAuthOperation = useCallback(
    async (operation: () => Promise<unknown>) => {
      setLoading(true);
      setError(null);

      try {
        await operation();
      } catch (err) {
        const friendlyMessage = getFriendlyErrorMessage(err);
        setError(friendlyMessage);
        throw new Error(friendlyMessage);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const signIn = useCallback(
    (email: string, password: string) =>
      handleAuthOperation(() => signInWithEmailAndPassword(auth, email, password)),
    [handleAuthOperation],
  );

  const signUp = useCallback(
    (email: string, password: string) =>
      handleAuthOperation(() => createUserWithEmailAndPassword(auth, email, password)),
    [handleAuthOperation],
  );

  const signInWithGoogle = useCallback(
    () => handleAuthOperation(() => signInWithPopup(auth, googleProvider)),
    [handleAuthOperation],
  );

  const signOut = useCallback(
    () =>
      handleAuthOperation(async () => {
        // Clear state synchronously before Firebase sign-out to prevent race conditions
        setUser(null);
        persistUser(null);
        await firebaseSignOut(auth);
      }),
    [handleAuthOperation],
  );

  const getSubscriptionStatus = useCallback(async (): Promise<SubscriptionStatus> => {
    if (!user) {
      return "none";
    }

    try {
      const db = getFirestore(app);
      const subscriptionsRef = collection(db, "customers", user.uid, "subscriptions");
      const snapshot = await getDocs(subscriptionsRef);

      if (snapshot.empty) {
        return "none";
      }

      let status: SubscriptionStatus = "none";

      snapshot.forEach((docSnapshot) => {
        const rawStatus = String(docSnapshot.data()?.status ?? "").toLowerCase();

        if (rawStatus === "active" || rawStatus === "trialing") {
          status = "active";
        } else if (rawStatus === "past_due" && status !== "active") {
          status = "past_due";
        } else if (rawStatus === "canceled" && status !== "active" && status !== "past_due") {
          status = "canceled";
        }
      });

      return status;
    } catch (err) {
      const friendlyMessage = getFriendlyErrorMessage(err);
      setError(friendlyMessage);
      return "none";
    }
  }, [user]);

  const hasActiveSubscription = useCallback(async () => {
    const status = await getSubscriptionStatus();
    return status === "active";
  }, [getSubscriptionStatus]);

  const getIdToken = useCallback(async (forceRefresh = false) => {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      return null;
    }

    try {
      return await currentUser.getIdToken(forceRefresh);
    } catch (err) {
      const friendlyMessage = getFriendlyErrorMessage(err);
      setError(friendlyMessage);
      return null;
    }
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      loading,
      error,
      signIn,
      signUp,
      signInWithGoogle,
      signOut,
      getIdToken,
      hasActiveSubscription,
      getSubscriptionStatus,
      clearError,
    }),
    [
      user,
      loading,
      error,
      signIn,
      signUp,
      signInWithGoogle,
      signOut,
      getIdToken,
      hasActiveSubscription,
      getSubscriptionStatus,
      clearError,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
