'use client'

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { auth } from '@/lib/firebase';
import { verifyPasswordResetCode, confirmPasswordReset } from '@/lib/firebase'; // Import the functions
import { useToast } from '@/hooks/use-toast' // Import the useToast hook
import Link from 'next/link';
import dynamic from 'next/dynamic';
function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const actionCode = searchParams.get('oobCode');

  const { toast } = useToast();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [codeValid, setCodeValid] = useState<boolean | null>(null);

  useEffect(() => {
    if (actionCode) {
 verifyPasswordResetCode(auth, actionCode) // Use the imported function
        .then(() => {
          setCodeValid(true);
        })
        .catch((error: any) => {
          setCodeValid(false);
          setError('Invalid or expired password reset code.');
          console.error('Error verifying reset code:', error);
        });
    } else {
      setCodeValid(false);
      setError('Password reset code is missing.');
    }
  }, [actionCode]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    if (!actionCode) {
      setError('Password reset code is missing.');
      setLoading(false);
      return;
    }

    try {
 await confirmPasswordReset(auth, actionCode, newPassword); // Use the imported function
      toast({
        title: 'Password Reset Successful!',
        description: 'Your password has been reset. You can now sign in with your new password.',
      });
      // Redirect to sign-in page after successful reset
      // router.push('/sign-in'); // Assuming you have Next.js router available
    } catch (error: any) {
      setError('Failed to reset password. Please try again.');
      console.error('Password reset error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (codeValid === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Verifying reset code...</p>
      </div>
    );
  }

  if (codeValid === false) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="mx-auto max-w-sm">
          <CardHeader>
            <CardTitle className="text-2xl font-headline">Invalid Code</CardTitle>
            <CardDescription>
              {error || 'The password reset code is invalid or has expired.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center">
               <Link href="/sign-in" className="underline">
                  Return to Sign In
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If codeValid is true, show the password reset form
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="mx-auto max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Reset Password</CardTitle>
          <CardDescription>Enter your new password below.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleResetPassword}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Resetting...' : 'Reset Password'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

const ResetPasswordPage = dynamic(() => Promise.resolve(ResetPasswordContent), {
  ssr: false,
  loading: () => <div>Loading...</div>,
});