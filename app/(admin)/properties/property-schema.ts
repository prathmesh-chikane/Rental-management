// =============================================================================
// app/(admin)/properties/property-schema.ts
// Zod validation for the 3 data-entry steps of the Property form.
// The form keeps everything as text (what <input> gives us), so every rule here
// reads text. One schema per step. Nothing in this file draws anything on screen.
//
// Install once:   npm install zod
// =============================================================================

import { z } from "zod";
import { cleanPhone, type ExtraState } from "./property-extra";
import type { FormState } from "./property-utils";
import { findDuplicateNumbers, type UnitDraft } from "./unit-utils";

// One message per invalid form field.
export type StepErrors = Record<string, string | undefined>;

const thisYear = new Date().getFullYear();

// ---------- Small reusable rules ----------

// Whole number between min and max. Empty text IS allowed (optional field).
const optionalWhole = (min: number, max: number, message: string) =>
    z
        .string()
        .trim()
        .refine((v) => v === "" || (Number.isInteger(Number(v)) && Number(v) >= min && Number(v) <= max), message);

// Any number from min to max (decimals allowed). Empty text is NOT allowed.
const requiredNumber = (min: number, max: number, message: string) =>
    z
        .string()
        .trim()
        .refine((v) => v !== "" && !Number.isNaN(Number(v)) && Number(v) >= min && Number(v) <= max, message);

// ---------- STEP 1: Basic Details & Location ----------

export const step1Schema = z.object({
    name: z.string().trim().min(1, "Please enter the property name").min(3, "Name must be at least 3 characters"),
    location: z.string().trim().min(1, "Please enter the location"),
    type: z.string().min(1, "Select the property type"),
    constructionYear: optionalWhole(1900, thisYear + 5, `Enter a year between 1900 and ${thisYear + 5}`),
    reraNumber: z
        .string()
        .trim()
        .refine((v) => v === "" || /^[A-Za-z0-9/-]{6,30}$/.test(v), "RERA number looks wrong (letters, digits, / and - only)"),
    landmark: z.string(),
});

// ---------- STEP 2: Unit inventory and rent ----------

// One unit (A-101). The same number can never be used twice in the same property.
const unitDraftSchema = z.object({
    unitNumber: z
        .string()
        .trim()
        .regex(
            /^(?!.* {2})[A-Za-z0-9][A-Za-z0-9 /-]{0,19}$/,
            "Unit number can contain letters, numbers, single spaces, - and /",
        ),
    wing: z.string(),
    floor: z.number().int().min(0),
    type: z.string(),
    status: z.enum(["Vacant", "Occupied", "Maintenance"]),
    rentAmount: z.number().min(0),
    depositAmount: z.number().min(0),
});

export const step2Schema = z
    .object({
        unitList: z
            .array(unitDraftSchema)
            .min(1, "Add at least one unit (use Generate units)")
            .max(2000, "A property can have at most 2000 units")
            .superRefine((list, ctx) => {
                const duplicates = findDuplicateNumbers(list as UnitDraft[]);
                if (duplicates.length > 0) {
                    ctx.addIssue({
                        code: "custom",
                        message: `Duplicate unit number: ${duplicates.join(", ")}`,
                    });
                }
            }),
        carpetArea: z
            .string()
            .trim()
            .refine((v) => v === "" || (!Number.isNaN(Number(v)) && Number(v) > 0), "Enter a valid area in sq ft"),
        totalFloors: optionalWhole(1, 150, "Enter floors between 1 and 150"),
        rent: requiredNumber(0, 1_000_000_000, "Enter a valid rent amount"),
    })

// ---------- STEP 3: Amenities, photo and contact ----------

export const step3Schema = z
    .object({
        // Empty, an uploaded photo ("data:image/...") or a web link are all fine.
        image: z
            .string()
            .trim()
            .refine(
                (v) => v === "" || v.startsWith("data:image/") || /^https?:\/\//i.test(v),
                "Link must start with http:// or https://",
            ),
        tags: z.string(),
        managerName: z.string().trim(),
        managerPhone: z.string().trim(),
        description: z.string().max(500, "Description can be at most 500 characters"),
    })
    // Contact name and mobile go together: if you fill one, fill the other.
    .superRefine((data, ctx) => {
        const hasName = data.managerName !== "";
        const hasPhone = data.managerPhone !== "";

        if (hasName && data.managerName.length < 3) {
            ctx.addIssue({ code: "custom", path: ["managerName"], message: "Name must be at least 3 characters" });
        }
        if (hasPhone && !/^[6-9][0-9]{9}$/.test(cleanPhone(data.managerPhone))) {
            ctx.addIssue({
                code: "custom",
                path: ["managerPhone"],
                message: "Enter a valid 10-digit mobile number (starts with 6-9)",
            });
        }
        if (hasPhone && !hasName) {
            ctx.addIssue({ code: "custom", path: ["managerName"], message: "Enter the contact person's name" });
        }
        if (hasName && !hasPhone) {
            ctx.addIssue({ code: "custom", path: ["managerPhone"], message: "Enter the contact person's mobile number" });
        }
    });

// ---------- The one function the form calls ----------

const STEP_SCHEMAS = {
    1: step1Schema,
    2: step2Schema,
    3: step3Schema,
} as const;

/**
 * Checks one step of the form with zod.
 * Returns { fieldName: "message" } - an empty object {} means the step is fine.
 * Steps without a schema (the Review step) always return {}.
 */
export function validatePropertyStep(
    step: number,
    form: FormState,
    extra: ExtraState,
    unitList: UnitDraft[],
): StepErrors {
    const schema = STEP_SCHEMAS[step as 1 | 2 | 3];
    if (!schema) return {};

    const result = schema.safeParse({ ...form, ...extra, unitList });
    if (result.success) return {};

    const errors: StepErrors = {};
    for (const issue of result.error.issues) {
        const field = String(issue.path[0] ?? "");
        // keep only the first message of each field
        if (field && !errors[field]) errors[field] = issue.message;
    }
    return errors;
}