import ImportFlow from "@/components/import-flow";

type RecipesNewPageProps = {
  searchParams?: {
    url?: string;
    title?: string;
    autostart?: string;
  };
};

export default function RecipesNewPage({ searchParams }: RecipesNewPageProps) {
  const initialUrl = typeof searchParams?.url === "string" ? searchParams.url : "";
  const initialTitle =
    typeof searchParams?.title === "string" ? searchParams.title : "";
  const autoStart = searchParams?.autostart === "1";

  return (
    <ImportFlow
      initialUrl={initialUrl}
      initialTitle={initialTitle}
      autoStart={autoStart}
    />
  );
}
