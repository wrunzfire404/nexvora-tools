"use client";

import { useState, useEffect } from "react";
import { Shield, Plus, Trash2, Megaphone, RefreshCw, Loader2, Lock } from "lucide-react";

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [isAuthed, setIsAuthed] = useState(false);
  const [proxies, setProxies] = useState<string[]>([]);
  const [proxyEnabled, setProxyEnabled] = useState(true);
  const [announcements, setAnnouncements] = useState<Array<{ id: string; message: string; type: string; active: boolean; createdAt: string }>>([]);
  const [logs, setLogs] = useState<Array<{ id: string; timestamp: string; provider: string; feature: string; model?: string; proxyUsed: string | null; status: string; latency: number; error?: string }>>([]);
  const [counters, setCounters] = useState<Record<string, number>>({});
  const [newProxy, setNewProxy] = useState("");
  const [bulkProxies, setBulkProxies] = useState("");
  const [newAnnouncement, setNewAnnouncement] = useState("");
  const [annType, setAnnType] = useState<"info" | "warning" | "error">("info");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const headers = { "Content-Type": "application/json", "x-admin-key": password };

  const loadData = async () => {
    setLoading(true);
    try {
      const [proxyRes, annRes, logRes] = await Promise.all([
        fetch("/api/admin/proxies", { headers }),
        fetch("/api/admin/announcements", { headers }),
        fetch("/api/admin/logs", { headers }),
      ]);

      if (proxyRes.status === 401) { setIsAuthed(false); setLoading(false); return; }

      const proxyData = await proxyRes.json();
      const annData = await annRes.json();
      const logData = await logRes.json();

      setProxies(proxyData.proxies || []);
      setProxyEnabled(proxyData.enabled !== false);
      setAnnouncements(annData.announcements || []);
      setLogs(logData.logs || []);
      setCounters(logData.counters || {});
      setIsAuthed(true);
    } catch {
      setMessage("Failed to load data");
    }
    setLoading(false);
  };

  const addSingleProxy = async () => {
    if (!newProxy.trim()) return;
    await fetch("/api/admin/proxies", {
      method: "POST", headers, body: JSON.stringify({ proxy: newProxy.trim() }),
    });
    setNewProxy("");
    loadData();
  };

  const bulkImportProxies = async () => {
    const list = bulkProxies.split("\n").map((p) => p.trim()).filter(Boolean);
    if (list.length === 0) return;
    const res = await fetch("/api/admin/proxies", {
      method: "POST", headers, body: JSON.stringify({ bulk: true, proxies: list }),
    });
    const data = await res.json();
    setMessage(`Added ${data.added} proxies. Total: ${data.total}`);
    setBulkProxies("");
    loadData();
  };

  const removeProxyAt = async (index: number) => {
    await fetch("/api/admin/proxies", {
      method: "DELETE", headers, body: JSON.stringify({ index }),
    });
    loadData();
  };

  const deleteAllProxies = async () => {
    await fetch("/api/admin/proxies", {
      method: "DELETE", headers, body: JSON.stringify({ all: true }),
    });
    setMessage("All proxies deleted.");
    loadData();
  };

  const addAnnouncement = async () => {
    if (!newAnnouncement.trim()) return;
    await fetch("/api/admin/announcements", {
      method: "POST", headers, body: JSON.stringify({ action: "add", message: newAnnouncement, type: annType }),
    });
    setNewAnnouncement("");
    loadData();
  };

  const toggleAnnouncement = async (id: string) => {
    await fetch("/api/admin/announcements", {
      method: "POST", headers, body: JSON.stringify({ action: "toggle", id }),
    });
    loadData();
  };

  const deleteAnnouncement = async (id: string) => {
    await fetch("/api/admin/announcements", {
      method: "POST", headers, body: JSON.stringify({ action: "delete", id }),
    });
    loadData();
  };

  if (!isAuthed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-sm p-6 rounded-xl border border-border bg-card">
          <div className="flex items-center gap-2 mb-4">
            <Lock className="w-5 h-5" />
            <h1 className="text-lg font-bold">Admin Dashboard</h1>
          </div>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="Admin password..." onKeyDown={(e) => e.key === "Enter" && loadData()}
            className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm mb-3" />
          <button onClick={loadData} disabled={!password || loading}
            className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50">
            {loading ? "Checking..." : "Login"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold">Admin Dashboard</h1>
          </div>
          <button onClick={loadData} className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg border border-border hover:bg-accent">
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
        </div>

        {message && (
          <div className="p-3 rounded-lg bg-accent/50 border border-border text-sm">{message}</div>
        )}

        {/* Proxy Management */}
        <div className="p-5 rounded-xl border border-border bg-card space-y-4">
          <h2 className="text-sm font-bold flex items-center gap-2"><Shield className="w-4 h-4" /> Proxy Management ({proxies.length})</h2>

          <div className="flex items-center justify-between p-3 rounded-lg bg-accent/30">
            <div>
              <p className="text-xs font-medium">Proxy {proxyEnabled ? "Active" : "Disabled"}</p>
              <p className="text-[10px] text-muted-foreground">{proxyEnabled ? "Request lewat proxy" : "Request langsung (direct)"}</p>
            </div>
            <button
              onClick={async () => {
                const newState = !proxyEnabled;
                await fetch("/api/admin/proxies", { method: "POST", headers, body: JSON.stringify({ enabled: newState }) });
                setProxyEnabled(newState);
              }}
              className={`relative w-10 h-5 rounded-full transition-colors ${proxyEnabled ? "bg-green-500" : "bg-muted"}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${proxyEnabled ? "translate-x-5" : "translate-x-0"}`} />
            </button>
          </div>

          {proxies.length > 0 && (
            <button onClick={deleteAllProxies} className="px-3 py-1.5 rounded-lg border border-destructive/30 text-destructive text-xs hover:bg-destructive/10">
              Delete All Proxies
            </button>
          )}

          {/* Add single */}
          <div className="flex gap-2">
            <input value={newProxy} onChange={(e) => setNewProxy(e.target.value)} placeholder="http://user:pass@ip:port"
              className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-xs" />
            <button onClick={addSingleProxy} className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs">
              <Plus className="w-3 h-3" />
            </button>
          </div>

          {/* Bulk import */}
          <div>
            <textarea value={bulkProxies} onChange={(e) => setBulkProxies(e.target.value)}
              placeholder="Bulk import (1 proxy per line)..." rows={3}
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-xs resize-none" />
            <button onClick={bulkImportProxies} disabled={!bulkProxies.trim()}
              className="mt-2 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs disabled:opacity-50">
              Import All
            </button>
          </div>

          {/* Proxy list */}
          <div className="max-h-[200px] overflow-y-auto space-y-1">
            {proxies.map((p, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-accent/30 text-xs">
                <span className="truncate max-w-[80%] font-mono">{p.replace(/\/\/.*@/, "//***@")}</span>
                <button onClick={() => removeProxyAt(i)} className="p-1 hover:bg-destructive/20 rounded">
                  <Trash2 className="w-3 h-3 text-destructive" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Announcements */}
        <div className="p-5 rounded-xl border border-border bg-card space-y-4">
          <h2 className="text-sm font-bold flex items-center gap-2"><Megaphone className="w-4 h-4" /> Announcements</h2>

          <div className="flex gap-2">
            <input value={newAnnouncement} onChange={(e) => setNewAnnouncement(e.target.value)} placeholder="Announcement message..."
              className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-xs" />
            <select value={annType} onChange={(e) => setAnnType(e.target.value as "info" | "warning" | "error")}
              className="px-2 py-2 rounded-lg border border-input bg-background text-xs">
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="error">Error</option>
            </select>
            <button onClick={addAnnouncement} className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs">
              <Plus className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2">
            {announcements.map((a) => (
              <div key={a.id} className={`flex items-center justify-between p-3 rounded-lg border ${a.active ? "border-primary/30 bg-primary/5" : "border-border opacity-50"}`}>
                <div>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded mr-2 ${a.type === "error" ? "bg-red-500/20 text-red-400" : a.type === "warning" ? "bg-yellow-500/20 text-yellow-400" : "bg-blue-500/20 text-blue-400"}`}>
                    {a.type}
                  </span>
                  <span className="text-xs">{a.message}</span>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => toggleAnnouncement(a.id)} className="px-2 py-1 text-[10px] rounded border border-border hover:bg-accent">
                    {a.active ? "Hide" : "Show"}
                  </button>
                  <button onClick={() => deleteAnnouncement(a.id)} className="p-1 hover:bg-destructive/20 rounded">
                    <Trash2 className="w-3 h-3 text-destructive" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Request Logs & Stats */}
        <div className="p-5 rounded-xl border border-border bg-card space-y-4">
          <h2 className="text-sm font-bold">📊 Today&apos;s Stats</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-accent/30 text-center">
              <p className="text-lg font-bold">{counters.total || 0}</p>
              <p className="text-[10px] text-muted-foreground">Total Requests</p>
            </div>
            {Object.entries(counters).filter(([k]) => k !== "total").slice(0, 3).map(([key, val]) => (
              <div key={key} className="p-3 rounded-lg bg-accent/30 text-center">
                <p className="text-lg font-bold">{val}</p>
                <p className="text-[10px] text-muted-foreground capitalize">{key.replace(/-/g, " ")}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="p-5 rounded-xl border border-border bg-card space-y-4">
          <h2 className="text-sm font-bold">📜 Request History (last {logs.length})</h2>
          <div className="max-h-[300px] overflow-y-auto space-y-1">
            {logs.length === 0 ? (
              <p className="text-xs text-muted-foreground">No requests logged yet.</p>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="flex items-center gap-2 p-2 rounded-lg bg-accent/20 text-[10px]">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${log.status === "success" ? "bg-green-500" : "bg-red-500"}`} />
                  <span className="text-muted-foreground w-[60px] shrink-0">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  <span className={`px-1.5 py-0.5 rounded ${log.provider === "leonardo" ? "bg-amber-500/20 text-amber-400" : "bg-purple-500/20 text-purple-400"}`}>{log.provider}</span>
                  <span className="capitalize flex-1 truncate">{log.feature}{log.model ? ` (${log.model})` : ""}</span>
                  <span className="text-muted-foreground">{log.latency}ms</span>
                  <span className={`px-1 rounded ${log.proxyUsed ? "bg-green-500/20 text-green-400" : "bg-muted text-muted-foreground"}`}>
                    {log.proxyUsed ? "proxy" : "direct"}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
