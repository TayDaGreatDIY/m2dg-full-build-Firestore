
"use client";

import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, VisuallyHidden } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type CheckInVerificationModalProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onVerify: (code: string) => Promise<void>;
  userEmail: string;
};

export default function CheckInVerificationModal({ isOpen, onOpenChange, onVerify, userEmail }: CheckInVerificationModalProps) {
  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const { toast } = useToast();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCountdown(60);
      timerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setCode("");
      setIsVerifying(false);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen]);
  
  const handleResendCode = () => {
    // Placeholder: In a real app, this would trigger a backend function.
    toast({ title: "Code Resent", description: "A new verification code has been sent." });
    setCountdown(60);
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleVerificationSubmit = async () => {
    if (code.length !== 6) {
      toast({ variant: "destructive", title: "Invalid Code", description: "Please enter a 6-digit code." });
      return;
    }
    setIsVerifying(true);
    await onVerify(code);
    setIsVerifying(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-card border-white/10">
        <DialogHeader>
          <DialogTitle className="font-headline text-gold">Verify Your Check-In</DialogTitle>
          <DialogDescription>
            For security, please enter the 6-digit code sent to {userEmail}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Input
            id="verification-code"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder="123456"
            maxLength={6}
            className="text-center text-2xl font-bold tracking-[0.5em] bg-background"
            disabled={isVerifying}
          />
           <div className="text-center text-sm">
            <Button 
                variant="link" 
                onClick={handleResendCode}
                disabled={countdown > 0}
                className="text-white/50 disabled:text-white/20"
            >
                Resend code {countdown > 0 ? `in ${countdown}s` : ""}
            </Button>
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={isVerifying}>
            Cancel
          </Button>
          <Button onClick={handleVerificationSubmit} disabled={isVerifying || code.length !== 6}>
            {isVerifying ? <Loader2 className="animate-spin" /> : "Verify & Check In"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

    