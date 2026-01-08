import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { List } from "../components/ui/List";
import { Section } from "../components/ui/Section";

const produce = [
  { title: "Limes", subtitle: "2", trailing: <span className="badge">Produce</span> },
  { title: "Ginger", subtitle: "1 knob", trailing: <span className="badge">Produce</span> }
];

const pantry = [
  { title: "Coconut milk", subtitle: "2 cans", trailing: <span className="badge">Pantry</span> },
  { title: "Jasmine rice", subtitle: "1 bag", trailing: <span className="badge">Pantry</span> }
];

export function Grocery() {
  return (
    <div className="page stack">
      <Section
        title="Grocery list"
        subtitle="Merged from your next three recipes"
      >
        <Card title="Trip ready" meta="12 items across 4 aisles">
          <div className="hero-actions">
            <Button>Start shopping mode</Button>
            <Button variant="ghost">Share list</Button>
          </div>
        </Card>
      </Section>

      <Section title="Produce" subtitle="Fresh picks first">
        <List items={produce} />
      </Section>

      <Section title="Pantry" subtitle="Staples and shelf-safe items">
        <List items={pantry} />
      </Section>
    </div>
  );
}
