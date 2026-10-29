export default function StatCard({
  title,
  value,
}: {
  title: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-slate-300 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-medium text-slate-500">{title}</h3>
      <p className="mt-3 text-3xl font-bold tracking-tight text-slate-800">
        ₹{value.toLocaleString("en-IN")}
      </p>
    </div>
  );
}
