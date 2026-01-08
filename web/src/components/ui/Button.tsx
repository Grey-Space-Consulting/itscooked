import type { ButtonHTMLAttributes } from "react";
import { cx } from "../../lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline" | "ghost";
};

export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cx("btn", `btn-${variant}`, className)}
      type={props.type ?? "button"}
      {...props}
    />
  );
}
