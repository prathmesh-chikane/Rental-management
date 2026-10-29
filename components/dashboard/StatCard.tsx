import type { LucideIcon } from "lucide-react";

export default function StatCard({
  title,
  value,
  description,
  icon: Icon,
  iconClassName,
}: {
  title: string;
  value: number;
  description: string;
  icon: LucideIcon;
  iconClassName: string;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-medium text-slate-500">{title}</h3>

          <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            ₹{Number(value ?? 0).toLocaleString("en-IN")}
          </p>
        </div>
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClassName}`}
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
      </div>
      <p className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
        {description}
      </p>
    </article>
  );
}
