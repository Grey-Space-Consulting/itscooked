import ImportFlow from "@/components/import-flow";

type RecipesNewPageProps = {
  searchParams?: Promise<{
    url?: string;
    title?: string;
    autostart?: string;
  }>;
};

export default async function RecipesNewPage({
  searchParams,
}: RecipesNewPageProps) {
  const resolvedSearchParams = await searchParams;
  const initialUrl =
    typeof resolvedSearchParams?.url === "string"
      ? resolvedSearchParams.url
      : "";
  const initialTitle =
    typeof resolvedSearchParams?.title === "string"
      ? resolvedSearchParams.title
      : "";
  const autoStart = resolvedSearchParams?.autostart === "1";

  return (
    <ImportFlow
      initialUrl={initialUrl}
      initialTitle={initialTitle}
      autoStart={autoStart}
    />
  );
}
