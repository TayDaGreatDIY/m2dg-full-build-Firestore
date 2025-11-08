
"use client";

import { useMemo, useState, useEffect } from "react";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, addDoc, updateDoc, deleteDoc, doc, writeBatch, serverTimestamp } from "firebase/firestore";
import type { Court } from "@/lib/types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/firebase";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { PlusCircle, Edit, Trash2, Loader2, CheckCircle, ShieldAlert } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

const courtSchema = z.object({
  name: z.string().min(1, "Name is required"),
  city: z.string().min(1, "City is required"),
  address: z.string().min(1, "Address is required"),
  statusTag: z.string().min(1, "Status Tag is required"),
  img: z.string().url("Must be a valid URL").optional().or(z.literal('')),
  verified: z.boolean().default(false),
  flagCount: z.number().default(0),
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

export default function AdminCourts() {
  const firestore = useFirestore();
  const { user: adminUser } = useUser();
  const { toast } = useToast();

  const courtsQuery = useMemoFirebase(() => collection(firestore, 'courts'), [firestore]);
  const { data: courts, isLoading } = useCollection<Court>(courtsQuery);
  
  const sortedCourts = useMemo(() => {
    if (!courts) return [];
    return courts.slice().sort((a, b) => (b.verified ? 1 : 0) - (a.verified ? 1 : 0));
  }, [courts]);
  
  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h2 className="text-xl font-bold font-headline">Manage Courts</h2>
            <p className="text-white/60 text-sm">Add, edit, or delete court information.</p>
        </div>
        <CourtFormDialog
          trigger={<Button size="sm"><PlusCircle size={16} /> Add Court</Button>}
          onFormSubmit={(action, courtId) => logAdminAction(firestore, adminUser, action, 'court', courtId)}
        />
      </div>

      <div className="bg-card border border-white/10 rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>City</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Verified</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(3)].map((_, i) => (
                <TableRow key={`court-skeleton-${i}`}>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : sortedCourts && sortedCourts.length > 0 ? (
              sortedCourts.map((court) => (
                <TableRow key={court.id}>
                  <TableCell className="font-medium">{court.name}</TableCell>
                  <TableCell>{court.city}</TableCell>
                  <TableCell><Badge variant="secondary">{court.statusTag}</Badge></TableCell>
                   <TableCell>
                    {court.verified ? <CheckCircle className="text-green-500" /> : <ShieldAlert className="text-yellow-500" />}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <CourtFormDialog
                        court={court}
                        trigger={<Button variant="outline" size="icon"><Edit size={16} /></Button>}
                        onFormSubmit={(action, courtId) => logAdminAction(firestore, adminUser, action, 'court', courtId)}
                    />
                    <DeleteCourtDialog courtId={court.id} courtName={court.name} 
                        onDelete={() => logAdminAction(firestore, adminUser, "delete", "court", court.id)}
                    />
                  </TableCell>
                </TableRow>
              ))
            ) : (
                <TableRow>
                    <TableCell colSpan={5} className="text-center h-24">No courts found.</TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function CourtFormDialog({ trigger, court, onFormSubmit }: { trigger: React.ReactNode, court?: Court, onFormSubmit: (action: string, courtId: string) => void }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const form = useForm<z.infer<typeof courtSchema>>({
      resolver: zodResolver(courtSchema),
      defaultValues: court || { name: "", city: "", address: "", statusTag: "", img: "", verified: false, flagCount: 0 },
    });
    
    useEffect(() => {
        if(isOpen) {
            form.reset(court || { name: "", city: "", address: "", statusTag: "", img: "", verified: false, flagCount: 0 });
        }
    }, [isOpen, court, form]);
    
    const onSubmit = async (values: z.infer<typeof courtSchema>) => {
      setIsSubmitting(true);
      try {
        if (court) {
          const courtRef = doc(firestore, "courts", court.id);
          await updateDoc(courtRef, values);
          toast({ title: "Court Updated!", description: `${values.name} has been updated.` });
          onFormSubmit('update', court.id);
        } else {
          const newDocRef = await addDoc(collection(firestore, "courts"), values);
          toast({ title: "Court Added!", description: `${values.name} has been added.` });
          onFormSubmit('create', newDocRef.id);
        }
        setIsOpen(false);
      } catch (error) {
        console.error("Error saving court:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not save court." });
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
                          <VisuallyHidden><DialogTitle>{court ? 'Edit Court' : 'Add New Court'}</DialogTitle></VisuallyHidden>
                          <DialogTitle>{court ? 'Edit Court' : 'Add New Court'}</DialogTitle>
                          <DialogDescription />
                        </DialogHeader>
                        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
                            <FormField control={form.control} name="name" render={({ field }) => (
                                <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                            <FormField control={form.control} name="city" render={({ field }) => (
                                <FormItem><FormLabel>City</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                             <FormField control={form.control} name="address" render={({ field }) => (
                                <FormItem><FormLabel>Address</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                            <FormField control={form.control} name="statusTag" render={({ field }) => (
                                <FormItem><FormLabel>Status Tag</FormLabel><FormControl><Input placeholder="e.g., Runs Tonight" {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                            <FormField control={form.control} name="img" render={({ field }) => (
                                <FormItem><FormLabel>Image URL</FormLabel><FormControl><Input placeholder="https://picsum.photos/..." {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                             <FormField
                                control={form.control}
                                name="verified"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-background">
                                    <div className="space-y-0.5">
                                        <FormLabel>Verified Court</FormLabel>
                                    </div>
                                    <FormControl>
                                        <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                    </FormItem>
                                )}
                            />
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

function DeleteCourtDialog({ courtId, courtName, onDelete }: { courtId: string; courtName: string, onDelete: () => void; }) {
    const firestore = useFirestore();
    const { toast } = useToast();

    const handleDelete = async () => {
        try {
            await deleteDoc(doc(firestore, "courts", courtId));
            toast({ title: "Court Deleted", description: "The court has been removed." });
            onDelete();
        } catch (error) {
            console.error("Error deleting court:", error);
            toast({ variant: "destructive", title: "Error", description: "Could not delete court." });
        }
    };
    
    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="destructive" size="icon"><Trash2 size={16} /></Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will permanently delete "{courtName}". This action cannot be undone.
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
