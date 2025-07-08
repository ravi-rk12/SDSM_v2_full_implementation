'use client'; // This MUST be the very first line in this new file

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/authService';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button'; // Assuming you use Shadcn Button
import { Input } from '@/components/ui/input';   // Assuming you use Shadcn Input
import { Label } from '@/components/ui/label';   // Assuming you use Shadcn Label
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'; // Assuming Shadcn Card

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false); // To prevent multiple clicks

  const router = useRouter();
  const { user, loading } = useAuthStore(); // Get user and loading state from Zustand

  // This useEffect handles redirection if user is already logged in
  useEffect(() => {
    // Only attempt redirect if we are sure about auth state (not loading)
    // and a user is present. Also, ensure this component is not already redirecting.
    if (user && !loading && !isAuthenticating) {
      console.log('[LoginForm useEffect] User found, loading complete. Attempting redirect to /');
      router.replace('/');
    }
  }, [user, loading, router, isAuthenticating]); // isAuthenticating added as dependency for robustness

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAuthenticating) return;

    setError(null);
    setIsAuthenticating(true); // Set to true here
    console.log('Login button clicked!');
    console.log('Attempting login with: {email: \'' + email + '\', password: \'***\'}');

    try {
      console.log('Calling authService.login...');
      await authService.login(email, password);
      // Login is successful, onAuthStateChanged listener will update Zustand,
      // and the useEffect above will handle the redirect.
      console.log('Login successful! Redirect should follow.');
      // --- ADD THIS LINE: ---
      setIsAuthenticating(false); // <--- Set to false after successful login
    } catch (err: unknown) {
      setIsAuthenticating(false); // Also set to false if login fails // Re-enable button
      if (err instanceof Error) {
        setError(err.message);
        console.error('Login failed:', err.message);
      } else {
        setError('An unexpected error occurred.');
        console.error('Login failed: An unexpected error occurred.', err);
      }
    }
  };

  // If user is already logged in and we are not in the middle of authenticating
  // (e.g., if you refresh on /login while session is active),
  // this component's useEffect will handle the redirect.
  // We can return a loading spinner or null here briefly.
  if (loading || (user && !isAuthenticating)) {
    return (
        <Card className="w-[350px]">
            <CardHeader>
                <CardTitle>Loading...</CardTitle>
                <CardDescription>Redirecting you to the dashboard.</CardDescription>
            </CardHeader>
            <CardContent>
                <p>Please wait while we verify your session.</p>
            </CardContent>
        </Card>
    );
  }

  // Otherwise, display the login form
  return (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Login</CardTitle>
        <CardDescription>Log in to your Mandi App account</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              type="email"
              id="email"
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              type="password"
              id="password"
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <Button type="submit" className="w-full" disabled={isAuthenticating}>
            {isAuthenticating ? 'Logging in...' : 'Login'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}