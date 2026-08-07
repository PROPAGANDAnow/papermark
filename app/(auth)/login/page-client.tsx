"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { useEffect, useState } from "react";

import { signIn } from "next-auth/react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Login() {
  const router = useRouter();
  const [next, setNext] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setNext(new URLSearchParams(window.location.search).get("next"));
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <form
        className="w-full max-w-sm space-y-5 rounded-lg bg-white p-8 shadow-sm"
        onSubmit={async (event) => {
          event.preventDefault();
          setSubmitting(true);
          const result = await signIn("admin-password", {
            email,
            password,
            redirect: false,
          });
          setSubmitting(false);

          if (!result?.ok) {
            toast.error("Invalid administrator email or password.");
            return;
          }

          router.push(
            next?.startsWith("/") && !next.startsWith("//")
              ? next
              : "/dashboard",
          );
        }}
      >
        <Link href="/" className="block text-2xl font-semibold text-gray-900">
          Papermark
        </Link>
        <div>
          <h1 className="text-xl font-semibold">Administrator login</h1>
          <p className="mt-1 text-sm text-gray-600">
            Sign in with your configured administrator credentials.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>
        <Button className="w-full" type="submit" loading={submitting}>
          Sign in
        </Button>
      </form>
    </main>
  );
}
