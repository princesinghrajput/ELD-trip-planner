import { forwardRef } from "react";
import { cn } from "@/lib/utils";

const Input = forwardRef(({ className, label, error, ...props }, ref) => {
    return (
        <div className="relative w-full">
            <input
                className={cn(
                    "peer flex h-12 w-full rounded-lg border px-3 py-2 text-sm transition-colors duration-200",
                    "bg-[var(--bg-input)] text-[var(--text-primary)] border-[var(--border)]",
                    "placeholder:text-transparent",
                    "focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                    error && "border-rose-500 focus:border-rose-500 focus:ring-rose-500",
                    className
                )}
                ref={ref}
                placeholder={label}
                {...props}
            />
            {label && (
                <label
                    className={cn(
                        "pointer-events-none absolute left-3 top-[-10px] z-10 px-1 text-xs transition-all",
                        "bg-[var(--label-bg)] text-[var(--text-muted)]",
                        "peer-placeholder-shown:top-3 peer-placeholder-shown:bg-transparent peer-placeholder-shown:text-sm peer-placeholder-shown:text-[var(--text-muted)]",
                        "peer-focus:top-[-10px] peer-focus:bg-[var(--label-bg)] peer-focus:text-xs peer-focus:text-emerald-500",
                        error && "text-rose-500 peer-focus:text-rose-500"
                    )}
                >
                    {label}
                </label>
            )}
            {error && (
                <span className="mt-1 block text-xs text-rose-500">{error}</span>
            )}
        </div>
    );
});

Input.displayName = "Input";

export { Input };
