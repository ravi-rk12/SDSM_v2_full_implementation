// REMOVE the 'use client' directive from here! This file should now be a Server Component by default.

import { Inter } from "next/font/google";
import "./globals.css";
// import { authService } from "@/lib/authService"; // No longer needed here
// import { useAuthStore } from "@/store/authStore"; // No longer needed here
// import { useEffect } from "react"; // No longer needed here

import { AuthProvider } from './auth-provider'; // IMPORT THE NEW AUTHPROVIDER FILE

const inter = Inter({ subsets: ["latin"] });

// METADATA block can now live here because this is a Server Component
export const metadata = {
  title: 'Your Mandi App | Dashboard', // Set your desired default title here
  description: 'Mandi App powered by Next.js and Firebase',
};

// No longer a client component, so AuthProvider logic moved out.
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>{children}</AuthProvider> {/* Use the imported AuthProvider */}
      </body>
    </html>
  );
}