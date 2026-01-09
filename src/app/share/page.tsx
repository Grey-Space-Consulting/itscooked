import Link from "next/link";
import { redirect } from "next/navigation";
import styles from "./share.module.css";

type SharePageProps = {
  searchParams?: Promise<{
    url?: string;
    text?: string;
    title?: string;
  }>;
};

const extractUrl = (value: string | undefined) => {
  if (!value) {
    return undefined;
  }

  const match = value.match(/https?:\/\/[^\s]+/i);
  if (!match) {
    return undefined;
  }

  return match[0].replace(/[),.]+$/g, "");
};

export default async function SharePage({ searchParams }: SharePageProps) {
  const resolvedSearchParams = await searchParams;
  const directUrl = extractUrl(resolvedSearchParams?.url);
  const textUrl = extractUrl(
    resolvedSearchParams?.text ?? resolvedSearchParams?.title,
  );
  const url = directUrl ?? textUrl;

  if (url) {
    redirect(`/import?url=${encodeURIComponent(url)}&autostart=1`);
  }

  return (
    <div className={styles.page}>
      <section className={styles.card}>
        <h1>Share a recipe</h1>
        <p>
          We could not detect a link in that share. Copy a TikTok or Instagram
          URL and paste it below.
        </p>
        <Link href="/import" className={styles.primaryButton}>
          Paste a link
        </Link>
      </section>
    </div>
  );
}
