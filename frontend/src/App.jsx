import { useState } from 'react';
import { Truck, Map as MapIcon, FileText, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { TripForm } from '@/components/TripForm';

function App() {
  const [activeTab, setActiveTab] = useState('plan');
  const [tripResult, setTripResult] = useState(null);

  const handleTripPlanned = (data) => {
    setTripResult(data);
    // Auto-switch to map view if on mobile, or just highlight results
    console.log("Trip planned:", data);
  };

  return (
    <div className="flex h-screen w-full flex-col bg-slate-950 text-slate-50 md:flex-row overflow-hidden">

      {/* Sidebar Navigation (Desktop) / Bottom Nav (Mobile) */}
      <nav className="z-10 flex w-full flex-row items-center justify-between border-b border-slate-800 bg-slate-900/50 p-4 backdrop-blur-md md:h-full md:w-20 md:flex-col md:border-b-0 md:border-r md:pt-8">
        <div className="flex items-center gap-2 md:flex-col md:gap-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/20">
            <Truck size={20} />
          </div>
        </div>

        <div className="flex gap-1 md:flex-col md:gap-4">
          <NavButton
            active={activeTab === 'plan'}
            onClick={() => setActiveTab('plan')}
            icon={<MapIcon size={20} />}
            label="Plan"
          />
          <NavButton
            active={activeTab === 'logs'}
            onClick={() => setActiveTab('logs')}
            icon={<FileText size={20} />}
            label="Logs"
          />
        </div>

        <div className="hidden md:flex md:flex-col md:gap-4 md:mb-4">
          {/* Settings or profile placeholder */}
          <div className="h-10 w-10 rounded-full bg-slate-800" />
        </div>
      </nav>

      {/* Main Content Area */}
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
              {/* Left Panel: Form & Stats */}
              <div className="flex-1 overflow-y-auto border-r border-slate-800 bg-slate-950 p-6 lg:max-w-md xl:max-w-lg">
                <header className="mb-8">
                  <h1 className="text-2xl font-bold tracking-tight text-white font-display">
                    Trip Planner
                  </h1>
                  <p className="text-slate-400">
                    Calculate HOS-compliant routes & logs.
                  </p>
                </header>

                {/* Form Section */}
                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 shadow-sm">
                  <TripForm onSuccess={handleTripPlanned} />
                </div>

                {/* Summary Placeholder */}
                {tripResult ? (
                  <div className="mt-8 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-6 space-y-4">
                    <h3 className="text-lg font-medium text-emerald-400">Trip Calculated</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-slate-400">Total Distance</p>
                        <p className="text-xl font-mono text-white">{tripResult.summary.total_driving_miles} mi</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Duty Cycle</p>
                        <p className="text-xl font-mono text-white">{tripResult.summary.cycle_hours_at_end}h used</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-8 rounded-xl border border-dashed border-slate-800 bg-slate-900/30 p-8 text-center text-slate-500">
                    Enter trip details to view summary
                  </div>
                )}
              </div>

              {/* Right Panel: Map */}
              <div className="relative flex-1 bg-slate-900">
                <div className="absolute inset-0 flex items-center justify-center text-slate-600">
                  Map Component Here
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
                <h1 className="text-2xl font-bold text-white">Driver Logs</h1>
              </header>
              <div className="flex-1 rounded-xl border border-dashed border-slate-800 bg-slate-900/30 flex items-center justify-center text-slate-500">
                Log Sheet Canvas Here
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-200",
        active
          ? "bg-slate-800 text-emerald-500 shadow-inner"
          : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
      )}
      title={label}
    >
      {icon}
      {active && (
        <span className="absolute -right-1 top-1 flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
        </span>
      )}
    </button>
  );
}

export default App;
