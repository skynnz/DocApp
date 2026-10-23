import { cn } from "@/lib/utils";

export function Logo({
  className,
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizes = {
    sm: "h-6 w-6 rounded-[6px]",
    md: "h-8 w-8 rounded-[8px]",
    lg: "h-10 w-10 rounded-[10px]",
  };

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center bg-primary text-white shadow-sm",
        sizes[size],
        className,
      )}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className={size === "sm" ? "h-3.5 w-3.5" : "h-[18px] w-[18px]"}
      >
        <path
          d="M6.75 3.75h7.5L18 7.5v12.75H6.75V3.75Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path
          d="M14.25 3.75V7.5H18"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path
          d="M9.5 11.25h6M9.5 14.25h6M9.5 17.25h3.5"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}
