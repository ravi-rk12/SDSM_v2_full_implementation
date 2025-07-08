// src/app/page.tsx
'use client'; // If not already there

import { Button } from "@/components/ui/button"; // Assuming shadcn button
import { authService } from "@/lib/authService";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function HomePage() {
  const { user, loading, setUser, setLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!user && !loading) {
      console.log('[HomePage useEffect] User logged out, redirecting to /login');
      router.replace('/login');
    }
  }, [user, loading, router]);

  const handleLogout = async () => {
    try {
      await authService.logout();
      setUser(null);
      setLoading(false);
      console.log('Logged out successfully, redirecting to /login');
      router.replace('/login');
    } catch (error: unknown) { // Explicitly cast to 'unknown' first
      console.error("Logout failed:", error);
      // Type guard to safely access the message property
      if (error instanceof Error) {
        alert("Logout failed: " + error.message); // Safely access error.message
      } else {
        alert("Logout failed: An unexpected error occurred.");
      }
    }
  };

  if (loading) {
    return <div>Loading user session...</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <p className="text-lg mb-4">
        Hello Shadcn Button! You are logged in as {user?.email} (Role: {user?.role})
      </p>
      <Button onClick={handleLogout}>Log Out</Button>
    </div>
  );
}