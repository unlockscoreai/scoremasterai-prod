'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { UploadResponseDialog } from "@/components/client/upload-response-dialog";
import { useState } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";


import { UploadCloud, ShieldCheck, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export type Dispute = typeof allDisputes[0];
type SubscriptionTier = 'starter' | 'pro' | 'vip';

function SubscriptionSimulator({ subscription, setSubscription }: { subscription: SubscriptionTier, setSubscription: (tier: SubscriptionTier) => void }) {
  return (
    <Card className="mb-6 bg-secondary border-dashed">
        <CardHeader className="pb-4">
            <CardTitle className="text-lg">Subscription Simulator</CardTitle>
            <CardDescription>Use this to see how this page changes for different subscription tiers. This is for demo purposes only.</CardDescription>
        </CardHeader>
        <CardContent>
             <RadioGroup value={subscription} onValueChange={(value) => setSubscription(value as SubscriptionTier)} className="flex items-center gap-6">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="starter" id="r1" />
                <Label htmlFor="r1">Starter</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pro" id="r2" />
                <Label htmlFor="r2">Pro</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="vip" id="r3" />
                <Label htmlFor="r3">VIP</Label>
              </div>
            </RadioGroup>
        </CardContent>
    </Card>
  )
}


export default function DisputesPage() {
  const [subscription, setSubscription] = useState<SubscriptionTier>('pro');
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDisputes = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/disputes'); // Assuming this is your API endpoint
        if (!response.ok) {
          throw new Error(`Error fetching disputes: ${response.statusText}`);
        }
        const data: Dispute[] = await response.json();
        setDisputes(data);
      } catch (err) {
        setError((err as Error).message);
        console.error("Failed to fetch disputes:", err);
      } finally {
        setIsLoading(false);
      }
    };    fetchDisputes();
  }, []);
  const handleUploadClick = (dispute: Dispute) => {
    setSelectedDispute(dispute);
    setIsDialogOpen(true);
  };

  const isSubscribed = subscription === 'pro' || subscription === 'vip';

  return (
    <div className="space-y-6">
      <SubscriptionSimulator subscription={subscription} setSubscription={setSubscription} />
      {isSubscribed ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">My Disputes</CardTitle>
              <CardDescription>
                Track all your dispute history here and upload bureau responses for AI analysis.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHead>Bureau</TableHead>
                <TableHead>Disputed Item</TableHead>
                <TableHead>Date Submitted</TableHead>
                <TableHead>Tracking #</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>          {isLoading ? (
                  // Skeleton loading state
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-6 w-24 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : error ? (
                  // Error message
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-red-500">{error}</TableCell>
                  </TableRow>
                ) : disputes.length === 0 ? (
                  // No disputes message
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      You haven't submitted any disputes yet. Generate letters on the "My Letters" page to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  // Display disputes
                  disputes.map((dispute) => (
                    <TableRow key={dispute.id}>
                      <TableCell className="font-medium">{dispute.bureau}</TableCell>
                      <TableCell>{dispute.item}</TableCell>
                      <TableCell>{dispute.date}</TableCell>
                      <TableCell>{dispute.trackingNumber || "N/A"}</TableCell>
                      <TableCell><Badge variant={dispute.statusVariant}>{dispute.status}</Badge></TableCell>
                      <TableCell className="text-right">
                        {dispute.status !== 'Removed' && (<Button variant="outline" size="sm" onClick={() => handleUploadClick(dispute)}>Upload Response</Button>)}
                      </TableCell>
                    </TableRow>
                  ))
                )}</TableBody>
              </Table>
            </CardContent>
          </Card>
          {selectedDispute && (
            <UploadResponseDialog
                isOpen={isDialogOpen}
                setIsOpen={setIsDialogOpen}
                dispute={selectedDispute}
            />
          )}
        </>
      ) : (
        <Card className="text-center p-10 flex flex-col items-center">
            <div className="p-4 bg-primary/10 rounded-full mb-4">
                <Lock className="w-10 h-10 text-primary" />
            </div>
            <CardTitle className="font-headline text-2xl">Unlock Full Dispute Management</CardTitle>
            <CardDescription className="mt-2 mb-6 max-w-md mx-auto">
                Your current plan does not include dispute tracking or Round 2 response analysis. Upgrade to Pro to manage your entire dispute lifecycle from one place.
            </CardDescription>
            <div className="p-6 border rounded-lg bg-background w-full max-w-sm">
                <h4 className="font-semibold text-lg text-primary flex items-center gap-2 justify-center"><ShieldCheck /> Pro Plan Features</h4>
                <ul className="text-left list-disc pl-5 mt-4 space-y-2 text-muted-foreground">
                    <li>Track all your dispute statuses in real-time.</li>
                    <li>Upload bureau responses for instant AI analysis.</li>
                    <li>Receive AI-powered "next step" recommendations.</li>
                    <li>View your complete dispute history.</li>
                </ul>
            </div>
            <Button size="lg" className="mt-6">Upgrade to Pro</Button>
        </Card>
      )}
    </div>
  );
}
