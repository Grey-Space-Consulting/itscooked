"use client";

import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { TextInput } from "../components/ui/Input";
import { List } from "../components/ui/List";
import { Section } from "../components/ui/Section";

const pantryPulse = [
  {
    title: "Ginger",
    subtitle: "Low stock in pantry",
    trailing: <span className="badge is-warm">Refill</span>
  },
  {
    title: "Coconut milk",
    subtitle: "Swap if unavailable",
    trailing: <span className="badge">Flexible</span>
  },
  {
    title: "Limes",
    subtitle: "2 recipes incoming",
    trailing: <span className="badge">Tonight</span>
  }
];

export function Home() {
  return (
    <div className="page stack">
      <section className="hero">
        <h1 className="hero-title">Cook smarter, shop lighter.</h1>
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
          title="Smart list"
          meta="12 items, 4 aisles"
          action={<span className="badge is-warm">Ready</span>}
        >
          <div className="stack">
            <p className="card-meta">Auto-merged from recent recipes.</p>
            <Button variant="ghost">See list view</Button>
          </div>
        </Card>
      </div>

      <Section
        title="Pantry pulse"
        subtitle="What needs attention before your next shop"
      >
        <List items={pantryPulse} />
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
