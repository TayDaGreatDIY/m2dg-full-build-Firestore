
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useUser, useFirestore } from "@/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { useState } from "react";
import { moderateContent } from "@/ai/flows/moderate-content-flow";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Upload, Loader2 } from "lucide-react";
import ChallengeRecorder from "@/components/challenges/ChallengeRecorder";


const formSchema = z.object({
  location: z.string().min(2, { message: "Location is required." }),
  workType: z.string({ required_error: "Please select a workout type." }),
  notes: z.string().optional(),
});

export default function TrainingForm() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      location: "",
      notes: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user || !firestore) {
      toast({ variant: "destructive", title: "Not authenticated", description: "You must be logged in to log a session." });
      return;
    }

    setIsUploading(true);

    try {
      const moderationResult = await moderateContent(values.notes || '');
      if (!moderationResult.passed) {
        toast({
          variant: "destructive",
          title: "Inappropriate Content Detected",
          description: "Please revise your notes and try again.",
        });
        setIsUploading(false);
        return;
      }
      
      let mediaURL: string | null = null;
      if (videoBlob) {
          const storage = getStorage();
          const newSessionId = user.uid + "_" + Date.now();
          const videoFileRef = storageRef(storage, `proof/${user.uid}/${newSessionId}.webm`);
          
          await uploadBytes(videoFileRef, videoBlob);
          mediaURL = await getDownloadURL(videoFileRef);
      }

      await addDoc(collection(firestore, "users", user.uid, "training_sessions"), {
        userId: user.uid,
        createdAt: serverTimestamp(),
        location: values.location,
        workType: values.workType,
        notes: values.notes || "",
        mediaURL: mediaURL,
      });

      toast({ title: "Session Logged!", description: "Your grind has been recorded." });
      form.reset();
      setVideoBlob(null); // This will also reset the recorder
    } catch (error) {
      console.error("Error logging session:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not log your session." });
    } finally {
        setIsUploading(false);
    }
  }


  return (
    <div className="bg-[var(--color-bg-card)] rounded-card border border-white/10 p-4 space-y-4">
      <h3 className="font-bold font-headline text-lg">Log a Session</h3>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white/70">Where did you hoop/train?</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., The Cage" {...field} className="bg-background"/>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="workType"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white/70">What type of work?</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Select a workout type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Drills">Drills</SelectItem>
                    <SelectItem value="Pickup">Pickup Game</SelectItem>
                    <SelectItem value="Conditioning">Conditioning</SelectItem>
                    <SelectItem value="Weights">Weights</SelectItem>
                    <SelectItem value="Recovery">Recovery</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white/70">Notes / What you worked on?</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="e.g., Worked on my left-hand finishes and off-ball movement."
                    className="resize-none bg-background"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <ChallengeRecorder onVideoRecorded={setVideoBlob} promptText="Add Video Proof (Optional)" />
        
          <Button type="submit" className="w-full" disabled={isUploading || form.formState.isSubmitting}>
            {isUploading ? <Loader2 className="animate-spin" /> : <Upload size={16} />}
            {isUploading ? 'Logging...' : 'Log Session'}
          </Button>

        </form>
      </Form>
    </div>
  );
}
