"use client";

import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { TextInput } from "../components/ui/Input";
import { List } from "../components/ui/List";
import { Section } from "../components/ui/Section";

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

export function Home() {
  return (
    <div className="page stack">
      <section className="hero">
        <h1 className="hero-title">Cook smarter, plan faster.</h1>
        <p className="hero-subtitle">
          Plan this week, save favorite dishes, and turn links into polished
          recipes.
        </p>
        <div className="hero-actions">
          <Button>Browse recipes</Button>
          <Button variant="outline">Add recipe link</Button>
        </div>
      </section>

      <div className="grid grid-2">
        <Card
          title="Tonight"
          meta="3 recipes queued"
          action={<span className="badge">Preview</span>}
        >
          <div className="stack">
            <p className="card-meta">Mediterranean bowls, citrus salad, herb rice.</p>
            <Button variant="ghost">Open cooking mode</Button>
          </div>
        </Card>
        <Card
          title="Import queue"
          meta="2 links processing"
          action={<span className="badge is-warm">Queued</span>}
        >
          <div className="stack">
            <p className="card-meta">Auto-parsed from your saved recipe links.</p>
            <Button variant="ghost">Review imports</Button>
          </div>
        </Card>
      </div>

      <Section
        title="Recent recipes"
        subtitle="Fresh imports ready for review"
      >
        <List items={recentRecipes} />
      </Section>

      <Section
        title="Quick ingest"
        subtitle="Paste a URL and let the parser handle the rest"
      >
        <div className="card stack">
          <TextInput
            label="Recipe link"
            placeholder="https://example.com/braised-ginger"
            helper="We will fetch, parse, and stage it for review."
          />
          <div className="hero-actions">
            <Button>Queue ingestion</Button>
            <Button variant="ghost">Use iOS Shortcut</Button>
          </div>
        </div>
      </Section>
    </div>
  );
}
