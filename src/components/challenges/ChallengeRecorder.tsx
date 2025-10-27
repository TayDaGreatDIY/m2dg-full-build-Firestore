
"use client";

import { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Camera, Video, RotateCw } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

type ChallengeRecorderProps = {
  onVideoRecorded: (blob: Blob | null) => void;
  promptText?: string;
};

export default function ChallengeRecorder({ onVideoRecorded, promptText = "Record a clip as proof" }: ChallengeRecorderProps) {
  const { toast } = useToast();
  
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);

  useEffect(() => {
    // Pass the blob up to the parent component
    onVideoRecorded(videoBlob);
  
    // Cleanup function to stop tracks when component unmounts or videoBlob changes
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoBlob]);


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
        cameraStream.getTracks().forEach(track => track.stop());
        setStream(null);
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
  
  const showRecordingControls = !isRecording && !videoBlob;
  const showStopRecording = isRecording;
  const showRetry = !!videoBlob;

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-white/70">Proof of Grind</label>
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
        {hasCameraPermission === null && !videoBlob && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50">
            <Camera className="text-white/30" size={48} />
            <p className="text-white/50 text-sm mt-2">{promptText}</p>
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
          <Button type="button" variant="outline" onClick={handleRetry}>
            <RotateCw size={16} />
            Record Again
          </Button>
        )}
      </div>
    </div>
  );
}
