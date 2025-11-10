
"use client";

import { useMemo, useState, useEffect } from "react";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import type { Challenge } from "@/lib/types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/firebase";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription, VisuallyHidden } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { PlusCircle, Edit, Trash2, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";


const challengeSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  rewardXP: z.coerce.number().min(0, "XP must be a positive number"),
  approved: z.boolean().default(false),
  featured: z.boolean().default(false),
});

async function logAdminAction(firestore: any, user: any, action: string, targetType: string, targetId: string) {
    if (!firestore || !user) return;
    try {
        await addDoc(collection(firestore, "admin_logs"), {
            action,
            targetType,
            targetId,
            performedBy: user.email,
            timestamp: serverTimestamp(),
        });
    } catch (error) {
        console.error("Error logging admin action:", error);
    }
}

export default function AdminChallenges() {
  const firestore = useFirestore();
  const { user: adminUser } = useUser();

  const challengesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'challenges');
  }, [firestore]);
  const { data: challenges, isLoading } = useCollection<Challenge>(challengesQuery);
  
  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h2 className="text-xl font-bold font-headline">Manage Challenges</h2>
            <p className="text-white/60 text-sm">Create, edit, and approve community challenges.</p>
        </div>
        <ChallengeFormDialog
          trigger={<Button size="sm"><PlusCircle size={16} /> Add Challenge</Button>}
          onFormSubmit={(action, challengeId) => logAdminAction(firestore, adminUser, action, 'challenge', challengeId)}
        />
      </div>

      <div className="bg-card border border-white/10 rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>XP Reward</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Featured</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(3)].map((_, i) => (
                <TableRow key={`challenge-skeleton-${i}`}>
                  <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : challenges && challenges.length > 0 ? (
              challenges.map((challenge) => (
                <TableRow key={challenge.id}>
                  <TableCell className="font-medium">{challenge.title}</TableCell>
                  <TableCell>{challenge.rewardXP}</TableCell>
                  <TableCell>
                    <Badge variant={challenge.approved ? "secondary" : "destructive"}>
                      {challenge.approved ? 'Approved' : 'Pending'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {challenge.featured ? <Badge variant="gold">Yes</Badge> : 'No'}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <ChallengeFormDialog
                        challenge={challenge}
                        trigger={<Button variant="outline" size="icon" aria-label="Edit Challenge"><Edit size={16} /></Button>}
                        onFormSubmit={(action, id) => logAdminAction(firestore, adminUser, action, 'challenge', id)}
                    />
                    <DeleteChallengeDialog challengeId={challenge.id} challengeTitle={challenge.title} 
                        onDelete={() => logAdminAction(firestore, adminUser, "delete", "challenge", challenge.id)}
                    />
                  </TableCell>
                </TableRow>
              ))
            ) : (
                <TableRow>
                    <TableCell colSpan={5} className="text-center h-24">No challenges found.</TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function ChallengeFormDialog({ trigger, challenge, onFormSubmit }: { trigger: React.ReactNode, challenge?: Challenge, onFormSubmit: (action: string, id: string) => void }) {
    const firestore = useFirestore();
    const { user: adminUser } = useUser();
    const { toast } = useToast();
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const form = useForm<z.infer<typeof challengeSchema>>({
      resolver: zodResolver(challengeSchema),
    });
    
    useEffect(() => {
        if(isOpen) {
            form.reset(challenge || { title: "", description: "", rewardXP: 100, approved: false, featured: false });
        }
    }, [isOpen, challenge, form]);
    
    const onSubmit = async (values: z.infer<typeof challengeSchema>) => {
      setIsSubmitting(true);
      try {
        if (challenge) {
          const challengeRef = doc(firestore, "challenges", challenge.id);
          await updateDoc(challengeRef, values);
          toast({ title: "Challenge Updated!", description: `${values.title} has been updated.` });
          onFormSubmit('update', challenge.id);
        } else {
          const newDocRef = await addDoc(collection(firestore, "challenges"), {
              ...values,
              createdBy: adminUser?.uid || 'admin',
              createdAt: serverTimestamp(),
          });
          toast({ title: "Challenge Added!", description: `${values.title} has been added.` });
          onFormSubmit('create', newDocRef.id);
        }
        setIsOpen(false);
      } catch (error) {
        console.error("Error saving challenge:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not save challenge." });
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-card border-white/10">
                 <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <DialogHeader>
                          <DialogTitle>{challenge ? 'Edit Challenge' : 'Add New Challenge'}</DialogTitle>
                           <DialogDescription>
                                {challenge ? 'Update the details for this challenge.' : 'Fill in the details for the new challenge.'}
                           </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
                            <FormField control={form.control} name="title" render={({ field }) => (
                                <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                            <FormField control={form.control} name="description" render={({ field }) => (
                                <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                            <FormField control={form.control} name="rewardXP" render={({ field }) => (
                                <FormItem><FormLabel>XP Reward</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                             <FormField control={form.control} name="approved" render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 bg-background"><FormLabel>Approved</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>
                            )}/>
                            <FormField control={form.control} name="featured" render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 bg-background"><FormLabel>Featured</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>
                            )}/>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="animate-spin" /> : 'Save'}
                            </Button>
                        </DialogFooter>
                    </form>
                 </Form>
            </DialogContent>
        </Dialog>
    );
}

function DeleteChallengeDialog({ challengeId, challengeTitle, onDelete }: { challengeId: string; challengeTitle: string, onDelete: () => void }) {
    const firestore = useFirestore();
    const { toast } = useToast();

    const handleDelete = async () => {
        try {
            await deleteDoc(doc(firestore, "challenges", challengeId));
            toast({ title: "Challenge Deleted", description: "The challenge has been removed." });
            onDelete();
        } catch (error) {
            console.error("Error deleting challenge:", error);
            toast({ variant: "destructive", title: "Error", description: "Could not delete challenge." });
        }
    };
    
    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="destructive" size="icon" aria-label="Delete Challenge"><Trash2 size={16} /></Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will permanently delete "{challengeTitle}". This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

    