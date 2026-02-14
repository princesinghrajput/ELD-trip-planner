import { useState, useEffect, useRef } from "react";
import { Search, MapPin } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import client from "@/api/client";

export function LocationInput({ label, value, onChange, error, disabled }) {
    const { isDark } = useTheme();
    const [query, setQuery] = useState(value || "");
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isFetching, setIsFetching] = useState(false);
    const wrapperRef = useRef(null);
    const isTypingRef = useRef(false); // only fetch when user is actively typing

    // Sync from parent only when value changes externally
    useEffect(() => {
        if (value !== undefined && value !== query) {
            setQuery(value);
        }
    }, [value]);

    // Handle outside click to close dropdown
    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Debounced fetch suggestions — only when user is actively typing
    useEffect(() => {
        if (!isTypingRef.current) {
            return;
        }

        if (!query || query.length < 3) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        const timeOutId = setTimeout(async () => {
            setIsFetching(true);
            try {
                const res = await client.get(`/suggest/?q=${encodeURIComponent(query)}`);
                const data = res.data || [];
                setSuggestions(data);
                if (data.length > 0) {
                    setShowSuggestions(true);
                }
            } catch (err) {
                console.error("Suggest failed", err);
                setSuggestions([]);
            } finally {
                setIsFetching(false);
            }
        }, 400);

        return () => clearTimeout(timeOutId);
    }, [query]);

    const handleSelect = (s) => {
        isTypingRef.current = false; // user selected, stop fetching
        setQuery(s.label);
        onChange({ target: { value: s.label } });
        setSuggestions([]);
        setShowSuggestions(false);
    };

    const handleChange = (e) => {
        const val = e.target.value;
        isTypingRef.current = true; // user is typing, allow fetches
        setQuery(val);
        onChange(e);
        if (!val) {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    };

    return (
        <div className="relative" ref={wrapperRef}>
            <Input
                label={label}
                value={query}
                onChange={handleChange}
                error={error}
                disabled={disabled}
                onFocus={() => {
                    if (suggestions.length > 0) setShowSuggestions(true);
                }}
                autoComplete="off"
                className="pr-9"
            />
            {/* Loading Indicator or Icon */}
            <div className="pointer-events-none absolute right-3 top-[50%] -translate-y-1/2 text-slate-400">
                {isFetching ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
                ) : (
                    <Search size={16} className="opacity-50" />
                )}
            </div>

            {/* Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
                <div className={cn(
                    "absolute z-50 mt-1 w-full overflow-hidden rounded-lg border shadow-xl",
                    isDark ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200"
                )}>
                    <ul className="max-h-60 overflow-y-auto py-1">
                        {suggestions.map((s, idx) => (
                            <li key={idx}>
                                <button
                                    type="button"
                                    onClick={() => handleSelect(s)}
                                    className={cn(
                                        "flex w-full items-start gap-2 px-3 py-2.5 text-left text-xs transition-colors",
                                        isDark ? "hover:bg-slate-800 text-slate-300" : "hover:bg-slate-50 text-slate-700"
                                    )}
                                >
                                    <MapPin size={14} className="mt-0.5 shrink-0 text-emerald-500 opacity-70" />
                                    <span className="line-clamp-2">{s.label}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
