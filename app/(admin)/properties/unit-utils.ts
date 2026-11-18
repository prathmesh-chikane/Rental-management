// =============================================================================
// app/(admin)/properties/unit-utils.ts
// Helpers for the individual units (flats / shops) of a property: A-101, A-102, B-101 ...
// Nothing in this file draws anything on screen.
// =============================================================================

export type UnitStatus = "Vacant" | "Occupied" | "Maintenance";
export type StoredUnitStatus = "vacant" | "occupied" | "maintenance";

export const UNIT_TYPES = ["Studio", "1 BHK", "2 BHK", "3 BHK", "4 BHK", "Shop", "Office", "Other"] as const;

// One unit as the form keeps it.
export interface UnitDraft {
    unitNumber: string; // "A-101"
    wing: string; // "A"
    floor: number; // 1
    type: string; // "2 BHK"
    status: UnitStatus;
    rentAmount: number;
    depositAmount: number;
    hasTenant: boolean; // true = a tenant lives here; this unit cannot be removed or switched
}

export type UnitPayload = Pick<
    UnitDraft,
    "unitNumber" | "wing" | "floor" | "type" | "rentAmount" | "depositAmount"
> & { status: StoredUnitStatus };

// What the user types in the "Generate units" box (all text, like every <input>).
export interface GeneratorInput {
    wings: string; // "A, B"  (empty = building without wings)
    floors: string; // how many floors
    perFloor: string; // flats on each floor
    startFloor: string; // first floor number (1 = A-101, 0 = A-001)
    type: string; // unit type for all generated units (optional)
    rentAmount: string;
    depositAmount: string;
}

export const EMPTY_GENERATOR: GeneratorInput = {
    wings: "A",
    floors: "4",
    perFloor: "4",
    startFloor: "1",
    type: "",
    rentAmount: "0",
    depositAmount: "0",
};

// "a-101 " -> "A-101". Used everywhere so "a-101" and "A-101" count as the same unit.
export function normalizeUnitNumber(value: string): string {
    return value.trim().toUpperCase();
}

// Letters, numbers, - and / only (same rule as the backend).
export function isValidUnitNumber(value: string): boolean {
    const number = value.trim();
    return /^[A-Za-z0-9][A-Za-z0-9 /-]{0,19}$/.test(number) && !/ {2,}/.test(number);
}

// "A, b ,B" -> ["A", "B"]. Empty text -> [""] (one group without a wing).
export function parseWings(text: string): string[] {
    const wings = text
        .split(",")
        .map((w) => w.trim().toUpperCase())
        .filter(Boolean);
    const unique = [...new Set(wings)];
    return unique.length > 0 ? unique : [""];
}

// wing "A", floor 1, flat 2  ->  "A-102"      (no wing -> "102")
export function makeUnitNumber(wing: string, floor: number, flat: number): string {
    const code = `${floor}${String(flat).padStart(2, "0")}`;
    return wing ? `${wing}-${code}` : code;
}

function wholeBetween(value: string, min: number, max: number): number | null {
    const n = Number(value);
    if (value.trim() === "" || !Number.isInteger(n) || n < min || n > max) return null;
    return n;
}

// Builds the list of units from the generator box.
export function generateUnits(input: GeneratorInput): { units: UnitDraft[]; error: string } {
    const wings = parseWings(input.wings);
    const wingBad = wings.find((w) => w !== "" && !/^[A-Z0-9]{1,5}$/.test(w));
    if (wingBad) return { units: [], error: `Wing "${wingBad}" is not valid (use letters or numbers, max 5)` };

    const floors = wholeBetween(input.floors, 1, 60);
    if (floors === null) return { units: [], error: "Floors must be a number from 1 to 60" };

    const perFloor = wholeBetween(input.perFloor, 1, 99);
    if (perFloor === null) return { units: [], error: "Flats per floor must be a number from 1 to 99" };

    const startFloor = wholeBetween(input.startFloor, 0, 99);
    if (startFloor === null) return { units: [], error: "First floor must be a number from 0 to 99" };

    const rentAmount = Number(input.rentAmount);
    if (input.rentAmount.trim() === "" || !Number.isFinite(rentAmount) || rentAmount < 0) {
        return { units: [], error: "Rent per unit must be 0 or more" };
    }

    const depositAmount = Number(input.depositAmount);
    if (input.depositAmount.trim() === "" || !Number.isFinite(depositAmount) || depositAmount < 0) {
        return { units: [], error: "Deposit per unit must be 0 or more" };
    }

    if (wings.length * floors * perFloor > 2000) {
        return { units: [], error: "That makes more than 2000 units. Please reduce wings, floors or flats." };
    }

    const units: UnitDraft[] = [];
    for (const wing of wings) {
        for (let f = 0; f < floors; f++) {
            const floor = startFloor + f;
            for (let flat = 1; flat <= perFloor; flat++) {
                units.push({
                    unitNumber: makeUnitNumber(wing, floor, flat),
                    wing,
                    floor,
                    type: input.type,
                    status: "Vacant",
                    rentAmount,
                    depositAmount,
                    hasTenant: false,
                });
            }
        }
    }
    return { units, error: "" };
}

// Adds new units to the existing list. A number that already exists is skipped (never duplicated).
export function mergeUnits(
    existing: UnitDraft[],
    incoming: UnitDraft[],
): { merged: UnitDraft[]; added: number; skipped: number } {
    const taken = new Set(existing.map((u) => normalizeUnitNumber(u.unitNumber)));
    const merged = [...existing];
    let skipped = 0;

    for (const unit of incoming) {
        const key = normalizeUnitNumber(unit.unitNumber);
        if (taken.has(key)) {
            skipped++;
        } else {
            taken.add(key);
            merged.push({ ...unit, unitNumber: key });
        }
    }
    return { merged, added: merged.length - existing.length, skipped };
}

// Returns every number that appears more than once.
export function findDuplicateNumbers(units: UnitDraft[]): string[] {
    const seen = new Set<string>();
    const duplicates = new Set<string>();
    for (const unit of units) {
        const key = normalizeUnitNumber(unit.unitNumber);
        if (seen.has(key)) duplicates.add(key);
        seen.add(key);
    }
    return [...duplicates];
}

export function countOccupied(units: UnitDraft[]): number {
    return units.filter((u) => u.status === "Occupied").length;
}

// Natural order: A-101, A-102, A-201, B-101 ...
export function sortUnits(units: UnitDraft[]): UnitDraft[] {
    return [...units].sort(
        (a, b) => a.wing.localeCompare(b.wing) || a.floor - b.floor || a.unitNumber.localeCompare(b.unitNumber, undefined, { numeric: true }),
    );
}

// Turns whatever the backend sends into a clean UnitDraft.
export function unitFromApi(data: unknown): UnitDraft {
    const raw = (data ?? {}) as Record<string, unknown>;
    const status = String(raw.status ?? "vacant").toLowerCase();
    const rentAmount = Number(raw.rentAmount ?? 0);
    const depositAmount = Number(raw.depositAmount ?? 0);
    return {
        unitNumber: normalizeUnitNumber(String(raw.unitNumber ?? "")),
        wing: String(raw.wing ?? ""),
        floor: Number(raw.floor ?? 0) || 0,
        type: String(raw.type ?? ""),
        status: status === "occupied" ? "Occupied" : status === "maintenance" ? "Maintenance" : "Vacant",
        rentAmount: Number.isFinite(rentAmount) && rentAmount >= 0 ? rentAmount : 0,
        depositAmount: Number.isFinite(depositAmount) && depositAmount >= 0 ? depositAmount : 0,
        hasTenant: Boolean(raw.tenantId),
    };
}

export function storedStatus(status: UnitStatus): StoredUnitStatus {
    if (status === "Occupied") return "occupied";
    if (status === "Maintenance") return "maintenance";
    return "vacant";
}