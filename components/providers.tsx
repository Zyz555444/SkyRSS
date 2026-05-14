"use client";

import { ClerkProvider } from "@clerk/nextjs";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      afterSignOutUrl="/"
      appearance={{
        variables: {
          colorPrimary: "#0ea5e9",
          borderRadius: "0.75rem",
        },
        elements: {
          userButtonPopoverCard: "backdrop-blur-xl",
        },
      }}
    >
      {children}
    </ClerkProvider>
  );
}
