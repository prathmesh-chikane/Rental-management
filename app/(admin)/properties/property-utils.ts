// =============================================================================
// property-utils.ts
// Shared types and small helper functions used by the Properties page.
// Nothing in this file draws anything on screen.
// =============================================================================

import type { ExtraPayload } from "./property-extra";

// ---------- The options shown in dropdowns ----------

export const PROPERTY_TYPES = [
    "industrial",
    "commercial",
    "pg_coliving",
    "Luxury Residential",
    "Gated Community Villas",
    "Other",
];

// ---------- Types (the "shape" of our data) ----------

// One property, as the page uses it.
export interface Property {
    _id?: string; // MongoDB id (comes from the backend)
    id?: string; // used for demo data
    name: string;
    location: string;
    type: string;
    units: number; // total units in the building
    occupied: number; // units that currently have a tenant
    rent: number; // total monthly rent in rupees
    rating?: number; // optional star rating
    image?: string; // optional photo link
    tags: string[]; // e.g. ["Pool", "Gym"]
    status: string; // "Fully Leased" or "3 Vacant" (worked out from units and occupied)
    constructionYear?: number;
    reraNumber?: string;
    landmark?: string;
    carpetArea?: number;
    totalFloors?: number;
    managerName?: string;
    managerPhone?: string;
    description?: string;
}

// What we send to the backend when saving (a Property without its id).
export type BasePropertyPayload = Omit<Property, "_id" | "id">;
export type PropertyPayload = BasePropertyPayload & ExtraPayload;

// The form keeps everything as text, because that is what <input> gives us.
export interface FormState {
    name: string;
    location: string;
    type: string;
    units: string;
    occupied: string;
    rent: string;
    image: string;
    tags: string;
}

// One error message per field, only for fields that have a problem.
export type FormErrors = Partial<Record<keyof FormState, string>>;

export const EMPTY_FORM: FormState = {
    name: "",
    location: "",
    type: PROPERTY_TYPES[0],
    units: "",
    occupied: "0",
    rent: "",
    image: "",
    tags: "",
};

// ---------- Small helpers ----------

// A property's unique id. Falls back to the name if there is no id at all.
export function getId(property: Property): string {
    return property._id ?? property.id ?? property.name;
}

// Demo properties get an id that starts with "local-". They exist only in the browser.
export function isLocal(id: string): boolean {
    return id.startsWith("local-");
}

// The text saved in the `status` field: "Fully Leased" or "3 Vacant".
export function statusFor(units: number, occupied: number): string {
    const vacant = units - occupied;
    if (vacant <= 0) return "Fully Leased";
    return `${vacant} Vacant`;
}

// Mixes the backend's answer into an existing object.
// The backend may answer with the object itself, or with { data: object }.
export function mergeResponse(base: object, response: unknown): Record<string, unknown> {
    let data: unknown = {};
    if (response && typeof response === "object") {
        const answer = response as { data?: unknown };
        data = answer.data ?? response;
    }
    return { ...base, ...(typeof data === "object" ? (data as object) : {}) };
}

// How full the building is, as a whole number from 0 to 100.
export function getOccupancyPercent(property: Property): number {
    if (property.units <= 0) return 0;
    const percent = Math.round((property.occupied / property.units) * 100);
    return Math.min(100, percent);
}

// The status label shown on the coloured badge.
export function getStatus(property: Property): "Fully Leased" | "Has Vacancies" | "Vacant" {
    if (property.units <= 0 || property.occupied === 0) return "Vacant";
    if (property.occupied >= property.units) return "Fully Leased";
    return "Has Vacancies";
}

// Shows rupees the Indian way: 1250000 -> "₹12.5 L", 25000000 -> "₹2.5 Cr".
export function formatRent(amount: number): string {
    if (amount >= 10000000) return `₹${Number((amount / 10000000).toFixed(2))} Cr`;
    if (amount >= 100000) return `₹${Number((amount / 100000).toFixed(2))} L`;
    return `₹${amount.toLocaleString("en-IN")}`;
}

// Portfolio statistics summary for dashboard KPIs
export function calculateTotals(items: Property[]) {
    const totalProperties = items.length;
    const totalUnits = items.reduce((acc, p) => acc + p.units, 0);
    const totalOccupied = items.reduce((acc, p) => acc + p.occupied, 0);
    const totalRent = items.reduce((acc, p) => acc + p.rent, 0);
    const occupancyRate = totalUnits > 0 ? Math.round((totalOccupied / totalUnits) * 100) : 0;
    return {
        totalProperties,
        totalUnits,
        totalOccupied,
        totalRent,
        occupancyRate,
    };
}

// Local Storage sync key so property occupancy changes made in Tenants page reflect here
export const PROPERTIES_STORAGE_KEY = "rental_management_actual_properties";

// Turns whatever the backend (or demo data) gives us into a clean Property.
// Missing values get safe defaults, so the page never crashes on odd data.
export function cleanProperty(data: unknown): Property {
    const raw = (data ?? {}) as Record<string, unknown>;
    const units = Number(raw.units ?? 0);
    const occupied = Number(raw.occupied ?? 0);
    const optionalNumber = (value: unknown): number | undefined =>
        value == null ? undefined : Number(value);
    return {
        _id: raw._id ? String(raw._id) : undefined,
        id: raw.id ? String(raw.id) : undefined,
        name: String(raw.name ?? "Untitled Property"),
        location: String(raw.location ?? raw.address ?? ""),
        type: String(raw.type ?? "Other"),
        units,
        occupied,
        rent: Number(raw.rent ?? raw.monthlyRevenue ?? 0),
        rating: raw.rating != null ? Number(raw.rating) : undefined,
        image: typeof raw.image === "string" && raw.image ? raw.image : undefined,
        tags: Array.isArray(raw.tags) ? raw.tags.map(String) : [],
        status: statusFor(units, occupied),
        constructionYear: optionalNumber(raw.constructionYear),
        reraNumber: typeof raw.reraNumber === "string" ? raw.reraNumber : undefined,
        landmark: typeof raw.landmark === "string" ? raw.landmark : undefined,
        carpetArea: optionalNumber(raw.carpetArea),
        totalFloors: optionalNumber(raw.totalFloors),
        managerName: typeof raw.managerName === "string" ? raw.managerName : undefined,
        managerPhone: typeof raw.managerPhone === "string" ? raw.managerPhone : undefined,
        description: typeof raw.description === "string" ? raw.description : undefined,
    };
}

// ---------- Form helpers ----------

// Property -> form text (used when you click Edit).
export function toForm(property: Property): FormState {
    return {
        name: property.name,
        location: property.location,
        type: property.type,
        units: String(property.units),
        occupied: String(property.occupied),
        rent: String(property.rent),
        image: property.image ?? "",
        tags: property.tags.join(", "),
    };
}

// Checks the form. Returns an object with one message per wrong field.
// An empty object {} means everything is fine.
export function validateForm(form: FormState): FormErrors {
    const errors: FormErrors = {};

    const units = Number(form.units);
    const occupied = Number(form.occupied);
    const rent = Number(form.rent);

    if (form.name.trim() === "") {
        errors.name = "Please enter the property name";
    }

    if (form.location.trim() === "") {
        errors.location = "Please enter the location";
    }

    if (form.type.trim() === "") {
        errors.type = "Please enter or select a property type";
    }

    if (!Number.isInteger(units) || units < 1) {
        errors.units = "Enter at least 1 unit";
    }

    if (!Number.isInteger(occupied) || occupied < 0) {
        errors.occupied = "Enter 0 or more";
    } else if (occupied > units) {
        errors.occupied = "Cannot be more than total units";
    }

    if (form.rent.trim() === "" || Number.isNaN(rent) || rent < 0) {
        errors.rent = "Enter a valid rent amount";
    }

    const image = form.image.trim();
    if (
        image !== "" &&
        !image.startsWith("http://") &&
        !image.startsWith("https://") &&
        !image.startsWith("data:image/")
    ) {
        errors.image = "Must be a valid photo link or uploaded file";
    }

    return errors;
}

// Form text -> a clean object we can send to the backend.
export function toPayload(form: FormState): BasePropertyPayload {
    const units = Number(form.units);
    const occupied = Number(form.occupied);
    return {
        name: form.name.trim(),
        location: form.location.trim(),
        type: form.type,
        units,
        occupied,
        rent: Number(form.rent),
        image: form.image.trim() || undefined,
        status: statusFor(units, occupied),
        // "pool, gym" -> ["pool", "gym"]
        tags: form.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter((tag) => tag !== ""),
    };
}