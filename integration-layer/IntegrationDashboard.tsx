

Here is the complete, self-contained `IntegrationDashboard.tsx` file.

This component is designed to be highly visual and interactive. Since you requested a self-contained file, I have included a `TailwindConfigProvider` at the bottom of the file. If you are integrating this into a larger project with an existing Tailwind setup, you can ignore the provider and just use the `IntegrationDashboard` component.

### Key Features Implemented:
1.  **Reactive State Management**: Simulates real-time health checks and data synchronization.
2.  **Visual Topology**: A dedicated "Architecture View" tab showing the data flow between Authentik, PocketBase, and Medusa.
3.  **Interactive Controls**: You can manually trigger a "Sync" or "Health Check" to see the loading states and UI updates.
4.  **Glassmorphism UI**: Uses semi-transparent backgrounds and blurs for a modern, high-end dashboard look.

```tsx
import React, { useState, useEffect, useMemo } from 'react';
import { 
  User, 
  Activity, 
  Database, 
  Globe, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Zap,
  Layers,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

// --- Types ---

type ServiceName = 'authentik' | 'pocketbase' | 'medusa';

interface Service {
  id: ServiceName;
  name: string;
  status: 'healthy' | 'error' | 'loading' | 'unknown';
  latency: number;
  uptime: string;
  version: string;
}

interface DashboardStats {
  totalUsers: number;
  activeSessions: number;
  lastSync: Date;
  systemLoad: number;
}

// --- Mock Data Generators ---

const generateRandomLatency = () => Math.floor(Math.random() * 150) + 20;

const INITIAL_SERVICES: Record<ServiceName, Service> = {
  authentik: {
    id: 'authentik',
    name: 'Authentik',
    status: 'healthy',
    latency: 45,
    uptime: '14d 2h',
    version: '2023.10.4'
  },
  pocketbase: {
    id: 'pocketbase',
    name: 'PocketBase',
    status: 'healthy',
    latency: 12,
    uptime: '45d 12h',
    version: 'v0.22.0'
  },
  medusa: {
    id: 'medusa',
    name: 'Medusa',
    status: 'healthy',
    latency: 110,
    uptime: '8d 4h',
    version: 'v1.20.0'
  }
};

// --- Helper Components ---

const StatusIndicator: React.FC<{ status: Service['status'] }> = ({ status }) => {
  const config = {
    healthy: { color: 'bg-emerald-500', shadow: 'shadow-emerald-500/50' },
    error: { color: 'bg-rose-500', shadow: 'shadow-rose-500/50', animate: 'animate-pulse' },
    loading: { color: 'bg-amber-400', shadow: 'shadow-amber-400/50', animate: 'animate-ping' },
    unknown: { color: 'bg-slate-500', shadow: '' }
  };

  const current = config[status] || config.unknown;

  return (
    <div className="relative flex items-center justify-center w-3 h-3">
      <div className={`absolute w-3 h-3 rounded-full ${current.color} ${current.shadow} opacity-75`}></div>
      <div className={`absolute w-3 h-3 rounded-full ${current.color} ${status === 'loading' ? 'animate-ping' : ''}`}></div>
    </div>
  );
};

const ConnectorLine: React.FC<{ active: boolean; label: string }> = ({ active, label }) => {
  return (
    <div className="flex flex-col items-center justify-center w-24 md:w-32">
      <div className={`h-1 w-full rounded-full transition-all duration-1000 ${active ? 'bg-gradient-to-r from-blue-500 to-purple-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'bg-slate-700'}`}></div>
      <span className={`text-[10px] uppercase font-bold mt-2 tracking-wider ${active ? 'text-blue-400' : 'text-slate-600'}`}>
        {label}
      </span>
      {active && <div className="absolute -bottom-1 w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>}
    </div>
  );
};

// --- Main Component ---

const IntegrationDashboard: React.FC = () => {
  const [services, setServices] = useState<Record<ServiceName, Service>>(INITIAL_SERVICES);
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 12450,
    activeSessions: 342,
    lastSync: new Date(),
    systemLoad: 42
  });
  const [isSyncing, setIsSyncing] = useState(false);

  // Simulate Live Data Updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Randomly fluctuate latency
      setServices(prev => {
        const next = { ...prev };
        (Object.keys(next) as ServiceName[]).forEach(key => {
          next[key] = {
            ...next[key],
            latency: generateRandomLatency(),
            // Randomly flip status occasionally for effect (mostly healthy)
            status: Math.random() > 0.95 ? 'error' : 'healthy'
          };
        });
        return next;
      });

      // Update user count slightly
      setStats(prev => ({
        ...prev,
        activeSessions: Math.max(300, prev.activeSessions + Math.floor(Math.random() * 10 - 5)),
        systemLoad: Math.max(10, Math.min(95, prev.systemLoad + Math.floor(Math.random() * 6 - 3)))
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleHealthCheck = async () => {
    // Set all to loading
    setServices(prev => {
      const next = { ...prev };
      (Object.keys(next) as ServiceName[]).forEach(key => {
        next[key] = { ...next[key], status: 'loading' };
      });
      return next;
    });

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    setServices(prev => {
      const next = { ...prev };
      (Object.keys(next) as ServiceName[]).forEach(key => {
        next[key] = { ...next[key], status: Math.random() > 0.1 ? 'healthy' : 'error' };
      });
      return next;
    });
  };

  const handleSync = async () => {
    setIsSyncing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setStats(prev => ({
      ...prev,
      totalUsers: prev.totalUsers + Math.floor(Math.random() * 5),
      lastSync: new Date()
    }));
    setIsSyncing(false);
  };

  // --- Sub-Views ---

  const ArchitectureView = () => {
    return (
      <div className="w-full h-full flex flex-col md:flex-row items-center justify-center p-8 relative">
        {/* Background Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] rounded-xl"></div>
        
        <div className="z-10 flex flex-col md:flex-row items-center gap-4 md:gap-8 w-full justify-center">
          
          {/* Authentik Node */}
          <div className="flex flex-col items-center group">
            <div className={`relative p-6 rounded-2xl bg-slate-800/80 border backdrop-blur-md transition-all duration-300 transform hover:scale-105 hover:-translate-y-1
              ${services.authentik.status === 'healthy' ? 'border-orange-500/30 shadow-[0_0_30px_-10px_rgba(249,115,22,0.3)]' : 
                services.authentik.status === 'error' ? 'border-red-500/50 shadow-[0_0_30px_-10px_rgba(239,68,68,0.4)]' : 
                'border-slate-700'}`}>
                <div className="absolute -top-3 -right-3">
                   <StatusIndicator status={services.authentik.status} />
                </div>
                <div className="w-12 h-12 rounded-lg bg-orange-500/10 flex items-center justify-center mb-2">
                    <ShieldCheck className="text-orange-500 w-6 h-6" />
                </div>
                <h3 className="text-white font-bold text-sm">Authentik</h3>
                <p className="text-xs text-slate-400">Identity Provider</p>
            </div>
            <div className="mt-2 text-xs font-mono text-orange-400">{services.authentik.latency}ms</div>
          </div>

          <ConnectorLine active={services.authentik.status === 'healthy' && services.pocketbase.status === 'healthy'} label="OAuth 2.0 / SAML" />

          {/* PocketBase Node */}
          <div className="flex flex-col items-center group">
             <div className={`relative p-6 rounded-2xl bg-slate-800/80 border backdrop-blur-md transition-all duration-300 transform hover:scale-105 hover:-translate-y-1
              ${services.pocketbase.status === 'healthy' ? 'border-yellow-500/30 shadow-[0_0_30px_-10px_rgba(234,179,8,0.3)]' : 
                services.pocketbase.status === 'error' ? 'border-red-500/50 shadow-[0_0_30px_-10px_rgba(239,68,68,0.4)]' : 
                'border-slate-700'}`}>
                <div className="absolute -top-3 -right-3">
                   <StatusIndicator status={services.pocketbase.status} />
                </div>
                <div className="w-12 h-12 rounded-lg bg-yellow-500/10 flex items-center justify-center mb-2">
                    <Database className="text-yellow-500 w-6 h-6" />
                </div>
                <h3 className="text-white font-bold text-sm">PocketBase</h3>
                <p className="text-xs text-slate-400">User Store</p>
            </div>
            <div className="mt-2 text-xs font-mono text-yellow-400">{services.pocketbase.latency}ms</div>
          </div>

          <ConnectorLine active={services.pocketbase.status === 'healthy' && services.medusa.status === 'healthy'} label="Webhooks / Sync" />

          {/* Medusa Node */}
          <div className="flex flex-col items-center group">
             <div className={`relative p-6 rounded-2xl bg-slate-800/80 border backdrop-blur-md transition-all duration-300 transform hover:scale-105 hover:-translate-y-1
              ${services.medusa.status === 'healthy' ? 'border-purple-500/30 shadow-[0_0_30px_-10px_rgba(168,85,247,0.3)]' : 
                services.medusa.status === 'error' ? 'border-red-500/50 shadow-[0_0_30px_-10px_rgba(239,68,68,0.4)]' : 
                'border-slate-700'}`}>
                <div className="absolute -top-3 -right-3">
                   <StatusIndicator status={services.medusa.status} />
                </div>
                <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center mb-2">
                    <Layers className="text-purple-500 w-6 h-6" />
                </div>
                <h3 className="text-white font-bold text-sm">Medusa</h3>
                <p className="text-xs text-slate-400">Commerce Engine</p>
            </div>
            <div className="mt-2 text-xs font-mono text-purple-400">{services.medusa.latency}ms</div>
          </div>

        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-8 font-sans text-slate-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
            Stack Monitor
          </h1>
          <p className="text-slate-400 text-sm mt-1">Authentik + PocketBase + Medusa Integration</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleHealthCheck}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm transition-colors text-white shadow-lg"
          >
            <Activity size={16} className="text-blue-400" />
            Check Health
          </button>
          <button 
            onClick={handleSync}
            disabled={isSyncing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-all text-white shadow-[0_0_15px_-5px_rgba(37,99,235,0.5)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw size={16} className={`${isSyncing ? 'animate-spin' : ''}`} />
            Sync Data
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* User Count */}
        <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <User size={64} />
          </div>
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <Globe size={16} />
            <span className="text-xs font-bold uppercase tracking-wider">Total Users</span>
          </div>
          <div className="text-4xl font-bold text-white tabular-nums tracking-tight">
            {stats.totalUsers.toLocaleString()}
          </div>
          <div className="mt-4 h-1 w-full bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 w-[70%] rounded-full shadow-[0_0_10px_rgba(59,130,246,0.8)]"></div>
          </div>
        </div>

        {/* Active Sessions */}
        <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Zap size={64} />
          </div>
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <Activity size={16} />
            <span className="text-xs font-bold uppercase tracking-wider">Active Sessions</span>
          </div>
          <div className="text-4xl font-bold text-white tabular-nums tracking-tight">
            {stats.activeSessions}
          </div>
           <div className="mt-2 flex items-center gap-2 text-xs text-emerald-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Live
          </div>
        </div>

        {/* System Load */}
        <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Activity size={64} />
          </div>
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <Layers size={16} />
            <span className="text-xs font-bold uppercase tracking-wider">System Load</span>
          </div>
          <div className="text-4xl font-bold text-white tabular-nums tracking-tight">
            {stats.systemLoad}%
          </div>
          <div className="mt-4 h-1 w-full bg-slate-800 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 rounded-full ${
                stats.systemLoad > 80 ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.8)]' : 
                stats.systemLoad > 50 ? 'bg-amber-500' : 'bg-emerald-500'
              }`} 
              style={{ width: `${stats.systemLoad}%` }}
            ></div>
          </div>
        </div>

        {/* Last Sync */}
        <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Clock size={64} />
          </div>
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
            <span className="text-xs font-bold uppercase tracking-wider">Last Sync</span>
          </div>
          <div className="text-xl font-bold text-white tracking-tight">
            {stats.lastSync.toLocaleTimeString()}
          </div>
          <div className="text-xs text-slate-500 mt-1">
             {stats.lastSync.toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Main Visualization Area */}
      <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-1 md:p-2 backdrop-blur-xl shadow-2xl min-h-[400px]">
        <ArchitectureView />
      </div>

      {/* Service Logs (Decorative) */}
      <div className="mt-8">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Recent Events</h3>
        <div className="space-y-2">
          {[
            { service: 'Medusa', msg: 'Order webhook received (ID: 8992)', time: 'Just now', type: 'info' },
            { service: 'Authentik', msg: 'User authentication successful', time: '2m ago', type: 'success' },
            { service: 'PocketBase', msg: 'Database backup completed', time: '1h ago', type: 'info' }
          ].map((log, i) => (
            <div key={i} className="flex items-center gap-4 text-sm p-3 rounded-lg bg-slate-800/30 border border-slate-800/50">
              <div className={`w-2 h-2 rounded-full ${log.type === 'success' ? 'bg-emerald-500' : 'bg-blue-500'}`}></div>
              <span className="text-slate-400 w-24 font-mono text-xs">{log.service}</span>
              <span className="text-slate-200 flex-1">{log.msg}</span>
              <span className="text-slate-500 text-xs">{log.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- Wrapper to handle Tailwind in standalone environment ---
const TailwindConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="bg-[#0f172a] min-h-screen text-slate-200 font-sans antialiased selection:bg-blue-500 selection:text-white">
      {children}
    </div>
  );
};

export default function App() {
  return (
    <TailwindConfigProvider>
      <IntegrationDashboard />
    </TailwindConfigProvider>
  );
}
```
 prev.map(c => ({
                        ...c,
                        latency: Math.max(10, c.latency + (Math.random() > 0.5 ? 2 : -2))
                    })));

                    // 3. Random Sync Events (Logs)
                    if (Math.random() > 0.7) {
                        const events = [
                            { type: 'info', message: 'User sync: Authentik -> PocketBase (Batch 404)' },
                            { type: 'info', message: 'Order data pushed to Medusa.' },
                            { type: 'success', message: 'Token refresh verified.' },
                            { type: 'warn', message: 'High memory usage on Medusa worker (78%)' },
                            { type: 'info', message: 'Heartbeat received: 200 OK' }
                        ];
                        const randomEvent = events[Math.floor(Math.random() * events.length)];
                        const now = new Date().toLocaleTimeString('en-US', { hour12: false });
                        
                        setLogs(prev => [...prev.slice(-50), { timestamp: now, ...randomEvent }]);
                    }

                }, 2000);

                return () => clearInterval(interval);
            }, []);

            // Interaction Handler
            const toggleServiceStatus = (serviceId) => {
                setServiceHealth(prev => {
                    const current = prev[serviceId];
                    const nextStatus = current.status === 'healthy' ? 'down' : 'healthy';
                    
                    // Log the event
                    const now = new Date().toLocaleTimeString('en-US', { hour12: false });
                    const msg = nextStatus === 'down' 
                        ? `ALERT: Connection lost to ${serviceId.toUpperCase()}` 
                        : `RECOVERED: ${serviceId.toUpperCase()} back online`;
                    
                    setLogs(l => [...l, { timestamp: now, type: nextStatus === 'down' ? 'error' : 'success', message: msg }]);

                    // Update Connections (if a service goes down, its connections go down)
                    if (nextStatus === 'down') {
                        setConnections(conns => conns.map(c => {
                            if (c.id.includes(serviceId.substring(0, 3))) { // naive match logic
                                return { ...c, status: 'down', latency: 0 };
                            }
                            return c;
                        }));
                    } else {
                        // Restore connections
                        setConnections(conns => conns.map(c => {
                            if (c.id.includes(serviceId.substring(0, 3))) {
                                return { ...c, status: 'healthy', latency: 50 };
                            }
                            return c;
                        }));
                    }

                    return {
                        ...prev,
                        [serviceId]: { 
                            ...current, 
                            status: nextStatus,
                            latency: nextStatus === 'down' ? 0 : 30,
                            load: nextStatus === 'down' ? 0 : 20
                        }
                    };
                });
            };

            // Calculate Aggregate Health
            const allHealthy = Object.values(serviceHealth).every(s => s.status === 'healthy');

            return (
                <div className="min-h-screen p-6 md:p-8 max-w-7xl mx-auto">
                    {/* Header */}
                    <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <div className="bg-blue-500/10 p-2 rounded-lg">
                                    <i className="ph ph-squares-four text-blue-400 text-2xl"></i>
                                </div>
                                <h1 className="text-2xl font-bold text-white tracking-tight">Integration Command Center</h1>
                            </div>
                            <p className="text-slate-400 text-sm ml-1">Monitoring Service Mesh & Data Sync</p>
                        </div>
                        
                        <div className="flex items-center gap-4">
                            <div className="bg-slate-800 border border-slate-700 px-4 py-2 rounded-lg flex items-center gap-3">
                                <span className="text-xs text-slate-400 uppercase font-semibold">System Status</span>
                                {allHealthy ? (
                                    <span className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
                                        <i className="ph-fill ph-check-circle"></i> All Systems Go
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-2 text-rose-400 text-sm font-medium animate-pulse">
                                        <i className="ph-fill ph-warning-circle"></i> Attention Needed
                                    </span>
                                )}
                            </div>
                            <button className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                                <i className="ph ph-arrows-clockwise"></i> Sync All
                            </button>
                        </div>
                    </header>

                    {/* Dashboard Grid */}
                    <main className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        
                        {/* Left Column: Service Cards (4 cols) */}
                        <div className="lg:col-span-4 space-y-4">
                            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-1">Service Nodes</h2>
                            {SERVICES.map(service => (
                                <ServiceCard 
                                    key={service.id} 
                                    service={service} 
                                    health={serviceHealth[service.id]} 
                                    onToggle={toggleServiceStatus}
                                />
                            ))}

                            {/* Aggregate Metrics */}
                            <div className="glass-panel p-4 rounded-lg border border-slate-700 mt-4">
                                <h3 className="text-sm font-semibold text-slate-300 mb-3">Sync Summary (Last 24h)</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-400">Total Syncs</span>
                                        <span className="text-white font-mono">142,892</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-400">Error Rate</span>
                                        <span className="text-emerald-400 font-mono">0.04%</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-400">Avg. Latency</span>
                                        <span className="text-blue-400 font-mono">42ms</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Middle/Right: Architecture & Logs (8 cols) */}
                        <div className="lg:col-span-8 space-y-6">
                            
                            {/* Top: Architecture Diagram */}
                            <div>
                                <div className="flex justify-between items-end mb-2 px-1">
                                    <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Live Topology</h2>
                                    <div className="flex gap-4 text-xs text-slate-400">
                                        <span className="flex items-center gap-1"><i className="ph-fill ph-circle text-emerald-500 text-[8px]"></i> Healthy</span>
                                        <span className="flex items-center gap-1"><i className="ph-fill ph-circle text-rose-500 text-[8px]"></i> Down</span>
                                    </div>
                                </div>
                                <ArchitectureDiagram connections={connections} />
                            </div>

                            {/* Bottom: Detailed Connection Matrix & Logs */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                
                                {/* Connection Matrix */}
                                <div className="glass-panel border border-slate-700 rounded-lg p-4">
                                    <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                                        <i className="ph ph-plugs-connected text-blue-400"></i> Connection Matrix
                                    </h3>
                                    <div className="space-y-3">
                                        {connections.map(conn => (
                                            <div key={conn.id} className="flex items-center justify-between p-3 bg-slate-900/50 rounded border border-slate-800">
                                                <div className="flex items-center gap-2">
                                                    <div className={`h-2 w-2 rounded-full ${conn.status === 'healthy' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                                                    <span className="text-xs text-slate-300 font-mono uppercase">{conn.id.replace('-', ' ↔ ')}</span>
                                                </div>
                                                <div className="text-right">
                                                    <div className={`text-xs font-mono font-bold ${conn.status === 'healthy' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                        {conn.status === 'healthy' ? `${conn.latency}ms` : 'TIMEOUT'}
                                                    </div>
                                                    <div className="text-[10px] text-slate-600">Last: {conn.lastHeartbeat}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Logs */}
                                <SyncLog logs={logs} />
                            </div>
                        </div>
                    </main>
                </div>
            );
        };

        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(<CommandCenter />);
    </script>
</body>
</html>
```
