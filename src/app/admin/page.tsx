
"use client";

import { useMemo, useState } from "react";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import type { Court } from "@/lib/types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { PlusCircle, Edit, Trash2, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const courtSchema = z.object({
  name: z.string().min(1, "Name is required"),
  city: z.string().min(1, "City is required"),
  address: z.string().min(1, "Address is required"),
  statusTag: z.string().min(1, "Status Tag is required"),
  img: z.string().url("Must be a valid URL").optional().or(z.literal('')),
});

export default function AdminPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const courtsQuery = useMemoFirebase(() => collection(firestore, 'courts'), [firestore]);
  const { data: courts, isLoading } = useCollection<Court>(courtsQuery);
  
  const form = useForm<z.infer<typeof courtSchema>>({
    resolver: zodResolver(courtSchema),
    defaultValues: { name: "", city: "", address: "", statusTag: "", img: "" },
  });

  const onSubmit = async (values: z.infer<typeof courtSchema>, courtId?: string) => {
    setIsSubmitting(true);
    try {
      if (courtId) {
        // Update existing court
        const courtRef = doc(firestore, "courts", courtId);
        await updateDoc(courtRef, values);
        toast({ title: "Court Updated!", description: `${values.name} has been updated.` });
      } else {
        // Add new court
        await addDoc(collection(firestore, "courts"), values);
        toast({ title: "Court Added!", description: `${values.name} has been added.` });
        form.reset();
      }
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error saving court:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not save court." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onDelete = async (courtId: string) => {
    try {
      await deleteDoc(doc(firestore, "courts", courtId));
      toast({ title: "Court Deleted", description: "The court has been removed." });
    } catch (error) {
      console.error("Error deleting court:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not delete court." });
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h2 className="text-2xl font-bold font-headline">Manage Courts</h2>
            <p className="text-white/60">Add, edit, or delete court information.</p>
        </div>
        <CourtFormDialog
          form={form}
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
          isOpen={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          trigger={<Button><PlusCircle size={16} /> Add Court</Button>}
        />
      </div>

      <div className="bg-card border border-white/10 rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>City</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(3)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : courts?.length > 0 ? (
              courts.map((court) => (
                <TableRow key={court.id}>
                  <TableCell className="font-medium">{court.name}</TableCell>
                  <TableCell>{court.city}</TableCell>
                  <TableCell>{court.statusTag}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <CourtFormDialog
                        form={form}
                        onSubmit={(values) => onSubmit(values, court.id)}
                        isSubmitting={isSubmitting}
                        defaultValues={court}
                        trigger={<Button variant="outline" size="icon"><Edit size={16} /></Button>}
                    />
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="icon"><Trash2 size={16} /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete "{court.name}". This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => onDelete(court.id)}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))
            ) : (
                <TableRow>
                    <TableCell colSpan={4} className="text-center h-24">No courts found.</TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// Reusable Dialog Form Component
function CourtFormDialog({ form, onSubmit, isSubmitting, trigger, defaultValues, isOpen, onOpenChange }: any) {
    
    const handleOpenChange = (open: boolean) => {
        if (open) {
            form.reset(defaultValues || { name: "", city: "", address: "", statusTag: "", img: "" });
        }
        if (onOpenChange) onOpenChange(open);
    };

    const dialogProps = isOpen !== undefined ? { open: isOpen, onOpenChange: handleOpenChange } : { onOpenChange: handleOpenChange };

    return (
        <Dialog {...dialogProps}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-card border-white/10">
                 <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <DialogHeader>
                            <DialogTitle>{defaultValues ? 'Edit Court' : 'Add New Court'}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
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
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button type="button" variant="secondary">Cancel</Button>
                            </DialogClose>
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

