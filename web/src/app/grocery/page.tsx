import { Suspense } from "react";
import { Grocery } from "../../routes/Grocery";

export default function Page() {
  return (
    <Suspense fallback={<div className="page stack">Loading grocery list...</div>}>
      <Grocery />
    </Suspense>
  );
}
