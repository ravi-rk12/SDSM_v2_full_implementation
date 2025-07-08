// src/lib/authService.ts
import { auth, db } from "@/lib/firebase/config";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  Unsubscribe, // <-- ADD THIS IMPORT for strict type safety
} from "firebase/auth";
import { doc, getDoc, Timestamp } from "firebase/firestore";
import { AuthUser } from "@/types";

// Function to get additional user details (like role) from Firestore
async function getAuthUserRole(uid: string): Promise<AuthUser | null> {
  try {
    console.log(`[authService] Attempting to fetch user role for UID: ${uid}`); // Debugging
    const userDocRef = doc(db, "users", uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      const userData = userDocSnap.data();
      console.log(
        `[authService] User document found for UID ${uid}:`,
        userData
      ); // Debugging

      // Ensure that createdAt and lastLoginAt are Timestamps and convert to Date
      const createdAt =
        userData.createdAt instanceof Timestamp
          ? userData.createdAt.toDate()
          : new Date(); // Convert to Date
      const lastLoginAt =
        userData.lastLoginAt instanceof Timestamp
          ? userData.lastLoginAt.toDate()
          : new Date(); // Convert to Date

      return {
        uid: uid,
        email: userData.email || null,
        displayName: userData.displayName || null,
        photoURL: userData.photoURL || null,
        role: userData.role, // Assuming role is present and correct in Firestore
        createdAt: createdAt,
        lastLoginAt: lastLoginAt,
        location: userData.location || undefined,
        lastActivityAt: userData.lastActivityAt || undefined,
        featuresUsed: userData.featuresUsed || undefined,
        deviceInfo: userData.deviceInfo || undefined,
      } as AuthUser;
    } else {
      console.log(`[authService] No user document found for UID: ${uid}`); // Debugging
      return null;
    }
  } catch (error) {
    console.error("[authService] Error fetching user role:", error);
    return null;
  }
}

// Authentication Service object
export const authService = {
  // Login function
  async login(email: string, password: string): Promise<AuthUser> {
    console.log(`[authService] Login attempt for email: ${email}`);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      console.log(`[authService] Firebase signInWithEmailAndPassword successful for: ${firebaseUser.email}`);

      if (firebaseUser) {
        const authUser = await getAuthUserRole(firebaseUser.uid);
        if (authUser) {
          console.log(`[authService] Fetched AuthUser role: ${authUser.role}`);

          // --- REMOVE THESE TEMPORARY DEBUGGING LINES ---
          // const { setUser, setLoading } = useAuthStore.getState();
          // setUser(authUser);
          // setLoading(false);
          // console.log('[authService] TEMPORARY: Directly updated Zustand store with logged-in user.');
          // --- END REMOVAL ---

          return authUser;
        } else {
          console.warn("[authService] User authenticated but profile not found in Firestore.");
          throw new Error("User profile not found in database. Please contact admin.");
        }
      }
      console.warn("[authService] Login failed: No user credential received from Firebase.");
      throw new Error("Login failed: No user credential received.");
    } catch (error: any) {
      console.error("[authService] Login Error:", error.code, error.message);
      if (
        error.code === "auth/wrong-password" ||
        error.code === "auth/user-not-found" ||
        error.code === "auth/invalid-credential"
      ) {
        throw new Error("Invalid email or password.");
      } else if (error.code === "auth/too-many-requests") {
        throw new Error("Too many login attempts. Please try again later.");
      } else if (error.code === "auth/invalid-email") {
        throw new Error("Invalid email format.");
      }
      throw new Error(error.message || "An unexpected error occurred during login.");
    }
  },

  // Logout function
  async logout(): Promise<void> {
    console.log("[authService] Attempting logout."); // Debugging
    try {
      await signOut(auth);
      console.log("[authService] Logout successful."); // Debugging
    } catch (error: any) {
      console.error("[authService] Logout Error:", error.message);
      throw new Error(
        error.message || "An unexpected error occurred during logout."
      );
    }
  },

  // Observe authentication state changes
  onAuthStateChange(callback: (user: AuthUser | null) => void): Unsubscribe {
    // Add Unsubscribe return type
    console.log("[authService] Setting up onAuthStateChanged listener."); // Debugging
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        console.log(
          `[authService] onAuthStateChanged: User logged in: ${firebaseUser.uid}`
        ); // Debugging
        const authUser = await getAuthUserRole(firebaseUser.uid);
        callback(authUser);
      } else {
        console.log("[authService] onAuthStateChanged: No user logged in."); // Debugging
        callback(null);
      }
    });
  },
  getAuthUserRole, // This line is correct to export the function
};
