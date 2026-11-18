"use client";

// =============================================================================
// PropertyCard.tsx
// High-contrast, clean, and professional Card view for properties.
// Flush image header (no awkward top empty space), expandable tag pills.
// =============================================================================

import { useState } from "react";
import { Building2, MapPin, Pencil, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import StatusBadge from "./StatusBadge";
import { formatRent, getOccupancyPercent, type Property } from "./property-utils";

type Props = {
    property: Property;
    onEdit: () => void;
    onDelete: () => void;
};

export default function PropertyCard({ property, onEdit, onDelete }: Props) {
    const [showAllTags, setShowAllTags] = useState(false);

    const occupancy = getOccupancyPercent(property);
    const progressBarColor =
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

    const maxVisibleTags = 3;
    const hasMoreTags = property.tags.length > maxVisibleTags;
    const displayedTags = showAllTags ? property.tags : property.tags.slice(0, maxVisibleTags);
    const extraCount = property.tags.length - maxVisibleTags;

    return (
        <div className="group flex flex-col overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-sm transition-all duration-300 hover:shadow-lg hover:border-slate-400">
            {/* Photo Header: perfectly flush with the top edge, zero gap */}
            <div className="relative h-48 w-full overflow-hidden bg-slate-100">
                {property.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={property.image}
                        alt={property.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                ) : (
                    <div className="flex h-full items-center justify-center bg-slate-200 text-slate-500">
                        <Building2 className="h-12 w-12" />
                    </div>
                )}

                {/* Status Badge in top right */}
                <div className="absolute right-3 top-3 z-10">
                    <StatusBadge property={property} />
                </div>

                {/* Rating in top left */}
                {/* {property.rating != null && (
                    <span className="absolute left-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate-950 shadow-sm border border-slate-200">
                        <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" /> {property.rating}
                    </span>
                )} */}
            </div>

            {/* Content Area */}
            <div className="flex flex-1 flex-col p-5">
                {/* Title */}
                <h2 className="text-lg font-bold text-slate-950 leading-snug line-clamp-1">
                    {property.name}
                </h2>

                {/* Location */}
                <p className="mt-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700">
                    <MapPin className="h-4 w-4 shrink-0 text-slate-600" />
                    <span className="truncate">{property.location || "Location not added"}</span>
                </p>

                {/* Type & Tags */}
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    {/* Property Type Badge */}
                    <span className="rounded-md border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-700">
                        {property.type}
                    </span>

                    {/* Tag Chips */}
                    {displayedTags.map((tag) => (
                        <span
                            key={tag}
                            className="rounded-md border border-slate-300 bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-800"
                        >
                            {tag}
                        </span>
                    ))}

                    {/* View more / Show less toggle button */}
                    {hasMoreTags && (
                        <button
                            type="button"
                            onClick={() => setShowAllTags(!showAllTags)}
                            className="rounded-md border border-indigo-200 bg-indigo-50/90 px-2 py-0.5 text-xs font-bold text-indigo-700 hover:bg-indigo-600 hover:text-white transition-colors cursor-pointer"
                        >
                            {showAllTags ? "Show less" : `+${extraCount} more`}
                        </button>
                    )}
                </div>

                {/* Monthly Rent */}
                <div className="mt-4 border-t border-slate-200 pt-3">
                    <div className="flex items-baseline justify-between">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-600">
                            Monthly Rent
                        </p>
                        <p className="text-xl font-black text-slate-950 tabular-nums">
                            {formatRent(property.rent)}
                        </p>
                    </div>

                    {/* Occupancy Progress */}
                    <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                            <span>
                                {property.occupied} of {property.units} units occupied
                            </span>
                            <span className={`rounded-sm border px-1.5 py-0.2 text-[11px] font-bold tabular-nums ${badgeColor}`}>
                                {occupancy}%
                            </span>
                        </div>
                        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${progressBarColor}`}
                                style={{ width: `${occupancy}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-200 pt-3.5">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onEdit}
                        className="flex-1 h-9 gap-1.5 border-indigo-200 bg-indigo-50 text-xs font-bold text-indigo-700 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-colors shadow-xs cursor-pointer"
                    >
                        <Pencil className="h-3.5 w-3.5" /> Edit
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onDelete}
                        className="flex-1 h-9 gap-1.5 border-red-200 bg-red-50 text-xs font-bold text-red-700 hover:bg-red-600 hover:text-white hover:border-red-600 transition-colors shadow-xs cursor-pointer"
                    >
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                    </Button>
                </div>
            </div>
        </div>
    );
}
