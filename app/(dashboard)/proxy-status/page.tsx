"use client";

import { useState } from "react";
import { Shield, Loader2, RefreshCw, CheckCircle2, XCircle, Wifi } from "lucide-react";

interface ProxyResult {
  index: number;
  proxy: string;
  status: "alive" | "dead";
  ip: string | null;
  latency: number;
  error?: string;
}

interface ProxyStatusResponse {
  status: string;
  message: string;
  total: number;
  alive: number;
  results: ProxyResult[];
}

export default function ProxyStatusPage() {
  const [data, setData] = useState<ProxyStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkStatus = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/proxy-status");
      const result = await response.json();
      setData(result);
    } catch {
      setError("Gagal mengecek status proxy.");
    }
    setIsLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Proxy Status</h1>
          <p className="text-sm text-muted-foreground">Cek koneksi proxy untuk IP diversification</p>
        </div>
      </div>

      <div className="mb-6 p-3 rounded-lg bg-accent/30 border border-border text-sm text-muted-foreground">
        💡 Proxy digunakan untuk mendiversifikasi IP saat mengakses API, mencegah rate limiting berbasis IP. Setiap request dikirim lewat proxy yang berbeda secara bergantian.
      </div>

      {/* Check button */}
      <button
        onClick={checkStatus}
        disabled={isLoading}
        className="mb-6 flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
      >
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
        {isLoading ? "Checking..." : "Cek Status Proxy"}
      </button>

      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive mb-4">{error}</div>
      )}

      {data && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="p-4 rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">
                  {data.status === "no_proxy" ? "Tidak ada proxy" : data.status === "ok" ? "Proxy aktif" : "Semua proxy mati"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{data.message}</p>
              </div>
              <div className={`w-3 h-3 rounded-full ${data.status === "ok" ? "bg-green-500" : data.status === "no_proxy" ? "bg-yellow-500" : "bg-red-500"}`} />
            </div>

            {data.total > 0 && (
              <div className="mt-3 flex gap-4">
                <div>
                  <p className="text-lg font-bold text-green-500">{data.alive}</p>
                  <p className="text-[10px] text-muted-foreground">Aktif</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-red-500">{data.total - data.alive}</p>
                  <p className="text-[10px] text-muted-foreground">Mati</p>
                </div>
                <div>
                  <p className="text-lg font-bold">{data.total}</p>
                  <p className="text-[10px] text-muted-foreground">Total</p>
                </div>
              </div>
            )}
          </div>

          {/* Individual results */}
          {data.results.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Detail Node</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {data.results.map((r) => (
                  <div key={r.index} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card">
                    {r.status === "alive" ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Wifi className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs font-medium">Node #{r.index + 1}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {r.status === "alive"
                          ? `${r.latency}ms • IP: ${r.ip?.split(",")[0] || "hidden"}`
                          : `Offline${r.error ? ` • ${r.error.substring(0, 30)}` : ""}`}
                      </p>
                    </div>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded ${r.status === "alive" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}>
                      {r.status === "alive" ? "LIVE" : "DOWN"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {!data && !isLoading && (
        <div className="flex flex-col items-center justify-center h-48 rounded-lg border border-dashed border-border text-muted-foreground">
          <Shield className="w-10 h-10 mb-3 opacity-30" />
          <p className="text-sm">Klik tombol di atas untuk cek status proxy</p>
        </div>
      )}
    </div>
  );
}
