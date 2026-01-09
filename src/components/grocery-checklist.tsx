"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useToast } from "./toast";
import styles from "./grocery-checklist.module.css";

type GroceryChecklistProps = {
  recipeId: string;
  title?: string | null;
  items: string[];
  editHref?: string;
};

type StoredChecklist = {
  checked: number[];
};

const STORAGE_PREFIX = "itscooked:grocery:";

const buildStorageKey = (recipeId: string) => `${STORAGE_PREFIX}${recipeId}`;

const normalizeItems = (items: string[]) =>
  items.map((item) => item.trim()).filter((item) => item.length > 0);

const buildListText = (title: string | null | undefined, items: string[]) => {
  const lines = items.map((item) => `- ${item}`).join("\n");
  const trimmedTitle = title?.trim();
  if (!trimmedTitle) {
    return lines;
  }

  return `${trimmedTitle}\n${lines}`;
};

const copyToClipboard = async (text: string): Promise<boolean> => {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return true;
  }

  if (typeof document === "undefined") {
    return false;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.top = "-1000px";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  const success = document.execCommand("copy");
  document.body.removeChild(textarea);
  return success;
};

export default function GroceryChecklist({
  recipeId,
  title,
  items,
  editHref,
}: GroceryChecklistProps) {
  const { pushToast } = useToast();
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const [canShare, setCanShare] = useState(false);
  const normalizedItems = useMemo(() => normalizeItems(items), [items]);
  const storageKey = useMemo(() => buildStorageKey(recipeId), [recipeId]);

  useEffect(() => {
    setCanShare(typeof navigator !== "undefined" && typeof navigator.share === "function");

    if (typeof window === "undefined") {
      return;
    }

    try {
      const stored = window.localStorage.getItem(storageKey);
      if (!stored) {
        return;
      }

      const parsed = JSON.parse(stored) as StoredChecklist;
      if (Array.isArray(parsed.checked)) {
        const next = parsed.checked.filter((value) => Number.isInteger(value));
        setChecked(new Set(next));
      }
    } catch {
      // Ignore malformed local state.
    }
  }, [storageKey]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      window.localStorage.setItem(
        storageKey,
        JSON.stringify({ checked: Array.from(checked) }),
      );
    } catch {
      // Ignore storage quota or unavailable errors.
    }
  }, [checked, storageKey]);

  const checkedCount = useMemo(() => {
    return normalizedItems.reduce((count, _item, index) => {
      return checked.has(index) ? count + 1 : count;
    }, 0);
  }, [checked, normalizedItems]);

  const listText = useMemo(
    () => buildListText(title ?? undefined, normalizedItems),
    [normalizedItems, title],
  );

  const handleToggle = (index: number) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const handleCopy = async () => {
    if (!normalizedItems.length) {
      pushToast({
        title: "Nothing to copy",
        message: "Add ingredients before copying a grocery list.",
        tone: "info",
      });
      return;
    }

    try {
      const success = await copyToClipboard(listText);
      if (!success) {
        throw new Error("Copy failed");
      }

      pushToast({
        title: "Copied",
        message: "Grocery list copied to your clipboard.",
        tone: "success",
      });
    } catch {
      pushToast({
        title: "Copy failed",
        message: "Unable to copy the grocery list on this device.",
        tone: "error",
      });
    }
  };

  const handleShare = async () => {
    if (!normalizedItems.length) {
      pushToast({
        title: "Nothing to share",
        message: "Add ingredients before sharing a grocery list.",
        tone: "info",
      });
      return;
    }

    if (typeof navigator === "undefined" || !navigator.share) {
      pushToast({
        title: "Sharing unavailable",
        message: "Web Share is not supported on this device.",
        tone: "info",
      });
      return;
    }

    try {
      const shareTitle = title?.trim()
        ? `${title.trim()} grocery list`
        : "Grocery list";
      await navigator.share({
        title: shareTitle,
        text: listText,
      });
      pushToast({
        title: "Shared",
        message: "Your grocery list was sent.",
        tone: "success",
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      pushToast({
        title: "Share failed",
        message: "We could not share that list right now.",
        tone: "error",
      });
    }
  };

  const handleReset = () => {
    setChecked(new Set());
    if (typeof window === "undefined") {
      return;
    }

    try {
      window.localStorage.removeItem(storageKey);
    } catch {
      // Ignore storage errors.
    }
  };

  return (
    <section className={styles.card}>
      <header className={styles.header}>
        <div>
          <h2>Grocery checklist</h2>
          <p>Generated from the ingredients list. Tap to check items off.</p>
        </div>
        <div className={styles.actions}>
          <span className={styles.countPill}>
            {checkedCount}/{normalizedItems.length || 0} checked
          </span>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={handleCopy}
          >
            Copy list
          </button>
          {canShare ? (
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={handleShare}
            >
              Share
            </button>
          ) : null}
          <button
            type="button"
            className={styles.ghostButton}
            onClick={handleReset}
            disabled={checkedCount === 0}
          >
            Reset checks
          </button>
        </div>
      </header>

      {normalizedItems.length ? (
        <div className={styles.list}>
          {normalizedItems.map((item, index) => {
            const isChecked = checked.has(index);
            return (
              <label
                key={`${index}-${item}`}
                className={styles.item}
                data-checked={isChecked ? "true" : "false"}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => handleToggle(index)}
                />
                <span className={styles.itemText}>{item}</span>
              </label>
            );
          })}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <h3>No ingredients yet</h3>
          <p>Add ingredients to generate a grocery list for this recipe.</p>
          {editHref ? (
            <Link href={editHref} className={styles.primaryButton}>
              Edit ingredients
            </Link>
          ) : null}
        </div>
      )}
    </section>
  );
}
