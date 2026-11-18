import { z } from "zod";

// =============================================================================
// Zod Schemas for Property Management
//
// काय करतो:
// 1. फ्रंटएंड फॉर्मवरून येणारा डेटा कडकपणे तपासून घेतो (Type Safety).
// 2. चुकीचा मोबाईल नंबर, ईमेल, किंवा रेंट असल्यास लगेच स्पष्ट एरर मेसेज देतो.
// =============================================================================

// १. भाडेकरू फॉर्म स्कीमा (Tenant Validation Schema)
export const tenantFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Full name must be at least 3 characters long")
    .max(50, "Name is too long"),
  email: z
    .string()
    .trim()
    .email("Please enter a valid email address (e.g. name@example.com)")
    .or(z.literal("")), // ईमेल ऑप्शनल पण भरल्यास व्हॅलिड असावा
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit Indian mobile number"),
  emergencyContact: z.string().trim().optional(),
  propertyName: z.string().min(1, "Please select an available property"),
  unit: z.string().trim().min(1, "Unit/Flat number is required (e.g. Flat 204)"),
  wing: z.string().trim().optional(),
  monthlyRent: z.coerce
    .number()
    .positive("Monthly rent must be greater than ₹0")
    .max(10_000_000, "Rent amount is too large"),
  securityDeposit: z.coerce.number().min(0, "Security deposit cannot be negative"),
  moveInDate: z.string().min(1, "Move-in date is required"),
  leaseEndDate: z.string().min(1, "Lease end date is required"),
  aadhaarNumber: z
    .string()
    .trim()
    .refine(
      (val) => val === "" || /^\d{12}$/.test(val.replace(/\s+/g, "")),
      "Aadhaar number must be a valid 12-digit number",
    )
    .optional(),
  policeVerification: z.enum(["Verified", "Pending", "In Progress"]).default("Pending"),
  status: z.enum(["active", "inactive"]).default("active"),
  notes: z.string().trim().max(500, "Notes cannot exceed 500 characters").optional(),
}).refine(
  (data) => {
    if (data.moveInDate && data.leaseEndDate) {
      return new Date(data.leaseEndDate) > new Date(data.moveInDate);
    }
    return true;
  },
  {
    message: "Lease end date must be after the move-in date",
    path: ["leaseEndDate"],
  },
);

export type TenantFormValues = z.infer<typeof tenantFormSchema>;

// २. प्रॉपर्टी फॉर्म स्कीमा (Property Validation Schema)
export const propertyCreateSchema = z.object({
  name: z.string().trim().min(3, "Property name must be at least 3 characters"),
  location: z.string().trim().min(2, "Location is required"),
  type: z.string().min(1, "Select property type"),
  units: z.coerce.number().int().min(1, "Building must have at least 1 unit"),
  rent: z.coerce.number().min(0, "Rent cannot be negative"),
  constructionYear: z.coerce
    .number()
    .int()
    .min(1900)
    .max(new Date().getFullYear() + 5)
    .optional(),
  reraNumber: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9/-]{6,30}$/, "Invalid RERA number format")
    .optional()
    .or(z.literal("")),
  landmark: z.string().trim().optional(),
  carpetArea: z.coerce.number().min(1).optional(),
  totalFloors: z.coerce.number().int().min(1).max(150).optional(),
  managerName: z.string().trim().optional(),
  managerPhone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Manager phone must be 10 digits")
    .optional()
    .or(z.literal("")),
  tags: z.array(z.string()).default([]),
  image: z.string().url("Must be a valid image link").optional().or(z.literal("")),
});

export type PropertyFormValues = z.infer<typeof propertyCreateSchema>;
