import * as React from "react";

import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, type = "text", ...props }: InputProps) {
  return (
    <input
      type={type}
      className={cn(
        "h-10 w-full rounded-md border border-border-strong bg-surface px-3 text-sm text-ink shadow-[0_1px_1px_rgba(55,53,47,0.03)] transition-colors",
        "hover:border-border-strong focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15",
        "disabled:cursor-not-allowed disabled:bg-canvas disabled:opacity-70",
        className,
      )}
      {...props}
    />
  );
}
