
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useUser, useFirestore } from "@/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { useState, useRef, useEffect } from "react";
import { moderateContent } from "@/ai/flows/moderate-content-flow";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Camera, Video, Upload, RotateCw, Loader2 } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";


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
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);

  useEffect(() => {
    // Cleanup function to stop tracks when component unmounts
    return () => {
        stream?.getTracks().forEach(track => track.stop());
    }
  }, [stream]);


  const handleStartRecording = async () => {
    let cameraStream: MediaStream;
    try {
        cameraStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setStream(cameraStream);
        setHasCameraPermission(true);
    } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings to record proof.',
        });
        return;
    }
      
    if (!videoRef.current) {
        toast({ variant: 'destructive', title: "Camera Error", description: "Video element is not available." });
        return;
    }
    
    videoRef.current.srcObject = cameraStream;
    
    const recorder = new MediaRecorder(cameraStream);
    mediaRecorderRef.current = recorder;
    const chunks: Blob[] = [];
    
    recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
            chunks.push(event.data);
        }
    };
    
    recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "video/webm" });
        setVideoBlob(blob);
        if (videoRef.current) {
            videoRef.current.srcObject = null;
            videoRef.current.src = URL.createObjectURL(blob);
        }
        // Stop all tracks on the stream
        cameraStream.getTracks().forEach(track => track.stop());
    };
    
    recorder.start();
    setIsRecording(true);
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };
  
  const handleRetry = () => {
      setVideoBlob(null);
      setHasCameraPermission(null);
      if(videoRef.current) {
          videoRef.current.src = "";
          videoRef.current.srcObject = null;
      }
      stream?.getTracks().forEach(track => track.stop());
      setStream(null);
  }

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

      if (!videoBlob) {
        toast({ variant: "destructive", title: "No Proof", description: "Please record a video as proof of your session."});
        setIsUploading(false);
        return;
    }

      const storage = getStorage();
      const newSessionId = user.uid + "_" + Date.now();
      const videoFileRef = storageRef(storage, `proof/${user.uid}/${newSessionId}.webm`);
      
      await uploadBytes(videoFileRef, videoBlob);
      const mediaURL = await getDownloadURL(videoFileRef);

      await addDoc(collection(firestore, "users", user.uid, "training_sessions"), {
        userId: user.uid,
        createdAt: serverTimestamp(),
        location: values.location,
        workType: values.workType,
        notes: values.notes || "",
        mediaURL: mediaURL,
      });

      toast({ title: "Session Logged!", description: "Your grind has been recorded and verified." });
      form.reset();
      handleRetry();
    } catch (error) {
      console.error("Error logging session:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not log your session." });
    } finally {
        setIsUploading(false);
    }
  }

  const showSubmit = videoBlob && !isUploading;
  const showRecordingControls = !isRecording && !videoBlob;
  const showStopRecording = isRecording;
  const showRetry = videoBlob && !isUploading;
  const showUploading = isUploading;

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

          <div className="space-y-2">
            <FormLabel className="text-white/70">Show me the grind</FormLabel>
            <div className="bg-background rounded-md aspect-video flex items-center justify-center relative overflow-hidden">
                <video ref={videoRef} className="w-full h-full object-cover" playsInline autoPlay muted loop={!!videoBlob}></video>
                {hasCameraPermission === false && (
                     <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-center p-4">
                        <Alert variant="destructive">
                            <AlertTitle>Camera Access Required</AlertTitle>
                            <AlertDescription>
                                Please allow camera access in your browser to use this feature.
                            </AlertDescription>
                        </Alert>
                    </div>
                )}
                { hasCameraPermission === null && !videoBlob && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50">
                        <Camera className="text-white/30" size={48} />
                        <p className="text-white/50 text-sm mt-2">Record a clip as proof</p>
                    </div>
                )}
            </div>
            <div className="flex gap-2 justify-center pt-2">
                {showRecordingControls && (
                    <Button type="button" variant="outline" onClick={handleStartRecording} disabled={isRecording}>
                        <Video size={16} />
                        Start Recording
                    </Button>
                )}
                {showStopRecording && (
                    <Button type="button" variant="destructive" onClick={handleStopRecording}>
                        Stop Recording
                    </Button>
                )}
                {showRetry && (
                    <Button type="button" variant="outline" onClick={handleRetry} disabled={isUploading}>
                        <RotateCw size={16} />
                        Record Again
                    </Button>
                )}
                {showSubmit && (
                    <Button type="submit" disabled={isUploading || form.formState.isSubmitting}>
                        <Upload size={16} />
                        Upload & Log Session
                    </Button>
                )}
                 {showUploading && (
                    <Button type="button" disabled>
                        <Loader2 size={16} className="animate-spin" />
                        Uploading...
                    </Button>
                )}
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}

    