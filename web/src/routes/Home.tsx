"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { SignInButton, SignUpButton, useAuth } from "@clerk/nextjs";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Callout } from "../components/ui/Callout";
import { TextInput } from "../components/ui/Input";
import { List } from "../components/ui/List";
import { Section } from "../components/ui/Section";
import {
  createIngestJob,
  fetchIngestJob,
  retryIngestJob
} from "../lib/api/endpoints";
import { useApiClient } from "../lib/api/useApiClient";
import type { IngestJob, IngestStatus } from "../lib/api/types";
import { useOnlineStatus } from "../lib/hooks/useOnlineStatus";
import { formatRelativeTime } from "../lib/utils";

const STORAGE_KEY = "itscooked.ingestJobs.v1";
const MAX_INGEST_JOBS = 12;

const recentRecipes = [
  {
    title: "Citrus salad",
    subtitle: "Added today",
    trailing: <span className="badge">New</span>
  },
  {
    title: "Smoked paprika tofu",
    subtitle: "Parsed ingredients",
    trailing: <span className="badge">Ready</span>
  },
  {
    title: "Herb rice bowl",
    subtitle: "Queued for review",
    trailing: <span className="badge is-warm">Next</span>
  }
];

const statusConfig: Record<IngestStatus, { label: string; className: string }> = {
  queued: { label: "Queued", className: "badge is-muted" },
  processing: { label: "Processing", className: "badge is-warm" },
  ready: { label: "Ready", className: "badge" },
  error: { label: "Error", className: "badge is-error" }
};

const isActiveStatus = (status: IngestStatus) =>
  status === "queued" || status === "processing";

const formatSourceLabel = (sourceUrl?: string) => {
  if (!sourceUrl) {
    return "Recipe link";
  }

  try {
    const url = new URL(sourceUrl);
    const host = url.hostname.replace(/^www\./, "");
    if (url.pathname && url.pathname !== "/") {
      return `${host}${url.pathname}`;
    }
    return host;
  } catch {
    return sourceUrl;
  }
};

const formatJobSubtitle = (job: IngestJob) => {
  const parts: string[] = [];
  if (job.statusMessage) {
    parts.push(job.statusMessage);
  }
  const timestamp = job.updatedAt ?? job.createdAt;
  if (timestamp) {
    parts.push(formatRelativeTime(timestamp));
  }
  return parts.join(" - ");
};

const isValidHttpUrl = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

const mergeJobUpdates = (current: IngestJob[], updates: IngestJob[]) => {
  const updateMap = new Map(updates.map((job) => [job.id, job]));
  return current.map((job) => updateMap.get(job.id) ?? job);
};

const parseStoredJobs = (value: string | null): IngestJob[] => {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((item) => {
        if (!item || typeof item !== "object") {
          return null;
        }
        const record = item as Record<string, unknown>;
        const id = typeof record.id === "string" ? record.id : "";
        if (!id) {
          return null;
        }
        const status =
          typeof record.status === "string" ? record.status : "queued";
        const normalizedStatus: IngestStatus =
          status === "queued" ||
          status === "processing" ||
          status === "ready" ||
          status === "error"
            ? status
            : "queued";

        return {
          id,
          status: normalizedStatus,
          sourceUrl:
            typeof record.sourceUrl === "string" ? record.sourceUrl : undefined,
          recipeId:
            typeof record.recipeId === "string" ? record.recipeId : undefined,
          statusMessage:
            typeof record.statusMessage === "string"
              ? record.statusMessage
              : undefined,
          createdAt:
            typeof record.createdAt === "string" ? record.createdAt : undefined,
          updatedAt:
            typeof record.updatedAt === "string" ? record.updatedAt : undefined
        };
      })
      .filter(Boolean) as IngestJob[];
  } catch {
    return [];
  }
};

export function Home() {
  const { isLoaded, isSignedIn } = useAuth();
  const api = useApiClient();
  const isOnline = useOnlineStatus();
  const searchParams = useSearchParams();
  const [sourceUrl, setSourceUrl] = useState("");
  const [ingestJobs, setIngestJobs] = useState<IngestJob[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ingestError, setIngestError] = useState<string | null>(null);
  const [prefillNotice, setPrefillNotice] = useState<string | null>(null);
  const [showShortcutHelp, setShowShortcutHelp] = useState(false);
  const jobsRef = useRef(ingestJobs);
  const prefillApplied = useRef(false);
  const storedJobsLoaded = useRef(false);

  useEffect(() => {
    jobsRef.current = ingestJobs;
  }, [ingestJobs]);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (!isSignedIn) {
      storedJobsLoaded.current = false;
      setIngestJobs([]);
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, [isLoaded, isSignedIn]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || storedJobsLoaded.current) {
      return;
    }

    storedJobsLoaded.current = true;
    const stored =
      typeof window === "undefined"
        ? null
        : window.localStorage.getItem(STORAGE_KEY);
    const parsed = parseStoredJobs(stored);
    if (parsed.length) {
      setIngestJobs(parsed.slice(0, MAX_INGEST_JOBS));
    }
  }, [isLoaded, isSignedIn]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      return;
    }

    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(ingestJobs.slice(0, MAX_INGEST_JOBS))
      );
    }
  }, [ingestJobs, isLoaded, isSignedIn]);

  useEffect(() => {
    if (prefillApplied.current) {
      return;
    }
    const sharedUrl =
      searchParams?.get("ingest") ??
      searchParams?.get("url") ??
      searchParams?.get("source_url");
    if (!sharedUrl) {
      return;
    }
    prefillApplied.current = true;
    setSourceUrl(sharedUrl);
    setPrefillNotice("Shortcut link detected. Queue it to start ingestion.");
  }, [searchParams]);

  const isSignedInReady = isLoaded && isSignedIn;
  const trimmedSourceUrl = sourceUrl.trim();
  const isSourceValid =
    trimmedSourceUrl.length > 0 && isValidHttpUrl(trimmedSourceUrl);
  const hasActiveJobs = ingestJobs.some((job) => isActiveStatus(job.status));
  const canSubmit =
    isSourceValid && isOnline && isSignedInReady && !isSubmitting;

  useEffect(() => {
    if (!hasActiveJobs || !isSignedInReady || !isOnline) {
      return;
    }

    let isActive = true;

    const refresh = async () => {
      const currentJobs = jobsRef.current;
      const updates = await Promise.all(
        currentJobs.map(async (job) => {
          if (!isActiveStatus(job.status)) {
            return job;
          }
          try {
            return await fetchIngestJob(api, job.id);
          } catch {
            return job;
          }
        })
      );
      if (isActive) {
        setIngestJobs((current) => mergeJobUpdates(current, updates));
      }
    };

    void refresh();
    const intervalId = window.setInterval(refresh, 12000);

    return () => {
      isActive = false;
      window.clearInterval(intervalId);
    };
  }, [api, hasActiveJobs, isOnline, isSignedInReady]);

  const upsertJob = (job: IngestJob) => {
    setIngestJobs((current) => {
      const index = current.findIndex((item) => item.id === job.id);
      if (index === -1) {
        return [job, ...current].slice(0, MAX_INGEST_JOBS);
      }
      const next = [...current];
      next[index] = { ...current[index], ...job };
      return next.slice(0, MAX_INGEST_JOBS);
    });
  };

  const queueIngest = async () => {
    if (!isSignedInReady) {
      setIngestError("Sign in to queue recipe links.");
      return;
    }
    if (!isOnline) {
      setIngestError("Reconnect to queue a recipe link.");
      return;
    }
    if (!isSourceValid) {
      setIngestError("Enter a valid http or https URL.");
      return;
    }

    setIsSubmitting(true);
    setIngestError(null);

    try {
      const job = await createIngestJob(api, trimmedSourceUrl, "url");
      upsertJob(job);
      setSourceUrl("");
      setPrefillNotice(null);
    } catch (error) {
      setIngestError(
        error instanceof Error ? error.message : "Unable to queue ingestion."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const retryIngest = async (jobId: string) => {
    if (!isSignedInReady || !isOnline) {
      setIngestError("Reconnect and sign in to retry this import.");
      return;
    }

    setIngestError(null);

    try {
      const job = await retryIngestJob(api, jobId);
      upsertJob(job);
    } catch (error) {
      setIngestError(
        error instanceof Error ? error.message : "Unable to retry ingestion."
      );
    }
  };

  const queueCounts = ingestJobs.reduce(
    (acc, job) => {
      acc[job.status] += 1;
      return acc;
    },
    { queued: 0, processing: 0, ready: 0, error: 0 }
  );

  const inProgressCount = queueCounts.queued + queueCounts.processing;
  const importQueueMeta = inProgressCount
    ? `${inProgressCount} link${inProgressCount === 1 ? "" : "s"} in progress`
    : queueCounts.ready
      ? `${queueCounts.ready} ready to review`
      : "No imports yet";

  const importQueueBadge =
    queueCounts.error > 0 ? (
      <span className="badge is-error">{queueCounts.error} needs attention</span>
    ) : queueCounts.ready > 0 ? (
      <span className="badge">{queueCounts.ready} ready</span>
    ) : (
      <span className="badge is-muted">Idle</span>
    );

  const ingestItems = ingestJobs.map((job) => {
    const status = statusConfig[job.status];
    const subtitle = formatJobSubtitle(job);

    return {
      title: formatSourceLabel(job.sourceUrl),
      subtitle: subtitle || "Awaiting update.",
      trailing: (
        <div className="list-actions">
          {job.status === "ready" && job.recipeId && (
            <Link className="badge" href={`/recipes/${job.recipeId}`}>
              Open
            </Link>
          )}
          {job.status === "error" && (
            <button
              type="button"
              className="badge badge-action"
              onClick={() => void retryIngest(job.id)}
            >
              Retry
            </button>
          )}
          <span className={status.className}>{status.label}</span>
        </div>
      )
    };
  });

  return (
    <div className="page stack">
      <section className="hero">
        <h1 className="hero-title">Cook smarter, plan faster.</h1>
        <p className="hero-subtitle">
          Plan this week, save favorite dishes, and turn links into polished
          recipes.
        </p>
        <div className="hero-actions">
          <Link className="btn btn-primary" href="/recipes">
            Browse recipes
          </Link>
          <a className="btn btn-outline" href="#quick-ingest">
            Add recipe link
          </a>
        </div>
      </section>

      <div className="grid grid-2">
        <Card
          title="Tonight"
          meta="3 recipes queued"
          action={<span className="badge">Preview</span>}
        >
          <div className="stack">
            <p className="card-meta">
              Mediterranean bowls, citrus salad, herb rice.
            </p>
            <Button variant="ghost">Open cooking mode</Button>
          </div>
        </Card>
        <Card
          title="Import queue"
          meta={importQueueMeta}
          action={importQueueBadge}
        >
          <div className="stack">
            <p className="card-meta">Track the latest links you sent to parse.</p>
            <a className="btn btn-ghost" href="#import-queue">
              Review imports
            </a>
          </div>
        </Card>
      </div>

      <Section title="Recent recipes" subtitle="Fresh imports ready for review">
        <List items={recentRecipes} />
      </Section>

      <div id="quick-ingest">
        <Section
          title="Quick ingest"
          subtitle="Paste a URL and let the parser handle the rest"
        >
          {prefillNotice && (
            <Callout
              title="Link ready to import"
              description={prefillNotice}
            />
          )}
          {!isSignedInReady && (
            <Callout
              title="Sign in to import"
              description="Connect your account to queue recipe links."
              action={
                <div className="auth-actions">
                  <SignInButton />
                  <SignUpButton />
                </div>
              }
            />
          )}
          {!isOnline && (
            <Callout
              title="You're offline"
              description="Reconnect to queue new recipe links."
              variant="warning"
            />
          )}
          {ingestError && (
            <Callout title="Ingestion failed" description={ingestError} variant="error" />
          )}
          {sourceUrl && !isSourceValid && (
            <Callout
              title="Check the link"
              description="Enter a valid http or https URL before queueing."
              variant="warning"
            />
          )}
          <form
            className="card stack"
            onSubmit={(event) => {
              event.preventDefault();
              void queueIngest();
            }}
          >
            <TextInput
              label="Recipe link"
              placeholder="https://example.com/braised-ginger"
              helper="We will fetch, parse, and stage it for review."
              value={sourceUrl}
              onChange={(event) => setSourceUrl(event.target.value)}
              inputMode="url"
              autoCapitalize="none"
              autoCorrect="off"
            />
            <div className="hero-actions">
              <Button type="submit" disabled={!canSubmit}>
                {isSubmitting ? "Queueing..." : "Queue ingestion"}
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowShortcutHelp((current) => !current)}
              >
                {showShortcutHelp ? "Hide Shortcut tips" : "Use iOS Shortcut"}
              </Button>
            </div>
          </form>
          {showShortcutHelp && (
            <Card title="iOS Shortcut flow" meta="Share any recipe link into ItsCooked">
              <div className="stack">
                <p className="card-meta">
                  Create a Shortcut that accepts URLs from the Share Sheet and
                  opens:
                </p>
                <div className="shortcut-link">
                  <code>https://itscooked.vercel.app/?ingest=[recipe-link]</code>
                </div>
                <ol className="shortcut-steps">
                  <li>Open the Shortcuts app and create a new shortcut.</li>
                  <li>Enable "Show in Share Sheet" and accept URLs.</li>
                  <li>
                    Add a URL action with the template above, inserting the
                    Shortcut input where the recipe link should go.
                  </li>
                  <li>Use "Open URLs" to launch ItsCooked with the link prefilled.</li>
                </ol>
              </div>
            </Card>
          )}
        </Section>
      </div>

      <div id="import-queue">
        <Section
          title="Import queue"
          subtitle="Queued, processing, and ready-to-review recipes"
        >
          {ingestJobs.length === 0 ? (
            <Card>
              <p className="card-meta">
                {isSignedInReady
                  ? "No active imports yet. Queue a recipe link to start."
                  : "Sign in to see the status of your imports."}
              </p>
            </Card>
          ) : (
            <List items={ingestItems} />
          )}
        </Section>
      </div>
    </div>
  );
}
