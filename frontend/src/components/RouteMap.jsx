import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Clock, Route, MapPin, Fuel as FuelIcon, Coffee, BedDouble, Flag, Truck, Package } from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';
import { useTheme } from '@/hooks/useTheme';

const TILES = {
    dark: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    light: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
};

// ── Icon Factory ──
const makeIcon = (Icon, bg, ring, pulse = false) => {
    const html = renderToStaticMarkup(
        <div
            className={`flex h-9 w-9 items-center justify-center rounded-full shadow-lg ${bg} ${pulse ? 'marker-pulse' : ''}`}
            style={{ border: '3px solid var(--bg-primary, #020617)', boxShadow: `0 0 0 2px ${ring}, 0 4px 12px rgba(0,0,0,0.3)` }}
        >
            <Icon size={16} strokeWidth={2.5} color="#fff" />
        </div>
    );
    return L.divIcon({ html, className: '', iconSize: [36, 36], iconAnchor: [18, 18], popupAnchor: [0, -22] });
};

const ICONS = {
    start: makeIcon(Truck, 'bg-emerald-500', 'rgba(16,185,129,0.3)', true),
    pickup: makeIcon(Package, 'bg-blue-500', 'rgba(59,130,246,0.3)'),
    dropoff: makeIcon(Flag, 'bg-amber-500', 'rgba(245,158,11,0.3)'),
    fuel: makeIcon(FuelIcon, 'bg-purple-500', 'rgba(168,85,247,0.3)'),
    rest: makeIcon(BedDouble, 'bg-indigo-500', 'rgba(99,102,241,0.3)'),
    break: makeIcon(Coffee, 'bg-cyan-500', 'rgba(6,182,212,0.3)'),
    stop: makeIcon(MapPin, 'bg-slate-500', 'rgba(100,116,139,0.3)'),
};

// ── Fit-Bounds Controller ──
function FitBounds({ bounds }) {
    const map = useMap();
    useEffect(() => {
        if (bounds) map.fitBounds(bounds, { padding: [60, 60], maxZoom: 13, duration: 0.8 });
    }, [bounds, map]);
    return null;
}

// ── Stop Popup ──
function StopPopup({ stop, isDark }) {
    const colorMap = { pickup: '#3b82f6', dropoff: '#f59e0b', fuel: '#a855f7', rest: '#6366f1', break: '#06b6d4', stop: '#64748b' };
    const iconMap = { pickup: Package, dropoff: Flag, fuel: FuelIcon, rest: BedDouble, break: Coffee, stop: MapPin };
    const Icon = iconMap[stop.type] || MapPin;
    const color = colorMap[stop.type] || '#64748b';

    return (
        <div className="p-4 min-w-[220px]">
            <div className="flex items-center gap-2 mb-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: `${color}18` }}>
                    <Icon size={14} color={color} />
                </div>
                <span className="text-sm font-semibold capitalize" style={{ color: isDark ? '#f8fafc' : '#0f172a' }}>{stop.type}</span>
            </div>
            <p className="text-xs mb-3" style={{ color: isDark ? '#94a3b8' : '#64748b' }}>{stop.location}</p>
            <div className="flex gap-4 text-xs pt-2" style={{ borderTop: `1px solid ${isDark ? '#1e293b' : '#e2e8f0'}` }}>
                <div>
                    <span className="block" style={{ color: isDark ? '#64748b' : '#94a3b8' }}>Time</span>
                    <span className="font-mono" style={{ color: isDark ? '#e2e8f0' : '#1e293b' }}>
                        {new Date(stop.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
                {stop.duration_mins > 0 && (
                    <div>
                        <span className="block" style={{ color: isDark ? '#64748b' : '#94a3b8' }}>Duration</span>
                        <span className="font-mono" style={{ color: isDark ? '#e2e8f0' : '#1e293b' }}>
                            {stop.duration_mins >= 60
                                ? `${Math.floor(stop.duration_mins / 60)}h ${stop.duration_mins % 60}m`
                                : `${stop.duration_mins}m`}
                        </span>
                    </div>
                )}
            </div>
            {stop.note && <p className="text-[11px] mt-2 italic" style={{ color: '#10b981' }}>{stop.note}</p>}
        </div>
    );
}

// ── Main Component ──
export function RouteMap({ tripResult }) {
    const { isDark } = useTheme();
    const center = [39.8283, -98.5795];

    const { bounds, legs, stops } = useMemo(() => {
        if (!tripResult) return { bounds: null, legs: [], stops: [] };
        const pts = tripResult.route.legs.flatMap(l => l.geometry);
        return {
            bounds: pts.length > 0 ? L.latLngBounds(pts) : null,
            legs: tripResult.route.legs,
            stops: tripResult.stops,
        };
    }, [tripResult]);

    return (
        <div className="h-full w-full relative">
            <MapContainer
                center={center}
                zoom={4}
                style={{ height: '100%', width: '100%', background: isDark ? '#020617' : '#f8fafc' }}
                zoomControl={false}
                key={isDark ? 'dark' : 'light'}
            >
                <TileLayer
                    url={isDark ? TILES.dark : TILES.light}
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
                />

                {bounds && <FitBounds bounds={bounds} />}

                {/* Route shadow */}
                {legs.map((leg, i) => (
                    <Polyline
                        key={`shadow-${i}`}
                        positions={leg.geometry}
                        pathOptions={{ color: i === 0 ? '#10b981' : '#f59e0b', weight: 10, opacity: isDark ? 0.15 : 0.12, lineCap: 'round', lineJoin: 'round' }}
                    />
                ))}

                {/* Route line */}
                {legs.map((leg, i) => (
                    <Polyline
                        key={`line-${i}`}
                        positions={leg.geometry}
                        pathOptions={{ color: i === 0 ? '#10b981' : '#f59e0b', weight: 4, opacity: 0.9, lineCap: 'round', lineJoin: 'round' }}
                    />
                ))}

                {/* Start marker (current location) */}
                {legs.length > 0 && legs[0].geometry.length > 0 && (
                    <Marker position={legs[0].geometry[0]} icon={ICONS.start}>
                        <Tooltip direction="top" offset={[0, -20]} opacity={1} className="custom-tooltip">
                            <div className="p-3 min-w-[180px]">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-500/10">
                                        <Truck size={14} className="text-emerald-500" />
                                    </div>
                                    <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Start Point</span>
                                </div>
                                <p className={`text-xs pl-8 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{legs[0].from || 'Current Location'}</p>
                            </div>
                        </Tooltip>
                    </Marker>
                )}

                {/* Stop markers */}
                {stops.map((stop, i) => {
                    if (!stop.lat || !stop.lng) return null;
                    return (
                        <Marker key={i} position={[stop.lat, stop.lng]} icon={ICONS[stop.type] || ICONS.stop}>
                            <Tooltip direction="top" offset={[0, -20]} opacity={1} className="custom-tooltip">
                                <StopPopup stop={stop} isDark={isDark} />
                            </Tooltip>
                        </Marker>
                    );
                })}

                {/* End marker (final dropoff) */}
                {legs.length > 0 && legs[legs.length - 1].geometry.length > 0 && (
                    <Marker position={legs[legs.length - 1].geometry[legs[legs.length - 1].geometry.length - 1]} icon={ICONS.dropoff}>
                        <Tooltip direction="top" offset={[0, -20]} opacity={1} className="custom-tooltip">
                            <div className="p-3 min-w-[180px]">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-500/10">
                                        <Flag size={14} className="text-amber-500" />
                                    </div>
                                    <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Destination</span>
                                </div>
                                <p className={`text-xs pl-8 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{legs[legs.length - 1].to || 'Dropoff Location'}</p>
                            </div>
                        </Tooltip>
                    </Marker>
                )}
            </MapContainer>

            {/* ── Stats Overlay ── */}
            {tripResult && (
                <div className="absolute top-4 left-4 z-[1000] flex gap-2">
                    <div className={`backdrop-blur-md border rounded-xl px-4 py-2.5 flex items-center gap-2.5 shadow-xl ${isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-slate-200'}`}>
                        <Route size={14} className="text-emerald-500" />
                        <span className={`text-sm font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>{tripResult.route.total_distance_miles} mi</span>
                    </div>
                    <div className={`backdrop-blur-md border rounded-xl px-4 py-2.5 flex items-center gap-2.5 shadow-xl ${isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-slate-200'}`}>
                        <Clock size={14} className="text-amber-500" />
                        <span className={`text-sm font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>{tripResult.route.total_duration_hours}h</span>
                    </div>
                </div>
            )}

            {/* ── Legend ── */}
            <div className={`absolute bottom-4 right-4 z-[1000] backdrop-blur-md border p-3 rounded-xl text-xs space-y-1.5 shadow-xl ${isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-slate-200'}`}>
                <div className="flex items-center gap-2"><div className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>To Pickup</span></div>
                <div className="flex items-center gap-2"><div className="h-2.5 w-2.5 rounded-full bg-amber-500" />  <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>To Dropoff</span></div>
            </div>
        </div>
    );
}
