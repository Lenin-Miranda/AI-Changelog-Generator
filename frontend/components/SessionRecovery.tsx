"use client";
import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "./ui/button";
export function SessionRecovery() {
  const [expired, setExpired] = useState(false);
  useEffect(() => {
    const recover = () => setExpired(true);
    window.addEventListener("github-session-expired", recover);
    return () => window.removeEventListener("github-session-expired", recover);
  }, []);
  if (!expired) return null;
  return (
    <div
      role="alert"
      className="sticky top-0 z-50 flex flex-wrap items-center justify-center gap-3 border-b border-border bg-card p-4 text-sm"
    >
      <p>
        Your GitHub connection expired. Download any unsaved draft before
        reconnecting.
      </p>
      <Button
        size="sm"
        onClick={() => signIn("github", { callbackUrl: window.location.href })}
      >
        Reconnect GitHub
      </Button>
    </div>
  );
}
