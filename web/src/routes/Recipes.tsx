import { Card } from "../components/ui/Card";
import { TextInput } from "../components/ui/Input";
import { Section } from "../components/ui/Section";

const recipes = [
  {
    title: "Smoked paprika tofu",
    meta: "Updated today",
    status: "20 min"
  },
  {
    title: "Citrus salad with tahini",
    meta: "Updated yesterday",
    status: "Fresh"
  },
  {
    title: "Sunday simmered beans",
    meta: "Updated 2 days ago",
    status: "Batch"
  }
];

export function Recipes() {
  return (
    <div className="page stack">
      <Section
        title="Recipes"
        subtitle="Search, review, and edit your latest imports"
      >
        <TextInput label="Search" placeholder="Search by ingredient or title" />
        <div className="grid grid-2">
          {recipes.map((recipe) => (
            <Card
              key={recipe.title}
              title={recipe.title}
              meta={recipe.meta}
              action={<span className="badge">{recipe.status}</span>}
            >
              <div className="stack">
                <p className="card-meta">
                  Tap to open the full recipe, edit ingredients, or prep a grocery
                  list.
                </p>
              </div>
            </Card>
          ))}
        </div>
      </Section>
    </div>
  );
}
