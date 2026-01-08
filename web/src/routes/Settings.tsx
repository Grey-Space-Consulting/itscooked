import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { TextInput } from "../components/ui/Input";
import { Section } from "../components/ui/Section";

export function Settings() {
  return (
    <div className="page stack">
      <Section
        title="Preferences"
        subtitle="Personalize how recipes and lists behave"
      >
        <div className="grid grid-2">
          <Card title="Kitchen defaults" meta="Aisle flow and pantry settings">
            <div className="stack">
              <TextInput label="Primary kitchen" placeholder="Home" />
              <TextInput label="Default units" placeholder="Metric" />
            </div>
          </Card>
          <Card title="Sync and storage" meta="Offline-first preferences">
            <div className="stack">
              <TextInput label="Cache window" placeholder="14 days" />
              <Button variant="outline">Request persistent storage</Button>
            </div>
          </Card>
        </div>
      </Section>

      <Section title="Account" subtitle="Session and security">
        <Card>
          <div className="stack">
            <TextInput label="Email" placeholder="you@example.com" />
            <div className="hero-actions">
              <Button>Save changes</Button>
              <Button variant="ghost">Sign out</Button>
            </div>
          </div>
        </Card>
      </Section>
    </div>
  );
}
