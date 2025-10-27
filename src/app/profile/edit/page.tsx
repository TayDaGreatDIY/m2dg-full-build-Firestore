
"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useUser, useFirebase, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { doc, updateDoc, collection } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { useToast } from '@/hooks/use-toast';
import { DesktopHeader } from '@/components/ui/TopNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Skeleton } from '@/components/ui/skeleton';
import UserAvatar from '@/components/ui/UserAvatar';
import { Loader2, UploadCloud } from 'lucide-react';
import type { User, Court } from '@/lib/types';

const profileFormSchema = z.object({
  displayName: z.string().min(2, "Display name must be at least 2 characters."),
  username: z.string().min(3, "Username must be at least 3 characters."),
  aboutMe: z.string().max(200, "About me must be 200 characters or less.").optional().default(''),
  homeCourtId: z.string().nonempty({ message: "Please select your home court." }),
});

export default function EditProfilePage() {
  const { user: authUser, isUserLoading: isAuthLoading } = useUser();
  const { firestore, storage } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !authUser) return null;
    return doc(firestore, 'users', authUser.uid);
  }, [firestore, authUser]);

  const { data: user, isLoading: isUserDocLoading } = useDoc<User>(userDocRef);

  const courtsQuery = useMemoFirebase(() => collection(firestore, 'courts'), [firestore]);
  const { data: courts, isLoading: areCourtsLoading } = useCollection<Court>(courtsQuery);

  const form = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      displayName: '',
      username: '',
      aboutMe: '',
      homeCourtId: '',
    },
  });

  useEffect(() => {
    if (user) {
        form.reset({
            displayName: user.displayName || '',
            username: user.username || '',
            aboutMe: user.aboutMe || '',
            homeCourtId: user.homeCourtId || '',
        });
        setAvatarPreview(user.avatarURL);
    }
  }, [user, form]);


  useEffect(() => {
    if (!isAuthLoading && !authUser) {
      router.replace('/login');
    }
  }, [isAuthLoading, authUser, router]);
  
  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };


  async function onSubmit(values: z.infer<typeof profileFormSchema>) {
    if (!authUser || !userDocRef || !courts || !storage) return;
    
    setIsSubmitting(true);

    try {
      const selectedCourt = courts.find(court => court.id === values.homeCourtId);
      if (!selectedCourt) {
        toast({ variant: "destructive", title: "Invalid Court", description: "The selected home court could not be found." });
        setIsSubmitting(false);
        return;
      }
      
      const dataToUpdate: Record<string, any> = {
          ...values,
          homeCourt: selectedCourt.name,
          city: selectedCourt.city,
      };

      if (avatarFile) {
        const avatarStorageRef = storageRef(storage, `avatars/${authUser.uid}/${avatarFile.name}`);
        const uploadResult = await uploadBytes(avatarStorageRef, avatarFile);
        dataToUpdate.avatarURL = await getDownloadURL(avatarStorageRef);
      }

      await updateDoc(userDocRef, dataToUpdate);

      toast({ title: "Profile Updated!", description: "Your changes have been saved." });
      router.push(`/player/${authUser.uid}`);

    } catch (error) {
      console.error("Error updating profile:", error);
      toast({ variant: "destructive", title: "Update Failed", description: "Could not save your changes." });
    } finally {
      setIsSubmitting(false);
    }
  }

  const isLoading = isAuthLoading || isUserDocLoading || areCourtsLoading;

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <DesktopHeader pageTitle="Edit Profile" />
        <main className="flex-1 max-w-md mx-auto w-full px-4 pb-24 space-y-6 animate-pulse">
            <Skeleton className="h-24 w-24 rounded-full mx-auto" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-10 w-full" />
        </main>
      </div>
    );
  }

  if (!user && !isUserDocLoading && !isAuthLoading) {
      return (
        <div className="flex flex-col min-h-screen">
          <DesktopHeader pageTitle="Edit Profile" />
          <main className="flex-1 flex items-center justify-center">
              <p>User profile could not be loaded.</p>
          </main>
        </div>
      )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <DesktopHeader pageTitle="Edit Profile" />
      <main className="flex-1 w-full p-4 pb-24 space-y-6 md:p-6">
        <div className="max-w-md mx-auto space-y-6">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="flex flex-col items-center gap-4">
                        <UserAvatar src={avatarPreview || ''} name={user?.displayName || ''} size={96} />
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleAvatarChange} 
                            className="hidden" 
                            accept="image/png, image/jpeg" 
                        />
                        <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isSubmitting}>
                           <UploadCloud size={16} /> Upload Photo
                        </Button>
                    </div>

                    <FormField control={form.control} name="displayName" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Display Name</FormLabel>
                            <FormControl><Input {...field} disabled={isSubmitting} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}/>
                    <FormField control={form.control} name="username" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl><Input {...field} disabled={isSubmitting} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}/>
                    <FormField control={form.control} name="aboutMe" render={({ field }) => (
                        <FormItem>
                            <FormLabel>About Me</FormLabel>
                            <FormControl><Textarea placeholder="What's your game like?" {...field} disabled={isSubmitting} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}/>
                    <FormField control={form.control} name="homeCourtId" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Home Court</FormLabel>
                             <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select your home court" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {courts?.map(court => (
                                        <SelectItem key={court.id} value={court.id}>{court.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}/>
                    
                    <Button type="submit" className="w-full" disabled={isSubmitting || (!form.formState.isDirty && !avatarFile)}>
                        {isSubmitting ? <Loader2 className="animate-spin" /> : 'Save Changes'}
                    </Button>
                </form>
            </Form>
        </div>
      </main>
    </div>
  );
}
