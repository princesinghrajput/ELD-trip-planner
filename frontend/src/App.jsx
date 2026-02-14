import { useState, useRef, useEffect } from 'react';
import { Truck, Map as MapIcon, FileText, Route, Clock, Calendar, Gauge, ChevronRight, Sun, Moon, ArrowRight, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { TripForm } from '@/components/TripForm';
import { RouteMap } from '@/components/RouteMap';
import { LogSheet } from '@/components/LogSheet';
import { useTheme } from '@/hooks/useTheme';

function App() {
  const [activeTab, setActiveTab] = useState('plan');
  const [tripResult, setTripResult] = useState(null);
  const [logsViewed, setLogsViewed] = useState(false);
  const { isDark, toggle } = useTheme();
  const ctaRef = useRef(null);

  const [tripFormData, setTripFormData] = useState({
    current: "",
    pickup: "",
    dropoff: "",
    cycleUsed: "0",
  });

  const handleTripPlanned = (data) => {
    setTripResult(data);
    setLogsViewed(false);
    console.log("Trip planned:", data);
    // Scroll to CTA after a short delay
    setTimeout(() => {
      ctaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 600);
  };

  const handleViewLogs = () => {
    setLogsViewed(true);
    setActiveTab('logs');
  };

  return (
    <div className={cn(
      "flex h-screen w-full flex-col md:flex-row overflow-hidden transition-colors duration-300",
      isDark ? "bg-slate-950 text-slate-50" : "bg-slate-50 text-slate-900"
    )}>

      {/* ── Sidebar ── */}
      <nav className={cn(
        "z-10 flex w-full flex-row items-center justify-between border-b p-4 backdrop-blur-md md:h-full md:w-20 md:flex-col md:border-b-0 md:border-r md:pt-8 transition-colors duration-300",
        isDark ? "border-slate-800 bg-slate-900/50" : "border-slate-200 bg-white/70"
      )}>
        <div className="flex items-center gap-2 md:flex-col md:gap-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/20">
            <Truck size={20} />
          </div>
        </div>
        <div className="flex gap-1 md:flex-col md:gap-4">
          <NavButton active={activeTab === 'plan'} onClick={() => setActiveTab('plan')} icon={<MapIcon size={20} />} label="Plan" isDark={isDark} />
          <NavButton
            active={activeTab === 'logs'}
            onClick={handleViewLogs}
            icon={<FileText size={20} />}
            label="Logs"
            isDark={isDark}
            badge={tripResult && !logsViewed}
          />
        </div>
        <div className="flex gap-2 md:flex-col md:gap-4 md:mb-4">
          {/* Theme Toggle */}
          <button
            onClick={toggle}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200",
              isDark ? "text-slate-400 hover:bg-slate-800 hover:text-amber-400" : "text-slate-500 hover:bg-slate-100 hover:text-indigo-500"
            )}
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </nav>

      {/* ── Main ── */}
      <main className="relative flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === 'plan' && (
            <motion.div
              key="plan"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="flex h-full flex-col lg:flex-row"
            >
              {/* ── Left Panel ── */}
              <div className={cn(
                "flex-1 overflow-y-auto border-r p-6 lg:max-w-md xl:max-w-lg transition-colors duration-300",
                isDark ? "border-slate-800 bg-slate-950" : "border-slate-200 bg-slate-50"
              )}>
                <header className="mb-6">
                  <h1 className={cn("text-2xl font-bold tracking-tight", isDark ? "text-white" : "text-slate-900")}>
                    Trip Planner
                  </h1>
                  <p className={cn("text-sm", isDark ? "text-slate-400" : "text-slate-500")}>
                    Calculate HOS-compliant routes & logs.
                  </p>
                </header>

                {/* Form Card */}
                <div className={cn(
                  "rounded-xl border p-5 shadow-sm transition-colors duration-300",
                  isDark ? "border-slate-800 bg-slate-900/50" : "border-slate-200 bg-white"
                )}>
                  <TripForm
                    formData={tripFormData}
                    onFormChange={setTripFormData}
                    onSuccess={handleTripPlanned}
                  />
                </div>

                {/* ── Trip Summary ── */}
                <AnimatePresence mode="wait">
                  {tripResult ? (
                    <motion.div
                      key="summary"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3, delay: 0.1 }}
                      className="mt-6 space-y-4"
                    >
                      <div className="grid grid-cols-2 gap-3">
                        <StatCard icon={<Route size={16} />} label="Total Distance" value={`${tripResult.route.total_distance_miles} mi`} color="emerald" isDark={isDark} />
                        <StatCard icon={<Clock size={16} />} label="Drive Time" value={`${tripResult.route.total_duration_hours}h`} color="blue" isDark={isDark} />
                        <StatCard icon={<Gauge size={16} />} label="Cycle Used" value={`${tripResult.summary.cycle_hours_at_end}h`} color="amber" isDark={isDark} />
                        <StatCard icon={<Calendar size={16} />} label="Total Days" value={tripResult.summary.total_days} color="purple" isDark={isDark} />
                      </div>

                      {/* Legs Breakdown */}
                      <div className={cn(
                        "rounded-xl border p-4 space-y-3 transition-colors duration-300",
                        isDark ? "border-slate-800 bg-slate-900/30" : "border-slate-200 bg-white"
                      )}>
                        <h4 className={cn("text-xs font-semibold uppercase tracking-wider", isDark ? "text-slate-500" : "text-slate-400")}>Route Legs</h4>
                        {tripResult.route.legs.map((leg, i) => (
                          <div key={i} className="flex items-center gap-3 text-sm">
                            <div className={`h-2 w-2 rounded-full ${i === 0 ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                            <span className={cn("truncate flex-1", isDark ? "text-slate-300" : "text-slate-600")}>{leg.from}</span>
                            <ChevronRight size={12} className="text-slate-400" />
                            <span className={cn("truncate flex-1", isDark ? "text-slate-300" : "text-slate-600")}>{leg.to}</span>
                            <span className="font-mono text-xs text-slate-500 ml-auto whitespace-nowrap">{leg.distance_miles} mi</span>
                          </div>
                        ))}
                      </div>

                      {/* Stops */}
                      {tripResult.stops.length > 0 && (
                        <div className={cn(
                          "rounded-xl border p-4 transition-colors duration-300",
                          isDark ? "border-slate-800 bg-slate-900/30" : "border-slate-200 bg-white"
                        )}>
                          <h4 className={cn("text-xs font-semibold uppercase tracking-wider mb-2", isDark ? "text-slate-500" : "text-slate-400")}>Scheduled Stops</h4>
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(
                              tripResult.stops.reduce((acc, s) => { acc[s.type] = (acc[s.type] || 0) + 1; return acc; }, {})
                            ).map(([type, count]) => (
                              <span key={type} className={cn(
                                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs capitalize",
                                isDark ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-600"
                              )}>
                                {type} <span className="font-mono text-emerald-500">{count}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* ── View Driver Logs CTA ── */}
                      <motion.div
                        ref={ctaRef}
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.4, delay: 0.5 }}
                      >
                        <button
                          onClick={handleViewLogs}
                          className={cn(
                            "group relative w-full overflow-hidden rounded-xl border p-4 text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-lg",
                            isDark
                              ? "border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-cyan-500/10 hover:border-emerald-500/50 hover:shadow-emerald-500/10"
                              : "border-emerald-500/30 bg-gradient-to-r from-emerald-50 via-white to-cyan-50 hover:border-emerald-500/50 hover:shadow-emerald-500/10"
                          )}
                        >
                          {/* Animated shimmer effect */}
                          <div className="absolute inset-0 -translate-x-full animate-[shimmer_3s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent" />

                          <div className="relative flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "flex h-10 w-10 items-center justify-center rounded-lg",
                                isDark ? "bg-emerald-500/20" : "bg-emerald-500/10"
                              )}>
                                <FileText size={18} className="text-emerald-500" />
                              </div>
                              <div>
                                <p className={cn("text-sm font-semibold", isDark ? "text-white" : "text-slate-900")}>
                                  Driver Logs Ready
                                </p>
                                <p className={cn("text-xs", isDark ? "text-slate-400" : "text-slate-500")}>
                                  View your FMCSA-compliant HOS log sheets
                                </p>
                              </div>
                            </div>
                            <div className={cn(
                              "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-300 group-hover:gap-2.5",
                              isDark
                                ? "bg-emerald-500/20 text-emerald-400"
                                : "bg-emerald-500/10 text-emerald-600"
                            )}>
                              <Sparkles size={12} />
                              View Logs
                              <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
                            </div>
                          </div>

                          {/* Pulse border animation */}
                          {!logsViewed && (
                            <div className="absolute inset-0 rounded-xl border-2 border-emerald-500/40 animate-[pulse_2s_ease-in-out_infinite]" />
                          )}
                        </button>
                      </motion.div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={cn(
                        "mt-6 rounded-xl border border-dashed p-8 text-center transition-colors duration-300",
                        isDark ? "border-slate-800 bg-slate-900/20" : "border-slate-300 bg-white"
                      )}
                    >
                      <Route size={24} className={cn("mx-auto mb-2", isDark ? "text-slate-700" : "text-slate-300")} />
                      <p className={cn("text-sm", isDark ? "text-slate-500" : "text-slate-400")}>Enter trip details to view summary</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* ── Right Panel: Map ── */}
              <div className={cn("relative flex-1", isDark ? "bg-slate-900" : "bg-slate-100")}>
                <div className="absolute inset-0">
                  <RouteMap tripResult={tripResult} />
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'logs' && (
            <motion.div
              key="logs"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="flex h-full flex-col p-6"
            >
              <header className="mb-6">
                <h1 className={cn("text-2xl font-bold", isDark ? "text-white" : "text-slate-900")}>Driver Logs</h1>
              </header>
              <LogSheet tripResult={tripResult} isDark={isDark} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

/* ── Stat Card ── */
const colorMap = {
  emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', ring: 'ring-emerald-500/20' },
  blue: { bg: 'bg-blue-500/10', text: 'text-blue-500', ring: 'ring-blue-500/20' },
  amber: { bg: 'bg-amber-500/10', text: 'text-amber-500', ring: 'ring-amber-500/20' },
  purple: { bg: 'bg-purple-500/10', text: 'text-purple-500', ring: 'ring-purple-500/20' },
};

function StatCard({ icon, label, value, color, isDark }) {
  const c = colorMap[color] || colorMap.emerald;
  return (
    <div className={cn(
      "rounded-xl border p-4 ring-1 transition-colors duration-300",
      c.ring,
      isDark ? "border-slate-800 bg-slate-900/50" : "border-slate-200 bg-white"
    )}>
      <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg mb-2", c.bg, c.text)}>
        {icon}
      </div>
      <p className={cn("text-[11px] uppercase tracking-wider", isDark ? "text-slate-500" : "text-slate-400")}>{label}</p>
      <p className={cn("text-xl font-mono font-semibold", c.text)}>{value}</p>
    </div>
  );
}

/* ── Nav Button ── */
function NavButton({ active, onClick, icon, label, isDark, badge }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-200",
        active
          ? isDark ? "bg-slate-800 text-emerald-500 shadow-inner" : "bg-emerald-50 text-emerald-600 shadow-inner"
          : isDark ? "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200" : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"
      )}
      title={label}
    >
      {icon}
      {active && (
        <span className="absolute -right-1 top-1 flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
      )}
      {/* Notification badge when logs are ready */}
      {badge && !active && (
        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
          <span className="relative inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[8px] font-bold text-white">
            !
          </span>
        </span>
      )}
    </button>
  );
}

export default App;
