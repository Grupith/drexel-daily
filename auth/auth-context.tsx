"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  getRedirectResult,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  type User,
} from "firebase/auth";
import {
  deleteField,
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "@/firebase/config";
import { DREXEL_LOCATIONS } from "@/lib/locations";
import type { UserProfile } from "@/types/user";

const PLAY_INTENT = "drexel-daily:play-after-sign-in";

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signingIn: boolean;
  error: string | null;
  startPlay: () => Promise<void>;
  retryProfile: () => Promise<void>;
  saveLocation: (location: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);
// Share redirect processing across Strict Mode's effect remounts.
let redirectResult: ReturnType<typeof getRedirectResult> | undefined;

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const generation = useRef(0);

  async function loadProfile(currentUser: User, version: number) {
    const ref = doc(db, "users", currentUser.uid);
    const existingProfile = await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(ref);
      const data = snapshot.data() ?? {};
      const defaults = {
        displayName: currentUser.displayName,
        email: currentUser.email,
        photoURL: currentUser.photoURL,
        locationId:
          typeof data.location === "string" &&
          DREXEL_LOCATIONS.includes(data.location)
            ? data.location
            : null,
        role: "employee",
        createdAt: serverTimestamp(),
        stats: {
          currentStreak: 0,
          longestStreak: 0,
          totalPoints: 0,
          challengesPlayed: 0,
        },
      };
      const missing = Object.fromEntries(
        Object.entries(defaults).filter(([key]) => !(key in data)),
      );
      if ("location" in data) missing.location = deleteField();
      if (Object.keys(missing).length) {
        transaction.set(ref, missing, { merge: true });
        return null;
      }
      return snapshot;
    });
    if (
      version !== generation.current ||
      auth.currentUser?.uid !== currentUser.uid
    )
      return;
    // Only new/migrated profiles need a read for committed defaults/timestamps.
    const snapshot = existingProfile ?? (await getDoc(ref));
    if (
      version !== generation.current ||
      auth.currentUser?.uid !== currentUser.uid
    )
      return;
    const loadedProfile = snapshot.data() as UserProfile;
    setProfile(loadedProfile);
    return loadedProfile;
  }

  useEffect(() => {
    let active = true;
    redirectResult ??= getRedirectResult(auth);
    const redirectReady = redirectResult.catch((cause: unknown) => {
      console.error("Google sign-in redirect failed", cause);
      if (active) {
        sessionStorage.removeItem(PLAY_INTENT);
        setError("Google sign-in could not be completed. Please try again.");
      }
    });
    const unsubscribe = onAuthStateChanged(
      auth,
      async (currentUser) => {
        const version = ++generation.current;
        setUser(currentUser);
        setProfile(null);
        setLoading(true);
        await redirectReady;
        if (!active || version !== generation.current) return;
        try {
          if (currentUser) {
            setError(null);
            const loadedProfile = await loadProfile(currentUser, version);
            if (!active || version !== generation.current || !loadedProfile)
              return;
            // Returning employees choose Play from the landing page. New
            // employees continue to location setup on the play page.
            if (sessionStorage.getItem(PLAY_INTENT) === "true") {
              sessionStorage.removeItem(PLAY_INTENT);
              router.replace(loadedProfile.locationId ? "/" : "/play");
            }
          } else if (sessionStorage.getItem(PLAY_INTENT) === "true") {
            sessionStorage.removeItem(PLAY_INTENT);
            setError(
              "Google sign-in didn’t return a session. Please try again.",
            );
          }
        } catch (cause) {
          console.error("Could not load user profile", cause);
          if (active && version === generation.current)
            setError("We couldn’t load your profile. Please try again.");
        } finally {
          if (active && version === generation.current) setLoading(false);
        }
      },
      (cause) => {
        console.error("Authentication state failed", cause);
        if (active) {
          setError("We couldn’t check your sign-in. Please refresh the page.");
          setLoading(false);
        }
      },
    );
    return () => {
      active = false;
      unsubscribe();
    };
  }, [router]);

  async function startPlay() {
    if (loading || signingIn) return;
    setError(null);
    if (user) {
      router.push("/play");
      return;
    }
    setSigningIn(true);
    try {
      sessionStorage.setItem(PLAY_INTENT, "true");
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      // Cross-origin redirect helpers can lose their result when third-party
      // storage is blocked. Popup authentication returns the credential directly.
      if (auth.app.options.authDomain !== window.location.hostname) {
        await signInWithPopup(auth, provider);
        // The auth listener loads the profile and chooses the destination.
        setSigningIn(false);
      } else {
        await signInWithRedirect(auth, provider);
      }
    } catch (cause) {
      console.error("Could not start Google sign-in", cause);
      sessionStorage.removeItem(PLAY_INTENT);
      setError("Google sign-in could not be started. Please try again.");
      setSigningIn(false);
    }
  }

  async function retryProfile() {
    if (!user || loading) return;
    setLoading(true);
    setError(null);
    const version = generation.current;
    try {
      const loadedProfile = await loadProfile(user, version);
      if (
        version === generation.current &&
        loadedProfile &&
        sessionStorage.getItem(PLAY_INTENT) === "true"
      ) {
        sessionStorage.removeItem(PLAY_INTENT);
        router.replace(loadedProfile.locationId ? "/" : "/play");
      }
    } catch (cause) {
      console.error("Could not load user profile", cause);
      if (version === generation.current)
        setError("We couldn’t load your profile. Please try again.");
    } finally {
      if (version === generation.current) setLoading(false);
    }
  }

  async function saveLocation(location: string) {
    if (!user || auth.currentUser?.uid !== user.uid)
      throw new Error("Please sign in again.");
    if (!DREXEL_LOCATIONS.includes(location))
      throw new Error("Please select a Drexel location.");
    const uid = user.uid;
    await updateDoc(doc(db, "users", uid), { locationId: location });
    if (auth.currentUser?.uid === uid)
      setProfile((current) =>
        current ? { ...current, locationId: location } : current,
      );
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signingIn,
        error,
        startPlay,
        retryProfile,
        saveLocation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
