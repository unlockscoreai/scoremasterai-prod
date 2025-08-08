'use client';

import Link from "next/link"
import { useRouter } from 'next/navigation';
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from "@/hooks/use-toast";
import { auth, firestore } from '@/lib/firebase';
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

// Use auth and db in your components

export default function SignUpPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [role, setRole] = useState("client");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Store additional user data in Firestore
 await setDoc(doc(firestore, "users", user.uid), {
        firstName,
        lastName,
        email,
        role, // Store the selected role
        createdAt: new Date(),
      });

      toast({
        title: "Account created!",
        description: "Welcome to UnlockScore AI.",
      });

      // Redirect to the appropriate dashboard
      router.push(role === 'affiliate' ? '/affiliate/dashboard' : '/client/dashboard');
    } catch (error: any) {
      toast({
        title: "Signup Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="mx-auto max-w-sm" onSubmit={handleSignUp}>
      <CardHeader>
        <CardTitle className="text-xl font-headline">Sign Up</CardTitle>
        <CardDescription>
          Enter your information to create an account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="first-name">First name</Label>
              <Input id="first-name" placeholder="Max" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="last-name">Last name</Label>
              <Input id="last-name" placeholder="Robinson" required />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" />
          </div>
          <div className="grid gap-2">
            <Label>I am a...</Label>
            <RadioGroup defaultValue="client" onValueChange={setRole} className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="client" id="r1" />
                <Label htmlFor="r1">Client</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="affiliate" id="r2" />
                <Label htmlFor="r2">Affiliate</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="business" id="r3" />
                <Label htmlFor="r3">Business</Label>
              </div>
            </RadioGroup>
          </div>
          <Button type="submit" className="w-full">Create an account</Button>
        </div>
        <div className="mt-4 text-center text-sm">
          Already have an account?{" "}
          <Link href="/sign-in" className="underline">
            Sign in
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
