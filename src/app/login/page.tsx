// REMOVE the 'use client' directive from here! This file should now be a Server Component by default.

// Remove these imports as they are no longer needed in this file
// import { useState } from 'react';
// import { useRouter } from 'next/navigation';
// import { authService } from '@/lib/authService';
// import { useAuthStore } from '@/store/authStore';
// import { useEffect } from 'react';

import { LoginForm } from './login-form'; // IMPORT THE NEW LOGIN FORM CLIENT COMPONENT

// METADATA block can now live here because this is a Server Component
export const metadata = {
  title: 'Your Mandi App | Login', // Set your desired login page title
  description: 'Login to Your Mandi App',
};

// This is now a Server Component that just renders the Client Component
export default function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <LoginForm />
    </div>
  );
}