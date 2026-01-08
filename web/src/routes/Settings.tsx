import { useEffect, useState } from "react";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Callout } from "../components/ui/Callout";
import { TextInput } from "../components/ui/Input";
import { Section } from "../components/ui/Section";
import { useAuth } from "../lib/auth";
import { fetchMe } from "../lib/api/endpoints";
import { useApiClient } from "../lib/api/useApiClient";
import type { UserProfile } from "../lib/api/types";
import { useOnlineStatus } from "../lib/hooks/useOnlineStatus";

export function Settings() {
  const { status, login, logout, error, config } = useAuth();
  const api = useApiClient();
  const isOnline = useOnlineStatus();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (status !== "authenticated") {
      setProfile(null);
      setProfileError(null);
    }
  }, [status]);

  useEffect(() => {
    if (status !== "authenticated" || !isOnline) {
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
        const message = err instanceof Error ? err.message : "Unable to load profile.";
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
  }, [api, isOnline, status]);

  const sessionLabel =
    status === "authenticated"
      ? "Connected"
      : status === "loading"
        ? "Checking session"
        : "Not signed in";

  return (
    <div className="page stack">
      <Section
        title="Preferences"
        subtitle="Personalize how recipes and lists behave"
      >
        <div className="grid grid-2">
          <Card title="Kitchen defaults" meta="Aisle flow and pantry settings">
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
        {error && (
          <Callout title="Auth error" description={error} variant="error" />
        )}
        {!config && (
          <Callout
            title="Auth not configured"
            description="Add VITE_OIDC_ISSUER and VITE_OIDC_CLIENT_ID to enable sign-in."
            variant="warning"
          />
        )}
        {profileError && (
          <Callout
            title="Profile sync failed"
            description={profileError}
            variant="error"
          />
        )}
        <Card title="Session" meta={sessionLabel}>
          <div className="stack">
            <TextInput
              label="Name"
              placeholder="Chef in residence"
              value={profile?.name ?? ""}
              readOnly
            />
            <TextInput
              label="Email"
              placeholder="you@example.com"
              value={profile?.email ?? ""}
              readOnly
            />
            {isLoading && (
              <p className="card-meta">Loading profile details...</p>
            )}
            <div className="hero-actions">
              {status === "authenticated" ? (
                <Button variant="ghost" onClick={logout}>
                  Sign out
                </Button>
              ) : (
                <Button onClick={login} disabled={!config}>
                  Sign in
                </Button>
              )}
            </div>
          </div>
        </Card>
      </Section>
    </div>
  );
}
