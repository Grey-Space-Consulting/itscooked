"use client";

import type { InputHTMLAttributes } from "react";
import { useId } from "react";
import { cx } from "../../lib/utils";

type TextInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  helper?: string;
};

export function TextInput({ label, helper, className, id, ...props }: TextInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <label>
      {label && <span className="input-label">{label}</span>}
      <input
        id={inputId}
        className={cx("input-field", className)}
        {...props}
      />
      {helper && <span className="input-helper">{helper}</span>}
    </label>
  );
}
