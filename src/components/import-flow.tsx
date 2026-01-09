"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useToast } from "./toast";
import styles from "./import-flow.module.css";

type ImportFlowProps = {
  initialUrl?: string;
  initialTitle?: string;
  autoStart?: boolean;
  variant?: "panel" | "standalone";
};

type ImportResponse = {
  recipe?: {
    id: string;
    title: string | null;
    sourceUrl: string;
    sourcePlatform: "INSTAGRAM" | "TIKTOK" | "UNKNOWN";
  };
  extraction?: {
    status: "success" | "partial" | "failed";
    warnings?: string[];
  };
  existingRecipe?: {
    id: string;
    title: string | null;
  };
  error?: string;
};

type ProgressState = "pending" | "active" | "complete" | "error";

const progressSteps = [
  "Validate link",
  "Fetch post text",
  "Parse ingredients",
  "Save recipe",
];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default function ImportFlow({
  initialUrl,
  initialTitle,
  autoStart,
  variant = "panel",
}: ImportFlowProps) {
  const router = useRouter();
  const { pushToast } = useToast();
  const [url, setUrl] = useState(initialUrl ?? "");
  const [title, setTitle] = useState(initialTitle ?? "");
  const [status, setStatus] = useState<
    "idle" | "running" | "success" | "error"
  >("idle");
  const [stepIndex, setStepIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResponse | null>(null);

  const stepStates = useMemo(() => {
    return progressSteps.map((_, index): ProgressState => {
      if (status === "idle") {
        return "pending";
      }

      if (status === "running") {
        if (index < stepIndex) {
          return "complete";
        }

        return index === stepIndex ? "active" : "pending";
      }

      if (status === "success") {
        return "complete";
      }

      if (index < stepIndex) {
        return "complete";
      }

      return index === stepIndex ? "error" : "pending";
    });
  }, [status, stepIndex]);

  const resetState = () => {
    setStatus("idle");
    setStepIndex(0);
    setError(null);
    setResult(null);
    setUrl("");
    setTitle("");
  };

  const handleImport = useCallback(async () => {
    if (!url.trim()) {
      setError("Paste an Instagram or TikTok link to continue.");
      return;
    }

    setError(null);
    setStatus("running");
    setResult(null);
    setStepIndex(0);

    try {
      setStepIndex(0);
      await sleep(120);
      setStepIndex(1);
      await sleep(160);

      const response = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, title }),
      });

      const data = (await response.json().catch(() => ({}))) as ImportResponse;

      setStepIndex(2);
      await sleep(140);
      setStepIndex(3);

      if (!response.ok || !data.recipe) {
        setStatus("error");
        setError(data.error ?? "Unable to import that recipe right now.");
        setResult(data);
        return;
      }

      setStatus("success");
      setResult(data);

      if (data.extraction?.status === "success") {
        pushToast({
          title: "Import complete",
          message: "Recipe details were extracted and saved.",
          tone: "success",
        });
      } else {
        pushToast({
          title: "Import saved",
          message: "Extraction needs a quick manual check.",
          tone: "info",
        });
      }

      router.refresh();
    } catch {
      setStatus("error");
      setError("Unable to import that recipe right now.");
    }
  }, [pushToast, router, title, url]);

  useEffect(() => {
    if (autoStart && url && status === "idle") {
      handleImport();
    }
  }, [autoStart, url, status, handleImport]);

  return (
    <section
      className={
        variant === "standalone" ? styles.standalonePanel : styles.panel
      }
    >
      <div className={styles.header}>
        <div>
          <h1>Import a recipe</h1>
          <p>Paste the link and we will extract ingredients and steps.</p>
        </div>
        <span className={styles.helperPill}>Instagram + TikTok</span>
      </div>

      <form
        className={styles.form}
        onSubmit={(event) => {
          event.preventDefault();
          handleImport();
        }}
      >
        <label className={styles.field}>
          <span>Recipe URL</span>
          <input
            type="url"
            name="url"
            value={url}
            onChange={(event) => {
              setUrl(event.target.value);
              if (error) {
                setError(null);
              }
            }}
            placeholder="https://www.instagram.com/p/..."
            required
            className={styles.input}
          />
        </label>
        <label className={styles.field}>
          <span>Title (optional)</span>
          <input
            type="text"
            name="title"
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              if (error) {
                setError(null);
              }
            }}
            placeholder="Weeknight chili crunch noodles"
            className={styles.input}
          />
        </label>
        <div className={styles.actions}>
          <button
            type="submit"
            className={styles.primaryButton}
            disabled={status === "running"}
          >
            {status === "running" ? "Importing..." : "Start import"}
          </button>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={resetState}
            disabled={status === "running"}
          >
            Clear
          </button>
        </div>
      </form>

      {error ? (
        <div className={styles.error} role="alert">
          {error}
        </div>
      ) : null}

      {status !== "idle" ? (
        <div className={styles.progress}>
          <h2>Import progress</h2>
          <div className={styles.progressList}>
            {progressSteps.map((step, index) => (
              <div
                key={step}
                className={styles.progressStep}
                data-state={stepStates[index]}
              >
                <span className={styles.stepBadge}>{index + 1}</span>
                <span>{step}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {status === "success" && result?.recipe ? (
        <div className={styles.successCard}>
          <div>
            <h3>Recipe saved</h3>
            <p>
              {result.extraction?.status === "success"
                ? "Everything looks good."
                : "Extraction may need a quick cleanup."}
            </p>
            {result.extraction?.warnings?.length ? (
              <ul className={styles.warningList}>
                {result.extraction.warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            ) : null}
          </div>
          <div className={styles.successActions}>
            <Link
              href={`/app/recipes/${result.recipe.id}`}
              className={styles.secondaryButton}
            >
              View recipe
            </Link>
            <Link
              href={`/app/recipes/${result.recipe.id}/edit`}
              className={styles.primaryButton}
            >
              Edit details
            </Link>
          </div>
        </div>
      ) : null}

      {status === "error" ? (
        <div className={styles.errorCard}>
          <div>
            <h3>Import failed</h3>
            <p>
              {result?.existingRecipe
                ? "That link is already in your library."
                : "We could not pull recipe details from that link."}
            </p>
          </div>
          <div className={styles.successActions}>
            {result?.existingRecipe ? (
              <Link
                href={`/app/recipes/${result.existingRecipe.id}`}
                className={styles.secondaryButton}
              >
                Open saved recipe
              </Link>
            ) : null}
            {!result?.existingRecipe ? (
              <button
                type="button"
                className={styles.primaryButton}
                onClick={handleImport}
                disabled={status === "running"}
              >
                Try again
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
