"use client";

import React, { useState } from "react";

import { toast } from "sonner";
import { mutate } from "swr";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

type RequestListSettingsCardProps = {
  dataroomId: string;
  teamId: string;
  requestListEnabled: boolean;
};

/**
 * The toggle only updates the dataroom through the authenticated team API.
 * Feature entitlement and dataroom membership are enforced again by that API;
 * this client control never grants access by itself.
 */
export function RequestListSettingsCard({
  dataroomId,
  teamId,
  requestListEnabled: initialRequestListEnabled,
}: RequestListSettingsCardProps) {
  const [requestListEnabled, setRequestListEnabled] = useState(
    initialRequestListEnabled,
  );
  const [isSaving, setIsSaving] = useState(false);

  const updateRequestListEnabled = async (enabled: boolean) => {
    setIsSaving(true);

    try {
      const response = await fetch(
        `/api/teams/${teamId}/datarooms/${dataroomId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ requestListEnabled: enabled }),
        },
      );

      if (!response.ok) {
        throw new Error("Request List settings could not be updated");
      }

      setRequestListEnabled(enabled);
      await Promise.all([
        mutate(`/api/teams/${teamId}/datarooms`),
        mutate(`/api/teams/${teamId}/datarooms?simple=true`),
        mutate(`/api/teams/${teamId}/datarooms/${dataroomId}`),
      ]);
      toast.success(`Request List ${enabled ? "enabled" : "disabled"}`);
    } catch (error) {
      console.error("Unable to update Request List setting", error);
      toast.error("Unable to update Request List setting");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Request List</CardTitle>
        <CardDescription>
          Enable a request list for this data room. Task management remains
          unavailable until its protected API is restored.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-4">
        <Label htmlFor="request-list-enabled" className="flex flex-col gap-1">
          <span>Enable Request List</span>
          <span className="text-sm font-normal text-muted-foreground">
            Show the Request List entry to authorized team members.
          </span>
        </Label>
        <Switch
          id="request-list-enabled"
          checked={requestListEnabled}
          disabled={isSaving}
          onCheckedChange={updateRequestListEnabled}
          aria-label="Enable Request List"
        />
      </CardContent>
    </Card>
  );
}
