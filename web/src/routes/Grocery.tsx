"use client";

import { useEffect, useMemo, useState } from "react";
import { SignInButton, SignUpButton, useAuth } from "@clerk/nextjs";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Callout } from "../components/ui/Callout";
import { List } from "../components/ui/List";
import { Section } from "../components/ui/Section";
import { fetchGroceryList } from "../lib/api/endpoints";
import { useApiClient } from "../lib/api/useApiClient";
import type { GroceryList, GroceryListItem } from "../lib/api/types";
import { useOnlineStatus } from "../lib/hooks/useOnlineStatus";
import { useAppDispatch } from "../lib/state/AppState";
import { formatShortTime, groupBy } from "../lib/utils";

type GroceryProps = {
  listId?: string | null;
};

export function Grocery({ listId: listIdProp }: GroceryProps) {
  const { isLoaded, isSignedIn } = useAuth();
  const api = useApiClient();
  const isOnline = useOnlineStatus();
  const dispatch = useAppDispatch();
  const [list, setList] = useState<GroceryList | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const listId =
    listIdProp ?? process.env.NEXT_PUBLIC_DEFAULT_GROCERY_LIST_ID ?? "";

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      setList(null);
      setError(null);
      setIsLoading(false);
    }
  }, [isLoaded, isSignedIn]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !listId || !isOnline) {
      return;
    }

    let isActive = true;

    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const result = await fetchGroceryList(api, listId);
        if (!isActive) {
          return;
        }
        setList(result);
        dispatch({
          type: "setLastSync",
          value: formatShortTime(new Date())
        });
      } catch (err) {
        if (!isActive) {
          return;
        }
        const message = err instanceof Error ? err.message : "Unable to load list.";
        setError(message);
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      isActive = false;
    };
  }, [api, dispatch, isLoaded, isOnline, isSignedIn, listId]);

  const groupedItems = useMemo(() => {
    if (!list?.items?.length) {
      return [] as Array<[string, GroceryListItem[]]>;
    }

    return Object.entries(
      groupBy(list.items, (item) => item.aisle ?? "Unsorted")
    ).sort(([a], [b]) => a.localeCompare(b));
  }, [list]);

  const showAuthPrompt = isLoaded && !isSignedIn;

  return (
    <div className="page stack">
      <Section title="Grocery list" subtitle="Merged from your next three recipes">
        {showAuthPrompt && (
          <Callout
            title="Sign in to sync"
            description="Connect your account to load grocery lists."
            action={
              <div className="auth-actions">
                <SignInButton />
                <SignUpButton />
              </div>
            }
          />
        )}

        {!listId && isSignedIn && (
          <Callout
            title="Choose a list to view"
            description="Set NEXT_PUBLIC_DEFAULT_GROCERY_LIST_ID or pass ?list= in the URL."
            variant="warning"
          />
        )}

        {!isOnline && (
          <Callout
            title="You're offline"
            description="Reconnect to refresh grocery list data."
            variant="warning"
          />
        )}

        {error && (
          <Callout
            title="List sync failed"
            description={error}
            variant="error"
          />
        )}

        <Card
          title={list?.title ?? "Trip ready"}
          meta={
            list?.items
              ? `${list.items.length} items across ${groupedItems.length} aisles`
              : "Waiting for grocery data"
          }
        >
          <div className="hero-actions">
            <Button>Start shopping mode</Button>
            <Button variant="ghost">Share list</Button>
          </div>
        </Card>
      </Section>

      {isLoading && (
        <Section title="Loading" subtitle="Fetching the latest list">
          <Card>
            <p className="card-meta">Syncing your grocery items...</p>
          </Card>
        </Section>
      )}

      {!isLoading && groupedItems.length === 0 && (
        <Section title="No items yet" subtitle="Once items sync, they will appear here">
          <Card>
            <p className="card-meta">
              Add recipes to generate a list and keep pantry staples organized.
            </p>
          </Card>
        </Section>
      )}

      {groupedItems.map(([aisle, items]) => (
        <Section key={aisle} title={aisle} subtitle="Tap to mark items done">
          <List
            items={items.map((item) => {
              const quantity = [item.quantity, item.unit]
                .filter(Boolean)
                .join(" ");
              const subtitle = [quantity, item.notes].filter(Boolean).join(" ");

              return {
                title: item.name,
                subtitle: subtitle || undefined,
                trailing: item.checked ? (
                  <span className="badge is-warm">Checked</span>
                ) : undefined
              };
            })}
          />
        </Section>
      ))}
    </div>
  );
}
