"use client";

import { useMemo } from "react";
import { useAuth } from "@clerk/nextjs";
import { createApiClient } from "./client";

export function useApiClient() {
  const { getToken, isSignedIn, signOut } = useAuth();

  return useMemo(
    () =>
      createApiClient({
        getAccessToken: () => (isSignedIn ? getToken() : null),
        onUnauthorized: () => {
          if (isSignedIn) {
            void signOut();
          }
        }
      }),
    [getToken, isSignedIn, signOut]
  );
}
