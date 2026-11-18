// =============================================================================
// Extra property fields retained by the property form.
// =============================================================================

export const QUICK_AMENITIES = [
    "Lift", "Power Backup", "24x7 Security", "CCTV", "Gym", "Swimming Pool", "Garden",
    "Children Play Area", "Clubhouse", "Water Supply 24x7", "Intercom", "Fire Safety",
] as const;

export interface ExtraState {
    constructionYear: string;
    reraNumber: string;
    landmark: string;
    carpetArea: string;
    totalFloors: string;
    managerName: string;
    managerPhone: string;
    description: string;
}

export interface ExtraPayload {
    constructionYear?: number;
    reraNumber?: string;
    landmark?: string;
    carpetArea?: number;
    totalFloors?: number;
    managerName?: string;
    managerPhone?: string;
    description?: string;
}

export const EMPTY_EXTRA: ExtraState = {
    constructionYear: "",
    reraNumber: "",
    landmark: "",
    carpetArea: "",
    totalFloors: "",
    managerName: "",
    managerPhone: "",
    description: "",
};

function text(value: unknown): string {
    return value == null ? "" : String(value);
}

export function extraFromProperty(property: unknown): ExtraState {
    const raw = (property ?? {}) as Record<string, unknown>;
    return {
        constructionYear: text(raw.constructionYear),
        reraNumber: text(raw.reraNumber),
        landmark: text(raw.landmark),
        carpetArea: text(raw.carpetArea),
        totalFloors: text(raw.totalFloors),
        managerName: text(raw.managerName),
        managerPhone: text(raw.managerPhone),
        description: text(raw.description),
    };
}

export function cleanPhone(value: string): string {
    const digits = value.replace(/\D/g, "");
    if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
    if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
    return digits;
}

export function extraToPayload(extra: ExtraState): ExtraPayload {
    const optionalNumber = (value: string): number | undefined =>
        value.trim() === "" ? undefined : Number(value);
    const optionalText = (value: string): string | undefined => value.trim() || undefined;

    return {
        constructionYear: optionalNumber(extra.constructionYear),
        reraNumber: optionalText(extra.reraNumber.toUpperCase()),
        landmark: optionalText(extra.landmark),
        carpetArea: optionalNumber(extra.carpetArea),
        totalFloors: optionalNumber(extra.totalFloors),
        managerName: optionalText(extra.managerName),
        managerPhone: extra.managerPhone.trim() ? cleanPhone(extra.managerPhone) : undefined,
        description: optionalText(extra.description),
    };
}
