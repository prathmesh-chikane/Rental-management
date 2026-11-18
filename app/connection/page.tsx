"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, XCircle, RefreshCw, Terminal, Database, Server, Laptop } from "lucide-react";

interface ConnectionStatus {
  success: boolean;
  message?: string;
  backend?: string;
  database?: string;
  databaseName?: string;
  status?: string;
  timestamp?: string;
}

export default function ConnectionPage() {
  const [data, setData] = useState<ConnectionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastCheckedTime, setLastCheckedTime] = useState<string>("");

  const checkConnection = async () => {
    setLoading(true);
    setError("");

    // Possible endpoints to probe
    const baseApi = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/trishul";
    const endpointsToTry = [
      `${baseApi}/health`,
      "http://localhost:3001/trishul/health",
      "http://localhost:3001/health",
    ];

    let successResult: ConnectionStatus | null = null;
    let lastError = "";

    for (const endpoint of endpointsToTry) {
      try {
        const response = await fetch(endpoint, {
          cache: "no-store",
          headers: { Accept: "application/json" },
        });

        if (response.ok) {
          const result = await response.json();
          successResult = result;
          break;
        }
      } catch (err) {
        lastError = err instanceof Error ? err.message : "Failed to connect to backend server";
      }
    }

    if (successResult) {
      setData(successResult);
      setError("");
    } else {
      setData(null);
      setError(lastError || "Backend server is not reachable on port 3001");
    }

    setLastCheckedTime(new Date().toLocaleTimeString());
    setLoading(false);
  };

  useEffect(() => {
    checkConnection();
  }, []);

  const isBackendConnected = Boolean(data && (data.backend === "Connected" || data.status === "Connected" || data.success));
  const isDatabaseConnected = Boolean(data && (data.database === "Connected" || data.status === "Connected" || data.success));

  return (
    <main className="min-h-screen bg-slate-100 p-4 sm:p-6 flex items-center justify-center">
      <div className="w-full max-w-xl rounded-3xl bg-white p-6 sm:p-8 shadow-xl border border-slate-200/80">
        
        {/* Navigation link back to Dashboard */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Dashboard</span>
        </Link>

        {/* Title */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            System Connection Status
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-500 font-medium">
            Rental Management System • End-to-End Diagnostics
          </p>
        </div>

        {/* Status Rows */}
        <div className="space-y-3.5">
          {/* Frontend */}
          <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 transition">
            <div className="flex items-center gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <Laptop className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Frontend (Next.js)
                </h2>
                <p className="text-xs text-slate-500">
                  http://localhost:3000
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Running
            </span>
          </div>

          {/* Backend */}
          <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 transition">
            <div className="flex items-center gap-3.5">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                isBackendConnected ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
              }`}>
                <Server className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Backend (NestJS API)
                </h2>
                <p className="text-xs text-slate-500">
                  http://localhost:3001/trishul/
                </p>
              </div>
            </div>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${
                loading
                  ? "bg-slate-100 text-slate-600"
                  : isBackendConnected
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-rose-100 text-rose-800"
              }`}
            >
              {loading ? (
                "Checking..."
              ) : isBackendConnected ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Connected
                </>
              ) : (
                <>
                  <XCircle className="h-3.5 w-3.5" />
                  Disconnected
                </>
              )}
            </span>
          </div>

          {/* MongoDB */}
          <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 transition">
            <div className="flex items-center gap-3.5">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                isDatabaseConnected ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
              }`}>
                <Database className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  MongoDB Database
                </h2>
                <p className="text-xs text-slate-500">
                  {data?.databaseName || "rental_management_db"}
                </p>
              </div>
            </div>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${
                loading
                  ? "bg-slate-100 text-slate-600"
                  : isDatabaseConnected
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-rose-100 text-rose-800"
              }`}
            >
              {loading ? (
                "Checking..."
              ) : isDatabaseConnected ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Connected
                </>
              ) : (
                <>
                  <XCircle className="h-3.5 w-3.5" />
                  Disconnected
                </>
              )}
            </span>
          </div>
        </div>

        {/* Helpful Guidance when backend is disconnected */}
        {!isBackendConnected && !loading && (
          <div className="mt-6 rounded-2xl border border-amber-200/80 bg-amber-50/70 p-4 text-xs text-amber-900 space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-950">
              <Terminal className="h-4 w-4 text-amber-700" />
              <span>How to start the Backend Server:</span>
            </div>
            <p className="text-slate-600">
              Open a new terminal window in VS Code / PowerShell and run:
            </p>
            <div className="rounded-xl bg-slate-900 p-3 font-mono text-[11px] text-emerald-400">
              cd backend<br />
              npm run start:dev
            </div>
            <p className="text-[11px] text-slate-500">
              Make sure MongoDB is running on port 27017, then click &quot;Refresh Connection&quot; below.
            </p>
          </div>
        )}

        {/* Refresh Action Button */}
        <button
          type="button"
          onClick={checkConnection}
          disabled={loading}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 py-3.5 text-xs font-bold text-white shadow-md transition hover:bg-slate-800 active:scale-98 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          <span>{loading ? "Checking Connection..." : "Refresh Connection"}</span>
        </button>

        {lastCheckedTime && (
          <p className="mt-4 text-center text-xs font-medium text-slate-400">
            Last checked: {lastCheckedTime}
          </p>
        )}
      </div>
    </main>
  );
}
