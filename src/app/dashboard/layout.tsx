// src/app/dashboard/layout.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { app } from "@/lib/firebase/clientApp"; // Ensure your firebase app is initialized here
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/clientApp"; // Firestore instance
import { AuthUser } from "@/types"; // Import AuthUser type

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch user role and other details from Firestore
        try {
          const userDocRef = doc(db, "users", firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
              role: userData.role || "viewer", // Default role if not set
              createdAt: userData.createdAt?.toDate() || new Date(),
              lastLoginAt: userData.lastLoginAt?.toDate() || new Date(),
              // Add other fields from AuthUser interface if available in Firestore
            } as AuthUser);
          } else {
            // If user document doesn't exist, treat as basic user or redirect
            console.warn("User document not found in Firestore for UID:", firebaseUser.uid);
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
              role: "viewer", // Default to viewer if no doc
              createdAt: new Date(),
              lastLoginAt: new Date(),
            } as AuthUser);
          }
        } catch (error) {
          console.error("Error fetching user data from Firestore:", error);
          // Fallback to basic user info if Firestore fetch fails
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            role: "viewer",
            createdAt: new Date(),
            lastLoginAt: new Date(),
          } as AuthUser);
        }
      } else {
        setUser(null);
        router.push("/login"); // Redirect to login if not authenticated
      }
      setLoadingAuth(false);
    });

    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    const auth = getAuth(app);
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Error signing out:", error);
      alert("Failed to log out. Please try again."); // Use a custom modal in production
    }
  };

  if (loadingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-lg text-gray-700">Loading authentication...</p>
      </div>
    );
  }

  if (!user) {
    // This state should ideally be brief as the redirect happens in useEffect
    return null;
  }

  const navLinks = [
    { name: "Dashboard", href: "/dashboard" },
    { name: "Kisans", href: "/dashboard/kisans" },
    { name: "Vyaparis", href: "/dashboard/vyaparis" },
    { name: "Products", href: "/dashboard/products" },
    { name: "Transactions", href: "/dashboard/transactions" }, // Added Transactions link
    // Add more navigation links as your app grows
  ];

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-gray-800 text-white transform ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:relative md:translate-x-0 transition-transform duration-200 ease-in-out`}
      >
        <div className="p-4 text-xl font-bold border-b border-gray-700">
          Mandi App
        </div>
        <nav className="mt-5">
          {navLinks.map((link) => (
            <Link key={link.name} href={link.href} passHref>
              <div
                className={`flex items-center px-4 py-2 mt-2 rounded-md mx-3 cursor-pointer
                  ${
                    pathname === link.href
                      ? "bg-gray-700 text-white"
                      : "text-gray-300 hover:bg-gray-700 hover:text-white"
                  }`}
              >
                {link.name}
              </div>
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-0 w-full p-4 border-t border-gray-700">
          <p className="text-sm text-gray-400">Logged in as: {user.email}</p>
          <p className="text-sm text-gray-400">Role: {user.role}</p>
          <button
            onClick={handleLogout}
            className="mt-3 w-full px-4 py-2 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:ml-64">
        {/* Header for mobile (hamburger menu) */}
        <header className="bg-white shadow p-4 flex items-center justify-between md:hidden">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="text-gray-600 focus:outline-none"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16M4 18h16"
              ></path>
            </svg>
          </button>
          <h2 className="text-xl font-semibold text-gray-800">Dashboard</h2>
          {/* User info/logout button can go here for mobile if desired */}
        </header>

        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
