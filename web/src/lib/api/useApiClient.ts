import { useMemo } from "react";
import { createApiClient } from "./client";
import { useAuth } from "../auth";

export function useApiClient() {
  const { getAccessToken, handleUnauthorized } = useAuth();

  return useMemo(
    () =>
      createApiClient({
        getAccessToken,
        onUnauthorized: handleUnauthorized
      }),
    [getAccessToken, handleUnauthorized]
  );
}
