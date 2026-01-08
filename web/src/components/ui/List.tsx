import type { CSSProperties, ReactNode } from "react";

export type ListItem = {
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
};

type ListProps = {
  items: ListItem[];
};

export function List({ items }: ListProps) {
  return (
    <div className="list stagger">
      {items.map((item, index) => (
        <div
          className="list-item"
          key={`${item.title}-${index}`}
          style={{ "--delay": `${index * 0.08}s` } as CSSProperties}
        >
          <div>
            <strong>{item.title}</strong>
            {item.subtitle && <span>{item.subtitle}</span>}
          </div>
          {item.trailing}
        </div>
      ))}
    </div>
  );
}
