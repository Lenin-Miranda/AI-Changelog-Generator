"use client";

import { Suspense } from "react";
import GenerateClient from "./GenerateClient";

export default function GeneratePage() {
  return (
    <Suspense fallback={<p className="text-muted-foreground">Loading…</p>}>
      <GenerateClient />
    </Suspense>
  );
}
