import React from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type RequestListViewProps = {
  dataroomId: string;
};

/**
 * The task-management API is not present in this worktree. Render an explicit,
 * non-interactive state rather than exposing controls that could imply task
 * access or attempt unauthenticated mutations. The surrounding dataroom page
 * remains protected by the existing team and dataroom authorization flow.
 */
export function RequestListView(_props: RequestListViewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Request List is not available</CardTitle>
        <CardDescription>
          Task management is temporarily unavailable while its protected API is
          being restored.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          No request-list data has been loaded or changed. Existing tasks and
          assignments remain untouched.
        </p>
      </CardContent>
    </Card>
  );
}
