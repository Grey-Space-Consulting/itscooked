"use client";

import { useEffect, useState } from "react";
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
  useAuth,
  useUser
} from "@clerk/nextjs";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Callout } from "../components/ui/Callout";
import { TextInput } from "../components/ui/Input";
import { Section } from "../components/ui/Section";
import { fetchMe } from "../lib/api/endpoints";
import { useApiClient } from "../lib/api/useApiClient";
import type { UserProfile } from "../lib/api/types";
import { useOnlineStatus } from "../lib/hooks/useOnlineStatus";

export function Settings() {
  const { isLoaded, isSignedIn, signOut } = useAuth();
  const { user } = useUser();
  const api = useApiClient();
  const isOnline = useOnlineStatus();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      setProfile(null);
      setProfileError(null);
      setIsLoading(false);
    }
  }, [isLoaded, isSignedIn]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !isOnline) {
      return;
    }

    let isActive = true;

    const load = async () => {
      try {
        setIsLoading(true);
        setProfileError(null);
        const result = await fetchMe(api);
        if (!isActive) {
          return;
        }
        setProfile(result);
      } catch (err) {
        if (!isActive) {
          return;
        }
        const message =
          err instanceof Error ? err.message : "Unable to load profile.";
        setProfileError(message);
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
  }, [api, isLoaded, isOnline, isSignedIn]);

  const sessionLabel = !isLoaded
    ? "Checking session"
    : isSignedIn
      ? "Connected"
      : "Not signed in";

  const displayName = profile?.name ?? user?.fullName ?? "";
  const displayEmail = profile?.email ?? user?.primaryEmailAddress?.emailAddress ?? "";

  return (
    <div className="page stack">
      <Section
        title="Preferences"
        subtitle="Personalize how recipes behave"
      >
        <div className="grid grid-2">
          <Card title="Kitchen defaults" meta="Cooking defaults and units">
            <div className="stack">
              <TextInput label="Primary kitchen" placeholder="Home" />
              <TextInput label="Default units" placeholder="Metric" />
            </div>
          </Card>
          <Card title="Sync and storage" meta="Offline-first preferences">
            <div className="stack">
              <TextInput label="Cache window" placeholder="14 days" />
              <Button variant="outline">Request persistent storage</Button>
            </div>
          </Card>
        </div>
      </Section>

      <Section title="Account" subtitle="Session and security">
        <SignedOut>
          <Callout
            title="Sign in to sync"
            description="Use your Clerk account to access your saved recipes."
            action={
              <div className="auth-actions">
                <SignInButton />
                <SignUpButton />
              </div>
            }
          />
        </SignedOut>
        {profileError && (
          <Callout
            title="Profile sync failed"
            description={profileError}
            variant="error"
          />
        )}
        {!isOnline && (
          <Callout
            title="You're offline"
            description="Reconnect to update profile details."
            variant="warning"
          />
        )}
        <Card title="Session" meta={sessionLabel}>
          <div className="stack">
            <TextInput
              label="Name"
              placeholder="Chef in residence"
              value={displayName}
              readOnly
            />
            <TextInput
              label="Email"
              placeholder="you@example.com"
              value={displayEmail}
              readOnly
            />
            {isLoading && (
              <p className="card-meta">Loading profile details...</p>
            )}
            <div className="hero-actions">
              <SignedIn>
                <UserButton />
                <Button variant="ghost" onClick={() => signOut()}>
                  Sign out
                </Button>
              </SignedIn>
            </div>
          </div>
        </Card>
      </Section>
    </div>
  );
}
