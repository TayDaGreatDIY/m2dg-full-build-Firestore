"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const formSchema = z.object({
  location: z.string().min(2, { message: "Location is required." }),
  type: z.string({ required_error: "Please select a workout type." }),
  notes: z.string().optional(),
});

export default function TrainingForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      location: "",
      notes: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
    alert("Session logged (demo).");
    form.reset();
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
                name="type"
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
            <Button type="submit" className="w-full">Log Session</Button>
            </form>
        </Form>
    </div>
  );
}
