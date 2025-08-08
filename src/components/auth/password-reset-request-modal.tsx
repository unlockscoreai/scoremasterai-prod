'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { auth, sendPasswordResetEmail } from '@/lib/firebase'; // Assuming you have Firebase auth imported here

interface PasswordResetRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PasswordResetRequestModal: React.FC<PasswordResetRequestModalProps> = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  const sendResetEmail = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    setIsError(false);

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage('Password reset email sent. Please check your inbox.');
      setIsError(false);
      setEmail(''); // Clear email field on success
 onClose(); // Close modal on success
    } catch (error: any) {
      setIsError(true);
      if (error.code === 'auth/invalid-email') {
        setMessage('Invalid email address format.');
      } else if (error.code === 'auth/user-not-found') {
        setMessage('No user found with that email address.');
      } else {
        setMessage('Failed to send password reset email. Please try again.');
        console.error("Password reset error:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Reset Your Password</DialogTitle>
          <DialogDescription>
            Enter the email address associated with your account and we'll send you a link to reset your password.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={sendResetEmail}>
          <div className="grid gap-4 py-4">
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
            {message && (
              <p className={`text-sm ${isError ? 'text-red-500' : 'text-green-500'}`}>
                {message}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Email'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PasswordResetRequestModal;