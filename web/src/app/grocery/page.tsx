import { Suspense } from "react";
import { Grocery } from "../../routes/Grocery";

export const dynamic = "force-dynamic";

type GroceryPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default function Page({ searchParams }: GroceryPageProps) {
  const listParam = searchParams?.list;
  const listId = Array.isArray(listParam) ? listParam[0] : listParam;

  return (
    <Suspense fallback={<div className="page stack">Loading grocery list...</div>}>
      <Grocery listId={listId} />
    </Suspense>
  );
}
