// src/app/auth-provider.tsx

'use client'; // This MUST be the very first line in this new file

import { authService } from "@/lib/authService";
import { useAuthStore } from "@/store/authStore";
import { useEffect } from "react";
import React from 'react'; // Import React if not implicitly available

// AuthProvider component to manage authentication state globally
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setLoading } = useAuthStore();

  useEffect(() => {
    console.log('[AuthProvider useEffect] onAuthStateChange listener setup.');
    const unsubscribe = authService.onAuthStateChange(async (firebaseUser) => {
      console.log('[AuthProvider onAuthStateChange callback] Firebase user:', firebaseUser ? firebaseUser.uid : 'null');
      if (firebaseUser) {
        const authenticatedUser = await authService.getAuthUserRole(firebaseUser.uid);
        console.log('[AuthProvider onAuthStateChange callback] AuthUser from Firestore:', authenticatedUser);
        setUser(authenticatedUser);
      } else {
        setUser(null);
      }
      setLoading(false);
      console.log('[AuthProvider onAuthStateChange callback] Auth state updated, loading set to false.');
    });

    return () => {
      console.log('[AuthProvider useEffect] Cleaning up onAuthStateChange listener.');
      unsubscribe();
    };
  }, [setUser, setLoading]);

  return <>{children}</>;
}