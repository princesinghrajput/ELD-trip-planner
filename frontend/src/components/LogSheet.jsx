import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, CalendarDays, Clock3, MapPin, Printer } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_ROWS = [
  { key: 'off-duty', label: 'Off Duty', short: 'OFF', aliases: ['off', 'off_duty', 'off-duty'], color: '#38bdf8' },
  { key: 'sleeper', label: 'Sleeper Berth', short: 'SB', aliases: ['sleeper', 'sleeper berth', 'sleeper_berth', 'sb'], color: '#a78bfa' },
  { key: 'driving', label: 'Driving', short: 'DR', aliases: ['drive', 'driving', 'd', 'dr'], color: '#34d399' },
  { key: 'on-duty', label: 'On Duty (Not Driving)', short: 'ON', aliases: ['on', 'on-duty', 'on_duty', 'onduty', 'on duty'], color: '#fbbf24' },
];

const STATUS_LOOKUP = STATUS_ROWS.reduce((acc, row) => {
  acc[row.key] = row.key;
  row.aliases.forEach((alias) => {
    acc[alias] = row.key;
  });
  return acc;
}, {});

const VIOLATION_TINT = {
  critical: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
  warning: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
  info: 'text-sky-500 bg-sky-500/10 border-sky-500/20',
};

/**
 * Entry point component used on the Logs tab.
 */
export function LogSheet({ tripResult, isDark }) {
  const normalizedLogDays = useMemo(() => normalizeLogDays(tripResult), [tripResult]);
  const hasServerLogs = normalizedLogDays.length > 0;
  const logDays = hasServerLogs ? normalizedLogDays : buildSampleLogDays(tripResult);

  const [activeIndex, setActiveIndex] = useState(0);
  useEffect(() => {
    setActiveIndex(0);
  }, [logDays.length]);

  const handlePrint = () => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/png');
    const windowContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Driver's Daily Log</title>
          <style>
            body { margin: 0; display: flex; justify-content: center; padding: 20px; }
            img { max-width: 100%; height: auto; border: 1px solid #ccc; }
            @media print { body { padding: 0; } img { border: none; } }
          </style>
        </head>
        <body>
          <img src="${dataUrl}" onload="window.print();window.close()" />
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(windowContent);
    printWindow.document.close();
  };

  if (!logDays.length) {
    return (
      <div className={cn(
        'rounded-2xl border p-10 text-center',
        isDark ? 'border-slate-800 bg-slate-900/50 text-slate-400' : 'border-slate-200 bg-white text-slate-500'
      )}>
        Unable to render logs - no data available.
      </div>
    );
  }

  const safeIndex = Math.min(activeIndex, logDays.length - 1);
  const activeDay = logDays[safeIndex];
  const showEmptyCallout = !tripResult && !hasServerLogs;
  const isSampleData = !hasServerLogs && !!activeDay?.isSample;

  return (
    <div className="flex flex-1 min-h-0 flex-col gap-4 overflow-y-auto p-1 pb-6">
      {/* Header with Print Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays size={20} className={isDark ? "text-emerald-400" : "text-emerald-600"} />
          <h2 className={cn("text-lg font-bold", isDark ? "text-white" : "text-slate-900")}>Daily Logs</h2>
        </div>
        <button
          onClick={handlePrint}
          className={cn(
            "flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
            isDark ? "bg-slate-800 text-slate-200 hover:bg-slate-700" : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
          )}
        >
          <Printer size={14} />
          <span>Print Log</span>
        </button>
      </div>

      {showEmptyCallout && (
        <div className={cn(
          'flex items-center gap-3 rounded-xl border border-dashed px-4 py-3 text-sm',
          isDark ? 'border-slate-800 bg-slate-900/40 text-slate-300' : 'border-slate-300 bg-white text-slate-600'
        )}>
          <CalendarDays size={18} />
          <span>Plan a trip to replace these sample logs with real HOS events.</span>
        </div>
      )}
      {isSampleData && (
        <div className={cn(
          'flex items-center gap-2 rounded-xl border px-4 py-2 text-sm',
          isDark ? 'border-sky-500/20 bg-sky-500/5 text-sky-200' : 'border-sky-500/20 bg-sky-50 text-sky-700'
        )}>
          <AlertTriangle size={16} />
          <span>Showing sample FMCSA grid until real log data is returned by the planner API.</span>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        {logDays.map((day, idx) => (
          <button
            key={day.id}
            type="button"
            onClick={() => setActiveIndex(idx)}
            className={cn(
              'flex min-w-[150px] flex-1 flex-col rounded-xl border px-4 py-3 text-left transition-all duration-200',
              safeIndex === idx
                ? isDark ? 'border-emerald-500/50 bg-emerald-500/10 shadow-[0_10px_35px_-20px_rgb(16_185_129)]' : 'border-emerald-500/60 bg-emerald-50'
                : isDark ? 'border-slate-800 bg-slate-900/40 hover:border-slate-700' : 'border-slate-200 bg-white hover:border-slate-300'
            )}
          >
            <span className={cn('text-xs uppercase tracking-wide', isDark ? 'text-slate-400' : 'text-slate-500')}>{day.label}</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-mono text-xl font-semibold">{formatHours(day.totals.drivingMinutes)}</span>
              <span className="text-xs text-slate-500">driving</span>
            </div>
            <div className="mt-1 flex items-center gap-2 text-[11px] uppercase">
              <Clock3 size={12} className="text-emerald-500" />
              <span className="text-slate-500">{Math.round(day.coverage * 100)}% coverage</span>
            </div>
          </button>
        ))}
      </div>

      <div className="grid flex-1 gap-5 xl:grid-cols-[minmax(0,2.5fr)_minmax(0,1fr)]">
        <LogSheetCanvas day={activeDay} isDark={isDark} />
        <LogDaySidebar day={activeDay} isDark={isDark} />
      </div>
    </div>
  );
}

function LogSheetCanvas({ day, isDark }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 320 });
  const [hoverInfo, setHoverInfo] = useState(null);

  useEffect(() => {
    if (!containerRef.current || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver((entries) => {
      const rect = entries[0].contentRect;
      setDimensions({
        width: rect.width,
        height: Math.max(280, Math.min(420, rect.width * 0.55)),
      });
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!day || !canvasRef.current || !dimensions.width) return;

    // Calculate required height based on remarks
    const remarkCount = day.events?.filter(e => e.location || e.note).length || 0;
    const baseHeight = Math.max(280, Math.min(420, dimensions.width * 0.55));
    const remarksHeight = 200 + (remarkCount * 15); // Fixed space + per-remark space
    const totalHeight = baseHeight + remarksHeight;

    const { width } = dimensions;
    const height = totalHeight;

    const canvas = canvasRef.current;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawLogGrid(ctx, width, height, day, isDark);
  }, [day, isDark, dimensions]);

  if (!day) {
    return null;
  }

  const handleMouseMove = (e) => {
    if (!day || !dimensions.width) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Grid config from drawLogGrid
    const padding = { top: 40, right: 30, bottom: 200, left: 100 };
    const gridWidth = dimensions.width - padding.left - padding.right;

    // Check if mouse is within grid horizontal bounds
    if (x < padding.left || x > dimensions.width - padding.right) {
      setHoverInfo(null);
      return;
    }

    // Calculate time from X
    const minuteWidth = gridWidth / 1440;
    const minute = (x - padding.left) / minuteWidth;
    const clampedMinute = Math.max(0, Math.min(1440, minute));

    // Find event at this time
    const event = day.events?.find(ev =>
      clampedMinute >= ev.startMinutes && clampedMinute < ev.endMinutes
    );

    if (event) {
      setHoverInfo({
        x: e.clientX, // Screen coords for fixed/absolute tooltip
        y: e.clientY,
        canvasX: x,
        canvasY: y,
        minute: clampedMinute,
        event
      });
    } else {
      setHoverInfo(null);
    }
  };

  const handleMouseLeave = () => {
    setHoverInfo(null);
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative flex flex-col rounded-2xl border p-4 lg:p-6',
        isDark ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-white'
      )}
    >
      <div className="mb-4 flex flex-wrap items-center gap-3 text-sm">
        <div className="flex items-center gap-2">
          <CalendarDays size={16} className="text-emerald-400" />
          <span className="font-semibold">{day.label}</span>
        </div>
        <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500">
          <Clock3 size={14} />
          {Math.round(day.coverage * 100)}% of 24h accounted
        </div>
        {day.headline && <span className="text-xs text-slate-500">{day.headline}</span>}
      </div>
      <div className="relative">
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={`FMCSA log grid for ${day.label}`}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="cursor-crosshair w-full"
        />
        {hoverInfo && (
          <div
            className={cn(
              "pointer-events-none fixed z-50 rounded-lg border p-3 shadow-xl backdrop-blur-md",
              isDark ? "bg-slate-900/95 border-slate-700 text-slate-200" : "bg-white/95 border-slate-200 text-slate-700"
            )}
            style={{
              left: hoverInfo.x + 15,
              top: hoverInfo.y + 15,
              minWidth: '200px'
            }}
          >
            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-dashed border-slate-500/30">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: getStatusColor(hoverInfo.event.statusKey).color }} />
              <span className="font-bold text-sm">{hoverInfo.event.label}</span>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="opacity-70">Time:</span>
                <span className="font-mono">{hoverInfo.event.windowLabel}</span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-70">Duration:</span>
                <span className="font-mono">{formatHours(hoverInfo.event.durationMinutes)}</span>
              </div>
              {(hoverInfo.event.location || hoverInfo.event.note) && (
                <div className="pt-1 mt-1 border-t border-slate-500/10 opacity-90">
                  {hoverInfo.event.location && <div>📍 {hoverInfo.event.location}</div>}
                  {hoverInfo.event.note && <div>📝 {hoverInfo.event.note}</div>}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <StatusLegend isDark={isDark} />
    </div>
  );
}

function StatusLegend({ isDark }) {
  return (
    <div className="mt-6 flex flex-wrap gap-4 text-xs font-medium">
      {STATUS_ROWS.map((row) => (
        <div key={row.key} className="flex items-center gap-2">
          <span className="h-2 w-6 rounded-full" style={{ background: row.color }} />
          <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>{row.label}</span>
        </div>
      ))}
    </div>
  );
}

function LogDaySidebar({ day, isDark }) {
  if (!day) return null;

  return (
    <div className={cn(
      'flex min-h-[320px] flex-col gap-5 rounded-2xl border p-4 lg:p-6',
      isDark ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-white'
    )}>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <SummaryChip label="Driving" value={formatHours(day.totals.drivingMinutes)} accent="emerald" />
        <SummaryChip label="On Duty" value={formatHours(day.totals.onDutyMinutes)} accent="amber" />
        <SummaryChip label="Rest" value={formatHours(day.totals.restMinutes)} accent="sky" />
        <SummaryChip label="Sleeper" value={formatHours(day.totals.sleeperMinutes)} accent="violet" />
      </div>

      <ViolationsList violations={day.violations} isDark={isDark} />
      <EventTimeline events={day.events} isDark={isDark} />
    </div>
  );
}

function SummaryChip({ label, value, accent }) {
  const palette = {
    emerald: { text: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    amber: { text: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    sky: { text: 'text-sky-500', bg: 'bg-sky-500/10', border: 'border-sky-500/20' },
    violet: { text: 'text-violet-500', bg: 'bg-violet-500/10', border: 'border-violet-500/20' },
  }[accent] || { text: 'text-slate-500', bg: 'bg-slate-500/10', border: 'border-slate-500/20' };

  return (
    <div className={cn('rounded-xl border px-3 py-2', palette.bg, palette.border, palette.text)}>
      <p className="text-[11px] uppercase tracking-wide">{label}</p>
      <p className="font-mono text-lg">{value}</p>
    </div>
  );
}

function ViolationsList({ violations, isDark }) {
  if (!violations?.length) {
    return (
      <div className={cn(
        'rounded-xl border px-3 py-2 text-sm',
        isDark ? 'border-slate-800 bg-slate-900/60 text-slate-400' : 'border-slate-200 bg-white text-slate-500'
      )}>
        <p className="font-semibold text-xs uppercase tracking-wide text-emerald-500">Compliance</p>
        <p>No violations logged for this day.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-rose-400">Violations</p>
      {violations.map((violation, idx) => (
        <div
          key={`${violation.type}-${idx}`}
          className={cn('rounded-xl border px-3 py-2 text-sm', VIOLATION_TINT[violation.severity || 'warning'])}
        >
          <p className="font-semibold">{violation.type}</p>
          {violation.detail && <p className="text-xs opacity-80">{violation.detail}</p>}
          {violation.at && <p className="text-[11px] opacity-60 mt-1">at {violation.at}</p>}
        </div>
      ))}
    </div>
  );
}

function EventTimeline({ events, isDark }) {
  if (!events?.length) return null;

  return (
    <div className="space-y-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Event Timeline</p>
      <div className="relative pl-4">
        <span className={cn(
          'absolute left-0 top-1 h-full w-0.5',
          isDark ? 'bg-slate-800' : 'bg-slate-200'
        )} />
        <div className="space-y-3">
          {events.map((event, idx) => (
            <div key={`${event.status}-${event.startMinutes}-${idx}`} className="relative flex flex-col gap-1 pl-4">
              <span className="absolute left-[-7px] top-1 h-3 w-3 rounded-full border-2 border-white"
                style={{ background: getStatusColor(event.statusKey).color, borderColor: isDark ? '#020617' : '#f8fafc' }} />
              <p className="flex items-center justify-between text-sm font-medium">
                <span className="capitalize">{event.label}</span>
                <span className="font-mono text-xs text-slate-500">{event.windowLabel}</span>
              </p>
              {(event.location || event.note) && (
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  {event.location && <MapPin size={12} />}
                  <span>{event.location || event.note}</span>
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function getStatusColor(statusKey) {
  const fallback = STATUS_ROWS[0];
  return STATUS_ROWS.find((row) => row.key === statusKey) || fallback;
}

function drawSegments(ctx, events, { padding, rowGap, minuteWidth, isDark }) {
  if (!events?.length) return;
  let lastRowY = null;

  events.forEach((event) => {
    const { statusKey, startMinutes, endMinutes } = event;
    if (startMinutes == null || endMinutes == null) return;
    const rowIndex = STATUS_ROWS.findIndex((row) => row.key === statusKey);
    if (rowIndex === -1) return;

    const y = padding.top + rowIndex * rowGap;
    const startX = padding.left + startMinutes * minuteWidth;
    const endX = padding.left + endMinutes * minuteWidth;
    const color = getStatusColor(statusKey).color;

    // Draw vertical connector line from previous status
    if (lastRowY !== null && lastRowY !== y) {
      ctx.strokeStyle = isDark ? '#475569' : '#94a3b8';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      // Draw at the exact start time of the new segment
      ctx.moveTo(startX, lastRowY);
      ctx.lineTo(startX, y);
      ctx.stroke();
    }

    // Draw horizontal status line
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.lineCap = 'butt'; // 'butt' for precise transitions
    ctx.beginPath();
    ctx.moveTo(startX, y);
    ctx.lineTo(endX, y);
    ctx.stroke();

    lastRowY = y;
  });
}

function drawLogGrid(ctx, width, height, day, isDark) {
  // Config
  const padding = { top: 40, right: 30, bottom: 200, left: 100 }; // Increased bottom for remarks
  const remarksStartY = height - 160;
  const gridHeight = remarksStartY - padding.top - 40; // Space for grid
  const gridWidth = width - padding.left - padding.right;

  const colors = {
    bg: isDark ? '#020617' : '#ffffff',
    text: isDark ? '#94a3b8' : '#475569',
    textDark: isDark ? '#e2e8f0' : '#1e293b',
    border: isDark ? '#1e293b' : '#e2e8f0',
    gridLine: isDark ? 'rgba(148,163,184,0.1)' : 'rgba(15,23,42,0.05)',
    hourLine: isDark ? 'rgba(148,163,184,0.2)' : 'rgba(15,23,42,0.15)',
  };

  // 1. Clear & Background
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = colors.bg;
  ctx.fillRect(0, 0, width, height);

  // 2. Main Grid Box
  ctx.strokeStyle = colors.border;
  ctx.lineWidth = 2;
  ctx.strokeRect(padding.left, padding.top, gridWidth, gridHeight);

  // 3. Status Rows (Horizontal)
  const rowGap = gridHeight / (STATUS_ROWS.length - 1); // 4 rows -> 3 gaps? No, lines are drawn ON rows
  // Actually FMCSA grid has 4 distinct rows. We usually draw lines in the *middle* of the row band or on the line? 
  // Standard is lines roughly on the row. Let's stick to current logic: 0=Off, 1=SB, 2=D, 3=ON.

  ctx.font = 'bold 12px "Inter", sans-serif';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';

  STATUS_ROWS.forEach((row, idx) => {
    const y = padding.top + idx * rowGap;

    // Horizontal line
    ctx.strokeStyle = colors.gridLine;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();

    // Label
    ctx.fillStyle = colors.text;
    ctx.fillText(row.label, padding.left - 15, y);
    ctx.fillStyle = row.color;
    ctx.fillText(row.short, padding.left - 15, y + 14); // Short code below
  });

  // 4. Time Rulers (Vertical Lines)
  // We need two rulers: Top of grid and Top of Remarks
  const drawTimeRuler = (yPos) => {
    const minuteWidth = gridWidth / 1440;
    ctx.fillStyle = colors.text;
    ctx.textAlign = 'center';
    ctx.font = '10px "Inter", sans-serif';

    for (let i = 0; i <= 24; i++) {
      const x = padding.left + (i * 60) * minuteWidth;
      const h = i === 0 || i === 24 ? 'M' : i === 12 ? 'N' : i > 12 ? i - 12 : i;

      // Major tick
      ctx.strokeStyle = colors.hourLine;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, yPos);
      ctx.lineTo(x, yPos - 10);
      ctx.stroke();

      // Label
      ctx.fillText(h, x, yPos - 15);

      // Minor ticks (15, 30, 45)
      if (i < 24) {
        for (let j = 1; j < 4; j++) {
          const xm = x + (j * 15) * minuteWidth;
          ctx.strokeStyle = colors.gridLine;
          ctx.beginPath();
          ctx.moveTo(xm, yPos);
          ctx.lineTo(xm, yPos - 5);
          ctx.stroke();
        }
      }
    }
  };

  // Draw Grid Vertical Lines (Full Height)
  const minuteWidth = gridWidth / 1440;
  for (let i = 0; i <= 24; i++) {
    const x = padding.left + (i * 60) * minuteWidth;
    ctx.strokeStyle = colors.hourLine;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, padding.top);
    ctx.lineTo(x, padding.top + gridHeight);
    ctx.stroke();
  }

  // Draw Top Ruler
  drawTimeRuler(padding.top);

  // Draw Graph Lines
  drawSegments(ctx, day.events, { padding, rowGap, minuteWidth, isDark });

  // 5. Remarks Section
  const remarksTop = padding.top + gridHeight + 40;
  ctx.fillStyle = colors.textDark;
  ctx.font = 'bold 14px "Inter", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText("REMARKS", padding.left, remarksTop - 35);

  // Second Time Ruler for Remarks
  ctx.strokeStyle = colors.border;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padding.left, remarksTop);
  ctx.lineTo(width - padding.right, remarksTop);
  ctx.stroke();
  drawTimeRuler(remarksTop);

  // Draw Remarks Text
  // We need to list remarks. We can place them visually at their time slot if possible, or just list them?
  // FMCSA usually lists them or draws lines to the time.
  // Implementation: List them below the ruler, connecting to the time slightly.

  if (day.events) {
    let currentY = remarksTop + 25;
    day.events.forEach((ev) => {
      if (!ev.location && !ev.note) return;

      // Dot on the time ruler
      const x = padding.left + ev.startMinutes * minuteWidth;
      ctx.fillStyle = isDark ? '#fff' : '#000';
      ctx.beginPath();
      ctx.arc(x, remarksTop, 2, 0, Math.PI * 2);
      ctx.fill();

      // Line down to text
      ctx.strokeStyle = colors.gridLine;
      ctx.beginPath();
      ctx.moveTo(x, remarksTop);
      ctx.lineTo(x, currentY - 5);
      ctx.stroke();

      // Text
      const timeStr = formatClock(ev.startMinutes);
      const locStr = ev.location || '';
      const noteStr = ev.note || '';
      const text = `${timeStr} - ${locStr} ${noteStr ? `(${noteStr})` : ''}`;

      ctx.fillStyle = colors.text;
      ctx.font = '11px "Inter", sans-serif';
      ctx.fillText(text, padding.left + 5, currentY); // List on left? 
      // Better: List them vertically found the timeline? No, that gets crowded.
      // Let's list completely vertically on the left side, but with the line pointing to the time.
      // Or just simpler: List them in 2 columns below?

      // Let's stick to a simple vertical list for legibility, with lines pointing to time X.
      // Actually, just listing them is cleaner for this digital view.
      // We'll draw the text at 'x' constrained? No, text overlap.
      // Backtrack: Just list them rows.

      // Draw dashed line from time x to row y?
      ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(x, remarksTop);
      ctx.lineTo(x, currentY - 4);
      ctx.lineTo(padding.left + 100, currentY - 4); // Indent
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillText(text, padding.left + 110, currentY);
      currentY += 15;
    });
  }
}

function normalizeLogDays(tripResult) {
  if (!tripResult) return [];

  const possibleArrays = [
    tripResult.daily_logs,
    tripResult.logs,
    tripResult.hos_logs,
    tripResult.hos?.daily_logs,
    tripResult.summary?.daily_logs,
    tripResult.summary?.logs,
    tripResult.logbook,
  ];

  const source = possibleArrays.find(Array.isArray);
  if (!source) return [];

  return source
    .map((day, idx) => normalizeDay(day, idx))
    .filter(Boolean);
}

function normalizeDay(day, index) {
  if (!day) return null;
  const events = normalizeEvents(day);
  const totals = computeTotals(day, events);

  const dateSource = day.date || day.day || day.log_date || day.start_date || (events[0]?.startTimeISO ?? null);

  // ...


  const id = day.id || dateSource || `day-${index}`;

  return {
    id,
    label: formatDateLabel(dateSource, index),
    date: dateSource,
    events,
    totals,
    violations: normalizeViolations(day),
    coverage: totals.coverage,
    headline: day.headline || day.note || day.summary,
    isSample: false,
  };
}

function normalizeEvents(day) {
  const rawEvents = getEventArray(day);
  if (!rawEvents.length) return [];

  const dateHint = day.date || day.day || day.log_date;
  return rawEvents
    .map((event) => normalizeEvent(event, dateHint))
    .filter(Boolean)
    .sort((a, b) => a.startMinutes - b.startMinutes);
}

function getEventArray(day) {
  const segments = Array.isArray(day.segments) ? day.segments : [];
  const remarks = Array.isArray(day.remarks) ? day.remarks : [];
  const events = Array.isArray(day.events) ? day.events : [];

  const combined = [...segments, ...remarks, ...events];
  if (combined.length > 0) return combined;

  if (Array.isArray(day.timeline)) return day.timeline;
  if (Array.isArray(day.periods)) return day.periods;
  return [];
}

function normalizeEvent(event, dateHint) {
  const statusKey = STATUS_LOOKUP[(event.status || event.state || event.label || '').toLowerCase()];

  // Allow events with no status if they have a note/location (remarks)
  if (!statusKey && !event.note && !event.location) return null;

  let startMinutes = resolveMinutes(event.start_minutes ?? event.start ?? event.start_time ?? event.startHour, dateHint);
  let endMinutes = resolveMinutes(event.end_minutes ?? event.end ?? event.end_time ?? event.endHour, dateHint);

  // Handle start_hour / end_hour explicitly (conversion from hours to minutes)
  if (startMinutes == null && event.start_hour != null) {
    startMinutes = Math.round(event.start_hour * 60);
  }
  if (endMinutes == null && event.end_hour != null) {
    endMinutes = Math.round(event.end_hour * 60);
  }

  if (startMinutes == null || endMinutes == null || endMinutes <= startMinutes) return null;

  return {
    statusKey,
    label: statusKey ? getStatusColor(statusKey).label : 'Remark',
    startMinutes,
    endMinutes,
    durationMinutes: endMinutes - startMinutes,
    location: event.location || event.city || event.place,
    note: event.note || event.reason,
    startTimeISO: typeof event.start === 'string' ? event.start : undefined,
    endTimeISO: typeof event.end === 'string' ? event.end : undefined,
    windowLabel: `${formatClock(startMinutes)} - ${formatClock(endMinutes)}`,
  };
}



function resolveMinutes(value, dateHint) {
  if (value == null) return null;
  if (typeof value === 'number') return clampMinutes(value);
  if (typeof value === 'string') {
    if (/^\d{1,2}:\d{2}$/.test(value)) {
      const [h, m] = value.split(':').map(Number);
      return clampMinutes(h * 60 + m);
    }
    if (!Number.isNaN(Number(value))) {
      const parsed = parseFloat(value);
      return clampMinutes(parsed > 24 ? parsed : parsed * 60);
    }
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      const midnight = new Date(date);
      midnight.setHours(0, 0, 0, 0);
      return clampMinutes((date.getTime() - midnight.getTime()) / 60000);
    }
    if (dateHint) {
      const iso = new Date(`${dateHint}T${value}`);
      if (!Number.isNaN(iso.getTime())) {
        const midnight = new Date(dateHint);
        midnight.setHours(0, 0, 0, 0);
        return clampMinutes((iso - midnight) / 60000);
      }
    }
  }
  return null;
}

function clampMinutes(value) {
  return Math.max(0, Math.min(1440, Math.round(value)));
}

function computeTotals(day, events) {
  const totals = {
    drivingMinutes: 0,
    onDutyMinutes: 0,
    restMinutes: 0,
    sleeperMinutes: 0,
    offDutyMinutes: 0,
    coverage: 0,
  };

  if (!events.length) return totals;

  let covered = 0;
  events.forEach((event) => {
    covered += event.durationMinutes;
    if (event.statusKey === 'driving') totals.drivingMinutes += event.durationMinutes;
    if (event.statusKey === 'on-duty' || event.statusKey === 'driving') totals.onDutyMinutes += event.durationMinutes;
    if (event.statusKey === 'off-duty') totals.offDutyMinutes += event.durationMinutes;
    if (event.statusKey === 'sleeper') totals.sleeperMinutes += event.durationMinutes;
  });

  totals.restMinutes = totals.offDutyMinutes + totals.sleeperMinutes;
  totals.coverage = covered / 1440;
  return totals;
}

function normalizeViolations(day) {
  if (!day?.violations?.length) return [];
  return day.violations.map((violation) => ({
    type: violation.type || violation.code || 'Violation',
    detail: violation.detail || violation.message || violation.description,
    severity: violation.severity || (violation.type?.toLowerCase().includes('critical') ? 'critical' : 'warning'),
    at: violation.at || violation.time,
  }));
}

function formatDateLabel(dateValue, index) {
  if (!dateValue) return `Day ${index + 1}`;
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return `Day ${index + 1}`;
  return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatHours(minutes) {
  if (!minutes) return '0h';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hours}h`;
  if (hours === 0) return `${mins}m`;
  return `${hours}h ${String(mins).padStart(2, '0')}m`;
}

function formatClock(minutes) {
  const totalMinutes = Math.round(minutes);
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const hour12 = ((hours + 11) % 12) + 1;
  return `${hour12}:${String(mins).padStart(2, '0')} ${suffix}`;
}

function buildSampleLogDays(tripResult) {
  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() - 1);

  const sampleTemplate = [
    [
      { statusKey: 'off-duty', startMinutes: 0, endMinutes: 300, location: 'Home Terminal' },
      { statusKey: 'on-duty', startMinutes: 300, endMinutes: 360, location: 'Pre-trip' },
      { statusKey: 'driving', startMinutes: 360, endMinutes: 600, location: 'I-84' },
      { statusKey: 'break', startMinutes: 600, endMinutes: 645 },
      { statusKey: 'driving', startMinutes: 645, endMinutes: 825, location: 'Boise, ID' },
      { statusKey: 'on-duty', startMinutes: 825, endMinutes: 870, location: 'Fuel + Inspect' },
      { statusKey: 'driving', startMinutes: 870, endMinutes: 990, location: 'Pendleton, OR' },
      { statusKey: 'sleeper', startMinutes: 990, endMinutes: 1320, location: 'Rest Area' },
      { statusKey: 'off-duty', startMinutes: 1320, endMinutes: 1440, location: 'Off Duty' },
    ],
    [
      { statusKey: 'sleeper', startMinutes: 0, endMinutes: 360, location: 'Rest Area' },
      { statusKey: 'on-duty', startMinutes: 360, endMinutes: 420, location: 'Pre-trip' },
      { statusKey: 'driving', startMinutes: 420, endMinutes: 660, location: 'Columbia River' },
      { statusKey: 'on-duty', startMinutes: 660, endMinutes: 705, location: 'Load Check' },
      { statusKey: 'driving', startMinutes: 705, endMinutes: 900, location: 'Portland, OR' },
      { statusKey: 'on-duty', startMinutes: 900, endMinutes: 960, location: 'Dock Time' },
      { statusKey: 'off-duty', startMinutes: 960, endMinutes: 1200, location: 'Hotel' },
      { statusKey: 'sleeper', startMinutes: 1200, endMinutes: 1440, location: 'Sleeper Berth' },
    ],
  ];

  return sampleTemplate.map((segments, idx) => {
    const date = new Date(baseDate);
    date.setDate(baseDate.getDate() + idx);
    const events = segments
      .map((segment) => {
        if (segment.statusKey === 'break') {
          return null;
        }
        const durationMinutes = segment.endMinutes - segment.startMinutes;
        return {
          statusKey: segment.statusKey,
          label: getStatusColor(segment.statusKey).label,
          startMinutes: segment.startMinutes,
          endMinutes: segment.endMinutes,
          durationMinutes,
          location: segment.location,
          windowLabel: `${formatClock(segment.startMinutes)} - ${formatClock(segment.endMinutes)}`,
        };
      })
      .filter(Boolean);

    const totals = computeTotals({}, events);
    return {
      id: `sample-${idx}`,
      label: date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }),
      date: date.toISOString(),
      events,
      totals,
      coverage: totals.coverage,
      violations: idx === 1 ? [{
        type: '14-Hour Window Warning',
        detail: 'On-duty time nearly exceeded 14-hour limit. Plan next rest earlier.',
        severity: 'warning',
      }] : [],
      isSample: true,
    };
  });
}
