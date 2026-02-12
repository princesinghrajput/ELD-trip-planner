import { forwardRef } from "react";
import { Slot } from "@radix-ui/react-slot";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const Button = forwardRef(
    ({ className, variant = "primary", size = "default", isLoading, children, ...props }, ref) => {
        return (
            <button
                ref={ref}
                disabled={isLoading || props.disabled}
                className={cn(
                    "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:pointer-events-none disabled:opacity-50",
                    {
                        "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm": variant === "primary",
                        "bg-slate-800 text-slate-100 hover:bg-slate-700": variant === "secondary",
                        "border border-slate-700 bg-transparent hover:bg-slate-800 text-slate-300": variant === "outline",
                        "bg-rose-600 text-white hover:bg-rose-700": variant === "destructive",
                        "h-10 px-4 py-2 text-sm": size === "default",
                        "h-9 px-3 text-xs": size === "sm",
                        "h-12 px-8 text-base": size === "lg",
                    },
                    className
                )}
                {...props}
            >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {children}
            </button>
        );
    }
);

Button.displayName = "Button";

export { Button };
