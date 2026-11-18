"use client";

// =============================================================================
// app/(admin)/documents/page.tsx - PROPERTY & TENANT DOCUMENTS
//
// Beginner-friendly code:
// - Upload and organize lease agreements, tenant ID proofs (Aadhaar/PAN), NOCs, blueprints
// - Search by document name or tenant
// =============================================================================

import { useState } from "react";
import Link from "next/link";
import {
  Download,
  Eye,
  FileCheck,
  FileCode,
  FileSpreadsheet,
  FileText,
  Filter,
  FolderOpen,
  Plus,
  Search,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type DocItem = {
  id: string;
  title: string;
  type: "Agreement" | "ID Proof" | "NOC" | "Blueprint" | "Tax Receipt";
  relatedTo: string;
  size: string;
  uploadedAt: string;
};

const INITIAL_DOCS: DocItem[] = [
  {
    id: "doc-1",
    title: "Vikram_Joshi_Lease_Agreement_2025_2027.pdf",
    type: "Agreement",
    relatedTo: "Vikram Joshi (Flat 204)",
    size: "2.4 MB",
    uploadedAt: "01 Nov 2025",
  },
  {
    id: "doc-2",
    title: "Tenant_Aadhaar_PAN_Vikram_Joshi.pdf",
    type: "ID Proof",
    relatedTo: "Vikram Joshi (Flat 204)",
    size: "1.1 MB",
    uploadedAt: "01 Nov 2025",
  },
  {
    id: "doc-3",
    title: "Greenfield_Heights_Building_Approval_NOC.pdf",
    type: "NOC",
    relatedTo: "Greenfield Heights",
    size: "4.8 MB",
    uploadedAt: "15 Jan 2024",
  },
  {
    id: "doc-4",
    title: "Neha_Kapoor_Registered_Rent_Agreement.pdf",
    type: "Agreement",
    relatedTo: "Neha Kapoor (Villa 02)",
    size: "3.2 MB",
    uploadedAt: "15 Jan 2026",
  },
  {
    id: "doc-5",
    title: "Municipal_Property_Tax_Receipt_2026.pdf",
    type: "Tax Receipt",
    relatedTo: "Greenfield Heights",
    size: "820 KB",
    uploadedAt: "28 Oct 2026",
  },
  {
    id: "doc-6",
    title: "Lakeview_Towers_Floor_Plans.pdf",
    type: "Blueprint",
    relatedTo: "Lakeview Towers",
    size: "6.5 MB",
    uploadedAt: "10 Mar 2024",
  },
];

export default function DocumentsPage() {
  const [docs, setDocs] = useState<DocItem[]>(INITIAL_DOCS);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Doc Form
  const [formData, setFormData] = useState({
    title: "",
    type: "Agreement" as DocItem["type"],
    relatedTo: "",
  });

  const filtered = docs.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.relatedTo.toLowerCase().includes(search.toLowerCase());

    const matchesType = typeFilter === "All" || item.type === typeFilter;

    return matchesSearch && matchesType;
  });

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return;

    const newDoc: DocItem = {
      id: `doc-${Date.now()}`,
      title: formData.title.endsWith(".pdf")
        ? formData.title
        : `${formData.title}.pdf`,
      type: formData.type,
      relatedTo: formData.relatedTo || "General Document",
      size: "1.4 MB",
      uploadedAt: new Date().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
    };

    setDocs([newDoc, ...docs]);
    setFormData({ title: "", type: "Agreement", relatedTo: "" });
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    setDocs(docs.filter((d) => d.id !== id));
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-4 sm:px-6 lg:px-8">
      {/* ----------------- Header ----------------- */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Document Repository
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Manage lease contracts, KYC documents, NOCs, and property deeds
          </p>
        </div>

        <Button
          onClick={() => setIsModalOpen(true)}
          className="gap-2 bg-indigo-600 font-semibold text-white shadow-sm hover:bg-indigo-700"
        >
          <UploadCloud className="h-4 w-4" /> Upload Document
        </Button>
      </div>

      {/* ----------------- Filter & Search ----------------- */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search documents by name or tenant/property..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-4 text-sm text-slate-800 outline-none focus:border-indigo-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Type:</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-500"
          >
            <option value="All">All Documents</option>
            <option value="Agreement">Lease Agreements</option>
            <option value="ID Proof">Tenant ID Proofs</option>
            <option value="NOC">NOC & Clearances</option>
            <option value="Blueprint">Blueprints & Plans</option>
            <option value="Tax Receipt">Tax Receipts</option>
          </select>
        </div>
      </div>

      {/* ----------------- Documents Grid ----------------- */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((doc) => (
          <div
            key={doc.id}
            className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:border-indigo-300 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <FileText className="h-6 w-6" />
              </div>

              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                {doc.type}
              </span>
            </div>

            <div className="mt-4">
              <p className="line-clamp-1 font-bold text-slate-900 group-hover:text-indigo-600">
                {doc.title}
              </p>
              <p className="mt-1 line-clamp-1 text-xs text-slate-500 font-medium">
                Related to: {doc.relatedTo}
              </p>
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-400">
              <span>{doc.size}</span>
              <span>{doc.uploadedAt}</span>
            </div>

            <div className="mt-3 flex items-center justify-between pt-1">
              <button
                type="button"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
              >
                <Download className="h-3.5 w-3.5" /> Download
              </button>

              <button
                type="button"
                onClick={() => handleDelete(doc.id)}
                title="Delete document"
                className="text-slate-400 hover:text-rose-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ----------------- Upload Modal ----------------- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-base font-bold text-slate-900">Upload Document</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpload} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Document Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Agreement_Flat_101.pdf"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Document Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      type: e.target.value as DocItem["type"],
                    })
                  }
                  className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-indigo-500"
                >
                  <option value="Agreement">Lease Agreement</option>
                  <option value="ID Proof">Tenant ID Proof (Aadhaar/PAN)</option>
                  <option value="NOC">NOC & Clearances</option>
                  <option value="Blueprint">Blueprint / Floor Plan</option>
                  <option value="Tax Receipt">Tax Receipt</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Related Property or Tenant
                </label>
                <input
                  type="text"
                  placeholder="e.g. Greenfield Heights or Vikram Joshi"
                  value={formData.relatedTo}
                  onChange={(e) =>
                    setFormData({ ...formData, relatedTo: e.target.value })
                  }
                  className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-indigo-500"
                />
              </div>

              {/* Fake upload dropzone */}
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/75 p-6 text-center">
                <UploadCloud className="mx-auto h-8 w-8 text-slate-400" />
                <p className="mt-2 text-xs font-semibold text-slate-700">
                  Choose a PDF or scan to upload
                </p>
                <p className="text-[11px] text-slate-400">Up to 10MB file supported</p>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-indigo-600 text-white hover:bg-indigo-700">
                  Save Document
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
