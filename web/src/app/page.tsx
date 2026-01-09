import { Suspense } from "react";
import { Card } from "../components/ui/Card";
import { Section } from "../components/ui/Section";
import { Home } from "../routes/Home";

function HomeFallback() {
  return (
    <div className="page stack">
      <section className="hero">
        <h1 className="hero-title">Cook smarter, plan faster.</h1>
        <p className="hero-subtitle">Loading your kitchen dashboard...</p>
      </section>
      <Section title="Quick ingest" subtitle="Preparing your import tools">
        <Card>
          <p className="card-meta">Getting everything ready.</p>
        </Card>
      </Section>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<HomeFallback />}>
      <Home />
    </Suspense>
  );
}
