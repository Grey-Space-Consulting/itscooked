import type { ReactNode } from "react";

type SectionProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export function Section({ title, subtitle, children }: SectionProps) {
  return (
    <section className="stack">
      <header>
        <h2 className="section-title">{title}</h2>
        {subtitle && <p className="section-subtitle">{subtitle}</p>}
      </header>
      {children}
    </section>
  );
}
