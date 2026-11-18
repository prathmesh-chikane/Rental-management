// =============================================================================
// StatusBadge.tsx
// High-contrast, crystal-clear status pill ("Fully Leased", "Has Vacancies", "Vacant").
// =============================================================================

import { getStatus, type Property } from "./property-utils";

const STYLES = {
    "Fully Leased": {
        badge: "border-emerald-300 bg-emerald-50 text-emerald-800",
    },
    "Has Vacancies": {
        badge: "border-amber-300 bg-amber-50 text-amber-800",
    },
    Vacant: {
        badge: "border-rose-300 bg-rose-50 text-rose-800",
    },
};

type Props = {
    property: Property;
};

export default function StatusBadge({ property }: Props) {
    const status = getStatus(property);
    const style = STYLES[status];

    return (
        <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold shadow-xs select-none ${style.badge}`}
        >
            {status}
        </span>
    );
}
