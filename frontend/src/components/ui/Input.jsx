import { forwardRef } from "react";
import { cn } from "@/lib/utils";

const Input = forwardRef(({ className, label, error, ...props }, ref) => {
    return (
        <div className="relative w-full">
            <input
                className={cn(
                    "peer flex h-12 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-transparent focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50",
                    error && "border-rose-500 focus:border-rose-500 focus:ring-rose-500",
                    className
                )}
                ref={ref}
                placeholder={label} // Required for peer-placeholder-shown to work
                {...props}
            />
            {label && (
                <label
                    className={cn(
                        "absolute left-3 top-[-10px] z-10 bg-slate-950 px-1 text-xs text-slate-400 transition-all",
                        "peer-placeholder-shown:top-3 peer-placeholder-shown:bg-transparent peer-placeholder-shown:text-sm peer-placeholder-shown:text-slate-500",
                        "peer-focus:top-[-10px] peer-focus:bg-slate-950 peer-focus:text-xs peer-focus:text-emerald-500",
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
