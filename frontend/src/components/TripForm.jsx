import { useState } from "react";
import { useTripPlanner } from "@/hooks/useTripPlanner";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";

export function TripForm({ formData, onFormChange, onSuccess }) {
    const { planTrip, isLoading, error } = useTripPlanner();
    const { isDark } = useTheme();
    // Use props if provided, otherwise fallback to local (though App.jsx should provide it)
    const [localForm, setLocalForm] = useState({
        current: "",
        pickup: "",
        dropoff: "",
        cycleUsed: "0",
    });

    const form = formData || localForm;
    const setForm = onFormChange || setLocalForm;

    const [errors, setErrors] = useState({});

    const validate = () => {
        const newErrors = {};
        if (!form.current) newErrors.current = "Current location is required";
        if (!form.pickup) newErrors.pickup = "Pickup location is required";
        if (!form.dropoff) newErrors.dropoff = "Dropoff location is required";

        const cycle = parseFloat(form.cycleUsed);
        if (isNaN(cycle) || cycle < 0 || cycle > 69) {
            newErrors.cycleUsed = "Must be between 0 and 69 hours";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        try {
            const result = await planTrip(form);
            onSuccess?.(result);
        } catch {
            // Error handled by hook
        }
    };

    const cyclePercent = Math.round((parseFloat(form.cycleUsed || 0) / 70) * 100);

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 rounded-lg bg-rose-500/10 p-3 text-sm text-rose-500 border border-rose-500/20"
                >
                    <AlertCircle size={16} className="shrink-0" />
                    <span>{error}</span>
                </motion.div>
            )}

            <div className="space-y-4">
                {/* Current */}
                <div className="relative flex items-start gap-3">
                    <div className="mt-3.5 flex flex-col items-center">
                        <div className="h-3 w-3 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20" />
                        <div className="w-0.5 h-8 bg-gradient-to-b from-emerald-500/40 to-transparent mt-1" />
                    </div>
                    <div className="flex-1">
                        <Input label="Current Location" value={form.current} onChange={(e) => setForm({ ...form, current: e.target.value })} error={errors.current} disabled={isLoading} />
                    </div>
                </div>

                {/* Pickup */}
                <div className="relative flex items-start gap-3">
                    <div className="mt-3.5 flex flex-col items-center">
                        <div className="h-3 w-3 rounded-full bg-blue-500 ring-4 ring-blue-500/20" />
                        <div className="w-0.5 h-8 bg-gradient-to-b from-blue-500/40 to-transparent mt-1" />
                    </div>
                    <div className="flex-1">
                        <Input label="Pickup Location" value={form.pickup} onChange={(e) => setForm({ ...form, pickup: e.target.value })} error={errors.pickup} disabled={isLoading} />
                    </div>
                </div>

                {/* Dropoff */}
                <div className="relative flex items-start gap-3">
                    <div className="mt-3.5 flex flex-col items-center">
                        <div className="h-3 w-3 rounded-full bg-amber-500 ring-4 ring-amber-500/20" />
                    </div>
                    <div className="flex-1">
                        <Input label="Dropoff Location" value={form.dropoff} onChange={(e) => setForm({ ...form, dropoff: e.target.value })} error={errors.dropoff} disabled={isLoading} />
                    </div>
                </div>
            </div>

            {/* Cycle Hours */}
            <div className={cn(
                "rounded-lg border p-4 transition-colors duration-300",
                isDark ? "border-slate-800 bg-slate-900/30" : "border-slate-200 bg-slate-50"
            )}>
                <div className="flex items-center justify-between mb-3">
                    <label className={cn("text-xs font-medium", isDark ? "text-slate-400" : "text-slate-500")}>Cycle Hours Used</label>
                    <div className="flex items-center gap-2">
                        <div className="w-14">
                            <Input type="number" value={form.cycleUsed} onChange={(e) => setForm({ ...form, cycleUsed: e.target.value })} error={errors.cycleUsed} className="h-8 text-center text-xs !p-1" disabled={isLoading} />
                        </div>
                        <span className={cn("text-xs", isDark ? "text-slate-500" : "text-slate-400")}>/ 70h</span>
                    </div>
                </div>
                <input type="range" min="0" max="69" step="0.5" className="w-full" value={form.cycleUsed} onChange={(e) => setForm({ ...form, cycleUsed: e.target.value })} disabled={isLoading} />
                <div className={cn("mt-2 h-1 w-full rounded-full overflow-hidden", isDark ? "bg-slate-800" : "bg-slate-200")}>
                    <div
                        className={`h-full rounded-full transition-all duration-300 ${cyclePercent > 80 ? 'bg-rose-500' : cyclePercent > 60 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                        style={{ width: `${cyclePercent}%` }}
                    />
                </div>
            </div>

            <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
                Plan Route & Generate Logs
            </Button>
        </form>
    );
}
