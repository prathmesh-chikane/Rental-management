"use client";

// =============================================================================
// app/(admin)/properties/PropertyForm.tsx
// 4-step "Add Property" / "Edit Property" wizard (real-world Indian real estate):
//   Step 1  Basic Details & Location
//   Step 2  Unit inventory and rent
//   Step 3  Amenities, Photo & Contact
//   Step 4  Review & Create
// Core fields still come from property-utils.ts; the extra fields come from
// property-extra.ts. Every step is validated with zod (property-schema.ts)
// before you can go to the next one.
// =============================================================================

import {
    useEffect,
    useRef,
    useState,
    type ChangeEvent,
    type DragEvent,
    type FormEvent,
    type ReactNode,
} from "react";
import {
    Check,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Link2,
    Loader2,
    Plus,
    UploadCloud,
    X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api-client";
import LocationMapPicker from "./LocationMapPicker";
import {
    EMPTY_FORM,
    formatRent,
    getId,
    isLocal,
    PROPERTY_TYPES,
    toForm,
    toPayload,
    type FormState,
    type Property,
    type PropertyPayload,
} from "./property-utils";
import {
    EMPTY_EXTRA,
    extraFromProperty,
    extraToPayload,
    QUICK_AMENITIES,
    type ExtraState,
} from "./property-extra";
import { validatePropertyStep } from "./property-schema";
import {
    countOccupied,
    EMPTY_GENERATOR,
    generateUnits,
    isValidUnitNumber,
    mergeUnits,
    normalizeUnitNumber,
    sortUnits,
    storedStatus,
    unitFromApi,
    UNIT_TYPES,
    type GeneratorInput,
    type UnitDraft,
    type UnitPayload,
} from "./unit-utils";

type Props = {
    editing: Property | null;
    saving: boolean;
    serverError: string;
    onSave: (payload: PropertyPayload, units: UnitPayload[]) => void;
    onClose: () => void;
};

type ErrorMap = Record<string, string | undefined>;

// ---------- Steps ----------

const STEPS = [
    { num: 1, title: "Basic & Location", desc: "Name, type, location" },
    { num: 2, title: "Units & Rent", desc: "Unit details and rent" },
    { num: 3, title: "Amenities & Media", desc: "Photo and contact" },
    { num: 4, title: "Review", desc: "Check and create" },
];

// Which fields belong to which step (used to show / clear the right errors).
const STEP_KEYS: Record<number, string[]> = {
    1: ["name", "location", "type", "constructionYear", "reraNumber", "landmark"],
    2: ["unitList", "rent", "carpetArea", "totalFloors"],
    3: ["image", "tags", "managerName", "managerPhone", "description"],
};

// ---------- Small helpers ----------

// Shows only the website name of an image link, so a long URL never stretches the popup.
function shortLink(url: string): string {
    try {
        return new URL(url).hostname;
    } catch {
        return url;
    }
}

function splitTags(tags: string): string[] {
    return tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
}

function Field(props: {
    id: string;
    label: string;
    required?: boolean;
    error?: string;
    hint?: string;
    children: ReactNode;
}) {
    return (
        <div className="min-w-0 space-y-1.5">
            <Label htmlFor={props.id} className="text-xs font-bold uppercase tracking-wider text-slate-700">
                {props.label}
                {props.required && <span className="ml-1 text-red-500">*</span>}
            </Label>
            {props.children}
            {props.hint && !props.error && <p className="text-[11px] text-slate-500">{props.hint}</p>}
            {props.error && <p className="text-xs font-semibold text-red-600">{props.error}</p>}
        </div>
    );
}

function Chip(props: { label: string; active: boolean; onClick: () => void }) {
    return (
        <button
            type="button"
            aria-pressed={props.active}
            onClick={props.onClick}
            className={`inline-flex cursor-pointer items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ${props.active
                ? "border-indigo-600 bg-indigo-600 text-white shadow-sm"
                : "border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50"
                }`}
        >
            {props.active && <Check className="h-3 w-3 stroke-[3]" />}
            {props.label}
        </button>
    );
}

function ReviewRow(props: { label: string; value: string }) {
    return (
        <div className="flex items-start justify-between gap-4 py-1.5 text-xs">
            <span className="shrink-0 font-semibold text-slate-500">{props.label}</span>
            <span className="min-w-0 break-words text-right font-bold text-slate-900">{props.value || "—"}</span>
        </div>
    );
}

function ReviewCard(props: { title: string; children: ReactNode }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="mb-1 text-xs font-black uppercase tracking-wider text-indigo-700">{props.title}</p>
            <div className="divide-y divide-slate-100">{props.children}</div>
        </div>
    );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function PropertyForm({ editing, saving, serverError, onSave, onClose }: Props) {
    const { isMobile, state: sidebarState } = useSidebar();
    const [step, setStep] = useState(1);
    const [form, setForm] = useState<FormState>(editing ? toForm(editing) : EMPTY_FORM);
    const [extra, setExtra] = useState<ExtraState>(editing ? extraFromProperty(editing) : EMPTY_EXTRA);
    const [errors, setErrors] = useState<ErrorMap>({});
    const [showUrlInput, setShowUrlInput] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [fileName, setFileName] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);
    const topRef = useRef<HTMLDivElement>(null);

    // Individual units (A-101, A-102 ...). Total and occupied counts come from this list.
    const [unitList, setUnitList] = useState<UnitDraft[]>([]);
    const unitListRef = useRef(unitList);
    const [gen, setGen] = useState<GeneratorInput>(EMPTY_GENERATOR);
    const [genMessage, setGenMessage] = useState("");
    const [genError, setGenError] = useState("");
    const [singleUnit, setSingleUnit] = useState("");

    useEffect(() => {
        unitListRef.current = unitList;
    }, [unitList]);

    useEffect(() => {
        if (!editing) return;

        const propertyId = getId(editing);
        if (isLocal(propertyId)) return;
        if (unitListRef.current.length > 0) return;

        let active = true;
        api.get<unknown[] | { data: unknown[] }>(`/properties/${propertyId}/units`)
            .then((response) => {
                if (!active) return;
                const units = Array.isArray(response) ? response : response.data ?? [];
                const loadedUnits = sortUnits(units.map(unitFromApi));
                setUnitList(loadedUnits);
                setForm((prev) => ({
                    ...prev,
                    units: String(loadedUnits.length),
                    occupied: String(countOccupied(loadedUnits)),
                    rent: String(loadedUnits.reduce((total, unit) => total + unit.rentAmount, 0)),
                }));
                setGenError("");
            })
            .catch((error: unknown) => {
                if (!active) return;
                setGenError(error instanceof Error ? `Could not load units: ${error.message}` : "Could not load units.");
            });

        return () => {
            active = false;
        };
    }, [editing]);

    // ---------- Units (A-101, A-102 ...) ----------

    // Saves the list AND keeps "total units" / "occupied" in the form in step with it.
    function applyUnitList(next: UnitDraft[]) {
        const sorted = sortUnits(next);
        setUnitList(sorted);
        setForm((prev) => ({
            ...prev,
            units: String(sorted.length),
            occupied: String(countOccupied(sorted)),
            rent: String(sorted.reduce((total, unit) => total + unit.rentAmount, 0)),
        }));
        clearError("unitList");
    }

    function handleGenerate() {
        const { units, error } = generateUnits(gen);
        setGenMessage("");
        setGenError(error);
        if (error) return;

        const { merged, added, skipped } = mergeUnits(unitList, units);
        applyUnitList(merged);
        setGenMessage(
            skipped > 0
                ? `${added} unit(s) added. ${skipped} skipped because the number already exists.`
                : `${added} unit(s) added.`,
        );
    }

    function handleAddSingleUnit() {
        const number = normalizeUnitNumber(singleUnit);
        setGenMessage("");

        if (!isValidUnitNumber(number)) {
            setGenError("Unit number can contain letters, numbers, spaces, - and / (example: Flat 101)");
            return;
        }
        if (unitList.some((u) => u.unitNumber === number)) {
            setGenError(`${number} already exists in this property. A unit number cannot be repeated.`);
            return;
        }
        const rentAmount = Number(gen.rentAmount);
        const depositAmount = Number(gen.depositAmount);
        if (
            gen.rentAmount.trim() === "" ||
            gen.depositAmount.trim() === "" ||
            !Number.isFinite(rentAmount) ||
            !Number.isFinite(depositAmount) ||
            rentAmount < 0 ||
            depositAmount < 0
        ) {
            setGenError("Rent and deposit amounts must be 0 or more.");
            return;
        }

        const dash = number.indexOf("-");
        const wing = dash > 0 ? number.slice(0, dash) : "";
        applyUnitList([
            ...unitList,
            {
                unitNumber: number,
                wing,
                floor: 0,
                type: gen.type,
                status: "Vacant",
                rentAmount,
                depositAmount,
                hasTenant: false,
            },
        ]);
        setSingleUnit("");
        setGenError("");
        setGenMessage(`${number} added.`);
    }

    // Click a unit: Vacant <-> Occupied
    function toggleUnitStatus(unitNumber: string) {
        applyUnitList(
            unitList.map((u) =>
                u.unitNumber === unitNumber && !u.hasTenant
                    ? { ...u, status: u.status === "Occupied" ? "Vacant" : "Occupied" }
                    : u,
            ),
        );
    }

    function removeUnit(unitNumber: string) {
        applyUnitList(unitList.filter((u) => u.unitNumber !== unitNumber || u.hasTenant));
    }

    // Units that have a tenant are kept
    function clearUnits() {
        applyUnitList(unitList.filter((u) => u.hasTenant));
        setGenMessage("");
        setGenError("");
    }

    function updateUnitAmount(unitNumber: string, field: "rentAmount" | "depositAmount", value: string) {
        const amount = value.trim() === "" ? 0 : Number(value);
        if (!Number.isFinite(amount) || amount < 0) {
            setGenError("Rent and deposit amounts must be 0 or more.");
            return;
        }
        setGenError("");
        applyUnitList(unitList.map((unit) => (
            unit.unitNumber === unitNumber ? { ...unit, [field]: amount } : unit
        )));
    }

    // ---------- Updating values ----------

    function clearError(name: string) {
        setErrors((prev) => ({ ...prev, [name]: undefined }));
    }

    function handleChange(event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
        const { name, value } = event.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        clearError(name);
    }

    function setExtraValue<K extends keyof ExtraState>(key: K, value: ExtraState[K]) {
        setExtra((prev) => ({ ...prev, [key]: value }));
        clearError(key);
    }

    function handleExtraChange(
        event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
    ) {
        const { name, value } = event.target;
        setExtraValue(name as keyof ExtraState, value as never);
    }

    // Amenity chips write into the same "tags" text the old form used.
    function toggleAmenity(item: string) {
        const tags = splitTags(form.tags);
        const exists = tags.some((t) => t.toLowerCase() === item.toLowerCase());
        const next = exists ? tags.filter((t) => t.toLowerCase() !== item.toLowerCase()) : [...tags, item];
        setForm((prev) => ({ ...prev, tags: next.join(", ") }));
    }

    // ---------- Photo upload ----------

    function processImageFile(file: File) {
        if (!file.type.startsWith("image/")) {
            setErrors((prev) => ({ ...prev, image: "Please select an image file (JPG, PNG, WebP)" }));
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setErrors((prev) => ({ ...prev, image: "Image size must be less than 5MB" }));
            return;
        }

        setFileName(file.name);
        const reader = new FileReader();
        reader.onload = () => {
            const dataUrl = reader.result as string;
            setForm((prev) => ({ ...prev, image: dataUrl }));
            clearError("image");
        };
        reader.readAsDataURL(file);
    }

    function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
        if (file) processImageFile(file);
    }

    function handleDragOver(e: DragEvent<HTMLDivElement>) {
        e.preventDefault();
        setIsDragging(true);
    }

    function handleDragLeave(e: DragEvent<HTMLDivElement>) {
        e.preventDefault();
        setIsDragging(false);
    }

    function handleDrop(e: DragEvent<HTMLDivElement>) {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) processImageFile(file);
    }

    function handleRemovePhoto() {
        setForm((prev) => ({ ...prev, image: "" }));
        setFileName("");
        if (fileInputRef.current) fileInputRef.current.value = "";
    }

    // ---------- Validation & step navigation ----------

    // All errors that belong to one step (empty object = step is fine).
    function stepErrors(stepNumber: number): ErrorMap {
        // zod does the checking (see property-schema.ts)
        const all: ErrorMap = validatePropertyStep(stepNumber, form, extra, unitList);
        const result: ErrorMap = {};
        (STEP_KEYS[stepNumber] ?? []).forEach((key) => {
            const message = all[key];
            if (message) result[key] = message;
        });
        return result;
    }

    // Shows the errors of one step. Returns true when the step is valid.
    function validateStep(stepNumber: number): boolean {
        const found = stepErrors(stepNumber);
        setErrors((prev) => {
            const next = { ...prev };
            (STEP_KEYS[stepNumber] ?? []).forEach((key) => delete next[key]);
            return { ...next, ...found };
        });
        return Object.keys(found).length === 0;
    }

    function scrollToTop() {
        topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function handleNext() {
        if (validateStep(step)) {
            setStep((prev) => Math.min(prev + 1, STEPS.length));
            scrollToTop();
        }
    }

    function handleBack() {
        setStep((prev) => Math.max(prev - 1, 1));
        scrollToTop();
    }

    // Clicking a step at the top: going back is free, going forward checks every step on the way.
    function goToStep(target: number) {
        if (target <= step) {
            setStep(target);
            scrollToTop();
            return;
        }
        for (let s = step; s < target; s++) {
            if (!validateStep(s)) {
                setStep(s);
                scrollToTop();
                return;
            }
        }
        setStep(target);
        scrollToTop();
    }

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        // Enter key on steps 1-3 simply means "Next".
        if (step < STEPS.length) {
            handleNext();
            return;
        }

        // Final step: check all 3 steps, jump to the first one that has a problem.
        let firstBadStep = 0;
        for (let s = 1; s <= 3; s++) {
            if (!validateStep(s) && firstBadStep === 0) firstBadStep = s;
        }
        if (firstBadStep !== 0) {
            setStep(firstBadStep);
            scrollToTop();
            return;
        }

        const unitsToSend: UnitPayload[] = unitList.map((u) => ({
            unitNumber: u.unitNumber,
            wing: u.wing,
            floor: u.floor,
            type: u.type,
            rentAmount: u.rentAmount,
            depositAmount: u.depositAmount,
            status: storedStatus(u.status),
        }));
        onSave({ ...toPayload(form), ...extraToPayload(extra) }, unitsToSend);
    }

    // ---------- Styles & derived values ----------

    const inputBaseStyle =
        "h-10 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 shadow-2xs outline-none transition-all hover:border-slate-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100";
    const inputErrorStyle = "border-red-400 focus:border-red-500 focus:ring-red-100 bg-red-50/20";
    const selectStyle =
        "h-10 w-full cursor-pointer appearance-none rounded-xl border border-slate-300 bg-white px-3.5 pr-9 text-sm font-medium text-slate-900 shadow-2xs outline-none hover:border-slate-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100";

    const inputClass = (name: string) => `${inputBaseStyle} ${errors[name] ? inputErrorStyle : ""}`;

    const parsedUnits = Number(form.units) || 0;
    const parsedOccupied = Number(form.occupied) || 0;
    const parsedRent = Number(form.rent) || 0;
    const occupancyPercent =
        parsedUnits > 0 ? Math.min(100, Math.round((parsedOccupied / parsedUnits) * 100)) : 0;
    const tagsList = splitTags(form.tags);
    function renderNumber(name: keyof ExtraState, value: string, suffix: string, placeholder: string) {
        return (
            <div className="relative">
                <input
                    id={name}
                    name={name}
                    type="number"
                    min={0}
                    value={value}
                    onChange={handleExtraChange}
                    placeholder={placeholder}
                    className={`${inputClass(name)} pr-16`}
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-500">
                    {suffix}
                </span>
            </div>
        );
    }

    // =========================================================================
    // RENDER
    // =========================================================================

    return (
        <Dialog
            open
            onOpenChange={(open) => {
                if (!open && !saving) onClose();
            }}
        >
            <DialogContent
                style={{
                    left: isMobile
                        ? undefined
                        : `calc(50% + ${sidebarState === "expanded" ? "8rem" : "0rem"})`,
                    top: isMobile ? undefined : "calc(50% + 2.5rem)",
                    maxWidth: isMobile
                        ? "calc(100vw - 2rem)"
                        : `calc(100vw - ${sidebarState === "expanded" ? "18rem" : "2rem"})`,
                    maxHeight: isMobile ? "calc(100dvh - 2rem)" : "calc(100dvh - 7rem)",
                }}
                className="grid-cols-1 overflow-y-auto overflow-x-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl sm:max-w-6xl"
            >
                <DialogHeader className="border-b border-slate-100 pb-3">
                    <DialogTitle className="text-xl font-black text-slate-950">
                        {editing ? "Edit Property" : "Add New Property"}
                    </DialogTitle>
                    <DialogDescription className="text-xs font-medium text-slate-500">
                        Step {step} of {STEPS.length} · Fields marked{" "}
                        <span className="font-bold text-red-500">*</span> are required.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} noValidate className="min-w-0 space-y-5 pt-1">
                    <div ref={topRef} />

                    {/* ---------------- Stepper ---------------- */}
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {STEPS.map((s) => {
                            const isCurrent = step === s.num;
                            const isDone = step > s.num;
                            return (
                                <button
                                    key={s.num}
                                    type="button"
                                    onClick={() => goToStep(s.num)}
                                    className={`min-w-0 cursor-pointer rounded-xl border-2 p-2.5 text-left transition-all ${isCurrent
                                        ? "border-indigo-600 bg-indigo-50/70"
                                        : isDone
                                            ? "border-emerald-300 bg-emerald-50/40"
                                            : "border-slate-200 bg-slate-50/60 opacity-70"
                                        }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <span
                                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-black ${isCurrent
                                                ? "bg-indigo-600 text-white"
                                                : isDone
                                                    ? "bg-emerald-600 text-white"
                                                    : "bg-slate-200 text-slate-700"
                                                }`}
                                        >
                                            {isDone ? <Check className="h-3.5 w-3.5 stroke-[3]" /> : s.num}
                                        </span>
                                        <span className="truncate text-xs font-extrabold text-slate-900">{s.title}</span>
                                    </div>
                                    <p className="mt-1 hidden truncate text-[11px] text-slate-500 sm:block">{s.desc}</p>
                                </button>
                            );
                        })}
                    </div>

                    {/* =====================================================
                        STEP 1 - BASIC DETAILS & LOCATION
                    ===================================================== */}
                    {step === 1 && (
                        <div className="space-y-4">
                            <Field id="name" label="Property Name" required error={errors.name}>
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    value={form.name}
                                    onChange={handleChange}
                                    placeholder="e.g. Skyline Residency"
                                    className={inputClass("name")}
                                />
                            </Field>

                            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                                <Field id="type" label="Property Type" required error={errors.type}>
                                    <div className="relative">
                                        <select
                                            id="type"
                                            name="type"
                                            value={form.type}
                                            onChange={handleChange}
                                            className={selectStyle}
                                        >
                                            {PROPERTY_TYPES.map((type) => (
                                                <option key={type} value={type}>
                                                    {type}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                                    </div>
                                </Field>

                            </div>

                            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                                <Field
                                    id="constructionYear"
                                    label="Year Built"
                                    error={errors.constructionYear}
                                    hint="Optional"
                                >
                                    <input
                                        id="constructionYear"
                                        name="constructionYear"
                                        type="number"
                                        value={extra.constructionYear}
                                        onChange={handleExtraChange}
                                        placeholder="e.g. 2018"
                                        className={inputClass("constructionYear")}
                                    />
                                </Field>

                                <Field
                                    id="reraNumber"
                                    label="RERA Registration No."
                                    error={errors.reraNumber}
                                    hint="Optional - e.g. P51700012345"
                                >
                                    <input
                                        id="reraNumber"
                                        name="reraNumber"
                                        type="text"
                                        value={extra.reraNumber}
                                        onChange={handleExtraChange}
                                        placeholder="e.g. P51700012345"
                                        className={`${inputClass("reraNumber")} uppercase`}
                                    />
                                </Field>
                            </div>

                            <div className="border-t border-slate-100 pt-4">
                                <p className="mb-3 text-xs font-black uppercase tracking-wider text-indigo-700">
                                    Location & Map
                                </p>

                                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                                    <Field
                                        id="location"
                                        label="Locality / Area"
                                        required
                                        error={errors.location}
                                        hint="Shown on the property card"
                                    >
                                        <input
                                            id="location"
                                            name="location"
                                            type="text"
                                            value={form.location}
                                            onChange={handleChange}
                                            placeholder="e.g. Koregaon Park, Pune"
                                            className={inputClass("location")}
                                        />
                                    </Field>

                                    <Field id="landmark" label="Landmark" hint="Optional - e.g. Near City Mall">
                                        <input
                                            id="landmark"
                                            name="landmark"
                                            type="text"
                                            value={extra.landmark}
                                            onChange={handleExtraChange}
                                            placeholder="Nearby landmark"
                                            className={inputBaseStyle}
                                        />
                                    </Field>
                                </div>

                                {/* Interactive Map Picker */}
                                <div className="mt-3.5">
                                    <LocationMapPicker
                                        locationValue={form.location}
                                        landmarkValue={extra.landmark}
                                        onLocationSelect={(loc, landmark) => {
                                            setForm((prev) => ({ ...prev, location: loc }));
                                            clearError("location");
                                            if (landmark) {
                                                setExtra((prev) => ({ ...prev, landmark: landmark || prev.landmark }));
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* =====================================================
                        STEP 2 - UNIT INVENTORY AND RENT
                    ===================================================== */}
                    {step === 2 && (
                        <div className="space-y-4">
                            {/* ---------- UNITS: A-101, A-102, B-101 ... ---------- */}
                            <Field
                                id="unitList"
                                label="Units (Flats / Shops)"
                                required
                                error={errors.unitList}
                                hint="Every unit gets its own number. The same number can never be used twice in one property."
                            >
                                <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3.5">
                                    <p className="text-xs font-black uppercase tracking-wider text-indigo-700">
                                        Generate units automatically
                                    </p>

                                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                        <div className="space-y-1">
                                            <label htmlFor="gen-wings" className="text-[11px] font-bold text-slate-700">
                                                Wings / Towers
                                            </label>
                                            <input
                                                id="gen-wings"
                                                type="text"
                                                value={gen.wings}
                                                onChange={(e) => setGen({ ...gen, wings: e.target.value })}
                                                placeholder="A, B"
                                                className={inputBaseStyle}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label htmlFor="gen-floors" className="text-[11px] font-bold text-slate-700">
                                                Floors
                                            </label>
                                            <input
                                                id="gen-floors"
                                                type="number"
                                                min={1}
                                                value={gen.floors}
                                                onChange={(e) => setGen({ ...gen, floors: e.target.value })}
                                                placeholder="4"
                                                className={inputBaseStyle}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label htmlFor="gen-perfloor" className="text-[11px] font-bold text-slate-700">
                                                Flats per floor
                                            </label>
                                            <input
                                                id="gen-perfloor"
                                                type="number"
                                                min={1}
                                                value={gen.perFloor}
                                                onChange={(e) => setGen({ ...gen, perFloor: e.target.value })}
                                                placeholder="4"
                                                className={inputBaseStyle}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label htmlFor="gen-start" className="text-[11px] font-bold text-slate-700">
                                                First floor no.
                                            </label>
                                            <input
                                                id="gen-start"
                                                type="number"
                                                min={0}
                                                value={gen.startFloor}
                                                onChange={(e) => setGen({ ...gen, startFloor: e.target.value })}
                                                placeholder="1"
                                                className={inputBaseStyle}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                        <div className="space-y-1">
                                            <label htmlFor="gen-type" className="text-[11px] font-bold text-slate-700">
                                                Unit type (optional)
                                            </label>
                                            <div className="relative">
                                                <select
                                                    id="gen-type"
                                                    value={gen.type}
                                                    onChange={(e) => setGen({ ...gen, type: e.target.value })}
                                                    className={selectStyle}
                                                >
                                                    <option value="">Not set</option>
                                                    {UNIT_TYPES.map((t) => (
                                                        <option key={t} value={t}>
                                                            {t}
                                                        </option>
                                                    ))}
                                                </select>
                                                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <label htmlFor="gen-rent" className="text-[11px] font-bold text-slate-700">
                                                Default rent per unit (₹)
                                            </label>
                                            <input
                                                id="gen-rent"
                                                type="number"
                                                min={0}
                                                value={gen.rentAmount}
                                                onChange={(e) => setGen({ ...gen, rentAmount: e.target.value })}
                                                className={inputBaseStyle}
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <label htmlFor="gen-deposit" className="text-[11px] font-bold text-slate-700">
                                                Default deposit per unit (₹)
                                            </label>
                                            <input
                                                id="gen-deposit"
                                                type="number"
                                                min={0}
                                                value={gen.depositAmount}
                                                onChange={(e) => setGen({ ...gen, depositAmount: e.target.value })}
                                                className={inputBaseStyle}
                                            />
                                        </div>

                                        <Button
                                            type="button"
                                            onClick={handleGenerate}
                                            className="h-10 cursor-pointer gap-1.5 rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white hover:bg-indigo-700"
                                        >
                                            <Plus className="h-4 w-4" /> Generate units
                                        </Button>
                                    </div>

                                    <p className="text-[11px] text-slate-500">
                                        Example: wings A, B + 4 floors + 4 flats = A-101 ... A-404 and B-101 ... B-404. Leave wings
                                        empty for a building without wings (101, 102 ...).
                                    </p>

                                    {/* Add one unit by hand (shops, offices, special numbers) */}
                                    <div className="flex flex-wrap items-end gap-3 border-t border-slate-200 pt-3">
                                        <div className="min-w-[140px] flex-1 space-y-1">
                                            <label htmlFor="single-unit" className="text-[11px] font-bold text-slate-700">
                                                Add one unit
                                            </label>
                                            <input
                                                id="single-unit"
                                                type="text"
                                                value={singleUnit}
                                                maxLength={20}
                                                onChange={(e) => setSingleUnit(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") {
                                                        e.preventDefault();
                                                        handleAddSingleUnit();
                                                    }
                                                }}
                                                placeholder="e.g. SHOP-1"
                                                className={`${inputBaseStyle} uppercase`}
                                            />
                                        </div>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={handleAddSingleUnit}
                                            className="h-10 cursor-pointer gap-1.5 rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 hover:bg-slate-100"
                                        >
                                            <Plus className="h-4 w-4" /> Add
                                        </Button>
                                    </div>

                                    {genError && <p className="text-xs font-semibold text-red-600">{genError}</p>}
                                    {genMessage && !genError && (
                                        <p className="text-xs font-semibold text-emerald-700">{genMessage}</p>
                                    )}
                                </div>

                                {/* The units that exist right now */}
                                <div className="mt-3 space-y-2">
                                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-slate-700">
                                        <span>
                                            {`Total ${unitList.length} · Occupied ${countOccupied(unitList)} · Vacant ${unitList.length - countOccupied(unitList)}`}
                                        </span>
                                        {unitList.length > 0 && (
                                            <button
                                                type="button"
                                                onClick={clearUnits}
                                                className="cursor-pointer text-red-600 hover:underline"
                                            >
                                                Clear all
                                            </button>
                                        )}
                                    </div>

                                    {unitList.length > 0 && (
                                        <>
                                            <div className="grid max-h-80 grid-cols-1 gap-2 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2.5 sm:grid-cols-2 lg:grid-cols-3">
                                                {unitList.map((unit) => (
                                                    <div
                                                        key={unit.unitNumber}
                                                        className={`space-y-2 rounded-lg border p-2 text-xs ${unit.status === "Occupied"
                                                            ? "border-indigo-300 bg-indigo-50/60"
                                                            : unit.status === "Maintenance"
                                                                ? "border-amber-300 bg-amber-50/60"
                                                                : "border-emerald-300 bg-emerald-50/60"
                                                            }`}
                                                    >
                                                        <div className="flex items-center justify-between gap-2">
                                                            <button
                                                                type="button"
                                                                disabled={unit.hasTenant}
                                                                title={unit.hasTenant
                                                                    ? "A tenant lives here (change it from the Tenants page)"
                                                                    : `${unit.status} - click to change`}
                                                                onClick={() => toggleUnitStatus(unit.unitNumber)}
                                                                className={`font-bold ${unit.hasTenant ? "cursor-not-allowed" : "cursor-pointer hover:underline"}`}
                                                            >
                                                                {unit.unitNumber} · {unit.status}{unit.hasTenant ? " · Tenant" : ""}
                                                            </button>
                                                            {!unit.hasTenant && (
                                                                <button
                                                                    type="button"
                                                                    title="Remove this unit"
                                                                    onClick={() => removeUnit(unit.unitNumber)}
                                                                    className="cursor-pointer rounded p-1 text-slate-500 hover:bg-red-100 hover:text-red-700"
                                                                >
                                                                    <X className="h-3 w-3" />
                                                                </button>
                                                            )}
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <label className="space-y-1 text-[10px] font-semibold text-slate-600">
                                                                Rent (₹)
                                                                <input
                                                                    id={`rent-${unit.unitNumber}`}
                                                                    type="number"
                                                                    min={0}
                                                                    value={unit.rentAmount}
                                                                    onChange={(event) => updateUnitAmount(unit.unitNumber, "rentAmount", event.target.value)}
                                                                    className="h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-900"
                                                                />
                                                            </label>
                                                            <label className="space-y-1 text-[10px] font-semibold text-slate-600">
                                                                Deposit (₹)
                                                                <input
                                                                    id={`deposit-${unit.unitNumber}`}
                                                                    type="number"
                                                                    min={0}
                                                                    value={unit.depositAmount}
                                                                    onChange={(event) => updateUnitAmount(unit.unitNumber, "depositAmount", event.target.value)}
                                                                    className="h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-900"
                                                                />
                                                            </label>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <p className="text-[11px] text-slate-500">
                                                <span className="font-bold text-emerald-700">Green</span> = Vacant,{" "}
                                                <span className="font-bold text-indigo-700">Blue</span> = Occupied. Click a unit number to
                                                switch. 👤 = a tenant lives there (locked).
                                            </p>
                                        </>
                                    )}
                                </div>
                            </Field>

                            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
                                <Field
                                    id="carpetArea"
                                    label="Avg. Carpet Area"
                                    error={errors.carpetArea}
                                    hint="Optional"
                                >
                                    {renderNumber("carpetArea", extra.carpetArea, "sq ft", "e.g. 850")}
                                </Field>

                                <Field id="totalFloors" label="Total Floors" error={errors.totalFloors} hint="Optional">
                                    {renderNumber("totalFloors", extra.totalFloors, "floors", "e.g. 12")}
                                </Field>
                            </div>

                            <div className="border-t border-slate-100 pt-4">
                                <p className="mb-3 text-xs font-black uppercase tracking-wider text-indigo-700">
                                    Rent & Lease Terms
                                </p>

                                <div className="space-y-4">
                                    <Field
                                        id="rent"
                                        label="Total Monthly Rent (₹)"
                                        required
                                        error={errors.rent}
                                        hint="Calculated from the rent amounts entered for each unit"
                                    >
                                        <input
                                            id="rent"
                                            type="number"
                                            value={form.rent}
                                            readOnly
                                            className={`${inputClass("rent")} bg-slate-50`}
                                        />
                                    </Field>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* =====================================================
                        STEP 3 - AMENITIES, PHOTO, DOCUMENTS & CONTACT
                    ===================================================== */}
                    {step === 3 && (
                        <div className="space-y-4">
                            {/* Amenities */}
                            <Field id="tags" label="Amenities" error={errors.tags} hint="Tap to select. You can also type your own below.">
                                <div className="flex flex-wrap gap-2">
                                    {QUICK_AMENITIES.map((amenity) => (
                                        <Chip
                                            key={amenity}
                                            label={amenity}
                                            active={tagsList.some((t) => t.toLowerCase() === amenity.toLowerCase())}
                                            onClick={() => toggleAmenity(amenity)}
                                        />
                                    ))}
                                </div>
                                <input
                                    id="tags"
                                    name="tags"
                                    type="text"
                                    value={form.tags}
                                    onChange={handleChange}
                                    placeholder="e.g. Swimming Pool, Gym, Playground, Lift"
                                    className={`${inputBaseStyle} mt-2`}
                                />
                            </Field>

                            {/* Photo */}
                            <Field id="photo" label="Property Photo" error={errors.image}>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="hidden"
                                    id="photo-upload-input"
                                />

                                {form.image ? (
                                    <div className="flex items-center gap-3.5 rounded-xl border border-slate-300 bg-slate-50 p-2.5">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={form.image}
                                            alt="Property preview"
                                            className="h-16 w-20 shrink-0 rounded-lg border border-slate-200 object-cover shadow-2xs"
                                        />
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-xs font-bold text-slate-900">
                                                {fileName || (form.image.startsWith("data:") ? "Uploaded Photo" : "Photo Link")}
                                            </p>
                                            <p
                                                className="truncate text-[11px] text-slate-500"
                                                title={form.image.startsWith("data:") ? undefined : form.image}
                                            >
                                                {form.image.startsWith("data:")
                                                    ? "Image loaded ready to save"
                                                    : shortLink(form.image)}
                                            </p>
                                            <div className="mt-1 flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="cursor-pointer text-xs font-bold text-indigo-700 hover:text-indigo-900 hover:underline"
                                                >
                                                    Change photo
                                                </button>
                                                <span className="text-slate-300">•</span>
                                                <button
                                                    type="button"
                                                    onClick={handleRemovePhoto}
                                                    className="cursor-pointer text-xs font-bold text-red-600 hover:text-red-800 hover:underline"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <div
                                            onDragOver={handleDragOver}
                                            onDragLeave={handleDragLeave}
                                            onDrop={handleDrop}
                                            onClick={() => fileInputRef.current?.click()}
                                            className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-4 text-center transition-all ${isDragging
                                                ? "border-indigo-600 bg-indigo-50/50"
                                                : "border-slate-300 bg-slate-50/70 hover:border-slate-400 hover:bg-slate-50"
                                                }`}
                                        >
                                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
                                                <UploadCloud className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-900">
                                                    Click to upload photo{" "}
                                                    <span className="font-normal text-slate-500">or drag & drop</span>
                                                </p>
                                                <p className="mt-0.5 text-[11px] text-slate-500">PNG, JPG, WebP up to 5MB</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between px-0.5">
                                            <button
                                                type="button"
                                                onClick={() => setShowUrlInput(!showUrlInput)}
                                                className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-indigo-700 hover:text-indigo-900 hover:underline"
                                            >
                                                <Link2 className="h-3.5 w-3.5" />
                                                {showUrlInput ? "Hide image link option" : "Or use an image web URL instead"}
                                            </button>
                                        </div>

                                        {showUrlInput && (
                                            <div className="pt-0.5">
                                                <input
                                                    id="image-url"
                                                    name="image"
                                                    type="text"
                                                    value={form.image.startsWith("data:") ? "" : form.image}
                                                    onChange={handleChange}
                                                    placeholder="Paste image link e.g. https://images.unsplash.com/..."
                                                    className={inputBaseStyle}
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}
                            </Field>

                            {/* Contact */}
                            <div className="border-t border-slate-100 pt-4">
                                <p className="mb-3 text-xs font-black uppercase tracking-wider text-indigo-700">
                                    Manager / Caretaker Contact
                                </p>
                                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                                    <Field id="managerName" label="Contact Person" error={errors.managerName} hint="Optional">
                                        <input
                                            id="managerName"
                                            name="managerName"
                                            type="text"
                                            value={extra.managerName}
                                            onChange={handleExtraChange}
                                            placeholder="e.g. Ramesh Patil"
                                            className={inputClass("managerName")}
                                        />
                                    </Field>

                                    <Field id="managerPhone" label="Mobile Number" error={errors.managerPhone} hint="Optional">
                                        <input
                                            id="managerPhone"
                                            name="managerPhone"
                                            type="text"
                                            inputMode="tel"
                                            maxLength={15}
                                            value={extra.managerPhone}
                                            onChange={handleExtraChange}
                                            placeholder="e.g. 98765 43210"
                                            className={inputClass("managerPhone")}
                                        />
                                    </Field>
                                </div>
                            </div>

                            {/* Description */}
                            <Field id="description" label="Description" error={errors.description}>
                                <textarea
                                    id="description"
                                    name="description"
                                    rows={3}
                                    value={extra.description}
                                    onChange={handleExtraChange}
                                    placeholder="Short note about the property, nearby facilities, rules..."
                                    className={`w-full rounded-xl border bg-white p-3.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 ${errors.description ? "border-red-400" : "border-slate-300 hover:border-slate-400"
                                        }`}
                                />
                                <p className="text-right text-[11px] text-slate-500">{extra.description.length} / 500</p>
                            </Field>
                        </div>
                    )}

                    {/* =====================================================
                        STEP 4 - REVIEW
                    ===================================================== */}
                    {step === 4 && (
                        <div className="space-y-3.5">
                            {/* Live card preview */}
                            <div className="space-y-2.5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                        Card Preview
                                    </span>
                                    <span className="rounded-md border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-xs font-extrabold text-indigo-700">
                                        {form.type}
                                    </span>
                                </div>

                                <div className="flex items-start gap-3">
                                    {form.image && (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={form.image}
                                            alt="Thumbnail"
                                            className="h-12 w-14 shrink-0 rounded-lg border border-slate-300 object-cover"
                                        />
                                    )}
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="truncate text-base font-bold text-slate-950">
                                                {form.name.trim() || "Untitled Property"}
                                            </p>
                                            <p className="shrink-0 text-base font-extrabold tabular-nums text-slate-950">
                                                {parsedRent > 0 ? formatRent(parsedRent) : "₹0"}{" "}
                                                <span className="text-xs font-normal text-slate-500">/ mo</span>
                                            </p>
                                        </div>
                                        <p className="mt-0.5 truncate text-xs text-slate-600">
                                            {form.location.trim() || "Location not set"}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                                        <span>
                                            {parsedOccupied} of {parsedUnits} units occupied
                                        </span>
                                        <span className="font-bold text-slate-900">{occupancyPercent}%</span>
                                    </div>
                                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                                        <div
                                            className="h-full rounded-full bg-indigo-600 transition-all duration-300"
                                            style={{ width: `${occupancyPercent}%` }}
                                        />
                                    </div>
                                </div>

                                {tagsList.length > 0 && (
                                    <div className="flex flex-wrap items-center gap-1 pt-1">
                                        {tagsList.map((tag) => (
                                            <span
                                                key={tag}
                                                className="rounded-md border border-slate-300 bg-white px-2 py-0.5 text-xs font-semibold text-slate-800"
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <ReviewCard title="Basic & Location">
                                <ReviewRow label="Property" value={form.name} />
                                <ReviewRow label="Type" value={form.type} />
                                <ReviewRow label="Year Built" value={extra.constructionYear} />
                                <ReviewRow label="RERA No." value={extra.reraNumber.toUpperCase()} />
                                <ReviewRow label="Location" value={[form.location, extra.landmark].filter(Boolean).join(", ")} />
                            </ReviewCard>

                            <ReviewCard title="Units & Rent">
                                <ReviewRow
                                    label="Units"
                                    value={`${unitList.length} total (${unitList.slice(0, 3).map((u) => u.unitNumber).join(", ")}${unitList.length > 3 ? " ..." : ""}) · ${parsedOccupied} occupied`}
                                />
                                <ReviewRow label="Carpet Area" value={extra.carpetArea ? `${extra.carpetArea} sq ft` : ""} />
                                <ReviewRow label="Floors" value={extra.totalFloors} />
                                <ReviewRow label="Monthly Rent" value={parsedRent > 0 ? formatRent(parsedRent) : "₹0"} />
                                {unitList.slice(0, 4).map((unit) => (
                                    <ReviewRow
                                        key={unit.unitNumber}
                                        label={`${unit.unitNumber} rent / deposit`}
                                        value={`₹${unit.rentAmount.toLocaleString("en-IN")} / ₹${unit.depositAmount.toLocaleString("en-IN")}`}
                                    />
                                ))}
                            </ReviewCard>

                            <ReviewCard title="Contact & Description">
                                <ReviewRow
                                    label="Contact"
                                    value={
                                        extra.managerName
                                            ? `${extra.managerName} · ${extra.managerPhone}`
                                            : ""
                                    }
                                />
                                {extra.description.trim() && (
                                    <ReviewRow label="Description" value={extra.description.trim()} />
                                )}
                            </ReviewCard>

                        </div>
                    )}

                    {/* Server error banner */}
                    {serverError && (
                        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-700">
                            {serverError}
                        </div>
                    )}

                    {/* Step has errors summary */}
                    {step < STEPS.length && Object.values(errors).some(Boolean) && (
                        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-700">
                            Please fix the highlighted fields to continue.
                        </div>
                    )}

                    <DialogFooter className="gap-2 border-t border-slate-100 pt-3 sm:gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={saving}
                            className="h-10 cursor-pointer rounded-xl border border-slate-300 bg-white px-5 text-sm font-bold text-slate-700 hover:bg-slate-100"
                        >
                            Cancel
                        </Button>

                        {step > 1 && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleBack}
                                disabled={saving}
                                className="h-10 cursor-pointer gap-1.5 rounded-xl border border-slate-300 bg-white px-5 text-sm font-bold text-slate-700 hover:bg-slate-100"
                            >
                                <ChevronLeft className="h-4 w-4" /> Back
                            </Button>
                        )}

                        {step < STEPS.length ? (
                            <Button
                                type="submit"
                                className="h-10 cursor-pointer gap-1.5 rounded-xl bg-indigo-600 px-6 text-sm font-bold text-white shadow-sm transition-colors hover:bg-indigo-700"
                            >
                                Next <ChevronRight className="h-4 w-4" />
                            </Button>
                        ) : (
                            <Button
                                type="submit"
                                disabled={saving}
                                className="h-10 cursor-pointer gap-2 rounded-xl bg-emerald-600 px-6 text-sm font-bold text-white shadow-sm transition-colors hover:bg-emerald-700"
                            >
                                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                                {saving ? "Saving..." : editing ? "Update Property" : "Create Property"}
                            </Button>
                        )}
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}