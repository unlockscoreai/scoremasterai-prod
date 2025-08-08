'use client';
import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Download,
  Lock,
  MailCheck,
  Send,
  ShieldCheck,
  Loader2,
  CheckCircle,
  Zap,
} from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { sendLetterForMailing } from './actions';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';

export type Letter = {
  id: string;
  title: string;
  date: string;
  status: 'Awaiting Approval' | 'Mailed';
};

type SubscriptionTier = 'starter' | 'pro' | 'vip';

function SubscriptionSimulator({
  subscription,
  setSubscription,
}: {
  subscription: SubscriptionTier;
  setSubscription: (tier: SubscriptionTier) => void;
}) {
  return (
    <Card className="mb-6 bg-secondary border-dashed">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Subscription Simulator</CardTitle>
        <CardDescription>
          Use this to see how this page changes for different subscription tiers.
          This is for demo purposes only.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup
          value={subscription}
          onValueChange={(value) => setSubscription(value as SubscriptionTier)}
          className="flex items-center gap-6"
        >
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
  );
}



export default function LettersPage() {
  const [subscription, setSubscription] = useState<SubscriptionTier>('pro');
  const [mailingStatus, setMailingStatus] = useState<Record<string, 'idle' | 'loading' | 'sent'>>({});
  const [letters, setLetters] = useState<Letter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch letters
        const response = await fetch('/api/user/letters'); // Replace with your actual endpoint
        if (!response.ok) {
          throw new Error(`Error fetching letters: ${response.statusText}`);
        }
        const lettersData = await response.json();
        setLetters(lettersData);

        // Fetch subscription status
        setSubscriptionLoading(true);
        const subscriptionResponse = await fetch('/api/user/subscription'); // Replace with your actual endpoint
        if (!subscriptionResponse.ok) {
            throw new Error(`Error fetching subscription: ${subscriptionResponse.statusText}`);
        }
        const subscriptionData = await subscriptionResponse.json();
        setSubscription(subscriptionData.tier as SubscriptionTier);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
        setSubscriptionLoading(false);
      }
    };

    fetchLetters();
  }, []);

  const [autoDispute, setAutoDispute] = useState(false);
  const { toast } = useToast();

  const handleMailLetter = async (letterId: string, title: string) => {
    setMailingStatus(prev => ({...prev, [letterId]: 'loading'}));
    try {
        await sendLetterForMailing({letterId, title});
        toast({
            title: "Letter Sent!",
            description: `"${title}" has been sent for certified mailing.`
        });
        setMailingStatus(prev => ({...prev, [letterId]: 'sent'}));
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Mailing Failed",
            description: "Could not send letter for mailing. Please try again."
        });
        setMailingStatus(prev => ({...prev, [letterId]: 'idle'}));
    }
  }



  const isSubscribed = subscription === 'pro' || subscription === 'vip';

  return (
    <div className="space-y-6">
      <SubscriptionSimulator
        subscription={subscription}
        setSubscription={setSubscription}
        />
      {isSubscribed ? (
        <>
        <Card>
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2"><Zap className="w-5 h-5 text-primary"/> Automation Settings</CardTitle>
                <CardDescription>Enable auto-disputes to have new letters sent automatically as soon as they are generated.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center space-x-3">
                    <Switch id="auto-dispute-toggle" checked={autoDispute} onCheckedChange={setAutoDispute} aria-label="Automated Disputes Toggle"/>
                    <Label htmlFor="auto-dispute-toggle">Automated Disputes</Label>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                    {autoDispute ? "Automatic mailing is active. You can turn this off to approve letters manually." : "Turn this on to have us mail your letters for you automatically."}
                </p>
            </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">My Letters</CardTitle>
            <CardDescription>
              Review your generated letters here. {autoDispute ? 'Automated mailing is active.' : 'Approve letters to send them for mailing.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {mockLetters.map((letter) => {
              const isMailedManually = mailingStatus[letter.id] === 'sent';
              const isMailedAutomatically = letter.status === 'Awaiting Approval' && autoDispute;
              const isAlreadyMailed = letter.status === 'Mailed';
              const showAsMailed = isMailedManually || isMailedAutomatically || isAlreadyMailed;

              return (
              <Card key={letter.id} className="flex flex-col md:flex-row items-start md:items-center p-4 gap-4">
                <div className="flex-1">
                  <p className="font-semibold">{letter.title}</p>
                  <p className="text-sm text-muted-foreground">
                    Generated on {letter.date}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant={showAsMailed ? 'default' : 'secondary'}>
                        {showAsMailed ? (isMailedAutomatically ? 'Mailed Automatically' : 'Mailed') : letter.status}
                    </Badge>
                    
                    {!showAsMailed ? (
                        <Button
                          size="sm"
                          onClick={() => handleMailLetter(letter.id, letter.title)}
                          disabled={mailingStatus[letter.id] === 'loading'}
                        >
                            {mailingStatus[letter.id] === 'loading' ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Send className="mr-2 h-4 w-4" />
                            )}
                          Approve & Mail
                        </Button>
                    ) : (
                         <Button size="sm" variant="outline" disabled>
                            <MailCheck className="mr-2 h-4 w-4" /> Mailed
                        </Button>
                    )}
                </div>
              </Card>
            )})}
          </CardContent>
        </Card>
        </>
      ) : (
        <Card className="text-center p-10 flex flex-col items-center">
          <div className="p-4 bg-primary/10 rounded-full mb-4">
            <Lock className="w-10 h-10 text-primary" />
          </div>
          <CardTitle className="font-headline text-2xl">
            Automate Your Mailings
          </CardTitle>
          <CardDescription className="mt-2 mb-6 max-w-md mx-auto">
            Your current plan requires you to mail letters yourself. Upgrade to
            Pro to unlock our automated certified mailing service.
          </CardDescription>
          <div className="p-6 border rounded-lg bg-background w-full max-w-sm">
            <h4 className="font-semibold text-lg text-primary flex items-center gap-2 justify-center">
              <ShieldCheck /> Pro Plan Features
            </h4>
            <ul className="text-left list-disc pl-5 mt-4 space-y-2 text-muted-foreground">
              <li>Review and approve letters in your portal.</li>
              <li>
                <strong>We handle all printing and certified mailing.</strong>
              </li>
              <li>Track mailing status and delivery automatically.</li>
              <li>Full dispute management and history.</li>
            </ul>
          </div>
          <Button size="lg" className="mt-6">
            Upgrade to Pro
          </Button>
        </Card>
      )}
    </div>
  );
}
