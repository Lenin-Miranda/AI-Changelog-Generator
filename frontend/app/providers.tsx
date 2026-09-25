"use client";

import { SessionRecovery } from "@/components/SessionRecovery";
import { SessionProvider } from "next-auth/react";
import { LazyMotion, domMax, MotionConfig } from "motion/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <LazyMotion features={domMax} strict>
        <MotionConfig
          reducedMotion="user"
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <SessionRecovery />
          {children}
        </MotionConfig>
      </LazyMotion>
    </SessionProvider>
  );
}
