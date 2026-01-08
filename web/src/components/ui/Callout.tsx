import type { ReactNode } from "react";
import { cx } from "../../lib/utils";

type CalloutProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  variant?: "info" | "warning" | "error";
};

export function Callout({
  title,
  description,
  action,
  variant = "info"
}: CalloutProps) {
  return (
    <section className={cx("callout", `callout-${variant}`)}>
      <div className="callout-copy">
        <strong>{title}</strong>
        {description && <p>{description}</p>}
      </div>
      {action && <div className="callout-action">{action}</div>}
    </section>
  );
}
