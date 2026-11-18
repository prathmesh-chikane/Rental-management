"use client";

// =============================================================================
// app/(admin)/communication/page.tsx - TENANT COMMUNICATION & BROADCASTS
//
// Beginner-friendly code:
// - Send SMS / WhatsApp / Email broadcast announcements to all tenants
// - Quick templates: Rent Reminder, Maintenance Notice, Society Meeting
// =============================================================================

import { useState } from "react";
import Link from "next/link";
import {
  Bell,
  Building2,
  Calendar,
  CheckCircle2,
  Mail,
  MessageSquare,
  Plus,
  Send,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type MessageLog = {
  id: string;
  title: string;
  targetProperty: string;
  channel: "WhatsApp" | "Email" | "SMS";
  date: string;
  recipientsCount: number;
  status: "Delivered" | "Sent";
};

const INITIAL_LOGS: MessageLog[] = [
  {
    id: "msg-1",
    title: "Rent Due Reminder for November 2026",
    targetProperty: "All Properties",
    channel: "WhatsApp",
    date: "01 Nov 2026",
    recipientsCount: 68,
    status: "Delivered",
  },
  {
    id: "msg-2",
    title: "Water Tank Cleaning Notice (Thursday 10 AM to 2 PM)",
    targetProperty: "Greenfield Heights",
    channel: "WhatsApp",
    date: "12 Nov 2026",
    recipientsCount: 22,
    status: "Delivered",
  },
  {
    id: "msg-3",
    title: "Elevator Routine Servicing in Tower B",
    targetProperty: "Lakeview Towers",
    channel: "SMS",
    date: "14 Nov 2026",
    recipientsCount: 27,
    status: "Delivered",
  },
  {
    id: "msg-4",
    title: "Diwali Greetings & Security Gate Guidelines",
    targetProperty: "All Properties",
    channel: "Email",
    date: "29 Oct 2026",
    recipientsCount: 68,
    status: "Sent",
  },
];

export default function CommunicationPage() {
  const [logs, setLogs] = useState<MessageLog[]>(INITIAL_LOGS);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    targetProperty: "All Properties",
    channel: "WhatsApp" as MessageLog["channel"],
    messageBody: "",
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.messageBody) return;

    const newLog: MessageLog = {
      id: `msg-${Date.now()}`,
      title: formData.title,
      targetProperty: formData.targetProperty,
      channel: formData.channel,
      date: new Date().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      recipientsCount:
        formData.targetProperty === "All Properties" ? 68 : 22,
      status: "Delivered",
    };

    setLogs([newLog, ...logs]);
    setFormData({
      title: "",
      targetProperty: "All Properties",
      channel: "WhatsApp",
      messageBody: "",
    });
    setIsModalOpen(false);
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-4 sm:px-6 lg:px-8">
      {/* ----------------- Header ----------------- */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Tenant Communication
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Send rent reminders, maintenance alerts, and society notices
          </p>
        </div>

        <Button
          onClick={() => setIsModalOpen(true)}
          className="gap-2 bg-indigo-600 font-semibold text-white shadow-sm hover:bg-indigo-700"
        >
          <Send className="h-4 w-4" /> Send Announcement
        </Button>
      </div>

      {/* ----------------- Quick Template Cards ----------------- */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div
          onClick={() => {
            setFormData({
              title: "Monthly Rent Reminder",
              targetProperty: "All Properties",
              channel: "WhatsApp",
              messageBody:
                "Dear Tenant, this is a friendly reminder that your monthly rent is due by 5th of this month. Please pay via UPI or Bank Transfer to avoid late fee.",
            });
            setIsModalOpen(true);
          }}
          className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:border-indigo-400 hover:shadow-sm"
        >
          <div className="flex items-center gap-2 text-indigo-600">
            <Bell className="h-5 w-5" />
            <h3 className="text-sm font-bold text-slate-900">Rent Reminder</h3>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Send instant WhatsApp reminder to tenants with outstanding dues
          </p>
          <span className="mt-3 inline-block text-xs font-bold text-indigo-600">
            Use Template →
          </span>
        </div>

        <div
          onClick={() => {
            setFormData({
              title: "Maintenance Notice: Water Supply Outage",
              targetProperty: "Greenfield Heights",
              channel: "WhatsApp",
              messageBody:
                "Please note water supply will be shut down between 10:00 AM to 1:00 PM tomorrow due to overhead tank maintenance. Inconvenience is regretted.",
            });
            setIsModalOpen(true);
          }}
          className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:border-indigo-400 hover:shadow-sm"
        >
          <div className="flex items-center gap-2 text-indigo-600">
            <MessageSquare className="h-5 w-5" />
            <h3 className="text-sm font-bold text-slate-900">Maintenance Notice</h3>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Notify tenants regarding lift service, water shutdown or repairs
          </p>
          <span className="mt-3 inline-block text-xs font-bold text-indigo-600">
            Use Template →
          </span>
        </div>

        <div
          onClick={() => {
            setFormData({
              title: "Society Meeting Announcement",
              targetProperty: "All Properties",
              channel: "Email",
              messageBody:
                "Dear Residents, our monthly building association meeting is scheduled for this Sunday at 10:30 AM in the clubhouse. We encourage all to attend.",
            });
            setIsModalOpen(true);
          }}
          className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:border-indigo-400 hover:shadow-sm"
        >
          <div className="flex items-center gap-2 text-indigo-600">
            <Users className="h-5 w-5" />
            <h3 className="text-sm font-bold text-slate-900">Society Meeting</h3>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Invite building residents for AGM or general association meet
          </p>
          <span className="mt-3 inline-block text-xs font-bold text-indigo-600">
            Use Template →
          </span>
        </div>
      </div>

      {/* ----------------- Broadcast History ----------------- */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="border-b border-slate-100 p-5">
          <h2 className="text-base font-bold text-slate-900">Broadcast History</h2>
          <p className="text-xs text-slate-500">
            Logs of sent announcements and delivery statuses
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3.5 pl-6 pr-4">Announcement</th>
                <th className="px-4 py-3.5">Audience / Property</th>
                <th className="px-4 py-3.5">Channel</th>
                <th className="px-4 py-3.5">Recipients</th>
                <th className="px-4 py-3.5">Sent Date</th>
                <th className="py-3.5 pl-4 pr-6 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 transition">
                  <td className="py-4 pl-6 pr-4 font-bold text-slate-900">
                    {log.title}
                  </td>

                  <td className="px-4 py-4 font-medium text-slate-600">
                    {log.targetProperty}
                  </td>

                  <td className="px-4 py-4">
                    <span
                      className={`inline-block rounded-md px-2 py-0.5 text-xs font-semibold ${
                        log.channel === "WhatsApp"
                          ? "bg-emerald-50 text-emerald-700"
                          : log.channel === "SMS"
                            ? "bg-sky-50 text-sky-700"
                            : "bg-indigo-50 text-indigo-700"
                      }`}
                    >
                      {log.channel}
                    </span>
                  </td>

                  <td className="px-4 py-4 font-medium text-slate-700">
                    {log.recipientsCount} Tenants
                  </td>

                  <td className="px-4 py-4 text-xs font-medium text-slate-500">
                    {log.date}
                  </td>

                  <td className="py-4 pl-4 pr-6 text-right">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                      <CheckCircle2 className="h-3.5 w-3.5" /> {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ----------------- Send Announcement Modal ----------------- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-base font-bold text-slate-900">
                Send Tenant Announcement
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSendMessage} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Subject / Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. November Rent Reminder"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Target Property
                  </label>
                  <select
                    value={formData.targetProperty}
                    onChange={(e) =>
                      setFormData({ ...formData, targetProperty: e.target.value })
                    }
                    className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-indigo-500"
                  >
                    <option value="All Properties">All Properties (All Tenants)</option>
                    <option value="Greenfield Heights">Greenfield Heights</option>
                    <option value="Lakeview Towers">Lakeview Towers</option>
                    <option value="Royal Palms">Royal Palms</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Channel
                  </label>
                  <select
                    value={formData.channel}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        channel: e.target.value as MessageLog["channel"],
                      })
                    }
                    className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-indigo-500"
                  >
                    <option value="WhatsApp">WhatsApp Message</option>
                    <option value="SMS">SMS Text</option>
                    <option value="Email">Email</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Message Content *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Type your announcement or reminder here..."
                  value={formData.messageBody}
                  onChange={(e) =>
                    setFormData({ ...formData, messageBody: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 p-3 text-sm outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-indigo-600 text-white hover:bg-indigo-700">
                  Send Now
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
