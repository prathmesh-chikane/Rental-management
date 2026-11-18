"use client";

// =============================================================================
// app/(admin)/settings/page.tsx - SYSTEM SETTINGS & PREFERENCES
//
// Beginner-friendly code:
// - Organization profile (Company name, GSTIN, PAN, Bank account for rent)
// - Rent collection settings (Default due day, late fee penalty)
// - Notifications & Alerts
// =============================================================================

import { useState } from "react";
import Link from "next/link";
import {
  Bell,
  Building2,
  CheckCircle2,
  CreditCard,
  Globe,
  IndianRupee,
  Lock,
  Save,
  ShieldCheck,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"general" | "payments" | "notifications">(
    "general",
  );
  const [savedMessage, setSavedMessage] = useState(false);

  // Organization state
  const [orgForm, setOrgForm] = useState({
    companyName: "Acme Real Estate & Property Management Ltd",
    contactEmail: "admin@acmeproperties.in",
    contactPhone: "+91 22 2845 7700",
    address: "702, Crystal Plaza, Andheri West, Mumbai, Maharashtra 400053",
    gstin: "27AABCA1234F1Z8",
    pan: "AABCA1234F",
  });

  // Banking state
  const [bankForm, setBankForm] = useState({
    bankName: "HDFC Bank",
    accountNumber: "50200012345678",
    ifscCode: "HDFC0000240",
    accountHolder: "Acme Real Estate Ltd",
    upiId: "acmeestates@hdfcbank",
    dueDay: "5",
    lateFeePercentage: "2",
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 3000);
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-4 sm:px-6 lg:px-8">
      {/* ----------------- Header ----------------- */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Settings & Preferences
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Manage company profile, rent banking details, and automated alerts
          </p>
        </div>

        {savedMessage && (
          <div className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
            <CheckCircle2 className="h-4 w-4" /> Settings Saved Successfully!
          </div>
        )}
      </div>

      {/* ----------------- Settings Tabs ----------------- */}
      <div className="flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab("general")}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-bold transition ${
            activeTab === "general"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Building2 className="h-4 w-4" /> Company Profile
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("payments")}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-bold transition ${
            activeTab === "payments"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <CreditCard className="h-4 w-4" /> Rent & Banking
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("notifications")}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-bold transition ${
            activeTab === "notifications"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Bell className="h-4 w-4" /> Alerts & Security
        </button>
      </div>

      {/* ----------------- TAB 1: General Profile ----------------- */}
      {activeTab === "general" && (
        <form
          onSubmit={handleSave}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-6"
        >
          <div>
            <h2 className="text-base font-bold text-slate-900">Organization Details</h2>
            <p className="text-xs text-slate-500">
              Shown on rent receipts, invoices, and legal lease agreements
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700">
                Company / Landlord Legal Name
              </label>
              <input
                type="text"
                value={orgForm.companyName}
                onChange={(e) =>
                  setOrgForm({ ...orgForm, companyName: e.target.value })
                }
                className="mt-1 h-10 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Official Email
              </label>
              <input
                type="email"
                value={orgForm.contactEmail}
                onChange={(e) =>
                  setOrgForm({ ...orgForm, contactEmail: e.target.value })
                }
                className="mt-1 h-10 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Contact Phone
              </label>
              <input
                type="text"
                value={orgForm.contactPhone}
                onChange={(e) =>
                  setOrgForm({ ...orgForm, contactPhone: e.target.value })
                }
                className="mt-1 h-10 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-indigo-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700">
                Registered Office Address
              </label>
              <input
                type="text"
                value={orgForm.address}
                onChange={(e) =>
                  setOrgForm({ ...orgForm, address: e.target.value })
                }
                className="mt-1 h-10 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">
                GSTIN Number (Optional)
              </label>
              <input
                type="text"
                value={orgForm.gstin}
                onChange={(e) =>
                  setOrgForm({ ...orgForm, gstin: e.target.value })
                }
                className="mt-1 h-10 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">
                PAN Number
              </label>
              <input
                type="text"
                value={orgForm.pan}
                onChange={(e) =>
                  setOrgForm({ ...orgForm, pan: e.target.value })
                }
                className="mt-1 h-10 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <Button type="submit" className="gap-2 bg-indigo-600 text-white hover:bg-indigo-700">
              <Save className="h-4 w-4" /> Save Changes
            </Button>
          </div>
        </form>
      )}

      {/* ----------------- TAB 2: Payments & Banking ----------------- */}
      {activeTab === "payments" && (
        <form
          onSubmit={handleSave}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-6"
        >
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Rent Receiving Bank Account
            </h2>
            <p className="text-xs text-slate-500">
              Printed on tenant invoices so tenants can pay directly
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Bank Name
              </label>
              <input
                type="text"
                value={bankForm.bankName}
                onChange={(e) =>
                  setBankForm({ ...bankForm, bankName: e.target.value })
                }
                className="mt-1 h-10 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Account Holder Name
              </label>
              <input
                type="text"
                value={bankForm.accountHolder}
                onChange={(e) =>
                  setBankForm({ ...bankForm, accountHolder: e.target.value })
                }
                className="mt-1 h-10 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Account Number
              </label>
              <input
                type="text"
                value={bankForm.accountNumber}
                onChange={(e) =>
                  setBankForm({ ...bankForm, accountNumber: e.target.value })
                }
                className="mt-1 h-10 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">
                IFSC Code
              </label>
              <input
                type="text"
                value={bankForm.ifscCode}
                onChange={(e) =>
                  setBankForm({ ...bankForm, ifscCode: e.target.value })
                }
                className="mt-1 h-10 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">
                UPI ID (VPA)
              </label>
              <input
                type="text"
                value={bankForm.upiId}
                onChange={(e) =>
                  setBankForm({ ...bankForm, upiId: e.target.value })
                }
                className="mt-1 h-10 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Monthly Rent Due Date
              </label>
              <select
                value={bankForm.dueDay}
                onChange={(e) =>
                  setBankForm({ ...bankForm, dueDay: e.target.value })
                }
                className="mt-1 h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-indigo-500"
              >
                <option value="1">1st of every month</option>
                <option value="5">5th of every month (Standard)</option>
                <option value="10">10th of every month</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <Button type="submit" className="gap-2 bg-indigo-600 text-white hover:bg-indigo-700">
              <Save className="h-4 w-4" /> Save Bank Details
            </Button>
          </div>
        </form>
      )}

      {/* ----------------- TAB 3: Notifications & Security ----------------- */}
      {activeTab === "notifications" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Automated Reminders & Security
            </h2>
            <p className="text-xs text-slate-500">
              Configure automatic WhatsApp/Email notifications sent to tenants
            </p>
          </div>

          <div className="space-y-4">
            <label className="flex items-start gap-3 rounded-xl border border-slate-100 p-4 hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                defaultChecked
                className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <p className="text-sm font-bold text-slate-900">
                  Automatic Rent Due Reminders
                </p>
                <p className="text-xs text-slate-500">
                  Send WhatsApp/SMS reminder 3 days before rent due date
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 rounded-xl border border-slate-100 p-4 hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                defaultChecked
                className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <p className="text-sm font-bold text-slate-900">
                  Lease Expiry Notification
                </p>
                <p className="text-xs text-slate-500">
                  Notify admin & tenant 60 days before contract expires
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 rounded-xl border border-slate-100 p-4 hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                defaultChecked
                className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <p className="text-sm font-bold text-slate-900">
                  Maintenance Ticket Status Updates
                </p>
                <p className="text-xs text-slate-500">
                  Inform tenant when maintenance status changes to In Progress or Resolved
                </p>
              </div>
            </label>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <Button
              onClick={() => {
                setSavedMessage(true);
                setTimeout(() => setSavedMessage(false), 3000);
              }}
              className="gap-2 bg-indigo-600 text-white hover:bg-indigo-700"
            >
              <Save className="h-4 w-4" /> Save Preferences
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
