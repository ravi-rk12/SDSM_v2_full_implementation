// src/app/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { app } from '@/lib/firebase/clientApp'; // Ensure your firebase app is initialized here

export default function RootPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is signed in, redirect to dashboard
        router.replace('/dashboard');
      } else {
        // User is signed out, redirect to login
        router.replace('/login');
      }
      setLoading(false);
    });

    // Clean up the subscription on unmount
    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mb-4"></div>
        <p className="text-xl text-gray-700 font-semibold">Loading your Mandi App...</p>
        <p className="text-gray-500 mt-2 text-sm">Please wait while we prepare your experience.</p>
      </div>
    );
  }

  // This component will only render "Loading..." briefly before redirecting.
  // It won't display any permanent content.
  return null;
}
