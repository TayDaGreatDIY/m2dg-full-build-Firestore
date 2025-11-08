
"use client";

import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import type { AdminLog } from "@/lib/types";
import { format } from "date-fns";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";


export default function AdminLogs() {
  const firestore = useFirestore();

  const logsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'admin_logs'), orderBy('timestamp', 'desc'));
  }, [firestore]);
  const { data: logs, isLoading } = useCollection<AdminLog>(logsQuery);
  
  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h2 className="text-xl font-bold font-headline">Admin Activity Logs</h2>
            <p className="text-white/60 text-sm">A record of all administrative actions taken in the panel.</p>
        </div>
      </div>

      <div className="bg-card border border-white/10 rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Action</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Admin</TableHead>
              <TableHead>Timestamp</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={`log-skeleton-${i}`}>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                </TableRow>
              ))
            ) : logs && logs.length > 0 ? (
              logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell><Badge>{log.action.toUpperCase()}</Badge></TableCell>
                  <TableCell className="font-mono text-xs">{log.targetType}: {log.targetId}</TableCell>
                  <TableCell>{log.performedBy}</TableCell>
                  <TableCell>{log.timestamp ? format(log.timestamp.toDate(), 'PPpp') : 'N/A'}</TableCell>
                </TableRow>
              ))
            ) : (
                <TableRow>
                    <TableCell colSpan={4} className="text-center h-24">No logs found.</TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
