
"use client";

import { useEffect, useState } from "react";

interface ConnectionStatus {
    success: boolean;
    message: string;
    backend: string;
    database: string;
    timestamp: string;
}

export default function ConnectionPage() {
    const [data, setData] = useState<ConnectionStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const checkConnection = async () => {
        setLoading(true);
        setError("");

        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/health`,
                { cache: "no-store" }
            );

            if (!response.ok) {
                throw new Error("Backend API response failed");
            }

            const result: ConnectionStatus = await response.json();
            setData(result);
        } catch (err) {
            setData(null);
            setError(
                err instanceof Error ? err.message : "Connection failed"
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkConnection();
    }, []);

    const isBackendConnected = data?.backend === "Connected";
    const isDatabaseConnected = data?.database === "Connected";

    return (
        <main className="min-h-screen bg-slate-100 p-6 flex items-center justify-center">
            <div className="w-full max-w-2xl rounded-2xl bg-white p-8 shadow-lg">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-slate-900">
                        System Connection Status
                    </h1>
                    <p className="mt-2 text-slate-500">
                        Rental Management System
                    </p>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between rounded-xl border p-5">
                        <div>
                            <h2 className="font-semibold text-slate-800">
                                Frontend (Next.js)
                            </h2>
                            <p className="text-sm text-slate-500">
                                localhost:3000
                            </p>
                        </div>
                        <span className="rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-green-700">
                            Running
                        </span>
                    </div>

                    <div className="flex items-center justify-between rounded-xl border p-5">
                        <div>
                            <h2 className="font-semibold text-slate-800">
                                Backend (NestJS)
                            </h2>
                            <p className="text-sm text-slate-500">
                                localhost:3001
                            </p>
                        </div>
                        <span className={`rounded-full px-4 py-2 text-sm font-semibold ${isBackendConnected
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}>
                            {loading ? "Checking..." : isBackendConnected ? "Connected" : "Disconnected"}
                        </span>
                    </div>

                    <div className="flex items-center justify-between rounded-xl border p-5">
                        <div>
                            <h2 className="font-semibold text-slate-800">
                                MongoDB Database
                            </h2>
                            <p className="text-sm text-slate-500">
                                rental_management_db
                            </p>
                        </div>
                        <span className={`rounded-full px-4 py-2 text-sm font-semibold ${isDatabaseConnected
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}>
                            {loading ? "Checking..." : isDatabaseConnected ? "Connected" : "Disconnected"}
                        </span>
                    </div>
                </div>

                {error && (
                    <div className="mt-5 rounded-lg bg-red-50 p-4 text-sm text-red-700">
                        {error}. Please check whether the backend server is running.
                    </div>
                )}

                <button
                    onClick={checkConnection}
                    disabled={loading}
                    className="mt-7 w-full rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
                >
                    {loading ? "Checking Connection..." : "Refresh Connection"}
                </button>

                {data && (
                    <p className="mt-4 text-center text-xs text-slate-400">
                        Last checked: {new Date(data.timestamp).toLocaleString()}
                    </p>
                )}
            </div>
        </main>
    );
}
