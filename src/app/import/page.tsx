import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import ImportFlow from "@/components/import-flow";
import { ToastProvider } from "@/components/toast";
import styles from "./import.module.css";

type ImportPageProps = {
  searchParams?: {
    url?: string;
    title?: string;
    autostart?: string;
  };
};

const buildRedirectUrl = (params: {
  url?: string;
  title?: string;
  autoStart?: boolean;
}) => {
  const search = new URLSearchParams();
  if (params.url) {
    search.set("url", params.url);
  }
  if (params.title) {
    search.set("title", params.title);
  }
  if (params.autoStart) {
    search.set("autostart", "1");
  }

  const query = search.toString();
  return query ? `/import?${query}` : "/import";
};

export default async function ImportPage({ searchParams }: ImportPageProps) {
  const { userId } = await auth();
  const initialUrl = typeof searchParams?.url === "string" ? searchParams.url : "";
  const initialTitle =
    typeof searchParams?.title === "string" ? searchParams.title : "";
  const autoStart = searchParams?.autostart === "1";

  if (!userId) {
    const returnTo = buildRedirectUrl({
      url: initialUrl,
      title: initialTitle,
      autoStart,
    });
    redirect(`/sign-in?redirect_url=${encodeURIComponent(returnTo)}`);
  }

  return (
    <ToastProvider>
      <div className={styles.page}>
        <ImportFlow
          initialUrl={initialUrl}
          initialTitle={initialTitle}
          autoStart={autoStart}
          variant="standalone"
        />
      </div>
    </ToastProvider>
  );
}
