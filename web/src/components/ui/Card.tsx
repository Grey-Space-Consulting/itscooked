import type { ReactNode } from "react";

type CardProps = {
  title?: string;
  meta?: string;
  children: ReactNode;
  action?: ReactNode;
};

export function Card({ title, meta, action, children }: CardProps) {
  return (
    <section className="card">
      {(title || meta || action) && (
        <div className="card-row">
          <div>
            {title && <h3 className="card-title">{title}</h3>}
            {meta && <p className="card-meta">{meta}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
