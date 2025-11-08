
"use client";

import { useMemo, useState, useEffect } from "react";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy } from "firebase/firestore";
import type { Competition, Court } from "@/lib/types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/firebase";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { PlusCircle, Edit, Trash2, Loader2, CalendarIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

const competitionSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  prize: z.string().min(1, "Prize is required"),
  courtId: z.string().min(1, "Court is required"),
  date: z.date({ required_error: "A date is required." }),
  approved: z.boolean().default(false),
  status: z.enum(['Pending', 'Approved', 'Completed']).default('Pending'),
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

export default function AdminCompetitions() {
  const firestore = useFirestore();
  const { user: adminUser } = useUser();

  const competitionsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'competitions'), orderBy('date', 'desc'));
  }, [firestore]);
  const { data: competitions, isLoading } = useCollection<Competition>(competitionsQuery);
  
  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h2 className="text-xl font-bold font-headline">Manage Competitions</h2>
            <p className="text-white/60 text-sm">Approve, edit, and manage all competitions.</p>
        </div>
        <CompetitionFormDialog
          trigger={<Button size="sm"><PlusCircle size={16} /> Add Competition</Button>}
          onFormSubmit={(action, compId) => logAdminAction(firestore, adminUser, action, 'competition', compId)}
        />
      </div>

      <div className="bg-card border border-white/10 rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Prize</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(3)].map((_, i) => (
                <TableRow key={`competition-skeleton-${i}`}>
                  <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : competitions && competitions.length > 0 ? (
              competitions.map((comp) => (
                <TableRow key={comp.id}>
                  <TableCell className="font-medium">{comp.title}</TableCell>
                  <TableCell>{comp.date ? format(comp.date.toDate(), 'PPP') : 'N/A'}</TableCell>
                  <TableCell>{comp.prize}</TableCell>
                  <TableCell>
                    <Badge variant={
                      comp.status === 'Approved' ? "secondary"
                      : comp.status === 'Completed' ? 'outline'
                      : 'destructive'
                    }>
                      {comp.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <CompetitionFormDialog
                        competition={comp}
                        trigger={<Button variant="outline" size="icon"><Edit size={16} /></Button>}
                        onFormSubmit={(action, id) => logAdminAction(firestore, adminUser, action, 'competition', id)}
                    />
                    <DeleteCompetitionDialog competitionId={comp.id} competitionTitle={comp.title} 
                        onDelete={() => logAdminAction(firestore, adminUser, "delete", "competition", comp.id)}
                    />
                  </TableCell>
                </TableRow>
              ))
            ) : (
                <TableRow>
                    <TableCell colSpan={5} className="text-center h-24">No competitions found.</TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function CompetitionFormDialog({ trigger, competition, onFormSubmit }: { trigger: React.ReactNode, competition?: Competition, onFormSubmit: (action: string, id: string) => void }) {
    const firestore = useFirestore();
    const { user: adminUser } = useUser();
    const { toast } = useToast();
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const courtsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'courts');
    }, [firestore]);
    const { data: courts } = useCollection<Court>(courtsQuery);
    
    const form = useForm<z.infer<typeof competitionSchema>>({
      resolver: zodResolver(competitionSchema),
    });
    
    useEffect(() => {
        if(isOpen) {
            const defaultValues = competition 
                ? { ...competition, date: competition.date.toDate() } 
                : { title: "", description: "", prize: "", courtId: "", date: new Date(), approved: false, status: 'Pending' as const };
            form.reset(defaultValues);
        }
    }, [isOpen, competition, form]);
    
    const onSubmit = async (values: z.infer<typeof competitionSchema>) => {
      setIsSubmitting(true);
      try {
        const dataToSave = { ...values, status: values.approved ? 'Approved' : 'Pending' };

        if (competition) {
          const compRef = doc(firestore, "competitions", competition.id);
          await updateDoc(compRef, dataToSave);
          toast({ title: "Competition Updated!", description: `${values.title} has been updated.` });
          onFormSubmit('update', competition.id);
        } else {
          const newDocRef = await addDoc(collection(firestore, "competitions"), {
              ...dataToSave,
              organizerId: adminUser?.uid || 'admin',
              participants: [],
          });
          toast({ title: "Competition Added!", description: `${values.title} has been added.` });
          onFormSubmit('create', newDocRef.id);
        }
        setIsOpen(false);
      } catch (error) {
        console.error("Error saving competition:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not save competition." });
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent className="sm:max-w-md bg-card border-white/10">
                 <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <DialogHeader>
                            <DialogTitle>{competition ? 'Edit Competition' : 'Add New Competition'}</DialogTitle>
                             <VisuallyHidden>
                              <DialogDescription>
                                {competition ? 'Update the details for this competition.' : 'Fill in the details for the new competition.'}
                              </DialogDescription>
                           </VisuallyHidden>
                        </DialogHeader>
                        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
                            <FormField control={form.control} name="title" render={({ field }) => (
                                <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                             <FormField control={form.control} name="description" render={({ field }) => (
                                <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                            <FormField control={form.control} name="prize" render={({ field }) => (
                                <FormItem><FormLabel>Prize</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                            <FormField control={form.control} name="courtId" render={({ field }) => (
                                <FormItem><FormLabel>Court</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Select a court" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        {courts?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <FormMessage /></FormItem>
                            )}/>
                            <FormField control={form.control} name="date" render={({ field }) => (
                                <FormItem className="flex flex-col"><FormLabel>Date</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                        <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage /></FormItem>
                            )}/>
                             <FormField control={form.control} name="approved" render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 bg-background"><FormLabel>Approved</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>
                            )}/>
                            <FormField control={form.control} name="status" render={({ field }) => (
                                <FormItem><FormLabel>Status</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="Pending">Pending</SelectItem>
                                        <SelectItem value="Approved">Approved</SelectItem>
                                        <SelectItem value="Completed">Completed</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage /></FormItem>
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

function DeleteCompetitionDialog({ competitionId, competitionTitle, onDelete }: { competitionId: string; competitionTitle: string, onDelete: () => void }) {
    const firestore = useFirestore();
    const { toast } = useToast();

    const handleDelete = async () => {
        try {
            await deleteDoc(doc(firestore, "competitions", competitionId));
            toast({ title: "Competition Deleted", description: "The competition has been removed." });
            onDelete();
        } catch (error) {
            console.error("Error deleting competition:", error);
            toast({ variant: "destructive", title: "Error", description: "Could not delete competition." });
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
                        This will permanently delete "{competitionTitle}". This action cannot be undone.
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
