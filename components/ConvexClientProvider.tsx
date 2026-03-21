"use client";
import { ConvexReactClient, ConvexProvider } from "convex/react";
import { useAuth } from "@clerk/nextjs";
import { useEffect, useCallback } from "react";

const convex = new ConvexReactClient(
  process.env.NEXT_PUBLIC_CONVEX_URL as string
);

function ClerkConvexAdapter({ children }: { children: React.ReactNode }) {
  const { getToken, isSignedIn } = useAuth();

  const fetchToken = useCallback(
    async ({ forceRefreshToken }: { forceRefreshToken: boolean }) => {
      try {
        const token = await getToken({
          template: "convex",
          skipCache: forceRefreshToken,
        });
        return token ?? null;
      } catch {
        return null;
      }
    },
    [getToken]
  );

  useEffect(() => {
    if (isSignedIn) {
      convex.setAuth(fetchToken);
    } else {
      convex.clearAuth();
    }
  }, [isSignedIn, fetchToken]);

  return <>{children}</>;
}

export function ConvexClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ConvexProvider client={convex}>
      <ClerkConvexAdapter>{children}</ClerkConvexAdapter>
    </ConvexProvider>
  );
}
