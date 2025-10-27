
"use client";

import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { useUser, useFirestore } from "@/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { challenges } from "@/lib/challengeData";
import { Button } from "@/components/ui/button";
import { DesktopHeader } from "@/components/ui/TopNav";
import { ChevronLeft, Loader2, Upload, Youtube } from "lucide-react";
import Link from "next/link";
import ChallengeRecorder from "@/components/challenges/ChallengeRecorder";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { moderateContent } from "@/ai/flows/moderate-content-flow";
import { Checkbox } from "@/components/ui/checkbox";


const challengeSubmissionSchema = z.object({
  notes: z.string().optional(),
  youtubeConsent: z.boolean().default(false).optional(),
});

export default function ChallengeAttemptPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();

  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const challengeId = params.challengeId as string;
  const challenge = challenges.find((c) => c.id === challengeId);

  const form = useForm<z.infer<typeof challengeSubmissionSchema>>({
    resolver: zodResolver(challengeSubmissionSchema),
    defaultValues: {
      notes: "",
      youtubeConsent: false,
    },
  });

  async function onSubmit(values: z.infer<typeof challengeSubmissionSchema>) {
    if (!user || !firestore) {
      toast({ variant: "destructive", title: "Not authenticated" });
      return;
    }
    if (!videoBlob) {
      toast({ variant: "destructive", title: "No Video Proof", description: "Please record a video for your attempt." });
      return;
    }
    if (!challenge) {
        toast({ variant: "destructive", title: "Challenge not found" });
        return;
    }

    setIsSubmitting(true);
    
    try {
        const moderationResult = await moderateContent(values.notes || '');
        if (!moderationResult.passed) {
          toast({
            variant: "destructive",
            title: "Inappropriate Content Detected",
            description: "Please revise your notes to comply with our community guidelines.",
          });
          setIsSubmitting(false);
          return;
        }

        const storage = getStorage();
        const attemptId = `${user.uid}_${challenge.id}_${Date.now()}`;
        const videoFileRef = storageRef(storage, `challenges/${user.uid}/${attemptId}.webm`);
        
        await uploadBytes(videoFileRef, videoBlob);
        const mediaURL = await getDownloadURL(videoFileRef);

        await addDoc(collection(firestore, "users", user.uid, "training_sessions"), {
            userId: user.uid,
            createdAt: serverTimestamp(),
            location: `Challenge: ${challenge.title}`,
            workType: "Challenge Attempt",
            notes: values.notes || "",
            mediaURL: mediaURL,
            challengeId: challenge.id,
            youtubeConsent: values.youtubeConsent,
            status: "pending_verification"
        });

        toast({ title: "Challenge Attempt Submitted!", description: "Your proof has been sent for verification." });
        router.push("/challenges");

    } catch (error) {
        console.error("Error submitting challenge attempt:", error);
        toast({ variant: "destructive", title: "Submission Failed", description: "Could not submit your attempt." });
    } finally {
        setIsSubmitting(false);
    }
  }

  if (!challenge) {
    return (
      <div className="flex flex-col min-h-screen">
        <DesktopHeader pageTitle="Challenge Not Found" />
        <main className="flex-1 flex items-center justify-center">
          <p>This challenge could not be found.</p>
        </main>
      </div>
    );
  }

  const Icon = challenge.icon;

  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex items-center gap-4 p-3 border-b border-white/10 bg-background sticky top-0 z-20">
          <Button variant="ghost" size="icon" asChild>
                <Link href="/challenges">
                    <ChevronLeft size={20} />
                </Link>
          </Button>
          <h1 className="font-bold font-headline truncate">{challenge.title}</h1>
      </header>
      <main className="flex-1 w-full p-4 pb-24 space-y-6 md:p-6">
        <div className="max-w-md mx-auto space-y-6">
            <div className="bg-card rounded-card border border-white/10 p-6 space-y-4">
                <div className="flex items-start gap-4">
                    <Icon className="w-8 h-8 text-orange mt-1" />
                    <div>
                        <h2 className="text-xl font-bold font-headline">{challenge.title}</h2>
                        <p className="text-base text-white/60">{challenge.description}</p>
                    </div>
                </div>
                 <div className="text-sm text-white/70 p-3 rounded-md bg-background border border-white/10">
                    <h4 className="font-bold text-white/90 mb-1">Rules & Verification:</h4>
                    <p>Your video must clearly show the entire attempt from start to finish. All attempts will be reviewed before XP is awarded.</p>
                 </div>
            </div>

            <ChallengeRecorder onVideoRecorded={setVideoBlob} />

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-white/70">Notes (Optional)</FormLabel>
                            <FormControl>
                            <Textarea
                                placeholder="e.g., Took me 15 attempts for the half court shot!"
                                className="resize-none bg-background"
                                {...field}
                            />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />

                    {videoBlob && (
                        <FormField
                        control={form.control}
                        name="youtubeConsent"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-background">
                            <FormControl>
                                <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                                <FormLabel className="flex items-center gap-2">
                                <Youtube className="text-red-500"/> Feature me on YouTube!
                                </FormLabel>
                                <FormMessage />
                                <p className="text-xs text-white/50">
                                    I agree to have this video potentially featured on M2DG's social media and YouTube channel.
                                </p>
                            </div>
                            </FormItem>
                        )}
                        />
                    )}

                    <Button type="submit" className="w-full" disabled={!videoBlob || isSubmitting}>
                        {isSubmitting ? <Loader2 className="animate-spin" /> : <Upload size={16}/>}
                        {isSubmitting ? "Submitting..." : "Submit Attempt"}
                    </Button>
                </form>
            </Form>

        </div>
      </main>
    </div>
  );
}
