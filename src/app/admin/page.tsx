
"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminCourts from "@/components/admin/AdminCourts";
import AdminPlayers from "@/components/admin/AdminPlayers";
import AdminChallenges from "@/components/admin/AdminChallenges";
import AdminCompetitions from "@/components/admin/AdminCompetitions";
import AdminLogs from "@/components/admin/AdminLogs";

export default function AdminPage() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h2 className="text-2xl font-bold font-headline">M2DG Admin Panel</h2>
            <p className="text-white/60">Manage all application data from one place.</p>
        </div>
      </div>

      <Tabs defaultValue="courts" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
          <TabsTrigger value="courts">Courts</TabsTrigger>
          <TabsTrigger value="players">Players</TabsTrigger>
          <TabsTrigger value="challenges">Challenges</TabsTrigger>
          <TabsTrigger value="competitions">Competitions</TabsTrigger>
          <TabsTrigger value="logs">Activity Logs</TabsTrigger>
        </TabsList>
        <TabsContent value="courts">
            <AdminCourts />
        </TabsContent>
        <TabsContent value="players">
            <AdminPlayers />
        </TabsContent>
        <TabsContent value="challenges">
            <AdminChallenges />
        </TabsContent>
        <TabsContent value="competitions">
            <AdminCompetitions />
        </TabsContent>
        <TabsContent value="logs">
            <AdminLogs />
        </TabsContent>
      </Tabs>
    </div>
  );
}
