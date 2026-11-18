// =============================================================================
// PropertyTable.tsx
// High-contrast, clean, and professional Table view for properties.
// =============================================================================

import { Building2, MapPin, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import StatusBadge from "./StatusBadge";
import { formatRent, getId, getOccupancyPercent, type Property } from "./property-utils";

type Props = {
    properties: Property[];
    onEdit: (property: Property) => void;
    onDelete: (property: Property) => void;
};

export default function PropertyTable({ properties, onEdit, onDelete }: Props) {
    return (
        <div className="overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full min-w-[850px] border-collapse text-left">
                    <thead>
                        <tr className="border-b border-slate-300 bg-slate-100">
                            <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-900">
                                Property
                            </th>
                            <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-900">
                                Location
                            </th>
                            <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-900">
                                Type
                            </th>
                            <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-900">
                                Occupancy
                            </th>
                            <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-900">
                                Status
                            </th>
                            <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-900">
                                Monthly Rent
                            </th>
                            <th className="px-5 py-3.5 text-right text-xs font-bold uppercase tracking-wider text-slate-900">
                                Actions
                            </th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-200">
                        {properties.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="py-12 text-center text-slate-600">
                                    <div className="flex flex-col items-center justify-center gap-2">
                                        <Building2 className="h-8 w-8 text-slate-400" />
                                        <p className="text-base font-semibold text-slate-800">
                                            No properties match your filter criteria
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            Try clearing the search or changing the type/status filters.
                                        </p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            properties.map((property) => {
                                const occupancy = getOccupancyPercent(property);
                                const progressFill =
                                    occupancy === 100
                                        ? "bg-emerald-600"
                                        : occupancy >= 70
                                        ? "bg-indigo-600"
                                        : "bg-amber-600";
                                const badgeColor =
                                    occupancy === 100
                                        ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                                        : occupancy >= 70
                                        ? "bg-indigo-100 text-indigo-900 border-indigo-300"
                                        : "bg-amber-100 text-amber-900 border-amber-300";

                                const maxTagsInTable = 2;
                                const tableExtraTags = property.tags.length - maxTagsInTable;

                                return (
                                    <tr
                                        key={getId(property)}
                                        className="transition-colors hover:bg-slate-50/90"
                                    >
                                        {/* Property Name + Image */}
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                {property.image ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img
                                                        src={property.image}
                                                        alt={property.name}
                                                        className="h-12 w-12 shrink-0 rounded-xl object-cover border border-slate-300 shadow-xs"
                                                    />
                                                ) : (
                                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-200 text-slate-600 border border-slate-300">
                                                        <Building2 className="h-6 w-6" />
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="text-sm font-bold text-slate-950">
                                                        {property.name}
                                                    </p>
                                                    {property.tags.length > 0 && (
                                                        <div className="mt-1 flex flex-wrap items-center gap-1">
                                                            {property.tags.slice(0, maxTagsInTable).map((tag) => (
                                                                <span
                                                                    key={tag}
                                                                    className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700 border border-slate-200"
                                                                >
                                                                    {tag}
                                                                </span>
                                                            ))}
                                                            {tableExtraTags > 0 && (
                                                                <span
                                                                    title={property.tags.slice(maxTagsInTable).join(", ")}
                                                                    className="rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-bold text-indigo-700 border border-indigo-200 cursor-help"
                                                                >
                                                                    +{tableExtraTags} more
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>

                                        {/* Location */}
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-1.5 text-slate-800">
                                                <MapPin className="h-4 w-4 shrink-0 text-slate-600" />
                                                <span className="text-sm font-medium">
                                                    {property.location || "Not specified"}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Type */}
                                        <td className="px-4 py-4">
                                            <span className="inline-flex items-center rounded-md border border-slate-300 bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-900">
                                                {property.type}
                                            </span>
                                        </td>

                                        {/* Occupancy */}
                                        <td className="px-4 py-4">
                                            <div className="w-44 space-y-1.5">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-bold text-slate-900">
                                                        {property.occupied} / {property.units} units
                                                    </span>
                                                    <span className={`rounded-sm border px-1.5 py-0.2 text-[11px] font-bold tabular-nums ${badgeColor}`}>
                                                        {occupancy}%
                                                    </span>
                                                </div>
                                                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-300 ${progressFill}`}
                                                        style={{ width: `${occupancy}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </td>

                                        {/* Status */}
                                        <td className="px-4 py-4">
                                            <StatusBadge property={property} />
                                        </td>

                                        {/* Monthly Rent */}
                                        <td className="px-4 py-4">
                                            <p className="text-base font-extrabold text-slate-950 tabular-nums">
                                                {formatRent(property.rent)}
                                            </p>
                                            <p className="text-[11px] font-medium text-slate-500">per month</p>
                                        </td>

                                        {/* Actions */}
                                        <td className="px-5 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => onEdit(property)}
                                                    className="h-8 gap-1.5 border-indigo-200 bg-indigo-50 px-2.5 text-xs font-bold text-indigo-700 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-colors shadow-xs cursor-pointer"
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                    Edit
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => onDelete(property)}
                                                    className="h-8 gap-1.5 border-red-200 bg-red-50 px-2.5 text-xs font-bold text-red-700 hover:bg-red-600 hover:text-white hover:border-red-600 transition-colors shadow-xs cursor-pointer"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                    Delete
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Footer summary */}
            {properties.length > 0 && (
                <div className="border-t border-slate-300 bg-slate-50 px-5 py-3">
                    <p className="text-xs font-bold text-slate-700">
                        Total {properties.length} {properties.length === 1 ? "property" : "properties"} displayed
                    </p>
                </div>
            )}
        </div>
    );
}
