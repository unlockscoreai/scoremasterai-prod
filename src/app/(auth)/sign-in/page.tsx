'use client';

import Link from "next/link";
import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { auth } from '@/lib/firebase'; // Import auth and firestore
import { signInWithEmailAndPassword } from 'firebase/auth'; // Import signInWithEmailAndPassword
import PasswordResetRequestModal from '@/components/auth/password-reset-request-modal';
import { useRouter } from 'next/navigation'; // Import useRouter

// Dynamically import the SignInContent component with ssr: false
const SignInContent = dynamic(() => Promise.resolve(SignInPageContent), {
  ssr: false,
  loading: () => <p>Loading sign in form...</p>, // Add a loading fallback
});

// Wrapper component to use the dynamically imported component
export default function SignInPage() {
 return <Suspense fallback={<div>Loading...</div>}><SignInContent /></Suspense>;
}
function SignInPageContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { firestore } = useFirebase(); // Access firestore here
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  const router = useRouter(); // Initialize useRouter

  const handleSignIn = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null); // Clear previous errors

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password); // Use the imported function
      const user = userCredential.user;

      if (user) {
        // Fetch user role from Firestore using firestore
        const userDoc = await firestore.collection('users').doc(user.uid).get();
        if (userDoc.exists()) { // Use .exists() method
          const userData = userDoc.data();
          const role = userData?.role; // Get the role

          if (role === 'client') {
            router.push('/client/dashboard');
          } else if (role === 'affiliate') {
            router.push('/affiliate/dashboard');
          } else { 
            // Handle unexpected role or no role
            setError('Your account does not have a valid role assigned.');
            // Optionally sign out the user if role is missing/invalid
            await auth.signOut();
          }
        } else {
          // User document not found in Firestore 
          setError('User data not found. Please contact support.');
          await auth.signOut(); // Sign out user if data is missing
        }
      }
    } catch (error: any) {
      // Handle Firebase authentication errors
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        setError('Invalid email or password.');
      } else if (error.code === 'auth/invalid-email') {
        setError('Invalid email format.');
      }
      else {
        setError('Failed to sign in. Please try again.');
        console.error("Sign-in error:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mx-auto max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl font-headline">Sign In</CardTitle>
        <CardDescription>
          Enter your email below to login to your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSignIn}> {/* Use form and onSubmit */}
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Password</Label>
                <Link href="#" onClick={() => setIsResetModalOpen(true)} className="ml-auto inline-block text-sm underline">
                  Forgot your password? {/* This link will now open the modal */}
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>} {/* Display error message */}
            <Button type="submit" className="w-full" disabled={loading}> {/* Use type="submit" and disable while loading */}
              {loading ? 'Signing In...' : 'Sign In'} {/* Change button text based on loading state */}
            </Button>
          </div>
        </form> {/* Close form tag */}
        <div className="mt-4 text-center text-sm">
          Don&apos;t have an account?{" "}
          <Link href="/sign-up" className="underline">
            Sign up
          </Link>
        </div>
      </CardContent>
      <PasswordResetRequestModal isOpen={isResetModalOpen} onClose={() => setIsResetModalOpen(false)} />
    </Card>
  );
}

function useFirebase(): { firestore: any; } {
  throw new Error("Function not implemented.");
}

