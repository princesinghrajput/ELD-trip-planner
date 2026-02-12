import { useState } from "react";
import { useTripPlanner } from "@/hooks/useTripPlanner";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

export function TripForm({ onSuccess }) {
    const { planTrip, isLoading, error } = useTripPlanner();
    const [form, setForm] = useState({
        current: "",
        pickup: "",
        dropoff: "",
        cycleUsed: "0",
    });

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
            // Error handled by hook state
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 rounded-lg bg-rose-500/10 p-3 text-sm text-rose-500 border border-rose-500/20"
                >
                    <AlertCircle size={16} />
                    {error}
                </motion.div>
            )}

            <div className="space-y-4">
                <Input
                    label="Current Location"
                    value={form.current}
                    onChange={(e) => setForm({ ...form, current: e.target.value })}
                    error={errors.current}
                    disabled={isLoading}
                />

                <div className="relative pl-4 border-l-2 border-slate-800 ml-2 space-y-4">
                    <div className="absolute -left-[5px] top-0 h-2 w-2 rounded-full bg-slate-700" />
                    <div className="absolute -left-[5px] bottom-0 h-2 w-2 rounded-full bg-slate-700" />

                    <Input
                        label="Pickup Location"
                        value={form.pickup}
                        onChange={(e) => setForm({ ...form, pickup: e.target.value })}
                        error={errors.pickup}
                        disabled={isLoading}
                    />

                    <Input
                        label="Dropoff Location"
                        value={form.dropoff}
                        onChange={(e) => setForm({ ...form, dropoff: e.target.value })}
                        error={errors.dropoff}
                        disabled={isLoading}
                    />
                </div>

                <div className="pt-2">
                    <label className="text-xs text-slate-400 mb-1 block">Cycle Hours Used (70h limit)</label>
                    <div className="flex items-center gap-4">
                        <input
                            type="range"
                            min="0" max="69" step="0.5"
                            className="flex-1 accent-emerald-500 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                            value={form.cycleUsed}
                            onChange={(e) => setForm({ ...form, cycleUsed: e.target.value })}
                            disabled={isLoading}
                        />
                        <div className="w-16">
                            <Input
                                type="number"
                                value={form.cycleUsed}
                                onChange={(e) => setForm({ ...form, cycleUsed: e.target.value })}
                                error={errors.cycleUsed}
                                className="h-9 text-center"
                                disabled={isLoading}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
                Plan Route & Generate Logs
            </Button>
        </form>
    );
}
